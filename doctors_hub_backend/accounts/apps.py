from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'

    def ready(self):
        from core.signals import connect_signals
        connect_signals()

        from django.core.checks import register, Warning
        from django.conf import settings

        @register()
        def check_cache_config(app_configs, **kwargs):
            errors = []
            if not settings.DEBUG and not getattr(settings, 'REDIS_URL', ''):
                errors.append(
                    Warning(
                        'Caches are per-process and must not run with multiple workers.',
                        hint='Set REDIS_URL to use a shared cache backend.',
                        id='core.W001',
                    )
                )
            return errors
