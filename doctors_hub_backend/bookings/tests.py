from datetime import date, time
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import User
from facilities.models import (
    Location, Hospital, HospitalCategory, HospitalService,
    DiagnosticCenterCategory, DiagnosticService, Chamber
)
from doctors.models import Doctor, DoctorSpecialty, DoctorAffiliation, AffiliationSchedule
from tests.models import TestCategory, Test, FacilityTest
from bookings.models import Patient, OTPVerification, DoctorBooking, TestBooking, HospitalServiceBooking


class EnhancedFeaturesTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # 1. Facilities setup
        self.chamber_loc = Location.objects.create(
            name="Popular Diagnostic Chamber",
            location_type=Location.LocationType.CHAMBER,
            address_line="Dhanmondi 27",
            district="Dhaka",
            division="Dhaka"
        )
        self.hosp_loc = Location.objects.create(
            name="Square Hospital",
            location_type=Location.LocationType.HOSPITAL,
            address_line="Panthapath",
            district="Dhaka",
            division="Dhaka"
        )
        self.hosp_cat = HospitalCategory.objects.create(name="General")
        self.hospital = Hospital.objects.create(
            location=self.hosp_loc,
            category=self.hosp_cat
        )

        # 2. Services setup
        self.diag_service = DiagnosticService.objects.create(name="Radiology & Imaging")
        self.hosp_service = HospitalService.objects.create(name="Emergency & Trauma")
        self.hosp_service.diagnostic_services.add(self.diag_service)
        self.hospital.services.add(self.hosp_service)

        # 3. Doctor & Schedule setup
        self.specialty = DoctorSpecialty.objects.create(name="Cardiology")
        self.doctor = Doctor.objects.create(
            name="Rahim Khan",
            qualification="MBBS, FCPS",
            experience="10 years"
        )
        self.doctor.specialties.add(self.specialty)
        self.chamber = Chamber.objects.create(
            location=self.chamber_loc,
            doctor=self.doctor,
            assistant_phone="01711111111"
        )
        self.affiliation = DoctorAffiliation.objects.create(
            doctor=self.doctor,
            location=self.chamber_loc,
            fee=1000.00
        )
        # Schedule on all days for test ease
        for day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']:
            AffiliationSchedule.objects.create(
                affiliation=self.affiliation,
                day_of_week=day,
                start_time=time(16, 0),
                end_time=time(21, 0)
            )

        # 4. Lab / Test setup
        self.test_cat = TestCategory.objects.create(name="Blood Tests")
        self.master_test = Test.objects.create(
            category=self.test_cat,
            name="Complete Blood Count (CBC)"
        )
        self.facility_test = FacilityTest.objects.create(
            location=self.hosp_loc,
            test=self.master_test,
            price=500.00
        )

    def test_chamber_ownership_default_private(self):
        """1. Verify Chamber location ownership_type defaults to private."""
        self.assertEqual(self.chamber_loc.ownership_type, Location.OwnershipType.PRIVATE)
        loc2 = Location.objects.create(
            name="Another Chamber",
            location_type=Location.LocationType.CHAMBER,
            address_line="Road 1",
            district="Dhaka",
            division="Dhaka"
        )
        self.assertEqual(loc2.ownership_type, Location.OwnershipType.PRIVATE)

    def test_m2m_hospitalservice_diagnosticservice(self):
        """2. Verify M2M relation between HospitalService and DiagnosticService."""
        self.assertIn(self.diag_service, self.hosp_service.diagnostic_services.all())
        self.assertIn(self.hosp_service, self.diag_service.hospital_services.all())

    def test_diagnostic_category_no_parent(self):
        """4. Verify DiagnosticCenterCategory has no parent_id."""
        cat = DiagnosticCenterCategory.objects.create(name="Pathology Center")
        self.assertFalse(hasattr(cat, 'parent_id'))

    def test_otp_send_and_verify_endpoints(self):
        """8. Test OTP send and verify flow."""
        phone = "01712345678"
        # Send OTP
        resp = self.client.post('/api/bookings/otp/send/', {'phone': phone, 'purpose': 'doctor_booking'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.data['success'])

        otp_record = OTPVerification.objects.filter(phone=phone, is_verified=False).first()
        self.assertIsNotNone(otp_record)
        otp_code = otp_record.otp_code

        # Verify OTP
        verify_resp = self.client.post('/api/bookings/otp/verify/', {'phone': phone, 'otp_code': otp_code}, format='json')
        self.assertEqual(verify_resp.status_code, status.HTTP_200_OK)
        self.assertTrue(verify_resp.data['success'])
        otp_record.refresh_from_db()
        self.assertTrue(otp_record.is_verified)

    def test_patient_lookup_and_auto_fetch(self):
        """7. Test Patient creation and lookup API."""
        phone = "01798765432"
        # Lookup non-existing
        lookup_resp = self.client.get(f'/api/bookings/patients/lookup/?phone={phone}')
        self.assertEqual(lookup_resp.status_code, status.HTTP_200_OK)
        self.assertFalse(lookup_resp.data['found'])

        # Create patient
        patient = Patient.objects.create(
            name="John Doe",
            phone=phone,
            age=32,
            gender=Patient.Gender.MALE,
            address="Gulshan, Dhaka"
        )
        # Lookup existing
        lookup_resp2 = self.client.get(f'/api/bookings/patients/lookup/?phone={phone}')
        self.assertEqual(lookup_resp2.status_code, status.HTTP_200_OK)
        self.assertTrue(lookup_resp2.data['found'])
        self.assertEqual(lookup_resp2.data['patient']['name'], "John Doe")
        self.assertEqual(lookup_resp2.data['patient']['age'], 32)

    def test_doctor_booking_with_serial_generation_and_otp(self):
        """6, 7, 8. Test Doctor Booking generates sequential serial numbers, links patient, and validates OTP."""
        phone = "01755555555"
        # Send OTP
        self.client.post('/api/bookings/otp/send/', {'phone': phone, 'purpose': 'doctor_booking'}, format='json')
        otp = OTPVerification.objects.filter(phone=phone).first().otp_code

        # First booking
        b1_data = {
            "affiliation_id": str(self.affiliation.id),
            "date": "2026-09-10",
            "slot": "17:00",
            "patient_name": "Alice Smith",
            "patient_phone": phone,
            "patient_age": 28,
            "gender": "female",
            "otp_code": otp
        }
        res1 = self.client.post('/api/bookings/doctor-bookings/', b1_data, format='json')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res1.data['serial_number'], 1)
        self.assertEqual(res1.data['serial_display'], "SL-001")
        self.assertEqual(res1.data['patient']['name'], "Alice Smith")

        # Second booking on same date/affiliation
        b2_data = {
            "affiliation_id": str(self.affiliation.id),
            "date": "2026-09-10",
            "slot": "18:00",
            "patient_name": "Bob Johnson",
            "patient_phone": "01766666666",
            "otp_code": "123" # Mock OTP bypass
        }
        res2 = self.client.post('/api/bookings/doctor-bookings/', b2_data, format='json')
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res2.data['serial_number'], 2)
        self.assertEqual(res2.data['serial_display'], "SL-002")

    def test_test_booking_creation(self):
        """5. Test TestBooking (formerly LabBooking)."""
        phone = "01777777777"
        data = {
            "facility_test_id": str(self.facility_test.id),
            "pickup_date": "2026-09-15",
            "patient_name": "Charlie Brown",
            "patient_phone": phone,
            "pickup_address_line": "House 10, Road 4",
            "pickup_district": "Dhaka",
            "otp_code": "123"
        }
        # Test endpoint
        res = self.client.post('/api/bookings/test-bookings/', data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['patient_name'], "Charlie Brown")
        self.assertEqual(res.data['test_name'], "Complete Blood Count (CBC)")

        # Lab alias endpoint
        res_lab = self.client.post('/api/bookings/lab/', data, format='json')
        self.assertEqual(res_lab.status_code, status.HTTP_201_CREATED)

    def test_hospital_service_booking(self):
        """3. Test HospitalServiceBooking creation."""
        phone = "01788888888"
        data = {
            "hospital_id": str(self.hospital.location_id),
            "service_id": str(self.hosp_service.id),
            "booking_date": "2026-09-20",
            "preferred_time": "10:00 AM",
            "patient_name": "David Miller",
            "patient_phone": phone,
            "notes": "Need urgent ICU bed booking",
            "otp_code": "123"
        }
        res = self.client.post('/api/bookings/hospital-services/', data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['hospital_name'], "Square Hospital")
        self.assertEqual(res.data['service_name'], "Emergency & Trauma")
        self.assertEqual(res.data['patient_name'], "David Miller")

    def test_confirmation_sms_dispatch_helper(self):
        """Verify confirmation SMS helper generates valid message format."""
        from services.sms import (
            send_doctor_booking_confirmation_sms,
            send_test_booking_confirmation_sms,
            send_hospital_service_booking_confirmation_sms
        )
        from unittest.mock import patch

        # 1. Doctor booking confirmation SMS
        patient = Patient.objects.create(name="Zara Ali", phone="01799999999")
        doc_booking = DoctorBooking.objects.create(
            affiliation=self.affiliation,
            patient=patient,
            date=date(2026, 9, 25),
            slot="18:00"
        )
        with patch('services.sms.send_sms_via_sms_bd') as mock_sms:
            mock_sms.return_value = {"success": True}
            res = send_doctor_booking_confirmation_sms(doc_booking)
            self.assertTrue(res['success'])
            mock_sms.assert_called_once()
            args = mock_sms.call_args[0]
            self.assertEqual(args[0], "01799999999")
            self.assertIn("Zara Ali", args[1])
            self.assertIn("SL-001", args[1])
            self.assertIn("Rahim Khan", args[1])

        # 2. Test booking confirmation SMS
        test_booking = TestBooking.objects.create(
            facility_test=self.facility_test,
            patient=patient,
            pickup_date=date(2026, 9, 26)
        )
        with patch('services.sms.send_sms_via_sms_bd') as mock_sms:
            mock_sms.return_value = {"success": True}
            res = send_test_booking_confirmation_sms(test_booking)
            self.assertTrue(res['success'])
            mock_sms.assert_called_once()
            args = mock_sms.call_args[0]
            self.assertEqual(args[0], "01799999999")
            self.assertIn("Complete Blood Count", args[1])
            self.assertIn(f"TESTBD-{test_booking.id}", args[1])

        # 3. Hospital service booking confirmation SMS
        hosp_booking = HospitalServiceBooking.objects.create(
            hospital=self.hospital,
            service=self.hosp_service,
            patient=patient,
            booking_date=date(2026, 9, 27),
            preferred_time="11:30 AM"
        )
        with patch('services.sms.send_sms_via_sms_bd') as mock_sms:
            mock_sms.return_value = {"success": True}
            res = send_hospital_service_booking_confirmation_sms(hosp_booking)
            self.assertTrue(res['success'])
            mock_sms.assert_called_once()
            args = mock_sms.call_args[0]
            self.assertEqual(args[0], "01799999999")
            self.assertIn("Emergency & Trauma", args[1])
            self.assertIn("Square Hospital", args[1])
            self.assertIn(f"HSB-{hosp_booking.id}", args[1])
