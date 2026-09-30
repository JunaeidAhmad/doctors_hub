import json
import uuid
from decimal import Decimal
from datetime import datetime, time
from pathlib import Path
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from doctors.models import Doctor, DoctorSpecialty, DoctorAffiliation, AffiliationSchedule
from facilities.models import Location, Hospital, DiagnosticCenter, Chamber, Thana


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
                        # 1. Handle Doctor Specialty Claims & Provider Type
                        specialty_claims_data = item.get("specialty_claims")
                        provider_type = item.get("provider_type", "")
                        specialties_objs = []
                        if not specialty_claims_data:
                            raw_specialties = item.get("specialties", [])
                            if isinstance(raw_specialties, str):
                                raw_specialties = [s.strip() for s in raw_specialties.split(",") if s.strip()]

                            for spec_name in raw_specialties:
                                spec_name_clean = spec_name.strip()
                                if not spec_name_clean:
                                    continue
                                from doctors.services.specialty_resolver import resolve_or_create_specialty, UnresolvedSpecialty
                                try:
                                    spec_obj = resolve_or_create_specialty(spec_name_clean)
                                except UnresolvedSpecialty:
                                    self.stdout.write(self.style.WARNING(f"Unresolved specialty '{spec_name_clean}' encountered during seed_doctors"))
                                    spec_obj = None

                                if spec_obj:
                                    specialties_objs.append(spec_obj)

                        # 2. Handle Doctor
                        # 2. Handle Doctor Bilingual Name & Script Detection
                        from doctors.services.specialty_resolver import detect_language
                        from doctors.serializers import strip_doctor_honorific

                        raw_name = item.get("name", "").strip()
                        raw_bn_name = item.get("bn_name", "").strip()
                        name_lang = detect_language(raw_name)

                        if name_lang == "bn":
                            doc_name = ""
                            doc_bn_name = strip_doctor_honorific(raw_name)
                            self.stdout.write(
                                self.style.WARNING(
                                    f"[{index}] Warning: Doctor '{raw_name}' has only a Bangla name; "
                                    "no English name provided (slug will use fallback)."
                                )
                            )
                        else:
                            doc_name = strip_doctor_honorific(raw_name)
                            doc_bn_name = strip_doctor_honorific(raw_bn_name)

                        bmdc = item.get("bmdc_number")
                        if bmdc:
                            bmdc = str(bmdc).strip()
                            if not bmdc or bmdc.lower() in ("null", "none", "n/a", "-"):
                                bmdc = None

                        qualification = str(item.get("qualification", "") or "").strip() or "MBBS"
                        experience = str(item.get("experience", "") or "").strip()[:50]
                        description = str(item.get("description", "") or item.get("about", "") or "").strip()
                        academic_title = str(item.get("academic_title", "") or "").strip()[:150]
                        institution = str(item.get("institution", "") or "").strip()[:250]
                        clinical_services = str(item.get("clinical_services", "") or "").strip()
                        doc_status_val = str(item.get("status", "") or "Active").strip()[:50] or "Active"
                        gender_val = str(item.get("gender", "") or "").strip()
                        if gender_val not in ("Male", "Female", "Other", ""):
                            gender_val = ""
                        # Verbatim specialty source texts from the file win over
                        # auto-generated canonical joins (file = actual site text).
                        verbatim_source = str(item.get("specialty_source", "") or "").strip()
                        verbatim_source_bn = str(item.get("specialty_source_bn", "") or "").strip()

                        raw_slug = str(item.get("slug", "") or "").strip()
                        old_slugs = item.get("old_slugs", [])
                        if not isinstance(old_slugs, list):
                            old_slugs = []

                        create_kwargs = {
                            "name": doc_name,
                            "bn_name": doc_bn_name,
                            "academic_title": academic_title,
                            "institution": institution,
                            "qualification": qualification,
                            "experience": experience,
                            "about": description,
                            "clinical_services": clinical_services,
                            "gender": gender_val,
                            "status": doc_status_val,
                            "is_verified": True,
                        }
                        if raw_slug and not Doctor.objects.filter(slug=raw_slug).exists():
                            create_kwargs["slug"] = raw_slug
                        if old_slugs:
                            create_kwargs["old_slugs"] = old_slugs

                        doctor = None
                        created = False

                        if bmdc:
                            doctor, created = Doctor.objects.get_or_create(
                                bmdc_number=bmdc,
                                defaults=create_kwargs,
                            )
                        else:
                            # Search by name match
                            doctor = Doctor.objects.filter(name__iexact=doc_name).first() if doc_name else None
                            if not doctor:
                                doctor = Doctor.objects.create(
                                    bmdc_number=None,
                                    **create_kwargs,
                                )
                                created = True

                        if not created:
                            # Update details
                            if doc_name:
                                doctor.name = doc_name
                            if doc_bn_name:
                                doctor.bn_name = doc_bn_name
                            if academic_title:
                                doctor.academic_title = academic_title
                            if institution:
                                doctor.institution = institution
                            doctor.qualification = qualification or doctor.qualification
                            if experience:
                                doctor.experience = experience[:50]
                            if description:
                                doctor.about = description
                            if clinical_services:
                                doctor.clinical_services = clinical_services
                            if gender_val:
                                doctor.gender = gender_val
                            if doc_status_val:
                                doctor.status = doc_status_val
                            if raw_slug and not doctor.slug:
                                if not Doctor.objects.filter(slug=raw_slug).exclude(pk=doctor.pk).exists():
                                    doctor.slug = raw_slug
                            if old_slugs and not doctor.old_slugs:
                                doctor.old_slugs = old_slugs
                            doctor.is_verified = True

                        rating_val = item.get("rating")
                        if rating_val is not None:
                            try:
                                doctor.rating = float(rating_val)
                            except (ValueError, TypeError):
                                pass
                        review_count_val = item.get("review_count")
                        if review_count_val is not None:
                            try:
                                doctor.review_count = int(review_count_val)
                            except (ValueError, TypeError):
                                pass

                        # Direct specialties, primary_specialty, and verbatim source texts
                        from doctors.services.specialty_resolver import resolve_specialty_exact

                        primary_spec_slug = str(item.get("primary_specialty", "") or "").strip()
                        seed_primary_spec = None
                        if primary_spec_slug:
                            seed_primary_spec = resolve_specialty_exact(primary_spec_slug)

                        if specialty_claims_data:
                            texts = [c.get("text", "").strip() for c in specialty_claims_data if c.get("text")]
                            texts_bn = [c.get("text_bn", "").strip() for c in specialty_claims_data if c.get("text_bn")]
                            doctor.specialty_source = verbatim_source or "\n".join(texts)
                            doctor.specialty_source_bn = verbatim_source_bn or "\n".join(texts_bn)

                            all_tags = []
                            prim_tag = None
                            for c in specialty_claims_data:
                                tag_refs = c.get("tags", [])
                                matched = [resolve_specialty_exact(str(t)) for t in tag_refs if resolve_specialty_exact(str(t))]
                                if c.get("is_primary") and not prim_tag and matched:
                                    prim_tag = matched[0]
                                all_tags.extend(matched)

                            if seed_primary_spec:
                                prim_tag = seed_primary_spec
                            elif not prim_tag and all_tags:
                                prim_tag = all_tags[0]
                            elif not prim_tag and specialties_objs:
                                prim_tag = specialties_objs[0]

                            doctor.primary_specialty = prim_tag
                            doctor.save()
                            if all_tags:
                                doctor.specialties.set(all_tags)
                            elif specialties_objs:
                                doctor.specialties.set(specialties_objs)
                        elif specialties_objs or seed_primary_spec:
                            doctor.specialty_source = verbatim_source or " · ".join([s.name for s in specialties_objs if s.name])
                            doctor.specialty_source_bn = verbatim_source_bn or " · ".join([s.bn_name or s.name for s in specialties_objs if (s.bn_name or s.name)])
                            prim_tag = seed_primary_spec or (specialties_objs[0] if specialties_objs else None)
                            doctor.primary_specialty = prim_tag
                            doctor.save()
                            specs_to_set = list(specialties_objs)
                            if prim_tag and prim_tag not in specs_to_set:
                                specs_to_set.append(prim_tag)
                            doctor.specialties.set(specs_to_set)
                        else:
                            doctor.save()

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

                            # Resolve canonical Thana
                            DIST_ALIASES = {
                                'chittagong': 'Chattogram', 'comilla': 'Cumilla', 'bogra': 'Bogura',
                                'jessore': 'Jashore', 'barisal': 'Barishal', 'ঢাকা': 'Dhaka',
                                'চট্টগ্রাম': 'Chattogram', 'সিলেট': 'Sylhet'
                            }
                            norm_dist = DIST_ALIASES.get(district.lower(), district)
                            norm_area = area.strip()

                            thana_obj = Thana.objects.filter(district__name__iexact=norm_dist, name__iexact=norm_area).first()
                            if not thana_obj and norm_area:
                                thana_obj = Thana.objects.filter(district__name__iexact=norm_dist, bn_name__iexact=norm_area).first()
                            if not thana_obj:
                                thana_obj = Thana.objects.filter(district__name__iexact=norm_dist, name__icontains='Sadar').first() or Thana.objects.filter(district__name__iexact=norm_dist).first()
                            if not thana_obj:
                                thana_obj = Thana.objects.filter(district__name='Dhaka', name='Dhanmondi').first() or Thana.objects.first()

                            # Match or create Location:
                            location = None
                            if loc_type == Location.LocationType.CHAMBER:
                                location = Location.objects.filter(
                                    location_type=Location.LocationType.CHAMBER,
                                    chamber_detail__doctor=doctor,
                                    name__iexact=fac_name
                                ).first()
                            else:
                                loc_filter = {"name__iexact": fac_name, "thana__district__name__iexact": norm_dist}
                                if branch:
                                    loc_filter["branch__iexact"] = branch
                                location = Location.objects.filter(**loc_filter).first()

                            if not location:
                                b_slug = f"-{branch}" if branch else ""
                                base_slug = slugify(f"{fac_name}{b_slug}")
                                slug = base_slug
                                if Location.objects.filter(slug=slug).exists():
                                    from core.uuid7 import uuid7
                                    slug = f"{base_slug}-{uuid7().hex[:6]}"

                                location = Location.objects.create(
                                    name=fac_name,
                                    branch=branch,
                                    location_type=loc_type,
                                    ownership_type=Location.OwnershipType.PRIVATE,
                                    address_line=address_line,
                                    thana=thana_obj,
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
                                if end_t <= start_t:
                                    # Overnight or zero-length slot (e.g. 21:00-21:00 from bad parse);
                                    # skip instead of failing the whole doctor import.
                                    self.stdout.write(self.style.WARNING(
                                        f"[{index}] Skipped invalid schedule {day_clean} "
                                        f"{start_t}-{end_t} for '{doc_name}'."
                                    ))
                                    continue

                                # Check and delete existing matching slot or update
                                existing_sched = AffiliationSchedule.objects.filter(
                                    affiliation=affiliation,
                                    day_of_week=day_clean,
                                ).first()

                                from django.core.exceptions import ValidationError
                                try:
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
                                except ValidationError as ve:
                                    # e.g. overlap with the doctor's slot at another facility;
                                    # keep doctor + affiliation, skip only this slot.
                                    self.stdout.write(self.style.WARNING(
                                        f"[{index}] Skipped conflicting schedule {day_clean} "
                                        f"{start_t}-{end_t} for '{doc_name}': {ve}."
                                    ))
                                    continue

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
