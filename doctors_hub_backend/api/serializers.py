from rest_framework import serializers
from .models import User, Specialty, PathologyTest, Chamber, Doctor, DoctorBooking, LabBooking
from django.contrib.auth import authenticate

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'phone_number', 'first_name', 'last_name')

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'phone_number', 'first_name', 'last_name')

    def validate_phone_number(self, value):
        user = self.instance
        if User.objects.filter(phone_number=value).exclude(pk=user.pk if user else None).exists():
            raise serializers.ValidationError("A user with this phone number already exists.")
        return value


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ('phone_number', 'password', 'first_name', 'last_name')
        
    def create(self, validated_data):
        user = User.objects.create_user(
            phone_number=validated_data['phone_number'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

class LoginSerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(phone_number=data.get('phone_number'), password=data.get('password'))
        if user and user.is_active:
            return user
        raise serializers.ValidationError("Incorrect Credentials")

class SpecialtySerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialty
        fields = '__all__'

class PathologyTestSerializer(serializers.ModelSerializer):
    class Meta:
        model = PathologyTest
        fields = '__all__'

class DoctorSerializer(serializers.ModelSerializer):
    specialty_details = SpecialtySerializer(source='specialty', read_only=True)
    
    class Meta:
        model = Doctor
        fields = '__all__'

class ChamberSerializer(serializers.ModelSerializer):
    doctors = DoctorSerializer(many=True, read_only=True)
    
    class Meta:
        model = Chamber
        fields = '__all__'

class DoctorBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorBooking
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'status')

class LabBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabBooking
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'status')
