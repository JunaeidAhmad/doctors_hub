import logging
import threading

from django.conf import settings
from django.db import transaction


logger = logging.getLogger('sms')


def run_after_commit(fn, *args, **kwargs):
    def dispatch():
        if not getattr(settings, 'SMS_ASYNC', True):
            try:
                fn(*args, **kwargs)
            except Exception:
                logger.exception('Post-commit task failed')
            return

        def run():
            try:
                fn(*args, **kwargs)
            except Exception:
                logger.exception('Background task failed')

        threading.Thread(target=run, daemon=True).start()

    transaction.on_commit(dispatch)
