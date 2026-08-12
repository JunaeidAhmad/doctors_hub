import sys
from django.core.management.base import BaseCommand
from api.models import HospitalCategory, Hospital

class Command(BaseCommand):
    help = 'Populate BD hospitals with realistic dummy data'

    def handle(self, *args, **options):
        self.stdout.write("Populating BD Hospitals...")
        
        new_categories = [
            ("Maternity & Child", "Baby", "Maternity & Pediatrics"),
            ("Cancer & Oncology", "ShieldAlert", "Cancer Care"),
            ("Neurology & Neuroscience", "Brain", "Neurology Care"),
            ("Kidney & Urology", "Droplet", "Kidney Care"),
            ("Burn & Plastic Surgery", "Flame", "Burn Care"),
            ("Infectious Diseases", "Activity", "Infectious Disease Care"),
            ("Gastroenterology & Liver", "Flame", "Digestive Care"),
            ("ENT (Ear, Nose, Throat)", "Ear", "ENT Care")
        ]

        for name, icon, desc in new_categories:
            HospitalCategory.objects.get_or_create(
                name=name,
                defaults={'icon': icon, 'description': desc}
            )
            
        hospitals_data = [
            {
                "category": "Cardiac Hospitals",
                "name": "National Institute of Cardiovascular Diseases",
                "branch": "Sher-e-Bangla Nagar",
                "address": "Sher-e-Bangla Nagar",
                "district": "Dhaka",
                "division": "Dhaka",
                "city": "Dhaka",
                "phone": "+880 2-9122560",
                "rating": 4.8,
                "description": "Govt specialized cardiac hospital.",
                "is_verified": True
            },
            {
                "category": "Cardiac Hospitals",
                "name": "National Heart Foundation Hospital",
                "branch": "Mirpur",
                "address": "Mirpur 2",
                "district": "Dhaka",
                "division": "Dhaka",
                "city": "Dhaka",
                "phone": "+880 2-9006970",
                "rating": 4.9,
                "description": "Pioneer non-gov cardiac hospital.",
                "is_verified": True
            },
            {
                "category": "Eye Hospitals",
                "name": "National Institute of Ophthalmology & Hospital",
                "branch": "Agargaon",
                "address": "Sher-e-Bangla Nagar",
                "district": "Dhaka",
                "division": "Dhaka",
                "city": "Dhaka",
                "phone": "+880 2-9112739",
                "rating": 4.7,
                "description": "Leading govt eye hospital.",
                "is_verified": True
            },
            {
                "category": "Maternity & Child",
                "name": "Dhaka Shishu (Children) Hospital",
                "branch": "Sher-e-Bangla Nagar",
                "address": "Sher-e-Bangla Nagar",
                "district": "Dhaka",
                "division": "Dhaka",
                "city": "Dhaka",
                "phone": "+880 2-8142001",
                "rating": 4.8,
                "description": "Largest children's hospital in Bangladesh.",
                "is_verified": True
            },
            {
                "category": "Cancer & Oncology",
                "name": "National Institute of Cancer Research and Hospital",
                "branch": "Mohakhali",
                "address": "Mohakhali",
                "district": "Dhaka",
                "division": "Dhaka",
                "city": "Dhaka",
                "phone": "+880 2-9880155",
                "rating": 4.6,
                "description": "Govt cancer research institute.",
                "is_verified": True
            },
            {
                "category": "Neurology & Neuroscience",
                "name": "National Institute of Neurosciences & Hospital",
                "branch": "Agargaon",
                "address": "Sher-e-Bangla Nagar",
                "district": "Dhaka",
                "division": "Dhaka",
                "city": "Dhaka",
                "phone": "+880 2-9137300",
                "rating": 4.8,
                "description": "Govt neuro specialized hospital.",
                "is_verified": True
            },
            {
                "category": "Orthopedic Centers",
                "name": "NITOR (Pongu Hospital)",
                "branch": "Sher-e-Bangla Nagar",
                "address": "Sher-e-Bangla Nagar",
                "district": "Dhaka",
                "division": "Dhaka",
                "city": "Dhaka",
                "phone": "+880 2-9118544",
                "rating": 4.5,
                "description": "Govt orthopedic hospital.",
                "is_verified": True
            },
            {
                "category": "Multi-Specialty",
                "name": "Square Hospitals Ltd.",
                "branch": "Panthapath",
                "address": "18/F, Bir Uttam Qazi Nuruzzaman Sarak",
                "district": "Dhaka",
                "division": "Dhaka",
                "city": "Dhaka",
                "phone": "+880 9610-0010616",
                "rating": 4.9,
                "description": "World-class private hospital.",
                "is_verified": True
            },
            {
                "category": "Multi-Specialty",
                "name": "United Hospital Limited",
                "branch": "Gulshan",
                "address": "Plot 15, Road 71, Gulshan",
                "district": "Dhaka",
                "division": "Dhaka",
                "city": "Dhaka",
                "phone": "+880 9666-710666",
                "rating": 4.8,
                "description": "Renowned private hospital.",
                "is_verified": True
            }
        ]

        for h in hospitals_data:
            cat_name = h.pop("category")
            cat, _ = HospitalCategory.objects.get_or_create(
                name=cat_name, 
                defaults={'icon': 'Building2'}
            )
            
            h_name = h["name"]
            hosp, created = Hospital.objects.get_or_create(
                name=h_name,
                defaults=h
            )
            
            hosp.categories.add(cat)
            self.stdout.write(f"{'Created' if created else 'Exists'}: {h_name}")
            
        for cat in HospitalCategory.objects.all():
            cat.count = cat.hospitals.count()
            cat.save()

        self.stdout.write("Done!")
