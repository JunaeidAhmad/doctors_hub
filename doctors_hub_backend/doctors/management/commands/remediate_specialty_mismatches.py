from django.core.management.base import BaseCommand
from django.db import transaction
from doctors.models import Doctor, DoctorSpecialty, SpecialtyAlias


class Command(BaseCommand):
    help = "Remediate all specialty alias, doctor umbrella, and credential mismatches."

    def handle(self, *args, **options):
        self.stdout.write("Starting specialty mismatch remediation...")

        with transaction.atomic():
            # =========================================================
            # 1. REMEDIATE 30 MIS-MAPPED ALIASES
            # =========================================================
            alias_reassignments = [
                # Gynecology & Obstetrics (4)
                ('Gynecology & Obstetrics', 'gynecologist-obstetrician'),
                ('স্ত্রীরোগ ও প্রসূতিবিদ্যা (গাইনী)', 'gynecologist-obstetrician'),
                ('স্ত্রীরোগ বিশেষজ্ঞ', 'gynecologist-obstetrician'),
                ('প্রসূতি রোগ', 'gynecologist-obstetrician'),
                # Infertility (6)
                ('Infertility & Reproductive Medicine', 'infertility-specialist'),
                ('বন্ধ্যাত্ব ও রিপ্রোডাক্টিভ মেডিসিন', 'infertility-specialist'),
                ('বন্ধ্যাত্ব চিকিৎসা', 'infertility-specialist'),
                ('বন্ধ্যাত্ব স্ত্রীরোগ বিশেষজ্ঞ', 'infertility-specialist'),
                ('রিপ্রোডাক্টিভ এন্ডোক্রিনোলজি', 'infertility-specialist'),
                ('রিপ্রোডাক্টিভ এন্ডোক্রিনোলজি ও ইনফার্টিলিটি', 'infertility-specialist'),
                # Fetomaternal Medicine (2)
                ('মেটারনাল-ফিট্যাল মেডিসিন', 'fetomaternal-medicine-specialist'),
                ('ফিটোম্যাট্যারনাল মেডিসিন', 'fetomaternal-medicine-specialist'),
                # Mental Health & Psychology (5)
                ('Psychiatry & Mental Health', 'psychiatrist'),
                ('সাইকিয়াট্রি', 'psychiatrist'),
                ('মানসিক রোগ', 'psychiatrist'),
                ('মানসিক রোগ (সাইকিয়াট্রি)', 'psychiatrist'),
                ('মনোবিজ্ঞানী', 'psychologist'),
                # Nutrition & Dietetics (5)
                ('Dietitian', 'nutritionist-dietitian'),
                ('Nutrition & Dietetics', 'nutritionist-dietitian'),
                ('পুষ্টি', 'nutritionist-dietitian'),
                ('পুষ্টি ও নিউট্রিশন', 'nutritionist-dietitian'),
                ('শিশু পুষ্টি', 'nutritionist-dietitian'),
                # Plastic Surgery (2)
                ('Plastic & Cosmetic Surgery', 'plastic-surgeon'),
                ('প্লাস্টিক ও কসমেটিক সার্জারি', 'plastic-surgeon'),
                # Nephrology (4)
                ('Pediatric Nephrology', 'nephrologist'),
                ('শিশু নেফ্রোলজি', 'nephrologist'),
                ('শিশু কিডনি রোগ', 'nephrologist'),
                ('শিশু কিডনি বিশেষজ্ঞ', 'nephrologist'),
                # Pediatric Orthopedics (2)
                ('শিশু অর্থোপেডিক সার্জারি', 'pediatric-orthopedic-surgeon'),
                ('শিশু অর্থোপেডিক্স বিশেষজ্ঞ', 'pediatric-orthopedic-surgeon'),
            ]

            reassigned_count = 0
            for alias_name, target_slug in alias_reassignments:
                target_spec = DoctorSpecialty.objects.filter(slug=target_slug).first()
                if not target_spec:
                    self.stdout.write(self.style.ERROR(f"Target specialty '{target_slug}' not found!"))
                    continue

                alias = SpecialtyAlias.objects.filter(name=alias_name).first()
                if alias:
                    old_slug = alias.specialty.slug
                    if old_slug != target_slug:
                        alias.specialty = target_spec
                        alias.save(update_fields=['specialty', 'updated_at'])
                        reassigned_count += 1
                        self.stdout.write(f"  [ALIAS] '{alias_name}': {old_slug} -> {target_slug}")

            self.stdout.write(self.style.SUCCESS(f"Successfully reassigned {reassigned_count} aliases."))

            # =========================================================
            # 2. REMEDIATE UMBRELLA ASSIGNMENTS ON DOCTORS
            # =========================================================
            ent_umbrella = DoctorSpecialty.objects.filter(slug='ent', is_umbrella=True).first()
            ent_leaf = DoctorSpecialty.objects.filter(slug='ent-specialist', is_umbrella=False).first()
            head_neck_leaf = DoctorSpecialty.objects.filter(slug='head-neck-surgeon', is_umbrella=False).first()
            mental_umbrella = DoctorSpecialty.objects.filter(slug='mental-health', is_umbrella=True).first()
            child_umbrella = DoctorSpecialty.objects.filter(slug='child-health', is_umbrella=True).first()
            dermatologist_leaf = DoctorSpecialty.objects.filter(slug='dermatologist').first()

            # 2a. Clean up ENT doctors
            if ent_umbrella and ent_leaf:
                ent_docs = Doctor.objects.filter(specialties=ent_umbrella).distinct()
                for doc in ent_docs:
                    doc.specialties.remove(ent_umbrella)
                    doc.specialties.add(ent_leaf)
                    if doc.primary_specialty == ent_umbrella:
                        # If doctor already has head-neck-surgeon and qualifications/source emphasize it
                        if 'head-neck' in doc.specialty_source.lower() or 'head neck' in doc.specialty_source.lower() or 'head & neck' in doc.specialty_source.lower():
                            doc.primary_specialty = head_neck_leaf
                        else:
                            doc.primary_specialty = ent_leaf
                    doc.save()
                self.stdout.write(self.style.SUCCESS(f"Cleaned up {ent_docs.count()} doctors with 'ent' umbrella."))

            # 2b. Clean up Mental Health doctors
            if mental_umbrella:
                mh_docs = Doctor.objects.filter(specialties=mental_umbrella).distinct()
                for doc in mh_docs:
                    doc.specialties.remove(mental_umbrella)
                    if doc.primary_specialty == mental_umbrella:
                        # If doctor has other specialties, pick one
                        other_specs = doc.specialties.filter(is_umbrella=False)
                        if other_specs.exists():
                            doc.primary_specialty = other_specs.first()
                        elif dermatologist_leaf:
                            doc.primary_specialty = dermatologist_leaf
                            doc.specialties.add(dermatologist_leaf)
                    doc.save()
                self.stdout.write(self.style.SUCCESS(f"Cleaned up {mh_docs.count()} doctors with 'mental-health' umbrella."))

            # 2c. Clean up Child Health doctors
            if child_umbrella:
                ch_docs = Doctor.objects.filter(specialties=child_umbrella).distinct()
                for doc in ch_docs:
                    doc.specialties.remove(child_umbrella)
                    if doc.primary_specialty == child_umbrella:
                        other_specs = doc.specialties.filter(is_umbrella=False)
                        if other_specs.exists():
                            doc.primary_specialty = other_specs.first()
                    doc.save()
                self.stdout.write(self.style.SUCCESS(f"Cleaned up {ch_docs.count()} doctors with 'child-health' umbrella."))

            # =========================================================
            # 3. SPECIFIC CREDENTIAL-TO-SPECIALTY MISMATCH CORRECTIONS
            # =========================================================
            ped_neuro = DoctorSpecialty.objects.filter(slug='pediatric-neurologist').first()
            child_spec = DoctorSpecialty.objects.filter(slug='child-specialist').first()
            neuro = DoctorSpecialty.objects.filter(slug='neurologist').first()
            gastro = DoctorSpecialty.objects.filter(slug='gastroenterologist').first()
            hepato = DoctorSpecialty.objects.filter(slug='hepatologist').first()
            nephro = DoctorSpecialty.objects.filter(slug='nephrologist').first()
            med_spec = DoctorSpecialty.objects.filter(slug='medicine-specialist').first()
            gp_spec = DoctorSpecialty.objects.filter(slug='family-physician-gp').first()
            ped_ortho = DoctorSpecialty.objects.filter(slug='pediatric-orthopedic-surgeon').first()
            ortho = DoctorSpecialty.objects.filter(slug='orthopedic-surgeon').first()
            spine = DoctorSpecialty.objects.filter(slug='spine-surgeon').first()
            gyn_obs = DoctorSpecialty.objects.filter(slug='gynecologist-obstetrician').first()

            # 3a. Dr. Kazi Naushad-Un-Nabi (FCPS Pediatrics, MD Neurology)
            doc_nabi = Doctor.objects.filter(name__icontains='Kazi Naushad-Un-Nabi').first()
            if doc_nabi and ped_neuro:
                doc_nabi.specialties.remove(gp_spec)
                doc_nabi.specialties.add(ped_neuro, child_spec, neuro)
                doc_nabi.primary_specialty = ped_neuro
                doc_nabi.specialty_source = "Pediatric Neurology & Child Health"
                doc_nabi.save()
                self.stdout.write(self.style.SUCCESS("Fixed credentials for Dr. Kazi Naushad-Un-Nabi -> Pediatric Neurologist"))

            # 3b. Dr. Salma Begum (FCPS Gastroenterology)
            doc_salma = Doctor.objects.filter(name__icontains='Salma Begum', qualification__icontains='Gastroenterology').first()
            if doc_salma and gastro:
                doc_salma.specialties.remove(gp_spec)
                doc_salma.specialties.add(gastro)
                doc_salma.primary_specialty = gastro
                doc_salma.specialty_source = "Gastroenterology"
                doc_salma.save()
                self.stdout.write(self.style.SUCCESS("Fixed credentials for Dr. Salma Begum -> Gastroenterologist"))

            # 3c. Dr. Harun-Or-Rashid (FCPS Nephrology, PhD)
            doc_harun = Doctor.objects.filter(name__icontains='Harun-Or-Rashid', qualification__icontains='Nephrology').first()
            if doc_harun and nephro:
                doc_harun.specialties.add(nephro)
                doc_harun.primary_specialty = nephro
                doc_harun.save()
                self.stdout.write(self.style.SUCCESS("Fixed credentials for Dr. Harun-Or-Rashid -> Nephrologist"))

            # 3d. Dr. Farhad Hossain Md. Shahed (MD Hepatology)
            doc_farhad = Doctor.objects.filter(name__icontains='Farhad Hossain Md. Shahed').first()
            if doc_farhad and hepato:
                doc_farhad.specialties.add(hepato)
                doc_farhad.primary_specialty = hepato
                doc_farhad.save()
                self.stdout.write(self.style.SUCCESS("Fixed credentials for Dr. Farhad Hossain Md. Shahed -> Hepatologist"))

            # 3e. Dr. Jaglul Gaffar Khan (Zia) (MS Ortho Surgery in Pediatric Surgery)
            doc_zia = Doctor.objects.filter(name__icontains='Jaglul Gaffar Khan').first()
            if doc_zia and ped_ortho and ortho:
                doc_zia.specialties.add(ped_ortho, ortho)
                doc_zia.primary_specialty = ped_ortho
                doc_zia.save()
                self.stdout.write(self.style.SUCCESS("Fixed credentials for Dr. Jaglul Gaffar Khan -> Pediatric Orthopedic Surgeon"))

            # 3f. Dr. Md. Nabir Hossain (MS Ortho, FISS)
            doc_nabir = Doctor.objects.filter(name__icontains='Md. Nabir Hossain').first()
            if doc_nabir and ortho and spine:
                doc_nabir.specialties.add(ortho, spine)
                doc_nabir.save()
                self.stdout.write(self.style.SUCCESS("Fixed credentials for Dr. Md. Nabir Hossain -> Added Orthopedic & Spine Surgeon"))

            # 3g. Dr. Rehana Begum (DGO, LM)
            doc_rehana = Doctor.objects.filter(name__icontains='Rehana Begum', qualification__icontains='DGO').first()
            if doc_rehana and gyn_obs:
                doc_rehana.specialties.add(gyn_obs)
                doc_rehana.save()
                self.stdout.write(self.style.SUCCESS("Fixed credentials for Dr. Rehana Begum -> Added Gynecologist & Obstetrician"))

        self.stdout.write(self.style.SUCCESS("Mismatch remediation completed successfully!"))
