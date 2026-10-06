"""API surface declarations (plan V.4.2).

PATIENT_SURFACE lists the endpoints the Flutter patient app calls — the frozen
contract (decision D5). Paths are version-relative and use the parameter names
the generated schema uses. UNVERSIONED_SURFACE lists permanent unversioned
endpoints (decision D4).
"""

PATIENT_SURFACE = [
    ('GET', '/search-metadata/'), ('GET', '/search-facets/'),
    ('GET', '/divisions/'), ('GET', '/districts/'), ('GET', '/thanas/'),
    ('GET', '/specialties/'), ('GET', '/specialties/suggest/'),
    ('GET', '/doctors/'), ('GET', '/doctors/{id}/'),
    ('GET', '/affiliations/{id}/availability/'),
    ('GET', '/hospitals/'), ('GET', '/hospitals/{location}/'),
    ('GET', '/hospitals/{location}/doctors/'), ('GET', '/hospitals/{location}/tests/'),
    ('GET', '/diagnostic-centers/'), ('GET', '/diagnostic-centers/{location}/'),
    ('GET', '/diagnostic-centers/{location}/doctors/'), ('GET', '/diagnostic-centers/{location}/tests/'),
    ('GET', '/hospital-categories/'), ('GET', '/diagnostic-center-categories/'),
    ('GET', '/test-categories/'), ('GET', '/hospital-services/'),
    ('GET', '/facility-tests/search/'),
    ('POST', '/bookings/otp/send/'), ('POST', '/bookings/otp/verify/'),
    ('GET', '/bookings/patients/lookup/'),
    ('POST', '/bookings/doctor/'), ('POST', '/bookings/test/'), ('POST', '/bookings/hospital-service/'),
]

UNVERSIONED_SURFACE = [('GET', '/api/app-config/')]   # added in Phase 6
