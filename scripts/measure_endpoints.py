#!/usr/bin/env python3
"""
Measure endpoint status, JSON byte size and SQL query count.
Usage: python scripts/measure_endpoints.py
"""
import os
import sys
import json

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'doctors_hub_backend'))
os.chdir(os.path.join(os.path.dirname(__file__), '..', 'doctors_hub_backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

import django
django.setup()

from django.test import Client
from django.test.utils import CaptureQueriesContext
from django.db import connection
from rest_framework.test import APIClient


def measure(client, url, label):
    with CaptureQueriesContext(connection) as ctx:
        try:
            resp = client.get(url)
            status_code = resp.status_code
            body = resp.content
        except Exception as e:
            return {'label': label, 'url': url, 'status': 'ERROR', 'size': 0, 'queries': 0, 'error': str(e)}
    return {
        'label': label,
        'url': url,
        'status': status_code,
        'size': len(body),
        'queries': len(ctx.captured_queries),
    }


def main():
    from django.conf import settings
    settings.ALLOWED_HOSTS = ['*']
    client = Client()
    # Create a super admin for /api/admin/init/
    from accounts.models import User
    try:
        admin_user = User.objects.filter(is_superuser=True).first()
        if not admin_user:
            admin_user = User.objects.create_superuser(phone_number='01799990000', password='test123')
    except Exception:
        admin_user = None

    results = []

    results.append(measure(client, '/api/doctors/?page_size=20', 'Doctor list'))
    results.append(measure(client, '/api/doctors/?specialty=cardiology&page_size=20', 'Doctor list (specialty)'))

    # Get a doctor slug
    from doctors.models import Doctor
    doc = Doctor.objects.first()
    if doc:
        results.append(measure(client, f'/api/doctors/{doc.slug}/', 'Doctor detail'))

    results.append(measure(client, '/api/search-metadata/', 'Search metadata'))
    results.append(measure(client, '/api/locations/', 'Locations'))
    results.append(measure(client, '/api/specialties/', 'Specialties'))

    # Admin init as super admin (needs JWT auth)
    if admin_user:
        api_client = APIClient()
        api_client.force_authenticate(user=admin_user)
        results.append(measure(api_client, '/api/admin/dashboard-init/', 'Admin init'))

    # Print results
    print(f"{'Label':<35} {'Status':<8} {'Size (bytes)':<14} {'Queries':<8}")
    print('-' * 70)
    for r in results:
        status_str = str(r['status'])
        size_str = str(r['size']) if r['status'] != 'ERROR' else r.get('error', '')[:20]
        print(f"{r['label']:<35} {status_str:<8} {size_str:<14} {r['queries']:<8}")

    # Also output as JSON for easy copying
    print('\n--- JSON ---')
    print(json.dumps(results, indent=2))


if __name__ == '__main__':
    main()
