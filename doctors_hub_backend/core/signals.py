from django.db.models.signals import post_save, post_delete, m2m_changed
from django.dispatch import receiver

from core.cache_keys import bump_public_cache


# Models that invalidate the public cache on write
_CACHE_MODELS = []


def _register_cache_model(model):
    _CACHE_MODELS.append(model)


def connect_signals():
    from facilities.models import (
        Location, Hospital, DiagnosticCenter,
        HospitalCategory, DiagnosticCenterCategory,
    )
    from tests.models import TestCategory, Test, FacilityTest
    from doctors.models import DoctorSpecialty, SpecialtyAlias, Doctor, DoctorAffiliation

    for model in (
        Location, Hospital, DiagnosticCenter,
        HospitalCategory, DiagnosticCenterCategory,
        TestCategory, Test, FacilityTest,
        DoctorSpecialty, SpecialtyAlias,
        Doctor, DoctorAffiliation,
    ):
        post_save.connect(_bump_on_save, sender=model)
        post_delete.connect(_bump_on_delete, sender=model)


def _bump_on_save(sender, **kwargs):
    bump_public_cache()


def _bump_on_delete(sender, **kwargs):
    bump_public_cache()
