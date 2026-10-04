from core.phone import canonical_bd_phone
from bookings.models import Patient


def get_or_create_patient(phone: str, name: str = "") -> Patient:
    """
    Returns an existing Patient matching canonical phone without modifying it,
    or creates a new Patient with the canonical phone and name.
    """
    canon_phone = canonical_bd_phone(phone)
    patient = Patient.objects.filter(phone=canon_phone).first()
    if patient:
        return patient
    return Patient.objects.create(phone=canon_phone, name=name or "Patient")
