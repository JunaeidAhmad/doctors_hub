import sys
import datetime
from django.core.management.base import BaseCommand
from django.db import connection, transaction
from api.models import (
    User, DoctorSpecialty, HospitalCategory, HospitalService, Hospital,
    TestCategory, Test, DiagnosticCenterCategory, DiagnosticService, DiagnosticCenter, DiagnosticCenterTest,
    Doctor, DoctorAffiliation, AffiliationSchedule, DoctorBooking, LabBooking
)

TEST_TREE = {
    "Blood Tests": {
        "children": {
            "Hematology": [
                ("Complete Blood Count (CBC)", "Blood", False, 6),
                ("ESR (Erythrocyte Sedimentation Rate)", "Blood", False, 6),
                ("Blood Grouping & Rh Factor", "Blood", False, 4),
                ("Coagulation Profile (PT, APTT, INR)", "Blood", False, 12),
                ("Peripheral Blood Smear", "Blood", False, 24),
                ("Reticulocyte Count", "Blood", False, 12),
            ],
            "Biochemistry": [
                ("Blood Sugar - Fasting", "Blood", True, 4),
                ("Blood Sugar - Random", "Blood", False, 4),
                ("Blood Sugar - PP (Post Prandial)", "Blood", False, 4),
                ("HbA1c", "Blood", False, 24),
                ("Lipid Profile (Cholesterol, Triglycerides, HDL, LDL)", "Blood", True, 12),
                ("Liver Function Test (LFT)", "Blood", True, 12),
                ("Kidney Function Test (KFT/RFT)", "Blood", False, 12),
                ("Thyroid Profile (T3, T4, TSH)", "Blood", False, 24),
                ("Electrolytes (Sodium, Potassium, Chloride)", "Blood", False, 6),
                ("Cardiac Enzymes (Troponin, CK-MB)", "Blood", False, 4),
                ("Vitamin Profile (D3, B12)", "Blood", False, 48),
                ("Iron Studies (Serum Iron, Ferritin, TIBC)", "Blood", True, 24),
            ],
            "Serology": [
                ("Widal Test (Typhoid)", "Blood", False, 12),
                ("Dengue NS1/IgM/IgG", "Blood", False, 6),
                ("HBsAg (Hepatitis B)", "Blood", False, 12),
                ("HCV (Hepatitis C)", "Blood", False, 12),
                ("HIV Test", "Blood", False, 24),
                ("VDRL/RPR (Syphilis)", "Blood", False, 12),
                ("CRP (C-Reactive Protein)", "Blood", False, 12),
                ("RA Factor", "Blood", False, 12),
                ("ASO Titer", "Blood", False, 12),
            ],
            "Microbiology": [
                ("Urine Culture & Sensitivity", "Urine", False, 72),
                ("Blood Culture", "Blood", False, 72),
                ("Sputum Culture", "Sputum", False, 72),
                ("Stool Routine & Culture", "Stool", False, 48),
                ("Throat Swab Culture", "Swab", False, 48),
                ("Wound Swab Culture", "Swab", False, 48),
            ],
        }
    },
    "Radiology & Imaging": {
        "children": {
            "X-ray": [
                ("Chest X-ray", "N/A", False, 2),
                ("Bone/Skeletal X-ray", "N/A", False, 2),
                ("Abdominal X-ray", "N/A", False, 2),
                ("Spine X-ray", "N/A", False, 2),
                ("Dental X-ray (OPG)", "N/A", False, 2),
            ],
            "Ultrasound/USG": [
                ("Abdominal USG (Whole Abdomen)", "N/A", True, 2),
                ("Pelvic USG", "N/A", True, 2),
                ("Pregnancy/Obstetric USG", "N/A", False, 2),
                ("Thyroid USG", "N/A", False, 2),
                ("Breast USG", "N/A", False, 2),
                ("Doppler USG (Vascular)", "N/A", False, 4),
                ("Transvaginal USG", "N/A", False, 2),
            ],
            "CT Scan": [
                ("CT Brain", "N/A", False, 4),
                ("CT Chest", "N/A", False, 4),
                ("CT Abdomen/Pelvis", "N/A", True, 4),
                ("CT Angiography", "N/A", True, 6),
                ("CT Spine", "N/A", False, 4),
                ("HRCT (High-Resolution CT)", "N/A", False, 4),
            ],
            "MRI": [
                ("MRI Brain", "N/A", False, 6),
                ("MRI Spine", "N/A", False, 6),
                ("MRI Joint (Knee, Shoulder)", "N/A", False, 6),
                ("MRI Whole Abdomen", "N/A", True, 6),
                ("MRI Angiography (MRA)", "N/A", False, 8),
                ("Functional MRI (fMRI)", "N/A", False, 24),
            ],
            "Mammography": [
                ("Screening Mammogram", "N/A", False, 4),
                ("Specialized Mammogram", "N/A", False, 4),
                ("Digital Breast Tomosynthesis", "N/A", False, 4),
            ],
        }
    },
    "Cardiac Tests": {
        "tests": [
            ("ECG (Resting)", "N/A", False, 1),
            ("2D Echo", "N/A", False, 2),
            ("Doppler Echo", "N/A", False, 2),
            ("Stress Echo", "N/A", False, 4),
            ("TMT (Treadmill Test)", "N/A", False, 2),
            ("Holter Monitor (24-hour ECG)", "N/A", False, 48),
            ("Cardiac CT/Calcium Scoring", "N/A", True, 6),
            ("Ambulatory BP Monitoring (ABPM)", "N/A", False, 48),
            ("Coronary Angiography", "N/A", True, 24),
        ]
    },
    "Neuro Tests": {
        "tests": [
            ("EEG - Routine", "N/A", False, 4),
            ("EEG - Sleep-deprived", "N/A", False, 12),
            ("EEG - Video", "N/A", False, 48),
            ("EMG (Electromyography)", "N/A", False, 4),
            ("NCV (Nerve Conduction Velocity)", "N/A", False, 4),
            ("Evoked Potential Studies (VEP, BAEP, SSEP)", "N/A", False, 6),
            ("Polysomnography (Sleep Study)", "N/A", False, 48),
        ]
    },
    "Endoscopy/Colonoscopy": {
        "tests": [
            ("Upper GI Endoscopy (Gastroscopy)", "N/A", True, 4),
            ("Colonoscopy", "N/A", True, 4),
            ("Sigmoidoscopy", "N/A", True, 4),
            ("ERCP", "N/A", True, 24),
            ("Bronchoscopy", "N/A", True, 24),
            ("Cystoscopy", "N/A", False, 4),
            ("Capsule Endoscopy", "N/A", True, 24),
        ]
    },
    "Pulmonary Function Test (PFT)": {
        "tests": [
            ("Spirometry", "N/A", False, 2),
            ("Lung Volume Test", "N/A", False, 2),
            ("Diffusion Capacity Test (DLCO)", "N/A", False, 2),
            ("Bronchial Provocation Test", "N/A", False, 4),
            ("Arterial Blood Gas (ABG) Analysis", "Blood", False, 1),
        ]
    },
    "Genetic & Molecular": {
        "tests": [
            ("PCR Test (viral/bacterial detection)", "Swab/Blood", False, 24),
            ("DNA Fingerprinting/Paternity Test", "Blood/Swab", False, 168),
            ("Karyotyping (Chromosomal Analysis)", "Blood", False, 336),
            ("NIPT (Non-Invasive Prenatal Testing)", "Blood", False, 168),
            ("BRCA Gene Testing", "Blood", False, 336),
            ("HLA Typing", "Blood", False, 168),
        ]
    },
    "Histopathology / Biopsy": {
        "tests": [
            ("Tissue Biopsy", "Tissue", False, 168),
            ("FNAC (Fine Needle Aspiration Cytology)", "Tissue", False, 72),
            ("Pap Smear", "Cervical Sample", False, 72),
            ("Bone Marrow Biopsy", "Tissue", False, 168),
            ("Frozen Section Biopsy", "Tissue", False, 1),
            ("Immunohistochemistry (IHC)", "Tissue", False, 168),
        ]
    },
    "Nuclear Medicine": {
        "tests": [
            ("PET Scan", "N/A", True, 24),
            ("PET-CT Scan", "N/A", True, 24),
            ("Bone Scan", "N/A", False, 6),
            ("Thyroid Scan", "N/A", False, 6),
            ("Renal Scan (DTPA/DMSA)", "N/A", False, 6),
            ("Cardiac Perfusion Scan (MPI)", "N/A", True, 24),
            ("Lung Ventilation-Perfusion Scan (V/Q Scan)", "N/A", False, 6),
        ]
    },
}

CENTER_CATEGORY_TREE = {
    "By Specialization": {
        "children": {
            "Multi-Specialty": [],
            "Pathology": [],
            "Imaging (Radiology/CT/MRI)": [],
            "Cardiac Diagnostics": [],
            "Neuro Diagnostics": [],
            "Genetic & Molecular": [],
        }
    },
    "By Ownership & Type": {
        "children": {
            "Government Diagnostic Center": [],
            "Private (Independent)": [],
            "Corporate Chain (Multi-branch)": [],
            "Hospital-Affiliated Lab": [],
        }
    },
}


class Command(BaseCommand):
    help = 'Populates database with updated TEST_TREE and CENTER_CATEGORY_TREE structure'

    def handle(self, *args, **options):
        self.stdout.write("Seeding database with UUID models, branches, and services...")
        sys.stdout.flush()

        self.stdout.write("Clearing existing data...")
        sys.stdout.flush()
        with transaction.atomic():
            LabBooking.objects.all().delete()
            DoctorBooking.objects.all().delete()
            AffiliationSchedule.objects.all().delete()
            DoctorAffiliation.objects.all().delete()
            Doctor.objects.all().delete()
            DoctorSpecialty.objects.all().delete()
            DiagnosticCenterTest.objects.all().delete()
            DiagnosticCenter.objects.all().delete()
            DiagnosticCenterCategory.objects.all().update(parent=None)
            DiagnosticCenterCategory.objects.all().delete()
            DiagnosticService.objects.all().delete()
            Hospital.objects.all().delete()
            HospitalCategory.objects.all().delete()
            HospitalService.objects.all().delete()
            Test.objects.all().delete()
            TestCategory.objects.all().update(parent=None)
            TestCategory.objects.all().delete()
            User.objects.all().delete()

        self.stdout.write("1. Creating Default Admin & Demo User...")
        sys.stdout.flush()

        with transaction.atomic():
            admin_user = User.objects.create_user(
            phone_number='01700000000',
            password='admin123456',
            first_name='System',
            last_name='Admin',
            is_staff=True,
            is_superuser=True
        )

        demo_user = User.objects.create_user(
            phone_number='01711111111',
            password='user123456',
            first_name='Demo',
            last_name='Patient'
        )

        self.stdout.write("2. Creating Doctor Specialties...")
        sys.stdout.flush()
        specialties_data = [
            {"name": "Cardiologist", "icon": "Heart", "description": "Heart & Vascular Care"},
            {"name": "Neurologist", "icon": "Brain", "description": "Brain & Nervous System"},
            {"name": "Gynecologist", "icon": "User", "description": "Women's Health & Maternity"},
            {"name": "Orthopedic", "icon": "Activity", "description": "Bones, Joints & Spine"},
            {"name": "Dermatologist", "icon": "Sparkles", "description": "Skin, Hair & Aesthetics"},
            {"name": "Pediatrician", "icon": "Baby", "description": "Child & Infant Care"},
            {"name": "General Physician", "icon": "Stethoscope", "description": "General Health & Fever"},
            {"name": "Gastroenterologist", "icon": "Flame", "description": "Digestive & Liver Care"},
            {"name": "ENT Specialist", "icon": "Ear", "description": "Ear, Nose & Throat"},
            {"name": "Oncologist", "icon": "ShieldAlert", "description": "Cancer Care & Chemotherapy"},
            {"name": "Pulmonologist", "icon": "Wind", "description": "Lungs & Respiratory Care"},
            {"name": "Nephrologist", "icon": "Droplet", "description": "Kidney Care & Dialysis"},
            {"name": "Eye Specialist", "icon": "Eye", "description": "Ophthalmology & Vision Care"},
        ]
        spec_objs = {}
        for sp in specialties_data:
            obj = DoctorSpecialty.objects.create(
                name=sp["name"],
                icon=sp["icon"],
                description=sp["description"]
            )
            spec_objs[sp["name"]] = obj

        self.stdout.write("3. Creating Hospital Categories...")
        sys.stdout.flush()
        hospital_categories = [
            {"name": "All Hospitals", "icon": "Building2", "description": "Show All Multi-Specialty Institutes", "count": 12},
            {"name": "Cardiac Hospitals", "icon": "Heart", "description": "Specialized Heart Institutes", "count": 4},
            {"name": "Eye Hospitals", "icon": "Sparkles", "description": "Ophthalmology & Vision Care", "count": 3},
            {"name": "Multi-Specialty", "icon": "Building2", "description": "General & In-Patient Hubs", "count": 8},
            {"name": "Orthopedic Centers", "icon": "Activity", "description": "Bone, Joint & Spine Care", "count": 3},
        ]
        hcat_objs = {}
        for hc in hospital_categories:
            obj = HospitalCategory.objects.create(
                name=hc["name"],
                icon=hc["icon"],
                description=hc["description"],
                count=hc["count"]
            )
            hcat_objs[hc["name"]] = obj

        self.stdout.write("4. Creating Hospital & Diagnostic Services Models...")
        sys.stdout.flush()
        hosp_services_data = [
            {"name": "24/7 ICU & In-patient", "icon": "Activity", "description": "Round the clock intensive care and bed admission"},
            {"name": "Specialist OPD Consultation", "icon": "Stethoscope", "description": "Out-patient specialist doctor visit chambers"},
            {"name": "Surgery & OT Suite", "icon": "ShieldCheck", "description": "Modern operation theater and laparoscopic surgery"},
            {"name": "24/7 Cardiac Emergency", "icon": "Clock", "description": "Emergency triage and rapid ambulance response"},
            {"name": "Phaco Cataract Surgery", "icon": "Eye", "description": "Advanced stitchless cataract surgery"},
            {"name": "Lasik Vision Correction", "icon": "Sparkles", "description": "Laser refractive eye vision correction"}
        ]
        hservice_objs = {}
        for hs in hosp_services_data:
            obj = HospitalService.objects.create(name=hs["name"], icon=hs["icon"], description=hs["description"])
            hservice_objs[hs["name"]] = obj

        diag_services_data = [
            {"name": "4D Ultrasonography & Color Doppler", "icon": "Activity", "description": "High resolution fetal & abdominal sonography"},
            {"name": "Digital X-Ray & Imaging", "icon": "FileText", "description": "Low radiation digital radiography"},
            {"name": "Automated Blood & Serology Lab", "icon": "FlaskConical", "description": "Fully automated clinical pathology and biochemistry"},
            {"name": "128-Slice CT Scan", "icon": "FileText", "description": "High-speed computed tomography body scan"},
            {"name": "High-Speed MRI Scan", "icon": "Brain", "description": "3.0 Tesla neuro and musculoskeletal MRI"},
            {"name": "Home Sample Collection", "icon": "Droplet", "description": "Doorstep blood sample collection by certified phlebotomists"}
        ]
        dservice_objs = {}
        for ds in diag_services_data:
            obj = DiagnosticService.objects.create(name=ds["name"], icon=ds["icon"], description=ds["description"])
            dservice_objs[ds["name"]] = obj

        self.stdout.write("5. Creating Diagnostic Center Categories from CENTER_CATEGORY_TREE...")
        sys.stdout.flush()
        dcc_objs = {}
        for top_cat_name, top_cat_data in CENTER_CATEGORY_TREE.items():
            top_obj = DiagnosticCenterCategory.objects.create(
                name=top_cat_name,
                description=f"Group for {top_cat_name}"
            )
            dcc_objs[top_cat_name] = top_obj
            if "children" in top_cat_data:
                for child_name in top_cat_data["children"]:
                    child_obj = DiagnosticCenterCategory.objects.create(
                        name=child_name,
                        parent=top_obj,
                        description=f"{child_name} classification"
                    )
                    dcc_objs[child_name] = child_obj

        self.stdout.write("6. Creating Test Categories & Tests from TEST_TREE...")
        sys.stdout.flush()
        test_objs = {}
        tcat_objs = {}
        
        cat_order = 1
        for top_cat_name, top_cat_data in TEST_TREE.items():
            top_cat_obj = TestCategory.objects.create(
                name=top_cat_name,
                order=cat_order
            )
            tcat_objs[top_cat_name] = top_cat_obj
            cat_order += 1
            
            # Check if it has children subcategories
            if "children" in top_cat_data:
                sub_order = 1
                for sub_cat_name, test_list in top_cat_data["children"].items():
                    sub_cat_obj = TestCategory.objects.create(
                        name=sub_cat_name,
                        parent=top_cat_obj,
                        order=sub_order
                    )
                    tcat_objs[sub_cat_name] = sub_cat_obj
                    sub_order += 1
                    
                    for test_tuple in test_list:
                        name, sample_type, fasting_req, report_hrs = test_tuple
                        code = f"TST-{len(test_objs) + 1:04d}"
                        prep_instructions = "Overnight fasting required." if fasting_req else "No specific preparation required."
                        test_obj = Test.objects.create(
                            category=sub_cat_obj,
                            name=name,
                            code=code,
                            sample_type=sample_type,
                            preparation_instructions=prep_instructions,
                            fasting_required=fasting_req,
                            report_time_hours=report_hrs,
                            description=f"Testing profile for {name}."
                        )
                        test_objs[name] = test_obj

            # Check if it has tests directly
            if "tests" in top_cat_data:
                for test_tuple in top_cat_data["tests"]:
                    name, sample_type, fasting_req, report_hrs = test_tuple
                    code = f"TST-{len(test_objs) + 1:04d}"
                    prep_instructions = "Overnight fasting required." if fasting_req else "No specific preparation required."
                    test_obj = Test.objects.create(
                        category=top_cat_obj,
                        name=name,
                        code=code,
                        sample_type=sample_type,
                        preparation_instructions=prep_instructions,
                        fasting_required=fasting_req,
                        report_time_hours=report_hrs,
                        description=f"Testing profile for {name}."
                    )
                    test_objs[name] = test_obj

        self.stdout.write(f"   Created {len(tcat_objs)} Test Categories and {len(test_objs)} Tests.")
        sys.stdout.flush()

        self.stdout.write("7. Creating Hospitals with Branch & Services...")
        sys.stdout.flush()
        hospitals_data = [
            {
                "name": "Ibn Sina Healthcare Group",
                "branch": "Dhanmondi Branch",
                "description": "Leading nationwide multi-specialty hospital offering inpatient surgery, ICU, and specialist OPD chambers.",
                "address": "House 48, Road 9/A, Dhanmondi",
                "district": "Dhaka",
                "division": "Dhaka",
                "city": "Dhaka",
                "phone": "+880 9610-010615",
                "email": "info@ibnsina.com.bd",
                "rating": 4.9,
                "reviews_count": 320,
                "open_timing": "24/7 Inpatient & OPD",
                "tagline": "Premier Multispecialty OPD & Inpatient Hospital in Dhanmondi",
                "badge": "Super Hospital",
                "logo": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80",
                "image": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80",
                "categories": [hcat_objs["Multi-Specialty"]],
                "services": [hservice_objs["24/7 ICU & In-patient"], hservice_objs["Specialist OPD Consultation"], hservice_objs["Surgery & OT Suite"]],
                "is_verified": True
            },
            {
                "name": "National Heart Foundation",
                "branch": "Mirpur Branch",
                "description": "Premier specialized cardiac and cardiovascular hospital institute in Bangladesh.",
                "address": "Mirpur-2",
                "district": "Dhaka",
                "division": "Dhaka",
                "city": "Dhaka",
                "phone": "+880 2-9006970",
                "email": "info@nhf.org.bd",
                "rating": 4.95,
                "reviews_count": 520,
                "open_timing": "24/7 Cardiac Emergency & OPD",
                "tagline": "Premier Specialized Cardiac Hospital in Bangladesh",
                "badge": "Cardiac Center",
                "logo": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80",
                "image": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80",
                "categories": [hcat_objs["Cardiac Hospitals"]],
                "services": [hservice_objs["24/7 Cardiac Emergency"], hservice_objs["Specialist OPD Consultation"], hservice_objs["24/7 ICU & In-patient"]],
                "is_verified": True
            },
            {
                "name": "Ispahani Islamia Eye Institute",
                "branch": "Farmgate Main Branch",
                "description": "Pioneer ophthalmic hospital network offering advanced eye surgery and consultations.",
                "address": "Farmgate, Sher-e-Bangla Nagar",
                "district": "Dhaka",
                "division": "Dhaka",
                "city": "Dhaka",
                "phone": "+880 9610-008080",
                "email": "info@islamiaeye.org",
                "rating": 4.9,
                "reviews_count": 480,
                "open_timing": "08:00 AM - 08:00 PM",
                "tagline": "Largest Pioneer Ophthalmic Care & Eye Hospital",
                "badge": "Eye Center",
                "logo": "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80",
                "image": "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80",
                "categories": [hcat_objs["Eye Hospitals"]],
                "services": [hservice_objs["Phaco Cataract Surgery"], hservice_objs["Lasik Vision Correction"], hservice_objs["Specialist OPD Consultation"]],
                "is_verified": True
            }
        ]
        hospital_objs = {}
        for h in hospitals_data:
            cats = h.pop("categories")
            srvs = h.pop("services")
            obj = Hospital.objects.create(**h)
            obj.categories.set(cats)
            obj.services.set(srvs)
            hospital_objs[h["name"]] = obj

        self.stdout.write("8. Creating Diagnostic Centers with Branch & Services...")
        sys.stdout.flush()
        centers_data = [
            {
                "name": "Popular Diagnostic Centre",
                "branch": "Panthapath Branch",
                "address": "House 16, Road 2, Dhanmondi / Panthapath",
                "district": "Dhaka",
                "division": "Dhaka",
                "phone": "+880 9613-787801",
                "email": "panthapath@populardiagnostic.com",
                "rating": 4.85,
                "reviews_count": 410,
                "open_timing": "07:00 AM - 11:00 PM",
                "tagline": "Nationwide Leading Diagnostic & Imaging Hub",
                "badge": "Verified Hospital",
                "logo": "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80",
                "image": "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80",
                "description": "Popular Medical Center providing state-of-the-art diagnostic imaging and visiting doctor chambers.",
                "categories": [dcc_objs["Multi-Specialty / General Diagnostic Center"], dcc_objs["Pathology"], dcc_objs["Corporate Chain (Multi-branch)"]],
                "services": [dservice_objs["Automated Blood & Serology Lab"], dservice_objs["128-Slice CT Scan"], dservice_objs["High-Speed MRI Scan"], dservice_objs["Home Sample Collection"]],
                "is_verified": True
            },
            {
                "name": "Ibn Sina Diagnostic Center",
                "branch": "Mirpur Branch",
                "address": "Plot 11, Avenue 1, Block A, Mirpur 10",
                "district": "Dhaka",
                "division": "Dhaka",
                "phone": "+880 9610-010616",
                "email": "mirpur@ibnsinadiagnostic.com",
                "rating": 4.8,
                "reviews_count": 180,
                "open_timing": "08:00 AM - 10:00 PM",
                "tagline": "Top Diagnostic & Pathology Center in Mirpur",
                "badge": "Verified Hospital",
                "logo": "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=600&q=80",
                "image": "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=600&q=80",
                "description": "Specialized diagnostic testing and visiting doctor OPD sessions in Mirpur.",
                "categories": [dcc_objs["Pathology"], dcc_objs["Corporate Chain (Multi-branch)"]],
                "services": [dservice_objs["4D Ultrasonography & Color Doppler"], dservice_objs["Digital X-Ray & Imaging"], dservice_objs["Automated Blood & Serology Lab"], dservice_objs["Home Sample Collection"]],
                "is_verified": True
            },
            {
                "name": "Chevron Healthcare",
                "branch": "Panchlaish Branch",
                "address": "12/12 O.R. Nizam Road, Panchlaish",
                "district": "Chittagong",
                "division": "Chittagong",
                "phone": "+880 31-652533",
                "email": "info@chevronbd.com",
                "rating": 4.9,
                "reviews_count": 260,
                "open_timing": "24/7 OPD & Diagnostic Service",
                "tagline": "Chittagong's Most Trusted Diagnostic & OPD Center",
                "badge": "Top Rated",
                "logo": "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=600&q=80",
                "image": "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=600&q=80",
                "description": "Chevron Clinical Laboratory offering round-the-clock OPD specialist doctor visits and diagnostics.",
                "categories": [dcc_objs["Imaging (Radiology/CT/MRI)"], dcc_objs["Private (Independent)"]],
                "services": [dservice_objs["Digital X-Ray & Imaging"], dservice_objs["Automated Blood & Serology Lab"], dservice_objs["Home Sample Collection"]],
                "is_verified": True
            },
            {
                "name": "Labaid Diagnostics",
                "branch": "Laxmipur Branch",
                "address": "Laxmipur, Rajshahi",
                "district": "Rajshahi",
                "division": "Rajshahi",
                "phone": "+880 721-772211",
                "email": "rajshahi@labaidgroup.com",
                "rating": 4.85,
                "reviews_count": 190,
                "open_timing": "08:00 AM - 09:30 PM",
                "tagline": "Super Specialist Diagnostic & Clinical Lab",
                "badge": "Super Hospital",
                "logo": "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=600&q=80",
                "image": "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=600&q=80",
                "description": "Labaid Diagnostic Laxmipur is Rajshahi's premier center for pathology and digital diagnostic radiology.",
                "categories": [dcc_objs["Cardiac Diagnostics"], dcc_objs["Corporate Chain (Multi-branch)"]],
                "services": [dservice_objs["Automated Blood & Serology Lab"], dservice_objs["4D Ultrasonography & Color Doppler"]],
                "is_verified": True
            },
            {
                "name": "National Institute of Neurosciences Lab",
                "branch": "Agargaon Branch",
                "address": "Sher-e-Bangla Nagar, Agargaon",
                "district": "Dhaka",
                "division": "Dhaka",
                "phone": "+880 2-9137300",
                "email": "info@nins.gov.bd",
                "rating": 4.75,
                "reviews_count": 310,
                "open_timing": "24/7 Government Emergency & Diagnostic",
                "tagline": "National Specialized Government Neuro Diagnostics Center",
                "badge": "Govt Institute",
                "logo": "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80",
                "image": "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80",
                "description": "Government specialized institute for neurology, neurosurgery, EEG, EMG, and neuro-imaging.",
                "categories": [dcc_objs["Neuro Diagnostics"], dcc_objs["Government Diagnostic Center"]],
                "services": [dservice_objs["High-Speed MRI Scan"], dservice_objs["128-Slice CT Scan"], dservice_objs["Digital X-Ray & Imaging"]],
                "is_verified": True
            },
            {
                "name": "icddr,b Diagnostic Center",
                "branch": "Mohakhali Branch",
                "address": "68 Shaheed Tajuddin Ahmed Sarani, Mohakhali",
                "district": "Dhaka",
                "division": "Dhaka",
                "phone": "+880 2-9840521",
                "email": "info@icddrb.org",
                "rating": 4.95,
                "reviews_count": 640,
                "open_timing": "07:30 AM - 08:30 PM",
                "tagline": "World-Class International Research & Molecular Lab",
                "badge": "Top Research Lab",
                "logo": "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80",
                "image": "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80",
                "description": "Internationally accredited reference diagnostic lab providing genetic, molecular, and advanced pathology tests.",
                "categories": [dcc_objs["Genetic & Molecular"], dcc_objs["Pathology"], dcc_objs["Private (Independent)"]],
                "services": [dservice_objs["Automated Blood & Serology Lab"], dservice_objs["Home Sample Collection"]],
                "is_verified": True
            },
            {
                "name": "Evercare Diagnostic Wing",
                "branch": "Bashundhara Branch",
                "address": "Plot 81, Block E, Bashundhara R/A",
                "district": "Dhaka",
                "division": "Dhaka",
                "phone": "+880 9666-710678",
                "email": "diagnostic@evercarebd.com",
                "rating": 4.9,
                "reviews_count": 420,
                "open_timing": "24/7 Diagnostic & Hospital Lab",
                "tagline": "JCI Accredited Hospital-Affiliated Diagnostic Wing",
                "badge": "JCI Accredited",
                "logo": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80",
                "image": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80",
                "description": "Hospital-affiliated comprehensive diagnostic center offering high-end MRI, PET-CT, molecular genetics, and pathology.",
                "categories": [dcc_objs["Hospital-Affiliated Lab"], dcc_objs["Imaging (Radiology/CT/MRI)"], dcc_objs["Multi-Specialty / General Diagnostic Center"]],
                "services": [dservice_objs["High-Speed MRI Scan"], dservice_objs["128-Slice CT Scan"], dservice_objs["Automated Blood & Serology Lab"], dservice_objs["Home Sample Collection"]],
                "is_verified": True
            }
        ]
        center_objs = {}
        for c in centers_data:
            cats = c.pop("categories")
            srvs = c.pop("services")
            obj = DiagnosticCenter.objects.create(**c)
            obj.categories.set(cats)
            obj.services.set(srvs)
            center_objs[c["name"]] = obj

        self.stdout.write("9. Linking Tests to Diagnostic Centers (DiagnosticCenterTest)...")
        sys.stdout.flush()

        sample_tests_linking = [
            # Popular Diagnostic
            (center_objs["Popular Diagnostic Centre"], "Complete Blood Count (CBC)", 500.00, 650.00, "23% OFF", "6 Hours", True, True),
            (center_objs["Popular Diagnostic Centre"], "Blood Sugar - Fasting", 250.00, 300.00, "17% OFF", "4 Hours", True, True),
            (center_objs["Popular Diagnostic Centre"], "Chest X-ray", 800.00, 1000.00, "20% OFF", "2 Hours", True, False),
            (center_objs["Popular Diagnostic Centre"], "CT Brain", 4800.00, 6200.00, "22% OFF", "4 Hours", True, False),
            (center_objs["Popular Diagnostic Centre"], "Thyroid Profile (T3, T4, TSH)", 1100.00, 1500.00, "26% OFF", "24 Hours", True, True),
            (center_objs["Popular Diagnostic Centre"], "Lipid Profile (Cholesterol, Triglycerides, HDL, LDL)", 950.00, 1300.00, "27% OFF", "12 Hours", True, True),

            # Ibn Sina Diagnostic
            (center_objs["Ibn Sina Diagnostic Center"], "Complete Blood Count (CBC)", 400.00, 550.00, "27% OFF", "4 Hours", True, True),
            (center_objs["Ibn Sina Diagnostic Center"], "Abdominal USG (Whole Abdomen)", 1500.00, 2000.00, "25% OFF", "2 Hours", True, False),
            (center_objs["Ibn Sina Diagnostic Center"], "Lipid Profile (Cholesterol, Triglycerides, HDL, LDL)", 900.00, 1300.00, "30% OFF", "12 Hours", True, True),
            (center_objs["Ibn Sina Diagnostic Center"], "Widal Test (Typhoid)", 450.00, 600.00, "25% OFF", "12 Hours", True, True),
            (center_objs["Ibn Sina Diagnostic Center"], "HbA1c", 800.00, 1000.00, "20% OFF", "24 Hours", True, True),

            # Chevron Healthcare
            (center_objs["Chevron Healthcare"], "Complete Blood Count (CBC)", 450.00, 600.00, "25% OFF", "6 Hours", True, True),
            (center_objs["Chevron Healthcare"], "ECG (Resting)", 600.00, 800.00, "25% OFF", "1 Hour", True, False),
            (center_objs["Chevron Healthcare"], "MRI Brain", 6500.00, 8500.00, "24% OFF", "6 Hours", True, False),
            (center_objs["Chevron Healthcare"], "CT Chest", 4500.00, 6000.00, "25% OFF", "4 Hours", True, False),

            # Labaid Diagnostics
            (center_objs["Labaid Diagnostics"], "HbA1c", 850.00, 1100.00, "23% OFF", "24 Hours", True, True),
            (center_objs["Labaid Diagnostics"], "Lipid Profile (Cholesterol, Triglycerides, HDL, LDL)", 950.00, 1400.00, "32% OFF", "12 Hours", True, True),
            (center_objs["Labaid Diagnostics"], "2D Echo", 2200.00, 2800.00, "21% OFF", "2 Hours", True, False),
            (center_objs["Labaid Diagnostics"], "TMT (Treadmill Test)", 2500.00, 3200.00, "22% OFF", "2 Hours", True, False),

            # National Institute of Neurosciences Lab
            (center_objs["National Institute of Neurosciences Lab"], "EEG - Routine", 1200.00, 1600.00, "25% OFF", "4 Hours", True, False),
            (center_objs["National Institute of Neurosciences Lab"], "EMG (Electromyography)", 2200.00, 2800.00, "21% OFF", "4 Hours", True, False),
            (center_objs["National Institute of Neurosciences Lab"], "NCV (Nerve Conduction Velocity)", 2500.00, 3200.00, "22% OFF", "4 Hours", True, False),
            (center_objs["National Institute of Neurosciences Lab"], "MRI Brain", 5500.00, 7000.00, "21% OFF", "6 Hours", True, False),
            (center_objs["National Institute of Neurosciences Lab"], "CT Brain", 3800.00, 5000.00, "24% OFF", "4 Hours", True, False),

            # icddr,b Diagnostic Center
            (center_objs["icddr,b Diagnostic Center"], "PCR Test (viral/bacterial detection)", 3200.00, 4000.00, "20% OFF", "24 Hours", True, True),
            (center_objs["icddr,b Diagnostic Center"], "DNA Fingerprinting/Paternity Test", 8500.00, 10500.00, "19% OFF", "168 Hours", True, True),
            (center_objs["icddr,b Diagnostic Center"], "Karyotyping (Chromosomal Analysis)", 6500.00, 8000.00, "19% OFF", "336 Hours", True, True),
            (center_objs["icddr,b Diagnostic Center"], "Urine Culture & Sensitivity", 750.00, 950.00, "21% OFF", "72 Hours", True, True),
            (center_objs["icddr,b Diagnostic Center"], "Thyroid Profile (T3, T4, TSH)", 1200.00, 1500.00, "20% OFF", "24 Hours", True, True),

            # Evercare Diagnostic Wing
            (center_objs["Evercare Diagnostic Wing"], "MRI Brain", 7500.00, 9500.00, "21% OFF", "6 Hours", True, False),
            (center_objs["Evercare Diagnostic Wing"], "PET-CT Scan", 32000.00, 38000.00, "16% OFF", "24 Hours", True, False),
            (center_objs["Evercare Diagnostic Wing"], "Tissue Biopsy", 3500.00, 4500.00, "22% OFF", "168 Hours", True, False),
            (center_objs["Evercare Diagnostic Wing"], "Complete Blood Count (CBC)", 600.00, 750.00, "20% OFF", "4 Hours", True, True),
        ]

        for center, test_name, price, orig_price, discount, rep_time, is_avail, home_coll in sample_tests_linking:
            if test_name in test_objs:
                DiagnosticCenterTest.objects.create(
                    center=center,
                    test=test_objs[test_name],
                    price=price,
                    original_price=orig_price,
                    discount=discount,
                    report_time=rep_time,
                    is_available=is_avail,
                    home_sample_collection=home_coll
                )

        self.stdout.write("10. Creating Doctors & Affiliations...")
        sys.stdout.flush()

        doctors_data = [
            {
                "name": "Prof. Dr. M. A. Zaman",
                "qualification": "MBBS, FCPS (Medicine), MD (Cardiology), FACC",
                "experience": "25+ Yrs Exp.",
                "specs": ["Cardiologist"],
                "hospital": hospital_objs["National Heart Foundation"],
                "dc": None,
                "type": "OPD",
                "fee": 1500,
                "schedules": [("Sat", 17, 21), ("Mon", 17, 21), ("Wed", 17, 21)]
            },
            {
                "name": "Prof. Dr. Nazrul Islam",
                "qualification": "MBBS, FCPS (Ophthalmology), DO",
                "experience": "20+ Yrs Exp.",
                "specs": ["Eye Specialist"],
                "hospital": hospital_objs["Ispahani Islamia Eye Institute"],
                "dc": None,
                "type": "OPD",
                "fee": 1200,
                "schedules": [("Sun", 16, 20), ("Tue", 16, 20), ("Thu", 16, 20)]
            },
            {
                "name": "Prof. Dr. A. K. M. Fazlul Haque",
                "qualification": "MBBS, FCPS (Medicine), MD (Cardiology), FACC (USA)",
                "experience": "22+ Yrs Exp.",
                "specs": ["Cardiologist"],
                "hospital": hospital_objs["Ibn Sina Healthcare Group"],
                "dc": None,
                "type": "OPD",
                "fee": 1200,
                "schedules": [("Sat", 17, 21), ("Mon", 17, 21), ("Wed", 17, 21)]
            },
            {
                "name": "Dr. Sharmin Sultana",
                "qualification": "MBBS, FCPS (Obstetrics & Gynecology), MS",
                "experience": "14+ Yrs Exp.",
                "specs": ["Gynecologist"],
                "hospital": hospital_objs["Ibn Sina Healthcare Group"],
                "dc": None,
                "type": "In-patient",
                "fee": 1000,
                "schedules": [("Everyday", 9, 13)]
            },
            {
                "name": "Prof. Dr. Syed Atiqul Haq",
                "qualification": "MBBS, FCPS (Medicine), MD (Neurology), FRCP",
                "experience": "25+ Yrs Exp.",
                "specs": ["Neurologist"],
                "hospital": None,
                "dc": center_objs["Popular Diagnostic Centre"],
                "type": "OPD",
                "fee": 1500,
                "schedules": [("Sat", 18, 21.5), ("Mon", 18, 21.5)]
            },
            {
                "name": "Dr. Md. Tariqul Islam",
                "qualification": "MBBS, FCPS (Medicine), MRCP (London)",
                "experience": "16+ Yrs Exp.",
                "specs": ["General Physician"],
                "hospital": None,
                "dc": center_objs["Popular Diagnostic Centre"],
                "type": "OPD",
                "fee": 800,
                "schedules": [("Mon", 9, 13), ("Tue", 9, 13), ("Wed", 9, 13)]
            },
            {
                "name": "Dr. Chowdhury Farhan Hossain",
                "qualification": "MBBS, MS (Orthopedic Surgery), Fellow Spine Surgery",
                "experience": "18+ Yrs Exp.",
                "specs": ["Orthopedic"],
                "hospital": None,
                "dc": center_objs["Chevron Healthcare"],
                "type": "OPD",
                "fee": 1200,
                "schedules": [("Sun", 17, 21), ("Tue", 17, 21)]
            },
            {
                "name": "Dr. M. A. Bashar",
                "qualification": "MBBS, MD (Nephrology), FCPS (Medicine)",
                "experience": "17+ Yrs Exp.",
                "specs": ["Nephrologist"],
                "hospital": None,
                "dc": center_objs["Labaid Diagnostics"],
                "type": "OPD",
                "fee": 1200,
                "schedules": [("Thu", 15, 19.5), ("Fri", 15, 19.5)]
            }
        ]

        for ddata in doctors_data:
            doc = Doctor.objects.create(
                name=ddata["name"],
                qualification=ddata["qualification"],
                experience=ddata["experience"]
            )
            for spec_name in ddata["specs"]:
                if spec_name in spec_objs:
                    doc.specialties.add(spec_objs[spec_name])

            aff = DoctorAffiliation.objects.create(
                doctor=doc,
                hospital=ddata["hospital"],
                diagnostic_center=ddata["dc"],
                consultation_type=ddata["type"],
                fee=ddata["fee"]
            )
            for day, start_h, end_h in ddata["schedules"]:
                sh = int(start_h)
                sm = int((start_h - sh) * 60)
                eh = int(end_h)
                em = int((end_h - eh) * 60)
                AffiliationSchedule.objects.create(
                    affiliation=aff,
                    day_of_week=day,
                    start_time=datetime.time(sh, sm),
                    end_time=datetime.time(eh, em)
                )

        self.stdout.write(self.style.SUCCESS("Successfully populated database with updated TEST_TREE and CENTER_CATEGORY_TREE!"))
        sys.stdout.flush()
