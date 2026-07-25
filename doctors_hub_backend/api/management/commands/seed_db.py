from django.core.management.base import BaseCommand
from api.models import Specialty, PathologyTest, Chamber, Doctor

class Command(BaseCommand):
    help = 'Seeds NeonDB database with mock data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        # 1. SPECIALTIES
        SPECIALTIES = [
            { "id": "cardiology", "name": "Cardiologist", "icon": "Heart", "description": "Heart & Vascular Care" },
            { "id": "neurology", "name": "Neurologist", "icon": "Brain", "description": "Brain & Nervous System" },
            { "id": "gynecology", "name": "Gynecologist", "icon": "User", "description": "Women's Health & Maternity" },
            { "id": "orthopedics", "name": "Orthopedic", "icon": "Activity", "description": "Bones, Joints & Spine" },
            { "id": "dermatology", "name": "Dermatologist", "icon": "Sparkles", "description": "Skin, Hair & Aesthetics" },
            { "id": "pediatrics", "name": "Pediatrician", "icon": "Baby", "description": "Child & Infant Care" },
            { "id": "medicine", "name": "General Physician", "icon": "Stethoscope", "description": "General Health & Fever" },
            { "id": "gastroenterology", "name": "Gastroenterologist", "icon": "Flame", "description": "Digestive & Liver Care" },
            { "id": "ent", "name": "ENT Specialist", "icon": "Ear", "description": "Ear, Nose & Throat" },
            { "id": "oncology", "name": "Oncologist", "icon": "ShieldAlert", "description": "Cancer Care & Chemotherapy" },
            { "id": "pulmonology", "name": "Pulmonologist", "icon": "Wind", "description": "Lungs & Respiratory Care" },
            { "id": "nephrology", "name": "Nephrologist", "icon": "Droplet", "description": "Kidney Care & Dialysis" }
        ]

        specialty_map = {}
        for sp in SPECIALTIES:
            obj, created = Specialty.objects.update_or_create(
                id=sp["id"],
                defaults={
                    "name": sp["name"],
                    "icon": sp["icon"],
                    "description": sp["description"]
                }
            )
            specialty_map[sp["name"].lower()] = obj
            specialty_map[sp["id"].lower()] = obj

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(SPECIALTIES)} specialties'))

        # 2. PATHOLOGY TESTS
        PATHOLOGY_TESTS = [
            {
                "id": "cbc",
                "name": "Blood Test (CBC)",
                "category": "Routine Blood Profiles",
                "price": 450,
                "originalPrice": 600,
                "discount": "25% OFF",
                "fastingRequired": False,
                "reportTime": "Same Day (6 Hours)",
                "description": "Complete Blood Count measuring RBC, WBC, ESR, Platelets, and Hemoglobin."
            },
            {
                "id": "ct-scan",
                "name": "CT Scan (Brain / Chest)",
                "category": "Advanced Radiology",
                "price": 4500,
                "originalPrice": 6000,
                "discount": "25% OFF",
                "fastingRequired": True,
                "reportTime": "24 Hours",
                "description": "High-resolution computed tomography scan for detailed internal organ imaging."
            },
            {
                "id": "usg",
                "name": "USG (Ultrasound Abdomen)",
                "category": "Sonography",
                "price": 1500,
                "originalPrice": 2000,
                "discount": "25% OFF",
                "fastingRequired": True,
                "reportTime": "Same Day",
                "description": "Full abdominal 4D ultrasonography for liver, kidney, and pelvic examination."
            },
            {
                "id": "full-body",
                "name": "Executive Full Body Package",
                "category": "Preventive Package",
                "price": 3200,
                "originalPrice": 6500,
                "discount": "50% OFF",
                "fastingRequired": True,
                "reportTime": "24 Hours",
                "description": "Comprehensive 80+ parameters including Lipid, Liver, Kidney, Thyroid, SGPT, and HbA1c."
            },
            {
                "id": "thyroid",
                "name": "Thyroid Profile (T3, T4, TSH)",
                "category": "Hormone Profile",
                "price": 850,
                "originalPrice": 1200,
                "discount": "30% OFF",
                "fastingRequired": False,
                "reportTime": "Same Day",
                "description": "Accurate endocrine hormone evaluation for thyroid disorders."
            },
            {
                "id": "lipid",
                "name": "Lipid Profile (Cholesterol)",
                "category": "Cardiac Risk",
                "price": 950,
                "originalPrice": 1400,
                "discount": "32% OFF",
                "fastingRequired": True,
                "reportTime": "12 Hours",
                "description": "Measures Total Cholesterol, HDL, LDL, Triglycerides, and Cardiac Risk Index."
            }
        ]

        for pt in PATHOLOGY_TESTS:
            PathologyTest.objects.update_or_create(
                id=pt["id"],
                defaults={
                    "name": pt["name"],
                    "category": pt["category"],
                    "price": pt["price"],
                    "original_price": pt["originalPrice"],
                    "discount": pt["discount"],
                    "fasting_required": pt["fastingRequired"],
                    "report_time": pt["reportTime"],
                    "description": pt["description"]
                }
            )

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(PATHOLOGY_TESTS)} pathology tests'))

        # 3. CHAMBERS & DOCTORS
        OPD_CHAMBERS = [
            {
                "id": "ibn-sina-dhanmondi",
                "name": "Ibn Sina Diagnostic & OPD Hub",
                "location": "House 48, Road 9/A, Dhanmondi, Dhaka",
                "city": "Dhaka",
                "verified": True,
                "rating": 4.9,
                "reviewsCount": 320,
                "openTiming": "07:30 AM - 10:30 PM",
                "contactPhone": "+880 9610-010615 / +880 1711-234567",
                "tagline": "Premier Multispecialty OPD & Diagnostic Center in Bangladesh",
                "badge": "Super Partner",
                "image": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80",
                "doctors": [
                    {
                        "id": "doc-1",
                        "name": "Prof. Dr. A. K. M. Fazlul Haque",
                        "specialty": "Cardiologist",
                        "qualification": "MBBS, FCPS (Medicine), MD (Cardiology), FACC (USA)",
                        "experience": "22+ Yrs Exp.",
                        "visitDays": "Sat, Mon, Wed",
                        "visitTime": "05:00 PM - 09:00 PM",
                        "fee": 1200,
                        "slots": ["05:15 PM", "06:00 PM", "06:45 PM", "07:30 PM", "08:15 PM"]
                    },
                    {
                        "id": "doc-2",
                        "name": "Dr. Sharmin Sultana",
                        "specialty": "Gynecologist",
                        "qualification": "MBBS, FCPS (Obstetrics & Gynecology), MS",
                        "experience": "14+ Yrs Exp.",
                        "visitDays": "Sun, Tue, Thu",
                        "visitTime": "04:00 PM - 08:00 PM",
                        "fee": 1000,
                        "slots": ["04:15 PM", "05:00 PM", "05:45 PM", "06:30 PM"]
                    },
                    {
                        "id": "doc-3",
                        "name": "Prof. Dr. Syed Atiqul Haq",
                        "specialty": "Neurologist",
                        "qualification": "MBBS, FCPS (Medicine), MD (Neurology), FRCP",
                        "experience": "25+ Yrs Exp.",
                        "visitDays": "Everyday",
                        "visitTime": "06:00 PM - 09:30 PM",
                        "fee": 1500,
                        "slots": ["06:30 PM", "07:15 PM", "08:00 PM", "08:45 PM"]
                    }
                ]
            },
            {
                "id": "popular-panthapath",
                "name": "Popular Diagnostic Centre & Super Clinic",
                "location": "House 16, Road 2, Dhanmondi / Panthapath, Dhaka",
                "city": "Dhaka",
                "verified": True,
                "rating": 4.85,
                "reviewsCount": 410,
                "openTiming": "07:00 AM - 11:00 PM",
                "contactPhone": "+880 9613-787801 / +880 1819-876543",
                "tagline": "Nationwide Leading Diagnostic & Specialist Doctor OPD Network",
                "badge": "Verified Partner",
                "image": "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80",
                "doctors": [
                    {
                        "id": "doc-4",
                        "name": "Dr. Md. Tariqul Islam",
                        "specialty": "General Physician",
                        "qualification": "MBBS, FCPS (Medicine), MRCP (London)",
                        "experience": "16+ Yrs Exp.",
                        "visitDays": "Mon - Sat",
                        "visitTime": "09:00 AM - 01:00 PM",
                        "fee": 800,
                        "slots": ["09:30 AM", "10:15 AM", "11:00 AM", "11:45 AM"]
                    },
                    {
                        "id": "doc-5",
                        "name": "Dr. Nusrat Jahan",
                        "specialty": "Dermatologist",
                        "qualification": "MBBS, DDV (BSMMU), FCPS (Skin & VD)",
                        "experience": "11+ Yrs Exp.",
                        "visitDays": "Sat, Mon, Wed",
                        "visitTime": "04:30 PM - 08:30 PM",
                        "fee": 1000,
                        "slots": ["05:00 PM", "05:45 PM", "06:30 PM", "07:15 PM"]
                    }
                ]
            },
            {
                "id": "chevron-chittagong",
                "name": "Chevron Clinical Laboratory & OPD Hub",
                "location": "12/12 O.R. Nizam Road, Panchlaish, Chittagong",
                "city": "Chittagong",
                "verified": True,
                "rating": 4.9,
                "reviewsCount": 260,
                "openTiming": "24/7 OPD & Diagnostic Service",
                "contactPhone": "+880 31-652533 / +880 1713-112233",
                "tagline": "Chittagong's Most Trusted Multispecialty Consultation Center",
                "badge": "Top Rated",
                "image": "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=600&q=80",
                "doctors": [
                    {
                        "id": "doc-6",
                        "name": "Dr. Chowdhury Farhan Hossain",
                        "specialty": "Orthopedic",
                        "qualification": "MBBS, MS (Orthopedic Surgery), Fellow Spine Surgery",
                        "experience": "18+ Yrs Exp.",
                        "visitDays": "Sun, Tue, Thu",
                        "visitTime": "05:00 PM - 09:00 PM",
                        "fee": 1200,
                        "slots": ["05:30 PM", "06:15 PM", "07:00 PM", "07:45 PM"]
                    },
                    {
                        "id": "doc-7",
                        "name": "Dr. Sabina Yasmin",
                        "specialty": "Pediatrician",
                        "qualification": "MBBS, DCH, FCPS (Pediatrics), MD",
                        "experience": "13+ Yrs Exp.",
                        "visitDays": "Mon - Sat",
                        "visitTime": "10:00 AM - 02:00 PM",
                        "fee": 1000,
                        "slots": ["10:30 AM", "11:15 AM", "12:00 PM", "01:00 PM"]
                    },
                    {
                        "id": "doc-8",
                        "name": "Dr. Tanvir Ahmed Khan",
                        "specialty": "Gastroenterologist",
                        "qualification": "MBBS, MD (Gastroenterology), Fellowship Endoscopy",
                        "experience": "15+ Yrs Exp.",
                        "visitDays": "Wed, Fri, Sat",
                        "visitTime": "04:00 PM - 08:00 PM",
                        "fee": 1200,
                        "slots": ["04:30 PM", "05:15 PM", "06:00 PM", "07:00 PM"]
                    }
                ]
            },
            {
                "id": "mount-adora-sylhet",
                "name": "Mount Adora Hospital & OPD Chamber",
                "location": "Nayasarak, Zindabazar, Sylhet",
                "city": "Sylhet",
                "verified": True,
                "rating": 4.8,
                "reviewsCount": 175,
                "openTiming": "08:00 AM - 10:00 PM",
                "contactPhone": "+880 821-728561 / +880 1912-345678",
                "tagline": "Digital Diagnostic, Radiology & Visiting Doctor Chamber",
                "badge": "Verified Partner",
                "image": "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80",
                "doctors": [
                    {
                        "id": "doc-9",
                        "name": "Dr. Kazi Shahed Ahmed",
                        "specialty": "ENT Specialist",
                        "qualification": "MBBS, MS (ENT), DLO (BSMMU)",
                        "experience": "15+ Yrs Exp.",
                        "visitDays": "Sat, Mon, Wed",
                        "visitTime": "04:00 PM - 08:00 PM",
                        "fee": 900,
                        "slots": ["04:30 PM", "05:15 PM", "06:00 PM", "07:00 PM"]
                    },
                    {
                        "id": "doc-10",
                        "name": "Dr. Rashida Akter",
                        "specialty": "Pulmonologist",
                        "qualification": "MBBS, DTCD, MD (Chest Medicine)",
                        "experience": "12+ Yrs Exp.",
                        "visitDays": "Sun, Tue, Thu",
                        "visitTime": "05:00 PM - 08:30 PM",
                        "fee": 1000,
                        "slots": ["05:30 PM", "06:15 PM", "07:00 PM"]
                    }
                ]
            },
            {
                "id": "labaid-rajshahi",
                "name": "Labaid Diagnostic & Consultation Hub",
                "location": "Laxmipur, Rajshahi",
                "city": "Rajshahi",
                "verified": True,
                "rating": 4.85,
                "reviewsCount": 190,
                "openTiming": "08:00 AM - 09:30 PM",
                "contactPhone": "+880 721-772211 / +880 1730-998877",
                "tagline": "Super Specialist OPD Consultation & Clinical Lab",
                "badge": "Super Partner",
                "image": "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=600&q=80",
                "doctors": [
                    {
                        "id": "doc-11",
                        "name": "Dr. M. A. Bashar",
                        "specialty": "Nephrologist",
                        "qualification": "MBBS, MD (Nephrology), FCPS (Medicine)",
                        "experience": "17+ Yrs Exp.",
                        "visitDays": "Thu, Fri, Sat",
                        "visitTime": "03:00 PM - 07:30 PM",
                        "fee": 1200,
                        "slots": ["03:30 PM", "04:15 PM", "05:30 PM", "06:30 PM"]
                    },
                    {
                        "id": "doc-12",
                        "name": "Dr. Farhana Chowdhury",
                        "specialty": "Gynecologist",
                        "qualification": "MBBS, DGO, FCPS (Obgyn)",
                        "experience": "14+ Yrs Exp.",
                        "visitDays": "Everyday",
                        "visitTime": "10:00 AM - 02:00 PM",
                        "fee": 1000,
                        "slots": ["10:30 AM", "11:30 AM", "12:30 PM", "01:15 PM"]
                    }
                ]
            }
        ]

        chamber_count = 0
        doctor_count = 0

        for ch in OPD_CHAMBERS:
            doctors = ch.pop("doctors", [])
            chamber_obj, created = Chamber.objects.update_or_create(
                id=ch["id"],
                defaults={
                    "name": ch["name"],
                    "location": ch["location"],
                    "city": ch["city"],
                    "verified": ch["verified"],
                    "rating": ch["rating"],
                    "reviews_count": ch["reviewsCount"],
                    "open_timing": ch["openTiming"],
                    "contact_phone": ch["contactPhone"],
                    "tagline": ch["tagline"],
                    "badge": ch["badge"],
                    "image": ch["image"],
                }
            )
            chamber_count += 1

            for doc in doctors:
                spec_obj = specialty_map.get(doc["specialty"].lower())
                Doctor.objects.update_or_create(
                    id=doc["id"],
                    defaults={
                        "name": doc["name"],
                        "specialty": spec_obj,
                        "chamber": chamber_obj,
                        "qualification": doc["qualification"],
                        "experience": doc["experience"],
                        "visit_days": doc["visitDays"],
                        "visit_time": doc["visitTime"],
                        "fee": doc["fee"],
                        "slots": doc["slots"]
                    }
                )
                doctor_count += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {chamber_count} chambers and {doctor_count} doctors into NeonDB.'))
