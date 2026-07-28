from django.core.management.base import BaseCommand
from api.models import (
    User, Hospital, Branch, DoctorSpecialty, HospitalSpecialty, TestCategory, PathologyTest, BranchTest,
    Doctor, DoctorAffiliation, AffiliationSchedule
)
import datetime

class Command(BaseCommand):
    help = 'Populates mock data for Hospitals, Branches, Doctors, Tests, and Schedules'

    def handle(self, *args, **options):
        self.stdout.write("Clearing old data...")
        AffiliationSchedule.objects.all().delete()
        DoctorAffiliation.objects.all().delete()
        BranchTest.objects.all().delete()
        Doctor.objects.all().delete()
        PathologyTest.objects.all().delete()
        DoctorSpecialty.objects.all().delete()
        HospitalSpecialty.objects.all().delete()
        TestCategory.objects.all().delete()
        Branch.objects.all().delete()
        Hospital.objects.all().delete()

        self.stdout.write("Creating Default Admin User...")
        if not User.objects.filter(phone_number='01700000000').exists():
            User.objects.create_superuser(
                phone_number='01700000000',
                password='admin123',
                first_name='Admin',
                last_name='User'
            )
            self.stdout.write(self.style.SUCCESS("Admin user created: Phone 01700000000 / Password admin123"))

        self.stdout.write("Creating Hospitals...")
        h1 = Hospital.objects.create(
            id="ibn-sina",
            name="Ibn Sina Healthcare Group",
            description="Leading nationwide hospital network offering multi-branch inpatient & outpatient services.",
            logo="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80"
        )
        h2 = Hospital.objects.create(
            id="popular",
            name="Popular Diagnostic & Medical Center",
            description="Nationwide healthcare pioneer providing state-of-the-art diagnostic imaging and specialist doctor chambers.",
            logo="https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80"
        )

        self.stdout.write("Creating Branches...")
        b1 = Branch.objects.create(
            id="ibn-sina-dhanmondi",
            hospital=h1,
            hospital_name="Ibn Sina Healthcare Group",
            name="Dhanmondi Branch",
            facility_types=["Hospital", "Diagnostic Center"],
            location="House 48, Road 9/A, Dhanmondi, Dhaka",
            city="Dhaka",
            verified=True,
            rating=4.9,
            reviews_count=320,
            open_timing="07:30 AM - 10:30 PM",
            contact_phone="+880 9610-010615",
            tagline="Premier Multispecialty OPD & Inpatient Hospital in Dhanmondi",
            badge="Super Partner",
            image="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80",
            services=["24/7 ICU & In-patient", "Specialist OPD Consultation", "128-Slice CT Scan", "Automated Pathology Lab"],
            description="High-end radiology, 24/7 emergency response, inpatient surgery, automated pathology lab testing."
        )

        b2 = Branch.objects.create(
            id="ibn-sina-mirpur",
            hospital=h1,
            hospital_name="Ibn Sina Healthcare Group",
            name="Mirpur Branch",
            facility_types=["Diagnostic Center"],
            location="Plot 11, Avenue 1, Block A, Mirpur 10, Dhaka",
            city="Dhaka",
            verified=True,
            rating=4.8,
            reviews_count=180,
            open_timing="08:00 AM - 10:00 PM",
            contact_phone="+880 9610-010616",
            tagline="Top Diagnostic Center in Mirpur",
            badge="Verified Partner",
            image="https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=600&q=80",
            services=["4D USG", "Digital X-Ray", "Blood Collection", "Visiting Specialist OPD"],
            description="Specialized diagnostic testing and visiting doctor OPD sessions."
        )

        b3 = Branch.objects.create(
            id="popular-panthapath",
            hospital=h2,
            hospital_name="Popular Diagnostic & Medical Center",
            name="Panthapath Branch",
            facility_types=["Hospital", "Diagnostic Center"],
            location="House 16, Road 2, Dhanmondi / Panthapath, Dhaka",
            city="Dhaka",
            verified=True,
            rating=4.85,
            reviews_count=410,
            open_timing="07:00 AM - 11:00 PM",
            contact_phone="+880 9613-787801",
            tagline="Nationwide Leading Diagnostic & Hospital Network",
            badge="Verified Partner",
            image="https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80",
            services=["Inpatient Surgery", "Specialist Visiting Doctor OPD", "Advanced MRI", "Full Automated Pathology"],
            description="Popular Medical Center providing state-of-the-art diagnostic imaging, surgery, and doctor chambers."
        )

        b4 = Branch.objects.create(
            id="chevron-chittagong",
            hospital=None,
            hospital_name="Chevron Healthcare",
            name="Panchlaish Branch",
            facility_types=["Diagnostic Center", "Chamber"],
            location="12/12 O.R. Nizam Road, Panchlaish, Chittagong",
            city="Chittagong",
            verified=True,
            rating=4.9,
            reviews_count=260,
            open_timing="24/7 OPD & Diagnostic Service",
            contact_phone="+880 31-652533",
            tagline="Chittagong's Most Trusted Multispecialty Consultation Center",
            badge="Top Rated",
            image="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=600&q=80",
            services=["24/7 Emergency OPD", "Orthopedic Clinic", "Digital X-Ray", "Home Sample Collection"],
            description="Chevron Clinical Laboratory offering round-the-clock OPD specialist doctor visits."
        )

        self.stdout.write("Creating Specialties...")
        s_cardio = DoctorSpecialty.objects.create(id="cardiology", name="Cardiologist", icon="Heart", description="Heart & Vascular Care")
        s_gyn = DoctorSpecialty.objects.create(id="gynecology", name="Gynecologist", icon="User", description="Women's Health & Maternity")
        s_neuro = DoctorSpecialty.objects.create(id="neurology", name="Neurologist", icon="Brain", description="Brain & Nervous System")
        s_ortho = DoctorSpecialty.objects.create(id="orthopedics", name="Orthopedic", icon="Activity", description="Bones, Joints & Spine")
        s_derm = DoctorSpecialty.objects.create(id="dermatology", name="Dermatologist", icon="Sparkles", description="Skin, Hair & Aesthetics")

        self.stdout.write("Creating Pathology Tests...")
        t_cbc = PathologyTest.objects.create(
            id="cbc", name="Blood Test (CBC)", category="Routine Blood Profiles", fasting_required=False, description="Complete Blood Count measuring RBC, WBC, ESR."
        )
        t_ct = PathologyTest.objects.create(
            id="ct-scan", name="CT Scan (Brain / Chest)", category="Advanced Radiology", fasting_required=True, description="High-resolution CT scan."
        )
        t_usg = PathologyTest.objects.create(
            id="usg", name="USG (Ultrasound Abdomen)", category="Sonography", fasting_required=True, description="Full abdominal 4D ultrasonography."
        )
        t_lipid = PathologyTest.objects.create(
            id="lipid", name="Lipid Profile (Cholesterol)", category="Cardiac Risk", fasting_required=True, description="Measures Total Cholesterol, HDL, LDL."
        )

        self.stdout.write("Linking Branch Tests...")
        BranchTest.objects.create(branch=b1, test=t_cbc, price=450, original_price=600, discount="25% OFF", report_time="Same Day (6 Hours)")
        BranchTest.objects.create(branch=b2, test=t_cbc, price=400, original_price=550, discount="27% OFF", report_time="Same Day (4 Hours)")
        BranchTest.objects.create(branch=b3, test=t_cbc, price=500, original_price=650, discount="23% OFF", report_time="8 Hours")

        BranchTest.objects.create(branch=b1, test=t_ct, price=4500, original_price=6000, discount="25% OFF", report_time="24 Hours")
        BranchTest.objects.create(branch=b3, test=t_ct, price=4800, original_price=6200, discount="22% OFF", report_time="12 Hours")

        BranchTest.objects.create(branch=b1, test=t_usg, price=1500, original_price=2000, discount="25% OFF", report_time="Same Day")
        BranchTest.objects.create(branch=b4, test=t_usg, price=1400, original_price=1800, discount="22% OFF", report_time="Same Day")

        BranchTest.objects.create(branch=b1, test=t_lipid, price=950, original_price=1400, discount="32% OFF", report_time="12 Hours")
        BranchTest.objects.create(branch=b2, test=t_lipid, price=900, original_price=1300, discount="30% OFF", report_time="12 Hours")

        self.stdout.write("Creating Doctors...")
        d1 = Doctor.objects.create(
            id="doc-1",
            name="Prof. Dr. A. K. M. Fazlul Haque",
            qualification="MBBS, FCPS (Medicine), MD (Cardiology), FACC (USA)",
            experience="22+ Yrs Exp."
        )
        d1.specialties.set([s_cardio])

        d2 = Doctor.objects.create(
            id="doc-2",
            name="Dr. Sharmin Sultana",
            qualification="MBBS, FCPS (Obstetrics & Gynecology), MS",
            experience="14+ Yrs Exp."
        )
        d2.specialties.set([s_gyn, s_derm])

        d3 = Doctor.objects.create(
            id="doc-3",
            name="Prof. Dr. Syed Atiqul Haq",
            qualification="MBBS, FCPS (Medicine), MD (Neurology), FRCP",
            experience="25+ Yrs Exp."
        )
        d3.specialties.set([s_neuro])

        d4 = Doctor.objects.create(
            id="doc-4",
            name="Dr. Chowdhury Farhan Hossain",
            qualification="MBBS, MS (Orthopedic Surgery), Fellow Spine Surgery",
            experience="18+ Yrs Exp."
        )
        d4.specialties.set([s_ortho])

        self.stdout.write("Creating Doctor Affiliations & Schedules...")
        aff1 = DoctorAffiliation.objects.create(
            doctor=d1, branch=b1, consultation_type="OPD", fee=1200
        )
        AffiliationSchedule.objects.create(affiliation=aff1, day_of_week="Sat", start_time=datetime.time(17, 0), end_time=datetime.time(21, 0))
        AffiliationSchedule.objects.create(affiliation=aff1, day_of_week="Mon", start_time=datetime.time(17, 0), end_time=datetime.time(21, 0))
        AffiliationSchedule.objects.create(affiliation=aff1, day_of_week="Wed", start_time=datetime.time(17, 0), end_time=datetime.time(21, 0))

        aff1_inp = DoctorAffiliation.objects.create(
            doctor=d1, branch=b1, consultation_type="In-patient", fee=2000
        )
        AffiliationSchedule.objects.create(affiliation=aff1_inp, day_of_week="Everyday", start_time=datetime.time(9, 0), end_time=datetime.time(13, 0))

        aff1_m = DoctorAffiliation.objects.create(
            doctor=d1, branch=b2, consultation_type="OPD", fee=1000
        )
        AffiliationSchedule.objects.create(affiliation=aff1_m, day_of_week="Tue", start_time=datetime.time(15, 0), end_time=datetime.time(18, 0))

        aff2 = DoctorAffiliation.objects.create(
            doctor=d2, branch=b1, consultation_type="OPD", fee=1000
        )
        AffiliationSchedule.objects.create(affiliation=aff2, day_of_week="Sun", start_time=datetime.time(16, 0), end_time=datetime.time(20, 0))
        AffiliationSchedule.objects.create(affiliation=aff2, day_of_week="Thu", start_time=datetime.time(16, 0), end_time=datetime.time(20, 0))

        aff2_inp = DoctorAffiliation.objects.create(
            doctor=d2, branch=b3, consultation_type="In-patient", fee=1500
        )
        AffiliationSchedule.objects.create(affiliation=aff2_inp, day_of_week="Everyday", start_time=datetime.time(10, 0), end_time=datetime.time(14, 0))

        aff3 = DoctorAffiliation.objects.create(
            doctor=d3, branch=b3, consultation_type="OPD", fee=1500
        )
        AffiliationSchedule.objects.create(affiliation=aff3, day_of_week="Sat", start_time=datetime.time(18, 0), end_time=datetime.time(21, 30))
        AffiliationSchedule.objects.create(affiliation=aff3, day_of_week="Mon", start_time=datetime.time(18, 0), end_time=datetime.time(21, 30))

        aff4 = DoctorAffiliation.objects.create(
            doctor=d4, branch=b4, consultation_type="OPD", fee=1200
        )
        AffiliationSchedule.objects.create(affiliation=aff4, day_of_week="Sun", start_time=datetime.time(17, 0), end_time=datetime.time(21, 0))
        AffiliationSchedule.objects.create(affiliation=aff4, day_of_week="Tue", start_time=datetime.time(17, 0), end_time=datetime.time(21, 0))

        aff4_inp = DoctorAffiliation.objects.create(
            doctor=d4, branch=b4, consultation_type="In-patient", fee=1800
        )
        AffiliationSchedule.objects.create(affiliation=aff4_inp, day_of_week="Everyday", start_time=datetime.time(8, 0), end_time=datetime.time(12, 0))

        self.stdout.write(self.style.SUCCESS("Successfully populated mock data & default admin user!"))
