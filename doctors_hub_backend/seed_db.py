import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
from django.db import IntegrityError
from django.utils.text import slugify

from api.models import (
    DoctorSpecialty, TestCategory, HospitalCategory, HospitalService,
    DiagnosticCenterCategory, DiagnosticService, Test, Hospital, DiagnosticCenter
)

def seed_db():
    with open('mockData.json', 'r') as f:
        data = json.load(f)

    def safe_create(Model, **kwargs):
        try:
            name = kwargs.get('name')
            slug = slugify(name)
            if hasattr(Model, 'slug'):
                obj = Model.objects.filter(slug=slug).first()
                if obj: return
            Model.objects.get_or_create(**kwargs)
        except Exception:
            pass

    for item in data.get('SPECIALTIES', []):
        safe_create(DoctorSpecialty, name=item['name'], defaults={'icon': item.get('icon', ''), 'description': item.get('description', '')})

    for item in data.get('TEST_CATEGORIES', []):
        if item['id'] == 'all': continue
        safe_create(TestCategory, name=item['name'], defaults={'icon': item.get('icon', ''), 'description': item.get('description', '')})

    for item in data.get('HOSPITAL_CATEGORIES', []):
        safe_create(HospitalCategory, name=item['name'], defaults={'icon': item.get('icon', ''), 'description': item.get('description', '')})
        
    for item in data.get('HOSPITAL_SERVICES', []):
        try:
            HospitalService.objects.get_or_create(name=item['name'], defaults={'icon': item.get('icon', ''), 'description': item.get('description', '')})
        except Exception:
            pass

    for item in data.get('DIAGNOSTIC_CENTER_CATEGORIES', []):
        if item['id'] == 'all': continue
        safe_create(DiagnosticCenterCategory, name=item['name'], defaults={'icon': item.get('icon', ''), 'description': item.get('description', '')})

    for item in data.get('DIAGNOSTIC_SERVICES', []):
        try:
            DiagnosticService.objects.get_or_create(name=item['name'], defaults={'icon': item.get('icon', ''), 'description': item.get('description', '')})
        except Exception:
            pass

    for item in data.get('TESTS', []):
        try:
            Test.objects.get_or_create(name=item['name'])
        except Exception:
            pass
        
    for h in data.get('HOSPITALS', []):
        try:
            obj = Hospital.objects.filter(name=h['name']).first()
            if not obj:
                Hospital.objects.create(
                    name=h['name'],
                    branch=h.get('branch', ''),
                    tagline=h.get('tagline', ''),
                    type=h.get('type', ''),
                    city=h.get('city', ''),
                    district=h.get('district', ''),
                    address=h.get('address', ''),
                    open_timing=h.get('openTiming', ''),
                    image=h.get('image', ''),
                    is_verified=h.get('is_verified', False)
                )
        except Exception:
            pass
        
    for d in data.get('DIAGNOSTIC_CENTERS', []):
        try:
            obj = DiagnosticCenter.objects.filter(name=d['name']).first()
            if not obj:
                DiagnosticCenter.objects.create(
                    name=d['name'],
                    branch=d.get('branch', ''),
                    tagline=d.get('tagline', ''),
                    type=d.get('type', ''),
                    city=d.get('city', ''),
                    district=d.get('district', ''),
                    address=d.get('address', ''),
                    open_timing=d.get('openTiming', ''),
                    image=d.get('image', ''),
                    is_verified=d.get('is_verified', False)
                )
        except Exception:
            pass

    print("Seeded hospitals and diagnostics successfully.")

if __name__ == '__main__':
    seed_db()
