import os
import csv
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from doctors.models import Doctor


class Command(BaseCommand):
    help = "Apply doctor profile fixes (gender, institution, provider_type) from profile_fixes.csv."

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            default='.agent/specialty_repair/profile_fixes.csv',
            help='Path to profile_fixes.csv'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Run without committing changes to database'
        )

    def handle(self, *args, **options):
        file_path = options['file']
        dry_run = options['dry_run']

        if not os.path.isabs(file_path):
            candidates = [
                Path('/home/ltl/Tomal/project_doctors_hub') / file_path,
                Path.cwd() / file_path,
                Path('/home/ltl/Tomal/project_doctors_hub/.agent/specialty_repair/profile_fixes.csv'),
            ]
            for c in candidates:
                if c.exists():
                    file_path = str(c)
                    break

        if not os.path.exists(file_path):
            raise CommandError(f"Profile fixes CSV not found: {file_path}")

        self.stdout.write(f"Loading profile fixes from {file_path} (dry_run={dry_run})...")

        diff_rows = []
        repo_dir = Path('/home/ltl/Tomal/project_doctors_hub')
        artifact_dir = repo_dir / '.agent' / 'specialty_repair'
        artifact_dir.mkdir(parents=True, exist_ok=True)
        diff_csv_path = artifact_dir / 'profile_diff.csv'

        with transaction.atomic():
            with open(file_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                applied_count = 0
                for r in reader:
                    if r.get('action') != 'apply':
                        continue

                    doc_id = r['doctor_id']
                    field = r['field']
                    target_val = r['source_value']

                    try:
                        doc = Doctor.objects.get(id=doc_id)
                    except Doctor.DoesNotExist:
                        continue

                    current_val = getattr(doc, field, '')
                    if current_val != target_val:
                        setattr(doc, field, target_val)
                        doc.save(update_fields=[field])
                        applied_count += 1

                        diff_rows.append({
                            'doctor_id': doc_id,
                            'doctor_name': doc.name,
                            'field': field,
                            'before': current_val,
                            'after': target_val,
                            'reason': r.get('reason', ''),
                        })

            self.stdout.write(f"Applied {applied_count} profile fixes.")

            if dry_run:
                self.stdout.write(self.style.WARNING("DRY-RUN mode enabled. Rolling back transaction."))
                transaction.set_rollback(True)
            else:
                self.stdout.write(self.style.SUCCESS("Profile fixes committed successfully!"))

        with open(diff_csv_path, 'w', newline='', encoding='utf-8') as f:
            fields = ['doctor_id', 'doctor_name', 'field', 'before', 'after', 'reason']
            writer = csv.DictWriter(f, fieldnames=fields)
            writer.writeheader()
            for r in diff_rows:
                writer.writerow(r)

        self.stdout.write(f"Wrote {len(diff_rows)} profile diffs to {diff_csv_path}")
