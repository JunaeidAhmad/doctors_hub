"""Mobile client middleware (plan V.7.1).

One middleware for client identification, the upgrade gate, retired versions,
deprecation headers and usage logging. It only touches paths starting with
/api/ and never touches /api/app-config/, /api/schema/, /api/docs/ or
/api/redoc/. Requests without X-App-* headers (the web app) are never gated.
"""
import datetime
import json
import logging
import re

from django.conf import settings
from django.http import JsonResponse
from django.utils.http import http_date

from .app_client import AppClient

logger = logging.getLogger('api.usage')

EXEMPT_PATHS = ('/api/app-config/', '/api/schema/', '/api/docs/', '/api/redoc/')
VERSION_RE = re.compile(r'^/api/(v\d+)(?:/|$)')


def _date_ts(value):
    dt = datetime.datetime.combine(
        datetime.date.fromisoformat(str(value)), datetime.time(), tzinfo=datetime.timezone.utc)
    return int(dt.timestamp())


class ApiClientMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path_info
        is_api = path.startswith('/api/') and path not in EXEMPT_PATHS
        version_key = 'legacy'
        if is_api:
            match = VERSION_RE.match(path)
            version_key = match.group(1) if match else 'legacy'
            request.app_client = AppClient.from_headers(request)
            blocked = self._gate(request, version_key)
            if blocked is not None:
                return self._finalize(request, blocked, version_key)

        response = self.get_response(request)
        return self._finalize(request, response, version_key) if is_api else response

    # ---- request side ----------------------------------------------------

    def _gate(self, request, version_key):
        client = request.app_client
        effective = version_key if version_key != 'legacy' else str(
            settings.REST_FRAMEWORK.get('DEFAULT_VERSION'))
        if effective in settings.API_RETIRED_VERSIONS:
            return JsonResponse({
                'code': 'api_version_retired',
                'detail': f'API version {effective} has been retired. Please update the app.',
                'update': self._platform_block(client),
                'message': {
                    'en': settings.APP_UPDATE_MESSAGE_EN,
                    'bn': settings.APP_UPDATE_MESSAGE_BN,
                },
            }, status=426)

        if client.is_known:
            if client.platform == 'android':
                min_build = settings.APP_ANDROID_MIN_BUILD
                store_url = settings.APP_ANDROID_STORE_URL
            else:
                min_build = settings.APP_IOS_MIN_BUILD
                store_url = settings.APP_IOS_STORE_URL
            if min_build > 0 and client.build < min_build:
                return JsonResponse({
                    'code': 'app_update_required',
                    'min_supported_build': min_build,
                    'store_url': store_url,
                    'message': {
                        'en': settings.APP_UPDATE_MESSAGE_EN,
                        'bn': settings.APP_UPDATE_MESSAGE_BN,
                    },
                }, status=426)
        return None

    @staticmethod
    def _platform_block(client):
        if not client.is_known:
            return None
        if client.platform == 'android':
            return {
                'min_supported_build': settings.APP_ANDROID_MIN_BUILD,
                'latest_build': settings.APP_ANDROID_LATEST_BUILD,
                'store_url': settings.APP_ANDROID_STORE_URL,
            }
        return {
            'min_supported_build': settings.APP_IOS_MIN_BUILD,
            'latest_build': settings.APP_IOS_LATEST_BUILD,
            'store_url': settings.APP_IOS_STORE_URL,
        }

    # ---- response side ---------------------------------------------------

    def _finalize(self, request, response, version_key):
        self._deprecation_headers(request, response, version_key)
        self._usage_log(request, response, version_key)
        return response

    def _deprecation_headers(self, request, response, version_key):
        if version_key == 'legacy' and not settings.API_DEPRECATE_LEGACY:
            return
        deprecated = settings.API_DEPRECATIONS or {}
        sunsets = settings.API_SUNSETS or {}

        if version_key in deprecated:
            response['Deprecation'] = f'@{_date_ts(deprecated[version_key])}'
        if version_key in sunsets:
            response['Sunset'] = http_date(_date_ts(sunsets[version_key]))

        if version_key == 'legacy':
            successor_path = '/api/v1' + request.path_info[len('/api'):]
            url = request.build_absolute_uri(successor_path)
            if request.META.get('QUERY_STRING'):
                url = f'{url}?{request.META["QUERY_STRING"]}'
            response['Link'] = f'<{url}>; rel="successor-version"'
        else:
            next_version = f'v{int(version_key[1:]) + 1}'
            if next_version in (settings.REST_FRAMEWORK.get('ALLOWED_VERSIONS') or ()):
                url = request.build_absolute_uri(
                    f'/api/{next_version}' + request.path_info[len(f'/api/{version_key}'):]
                )
                if request.META.get('QUERY_STRING'):
                    url = f'{url}?{request.META["QUERY_STRING"]}'
                response['Link'] = f'<{url}>; rel="successor-version"'

    def _usage_log(self, request, response, version_key):
        if not settings.API_USAGE_LOG:
            return
        client = getattr(request, 'app_client', None)
        route = request.resolver_match.route if request.resolver_match else 'unresolved'
        logger.info(
            '%s %s %s platform=%s build=%s status=%s',
            request.method,
            version_key,
            route,
            client.platform if client else '-',
            client.build if client else '-',
            response.status_code,
        )
