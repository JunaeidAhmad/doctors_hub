"""Schema-only serializers for the OTP and patient-lookup views (plan V.4.3).

They mirror exactly what send_otp, verify_otp and patient_lookup read and
return today. The views do NOT use them for validation.
"""
from rest_framework import serializers

from .serializers import PatientSerializer


class SendOtpRequestSerializer(serializers.Serializer):
    phone = serializers.CharField()
    purpose = serializers.CharField(required=False, allow_blank=True)


class SendOtpResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    message = serializers.CharField()
    phone = serializers.CharField()
    expires_in = serializers.IntegerField()


class VerifyOtpRequestSerializer(serializers.Serializer):
    phone = serializers.CharField()
    otp_code = serializers.CharField()
    purpose = serializers.CharField(required=False, allow_blank=True)


class VerifyOtpSuccessSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    message = serializers.CharField()
    phone = serializers.CharField()


class VerifyOtpFailureSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    message = serializers.CharField()


class PatientLookupQuerySerializer(serializers.Serializer):
    phone = serializers.CharField(required=False, allow_blank=True)


class PatientLookupResponseSerializer(serializers.Serializer):
    found = serializers.BooleanField()
    patient = PatientSerializer(required=False)
    message = serializers.CharField(required=False, allow_blank=True)
