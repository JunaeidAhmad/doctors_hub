import os
import django
import random
from datetime import time
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from doctors.models import Doctor, DoctorSpecialty, DoctorAffiliation, AffiliationSchedule
from facilities.models import PracticeLocation
from tests.models import Test, FacilityTest

def seed_custom():
    print("Seeding Doctors...")
    specialties = list(DoctorSpecialty.objects.all())
    locations = list(PracticeLocation.objects.all())
    tests = list(Test.objects.all())

    bd_doctors = [
        {"name": "Prof. Dr. A. B. M. Abdullah", "qualification": "MBBS, MRCP (UK), FRCP (Edin)", "experience": "35 Years"},
        {"name": "Dr. Laila Arjumand Banu", "qualification": "MBBS, FCPS (Obs & Gynae)", "experience": "20 Years"},
        {"name": "Dr. Tariqul Islam", "qualification": "MBBS, MD (Cardiology)", "experience": "15 Years"},
        {"name": "Prof. Dr. Pranab Kumar Karmaker", "qualification": "MBBS, MS (Orthopedics)", "experience": "28 Years"},
        {"name": "Dr. Farhana Akter", "qualification": "MBBS, DDV (Dermatology)", "experience": "12 Years"},
        {"name": "Dr. Kazi Naushad-Un-Nabi", "qualification": "MBBS, FCPS (Pediatrics)", "experience": "18 Years"},
        {"name": "Dr. Md. Nazrul Islam", "qualification": "MBBS, DO, FCPS (Ophthalmology)", "experience": "22 Years"},
        {"name": "Dr. Shahnaz Pervin", "qualification": "MBBS, FCPS (Medicine)", "experience": "14 Years"},
        {"name": "Dr. Syed Atiqul Haq", "qualification": "MBBS, MD (Rheumatology)", "experience": "30 Years"},
        {"name": "Prof. Dr. A.K.M. Fazlul Haque", "qualification": "MBBS, FCPS (Surgery)", "experience": "32 Years"},
        {"name": "Dr. M. A. Hasanat", "qualification": "MBBS, M.Phil, MD (Endocrinology)", "experience": "25 Years"},
        {"name": "Dr. Sabrina Rahman", "qualification": "MBBS, FCPS (Psychiatry)", "experience": "10 Years"},
        {"name": "Dr. Anisur Rahman", "qualification": "MBBS, DLO, MCPS (ENT)", "experience": "16 Years"},
        {"name": "Dr. Salma Begum", "qualification": "MBBS, FCPS (Gastroenterology)", "experience": "19 Years"},
        {"name": "Prof. Dr. Quazi Tarikul Islam", "qualification": "MBBS, FCPS, MD (Internal Medicine)", "experience": "33 Years"},
    ]

    for d_data in bd_doctors:
        doc, created = Doctor.objects.get_or_create(
            name=d_data["name"],
            defaults={
                "qualification": d_data["qualification"],
                "experience": d_data["experience"]
            }
        )
        
        if created and specialties:
            doc.specialties.set(random.sample(specialties, k=random.randint(1, 2)))
            
            if locations:
                aff_locations = random.sample(locations, k=random.randint(1, 3))
                for loc in aff_locations:
                    aff = DoctorAffiliation.objects.create(
                        doctor=doc,
                        location=loc,
                        consultation_type=random.choice(["Chamber", "In-patient", "Doctor"]),
                        fee=random.choice([800, 1000, 1200, 1500, 2000])
                    )
                    
                    AffiliationSchedule.objects.create(
                        affiliation=aff,
                        day_of_week=random.choice(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
                        start_time=time(17, 0),
                        end_time=time(20, 0)
                    )

    print(f"Seeded {len(bd_doctors)} Doctors.")

    print("Seeding Facility Tests...")
    # Add tests to Diagnostic Centers and Hospitals
    # PracticeLocation.LocationType.CHAMBER cannot have lab tests (based on model clean method)
    eligible_locations = [loc for loc in locations if loc.location_type != 'Chamber']
    
    for loc in eligible_locations:
        # Give each facility between 30 and 100 random tests
        num_tests = min(random.randint(30, 100), len(tests))
        loc_tests = random.sample(tests, k=num_tests)
        
        created_count = 0
        for test in loc_tests:
            # Generate a reasonable price
            base_price = random.randint(2, 50) * 100  # 200 to 5000
            discounted = base_price * (random.randint(70, 95) / 100.0) if random.random() < 0.3 else None
            
            try:
                FacilityTest.objects.get_or_create(
                    location=loc,
                    test=test,
                    defaults={
                        'price': Decimal(str(base_price)),
                        'discounted_price': Decimal(str(round(discounted, 2))) if discounted else None,
                        'original_price': Decimal(str(base_price)) if discounted else None,
                        'discount': f"{int(100 - (discounted/base_price)*100)}% OFF" if discounted else "",
                        'report_time': random.choice(['Next Day', 'Within 24 Hours', 'Within 48 Hours', 'Same Day']),
                        'is_available': True,
                        'home_sample_collection': random.choice([True, False])
                    }
                )
                created_count += 1
            except Exception as e:
                # ignore unique constraint violations or other errors
                pass
        
        print(f"Added {created_count} tests to {loc.name}")

if __name__ == '__main__':
    seed_custom()
