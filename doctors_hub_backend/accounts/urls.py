from django.urls import path
from .views import LoginAPIView, UserProfileAPIView

app_name = 'accounts'

urlpatterns = [
    path('auth/login/', LoginAPIView.as_view(), name='login'),
    path('auth/me/', UserProfileAPIView.as_view(), name='user-profile'),
]
