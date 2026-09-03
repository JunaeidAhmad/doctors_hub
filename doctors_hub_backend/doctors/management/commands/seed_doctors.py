import json
import uuid
from decimal import Decimal
from datetime import datetime, time
from pathlib import Path
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from doctors.models import Doctor, DoctorSpecialty, DoctorAffiliation, AffiliationSchedule
from facilities.models import Location, Hospital, DiagnosticCenter, Chamber


VALID_DAYS = {
    'monday': 'Monday',
    'tuesday': 'Tuesday',
    'wednesday': 'Wednesday',
    'thursday': 'Thursday',
    'friday': 'Friday',
    'saturday': 'Saturday',
    'sunday': 'Sunday',
}

SPECIALTY_ICON_MAP = {
    "cardiology": "Heart",
    "neurology": "Brain",
    "medicine": "Stethoscope",
    "pediatrics": "Baby",
    "gynecology": "Users",
    "dermatology": "Activity",
    "orthopedics": "Bone",
    "ophthalmology": "Eye",
    "ent": "Headphones",
    "psychiatry": "Smile",
    "dentistry": "SmilePlus",
    "urology": "Activity",
    "gastroenterology": "Activity",
    "nephrology": "Activity",
    "general surgery": "Scissors",
}


def parse_time_str(time_val):
    """Parse time string '17:00' or '5:00 PM' into datetime.time object."""
    if isinstance(time_val, time):
        return time_val
    if not time_val:
        return None
    time_str = str(time_val).strip()
    # Try 24-hour HH:MM or HH:MM:SS
    for fmt in ("%H:%M", "%H:%M:%S", "%I:%M %p", "%I:%M%p", "%I %p", "%I%p"):
        try:
            return datetime.strptime(time_str, fmt).time()
        except ValueError:
            continue
    return None


class Command(BaseCommand):
    help = "Seeds or imports doctor profiles from extracted JSON into the database."

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            "-f",
            default="data/doctors_extracted.json",
            help="Path to JSON file containing extracted doctor profiles.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simulate import and validation without saving changes to the database.",
        )
        parser.add_argument(
            "--default-fee",
            type=float,
            default=1000.0,
            help="Default consultation fee if not specified in JSON (default: 1000.00).",
        )

    def handle(self, *args, **options):
        file_path = Path(options["file"])
        dry_run = options["dry_run"]
        default_fee = Decimal(str(options["default_fee"]))

        if not file_path.exists():
            self.stderr.write(self.style.ERROR(f"File not found: {file_path}"))
            return

        with open(file_path, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError as e:
                self.stderr.write(self.style.ERROR(f"Invalid JSON in file: {e}"))
                return

        if isinstance(data, dict) and "doctors" in data:
            records = data["doctors"]
        elif isinstance(data, list):
            records = data
        else:
            self.stderr.write(self.style.ERROR("Expected a JSON array or an object with a 'doctors' list."))
            return

        self.stdout.write(f"Loaded {len(records)} doctor records from {file_path}")
        if dry_run:
            self.stdout.write(self.style.WARNING("--- RUNNING IN DRY-RUN MODE (No data will be committed) ---"))

        created_count = 0
        updated_count = 0
        error_count = 0

        # Run within an overall atomic block; if dry-run, we will rollback at the end
        try:
            with transaction.atomic():
                for index, item in enumerate(records, 1):
                    doc_name = item.get("name", "").strip()
                    if not doc_name:
                        self.stderr.write(f"[{index}] Skipped: Doctor record has no name.")
                        error_count += 1
                        continue

                    try:
                        # 1. Handle Specialties
                        specialties_objs = []
                        raw_specialties = item.get("specialties", [])
                        if isinstance(raw_specialties, str):
                            raw_specialties = [s.strip() for s in raw_specialties.split(",") if s.strip()]

                        for spec_name in raw_specialties:
                            spec_name_clean = spec_name.strip()
                            if not spec_name_clean:
                                continue
                            spec_slug = slugify(spec_name_clean)
                            icon = "Stethoscope"
                            for key, icon_name in SPECIALTY_ICON_MAP.items():
                                if key in spec_name_clean.lower():
                                    icon = icon_name
                                    break

                            spec_obj, _ = DoctorSpecialty.objects.get_or_create(
                                name=spec_name_clean,
                                defaults={"slug": spec_slug, "icon": icon}
                            )
                            specialties_objs.append(spec_obj)

                        # 2. Handle Doctor
                        bmdc = item.get("bmdc_number")
                        if bmdc:
                            bmdc = str(bmdc).strip()
                            if not bmdc or bmdc.lower() in ("null", "none", "n/a", "-"):
                                bmdc = None

                        qualification = item.get("qualification", "").strip() or "MBBS"
                        experience = item.get("experience", "").strip() or "Consultant"
                        description = item.get("description", "").strip()

                        doctor = None
                        created = False

                        if bmdc:
                            doctor, created = Doctor.objects.get_or_create(
                                bmdc_number=bmdc,
                                defaults={
                                    "name": doc_name,
                                    "qualification": qualification,
                                    "experience": experience,
                                    "description": description,
                                    "is_verified": True,
                                },
                            )
                        else:
                            # Search by name match
                            doctor = Doctor.objects.filter(name__iexact=doc_name).first()
                            if not doctor:
                                doctor = Doctor.objects.create(
                                    name=doc_name,
                                    bmdc_number=None,
                                    qualification=qualification,
                                    experience=experience,
                                    description=description,
                                    is_verified=True,
                                )
                                created = True

                        if not created:
                            # Update details
                            doctor.qualification = qualification or doctor.qualification
                            doctor.experience = experience or doctor.experience
                            if description:
                                doctor.description = description
                            doctor.is_verified = True
                            doctor.save()

                        # Link specialties
                        if specialties_objs:
                            doctor.specialties.set(specialties_objs)

                        # 3. Handle Affiliations & Locations
                        affiliations_data = item.get("affiliations", [])
                        for aff_data in affiliations_data:
                            fac_name = aff_data.get("facility_name", "").strip()
                            branch = aff_data.get("branch", "").strip()
                            loc_type = aff_data.get("location_type", "").lower()

                            # Infer location type if ambiguous
                            if loc_type not in (
                                Location.LocationType.HOSPITAL,
                                Location.LocationType.DIAGNOSTIC_CENTER,
                                Location.LocationType.CHAMBER,
                            ):
                                if "hospital" in fac_name.lower() or "medical college" in fac_name.lower():
                                    loc_type = Location.LocationType.HOSPITAL
                                elif "diagnostic" in fac_name.lower() or "center" in fac_name.lower() or "lab" in fac_name.lower():
                                    loc_type = Location.LocationType.DIAGNOSTIC_CENTER
                                else:
                                    loc_type = Location.LocationType.CHAMBER

                            # For private chambers, ensure a distinct, personalized name
                            if loc_type == Location.LocationType.CHAMBER:
                                if not fac_name or fac_name.lower() in ("chamber", "private chamber", "personal chamber", "consultation room"):
                                    fac_name = f"{doc_name} Chamber"

                            district = aff_data.get("district", "Dhaka").strip() or "Dhaka"
                            division = aff_data.get("division", "Dhaka").strip() or "Dhaka"
                            area = aff_data.get("area", "").strip()
                            address_line = aff_data.get("address_line", "").strip() or f"{fac_name}, {district}"
                            phone = aff_data.get("phone", "").strip()

                            # Match or create Location:
                            # - Hospitals & Diagnostic Centers are shared across multiple doctors
                            # - Chambers are private to this specific doctor
                            location = None
                            if loc_type == Location.LocationType.CHAMBER:
                                location = Location.objects.filter(
                                    location_type=Location.LocationType.CHAMBER,
                                    chamber_detail__doctor=doctor,
                                    name__iexact=fac_name
                                ).first()
                            else:
                                loc_filter = {"name__iexact": fac_name, "district__iexact": district}
                                if branch:
                                    loc_filter["branch__iexact"] = branch
                                location = Location.objects.filter(**loc_filter).first()

                            if not location:
                                b_slug = f"-{branch}" if branch else ""
                                base_slug = slugify(f"{fac_name}{b_slug}")
                                slug = base_slug
                                if Location.objects.filter(slug=slug).exists():
                                    slug = f"{base_slug}-{uuid.uuid4().hex[:6]}"

                                location = Location.objects.create(
                                    name=fac_name,
                                    branch=branch,
                                    location_type=loc_type,
                                    ownership_type=Location.OwnershipType.PRIVATE,
                                    address_line=address_line,
                                    area=area,
                                    district=district,
                                    division=division,
                                    phone=phone,
                                    is_verified=True,
                                    is_active=True,
                                    slug=slug,
                                )

                            # Ensure type detail object exists
                            if loc_type == Location.LocationType.HOSPITAL:
                                Hospital.objects.get_or_create(location=location)
                            elif loc_type == Location.LocationType.DIAGNOSTIC_CENTER:
                                DiagnosticCenter.objects.get_or_create(location=location)
                            elif loc_type == Location.LocationType.CHAMBER:
                                Chamber.objects.get_or_create(
                                    location=location,
                                    defaults={"doctor": doctor, "assistant_phone": phone}
                                )

                            # Affiliation
                            fee_val = aff_data.get("fee")
                            fee = Decimal(str(fee_val)) if fee_val is not None else default_fee

                            affiliation, _ = DoctorAffiliation.objects.update_or_create(
                                doctor=doctor,
                                location=location,
                                defaults={"fee": fee},
                            )

                            # 4. Handle Schedules
                            schedules_data = aff_data.get("schedules", [])
                            for sched in schedules_data:
                                raw_day = sched.get("day_of_week", "").strip().lower()
                                day_clean = VALID_DAYS.get(raw_day)
                                if not day_clean:
                                    continue

                                start_t = parse_time_str(sched.get("start_time"))
                                end_t = parse_time_str(sched.get("end_time"))

                                if not start_t:
                                    start_t = time(17, 0)
                                if not end_t or end_t <= start_t:
                                    end_t = time((start_t.hour + 3) % 24, start_t.minute)

                                # Check and delete existing matching slot or update
                                existing_sched = AffiliationSchedule.objects.filter(
                                    affiliation=affiliation,
                                    day_of_week=day_clean,
                                ).first()

                                if existing_sched:
                                    existing_sched.start_time = start_t
                                    existing_sched.end_time = end_t
                                    existing_sched.save()
                                else:
                                    # Create new slot
                                    AffiliationSchedule.objects.create(
                                        affiliation=affiliation,
                                        day_of_week=day_clean,
                                        start_time=start_t,
                                        end_time=end_t,
                                    )

                        if created:
                            created_count += 1
                        else:
                            updated_count += 1

                        self.stdout.write(f"[{index}/{len(records)}] {'Created' if created else 'Updated'}: {doc_name}")

                    except Exception as err:
                        error_count += 1
                        self.stderr.write(self.style.ERROR(f"[{index}] Error importing '{doc_name}': {err}"))

                if dry_run:
                    # Roll back entire transaction on dry run
                    transaction.set_rollback(True)

        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Fatal transaction error: {e}"))

        self.stdout.write("=" * 60)
        self.stdout.write(self.style.SUCCESS(f"Finished! Created: {created_count}, Updated: {updated_count}, Errors: {error_count}"))
        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run completed. Zero changes committed to the database."))
