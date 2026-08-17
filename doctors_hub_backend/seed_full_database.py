import os
import sys
import uuid
import random
import json
from datetime import date, time, timedelta, datetime
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()

from django.utils.text import slugify
from django.utils import timezone
from accounts.models import User, Role
from facilities.models import (
    Location, HospitalCategory, HospitalService, Hospital,
    DiagnosticCenterCategory, DiagnosticService, DiagnosticCenter, Chamber,
    FacilityMembership
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

def get_or_create_location(name, branch, loc_type, addr_info, phone="", email="", tagline="", badge="", rating=4.8, reviews=100, open_timing="24/7 Open"):
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
            address_line=addr_info.get("line", ""),
            area=addr_info.get("area", ""),
            city=addr_info.get("city", ""),
            district=addr_info.get("district", "Dhaka"),
            division=addr_info.get("division", "Dhaka"),
            postal_code=addr_info.get("post", ""),
            latitude=Decimal(str(addr_info["lat"])) if "lat" in addr_info else None,
            longitude=Decimal(str(addr_info["lng"])) if "lng" in addr_info else None,
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
        loc.address_line = addr_info.get("line", "")
        loc.area = addr_info.get("area", "")
        loc.city = addr_info.get("city", "")
        loc.district = addr_info.get("district", "Dhaka")
        loc.division = addr_info.get("division", "Dhaka")
        loc.postal_code = addr_info.get("post", "")
        if "lat" in addr_info:
            loc.latitude = Decimal(str(addr_info["lat"]))
        if "lng" in addr_info:
            loc.longitude = Decimal(str(addr_info["lng"]))
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
    print("Starting Comprehensive Database Seeding (5+ rows/table)")
    print("==================================================")

    # ----------------------------------------------------
    # 1. USERS (10+ rows)
    # ----------------------------------------------------
    print("\n[1/18] Seeding Users...")
    sample_users = [
        # Requested Test Users for Admin Panel
        {"phone": "0178787878", "password": "super123", "first_name": "Super", "last_name": "Admin", "role": Role.SUPER_ADMIN, "is_staff": True, "is_super": True},
        {"phone": "0177777777", "password": "popular123", "first_name": "Popular", "last_name": "Admin", "role": Role.FACILITY_ADMIN, "is_staff": False, "is_super": False},
        {"phone": "0188888888", "password": "square123", "first_name": "Square", "last_name": "Admin", "role": Role.FACILITY_ADMIN, "is_staff": False, "is_super": False},
        {"phone": "0199999999", "password": "harun123", "first_name": "Prof. Dr.", "last_name": "Harun-Or-Rashid", "role": Role.DOCTOR, "is_staff": False, "is_super": False},

        # Other Demo Users
        {"phone": "01711000001", "password": "Password123!", "first_name": "Dr. Rafiqul", "last_name": "Islam", "role": Role.DOCTOR, "is_staff": False, "is_super": False},
        {"phone": "01812000002", "password": "Password123!", "first_name": "Nusrat", "last_name": "Jahan", "role": "", "is_staff": False, "is_super": False},
        {"phone": "01913000003", "password": "Password123!", "first_name": "Tanvir", "last_name": "Ahmed", "role": "", "is_staff": False, "is_super": False},
        {"phone": "01614000004", "password": "Password123!", "first_name": "Sadia", "last_name": "Sultana", "role": "", "is_staff": False, "is_super": False},
        {"phone": "01715000005", "password": "Password123!", "first_name": "Kamrul", "last_name": "Hasan", "role": Role.FACILITY_ADMIN, "is_staff": False, "is_super": False},
        {"phone": "01816000006", "password": "Password123!", "first_name": "Farzana", "last_name": "Akter", "role": "", "is_staff": False, "is_super": False},
        {"phone": "01917000007", "password": "Password123!", "first_name": "Mahmudul", "last_name": "Karim", "role": "", "is_staff": False, "is_super": False},
        {"phone": "01718000008", "password": "Password123!", "first_name": "Ayesha", "last_name": "Siddiqua", "role": "", "is_staff": False, "is_super": False},
        {"phone": "01819000009", "password": "Password123!", "first_name": "Zubair", "last_name": "Hossain", "role": "", "is_staff": False, "is_super": False},
        {"phone": "01700000000", "password": "Password123!", "first_name": "Admin", "last_name": "User", "role": Role.SUPER_ADMIN, "is_staff": True, "is_super": True},
    ]

    created_users = []
    for u_data in sample_users:
        user = User.objects.filter(phone_number=u_data["phone"]).first()
        raw_pass = u_data.get("password", "Password123!")
        if not user:
            user = User.objects.create_user(
                phone_number=u_data["phone"],
                password=raw_pass,
                first_name=u_data["first_name"],
                last_name=u_data["last_name"],
                role=u_data.get("role", ""),
                is_staff=u_data["is_staff"],
                is_superuser=u_data["is_super"],
                is_active=True
            )
        else:
            user.role = u_data.get("role", "")
            user.is_staff = u_data["is_staff"]
            user.is_superuser = u_data["is_super"]
            user.first_name = u_data["first_name"]
            user.last_name = u_data["last_name"]
            user.set_password(raw_pass)
            user.save()
        created_users.append(user)
    print(f"✓ Users ready: {User.objects.count()} total.")

    # ----------------------------------------------------
    # 2. ADDRESS DEFINITIONS FOR LOCATIONS
    # ----------------------------------------------------
    addresses = {
        "panthapath-1": {"line": "18/F, Bir Uttam Qazi Nuruzzaman Sarak, Panthapath", "area": "Panthapath", "city": "Dhaka", "district": "Dhaka", "division": "Dhaka", "post": "1205", "lat": 23.7516, "lng": 90.3872},
        "dhanmondi-1": {"line": "House 16, Road 2, Dhanmondi", "area": "Dhanmondi", "city": "Dhaka", "district": "Dhaka", "division": "Dhaka", "post": "1205", "lat": 23.7465, "lng": 90.3760},
        "dhanmondi-2": {"line": "House 48, Road 9/A, Satmasjid Road", "area": "Dhanmondi", "city": "Dhaka", "district": "Dhaka", "division": "Dhaka", "post": "1209", "lat": 23.7480, "lng": 90.3720},
        "bashundhara-1": {"line": "Plot 81, Block E, Bashundhara R/A", "area": "Bashundhara", "city": "Dhaka", "district": "Dhaka", "division": "Dhaka", "post": "1229", "lat": 23.8103, "lng": 90.4312},
        "gulshan-1": {"line": "Plot 15, Road 71, Gulshan-2", "area": "Gulshan", "city": "Dhaka", "district": "Dhaka", "division": "Dhaka", "post": "1212", "lat": 23.7925, "lng": 90.4167},
        "mirpur-1": {"line": "Plot 4, Section 2, Mirpur", "area": "Mirpur", "city": "Dhaka", "district": "Dhaka", "division": "Dhaka", "post": "1216", "lat": 23.8067, "lng": 90.3644},
        "shyamoli-1": {"line": "Mirpur Road, Shyamoli", "area": "Shyamoli", "city": "Dhaka", "district": "Dhaka", "division": "Dhaka", "post": "1207", "lat": 23.7712, "lng": 90.3630},
        "chittagong-1": {"line": "122, K.B. Fazlul Kader Road, Panchlaish", "area": "Panchlaish", "city": "Chittagong", "district": "Chittagong", "division": "Chittagong", "post": "4203", "lat": 22.3569, "lng": 91.8340},
        "chittagong-2": {"line": "Agrabad Commercial Area", "area": "Agrabad", "city": "Chittagong", "district": "Chittagong", "division": "Chittagong", "post": "4100", "lat": 22.3275, "lng": 91.8123},
        "sylhet-1": {"line": "Nayasarak Road, Sylhet Sadar", "area": "Nayasarak", "city": "Sylhet", "district": "Sylhet", "division": "Sylhet", "post": "3100", "lat": 24.8949, "lng": 91.8687},
        "shahbagh-1": {"line": "Shahbagh Intersection, Ramna", "area": "Shahbagh", "city": "Dhaka", "district": "Dhaka", "division": "Dhaka", "post": "1000", "lat": 23.7380, "lng": 90.3950},
        "moakhali-1": {"line": "TB Gate Road, Mohakhali", "area": "Mohakhali", "city": "Dhaka", "district": "Dhaka", "division": "Dhaka", "post": "1212", "lat": 23.7776, "lng": 90.4054},
    }

    # ----------------------------------------------------
    # 3. HOSPITAL CATEGORIES (6+ rows)
    # ----------------------------------------------------
    print("\n[2/18] Seeding Hospital Categories...")
    hcat_data = [
        {"name": "General Hospital", "icon": "Building2", "desc": "Multi-specialty comprehensive healthcare facilities", "count": 18},
        {"name": "Specialized Cardiac Hospital", "icon": "HeartPulse", "desc": "Dedicated cardiology and cardiovascular surgery care", "count": 10},
        {"name": "Mother & Child Care", "icon": "Baby", "desc": "Specialized maternal, neonatal, and pediatric care", "count": 14},
        {"name": "Eye & Vision Hospital", "icon": "Eye", "desc": "Ophthalmology and advanced surgical eye care", "count": 7},
        {"name": "Cancer & Oncology Hospital", "icon": "Ribbon", "desc": "Comprehensive oncology, chemotherapy, and radiation facilities", "count": 6},
        {"name": "Orthopedic & Trauma Hospital", "icon": "Bone", "desc": "Bone, joint, spine, and trauma care facilities", "count": 9},
        {"name": "Kidney & Urology Hospital", "icon": "Activity", "desc": "Renal transplant, dialysis, and urology center", "count": 5},
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

    # ----------------------------------------------------
    # 4. HOSPITAL SERVICES (6+ rows)
    # ----------------------------------------------------
    print("\n[3/18] Seeding Hospital Services...")
    hsrv_data = [
        {"name": "24/7 Emergency & Trauma", "icon": "Siren", "desc": "Round-the-clock emergency medical response and triage"},
        {"name": "ICU & CCU Facilities", "icon": "Activity", "desc": "Intensive care and cardiac care units with life support"},
        {"name": "In-house 24/7 Pharmacy", "icon": "Pill", "desc": "24-hour certified medicine dispensing pharmacy"},
        {"name": "Cardiac Ambulance Service", "icon": "Truck", "desc": "Equipped cardiac and standard ICU ambulance transport"},
        {"name": "Modular Operation Theaters", "icon": "Scissors", "desc": "Modern sterile surgical suites with laminar airflow"},
        {"name": "24/7 Blood Bank & Transfusion", "icon": "Droplet", "desc": "Screened safe blood storage and voluntary donor registry"},
        {"name": "Neonatal ICU (NICU)", "icon": "Baby", "desc": "Advanced incubator care for premature and critical newborns"},
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

    # ----------------------------------------------------
    # 5. DIAGNOSTIC CENTER CATEGORIES (Private, Government)
    # ----------------------------------------------------
    print("\n[4/18] Seeding Diagnostic Center Categories...")
    dcat_data = [
        {"name": "Private", "icon": "Building2", "desc": "Privately operated diagnostic centers and healthcare pathology laboratories"},
        {"name": "Government", "icon": "ShieldCheck", "desc": "Government hospital-affiliated and public diagnostic facilities"},
    ]
    # Remove older obsolete categories
    DiagnosticCenterCategory.objects.exclude(name__in=["Private", "Government"]).delete()

    dcat_map = {}
    for dc in dcat_data:
        slug = slugify(dc["name"])
        obj, _ = DiagnosticCenterCategory.objects.update_or_create(
            slug=slug,
            defaults={
                "name": dc["name"],
                "icon": dc["icon"],
                "description": dc["desc"]
            }
        )
        dcat_map[dc["name"]] = obj
    print(f"✓ Diagnostic Center Categories ready: {DiagnosticCenterCategory.objects.count()} total ({', '.join(dcat_map.keys())}).")

    # ----------------------------------------------------
    # 6. DIAGNOSTIC SERVICES (6+ rows)
    # ----------------------------------------------------
    print("\n[5/18] Seeding Diagnostic Services...")
    dsrv_data = [
        {"name": "Home Sample Collection", "icon": "Home", "desc": "Trained phlebotomist visit for at-home specimen collection"},
        {"name": "Digital Online Reports", "icon": "FileText", "desc": "Instant SMS download link and secure portal"},
        {"name": "Express / Stat Testing", "icon": "Zap", "desc": "Urgent test processing with fast turnaround"},
        {"name": "Health Checkup Packages", "icon": "ShieldCheck", "desc": "Comprehensive wellness and executive checkups"},
        {"name": "Automated Biochemistry Lab", "icon": "Cpu", "desc": "Automated analyzers with zero contamination"},
        {"name": "Online Appointment Booking", "icon": "Calendar", "desc": "Pre-booking for tests and investigations"},
        {"name": "Molecular PCR Testing", "icon": "Dna", "desc": "High precision real-time PCR diagnostics"},
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

    # ----------------------------------------------------
    # 7. HOSPITALS (6+ rows)
    # ----------------------------------------------------
    print("\n[6/18] Seeding Hospitals & Locations...")
    hospitals_info = [
        {"name": "Square Hospital", "branch": "Panthapath Main", "addr_key": "panthapath-1", "phone": "+8801713377775", "email": "info@squarehospital.com", "tagline": "Care at its Best", "badge": "Top Rated", "rating": 4.85, "reviews": 340, "timing": "24/7 Open", "cat": "General Hospital", "srvs": ["24/7 Emergency & Trauma", "ICU & CCU Facilities", "In-house 24/7 Pharmacy", "Cardiac Ambulance Service", "Modular Operation Theaters", "24/7 Blood Bank & Transfusion"]},
        {"name": "Evercare Hospital", "branch": "Dhaka Branch", "addr_key": "bashundhara-1", "phone": "+88028431661", "email": "info@evercarebd.com", "tagline": "Transforming Healthcare", "badge": "Accredited", "rating": 4.80, "reviews": 290, "timing": "24/7 Open", "cat": "Cancer & Oncology Hospital", "srvs": ["24/7 Emergency & Trauma", "ICU & CCU Facilities", "In-house 24/7 Pharmacy", "Cardiac Ambulance Service", "Modular Operation Theaters", "Neonatal ICU (NICU)"]},
        {"name": "United Hospital", "branch": "Gulshan Branch", "addr_key": "gulshan-1", "phone": "+88028836000", "email": "info@uhlbd.com", "tagline": "Touching Lives with Care", "badge": "Premium Care", "rating": 4.75, "reviews": 220, "timing": "24/7 Open", "cat": "General Hospital", "srvs": ["24/7 Emergency & Trauma", "ICU & CCU Facilities", "Cardiac Ambulance Service", "In-house 24/7 Pharmacy"]},
        {"name": "Labaid Specialized Hospital", "branch": "Dhanmondi Branch", "addr_key": "dhanmondi-1", "phone": "+8801713333337", "email": "info@labaidgroup.com", "tagline": "Committed to Health", "badge": "Cardiac Center", "rating": 4.70, "reviews": 195, "timing": "24/7 Open", "cat": "Specialized Cardiac Hospital", "srvs": ["24/7 Emergency & Trauma", "ICU & CCU Facilities", "In-house 24/7 Pharmacy", "Cardiac Ambulance Service"]},
        {"name": "National Heart Foundation Hospital", "branch": "Mirpur Branch", "addr_key": "mirpur-1", "phone": "+88029033442", "email": "info@nhf.org.bd", "tagline": "Dedicated Heart Care", "badge": "Non-profit", "rating": 4.65, "reviews": 150, "timing": "24/7 Open", "cat": "Specialized Cardiac Hospital", "srvs": ["24/7 Emergency & Trauma", "ICU & CCU Facilities", "Cardiac Ambulance Service"]},
        {"name": "Bangladesh Specialized Hospital", "branch": "Shyamoli Branch", "addr_key": "shyamoli-1", "phone": "+8809666700100", "email": "info@bsh.com.bd", "tagline": "Excellence in Healthcare", "badge": "Verified", "rating": 4.75, "reviews": 170, "timing": "24/7 Open", "cat": "Orthopedic & Trauma Hospital", "srvs": ["24/7 Emergency & Trauma", "ICU & CCU Facilities", "Modular Operation Theaters", "In-house 24/7 Pharmacy"]},
        {"name": "Chevron Hospital", "branch": "Panchlaish Branch", "addr_key": "chittagong-1", "phone": "+88031652860", "email": "info@chevronctg.com", "tagline": "Pioneering Patient Care in Chattogram", "badge": "Regional Leader", "rating": 4.70, "reviews": 180, "timing": "24/7 Open", "cat": "General Hospital", "srvs": ["24/7 Emergency & Trauma", "ICU & CCU Facilities", "Modular Operation Theaters"]},
    ]

    hosp_map = {}
    for h in hospitals_info:
        loc = get_or_create_location(
            name=h["name"],
            branch=h["branch"],
            loc_type=Location.LocationType.HOSPITAL,
            addr_info=addresses[h["addr_key"]],
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
        if h["cat"] in hcat_map:
            hosp.category = hcat_map[h["cat"]]
            hosp.save()
        for srv_name in h["srvs"]:
            if srv_name in hsrv_map:
                hosp.services.add(hsrv_map[srv_name])
        hosp_map[h["name"]] = hosp

    print(f"✓ Hospitals ready: {Hospital.objects.count()} total.")

    # ----------------------------------------------------
    # 8. DIAGNOSTIC CENTERS (6+ rows)
    # ----------------------------------------------------
    print("\n[7/18] Seeding Diagnostic Centers...")
    diag_centers_info = [
        {"name": "Popular Diagnostic Centre", "branch": "Dhanmondi Branch", "addr_key": "dhanmondi-1", "phone": "+8809613787801", "email": "dhanmondi@populardiagnostic.com", "tagline": "Accurate & Reliable Diagnostics", "badge": "Popular Choice", "rating": 4.65, "reviews": 560, "timing": "07:00 AM - 11:00 PM", "cat": "Private", "srvs": ["Home Sample Collection", "Digital Online Reports", "Express / Stat Testing", "Health Checkup Packages", "Automated Biochemistry Lab"], "test_cats": ["Biochemistry & Routine Blood", "Thyroid & Hormonal Panel", "Radiology & Medical Imaging", "Cardiovascular Investigations", "Urine & Renal Profile", "Microbiology, Culture & Serology", "Molecular & Specialized Diagnostics"]},
        {"name": "Ibn Sina Diagnostic Center", "branch": "Dhanmondi Branch", "addr_key": "dhanmondi-2", "phone": "+88029126625", "email": "dhanmondi@ibnsinatrust.com", "tagline": "Serving Humanity with Integrity", "badge": "Trusted", "rating": 4.55, "reviews": 420, "timing": "07:00 AM - 11:00 PM", "cat": "Private", "srvs": ["Home Sample Collection", "Digital Online Reports", "Health Checkup Packages", "Automated Biochemistry Lab"], "test_cats": ["Biochemistry & Routine Blood", "Thyroid & Hormonal Panel", "Radiology & Medical Imaging", "Cardiovascular Investigations", "Urine & Renal Profile", "Microbiology, Culture & Serology"]},
        {"name": "Medinova Medical Services", "branch": "Dhanmondi Main", "addr_key": "dhanmondi-1", "phone": "+880258610385", "email": "info@medinova.com.bd", "tagline": "Quality Healthcare You Can Trust", "badge": "Established", "rating": 4.45, "reviews": 240, "timing": "07:30 AM - 10:30 PM", "cat": "Private", "srvs": ["Digital Online Reports", "Health Checkup Packages", "Express / Stat Testing"], "test_cats": ["Biochemistry & Routine Blood", "Radiology & Medical Imaging", "Cardiovascular Investigations", "Urine & Renal Profile"]},
        {"name": "Praava Health", "branch": "Banani Branch", "addr_key": "gulshan-1", "phone": "+8801847277777", "email": "care@praavahealth.com", "tagline": "Your Trusted Family Health Partner", "badge": "Modern", "rating": 4.80, "reviews": 260, "timing": "07:30 AM - 10:00 PM", "cat": "Private", "srvs": ["Home Sample Collection", "Digital Online Reports", "Express / Stat Testing", "Molecular PCR Testing"], "test_cats": ["Biochemistry & Routine Blood", "Thyroid & Hormonal Panel", "Radiology & Medical Imaging", "Molecular & Specialized Diagnostics"]},
        {"name": "Thyrocare Bangladesh", "branch": "Banani Central Lab", "addr_key": "gulshan-1", "phone": "+8809666737373", "email": "info@thyrocare.com.bd", "tagline": "World Class Automated Pathology", "badge": "Fully Automated", "rating": 4.75, "reviews": 320, "timing": "07:00 AM - 09:00 PM", "cat": "Private", "srvs": ["Home Sample Collection", "Digital Online Reports", "Automated Biochemistry Lab", "Health Checkup Packages"], "test_cats": ["Biochemistry & Routine Blood", "Thyroid & Hormonal Panel", "Molecular & Specialized Diagnostics", "Urine & Renal Profile"]},
        {"name": "BSMMU Diagnostic Laboratory", "branch": "Shahbagh Central", "addr_key": "shahbagh-1", "phone": "+88029661051", "email": "info@bsmmu.edu.bd", "tagline": "Premier Public Medical Research & Diagnostics", "badge": "Government / University", "rating": 4.60, "reviews": 480, "timing": "08:00 AM - 08:00 PM", "cat": "Government", "srvs": ["Digital Online Reports", "Automated Biochemistry Lab", "Molecular PCR Testing"], "test_cats": ["Biochemistry & Routine Blood", "Thyroid & Hormonal Panel", "Radiology & Medical Imaging", "Cardiovascular Investigations", "Microbiology, Culture & Serology", "Urine & Renal Profile", "Molecular & Specialized Diagnostics"]},
        {"name": "Dhaka Medical College Diagnostic Lab", "branch": "Bakshibazar Main", "addr_key": "shahbagh-1", "phone": "+880255165088", "email": "info@dmch.gov.bd", "tagline": "National Public Tertiary Diagnostic Center", "badge": "Government", "rating": 4.50, "reviews": 390, "timing": "24/7 Open", "cat": "Government", "srvs": ["Digital Online Reports", "Express / Stat Testing", "Automated Biochemistry Lab"], "test_cats": ["Biochemistry & Routine Blood", "Radiology & Medical Imaging", "Cardiovascular Investigations", "Microbiology, Culture & Serology", "Urine & Renal Profile"]},
        {"name": "Chevron Clinical Laboratory", "branch": "Chittagong Central", "addr_key": "chittagong-1", "phone": "+88031652533", "email": "lab@chevronctg.com", "tagline": "Comprehensive Diagnostic Precision", "badge": "ISO 15189", "rating": 4.70, "reviews": 210, "timing": "07:00 AM - 11:00 PM", "cat": "Private", "srvs": ["Home Sample Collection", "Digital Online Reports", "Automated Biochemistry Lab"], "test_cats": ["Biochemistry & Routine Blood", "Radiology & Medical Imaging", "Cardiovascular Investigations", "Microbiology, Culture & Serology", "Urine & Renal Profile"]},
    ]

    diag_map = {}
    for d in diag_centers_info:
        loc = get_or_create_location(
            name=d["name"],
            branch=d["branch"],
            loc_type=Location.LocationType.DIAGNOSTIC_CENTER,
            addr_info=addresses[d["addr_key"]],
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
        if d["cat"] in dcat_map:
            diag.category = dcat_map[d["cat"]]
            diag.save()
        for srv_name in d["srvs"]:
            if srv_name in dsrv_map:
                diag.services.add(dsrv_map[srv_name])
        diag_map[d["name"]] = diag

    print(f"✓ Diagnostic Centers ready: {DiagnosticCenter.objects.count()} total.")

    # ----------------------------------------------------
    # 9. DOCTOR SPECIALTIES (6+ rows)
    # ----------------------------------------------------
    print("\n[8/18] Seeding Doctor Specialties...")
    spec_data = [
        {"name": "Internal Medicine", "icon": "Stethoscope", "desc": "Comprehensive diagnosis and management of adult diseases"},
        {"name": "Cardiology", "icon": "Heart", "desc": "Heart diseases, hypertension, and cardiovascular care"},
        {"name": "Gynecology & Obstetrics", "icon": "UserCheck", "desc": "Women's health, maternity care, and fertility treatment"},
        {"name": "Neurology & Brain", "icon": "Brain", "desc": "Disorders of the central & peripheral nervous system"},
        {"name": "Orthopedic Surgery", "icon": "Bone", "desc": "Bone fractures, joints, spine, and arthritis care"},
        {"name": "Pediatrics & Child Care", "icon": "Baby", "desc": "Infant, child, and adolescent specialized healthcare"},
        {"name": "Dermatology & Skin Care", "icon": "Sparkles", "desc": "Skin, hair, nails, and cosmetic dermatology"},
        {"name": "Gastroenterology & Liver", "icon": "Activity", "desc": "Digestive tract, stomach, liver, and pancreas care"},
        {"name": "Nephrology & Kidney", "icon": "Droplet", "desc": "Kidney disease management and dialysis care"},
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

    # ----------------------------------------------------
    # 10. DOCTORS (6+ rows)
    # ----------------------------------------------------
    print("\n[9/18] Seeding Doctors...")
    doctors_info = [
        {"name": "Prof. Dr. A. B. M. Abdullah", "qual": "MBBS, FCPS (Medicine), FRCP (Edin)", "exp": "35 Years Exp.", "specs": ["Internal Medicine"]},
        {"name": "Prof. Dr. M. G. Azam", "qual": "MBBS, MD (Cardiology), FACC (USA)", "exp": "25 Years Exp.", "specs": ["Cardiology"]},
        {"name": "Prof. Dr. Laila Arjumand Banu", "qual": "MBBS, FCPS (Obs & Gynae), FICS", "exp": "28 Years Exp.", "specs": ["Gynecology & Obstetrics"]},
        {"name": "Dr. Kazi Naushad-Un-Nabi", "qual": "MBBS, FCPS (Pediatrics), MD (Neurology)", "exp": "20 Years Exp.", "specs": ["Neurology & Brain", "Pediatrics & Child Care"]},
        {"name": "Prof. Dr. Pranab Kumar Karmaker", "qual": "MBBS, MS (Orthopedics)", "exp": "30 Years Exp.", "specs": ["Orthopedic Surgery"]},
        {"name": "Dr. Farhana Akter", "qual": "MBBS, DDV (Dermatology)", "exp": "12 Years Exp.", "specs": ["Dermatology & Skin Care"]},
        {"name": "Dr. Salma Begum", "qual": "MBBS, FCPS (Gastroenterology)", "exp": "19 Years Exp.", "specs": ["Gastroenterology & Liver"]},
        {"name": "Prof. Dr. Harun-Or-Rashid", "qual": "MBBS, FCPS (Nephrology), PhD", "exp": "32 Years Exp.", "specs": ["Nephrology & Kidney", "Internal Medicine"]},
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

    # Link doctors to doctor users
    doc_user_harun = User.objects.filter(phone_number="0199999999").first()
    if doc_user_harun and "Prof. Dr. Harun-Or-Rashid" in doc_map:
        harun_doc = doc_map["Prof. Dr. Harun-Or-Rashid"]
        harun_doc.user = doc_user_harun
        harun_doc.save()

    doc_user_1 = User.objects.filter(phone_number="01711000001").first()
    if doc_user_1 and "Prof. Dr. A. B. M. Abdullah" in doc_map:
        first_doc = doc_map["Prof. Dr. A. B. M. Abdullah"]
        first_doc.user = doc_user_1
        first_doc.save()

    # Link facility admin users to specific facilities
    # Popular Diagnostic Centre (Dhanmondi Branch) -> 0177777777
    popular_admin = User.objects.filter(phone_number="0177777777").first()
    popular_loc = Location.objects.filter(name__icontains="Popular Diagnostic Centre", branch__icontains="Dhanmondi").first()
    if popular_admin and popular_loc:
        FacilityMembership.objects.get_or_create(
            user=popular_admin,
            location=popular_loc,
            defaults={"role": FacilityMembership.MemberRole.ADMIN}
        )

    # Square Hospital (Panthapath Main) -> 0188888888
    square_admin = User.objects.filter(phone_number="0188888888").first()
    square_loc = Location.objects.filter(name__icontains="Square Hospital").first()
    if square_admin and square_loc:
        FacilityMembership.objects.get_or_create(
            user=square_admin,
            location=square_loc,
            defaults={"role": FacilityMembership.MemberRole.ADMIN}
        )

    # General facility admin demo user (01715000005)
    fac_user = User.objects.filter(phone_number="01715000005").first()
    if fac_user:
        for loc in Location.objects.filter(location_type__in=["hospital", "diagnostic_center"]):
            FacilityMembership.objects.get_or_create(
                user=fac_user,
                location=loc,
                defaults={"role": FacilityMembership.MemberRole.ADMIN}
            )

    print(f"✓ Doctors ready: {Doctor.objects.count()} total.")

    # ----------------------------------------------------
    # 11. CHAMBERS (6+ rows)
    # ----------------------------------------------------
    print("\n[10/18] Seeding Chambers...")
    chambers_info = [
        {"name": "Prof. Abdullah Consultation Chamber", "branch": "Green Road", "addr_key": "panthapath-1", "doc": "Prof. Dr. A. B. M. Abdullah", "asst_phone": "+8801711223344", "timing": "05:00 PM - 09:00 PM"},
        {"name": "Prof. Azam Cardiac Chamber", "branch": "Dhanmondi", "addr_key": "dhanmondi-1", "doc": "Prof. Dr. M. G. Azam", "asst_phone": "+8801819556677", "timing": "06:00 PM - 09:30 PM"},
        {"name": "Dr. Laila Women Care Chamber", "branch": "Dhanmondi", "addr_key": "dhanmondi-2", "doc": "Prof. Dr. Laila Arjumand Banu", "asst_phone": "+8801912334455", "timing": "04:30 PM - 08:30 PM"},
        {"name": "Dr. Naushad Child Care Chamber", "branch": "Gulshan", "addr_key": "gulshan-1", "doc": "Dr. Kazi Naushad-Un-Nabi", "asst_phone": "+8801611778899", "timing": "05:00 PM - 08:00 PM"},
        {"name": "Prof. Karmaker Ortho Spine Chamber", "branch": "Panthapath", "addr_key": "panthapath-1", "doc": "Prof. Dr. Pranab Kumar Karmaker", "asst_phone": "+8801722889900", "timing": "05:30 PM - 09:00 PM"},
        {"name": "Dr. Farhana Skin & Laser Chamber", "branch": "Uttara", "addr_key": "bashundhara-1", "doc": "Dr. Farhana Akter", "asst_phone": "+8801733445566", "timing": "04:00 PM - 08:00 PM"},
        {"name": "Prof. Harun Kidney Care Chamber", "branch": "Shyamoli", "addr_key": "shyamoli-1", "doc": "Prof. Dr. Harun-Or-Rashid", "asst_phone": "+8801755667788", "timing": "05:00 PM - 09:00 PM"},
    ]
    for ch in chambers_info:
        loc = get_or_create_location(
            name=ch["name"],
            branch=ch["branch"],
            loc_type=Location.LocationType.CHAMBER,
            addr_info=addresses[ch["addr_key"]],
            phone=ch["asst_phone"],
            tagline="Private Specialist Consultation",
            badge="Verified Chamber",
            rating=4.90,
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

    # ----------------------------------------------------
    # 12. DOCTOR AFFILIATIONS & SCHEDULES (12+ affs, 20+ schedules)
    # ----------------------------------------------------
    print("\n[11/18] Seeding Doctor Affiliations & Schedules...")
    affiliations_data = [
        {"doc": "Prof. Dr. A. B. M. Abdullah", "loc_name": "Square Hospital", "type": "OPD", "fee": Decimal("2000.00"), "days": [("Saturday", time(17, 0), time(20, 0)), ("Monday", time(17, 0), time(20, 0)), ("Wednesday", time(17, 0), time(20, 0))]},
        {"doc": "Prof. Dr. A. B. M. Abdullah", "loc_name": "Prof. Abdullah Consultation Chamber", "type": "Chamber", "fee": Decimal("1500.00"), "days": [("Sunday", time(18, 0), time(21, 0)), ("Tuesday", time(18, 0), time(21, 0)), ("Thursday", time(18, 0), time(21, 0))]},
        {"doc": "Prof. Dr. M. G. Azam", "loc_name": "Square Hospital", "type": "In-patient", "fee": Decimal("2500.00"), "days": [("Sunday", time(10, 0), time(14, 0)), ("Tuesday", time(10, 0), time(14, 0))]},
        {"doc": "Prof. Dr. M. G. Azam", "loc_name": "Prof. Azam Cardiac Chamber", "type": "Chamber", "fee": Decimal("1800.00"), "days": [("Saturday", time(18, 0), time(21, 30)), ("Monday", time(18, 0), time(21, 30))]},
        {"doc": "Prof. Dr. Laila Arjumand Banu", "loc_name": "Popular Diagnostic Centre", "type": "Chamber", "fee": Decimal("1200.00"), "days": [("Saturday", time(16, 0), time(19, 0)), ("Wednesday", time(16, 0), time(19, 0)), ("Thursday", time(16, 0), time(19, 0))]},
        {"doc": "Prof. Dr. Laila Arjumand Banu", "loc_name": "Dr. Laila Women Care Chamber", "type": "Chamber", "fee": Decimal("1200.00"), "days": [("Sunday", time(16, 30), time(20, 30)), ("Tuesday", time(16, 30), time(20, 30))]},
        {"doc": "Prof. Dr. Pranab Kumar Karmaker", "loc_name": "Evercare Hospital", "type": "OPD", "fee": Decimal("1800.00"), "days": [("Sunday", time(10, 0), time(13, 0)), ("Thursday", time(10, 0), time(13, 0))]},
        {"doc": "Dr. Kazi Naushad-Un-Nabi", "loc_name": "United Hospital", "type": "OPD", "fee": Decimal("1500.00"), "days": [("Monday", time(16, 0), time(19, 0)), ("Wednesday", time(16, 0), time(19, 0))]},
        {"doc": "Dr. Farhana Akter", "loc_name": "Dr. Farhana Skin & Laser Chamber", "type": "Chamber", "fee": Decimal("1000.00"), "days": [("Saturday", time(16, 0), time(20, 0)), ("Monday", time(16, 0), time(20, 0)), ("Wednesday", time(16, 0), time(20, 0))]},
        {"doc": "Dr. Salma Begum", "loc_name": "Labaid Specialized Hospital", "type": "OPD", "fee": Decimal("1400.00"), "days": [("Saturday", time(17, 0), time(20, 0)), ("Tuesday", time(17, 0), time(20, 0))]},
        {"doc": "Prof. Dr. Harun-Or-Rashid", "loc_name": "Bangladesh Specialized Hospital", "type": "OPD", "fee": Decimal("2000.00"), "days": [("Sunday", time(17, 0), time(21, 0)), ("Wednesday", time(17, 0), time(21, 0))]},
        {"doc": "Prof. Dr. Harun-Or-Rashid", "loc_name": "Prof. Harun Kidney Care Chamber", "type": "Chamber", "fee": Decimal("1600.00"), "days": [("Monday", time(17, 30), time(21, 0)), ("Thursday", time(17, 30), time(21, 0))]},
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

    # ----------------------------------------------------
    # 13. TEST CATEGORIES & TESTS (Labaid Department Tests)
    # ----------------------------------------------------
    print("\n[12/18] Seeding Labaid Department-Wise Test Categories & Tests...")
    catalog_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'labaid_catalog.json')
    if os.path.exists(catalog_file):
        with open(catalog_file, 'r') as f:
            labaid_catalog = json.load(f)
    else:
        # Fallback inline or scraper
        from ingest_labaid_tests import fetch_labaid_catalog
        labaid_catalog = fetch_labaid_catalog()

    tcat_map = {}
    test_map = {}
    for idx, item in enumerate(labaid_catalog, 1):
        slug = item["slug"]
        cat_obj = TestCategory.objects.filter(slug=slug).first()
        if not cat_obj:
            cat_obj = TestCategory.objects.create(
                id=seed_uuid(f"TestCategory:{slug}"),
                name=item["name"],
                slug=slug,
                icon=item.get("icon", "FlaskConical"),
                description=item.get("description", f"Diagnostic tests performed under {item['name']}."),
                is_active=True,
                order=idx
            )
        else:
            cat_obj.name = item["name"]
            cat_obj.icon = item.get("icon", "FlaskConical")
            cat_obj.description = item.get("description", f"Diagnostic tests performed under {item['name']}.")
            cat_obj.save()
        tcat_map[item["name"]] = cat_obj
        tcat_map[slug] = cat_obj

        for t in item.get("tests", []):
            t_slug = f"{slugify(t['name'])}-{slug}"
            t_obj = Test.objects.filter(category=cat_obj, name=t["name"]).first()
            sample = t.get("sample", "Blood (Serum)")
            fasting = t.get("fasting", False)
            hours = t.get("hours", 12)
            prep = t.get("prep", "No special preparation needed.")
            desc = t.get("desc", f"Standard laboratory investigation for {t['name']} under {cat_obj.name}.")

            if not t_obj:
                t_obj = Test.objects.create(
                    id=seed_uuid(f"Test:{t_slug}"),
                    category=cat_obj,
                    name=t["name"],
                    slug=slugify(t["name"]),
                    code=t.get("code", f"REF-{idx:02d}"),
                    sample_type=sample,
                    fasting_required=fasting,
                    report_time_hours=hours,
                    preparation_instructions=prep,
                    description=desc,
                    is_active=True
                )
            else:
                t_obj.code = t.get("code", f"REF-{idx:02d}")
                t_obj.sample_type = sample
                t_obj.fasting_required = fasting
                t_obj.report_time_hours = hours
                t_obj.preparation_instructions = prep
                t_obj.description = desc
                t_obj.save()
            test_map[t["name"]] = t_obj

    print(f"✓ Test Categories: {TestCategory.objects.count()} total.")
    print(f"✓ Medical Tests ready: {Test.objects.count()} total.")

    # ----------------------------------------------------
    # 14. FACILITY TESTS (Auto-associate tests to facilities)
    # ----------------------------------------------------
    print("\n[14/18] Auto-Associating Tests & Categories to Diagnostic Centers and Hospitals...")
    
    diag_centers = list(DiagnosticCenter.objects.select_related('location').all())
    hospitals = list(Hospital.objects.select_related('location').all())
    facilities = [dc.location for dc in diag_centers] + [h.location for h in hospitals if h.has_diagnostic_center]
    all_tests = list(Test.objects.select_related('category').all())

    for idx, loc in enumerate(facilities):
        assigned_tests = all_tests if idx % 2 == 0 else all_tests[:len(all_tests)//2]
        
        for t_obj in assigned_tests:
            base_p = Decimal(str(300 + (abs(hash(t_obj.name)) % 35) * 50))
            if base_p < 200:
                base_p = Decimal("250.00")
            
            disc_p = None
            badge = ""
            orig_p = None
            if abs(hash(t_obj.name + str(loc.id))) % 3 == 0:
                orig_p = base_p
                disc_p = (base_p * Decimal("0.85")).quantize(Decimal("1.00"))
                price_val = disc_p
                badge = "15% OFF"
            else:
                price_val = base_p

            FacilityTest.objects.update_or_create(
                location=loc,
                test=t_obj,
                defaults={
                    "price": price_val,
                    "discounted_price": disc_p,
                    "original_price": orig_p,
                    "discount": badge,
                    "report_time": "Same Day (6-8 Hours)" if (t_obj.report_time_hours or 12) <= 12 else "Next Day (24 Hours)",
                    "is_available": True,
                    "home_sample_collection": (t_obj.sample_type or '').startswith("Blood") or (t_obj.sample_type or '').startswith("Urine")
                }
            )

    print(f"✓ Facility Tests created: {FacilityTest.objects.count()} total across diagnostic centers and hospital labs.")

    # ----------------------------------------------------
    # 15. DOCTOR BOOKINGS (8+ rows with valid slots matching schedules)
    # ----------------------------------------------------
    print("\n[15/18] Seeding Doctor Bookings...")
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
        {"patient": "Ayesha Siddiqua", "notes": "Skin allergy follow-up review", "status": BaseBooking.Status.CONFIRMED},
    ]

    day_map = {
        'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3,
        'Friday': 4, 'Saturday': 5, 'Sunday': 6
    }

    today = date.today()

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
            except Exception as e:
                print(f"  Note on doctor booking: {e}")

    print(f"✓ Doctor Bookings ready: {DoctorBooking.objects.count()} total.")

    # ----------------------------------------------------
    # 16. LAB BOOKINGS (8+ rows)
    # ----------------------------------------------------
    print("\n[16/18] Seeding Lab Bookings...")
    sample_fts = list(FacilityTest.objects.all()[:15])
    
    lab_bookings_data = [
        {"patient": "Rafiqul Islam", "phone": "01711000001", "addr_line": "House 14, Road 4", "area": "Dhanmondi", "city": "Dhaka", "district": "Dhaka", "notes": "Please bring EDTA blood collection tubes", "status": BaseBooking.Status.CONFIRMED, "days_offset": 2},
        {"patient": "Nusrat Jahan", "phone": "01812000002", "addr_line": "Flat 4B, Green Road", "area": "Panthapath", "city": "Dhaka", "district": "Dhaka", "notes": "Morning fasting sample collection at home", "status": BaseBooking.Status.PENDING, "days_offset": 3},
        {"patient": "Tanvir Ahmed", "phone": "01913000003", "addr_line": "House 88, Road 11", "area": "Banani", "city": "Dhaka", "district": "Dhaka", "notes": "Fasting lipid profile strictly maintained", "status": BaseBooking.Status.CONFIRMED, "days_offset": 4},
        {"patient": "Sadia Sultana", "phone": "01614000004", "addr_line": "Plot 12, Block D", "area": "Mirpur-1", "city": "Dhaka", "district": "Dhaka", "notes": "Walk-in routine checkup visit", "status": BaseBooking.Status.COMPLETED, "days_offset": -5},
        {"patient": "Kamrul Hasan", "phone": "01715000005", "addr_line": "House 25, Sector 7", "area": "Uttara", "city": "Dhaka", "district": "Dhaka", "notes": "Doctor prescription attached with booking", "status": BaseBooking.Status.CONFIRMED, "days_offset": 5},
        {"patient": "Farzana Akter", "phone": "01816000006", "addr_line": "Flat 6C, Agrabad C/A", "area": "Agrabad", "city": "Chittagong", "district": "Chittagong", "notes": "Thyroid profile blood collection", "status": BaseBooking.Status.PENDING, "days_offset": 4},
        {"patient": "Mahmudul Karim", "phone": "01917000007", "addr_line": "House 42, Nayasarak", "area": "Nayasarak", "city": "Sylhet", "district": "Sylhet", "notes": "Kidney function test at home", "status": BaseBooking.Status.CONFIRMED, "days_offset": 3},
        {"patient": "Ayesha Siddiqua", "phone": "01718000008", "addr_line": "House 10, Road 3, Dhanmondi", "area": "Dhanmondi", "city": "Dhaka", "district": "Dhaka", "notes": "Allergy IgE test panel collection", "status": BaseBooking.Status.PENDING, "days_offset": 6},
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
                "pickup_address_line": lb["addr_line"],
                "pickup_area": lb["area"],
                "pickup_city": lb["city"],
                "pickup_district": lb["district"],
                "status": lb["status"],
                "notes": lb["notes"]
            }
        )

    print(f"✓ Lab Bookings ready: {LabBooking.objects.count()} total.")

    # ----------------------------------------------------
    # 17. SUMMARY VERIFICATION
    # ----------------------------------------------------
    print("\n==================================================")
    print("FINAL DATABASE TABLE ROW COUNTS VERIFICATION:")
    print("==================================================")
    all_models = [
        User, Location, HospitalCategory, HospitalService, Hospital,
        DiagnosticCenterCategory, DiagnosticService, DiagnosticCenter, Chamber,
        DoctorSpecialty, Doctor, DoctorAffiliation, AffiliationSchedule,
        TestCategory, Test, FacilityTest, DoctorBooking, LabBooking
    ]
    all_passed = True
    for m in all_models:
        cnt = m.objects.count()
        req_min = 2 if m == DiagnosticCenterCategory else 5
        status = f"PASSED (>={req_min})" if cnt >= req_min else f"FAILED (<{req_min})"
        if cnt < req_min:
            all_passed = False
        print(f"  {m.__name__:<26} : {cnt:>4} rows  [{status}]")
    print("==================================================")
    if all_passed:
        print("🎉 SUCCESS: All database tables are properly seeded!")
    print("==================================================")

if __name__ == '__main__':
    inject_data()
