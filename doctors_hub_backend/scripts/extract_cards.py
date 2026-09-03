#!/usr/bin/env python3
"""
Batch Doctor Profile Extractor from Visiting Cards & Brochures using Google Gemini API.

Compatible with Gemini Free Tier (15 requests/min, 1500 requests/day).
Extracts structured JSON matching Doctors Hub backend database models.
"""

import os
import sys
import json
import time
import argparse
from pathlib import Path
from typing import Optional, Dict, Any

# Ensure pillow is available
try:
    from PIL import Image
except ImportError:
    print("Error: Pillow is required. Install it using: pip install Pillow")
    sys.exit(1)

# Support modern google-genai or legacy google-generativeai
USE_NEW_SDK = False
try:
    from google import genai
    from google.genai import types
    USE_NEW_SDK = True
except ImportError:
    try:
        import google.generativeai as genai
        USE_NEW_SDK = False
    except ImportError:
        print(
            "Error: Gemini SDK not found.\n"
            "Please install the official Google Gemini SDK by running:\n"
            "    pip install google-genai\n"
            "or:\n"
            "    pip install google-generativeai"
        )
        sys.exit(1)

SYSTEM_PROMPT = """You are an expert medical data extraction assistant specializing in Bangladeshi doctor visiting cards, prescription pads, and hospital brochures.
Analyze the provided image of a doctor visiting card or hospital brochure and extract the information into the EXACT JSON schema specified below.

Extraction Guidelines:
1. Doctor Name: Include full name with titles if present (e.g. "Prof. Dr. Mohammad Ali").
2. BMDC Number: Look for BMDC Reg. No (e.g. "A-12345"). If not mentioned on the card, set to null (DO NOT make one up).
3. Qualification: All academic degrees, fellowships, and diplomas (e.g. "MBBS, FCPS (Medicine), MD (Cardiology), MACP (USA)").
4. Experience: If years or seniority (e.g. "Senior Consultant", "15 years") are stated, include it; otherwise default to "Consultant" or "Experienced".
5. Description: Include current workplace or academic designation (e.g. "Professor & Head of Department of Cardiology, Dhaka Medical College & Hospital").
6. Specialties: Array of standard medical specialty categories (e.g. ["Cardiology", "Medicine", "Interventional Cardiology"]).
7. Affiliations: A doctor can sit in a HOSPITAL, a DIAGNOSTIC CENTER, or a private CHAMBER. Many doctors sit in MULTIPLE places. Extract EACH facility where the doctor sits as a separate object in the 'affiliations' array:
   - facility_name: Official name of the facility (e.g. "Square Hospital", "Popular Diagnostic Centre", "Dr. Mohammad Ali Private Chamber").
   - branch: Branch or location name (e.g. "Dhanmondi Branch", "Uttara Branch", "Main Campus").
   - location_type: Determine whether this location is:
     * "hospital" -> Hospitals, medical colleges, healthcare institutes (e.g., Square Hospital, Evercare, United, DMCH, Apollo, Labaid Specialized Hospital).
     * "diagnostic_center" -> Diagnostic centers, consultation centers, pathology labs (e.g., Popular Diagnostic Centre, Ibn Sina Diagnostic, Medinova).
     * "chamber" -> Personal doctor chambers, private consultation rooms, pharmacy chambers (e.g., "Private Chamber", "City Chamber", or personal address).
   - address_line: Street address or room/floor number (e.g. "Room 304, House 16, Road 2").
   - area: Neighborhood / Thana (e.g. "Dhanmondi", "Uttara", "Mirpur", "Gulshan").
   - district: District name (e.g. "Dhaka", "Chittagong", "Sylhet"). Default to "Dhaka" if not specified.
   - division: Division name (e.g. "Dhaka", "Chittagong", "Sylhet").
   - phone: Chamber serial, appointment, or reception contact number(s).
   - fee: Consultation fee if stated (number, e.g. 1000). If not stated, set to null.
   - schedules: Array of visiting slots for this specific location:
     - day_of_week: MUST be one of: "Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday".
       Convert ranges like "Sat - Wed" into individual day objects.
     - start_time: 24-hour time "HH:MM" (e.g. "17:00" for 5:00 PM).
     - end_time: 24-hour time "HH:MM" (e.g. "21:00" for 9:00 PM). If only start time is mentioned (e.g. "From 5 PM"), set end_time 3 hours later ("20:00").

Return ONLY valid JSON matching this structure (no markdown fences, no explanatory text):
{
  "name": "Prof. Dr. Firstname Lastname",
  "bmdc_number": "A-12345",
  "qualification": "MBBS, FCPS (Medicine)",
  "experience": "15+ Years",
  "description": "Professor of Medicine, Dhaka Medical College",
  "specialties": ["Medicine"],
  "is_verified": true,
  "affiliations": [
    {
      "facility_name": "Popular Diagnostic Centre",
      "branch": "Dhanmondi",
      "location_type": "diagnostic_center",
      "address_line": "House 16, Road 2, Dhanmondi, Dhaka",
      "area": "Dhanmondi",
      "district": "Dhaka",
      "division": "Dhaka",
      "phone": "01711000000",
      "fee": 1000,
      "schedules": [
        {
          "day_of_week": "Saturday",
          "start_time": "17:00",
          "end_time": "20:00"
        }
      ]
    }
  ]
}
"""


def extract_with_new_sdk(client, image_path: Path) -> Optional[Dict[str, Any]]:
    """Extract using google-genai SDK (v1.0+)."""
    with Image.open(image_path) as img:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[img, SYSTEM_PROMPT],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1,
            )
        )
        text = response.text.strip()
        return parse_json_response(text)


def extract_with_legacy_sdk(model, image_path: Path) -> Optional[Dict[str, Any]]:
    """Extract using google-generativeai SDK."""
    with Image.open(image_path) as img:
        response = model.generate_content(
            [img, SYSTEM_PROMPT],
            generation_config={"temperature": 0.1}
        )
        text = response.text.strip()
        return parse_json_response(text)


def parse_json_response(text: str) -> Optional[Dict[str, Any]]:
    """Clean markdown code fences if any and parse JSON."""
    if text.startswith("```"):
        lines = text.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        print(f"  [!] JSON Parse Error: {e}")
        return None


def main():
    parser = argparse.ArgumentParser(description="Batch extract doctor profiles from visiting card images via Gemini API.")
    parser.add_argument("--input-dir", "-i", default="data/raw_cards", help="Directory containing visiting card images")
    parser.add_argument("--output", "-o", default="data/doctors_extracted.json", help="Output JSON file path")
    parser.add_argument("--delay", "-d", type=float, default=4.2, help="Delay in seconds between requests (default 4.2s for free tier 15 RPM limit)")
    parser.add_argument("--limit", "-l", type=int, default=None, help="Limit number of images to process (useful for testing)")
    parser.add_argument("--api-key", help="Gemini API Key (optional, defaults to GEMINI_API_KEY environment variable)")
    args = parser.parse_args()

    api_key = args.api_key or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("=" * 70)
        print("ERROR: GEMINI_API_KEY is missing!")
        print("You can get a 100% FREE Gemini API key from:")
        print("    https://aistudio.google.com/app/apikey")
        print("\nThen export it in your terminal:")
        print("    export GEMINI_API_KEY='your_api_key_here'")
        print("or pass it as an argument:")
        print("    python extract_cards.py --api-key='your_api_key_here'")
        print("=" * 70)
        sys.exit(1)

    input_dir = Path(args.input_dir)
    if not input_dir.exists():
        print(f"Error: Input directory '{input_dir}' does not exist.")
        print(f"Please create it and put your photos in it: mkdir -p {input_dir}")
        sys.exit(1)

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Checkpoint tracking
    checkpoint_file = output_path.parent / "processed_files.txt"
    processed_set = set()
    if checkpoint_file.exists():
        with open(checkpoint_file, "r", encoding="utf-8") as f:
            processed_set = set(line.strip() for line in f if line.strip())

    existing_doctors = []
    if output_path.exists():
        try:
            with open(output_path, "r", encoding="utf-8") as f:
                existing_doctors = json.load(f)
        except Exception:
            existing_doctors = []

    # Find all supported images
    supported_exts = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
    all_files = sorted([f for f in input_dir.iterdir() if f.is_file() and f.suffix.lower() in supported_exts])

    # Filter out already processed
    files_to_process = [f for f in all_files if f.name not in processed_set]

    if args.limit:
        files_to_process = files_to_process[:args.limit]

    print(f"Found {len(all_files)} total images.")
    print(f"Already processed: {len(processed_set)} images.")
    print(f"To process in this run: {len(files_to_process)} images.")
    print(f"Rate throttle: {args.delay}s per image (~{int(60/args.delay)} requests/min)")
    print("-" * 50)

    if not files_to_process:
        print("All images in input directory have already been processed!")
        return

    # Initialize SDK
    if USE_NEW_SDK:
        client = genai.Client(api_key=api_key)
    else:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")

    successful_count = 0
    failed_files = []

    try:
        for idx, file_path in enumerate(files_to_process, 1):
            print(f"[{idx}/{len(files_to_process)}] Processing: {file_path.name} ...", end="", flush=True)

            extracted_data = None
            max_retries = 3
            backoff = 6

            for attempt in range(max_retries):
                try:
                    if USE_NEW_SDK:
                        extracted_data = extract_with_new_sdk(client, file_path)
                    else:
                        extracted_data = extract_with_legacy_sdk(model, file_path)
                    break
                except Exception as e:
                    err_msg = str(e)
                    if "429" in err_msg or "quota" in err_msg.lower():
                        print(f"\n  [Rate Limit] Waiting {backoff}s before retry...", end="", flush=True)
                        time.sleep(backoff)
                        backoff *= 2
                    else:
                        print(f" Error: {e}")
                        break

            if extracted_data and isinstance(extracted_data, dict) and extracted_data.get("name"):
                extracted_data["_source_image"] = file_path.name
                existing_doctors.append(extracted_data)
                successful_count += 1
                print(f" OK -> {extracted_data.get('name')}")

                # Save incremental output and update checkpoint
                with open(output_path, "w", encoding="utf-8") as f:
                    json.dump(existing_doctors, f, indent=2, ensure_ascii=False)

                with open(checkpoint_file, "a", encoding="utf-8") as f:
                    f.write(f"{file_path.name}\n")
            else:
                print(" FAILED")
                failed_files.append(file_path.name)

            # Throttle to stay within free tier limits
            if idx < len(files_to_process):
                time.sleep(args.delay)

    except KeyboardInterrupt:
        print("\n[!] Process interrupted by user. Partial progress is saved safely!")

    print("=" * 50)
    print(f"Finished! Successfully extracted: {successful_count} doctors.")
    print(f"Total doctors in '{output_path}': {len(existing_doctors)}")
    if failed_files:
        print(f"Failed images ({len(failed_files)}): {', '.join(failed_files)}")
        with open(output_path.parent / "failed_files.txt", "w", encoding="utf-8") as f:
            f.write("\n".join(failed_files))


if __name__ == "__main__":
    main()
