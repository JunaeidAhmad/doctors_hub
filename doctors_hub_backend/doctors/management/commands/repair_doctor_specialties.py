import os
import csv
from pathlib import Path
from collections import defaultdict
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from doctors.models import Doctor, DoctorSpecialty
try:
    from doctors.models import DoctorSpecialtyClaim
except ImportError:
    DoctorSpecialtyClaim = None
from doctors.services.specialty_tags import sync_doctor_tags


class Command(BaseCommand):
    help = "Repair doctor specialty claims and synchronize doctor tags from specialty_review.csv."

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            default='.agent/specialty_repair/specialty_review.csv',
            help='Path to specialty_review.csv'
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
                Path('/home/ltl/Tomal/project_doctors_hub/.agent/specialty_repair/specialty_review.csv'),
            ]
            for c in candidates:
                if c.exists():
                    file_path = str(c)
                    break

        if not os.path.exists(file_path):
            raise CommandError(f"Review CSV not found: {file_path}")

        self.stdout.write(f"Loading claims from {file_path} (dry_run={dry_run})...")

        claims_by_doc = defaultdict(list)
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for r in reader:
                claims_by_doc[r['doctor_id']].append(r)

        self.stdout.write(f"Loaded {sum(len(v) for v in claims_by_doc.values())} claims across {len(claims_by_doc)} doctors.")

        specialties_by_slug = {s.slug: s for s in DoctorSpecialty.objects.all()}

        repo_dir = Path('/home/ltl/Tomal/project_doctors_hub')
        artifact_dir = repo_dir / '.agent' / 'specialty_repair'
        artifact_dir.mkdir(parents=True, exist_ok=True)
        diff_csv_path = artifact_dir / 'backfill_diff.csv'

        diff_rows = []

        all_doc_ids = sorted(claims_by_doc.keys())

        # If dry run, wrap whole command in rollback, or per-doctor transactions
        for doc_id in all_doc_ids:
            with transaction.atomic():
                try:
                    doc = Doctor.objects.select_related().prefetch_related('specialties', 'specialties__parent_categories').get(id=doc_id)
                except Doctor.DoesNotExist:
                    continue

                # 1. Capture before state
                tags_before_objs = list(doc.specialties.all())
                tags_before_slugs = set(t.slug for t in tags_before_objs)

                umbrellas_before = set()
                for t in tags_before_objs:
                    if t.is_umbrella:
                        umbrellas_before.add(t.slug)
                    for p in t.parent_categories.all():
                        umbrellas_before.add(p.slug)

                # 2. Delete replaceable claims (card, brochure, legacy)
                DoctorSpecialtyClaim.objects.filter(
                    doctor=doc,
                    source__in=['card', 'brochure', 'legacy']
                ).delete()

                # 3. Insert/upsert new claims
                doc_claim_rows = claims_by_doc[doc_id]
                for r in doc_claim_rows:
                    is_prim = r['is_primary'].strip().lower() in ('true', '1', 'yes')
                    order_val = int(r['claim_order']) if r['claim_order'] else 0
                    flags_list = [f.strip() for f in r['flags'].split(',') if f.strip()]

                    claim = DoctorSpecialtyClaim.objects.create(
                        doctor=doc,
                        source=r['source'],
                        source_ref=r.get('source_ref', ''),
                        order=order_val,
                        is_primary=is_prim,
                        text=r['claim_text'],
                        text_bn=r.get('claim_text_bn', ''),
                        review_status=r.get('auto_status', 'approved'),
                        flags=flags_list,
                        review_note=r.get('decision_reason', ''),
                    )

                    tag_slugs = [s.strip() for s in r['tag_slugs'].split(',') if s.strip()]
                    tag_objs = [specialties_by_slug[ts] for ts in tag_slugs if ts in specialties_by_slug]
                    if tag_objs:
                        claim.tags.set(tag_objs)

                # 4. Sync Doctor.specialties
                sync_doctor_tags(doc)

                # 5. Capture after state
                tags_after_objs = list(doc.specialties.all())
                tags_after_slugs = set(t.slug for t in tags_after_objs)

                umbrellas_after = set()
                for t in tags_after_objs:
                    if t.is_umbrella:
                        umbrellas_after.add(t.slug)
                    for p in t.parent_categories.all():
                        umbrellas_after.add(p.slug)

                umbrellas_gained = sorted(umbrellas_after - umbrellas_before)
                umbrellas_lost = sorted(umbrellas_before - umbrellas_after)

                diff_rows.append({
                    'doctor_id': doc_id,
                    'name': doc.name,
                    'tags_before': ", ".join(sorted(tags_before_slugs)),
                    'tags_after': ", ".join(sorted(tags_after_slugs)),
                    'umbrellas_gained': ", ".join(umbrellas_gained),
                    'umbrellas_lost': ", ".join(umbrellas_lost),
                })

                if dry_run:
                    transaction.set_rollback(True)

        with open(diff_csv_path, 'w', newline='', encoding='utf-8') as f:
            fields = ['doctor_id', 'name', 'tags_before', 'tags_after', 'umbrellas_gained', 'umbrellas_lost']
            writer = csv.DictWriter(f, fieldnames=fields)
            writer.writeheader()
            for r in diff_rows:
                writer.writerow(r)

        self.stdout.write(f"Wrote {len(diff_rows)} rows to {diff_csv_path}")
        if dry_run:
            self.stdout.write(self.style.WARNING("DRY-RUN completed. All database changes rolled back."))
        else:
            self.stdout.write(self.style.SUCCESS("Doctor specialties backfill completed successfully!"))
