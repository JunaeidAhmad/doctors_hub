import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

from accounts.models import Role, UserRole
from facilities.models import (
    Location, Division, District, Thana,
    HospitalCategory, HospitalService, Hospital,
    DiagnosticCenterCategory, DiagnosticService, DiagnosticCenter
)
from doctors.models import Doctor, DoctorSpecialty, SpecialtyAlias, DoctorAffiliation, AffiliationSchedule
from tests.models import TestCategory, Test, FacilityTest
from bookings.models import DoctorBooking, LabBooking, Patient

from .factories import (
    UserFactory, LocationFactory,
    DoctorFactory, DoctorAffiliationFactory,
    TestCategoryFactory, TestFactory, FacilityTestFactory
)

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def super_admin():
    user = UserFactory.create_super_admin(phone_number="01700000010")
    user.set_password("AdminPass123!")
    user.save()
    return user


@pytest.fixture
def geo_thana(db):
    div, _ = Division.objects.get_or_create(name="Dhaka Division", defaults={"bn_name": "ঢাকা", "slug": "dhaka-div-admin"})
    dist, _ = District.objects.get_or_create(division=div, name="Dhaka District", defaults={"bn_name": "ঢাকা", "slug": "dhaka-dist-admin"})
    thana, _ = Thana.objects.get_or_create(district=dist, name="Dhanmondi Admin", defaults={"bn_name": "ধানমন্ডি", "slug": "dhanmondi-admin"})
    return thana


@pytest.mark.django_db
class TestAdminPanelAPIs:

    def test_01_admin_auth_and_me(self, api_client, super_admin):
        # 1. Login
        login_res = api_client.post('/api/v1/auth/login/', {
            'phone_number': '01700000010',
            'password': 'AdminPass123!'
        }, format='json')
        assert login_res.status_code == status.HTTP_200_OK
        assert 'user' in login_res.data
        assert login_res.data['user']['phone_number'] == '01700000010'

        # 2. Auth Me
        api_client.force_authenticate(user=super_admin)
        me_res = api_client.get('/api/v1/auth/me/')
        assert me_res.status_code == status.HTTP_200_OK
        assert me_res.data['is_superuser'] is True

        # 3. Auth Me Permissions
        perm_res = api_client.get('/api/v1/auth/me/permissions/')
        assert perm_res.status_code == status.HTTP_200_OK

    def test_02_dashboard_init(self, api_client, super_admin):
        api_client.force_authenticate(user=super_admin)
        res = api_client.get('/api/v1/admin/dashboard-init/')
        assert res.status_code == status.HTTP_200_OK
        data = res.data
        assert 'counts' in data
        assert 'hospitals' in data
        assert 'diagnostic_centers' in data
        assert 'doctors' in data
        assert 'tests' in data
        assert 'branch_tests' in data
        assert 'doctor_specialties' in data
        assert 'hospital_categories' in data
        assert 'diagnostic_categories' in data
        assert 'test_categories' in data
        assert 'doctor_bookings' in data
        assert 'lab_bookings' in data

    def test_03_search_metadata_and_facets(self, api_client, super_admin):
        api_client.force_authenticate(user=super_admin)
        meta_res = api_client.get('/api/v1/search-metadata/')
        assert meta_res.status_code == status.HTTP_200_OK

        facets_res = api_client.get('/api/v1/search-facets/')
        assert facets_res.status_code == status.HTTP_200_OK

    def test_04_hospitals_crud(self, api_client, super_admin, geo_thana):
        api_client.force_authenticate(user=super_admin)

        # 1. Create Hospital Location
        create_res = api_client.post('/api/v1/locations/', {
            'name': 'Audit Test Hospital',
            'location_type': 'hospital',
            'branch': 'Dhanmondi',
            'thana': geo_thana.id,
            'address_line': 'Road 27, Dhanmondi',
            'phone': '01711111111',
            'is_verified': True
        }, format='json')
        assert create_res.status_code in (status.HTTP_201_CREATED, status.HTTP_200_OK)
        hosp_id = create_res.data['id']

        # 2. List Locations / Hospitals
        list_res = api_client.get('/api/v1/locations/?location_type=hospital')
        assert list_res.status_code == status.HTTP_200_OK
        results = list_res.data.get('results', list_res.data)
        assert any(h['id'] == hosp_id for h in results)

        # 3. Patch Hospital Location
        patch_res = api_client.patch(f'/api/v1/locations/{hosp_id}/', {
            'tagline': 'Updated Premium Healthcare'
        }, format='json')
        assert patch_res.status_code == status.HTTP_200_OK
        assert patch_res.data['tagline'] == 'Updated Premium Healthcare'

        # 4. Delete Hospital Location
        del_res = api_client.delete(f'/api/v1/locations/{hosp_id}/')
        assert del_res.status_code in (status.HTTP_204_NO_CONTENT, status.HTTP_200_OK)

    def test_05_diagnostic_centers_crud(self, api_client, super_admin, geo_thana):
        api_client.force_authenticate(user=super_admin)

        # 1. Create Diagnostic Center Location
        create_res = api_client.post('/api/v1/locations/', {
            'name': 'Audit Diagnostic Lab',
            'location_type': 'diagnostic_center',
            'branch': 'Gulshan',
            'thana': geo_thana.id,
            'address_line': 'Gulshan-1',
            'phone': '01722222222',
            'is_verified': True
        }, format='json')
        assert create_res.status_code in (status.HTTP_201_CREATED, status.HTTP_200_OK)
        diag_id = create_res.data['id']

        # 2. List Locations / Diagnostic Centers
        list_res = api_client.get('/api/v1/locations/?location_type=diagnostic_center')
        assert list_res.status_code == status.HTTP_200_OK

        # 3. Patch Diagnostic Center Location
        patch_res = api_client.patch(f'/api/v1/locations/{diag_id}/', {
            'open_timing': '08:00 AM - 10:00 PM'
        }, format='json')
        assert patch_res.status_code == status.HTTP_200_OK

        # 4. Delete
        del_res = api_client.delete(f'/api/v1/locations/{diag_id}/')
        assert del_res.status_code in (status.HTTP_204_NO_CONTENT, status.HTTP_200_OK)

    def test_06_doctors_crud_and_chamber_sync(self, api_client, super_admin):
        api_client.force_authenticate(user=super_admin)
        loc = LocationFactory(name="Audit Chamber Location")
        spec = DoctorSpecialty.objects.create(name="Cardiology", canonical_name="Cardiology")

        # 1. Create Doctor
        create_res = api_client.post('/api/v1/doctors/', {
            'name': 'Dr. Audit Specialist',
            'bmdc_number': 'A-99999',
            'qualification': 'MBBS, FCPS',
            'experience': '10+ years',
            'specialty_ids': [spec.id],
            'primary_specialty_id': spec.id,
            'is_verified': True
        }, format='json')
        assert create_res.status_code in (status.HTTP_201_CREATED, status.HTTP_200_OK)
        doc_id = create_res.data['id']

        # 2. List Doctors
        list_res = api_client.get('/api/v1/doctors/')
        assert list_res.status_code == status.HTTP_200_OK

        # 3. Chamber Synchronization via PUT /api/doctors/<id>/chambers/
        chamber_payload = {
            'chambers': [
                {
                    'location_id': str(loc.id),
                    'fee': 1200,
                    'chamber_type': 'Consultation Chamber',
                    'advance_booking_days': 7,
                    'schedules': [
                        {
                            'day_of_week': 'Monday',
                            'start_time': '18:00:00',
                            'end_time': '21:00:00',
                            'max_patients': 25,
                            'avg_consult_minutes': 10
                        }
                    ]
                }
            ]
        }
        sync_res = api_client.put(f'/api/v1/doctors/{doc_id}/chambers/', chamber_payload, format='json')
        assert sync_res.status_code == status.HTTP_200_OK

        # 4. Update Doctor
        patch_res = api_client.patch(f'/api/v1/doctors/{doc_id}/', {
            'academic_title': 'Associate Professor'
        }, format='json')
        assert patch_res.status_code == status.HTTP_200_OK

        # 5. Delete Doctor
        del_res = api_client.delete(f'/api/v1/doctors/{doc_id}/')
        assert del_res.status_code in (status.HTTP_204_NO_CONTENT, status.HTTP_200_OK)

    def test_07_master_tests_crud(self, api_client, super_admin):
        api_client.force_authenticate(user=super_admin)
        cat = TestCategory.objects.create(name="Blood Pathology")

        # 1. Create
        create_res = api_client.post('/api/v1/tests/', {
            'name': 'Audit Complete Blood Count',
            'category_id': cat.id,
            'fasting_required': False,
            'description': 'CBC test'
        }, format='json')
        assert create_res.status_code in (status.HTTP_201_CREATED, status.HTTP_200_OK)
        t_id = create_res.data['id']

        # 2. List
        list_res = api_client.get('/api/v1/tests/')
        assert list_res.status_code == status.HTTP_200_OK

        # 3. Delete
        del_res = api_client.delete(f'/api/v1/tests/{t_id}/')
        assert del_res.status_code in (status.HTTP_204_NO_CONTENT, status.HTTP_200_OK)

    def test_08_branch_tests_crud(self, api_client, super_admin):
        api_client.force_authenticate(user=super_admin)
        loc = LocationFactory(name="Audit Center for Tests")
        cat = TestCategory.objects.create(name="Radiology")
        t = Test.objects.create(name="Chest X-Ray", category=cat)

        # 1. Create Facility Test Offering via /api/facility-tests/
        create_res = api_client.post('/api/v1/facility-tests/', {
            'location_id': str(loc.id),
            'test_id': t.id,
            'price': 1500,
            'discount_percent': 10,
            'report_time': '24 hours',
            'is_available': True,
            'home_sample_collection': True
        }, format='json')
        assert create_res.status_code in (status.HTTP_201_CREATED, status.HTTP_200_OK)
        bt_id = create_res.data['id']

        # 2. List
        list_res = api_client.get('/api/v1/facility-tests/')
        assert list_res.status_code == status.HTTP_200_OK

        # 3. Patch
        patch_res = api_client.patch(f'/api/v1/facility-tests/{bt_id}/', {
            'price': 1400
        }, format='json')
        assert patch_res.status_code == status.HTTP_200_OK

        # 4. Delete
        del_res = api_client.delete(f'/api/v1/facility-tests/{bt_id}/')
        assert del_res.status_code in (status.HTTP_204_NO_CONTENT, status.HTTP_200_OK)

    def test_09_specialties_and_aliases_taxonomy(self, api_client, super_admin):
        api_client.force_authenticate(user=super_admin)

        # 1. Canonical Specialty
        create_spec = api_client.post('/api/v1/specialties/', {
            'name': 'Neurology Audit',
            'canonical_name': 'Neurology Audit',
            'bn_name': 'নিউরো',
            'description': 'Brain and nerve disorders'
        }, format='json')
        assert create_spec.status_code in (status.HTTP_201_CREATED, status.HTTP_200_OK)
        spec_id = create_spec.data['id']

        # List specialties
        spec_list = api_client.get('/api/v1/specialties/')
        assert spec_list.status_code == status.HTTP_200_OK

        # 2. Specialty Alias via /api/specialty-aliases/
        alias_res = api_client.post('/api/v1/specialty-aliases/', {
            'name': 'Brain Specialist',
            'specialty': spec_id,
            'language': 'en',
            'is_verified': False
        }, format='json')
        assert alias_res.status_code in (status.HTTP_201_CREATED, status.HTTP_200_OK)
        alias_id = alias_res.data['id']

        # 3. Batch verify via /api/specialty-aliases/batch-verify/
        batch_res = api_client.post('/api/v1/specialty-aliases/batch-verify/', {
            'alias_ids': [alias_id]
        }, format='json')
        assert batch_res.status_code == status.HTTP_200_OK

        # Clean up
        api_client.delete(f'/api/v1/specialty-aliases/{alias_id}/')
        api_client.delete(f'/api/v1/specialties/{spec_id}/')

    def test_10_categories_and_services(self, api_client, super_admin):
        api_client.force_authenticate(user=super_admin)

        # Hospital Categories
        hosp_cats = api_client.get('/api/v1/hospital-categories/')
        assert hosp_cats.status_code == status.HTTP_200_OK

        # Diagnostic Categories
        diag_cats = api_client.get('/api/v1/diagnostic-center-categories/')
        assert diag_cats.status_code == status.HTTP_200_OK

        # Hospital Services
        hosp_serv = api_client.get('/api/v1/hospital-services/')
        assert hosp_serv.status_code == status.HTTP_200_OK

        # Diagnostic Services
        diag_serv = api_client.get('/api/v1/diagnostic-services/')
        assert diag_serv.status_code == status.HTTP_200_OK

        # Test Categories
        test_cats = api_client.get('/api/v1/test-categories/')
        assert test_cats.status_code == status.HTTP_200_OK

        # Create & Delete Test Category
        cat_create = api_client.post('/api/v1/test-categories/', {
            'name': 'Microbiology Test Cat'
        }, format='json')
        assert cat_create.status_code in (status.HTTP_201_CREATED, status.HTTP_200_OK)
        tc_id = cat_create.data['id']
        del_tc = api_client.delete(f'/api/v1/test-categories/{tc_id}/')
        assert del_tc.status_code in (status.HTTP_204_NO_CONTENT, status.HTTP_200_OK)

    def test_11_bookings_and_transitions(self, api_client, super_admin):
        api_client.force_authenticate(user=super_admin)
        loc = LocationFactory(name="Booking Test Hospital")
        doc = DoctorFactory(name="Dr. Booking Test")
        aff = DoctorAffiliationFactory(doctor=doc, location=loc, fee=1000)

        patient = Patient.objects.create(name="Audit Patient", phone="01799999999")
        booking = DoctorBooking.objects.create(
            affiliation=aff,
            patient=patient,
            date="2026-10-10",
            status="pending",
            fee_at_booking=1000
        )

        # List Doctor Bookings
        list_res = api_client.get('/api/v1/bookings/doctor/')
        assert list_res.status_code == status.HTTP_200_OK

        # Transition Doctor Booking: pending -> confirmed
        trans_res = api_client.post(f'/api/v1/bookings/doctor/{booking.id}/transition/', {
            'to': 'confirmed'
        }, format='json')
        assert trans_res.status_code == status.HTTP_200_OK
        booking.refresh_from_db()
        assert booking.status == 'confirmed'

    def test_12_rbac_roles_and_permissions(self, api_client, super_admin):
        api_client.force_authenticate(user=super_admin)

        # Catalog
        cat_res = api_client.get('/api/v1/permissions-catalog/')
        assert cat_res.status_code == status.HTTP_200_OK

        # Roles List
        roles_res = api_client.get('/api/v1/roles/')
        assert roles_res.status_code == status.HTTP_200_OK

        # Create Role
        new_role = api_client.post('/api/v1/roles/', {
            'name': 'Audit Manager Role',
            'description': 'Role for testing',
            'scope_type': 'facility',
            'permissions': []
        }, format='json')
        assert new_role.status_code in (status.HTTP_201_CREATED, status.HTTP_200_OK)
        role_id = new_role.data['id']

        # Delete Role
        del_role = api_client.delete(f'/api/v1/roles/{role_id}/')
        assert del_role.status_code in (status.HTTP_204_NO_CONTENT, status.HTTP_200_OK)

    def test_13_user_roles_management(self, api_client, super_admin):
        api_client.force_authenticate(user=super_admin)
        target_user = UserFactory(phone_number="01755555555")
        role, _ = Role.objects.get_or_create(
            name="Platform Auditor",
            defaults={"scope_type": Role.ScopeType.GLOBAL, "is_system": False}
        )

        # Assign Role
        assign_res = api_client.post('/api/v1/user-roles/', {
            'user': target_user.id,
            'role': role.id
        }, format='json')
        assert assign_res.status_code in (status.HTTP_201_CREATED, status.HTTP_200_OK)
        user_role_id = assign_res.data['id']

        # List User Roles
        list_res = api_client.get('/api/v1/user-roles/')
        assert list_res.status_code == status.HTTP_200_OK

        # Search users
        search_res = api_client.get('/api/v1/user-roles/search-users/?q=017555')
        assert search_res.status_code == status.HTTP_200_OK

        # Inspect permissions
        perms_res = api_client.get(f'/api/v1/user-roles/user-permissions/{target_user.id}/')
        assert perms_res.status_code == status.HTTP_200_OK

        # Revoke Role
        revoke_res = api_client.delete(f'/api/v1/user-roles/{user_role_id}/')
        assert revoke_res.status_code in (status.HTTP_204_NO_CONTENT, status.HTTP_200_OK)

    def test_14_staff_delegation(self, api_client, super_admin):
        api_client.force_authenticate(user=super_admin)
        loc = LocationFactory(name="Audit Staff Hospital")

        # List staff
        list_res = api_client.get(f'/api/v1/facilities/{loc.id}/staff/')
        assert list_res.status_code == status.HTTP_200_OK

        # Add staff
        add_res = api_client.post(f'/api/v1/facilities/{loc.id}/staff/', {
            'first_name': 'Audit',
            'last_name': 'Staffer',
            'phone_number': '01766666666',
            'password': 'StaffPass123!'
        }, format='json')
        assert add_res.status_code in (status.HTTP_201_CREATED, status.HTTP_200_OK)
        staff_user_id = add_res.data.get('user', {}).get('id') or add_res.data.get('id')

        # Delete staff
        if staff_user_id:
            del_res = api_client.delete(f'/api/v1/facilities/{loc.id}/staff/{staff_user_id}/')
            assert del_res.status_code in (status.HTTP_204_NO_CONTENT, status.HTTP_200_OK)

    def test_15_verification_queue_and_actions(self, api_client, super_admin):
        api_client.force_authenticate(user=super_admin)
        unverified_loc = LocationFactory(name="Unverified Diagnostic Lab", is_verified=False)
        unverified_doc = DoctorFactory(name="Dr. Unverified", is_verified=False)

        # List queue
        queue_res = api_client.get('/api/v1/admin/verifications/')
        assert queue_res.status_code == status.HTTP_200_OK
        data = queue_res.data
        assert 'pending_facilities' in data
        assert 'pending_doctors' in data

        # Action: Approve facility
        app_fac = api_client.post(f'/api/v1/admin/verifications/facility/{unverified_loc.id}/', {
            'action': 'approve'
        }, format='json')
        assert app_fac.status_code == status.HTTP_200_OK
        unverified_loc.refresh_from_db()
        assert unverified_loc.is_verified is True

        # Action: Approve doctor
        app_doc = api_client.post(f'/api/v1/admin/verifications/doctor/{unverified_doc.id}/', {
            'action': 'approve'
        }, format='json')
        assert app_doc.status_code == status.HTTP_200_OK
        unverified_doc.refresh_from_db()
        assert unverified_doc.is_verified is True

    def test_16_platform_admins(self, api_client, super_admin):
        api_client.force_authenticate(user=super_admin)

        # List platform admins
        list_res = api_client.get('/api/v1/admin/platform-admins/')
        assert list_res.status_code == status.HTTP_200_OK

        # Create new platform admin
        create_res = api_client.post('/api/v1/admin/platform-admins/', {
            'phone_number': '01777777777',
            'password': 'SuperAdminPass123!',
            'first_name': 'Chief',
            'last_name': 'Admin'
        }, format='json')
        assert create_res.status_code in (status.HTTP_201_CREATED, status.HTTP_200_OK)
