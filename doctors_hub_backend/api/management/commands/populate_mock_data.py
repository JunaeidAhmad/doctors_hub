import sys
import datetime
from django.core.management.base import BaseCommand
from django.db import connection
from api.models import (
    User, DoctorSpecialty, HospitalCategory, HospitalService, Hospital,
    TestCategory, Test, DiagnosticCenterCategory, DiagnosticService, DiagnosticCenter, DiagnosticCenterTest,
    Doctor, DoctorAffiliation, AffiliationSchedule, DoctorBooking, LabBooking
)


class Command(BaseCommand):
    help = 'Populates complete database with Hospitals, Diagnostic Centers, Services, Categories, Tests, Doctors, and Schedules'

    def handle(self, *args, **options):
        self.stdout.write("Seeding database with UUID models, branches, and services...")
        sys.stdout.flush()

        self.stdout.write("Clearing existing data with CASCADE...")
        sys.stdout.flush()
        with connection.cursor() as cursor:
            cursor.execute("""
                TRUNCATE TABLE 
                    api_affiliationschedule, api_doctorbooking, api_labbooking,
                    api_doctoraffiliation, api_doctor_specialties, api_doctor,
                    api_diagnosticcentertest, api_diagnosticcenter_categories, api_diagnosticcenter_services,
                    api_diagnosticcenter, api_hospitalservice, api_diagnosticservice,
                    api_hospital_categories, api_hospital_services, api_hospital,
                    api_diagnosticcentercategory, api_test, api_testcategory,
                    api_hospitalcategory, api_doctorspecialty, api_user
                CASCADE;
            """)

        self.stdout.write("1. Creating Default Admin & Demo User...")
        sys.stdout.flush()
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
            {"name": "All Partners", "icon": "Building2", "description": "Show All Multi-Specialty Institutes", "count": 12},
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

        self.stdout.write("5. Creating Diagnostic Center Categories...")
        sys.stdout.flush()
        cat_private = DiagnosticCenterCategory.objects.create(
            name="Private Diagnostic Chain",
            icon="Building2",
            description="Nationwide automated lab networks"
        )
        cat_gov = DiagnosticCenterCategory.objects.create(
            name="Government & Public Labs",
            icon="ShieldCheck",
            description="Government subsidized pathology centers"
        )
        cat_specialized = DiagnosticCenterCategory.objects.create(
            name="Specialized Diagnostic Centers",
            icon="Activity",
            description="Focused imaging and advanced pathology"
        )

        dcc_pathology = DiagnosticCenterCategory.objects.create(
            name="Pathology & Clinical Biochemistry Labs",
            parent=cat_private,
            icon="FlaskConical",
            description="Full blood & hormone diagnostic hubs"
        )
        dcc_radiology = DiagnosticCenterCategory.objects.create(
            name="Advanced Radiology & Imaging Hubs",
            parent=cat_private,
            icon="FileText",
            description="High resolution MRI, CT scan & 4D USG"
        )
        dcc_cardiac_center = DiagnosticCenterCategory.objects.create(
            name="Cardiac Diagnostics & Echo Centers",
            parent=cat_specialized,
            icon="Heart",
            description="Cardiovascular screening & Doppler labs"
        )

        self.stdout.write("6. Creating Test Categories & Tests...")
        sys.stdout.flush()
        tcat_pathology = TestCategory.objects.create(name="Pathology & Laboratory", icon="FlaskConical", order=1)
        tcat_radiology = TestCategory.objects.create(name="Radiology & Medical Imaging", icon="FileText", order=2)
        tcat_cardiology = TestCategory.objects.create(name="Cardiology Diagnostics", icon="Heart", order=3)

        tcat_blood = TestCategory.objects.create(name="Routine Blood Profiles", parent=tcat_pathology, icon="Droplet", order=1)
        tcat_hormone = TestCategory.objects.create(name="Hormone & Endocrine Profiles", parent=tcat_pathology, icon="Sparkles", order=2)
        tcat_ct_mri = TestCategory.objects.create(name="CT Scan & MRI Imaging", parent=tcat_radiology, icon="FileText", order=1)
        tcat_usg = TestCategory.objects.create(name="Ultrasonography (USG)", parent=tcat_radiology, icon="Activity", order=2)
        tcat_lipid = TestCategory.objects.create(name="Lipid & Cardiac Profiles", parent=tcat_cardiology, icon="Heart", order=1)

        tests_data = [
            {
                "name": "Blood Test (CBC)",
                "category": tcat_blood,
                "code": "LAB-CBC-01",
                "sample_type": "Blood (EDTA)",
                "preparation_instructions": "No specific fasting required.",
                "fasting_required": False,
                "report_time_hours": 6,
                "description": "Complete Blood Count measuring RBC, WBC, ESR, Platelets, and Hemoglobin."
            },
            {
                "name": "Thyroid Profile (T3, T4, TSH)",
                "category": tcat_hormone,
                "code": "LAB-THY-02",
                "sample_type": "Blood Serum",
                "preparation_instructions": "Morning blood sample recommended.",
                "fasting_required": False,
                "report_time_hours": 12,
                "description": "Accurate endocrine hormone evaluation for thyroid disorders."
            },
            {
                "name": "CT Scan (Brain / Chest)",
                "category": tcat_ct_mri,
                "code": "RAD-CT-01",
                "sample_type": "Imaging Scan",
                "preparation_instructions": "Fasting 4 hours if contrast dye is required.",
                "fasting_required": True,
                "report_time_hours": 24,
                "description": "High-resolution computed tomography scan for detailed internal organ imaging."
            },
            {
                "name": "USG (Ultrasound Abdomen)",
                "category": tcat_usg,
                "code": "RAD-USG-01",
                "sample_type": "Sonography",
                "preparation_instructions": "Fasting 6-8 hours with full bladder required.",
                "fasting_required": True,
                "report_time_hours": 4,
                "description": "Full abdominal 4D ultrasonography for liver, kidney, and pelvic examination."
            },
            {
                "name": "Lipid Profile (Cholesterol)",
                "category": tcat_lipid,
                "code": "LAB-LIP-01",
                "sample_type": "Blood Serum",
                "preparation_instructions": "Overnight fasting 8-12 hours required.",
                "fasting_required": True,
                "report_time_hours": 12,
                "description": "Measures Total Cholesterol, HDL, LDL, Triglycerides, and Cardiac Risk Index."
            }
        ]
        test_objs = {}
        for t in tests_data:
            obj = Test.objects.create(**t)
            test_objs[t["name"]] = obj

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
                "badge": "Super Partner",
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
                "badge": "Verified Partner",
                "logo": "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80",
                "image": "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80",
                "description": "Popular Medical Center providing state-of-the-art diagnostic imaging and visiting doctor chambers.",
                "categories": [dcc_pathology, dcc_radiology],
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
                "badge": "Verified Partner",
                "logo": "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=600&q=80",
                "image": "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=600&q=80",
                "description": "Specialized diagnostic testing and visiting doctor OPD sessions in Mirpur.",
                "categories": [dcc_pathology],
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
                "categories": [dcc_pathology, dcc_radiology],
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
                "badge": "Super Partner",
                "logo": "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=600&q=80",
                "image": "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=600&q=80",
                "description": "Labaid Diagnostic Laxmipur is Rajshahi's premier center for pathology and digital diagnostic radiology.",
                "categories": [dcc_pathology, dcc_cardiac_center],
                "services": [dservice_objs["Automated Blood & Serology Lab"], dservice_objs["4D Ultrasonography & Color Doppler"]],
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
        
        DiagnosticCenterTest.objects.create(
            center=center_objs["Popular Diagnostic Centre"],
            test=test_objs["Blood Test (CBC)"],
            price=500.00,
            original_price=650.00,
            discount="23% OFF",
            report_time="8 Hours",
            is_available=True,
            home_sample_collection=True
        )
        DiagnosticCenterTest.objects.create(
            center=center_objs["Popular Diagnostic Centre"],
            test=test_objs["CT Scan (Brain / Chest)"],
            price=4800.00,
            original_price=6200.00,
            discount="22% OFF",
            report_time="12 Hours",
            is_available=True,
            home_sample_collection=False
        )
        DiagnosticCenterTest.objects.create(
            center=center_objs["Popular Diagnostic Centre"],
            test=test_objs["Thyroid Profile (T3, T4, TSH)"],
            price=1100.00,
            original_price=1500.00,
            discount="26% OFF",
            report_time="Same Day",
            is_available=True,
            home_sample_collection=True
        )

        DiagnosticCenterTest.objects.create(
            center=center_objs["Ibn Sina Diagnostic Center"],
            test=test_objs["Blood Test (CBC)"],
            price=400.00,
            original_price=550.00,
            discount="27% OFF",
            report_time="Same Day (4 Hours)",
            is_available=True,
            home_sample_collection=True
        )
        DiagnosticCenterTest.objects.create(
            center=center_objs["Ibn Sina Diagnostic Center"],
            test=test_objs["USG (Ultrasound Abdomen)"],
            price=1500.00,
            original_price=2000.00,
            discount="25% OFF",
            report_time="Same Day",
            is_available=True,
            home_sample_collection=False
        )
        DiagnosticCenterTest.objects.create(
            center=center_objs["Ibn Sina Diagnostic Center"],
            test=test_objs["Lipid Profile (Cholesterol)"],
            price=900.00,
            original_price=1300.00,
            discount="30% OFF",
            report_time="12 Hours",
            is_available=True,
            home_sample_collection=True
        )

        DiagnosticCenterTest.objects.create(
            center=center_objs["Chevron Healthcare"],
            test=test_objs["Blood Test (CBC)"],
            price=450.00,
            original_price=600.00,
            discount="25% OFF",
            report_time="Same Day",
            is_available=True,
            home_sample_collection=True
        )
        DiagnosticCenterTest.objects.create(
            center=center_objs["Chevron Healthcare"],
            test=test_objs["USG (Ultrasound Abdomen)"],
            price=1400.00,
            original_price=1800.00,
            discount="22% OFF",
            report_time="Same Day",
            is_available=True,
            home_sample_collection=False
        )

        DiagnosticCenterTest.objects.create(
            center=center_objs["Labaid Diagnostics"],
            test=test_objs["Lipid Profile (Cholesterol)"],
            price=950.00,
            original_price=1400.00,
            discount="32% OFF",
            report_time="12 Hours",
            is_available=True,
            home_sample_collection=True
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

        self.stdout.write(self.style.SUCCESS("Successfully populated database with UUID models, branches, and services!"))
        sys.stdout.flush()
