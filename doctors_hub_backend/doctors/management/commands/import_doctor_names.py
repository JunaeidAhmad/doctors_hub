import csv
from pathlib import Path
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify
from core.uuid7 import uuid7
from doctors.models import Doctor
from doctors.serializers import strip_doctor_honorific
from doctors.services.specialty_resolver import detect_language


class Command(BaseCommand):
    help = "Imports bilingual doctor names from a reviewed CSV file."

    def add_arguments(self, parser):
        parser.add_argument(
            "csv_file",
            type=str,
            help="Path to the reviewed CSV file to import.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simulate the import without committing changes to the database.",
        )

    def handle(self, *args, **options):
        csv_path = Path(options["csv_file"])
        dry_run = options["dry_run"]

        if not csv_path.exists():
            self.stderr.write(self.style.ERROR(f"CSV file not found: {csv_path}"))
            return

        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        self.stdout.write(f"Loaded {len(rows)} rows from {csv_path}")
        if dry_run:
            self.stdout.write(self.style.WARNING("--- RUNNING IN DRY-RUN MODE (No data will be committed) ---"))

        updated_count = 0
        refused_count = 0
        slug_changes = []

        try:
            with transaction.atomic():
                for index, row in enumerate(rows, 1):
                    doc_id = row.get("id", "").strip()
                    name_en = row.get("name_en", "").strip()
                    name_bn = row.get("name_bn", "").strip()

                    clean_name_en = strip_doctor_honorific(name_en)
                    clean_name_bn = strip_doctor_honorific(name_bn)

                    if not doc_id:
                        self.stderr.write(f"Row {index}: Missing doctor ID. Skipping.")
                        refused_count += 1
                        continue

                    # Validation: name_en MUST NOT contain Bangla characters
                    if clean_name_en and detect_language(clean_name_en) == "bn":
                        self.stderr.write(
                            self.style.ERROR(
                                f"Row {index} (ID: {doc_id}): Refused! name_en contains Bangla characters: '{clean_name_en}'"
                            )
                        )
                        refused_count += 1
                        continue

                    if not clean_name_en:
                        self.stderr.write(
                            self.style.ERROR(
                                f"Row {index} (ID: {doc_id}): Refused! name_en cannot be empty."
                            )
                        )
                        refused_count += 1
                        continue

                    doctor = Doctor.objects.filter(id=doc_id).first()
                    if not doctor:
                        self.stderr.write(f"Row {index}: Doctor with ID {doc_id} not found. Skipping.")
                        refused_count += 1
                        continue

                    current_slug = doctor.slug
                    needs_slug_regen = (
                        not current_slug
                        or current_slug.startswith("-")
                        or current_slug.startswith("doctor-")
                    )

                    old_slug = current_slug
                    new_slug = current_slug

                    if needs_slug_regen:
                        base_slug = slugify(clean_name_en)
                        if not base_slug or base_slug.startswith("-"):
                            base_slug = f"doctor-{uuid7().hex[:8]}"
                        new_slug = base_slug
                        if Doctor.objects.filter(slug=new_slug).exclude(pk=doctor.pk).exists():
                            new_slug = f"{base_slug}-{uuid7().hex[:6]}"

                        doctor.slug = new_slug
                        if old_slug and old_slug not in doctor.old_slugs:
                            doctor.old_slugs.append(old_slug)

                        slug_changes.append({
                            "id": doc_id,
                            "name": clean_name_en,
                            "old_slug": old_slug,
                            "new_slug": new_slug,
                        })

                    doctor.name = clean_name_en
                    doctor.bn_name = clean_name_bn
                    doctor.save()
                    updated_count += 1

                if dry_run:
                    # In dry-run, roll back the transaction
                    transaction.set_rollback(True)

        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Error during import: {e}"))
            return

        self.stdout.write("=" * 60)
        self.stdout.write(f"Total rows processed: {len(rows)}")
        self.stdout.write(self.style.SUCCESS(f"Successfully processed: {updated_count}"))
        if refused_count:
            self.stdout.write(self.style.ERROR(f"Refused rows: {refused_count}"))

        if slug_changes:
            self.stdout.write(self.style.WARNING(f"\nRegenerated slugs for {len(slug_changes)} doctors:"))
            for sc in slug_changes:
                self.stdout.write(f"  • {sc['name']} (ID: {sc['id']}): '{sc['old_slug']}' -> '{sc['new_slug']}'")
        else:
            self.stdout.write("\nNo slugs required regeneration.")

        if dry_run:
            self.stdout.write(self.style.WARNING("\nDRY-RUN COMPLETE: 0 database rows were modified."))
        else:
            self.stdout.write(self.style.SUCCESS("\nIMPORT COMPLETE: Changes successfully saved to database."))
