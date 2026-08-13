from rest_framework import serializers
from .models import DoctorBooking, LabBooking
from doctors.models import DoctorAffiliation
from tests.models import FacilityTest

class DoctorBookingSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='affiliation.doctor.name', read_only=True)
    facility_name = serializers.CharField(source='affiliation.location.name', read_only=True)
    consultation_type = serializers.CharField(source='affiliation.consultation_type', read_only=True)
    affiliation_id = serializers.PrimaryKeyRelatedField(
        queryset=DoctorAffiliation.objects.all(), write_only=True, source='affiliation'
    )

    class Meta:
        model = DoctorBooking
        fields = (
            'id', 'user', 'status', 'notes', 'created_at', 'updated_at', 'affiliation_id',
            'date', 'slot', 'patient_name', 'doctor_name', 'facility_name', 'consultation_type'
        )
        read_only_fields = ('user', 'created_at', 'updated_at')

    def validate(self, attrs):
        instance = DoctorBooking(**attrs)
        instance.clean()
        return attrs

class LabBookingSerializer(serializers.ModelSerializer):
    test_name = serializers.CharField(source='facility_test.test.name', read_only=True, default='')
    center_name = serializers.CharField(source='facility_test.location.name', read_only=True, default='')
    center_branch = serializers.CharField(source='facility_test.location.branch', read_only=True, default='')
    price = serializers.DecimalField(source='facility_test.price', max_digits=10, decimal_places=2, read_only=True, default=0)
    facility_test_id = serializers.PrimaryKeyRelatedField(
        queryset=FacilityTest.objects.all(), write_only=True, source='facility_test'
    )

    class Meta:
        model = LabBooking
        fields = (
            'id', 'user', 'status', 'notes', 'created_at', 'updated_at', 'facility_test_id',
            'pickup_date', 'patient_name', 'patient_phone', 'address', 'test_name',
            'center_name', 'center_branch', 'price'
        )
        read_only_fields = ('user', 'created_at', 'updated_at')
