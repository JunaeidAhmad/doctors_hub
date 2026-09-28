from django.core.management.base import BaseCommand, CommandError
from django.db.models import Count, Q

from doctors.models import Doctor, DoctorSpecialty


class Command(BaseCommand):
    help = "Run 8 specialty taxonomy and doctor integrity checks. Aborts if any check returns > 0."

    def handle(self, *args, **options):
        self.stdout.write("Running 8 specialty integrity checks...")

        failures = {}

        # 1. leaves without a parent
        leaves_without_parent = DoctorSpecialty.objects.filter(
            is_umbrella=False,
            parent_categories__isnull=True
        ).distinct().count()
        failures['1. leaves without a parent'] = leaves_without_parent

        # 2. umbrellas that have parents
        umbrellas_with_parents = DoctorSpecialty.objects.filter(
            is_umbrella=True,
            parent_categories__isnull=False
        ).distinct().count()
        failures['2. umbrellas that have parents'] = umbrellas_with_parents

        # 3. doctors with no specialties
        doctors_no_specs = Doctor.objects.filter(
            specialties__isnull=True
        ).distinct().count()
        failures['3. doctors with no specialties'] = doctors_no_specs

        # 4. doctors with no primary_specialty
        doctors_no_primary = Doctor.objects.filter(
            primary_specialty__isnull=True
        ).distinct().count()
        failures['4. doctors with no primary_specialty'] = doctors_no_primary

        # 5. doctors whose primary_specialty is not in specialties
        doctors_prim_not_in_specs = 0
        for doc in Doctor.objects.prefetch_related('specialties').select_related('primary_specialty').all():
            if doc.primary_specialty and not doc.specialties.filter(id=doc.primary_specialty.id).exists():
                doctors_prim_not_in_specs += 1
        failures['5. doctors whose primary_specialty is not in specialties'] = doctors_prim_not_in_specs

        # 6. doctors with empty specialty_source
        doctors_empty_source = Doctor.objects.filter(
            Q(specialty_source='') | Q(specialty_source__isnull=True)
        ).count()
        failures['6. doctors with empty specialty_source'] = doctors_empty_source

        # 7. nodes (umbrellas or leaves) with an empty bn_name
        nodes_empty_bn_name = DoctorSpecialty.objects.filter(
            Q(bn_name='') | Q(bn_name__isnull=True)
        ).count()
        failures['7. nodes with empty bn_name'] = nodes_empty_bn_name

        # 8. nodes with empty slug
        nodes_empty_slug = DoctorSpecialty.objects.filter(
            Q(slug='') | Q(slug__isnull=True)
        ).count()
        failures['8. nodes with empty slug'] = nodes_empty_slug

        has_failure = False
        self.stdout.write("=" * 60)
        self.stdout.write("SPECIALTY INTEGRITY AUDIT RESULTS")
        self.stdout.write("=" * 60)
        for check_name, count in failures.items():
            if count == 0:
                self.stdout.write(self.style.SUCCESS(f"[PASS] {check_name}: {count}"))
            else:
                self.stdout.write(self.style.ERROR(f"[FAIL] {check_name}: {count}"))
                has_failure = True
        self.stdout.write("=" * 60)

        if has_failure:
            raise CommandError("Integrity check failed: one or more checks returned > 0 violations!")
        else:
            self.stdout.write(self.style.SUCCESS("All 8 integrity checks passed with 0 violations!"))
