import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
from django.db import IntegrityError
from django.utils.text import slugify

from doctors.models import DoctorSpecialty, Doctor
from tests.models import TestCategory, Test, FacilityTest
from facilities.models import (
    Address, PracticeLocation, HospitalCategory, HospitalService, 
    DiagnosticCenterCategory, DiagnosticService, Hospital, DiagnosticCenter
)

import uuid

SEED_NAMESPACE = uuid.UUID("6f6a9b2e-6f2b-4b7a-9b1e-6a1f7c2d9e10")

def seed_uuid(key: str) -> uuid.UUID:
    return uuid.uuid5(SEED_NAMESPACE, key)

def safe_create(Model, **kwargs):
    try:
        name = kwargs.get('name')
        if not name:
            return None
        slug = slugify(name)
        obj_id = seed_uuid(f"{Model.__name__}:{slug}")
        
        defaults = kwargs.pop('defaults', {})
        obj, created = Model.objects.update_or_create(
            id=obj_id,
            defaults={**kwargs, **defaults}
        )
        return obj
    except Exception as e:
        print(f"Error creating {Model.__name__} {kwargs.get('name')}: {e}")
        return None

def seed_db():
    with open('mockData.json', 'r') as f:
        data = json.load(f)

    print("Seeding Specialties...")
    for item in data.get('SPECIALTIES', []):
        safe_create(DoctorSpecialty, name=item['name'], defaults={'icon': item.get('icon', ''), 'description': item.get('description', '')})

    print("Seeding Test Categories...")
    for item in data.get('TEST_CATEGORIES', []):
        if item['id'] == 'all': continue
        safe_create(TestCategory, name=item['name'], defaults={'icon': item.get('icon', ''), 'description': item.get('description', '')})

    print("Seeding Tests...")
    for item in data.get('TESTS', []):
        cat = TestCategory.objects.filter(name=item.get('category')).first()
        if not cat:
            cat = safe_create(TestCategory, name=item.get('category', 'Uncategorized'))
        try:
            slug = slugify(item['name'])
            Test.objects.update_or_create(
                id=seed_uuid(f"Test:{slug}"),
                defaults={
                    'name': item['name'],
                    'category': cat,
                    'sample_type': item.get('sampleType', ''),
                    'fasting_required': item.get('fastingRequired', False),
                    'report_time_hours': item.get('reportTimeHours', None),
                    'description': item.get('description', '')
                }
            )
        except Exception as e:
            pass

    print("Seeding Hospital Categories...")
    for item in data.get('HOSPITAL_CATEGORIES', []):
        safe_create(HospitalCategory, name=item['name'], defaults={'icon': item.get('icon', ''), 'description': item.get('description', '')})
        
    print("Seeding Hospital Services...")
    for item in data.get('HOSPITAL_SERVICES', []):
        safe_create(HospitalService, name=item['name'], defaults={'icon': item.get('icon', ''), 'description': item.get('description', '')})

    print("Seeding Diagnostic Categories...")
    for item in data.get('DIAGNOSTIC_CENTER_CATEGORIES', []):
        if item['id'] == 'all': continue
        safe_create(DiagnosticCenterCategory, name=item['name'], defaults={'icon': item.get('icon', ''), 'description': item.get('description', '')})

    print("Seeding Diagnostic Services...")
    for item in data.get('DIAGNOSTIC_SERVICES', []):
        safe_create(DiagnosticService, name=item['name'], defaults={'icon': item.get('icon', ''), 'description': item.get('description', '')})

    print("Seeding Hospitals...")
    for h in data.get('HOSPITALS', []):
        try:
            # Check if exists
            if PracticeLocation.objects.filter(name=h['name'], branch=h.get('branch', '')).exists():
                continue
            
            slug = slugify(f"{h['name']} {h.get('branch', '')}")
            address, _ = Address.objects.update_or_create(
                id=seed_uuid(f"Address:{slug}"),
                defaults={
                    'address_line': h.get('address', '')[:300],
                    'area': h.get('location', '')[:100],
                    'city': h.get('city', '')[:100],
                    'district': h.get('district', '')[:100],
                    'division': h.get('city', '')[:100]  # Assuming division roughly matches city for mock data
                }
            )
            
            location, _ = PracticeLocation.objects.update_or_create(
                id=seed_uuid(f"PracticeLocation:{slug}"),
                defaults={
                    'location_type': PracticeLocation.LocationType.HOSPITAL,
                    'name': h['name'],
                    'branch': h.get('branch', '')[:200],
                    'address': address,
                    'tagline': h.get('tagline', '')[:255],
                    'badge': h.get('badge', '')[:50],
                    'rating': h.get('rating', 0.0),
                    'reviews_count': h.get('reviewsCount', 0),
                    'open_timing': h.get('openTiming', '')[:100],
                    'is_verified': h.get('is_verified', False)
                }
            )
            
            hospital, _ = Hospital.objects.update_or_create(id=seed_uuid(f"Hospital:{slug}"), defaults={'location': location})
            
            # Categories
            for cat_data in h.get('categories', []):
                cat = HospitalCategory.objects.filter(name=cat_data.get('name')).first()
                if cat:
                    hospital.categories.add(cat)
                    
        except Exception as e:
            print(f"Error seeding hospital {h.get('name')}: {e}")
        
    print("Seeding Diagnostic Centers...")
    for d in data.get('DIAGNOSTIC_CENTERS', []):
        try:
            if PracticeLocation.objects.filter(name=d['name'], branch=d.get('branch', '')).exists():
                continue
            
            slug = slugify(f"{d['name']} {d.get('branch', '')}")
            address, _ = Address.objects.update_or_create(
                id=seed_uuid(f"Address:{slug}"),
                defaults={
                    'address_line': d.get('address', '')[:300],
                    'area': d.get('location', '')[:100],
                    'city': d.get('city', '')[:100],
                    'district': d.get('district', '')[:100],
                    'division': d.get('city', '')[:100]
                }
            )
            
            location, _ = PracticeLocation.objects.update_or_create(
                id=seed_uuid(f"PracticeLocation:{slug}"),
                defaults={
                    'location_type': PracticeLocation.LocationType.DIAGNOSTIC_CENTER,
                    'name': d['name'],
                    'branch': d.get('branch', '')[:200],
                    'address': address,
                    'tagline': d.get('tagline', '')[:255],
                    'badge': d.get('badge', '')[:50],
                    'rating': d.get('rating', 0.0),
                    'reviews_count': d.get('reviewsCount', 0),
                    'open_timing': d.get('openTiming', '')[:100],
                    'is_verified': d.get('is_verified', False)
                }
            )
            
            diag, _ = DiagnosticCenter.objects.update_or_create(id=seed_uuid(f"DiagnosticCenter:{slug}"), defaults={'location': location})
            
            # Categories
            for cat_data in d.get('categories', []):
                cat = DiagnosticCenterCategory.objects.filter(name=cat_data.get('name')).first()
                if cat:
                    diag.categories.add(cat)
                    
        except Exception as e:
            print(f"Error seeding diagnostic center {d.get('name')}: {e}")

    print("Seeded data successfully.")

if __name__ == '__main__':
    seed_db()
