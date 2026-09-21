import csv
from pathlib import Path
from django.core.management.base import BaseCommand
from doctors.models import Doctor
from doctors.serializers import strip_doctor_honorific
from doctors.services.specialty_resolver import detect_language


class Command(BaseCommand):
    help = "Exports all doctor names to a CSV for bilingual translation and review."

    def add_arguments(self, parser):
        parser.add_argument(
            "--output",
            "-o",
            default="doctor_names_export.csv",
            help="Path to the output CSV file (default: doctor_names_export.csv)",
        )

    def handle(self, *args, **options):
        output_path = Path(options["output"])
        doctors = Doctor.objects.all().order_by("name")
        total = doctors.count()

        fieldnames = [
            "id",
            "current_name",
            "detected_language",
            "name_en",
            "name_bn",
            "current_slug",
            "bmdc_number",
            "needs_review",
        ]

        with open(output_path, "w", newline="", encoding="utf-8") as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()

            for doc in doctors:
                lang = detect_language(doc.name)
                clean_name = strip_doctor_honorific(doc.name)

                if lang == "bn":
                    name_bn = clean_name
                    name_en = ""
                else:
                    name_en = clean_name
                    name_bn = doc.bn_name if doc.bn_name else ""

                # Flag for review if slug is suspicious/empty
                is_suspicious_slug = not doc.slug or doc.slug.startswith("-") or doc.slug.startswith("doctor-")
                needs_review = "yes" if is_suspicious_slug else ""

                writer.writerow({
                    "id": str(doc.id),
                    "current_name": doc.name,
                    "detected_language": lang,
                    "name_en": name_en,
                    "name_bn": name_bn,
                    "current_slug": doc.slug,
                    "bmdc_number": doc.bmdc_number or "",
                    "needs_review": needs_review,
                })

        self.stdout.write(
            self.style.SUCCESS(f"Successfully exported {total} doctor records to {output_path}")
        )
