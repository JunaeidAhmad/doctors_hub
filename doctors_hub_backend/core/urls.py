from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView
)
from .views_app_config import AppConfigAPIView

urlpatterns = [
    path('admin/', admin.site.urls),

    # OpenAPI Schema & Interactive Documentation (unversioned, describe the latest)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Permanent unversioned app config (decision D4) — before the versioned mount
    path('api/app-config/', AppConfigAPIView.as_view(), name='app-config'),

    # Canonical versioned API (/api/v1/, /api/v2/ when it exists).
    # re_path with v\d+, not path('api/<str:version>/'): the str converter would
    # capture /api/doctors/ as version='doctors' and 404 it.
    re_path(r'^api/(?P<version>v\d+)/', include('core.api_urls')),

    # Legacy unversioned alias -> DEFAULT_VERSION (v1). Hidden from the schema,
    # gets deprecation headers once enabled (Phase 7).
    path('api/', include('core.api_urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
