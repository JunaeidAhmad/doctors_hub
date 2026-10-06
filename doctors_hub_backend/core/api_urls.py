from django.urls import path, include
from .views import SearchMetadataAPIView, SearchFacetsAPIView, AdminInitAPIView

urlpatterns = [
    path('', include('accounts.urls')),
    path('', include('facilities.urls')),
    path('', include('doctors.urls')),
    path('', include('tests.urls')),
    path('bookings/', include('bookings.urls')),
    path('search-metadata/', SearchMetadataAPIView.as_view(), name='search-metadata'),
    path('search/metadata/', SearchMetadataAPIView.as_view(), name='search-metadata-slash'),
    path('search-facets/', SearchFacetsAPIView.as_view(), name='search-facets'),
    path('admin/dashboard-init/', AdminInitAPIView.as_view(), name='admin-dashboard-init'),
]
