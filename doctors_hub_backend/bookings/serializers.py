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
        try:
            instance.clean()
        except Exception as e:
            if hasattr(e, 'message_dict'):
                raise serializers.ValidationError(e.message_dict)
            elif hasattr(e, 'messages'):
                raise serializers.ValidationError(e.messages)
            raise e
        return attrs

class LabBookingSerializer(serializers.ModelSerializer):
    test_name = serializers.CharField(source='facility_test.test.name', read_only=True, default='')
    center_name = serializers.CharField(source='facility_test.location.name', read_only=True, default='')
    center_branch = serializers.CharField(source='facility_test.location.branch', read_only=True, default='')
    price = serializers.DecimalField(source='facility_test.price', max_digits=10, decimal_places=2, read_only=True, default=0)
    address = serializers.CharField(source='full_pickup_address', read_only=True)
    facility_test_id = serializers.PrimaryKeyRelatedField(
        queryset=FacilityTest.objects.all(), write_only=True, source='facility_test'
    )

    class Meta:
        model = LabBooking
        fields = (
            'id', 'user', 'status', 'notes', 'created_at', 'updated_at', 'facility_test_id',
            'pickup_date', 'patient_name', 'patient_phone',
            'pickup_address_line', 'pickup_area', 'pickup_city', 'pickup_district',
            'address', 'test_name', 'center_name', 'center_branch', 'price'
        )
        read_only_fields = ('user', 'created_at', 'updated_at')

    def to_internal_value(self, data):
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'address' in mutable_data and not mutable_data.get('pickup_address_line'):
            raw_addr = mutable_data.get('address', '')
            mutable_data['pickup_address_line'] = raw_addr
            if not mutable_data.get('pickup_district'):
                mutable_data['pickup_district'] = 'Dhaka'
        return super().to_internal_value(mutable_data)

