from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, Specialty, PathologyTest, Chamber, Doctor, DoctorBooking, LabBooking
from .serializers import (
    UserSerializer, UserProfileSerializer, RegisterSerializer, LoginSerializer,
    SpecialtySerializer, PathologyTestSerializer,
    ChamberSerializer, DoctorSerializer,
    DoctorBookingSerializer, LabBookingSerializer
)

class RegisterAPIView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = (permissions.AllowAny,)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)

class LoginAPIView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data
        refresh = RefreshToken.for_user(user)
        return Response({
            "user": UserSerializer(user).data,
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }, status=status.HTTP_200_OK)

class UserProfileAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user

class SpecialtyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Specialty.objects.all()
    serializer_class = SpecialtySerializer
    permission_classes = (permissions.AllowAny,)

class PathologyTestViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PathologyTest.objects.all()
    serializer_class = PathologyTestSerializer
    permission_classes = (permissions.AllowAny,)
    
    def get_queryset(self):
        queryset = PathologyTest.objects.all()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset

class ChamberViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Chamber.objects.all()
    serializer_class = ChamberSerializer
    permission_classes = (permissions.AllowAny,)
    
    def get_queryset(self):
        queryset = Chamber.objects.all()
        location = self.request.query_params.get('location', None)
        if location and location != 'All Bangladesh':
            queryset = queryset.filter(city__icontains=location)
        return queryset

class DoctorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        queryset = Doctor.objects.all()
        specialty = self.request.query_params.get('specialty', None)
        location = self.request.query_params.get('location', None)
        search = self.request.query_params.get('search', None)
        
        if specialty:
            queryset = queryset.filter(specialty_id=specialty)
        if location and location != 'All Bangladesh':
            queryset = queryset.filter(chamber__city__icontains=location)
        if search:
            queryset = queryset.filter(name__icontains=search)
            
        return queryset

class DoctorBookingViewSet(viewsets.ModelViewSet):
    serializer_class = DoctorBookingSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return DoctorBooking.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class LabBookingViewSet(viewsets.ModelViewSet):
    serializer_class = LabBookingSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return LabBooking.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
