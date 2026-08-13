from rest_framework import viewsets
from .models import TestCategory, Test, FacilityTest
from .serializers import TestCategorySerializer, TestSerializer, FacilityTestSerializer
from core.permissions import IsAdminUserOrReadOnly

class TestCategoryViewSet(viewsets.ModelViewSet):
    queryset = TestCategory.objects.all()
    serializer_class = TestCategorySerializer
    permission_classes = (IsAdminUserOrReadOnly,)

class TestViewSet(viewsets.ModelViewSet):
    queryset = Test.objects.all()
    serializer_class = TestSerializer
    permission_classes = (IsAdminUserOrReadOnly,)

class FacilityTestViewSet(viewsets.ModelViewSet):
    queryset = FacilityTest.objects.all()
    serializer_class = FacilityTestSerializer
    permission_classes = (IsAdminUserOrReadOnly,)

DiagnosticCenterTestViewSet = FacilityTestViewSet
BranchTestViewSet = FacilityTestViewSet
PathologyTestViewSet = TestViewSet
