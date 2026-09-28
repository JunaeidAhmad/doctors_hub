def sync_doctor_tags(doctor):
    """
    Synchronizes Doctor.specialties from the union of tags on the doctor's claims.
    This is the ONLY authoritative writer for Doctor.specialties.
    """
    from doctors.models import DoctorSpecialty
    ids = DoctorSpecialty.objects.filter(claims__doctor=doctor).values_list('id', flat=True).distinct()
    doctor.specialties.set(list(ids))
