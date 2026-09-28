import os
import yaml
from pathlib import Path
from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Count

from doctors.models import DoctorSpecialty
try:
    from doctors.models import DoctorSpecialtyClaim, LegacySpecialtySlug
except ImportError:
    DoctorSpecialtyClaim = None
    LegacySpecialtySlug = None
from doctors.services.specialty_tags import sync_doctor_tags


class Command(BaseCommand):
    help = "Retire compound specialty rows (components.count() > 1), repointing doctor claims and creating legacy slugs."

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Run without committing changes to the database'
        )
        parser.add_argument(
            '--file',
            type=str,
            default='doctors/fixtures/taxonomy_v3.yaml',
            help='Path to taxonomy_v3.yaml containing legacy_map'
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        file_path = options['file']

        if not os.path.isabs(file_path):
            candidates = [
                Path.cwd() / file_path,
                Path(__file__).resolve().parent.parent.parent / file_path,
                Path('/home/ltl/Tomal/project_doctors_hub/doctors_hub_backend') / file_path,
            ]
            for c in candidates:
                if c.exists():
                    file_path = str(c)
                    break

        legacy_map = {}
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                tax = yaml.safe_load(f)
                legacy_map = tax.get('legacy_map', {})

        self.stdout.write(f"Scanning for compound specialties (components.count() > 1)...")

        if not hasattr(DoctorSpecialty, 'components'):
            self.stdout.write(self.style.SUCCESS("components field has been retired from DoctorSpecialty. 0 compound rows found."))
            return

        with transaction.atomic():
            compound_qs = DoctorSpecialty.objects.annotate(
                comp_count=Count('components')
            ).filter(comp_count__gt=1)

            count = compound_qs.count()
            self.stdout.write(f"Found {count} compound specialty row(s).")

            for row in list(compound_qs):
                components = list(row.components.all())
                mapped_components = []
                for comp in components:
                    target_slug = legacy_map.get(comp.slug) or legacy_map.get(comp.name) or comp.slug
                    target_spec = DoctorSpecialty.objects.filter(slug=target_slug).first()
                    if target_spec:
                        mapped_components.append(target_spec)
                    else:
                        mapped_components.append(comp)

                doctors_affected = list(row.doctors.all())
                for doc in doctors_affected:
                    if doc.specialty_claims.count() == 0:
                        claim, _ = DoctorSpecialtyClaim.objects.get_or_create(
                            doctor=doc,
                            source='legacy',
                            source_ref=f"compound:{row.id}",
                            order=100,
                            defaults={
                                'text': row.name,
                                'is_primary': False,
                                'review_status': 'approved',
                            }
                        )
                        if mapped_components:
                            claim.tags.set(mapped_components)

                    sync_doctor_tags(doc)

                first_target = mapped_components[0] if mapped_components else None
                if not first_target:
                    target_slug = legacy_map.get(row.slug) or legacy_map.get(row.name)
                    if target_slug:
                        first_target = DoctorSpecialty.objects.filter(slug=target_slug).first()

                if first_target and row.slug != first_target.slug:
                    LegacySpecialtySlug.objects.update_or_create(
                        slug=row.slug,
                        defaults={'target': first_target}
                    )

                self.stdout.write(f"Retiring compound row: {row.name} ({row.slug}) -> {first_target.name if first_target else 'None'}")
                row.delete()

            remaining = DoctorSpecialty.objects.annotate(
                comp_count=Count('components')
            ).filter(comp_count__gt=1).count()

            if dry_run:
                self.stdout.write(self.style.WARNING("DRY-RUN mode enabled. Rolling back transaction."))
                transaction.set_rollback(True)
            else:
                self.stdout.write(self.style.SUCCESS(f"Finished retiring compound specialties. Remaining compound rows: {remaining}."))

        if remaining != 0 and not dry_run:
            raise CommandError(f"Gate failed: compound rows remaining = {remaining} (expected 0)")
