import pytest
from rest_framework import status
from rest_framework.test import APIClient
from doctors.models import Doctor, DoctorSpecialty, DoctorAffiliation, AffiliationSchedule
from tests.factories import UserFactory, LocationFactory, DoctorSpecialtyFactory


@pytest.mark.django_db
class TestDoctorCreationAndDisplay:

    @pytest.fixture(autouse=True)
    def setup_method(self):
        self.client = APIClient()
        self.super_admin = UserFactory.create_super_admin()
        self.location = LocationFactory.create(name="Square Hospital", branch="Panthapath")
        self.specialty = DoctorSpecialtyFactory.create(name="Cardiology")

    def test_create_doctor_with_all_model_fields_and_view_in_api(self):
        # 1. Authenticate as Super Admin
        self.client.force_authenticate(user=self.super_admin)

        # 2. Payload with EVERY model field
        doc_payload = {
            "name": "Dr. Tanvir Ahmed",
            "bn_name": "তানভীর আহমেদ",
            "bmdc_number": "A-99881",
            "academic_title": "Associate Professor",
            "institution": "Dhaka Medical College & Hospital",
            "qualification": "MBBS, FCPS (Cardiology), MD",
            "experience": "15+ Yrs Exp.",
            "about": "Cardiologist with extensive experience in interventional cardiology.",
            "clinical_services": "Echocardiography, Coronary Angiogram, Pacemaker Check",
            "gender": "Male",
            "is_verified": True,
            "status": "Active",
            "rating": "4.95",
            "review_count": 150,
            "specialty_ids": [str(self.specialty.id)],
        }

        response = self.client.post("/api/doctors/", doc_payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED, response.data
        doc_data = response.data

        # Verify honorific stripping on English name
        assert doc_data["name"] == "Tanvir Ahmed"
        assert doc_data["bn_name"] == "তানভীর আহমেদ"
        assert doc_data["bmdc_number"] == "A-99881"
        assert doc_data["academic_title"] == "Associate Professor"
        assert doc_data["institution"] == "Dhaka Medical College & Hospital"
        assert doc_data["qualification"] == "MBBS, FCPS (Cardiology), MD"
        assert doc_data["experience"] == "15+ Yrs Exp."
        assert doc_data["about"] == "Cardiologist with extensive experience in interventional cardiology."
        assert doc_data["clinical_services"] == "Echocardiography, Coronary Angiogram, Pacemaker Check"
        assert doc_data["gender"] == "Male"
        assert doc_data["is_verified"] is True
        assert doc_data["status"] == "Active"
        assert float(doc_data["rating"]) == 4.95
        assert doc_data["review_count"] == 150
        assert len(doc_data["specialties"]) == 1
        assert doc_data["specialties"][0]["name"] == "Cardiology"

        doctor_id = doc_data["id"]
        doctor_slug = doc_data["slug"]

        # 3. Create Doctor Affiliation with chamber_type and status_label
        aff_payload = {
            "doctor": doctor_id,
            "location_id": str(self.location.id),
            "fee": "1500.00",
            "chamber_type": "Visiting Chamber",
            "status_label": "Available Today"
        }
        aff_res = self.client.post("/api/affiliations/", aff_payload, format="json")
        assert aff_res.status_code == status.HTTP_201_CREATED, aff_res.data
        aff_id = aff_res.data["id"]
        assert aff_res.data["chamber_type"] == "Visiting Chamber"
        assert aff_res.data["status_label"] == "Available Today"
        assert float(aff_res.data["fee"]) == 1500.00

        # 4. Create Affiliation Schedule
        sched_payload = {
            "affiliation_id": aff_id,
            "day_of_week": "Saturday",
            "start_time": "17:00:00",
            "end_time": "21:00:00"
        }
        sched_res = self.client.post("/api/schedules/", sched_payload, format="json")
        assert sched_res.status_code == status.HTTP_201_CREATED, sched_res.data

        # 5. Public API Verification (Unauthenticated frontend user)
        self.client.force_authenticate(user=None)

        # GET /api/doctors/
        list_res = self.client.get("/api/doctors/")
        assert list_res.status_code == status.HTTP_200_OK
        results = list_res.data.get("results", list_res.data) if isinstance(list_res.data, dict) else list_res.data
        matching = [d for d in results if d["id"] == doctor_id]
        assert len(matching) == 1
        matched_doc = matching[0]

        assert matched_doc["name"] == "Tanvir Ahmed"
        assert matched_doc["bn_name"] == "তানভীর আহমেদ"
        assert matched_doc["gender"] == "Male"
        assert matched_doc["bmdc_number"] == "A-99881"
        assert matched_doc["academic_title"] == "Associate Professor"
        assert matched_doc["institution"] == "Dhaka Medical College & Hospital"
        assert matched_doc["qualification"] == "MBBS, FCPS (Cardiology), MD"
        assert matched_doc["is_verified"] is True
        assert matched_doc["status"] == "Active"
        assert float(matched_doc["rating"]) == 4.95
        assert matched_doc["review_count"] == 150

        # Check affiliations in list response
        assert len(matched_doc["affiliations"]) == 1
        aff = matched_doc["affiliations"][0]
        assert aff["chamber_type"] == "Visiting Chamber"
        assert aff["status_label"] == "Available Today"
        assert float(aff["fee"]) == 1500.00
        assert len(aff["schedules"]) == 1
        assert aff["schedules"][0]["day_of_week"] == "Saturday"
        assert aff["schedules"][0]["start_time"] == "17:00:00"
        assert aff["schedules"][0]["end_time"] == "21:00:00"

        # GET by ID
        detail_res = self.client.get(f"/api/doctors/{doctor_id}/")
        assert detail_res.status_code == status.HTTP_200_OK
        assert detail_res.data["name"] == "Tanvir Ahmed"
        assert detail_res.data["slug"] == doctor_slug

        # GET by Slug
        slug_res = self.client.get(f"/api/doctors/{doctor_slug}/")
        assert slug_res.status_code == status.HTTP_200_OK
        assert slug_res.data["id"] == doctor_id

    def test_bmdc_number_empty_string_does_not_cause_unique_constraint_violation(self):
        self.client.force_authenticate(user=self.super_admin)

        # Create doctor 1 with empty BMDC string
        doc1 = self.client.post("/api/doctors/", {
            "name": "Dr. First Doctor",
            "qualification": "MBBS",
            "bmdc_number": "",
            "specialty_ids": [str(self.specialty.id)]
        }, format="json")
        assert doc1.status_code == status.HTTP_201_CREATED, doc1.data

        # Create doctor 2 also with empty BMDC string
        doc2 = self.client.post("/api/doctors/", {
            "name": "Dr. Second Doctor",
            "qualification": "MBBS, FCPS",
            "bmdc_number": "   ",
            "specialty_ids": [str(self.specialty.id)]
        }, format="json")
        assert doc2.status_code == status.HTTP_201_CREATED, doc2.data

        # Verify both have bmdc_number stored as None (null)
        d1 = Doctor.objects.get(id=doc1.data["id"])
        d2 = Doctor.objects.get(id=doc2.data["id"])
        assert d1.bmdc_number is None
        assert d2.bmdc_number is None
