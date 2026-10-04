import pytest


@pytest.fixture(autouse=True)
def _disable_async_sms(settings):
    settings.SMS_ASYNC = False
