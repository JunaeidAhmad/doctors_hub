"""GET /api/app-config/ (plan V.6.2, decision D4).

Unversioned and permanent: never mounted under /api/vN/. Its contract is
additive-only forever, because every app build ever shipped must be able to
read it. authentication_classes is empty on purpose — an expired JWT on the
device must never stop the update check.
"""
from django.conf import settings
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from .app_client import AppClient


class DeprecationDatesSerializer(serializers.Serializer):
    deprecated_on = serializers.CharField(allow_null=True)
    sunset_on = serializers.CharField(allow_null=True)


class ApiBlockSerializer(serializers.Serializer):
    current_version = serializers.CharField()
    supported_versions = serializers.ListField(child=serializers.CharField())
    deprecations = serializers.DictField(child=DeprecationDatesSerializer())


class PlatformBlockSerializer(serializers.Serializer):
    min_supported_build = serializers.IntegerField()
    latest_build = serializers.IntegerField()
    store_url = serializers.CharField()


class PlatformsBlockSerializer(serializers.Serializer):
    android = PlatformBlockSerializer()
    ios = PlatformBlockSerializer()


class UpdateMessageSerializer(serializers.Serializer):
    en = serializers.CharField()
    bn = serializers.CharField()


class ClientBlockSerializer(serializers.Serializer):
    platform = serializers.ChoiceField(choices=['android', 'ios'])
    build = serializers.IntegerField()
    status = serializers.ChoiceField(choices=['ok', 'update_available', 'update_required'])


class AppConfigResponseSerializer(serializers.Serializer):
    api = ApiBlockSerializer()
    platforms = PlatformsBlockSerializer()
    update_message = UpdateMessageSerializer()
    client = ClientBlockSerializer(allow_null=True)
    server_time = serializers.CharField()


def _client_block(client):
    if not client.is_known:
        return None
    if client.platform == 'android':
        min_build, latest = settings.APP_ANDROID_MIN_BUILD, settings.APP_ANDROID_LATEST_BUILD
    else:
        min_build, latest = settings.APP_IOS_MIN_BUILD, settings.APP_IOS_LATEST_BUILD
    if min_build > 0 and client.build < min_build:
        status = 'update_required'
    elif latest > 0 and client.build < latest:
        status = 'update_available'
    else:
        status = 'ok'
    return {'platform': client.platform, 'build': client.build, 'status': status}


class AppConfigAPIView(APIView):
    permission_classes = (permissions.AllowAny,)
    authentication_classes = ()

    @extend_schema(
        tags=['App'],
        summary='App configuration and update gate',
        description='Permanent unversioned endpoint. Call it before anything else at app start. '
                    'Contract is additive-only forever.',
        responses={200: AppConfigResponseSerializer},
    )
    def get(self, request, *args, **kwargs):
        versions = [str(v) for v in (settings.REST_FRAMEWORK.get('ALLOWED_VERSIONS') or [])]
        known_versions = set(versions) | {str(v) for v in settings.API_RETIRED_VERSIONS}
        known_versions |= {k for k in (settings.API_DEPRECATIONS or {}) if k != 'legacy'}
        known_versions |= {k for k in (settings.API_SUNSETS or {}) if k != 'legacy'}
        deprecations = {
            key: {
                'deprecated_on': (settings.API_DEPRECATIONS or {}).get(key),
                'sunset_on': (settings.API_SUNSETS or {}).get(key),
            }
            for key in sorted(known_versions)
        }

        response = Response({
            'api': {
                'current_version': max(versions) if versions else None,
                'supported_versions': versions,
                'deprecations': deprecations,
            },
            'platforms': {
                'android': {
                    'min_supported_build': settings.APP_ANDROID_MIN_BUILD,
                    'latest_build': settings.APP_ANDROID_LATEST_BUILD,
                    'store_url': settings.APP_ANDROID_STORE_URL,
                },
                'ios': {
                    'min_supported_build': settings.APP_IOS_MIN_BUILD,
                    'latest_build': settings.APP_IOS_LATEST_BUILD,
                    'store_url': settings.APP_IOS_STORE_URL,
                },
            },
            'update_message': {
                'en': settings.APP_UPDATE_MESSAGE_EN,
                'bn': settings.APP_UPDATE_MESSAGE_BN,
            },
            'client': _client_block(AppClient.from_headers(request)),
            'server_time': timezone.localtime().isoformat(),
        })
        response['Cache-Control'] = 'public, max-age=300'
        return response
