from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from .views import SearchMetadataAPIView, SearchFacetsAPIView, AdminInitAPIView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/search-metadata/', SearchMetadataAPIView.as_view(), name='search-metadata'),
    path('api/search-facets/', SearchFacetsAPIView.as_view(), name='search-facets'),
    path('api/admin/dashboard-init/', AdminInitAPIView.as_view(), name='admin-dashboard-init'),

    # Standard /api/ prefix
    path('api/', include('accounts.urls')),
    path('api/', include('facilities.urls')),
    path('api/', include('doctors.urls')),
    path('api/', include('tests.urls')),
    path('api/bookings/', include('bookings.urls')),

    # Versioned /api/v1/ prefix alias
    path('api/v1/', include('accounts.urls')),
    path('api/v1/', include('facilities.urls')),
    path('api/v1/', include('doctors.urls')),
    path('api/v1/', include('tests.urls')),
    path('api/v1/bookings/', include('bookings.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
