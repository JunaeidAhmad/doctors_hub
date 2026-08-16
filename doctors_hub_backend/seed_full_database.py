import os
import sys
import uuid
import random
from datetime import date, time, timedelta, datetime
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()

from django.utils.text import slugify
from django.utils import timezone
from accounts.models import User
from facilities.models import (
    Address, Location, HospitalCategory, HospitalService, Hospital,
    DiagnosticCenterCategory, DiagnosticService, DiagnosticCenter, Chamber
)
from doctors.models import (
    DoctorSpecialty, Doctor, DoctorAffiliation, AffiliationSchedule
)
from tests.models import (
    TestCategory, Test, FacilityTest
)
from bookings.models import (
    DoctorBooking, LabBooking, BaseBooking
)

SEED_NAMESPACE = uuid.UUID("6f6a9b2e-6f2b-4b7a-9b1e-6a1f7c2d9e10")

def seed_uuid(key: str) -> uuid.UUID:
    return uuid.uuid5(SEED_NAMESPACE, key)

def get_or_create_location(name, branch, loc_type, addr_obj, phone="", email="", tagline="", badge="", rating=4.8, reviews=100, open_timing="24/7 Open"):
    b = f"-{branch}" if branch else ""
    slug = slugify(f"{name}{b}")
    loc = Location.objects.filter(slug=slug).first()
    if not loc:
        loc = Location.objects.create(
            id=seed_uuid(f"Location:{slug}"),
            location_type=loc_type,
            name=name,
            branch=branch,
            slug=slug,
            address=addr_obj,
            phone=phone,
            email=email,
            tagline=tagline,
            badge=badge,
            rating=rating,
            reviews_count=reviews,
            open_timing=open_timing,
            is_verified=True,
            is_active=True
        )
    else:
        loc.location_type = loc_type
        loc.name = name
        loc.branch = branch
        loc.address = addr_obj
        loc.phone = phone
        loc.email = email
        loc.tagline = tagline
        loc.badge = badge
        loc.rating = rating
        loc.reviews_count = reviews
        loc.open_timing = open_timing
        loc.is_verified = True
        loc.is_active = True
        loc.save()
    return loc

def inject_data():
    print("==================================================")
    print("Starting Comprehensive Database Injection (5+ rows/table)")
    print("==================================================")

    # 1. Users (at least 8 users)
    print("\n[1/19] Injecting Users...")
    sample_users = [
        {"phone": "01711000001", "first_name": "Rafiqul", "last_name": "Islam", "is_staff": False, "is_super": False},
        {"phone": "01812000002", "first_name": "Nusrat", "last_name": "Jahan", "is_staff": False, "is_super": False},
        {"phone": "01913000003", "first_name": "Tanvir", "last_name": "Ahmed", "is_staff": False, "is_super": False},
        {"phone": "01614000004", "first_name": "Sadia", "last_name": "Sultana", "is_staff": False, "is_super": False},
        {"phone": "01715000005", "first_name": "Kamrul", "last_name": "Hasan", "is_staff": True, "is_super": False},
        {"phone": "01816000006", "first_name": "Farzana", "last_name": "Akter", "is_staff": False, "is_super": False},
        {"phone": "01917000007", "first_name": "Mahmudul", "last_name": "Karim", "is_staff": False, "is_super": False},
        {"phone": "01700000000", "first_name": "Admin", "last_name": "User", "is_staff": True, "is_super": True},
    ]

    created_users = []
    for u_data in sample_users:
        user = User.objects.filter(phone_number=u_data["phone"]).first()
        if not user:
            user = User.objects.create_user(
                phone_number=u_data["phone"],
                password="Password123!",
                first_name=u_data["first_name"],
                last_name=u_data["last_name"],
                is_staff=u_data["is_staff"],
                is_superuser=u_data["is_super"],
                is_active=True
            )
        created_users.append(user)
    print(f"✓ Users ready: {User.objects.count()} total.")

    # 2. Addresses (ensure 7+ addresses)
    print("\n[2/19] Injecting Addresses...")
    addresses_data = [
        {"slug": "addr-dhanmondi-1", "line": "House 16, Road 2, Dhanmondi", "area": "Dhanmondi", "city": "Dhaka", "district": "Dhaka", "division": "Dhaka", "post": "1205", "lat": 23.7465, "lng": 90.3760},
        {"slug": "addr-panthapath-1", "line": "18/F, Bir Uttam Qazi Nuruzzaman Sarak, Panthapath", "area": "Panthapath", "city": "Dhaka", "district": "Dhaka", "division": "Dhaka", "post": "1205", "lat": 23.7516, "lng": 90.3872},
        {"slug": "addr-dhanmondi-2", "line": "House 48, Road 9/A, Satmasjid Road", "area": "Dhanmondi", "city": "Dhaka", "district": "Dhaka", "division": "Dhaka", "post": "1209", "lat": 23.7480, "lng": 90.3720},
        {"slug": "addr-bashundhara-1", "line": "Plot 81, Block E, Bashundhara R/A", "area": "Bashundhara", "city": "Dhaka", "district": "Dhaka", "division": "Dhaka", "post": "1229", "lat": 23.8103, "lng": 90.4312},
        {"slug": "addr-gulshan-1", "line": "Plot 15, Road 71, Gulshan-2", "area": "Gulshan", "city": "Dhaka", "district": "Dhaka", "division": "Dhaka", "post": "1212", "lat": 23.7925, "lng": 90.4167},
        {"slug": "addr-mirpur-1", "line": "Plot 4, Section 2, Mirpur", "area": "Mirpur", "city": "Dhaka", "district": "Dhaka", "division": "Dhaka", "post": "1216", "lat": 23.8067, "lng": 90.3644},
        {"slug": "addr-chittagong-1", "line": "122, K.B. Fazlul Kader Road, Panchlaish", "area": "Panchlaish", "city": "Chittagong", "district": "Chittagong", "division": "Chittagong", "post": "4203", "lat": 22.3569, "lng": 91.8340},
    ]
    addr_map = {}
    for a in addresses_data:
        obj = Address.objects.filter(address_line=a["line"]).first()
        if not obj:
            obj = Address.objects.create(
                id=seed_uuid(f"Address:{a['slug']}"),
                address_line=a["line"],
                area=a["area"],
                city=a["city"],
                district=a["district"],
                division=a["division"],
                postal_code=a["post"],
                latitude=Decimal(str(a["lat"])),
                longitude=Decimal(str(a["lng"]))
            )
        addr_map[a["slug"]] = obj
    print(f"✓ Addresses ready: {Address.objects.count()} total.")

    # 3. Hospital Categories (ensure 6+ categories)
    print("\n[3/19] Injecting Hospital Categories...")
    hcat_data = [
        {"name": "General Hospital", "icon": "Building2", "desc": "Multi-specialty general healthcare facilities", "count": 15},
        {"name": "Specialized Cardiac Hospital", "icon": "HeartPulse", "desc": "Dedicated cardiology and cardiovascular care", "count": 8},
        {"name": "Mother & Child Care", "icon": "Baby", "desc": "Specialized maternal, neonatal, and pediatric care", "count": 12},
        {"name": "Eye & Vision Hospital", "icon": "Eye", "desc": "Ophthalmology and surgical eye care centers", "count": 6},
        {"name": "Cancer & Oncology Hospital", "icon": "Ribbon", "desc": "Comprehensive oncology, chemotherapy, and radiation facilities", "count": 4},
        {"name": "Orthopedic & Trauma Hospital", "icon": "Bone", "desc": "Bone, joint, spine, and trauma care facilities", "count": 7},
    ]
    hcat_map = {}
    for hc in hcat_data:
        slug = slugify(hc["name"])
        obj = HospitalCategory.objects.filter(slug=slug).first()
        if not obj:
            obj = HospitalCategory.objects.create(
                id=seed_uuid(f"HospitalCategory:{slug}"),
                name=hc["name"],
                slug=slug,
                icon=hc["icon"],
                description=hc["desc"],
                count=hc["count"]
            )
        hcat_map[hc["name"]] = obj
    print(f"✓ Hospital Categories ready: {HospitalCategory.objects.count()} total.")

    # 4. Hospital Services (ensure 6+ services)
    print("\n[4/19] Injecting Hospital Services...")
    hsrv_data = [
        {"name": "24/7 Emergency & Trauma", "icon": "Siren", "desc": "Round-the-clock emergency medical response"},
        {"name": "ICU & CCU Facilities", "icon": "Activity", "desc": "Intensive care and cardiac care units"},
        {"name": "In-house 24/7 Pharmacy", "icon": "Pill", "desc": "24-hour dispensing pharmacy"},
        {"name": "Cardiac Ambulance Service", "icon": "Truck", "desc": "Equipped cardiac and standard ambulance transport"},
        {"name": "Modular Operation Theaters", "icon": "Scissors", "desc": "Modern sterile surgical suites"},
        {"name": "24/7 Blood Bank & Transfusion", "icon": "Droplet", "desc": "Screened safe blood storage and donor registry"},
    ]
    hsrv_map = {}
    for hs in hsrv_data:
        slug = slugify(hs["name"])
        obj = HospitalService.objects.filter(name=hs["name"]).first()
        if not obj:
            obj = HospitalService.objects.create(
                id=seed_uuid(f"HospitalService:{slug}"),
                name=hs["name"],
                icon=hs["icon"],
                description=hs["desc"]
            )
        hsrv_map[hs["name"]] = obj
    print(f"✓ Hospital Services ready: {HospitalService.objects.count()} total.")

    # 5. Diagnostic Center Categories (ensure 6+ categories)
    print("\n[5/19] Injecting Diagnostic Center Categories...")
    dcat_data = [
        {"name": "Clinical Pathology", "icon": "FlaskConical", "desc": "Blood, urine, stool, and bodily fluid analysis"},
        {"name": "Radiology & Imaging", "icon": "Scan", "desc": "Digital X-Ray, CT Scan, MRI, Ultrasound, Mammography"},
        {"name": "Cardiology Diagnostics", "icon": "Heart", "desc": "ECG, Echocardiography, ETT, and Holter monitoring"},
        {"name": "Microbiology & Serology", "icon": "Microscope", "desc": "Bacterial culture, viral titers, immunology"},
        {"name": "Molecular Diagnostics", "icon": "Dna", "desc": "PCR testing, genetic markers, DNA sequencing"},
        {"name": "Endoscopy & Colonoscopy", "icon": "Eye", "desc": "Diagnostic gastroenterology endoscopy procedures"},
    ]
    dcat_map = {}
    for dc in dcat_data:
        slug = slugify(dc["name"])
        obj = DiagnosticCenterCategory.objects.filter(slug=slug).first()
        if not obj:
            obj = DiagnosticCenterCategory.objects.create(
                id=seed_uuid(f"DiagnosticCenterCategory:{slug}"),
                name=dc["name"],
                slug=slug,
                icon=dc["icon"],
                description=dc["desc"]
            )
        dcat_map[dc["name"]] = obj
    print(f"✓ Diagnostic Categories ready: {DiagnosticCenterCategory.objects.count()} total.")

    # 6. Diagnostic Services (ensure 6+ services)
    print("\n[6/19] Injecting Diagnostic Services...")
    dsrv_data = [
        {"name": "Home Sample Collection", "icon": "Home", "desc": "Trained phlebotomist visit for at-home specimen collection"},
        {"name": "Digital Online Reports", "icon": "FileText", "desc": "Instant SMS download link and secure portal"},
        {"name": "Express / Stat Testing", "icon": "Zap", "desc": "Urgent test processing with fast turnaround"},
        {"name": "Health Checkup Packages", "icon": "ShieldCheck", "desc": "Comprehensive wellness and executive checkups"},
        {"name": "Automated Biochemistry Lab", "icon": "Cpu", "desc": "Automated analyzers with zero contamination"},
        {"name": "Online Appointment Booking", "icon": "Calendar", "desc": "Pre-booking for tests and investigations"},
    ]
    dsrv_map = {}
    for ds in dsrv_data:
        slug = slugify(ds["name"])
        obj = DiagnosticService.objects.filter(name=ds["name"]).first()
        if not obj:
            obj = DiagnosticService.objects.create(
                id=seed_uuid(f"DiagnosticService:{slug}"),
                name=ds["name"],
                icon=ds["icon"],
                description=ds["desc"]
            )
        dsrv_map[ds["name"]] = obj
    print(f"✓ Diagnostic Services ready: {DiagnosticService.objects.count()} total.")

    # 7. PracticeLocations & Hospitals (ensure 6+ hospitals)
    print("\n[7/19] Injecting Hospitals & Locations...")
    hospitals_info = [
        {"name": "Square Hospital", "branch": "Panthapath Main", "addr": "addr-panthapath-1", "phone": "+8801713377775", "email": "info@squarehospital.com", "tagline": "Care at its Best", "badge": "Top Rated", "rating": 4.8, "reviews": 320, "timing": "24/7 Open", "cats": ["General Hospital", "Specialized Cardiac Hospital"], "srvs": ["24/7 Emergency & Trauma", "ICU & CCU Facilities", "In-house 24/7 Pharmacy", "Cardiac Ambulance Service", "Modular Operation Theaters"]},
        {"name": "Evercare Hospital", "branch": "Dhaka Branch", "addr": "addr-bashundhara-1", "phone": "+88028431661", "email": "info@evercarebd.com", "tagline": "Transforming Healthcare", "badge": "Accredited", "rating": 4.7, "reviews": 290, "timing": "24/7 Open", "cats": ["General Hospital", "Cancer & Oncology Hospital"], "srvs": ["24/7 Emergency & Trauma", "ICU & CCU Facilities", "In-house 24/7 Pharmacy", "Cardiac Ambulance Service", "Modular Operation Theaters"]},
        {"name": "United Hospital", "branch": "Gulshan Branch", "addr": "addr-gulshan-1", "phone": "+88028836000", "email": "info@uhlbd.com", "tagline": "Touching Lives with Care", "badge": "Premium Care", "rating": 4.7, "reviews": 210, "timing": "24/7 Open", "cats": ["General Hospital", "Specialized Cardiac Hospital"], "srvs": ["24/7 Emergency & Trauma", "ICU & CCU Facilities", "Cardiac Ambulance Service"]},
        {"name": "Labaid Specialized Hospital", "branch": "Dhanmondi Branch", "addr": "addr-dhanmondi-1", "phone": "+8801713333337", "email": "info@labaidgroup.com", "tagline": "Committed to Health", "badge": "Cardiac Center", "rating": 4.6, "reviews": 185, "timing": "24/7 Open", "cats": ["Specialized Cardiac Hospital"], "srvs": ["24/7 Emergency & Trauma", "ICU & CCU Facilities", "In-house 24/7 Pharmacy"]},
        {"name": "National Heart Foundation Hospital", "branch": "Mirpur Branch", "addr": "addr-mirpur-1", "phone": "+88029033442", "email": "info@nhf.org.bd", "tagline": "Dedicated Heart Care", "badge": "Non-profit", "rating": 4.6, "reviews": 140, "timing": "24/7 Open", "cats": ["Specialized Cardiac Hospital"], "srvs": ["24/7 Emergency & Trauma", "ICU & CCU Facilities", "Cardiac Ambulance Service"]},
        {"name": "Bangladesh Specialized Hospital", "branch": "Shyamoli Branch", "addr": "addr-panthapath-1", "phone": "+8809666700100", "email": "info@bsh.com.bd", "tagline": "Excellence in Healthcare", "badge": "Verified", "rating": 4.7, "reviews": 160, "timing": "24/7 Open", "cats": ["General Hospital", "Orthopedic & Trauma Hospital"], "srvs": ["24/7 Emergency & Trauma", "ICU & CCU Facilities", "Modular Operation Theaters"]},
    ]

    for h in hospitals_info:
        loc = get_or_create_location(
            name=h["name"],
            branch=h["branch"],
            loc_type=Location.LocationType.HOSPITAL,
            addr_obj=addr_map[h["addr"]],
            phone=h["phone"],
            email=h["email"],
            tagline=h["tagline"],
            badge=h["badge"],
            rating=h["rating"],
            reviews=h["reviews"],
            open_timing=h["timing"]
        )
        hosp, _ = Hospital.objects.get_or_create(
            location=loc,
            defaults={"has_diagnostic_center": True}
        )
        for cat_name in h["cats"]:
            if cat_name in hcat_map:
                hosp.category = hcat_map[cat_name]
                hosp.save()
                break
        for srv_name in h["srvs"]:
            if srv_name in hsrv_map:
                hosp.services.add(hsrv_map[srv_name])

    print(f"✓ Hospitals ready: {Hospital.objects.count()} total.")

    # 8. Diagnostic Centers (ensure 6+ diagnostic centers)
    print("\n[8/19] Injecting Diagnostic Centers...")
    diag_centers_info = [
        {"name": "Popular Diagnostic Centre", "branch": "Dhanmondi Branch", "addr": "addr-dhanmondi-1", "phone": "+8809613787801", "email": "dhanmondi@populardiagnostic.com", "tagline": "Accurate & Reliable Diagnostics", "badge": "Popular Choice", "rating": 4.6, "reviews": 540, "timing": "07:00 AM - 11:00 PM", "cats": ["Clinical Pathology", "Radiology & Imaging", "Cardiology Diagnostics", "Microbiology & Serology"], "srvs": ["Home Sample Collection", "Digital Online Reports", "Express / Stat Testing", "Health Checkup Packages", "Automated Biochemistry Lab"]},
        {"name": "Ibn Sina Diagnostic Center", "branch": "Dhanmondi Branch", "addr": "addr-dhanmondi-2", "phone": "+88029126625", "email": "dhanmondi@ibnsinatrust.com", "tagline": "Serving Humanity with Integrity", "badge": "Trusted", "rating": 4.5, "reviews": 410, "timing": "07:00 AM - 11:00 PM", "cats": ["Clinical Pathology", "Radiology & Imaging", "Cardiology Diagnostics"], "srvs": ["Home Sample Collection", "Digital Online Reports", "Health Checkup Packages"]},
        {"name": "Medinova Medical Services", "branch": "Dhanmondi Main", "addr": "addr-dhanmondi-1", "phone": "+880258610385", "email": "info@medinova.com.bd", "tagline": "Quality Healthcare You Can Trust", "badge": "Established", "rating": 4.4, "reviews": 230, "timing": "07:30 AM - 10:30 PM", "cats": ["Clinical Pathology", "Radiology & Imaging"], "srvs": ["Digital Online Reports", "Health Checkup Packages"]},
        {"name": "Lab One Diagnostic", "branch": "Uttara Branch", "addr": "addr-bashundhara-1", "phone": "+8801711002233", "email": "uttara@labone.com.bd", "tagline": "Precision & Accuracy", "badge": "ISO Certified", "rating": 4.5, "reviews": 115, "timing": "08:00 AM - 10:00 PM", "cats": ["Clinical Pathology", "Microbiology & Serology"], "srvs": ["Home Sample Collection", "Digital Online Reports"]},
        {"name": "Thyrocare Bangladesh", "branch": "Banani Central Lab", "addr": "addr-gulshan-1", "phone": "+8809666737373", "email": "info@thyrocare.com.bd", "tagline": "World Class Automated Pathology", "badge": "Fully Automated", "rating": 4.7, "reviews": 310, "timing": "07:00 AM - 09:00 PM", "cats": ["Clinical Pathology", "Molecular Diagnostics"], "srvs": ["Home Sample Collection", "Digital Online Reports", "Automated Biochemistry Lab"]},
        {"name": "Praava Health", "branch": "Banani Branch", "addr": "addr-gulshan-1", "phone": "+8801847277777", "email": "care@praavahealth.com", "tagline": "Your Trusted Family Health Partner", "badge": "Modern", "rating": 4.8, "reviews": 245, "timing": "07:30 AM - 10:00 PM", "cats": ["Clinical Pathology", "Radiology & Imaging", "Molecular Diagnostics"], "srvs": ["Home Sample Collection", "Digital Online Reports", "Express / Stat Testing"]},
    ]

    for d in diag_centers_info:
        loc = get_or_create_location(
            name=d["name"],
            branch=d["branch"],
            loc_type=Location.LocationType.DIAGNOSTIC_CENTER,
            addr_obj=addr_map[d["addr"]],
            phone=d["phone"],
            email=d["email"],
            tagline=d["tagline"],
            badge=d["badge"],
            rating=d["rating"],
            reviews=d["reviews"],
            open_timing=d["timing"]
        )
        diag, _ = DiagnosticCenter.objects.get_or_create(
            location=loc,
            defaults={}
        )
        for cat_name in d["cats"]:
            if cat_name in dcat_map:
                diag.category = dcat_map[cat_name]
                diag.save()
                break
        for srv_name in d["srvs"]:
            if srv_name in dsrv_map:
                diag.services.add(dsrv_map[srv_name])

    print(f"✓ Diagnostic Centers ready: {DiagnosticCenter.objects.count()} total.")

    # 9. Doctor Specialties (ensure 6+ specialties)
    print("\n[9/19] Injecting Doctor Specialties...")
    spec_data = [
        {"name": "Internal Medicine", "icon": "Stethoscope", "desc": "Diagnosis and management of adult diseases"},
        {"name": "Cardiology", "icon": "Heart", "desc": "Cardiovascular disorders and hypertension"},
        {"name": "Gynecology & Obstetrics", "icon": "UserCheck", "desc": "Women's reproductive health, pregnancy, delivery"},
        {"name": "Neurology", "icon": "Brain", "desc": "Disorders of the nervous system and brain"},
        {"name": "Orthopedic Surgery", "icon": "Bone", "desc": "Musculoskeletal system, joints, and spine care"},
        {"name": "Pediatrics & Child Care", "icon": "Baby", "desc": "Infant, child, and adolescent healthcare"},
        {"name": "Dermatology & Skin Care", "icon": "Sparkles", "desc": "Skin, hair, nails, and aesthetic care"},
        {"name": "Gastroenterology & Liver", "icon": "Activity", "desc": "Digestive tract and liver disorders"},
    ]
    spec_map = {}
    for sp in spec_data:
        slug = slugify(sp["name"])
        obj = DoctorSpecialty.objects.filter(slug=slug).first()
        if not obj:
            obj = DoctorSpecialty.objects.create(
                id=seed_uuid(f"DoctorSpecialty:{slug}"),
                name=sp["name"],
                slug=slug,
                icon=sp["icon"],
                description=sp["desc"]
            )
        spec_map[sp["name"]] = obj
    print(f"✓ Doctor Specialties ready: {DoctorSpecialty.objects.count()} total.")

    # 10. Doctors (ensure 6+ doctors)
    print("\n[10/19] Injecting Doctors...")
    doctors_info = [
        {"name": "Prof. Dr. A. B. M. Abdullah", "qual": "MBBS, FCPS (Medicine), FRCP (Edin)", "exp": "35 Years", "specs": ["Internal Medicine"]},
        {"name": "Prof. Dr. M. G. Azam", "qual": "MBBS, MD (Cardiology), FACC (USA)", "exp": "25 Years", "specs": ["Cardiology"]},
        {"name": "Prof. Dr. Laila Arjumand Banu", "qual": "MBBS, FCPS (Obs & Gynae), FICS", "exp": "28 Years", "specs": ["Gynecology & Obstetrics"]},
        {"name": "Dr. Kazi Naushad-Un-Nabi", "qual": "MBBS, FCPS (Pediatrics), MD (Neurology)", "exp": "20 Years", "specs": ["Neurology", "Pediatrics & Child Care"]},
        {"name": "Prof. Dr. Pranab Kumar Karmaker", "qual": "MBBS, MS (Orthopedics)", "exp": "30 Years", "specs": ["Orthopedic Surgery"]},
        {"name": "Dr. Farhana Akter", "qual": "MBBS, DDV (Dermatology)", "exp": "12 Years", "specs": ["Dermatology & Skin Care"]},
        {"name": "Dr. Salma Begum", "qual": "MBBS, FCPS (Gastroenterology)", "exp": "19 Years", "specs": ["Gastroenterology & Liver"]},
    ]
    doc_map = {}
    for d in doctors_info:
        slug = slugify(d["name"])
        doc = Doctor.objects.filter(name=d["name"]).first()
        if not doc:
            doc = Doctor.objects.create(
                id=seed_uuid(f"Doctor:{slug}"),
                name=d["name"],
                slug=slug,
                qualification=d["qual"],
                experience=d["exp"]
            )
        for s_name in d["specs"]:
            if s_name in spec_map:
                doc.specialties.add(spec_map[s_name])
        doc_map[d["name"]] = doc
    print(f"✓ Doctors ready: {Doctor.objects.count()} total.")

    # 11. Chambers (ensure 5+ chambers)
    print("\n[11/19] Injecting Chambers...")
    chambers_info = [
        {"name": "Prof. Abdullah Consultation Chamber", "branch": "Green Road", "addr": "addr-panthapath-1", "doc": "Prof. Dr. A. B. M. Abdullah", "asst_phone": "+8801711223344", "timing": "05:00 PM - 09:00 PM"},
        {"name": "Prof. Azam Cardiac Chamber", "branch": "Dhanmondi", "addr": "addr-dhanmondi-1", "doc": "Prof. Dr. M. G. Azam", "asst_phone": "+8801819556677", "timing": "06:00 PM - 09:30 PM"},
        {"name": "Dr. Laila Women Care Chamber", "branch": "Dhanmondi", "addr": "addr-dhanmondi-2", "doc": "Prof. Dr. Laila Arjumand Banu", "asst_phone": "+8801912334455", "timing": "04:30 PM - 08:30 PM"},
        {"name": "Dr. Naushad Child Neurology Chamber", "branch": "Gulshan", "addr": "addr-gulshan-1", "doc": "Dr. Kazi Naushad-Un-Nabi", "asst_phone": "+8801611778899", "timing": "05:00 PM - 08:00 PM"},
        {"name": "Prof. Karmaker Ortho Spine Chamber", "branch": "Panthapath", "addr": "addr-panthapath-1", "doc": "Prof. Dr. Pranab Kumar Karmaker", "asst_phone": "+8801722889900", "timing": "05:30 PM - 09:00 PM"},
        {"name": "Dr. Farhana Skin & Laser Chamber", "branch": "Uttara", "addr": "addr-bashundhara-1", "doc": "Dr. Farhana Akter", "asst_phone": "+8801733445566", "timing": "04:00 PM - 08:00 PM"},
    ]
    for ch in chambers_info:
        loc = get_or_create_location(
            name=ch["name"],
            branch=ch["branch"],
            loc_type=Location.LocationType.CHAMBER,
            addr_obj=addr_map[ch["addr"]],
            phone=ch["asst_phone"],
            tagline="Private Specialist Consultation",
            badge="Verified",
            rating=4.9,
            reviews=95,
            open_timing=ch["timing"]
        )
        Chamber.objects.update_or_create(
            location=loc,
            defaults={
                "doctor": doc_map[ch["doc"]],
                "assistant_phone": ch["asst_phone"]
            }
        )
    print(f"✓ Chambers ready: {Chamber.objects.count()} total.")

    # 12. Doctor Affiliations & Schedules (ensure 6+ affiliations & schedules)
    print("\n[12/19] Injecting Doctor Affiliations & Schedules...")
    affiliations_data = [
        {"doc": "Prof. Dr. A. B. M. Abdullah", "loc_name": "Square Hospital", "type": "OPD", "fee": Decimal("2000.00"), "days": [("Saturday", time(17, 0), time(20, 0)), ("Monday", time(17, 0), time(20, 0)), ("Wednesday", time(17, 0), time(20, 0))]},
        {"doc": "Prof. Dr. A. B. M. Abdullah", "loc_name": "Prof. Abdullah Consultation Chamber", "type": "Chamber", "fee": Decimal("1500.00"), "days": [("Sunday", time(18, 0), time(21, 0)), ("Tuesday", time(18, 0), time(21, 0)), ("Thursday", time(18, 0), time(21, 0))]},
        {"doc": "Prof. Dr. M. G. Azam", "loc_name": "Square Hospital", "type": "In-patient", "fee": Decimal("2500.00"), "days": [("Sunday", time(10, 0), time(14, 0)), ("Tuesday", time(10, 0), time(14, 0))]},
        {"doc": "Prof. Dr. M. G. Azam", "loc_name": "Prof. Azam Cardiac Chamber", "type": "Chamber", "fee": Decimal("1800.00"), "days": [("Saturday", time(18, 0), time(21, 30)), ("Monday", time(18, 0), time(21, 30))]},
        {"doc": "Prof. Dr. Laila Arjumand Banu", "loc_name": "Popular Diagnostic Centre", "type": "Chamber", "fee": Decimal("1200.00"), "days": [("Saturday", time(16, 0), time(19, 0)), ("Wednesday", time(16, 0), time(19, 0)), ("Thursday", time(16, 0), time(19, 0))]},
        {"doc": "Prof. Dr. Pranab Kumar Karmaker", "loc_name": "Evercare Hospital", "type": "OPD", "fee": Decimal("1800.00"), "days": [("Sunday", time(10, 0), time(13, 0)), ("Thursday", time(10, 0), time(13, 0))]},
        {"doc": "Dr. Kazi Naushad-Un-Nabi", "loc_name": "United Hospital", "type": "OPD", "fee": Decimal("1500.00"), "days": [("Monday", time(16, 0), time(19, 0)), ("Wednesday", time(16, 0), time(19, 0))]},
    ]

    for aff_info in affiliations_data:
        doc = doc_map.get(aff_info["doc"])
        loc = Location.objects.filter(name__icontains=aff_info["loc_name"]).first()
        if not doc or not loc:
            continue

        aff = DoctorAffiliation.objects.filter(doctor=doc, location=loc, consultation_type=aff_info["type"]).first()
        if not aff:
            aff = DoctorAffiliation.objects.create(
                id=seed_uuid(f"DoctorAffiliation:{doc.name}:{loc.name}:{aff_info['type']}"),
                doctor=doc,
                location=loc,
                consultation_type=aff_info["type"],
                fee=aff_info["fee"]
            )
        else:
            aff.fee = aff_info["fee"]
            aff.save()

        for day_name, start_t, end_t in aff_info["days"]:
            sched = AffiliationSchedule.objects.filter(affiliation=aff, day_of_week=day_name).first()
            if not sched:
                AffiliationSchedule.objects.create(
                    id=seed_uuid(f"AffiliationSchedule:{aff.id}:{day_name}"),
                    affiliation=aff,
                    day_of_week=day_name,
                    start_time=start_t,
                    end_time=end_t
                )
            else:
                sched.start_time = start_t
                sched.end_time = end_t
                sched.save()

    print(f"✓ Doctor Affiliations: {DoctorAffiliation.objects.count()} total.")
    print(f"✓ Affiliation Schedules: {AffiliationSchedule.objects.count()} total.")

    # 13. Test Categories & Tests (ensure 6+ categories & tests)
    print("\n[13/19] Checking Test Categories & Tests...")
    test_cats = [
        {"name": "Biochemistry & Routine Blood", "icon": "Droplet", "desc": "Blood chemistries and routine panels", "order": 1},
        {"name": "Radiology & Imaging", "icon": "Radio", "desc": "X-Ray, Ultrasound, CT, MRI", "order": 2},
        {"name": "Cardiovascular Investigations", "icon": "HeartPulse", "desc": "ECG, Echo, Troponin, Lipid", "order": 3},
        {"name": "Thyroid & Hormonal Panel", "icon": "Activity", "desc": "TSH, FT4, HbA1c, Hormone assays", "order": 4},
        {"name": "Urine & Renal Profile", "icon": "TestTube", "desc": "Urinalysis, Creatinine, Electrolytes", "order": 5},
        {"name": "Microbiology & Culture", "icon": "Microscope", "desc": "Urine/Blood culture and sensitivity", "order": 6},
    ]
    tcat_map = {}
    for tc in test_cats:
        slug = slugify(tc["name"])
        tcat = TestCategory.objects.filter(slug=slug).first()
        if not tcat:
            tcat = TestCategory.objects.create(
                id=seed_uuid(f"TestCategory:{slug}"),
                name=tc["name"],
                slug=slug,
                icon=tc["icon"],
                description=tc["desc"],
                is_active=True,
                order=tc["order"]
            )
        tcat_map[tc["name"]] = tcat

    tests_data = [
        {"name": "Complete Blood Count (CBC) with ESR", "cat": "Biochemistry & Routine Blood", "code": "CBC-01", "sample": "Whole Blood (EDTA)", "fasting": False, "hours": 12, "prep": "No special preparation required"},
        {"name": "Fasting Blood Sugar (FBS)", "cat": "Biochemistry & Routine Blood", "code": "GLU-01", "sample": "Fluoride Plasma", "fasting": True, "hours": 6, "prep": "Strictly 8-10 hours overnight fasting required"},
        {"name": "Lipid Profile (Full Panel)", "cat": "Biochemistry & Routine Blood", "code": "LIP-01", "sample": "Serum", "fasting": True, "hours": 24, "prep": "12 hours overnight fasting required"},
        {"name": "Chest X-Ray P/A View (Digital)", "cat": "Radiology & Imaging", "code": "RAD-X01", "sample": "Imaging", "fasting": False, "hours": 4, "prep": "Remove metallic objects from chest area"},
        {"name": "Serum Creatinine with eGFR", "cat": "Urine & Renal Profile", "code": "RFT-01", "sample": "Serum", "fasting": False, "hours": 8, "prep": "Avoid heavy protein diet 12 hours prior"},
        {"name": "Thyroid Stimulating Hormone (TSH)", "cat": "Thyroid & Hormonal Panel", "code": "THY-01", "sample": "Serum", "fasting": False, "hours": 12, "prep": "Morning sample preferred"},
        {"name": "HbA1c (Glycated Hemoglobin)", "cat": "Biochemistry & Routine Blood", "code": "HBA-01", "sample": "Whole Blood (EDTA)", "fasting": False, "hours": 8, "prep": "No fasting required"},
    ]
    test_map = {}
    for t in tests_data:
        t_obj, _ = Test.objects.get_or_create(
            name=t["name"],
            category=tcat_map[t["cat"]],
            defaults={
                "code": t["code"],
                "report_time_hours": t["time"],
                "preparation_instructions": t["prep"],
                "is_active": True
            }
        )
        test_map[t["name"]] = t_obj

    print(f"✓ Test Categories: {TestCategory.objects.count()} total.")
    print(f"✓ Tests: {Test.objects.count()} total.")

    # 14. Facility Tests (ensure 6+ facility tests)
    print("\n[14/19] Injecting Facility Tests...")
    diag_locations = Location.objects.filter(location_type__in=[Location.LocationType.HOSPITAL, Location.LocationType.DIAGNOSTIC_CENTER])
    
    for loc in diag_locations[:4]:
        for t_name, test_obj in test_map.items():
            base_p = Decimal(random.choice([300, 450, 600, 800, 1200, 1500]))
            disc_p = base_p * Decimal("0.9") if random.random() < 0.5 else None
            discount_text = "10% OFF" if disc_p else ""
            
            FacilityTest.objects.update_or_create(
                location=loc,
                test=test_obj,
                defaults={
                    "price": base_p,
                    "discounted_price": disc_p,
                    "original_price": base_p if disc_p else None,
                    "discount": discount_text,
                    "report_time": "Same Day (6 Hours)",
                    "is_available": True,
                    "home_sample_collection": True
                }
            )

    print(f"✓ Facility Tests ready: {FacilityTest.objects.count()} total.")

    # 15. Doctor Bookings (ensure 6+ doctor bookings with validated slots)
    print("\n[15/19] Injecting Doctor Bookings...")
    active_affs = list(DoctorAffiliation.objects.filter(schedules__isnull=False).distinct())
    users = list(User.objects.filter(is_superuser=False))

    target_bookings = [
        {"patient": "Rafiqul Islam", "notes": "Persistent fever and headache for 4 days", "status": BaseBooking.Status.CONFIRMED},
        {"patient": "Nusrat Jahan", "notes": "Hypertension routine follow-up check", "status": BaseBooking.Status.PENDING},
        {"patient": "Farhana Ahmed", "notes": "First trimester maternal checkup", "status": BaseBooking.Status.CONFIRMED},
        {"patient": "Sadia Sultana", "notes": "Knee joint pain after morning jogging", "status": BaseBooking.Status.COMPLETED},
        {"patient": "Kamrul Hasan", "notes": "Chest discomfort review", "status": BaseBooking.Status.CONFIRMED},
        {"patient": "Tanvir Ahmed", "notes": "Follow-up blood test review", "status": BaseBooking.Status.CONFIRMED},
        {"patient": "Tahmid Rahman", "notes": "Pediatric consultation for child", "status": BaseBooking.Status.PENDING},
    ]

    day_map = {
        'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3,
        'Friday': 4, 'Saturday': 5, 'Sunday': 6
    }

    today = date.today()
    created_db_count = 0

    for idx, b_info in enumerate(target_bookings):
        aff = active_affs[idx % len(active_affs)]
        schedules = list(aff.schedules.all())
        if not schedules:
            continue
        schedule = schedules[0]

        target_weekday = day_map[schedule.day_of_week]
        days_ahead = (target_weekday - today.weekday() + 7) % 7
        if days_ahead == 0:
            days_ahead = 7
        
        booking_date = today + timedelta(days=days_ahead + (7 * (idx // len(active_affs))))
        start_h = schedule.start_time.hour
        slot_str = f"{start_h:02d}:30"
        user_obj = users[idx % len(users)]

        existing = DoctorBooking.objects.filter(affiliation=aff, date=booking_date, slot=slot_str).first()
        if not existing:
            try:
                DoctorBooking.objects.create(
                    id=seed_uuid(f"DoctorBooking:{idx}:{slugify(b_info['patient'])}:{booking_date}:{slot_str}"),
                    user=user_obj,
                    affiliation=aff,
                    date=booking_date,
                    slot=slot_str,
                    patient_name=b_info["patient"],
                    status=b_info["status"],
                    notes=b_info["notes"]
                )
                created_db_count += 1
            except Exception as e:
                print(f"  Note on doctor booking: {e}")

    print(f"✓ Doctor Bookings ready: {DoctorBooking.objects.count()} total.")

    # 16. Lab Bookings (ensure 6+ lab bookings)
    print("\n[16/19] Injecting Lab Bookings...")
    sample_fts = list(FacilityTest.objects.all()[:10])
    
    lab_bookings_data = [
        {"patient": "Rafiqul Islam", "phone": "01711000001", "addr": "House 14, Road 4, Dhanmondi, Dhaka", "notes": "Please bring EDTA blood collection tubes", "status": BaseBooking.Status.CONFIRMED, "days_offset": 2},
        {"patient": "Nusrat Jahan", "phone": "01812000002", "addr": "Flat 4B, Green Road, Dhaka", "notes": "Morning fasting sample collection at home", "status": BaseBooking.Status.PENDING, "days_offset": 3},
        {"patient": "Tanvir Ahmed", "phone": "01913000003", "addr": "House 88, Road 11, Banani, Dhaka", "notes": "Fasting lipid profile strictly maintained", "status": BaseBooking.Status.CONFIRMED, "days_offset": 4},
        {"patient": "Sadia Sultana", "phone": "01614000004", "addr": "Plot 12, Block D, Mirpur-1, Dhaka", "notes": "Walk-in routine checkup visit", "status": BaseBooking.Status.COMPLETED, "days_offset": -5},
        {"patient": "Kamrul Hasan", "phone": "01715000005", "addr": "House 25, Sector 7, Uttara, Dhaka", "notes": "Doctor prescription attached with booking", "status": BaseBooking.Status.CONFIRMED, "days_offset": 5},
        {"patient": "Tahmid Rahman", "phone": "01711000001", "addr": "House 14, Road 4, Dhanmondi, Dhaka", "notes": "Child blood test home collection", "status": BaseBooking.Status.PENDING, "days_offset": 6},
    ]

    for idx, lb in enumerate(lab_bookings_data):
        user_obj = users[idx % len(users)]
        ft_obj = sample_fts[idx % len(sample_fts)]
        pickup_d = today + timedelta(days=lb["days_offset"])

        lb_id = seed_uuid(f"LabBooking:{idx}:{slugify(lb['patient'])}:{pickup_d}")
        LabBooking.objects.update_or_create(
            id=lb_id,
            defaults={
                "user": user_obj,
                "facility_test": ft_obj,
                "pickup_date": pickup_d,
                "patient_name": lb["patient"],
                "patient_phone": lb["phone"],
                "address": lb["addr"],
                "status": lb["status"],
                "notes": lb["notes"]
            }
        )

    print(f"✓ Lab Bookings ready: {LabBooking.objects.count()} total.")

    print("\n==================================================")
    print("FINAL DATABASE TABLE ROW COUNTS:")
    print("==================================================")
    all_models = [
        User, Address, Location, HospitalCategory, HospitalService, Hospital,
        DiagnosticCenterCategory, DiagnosticService, DiagnosticCenter, Chamber,
        DoctorSpecialty, Doctor, DoctorAffiliation, AffiliationSchedule,
        TestCategory, Test, FacilityTest, DoctorBooking, LabBooking
    ]
    all_passed = True
    for m in all_models:
        cnt = m.objects.count()
        status = "PASSED (>=5)" if cnt >= 5 else "FAILED (<5)"
        if cnt < 5:
            all_passed = False
        print(f"  {m.__name__:<26} : {cnt:>4} rows  [{status}]")
    print("==================================================")
    if all_passed:
        print("🎉 SUCCESS: Every single table now has AT LEAST 5 rows!")
    print("==================================================")

if __name__ == '__main__':
    inject_data()
