# Part 3 — Role Call-Site Inventory

72 call sites of `is_super_admin`, `is_facility_admin`, `is_facility_staff` outside `tests/` and `migrations/`.

Classification rules:
- **Row scoping** → `is_facility_staff`
- **Facility administration** → `is_facility_admin`
- **Platform-wide actions** → `is_super_admin`
- **Already gated by page permission** → keep

| file:line | code excerpt | purpose | current | correct | action |
|---|---|---|---|---|---|
| `doctors_hub_backend/accounts/views_roles.py:24` | `    is_super = getattr(request.user, 'is_superuser', False) or getattr(request.user, 'is_super_admin', False)` | platform-wide (role management) | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/views_roles.py:31` | `        "is_super_admin": is_super,` | platform-wide (role management) | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/views_roles.py:32` | `        "is_facility_admin": getattr(request.user, 'is_facility_admin', False),` | platform-wide (role management) | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/views_roles.py:131` | `        if not getattr(user, 'is_superuser', False) and not getattr(user, 'is_super_admin', False)` | platform-wide (role management) | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/views_roles.py:160` | `        if getattr(user, 'is_superuser', False) or getattr(user, 'is_super_admin', False)` | platform-wide (role management) | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/views_roles.py:162` | `        elif getattr(user, 'is_facility_admin', False)` | platform-wide (role management) | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/serializers_roles.py:26` | `        if getattr(user, 'is_superuser', False) or user.is_super_admin` | platform-wide (role management) | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/serializers_roles.py:120` | `        if not (getattr(request_user, 'is_superuser', False) or getattr(request_user, 'is_super_admin', False))` | platform-wide (role management) | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/serializers.py:19` | `    is_super_admin = serializers.SerializerMethodField()` | unknown | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/serializers.py:20` | `    is_facility_admin = serializers.SerializerMethodField()` | unknown | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/serializers.py:28` | `            'role', 'roles', 'is_super_admin', 'is_facility_admin', 'is_doctor',` | unknown | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/serializers.py:33` | `        if getattr(obj, 'is_superuser', False) or getattr(obj, 'is_super_admin', False)` | unknown | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/serializers.py:35` | `        if getattr(obj, 'is_facility_admin', False)` | unknown | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/serializers.py:48` | `    def get_is_super_admin(self, obj)` | unknown | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/serializers.py:49` | `        return getattr(obj, 'is_superuser', False) or getattr(obj, 'is_super_admin', False)` | unknown | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/serializers.py:51` | `    def get_is_facility_admin(self, obj)` | unknown | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/serializers.py:52` | `        return getattr(obj, 'is_facility_admin', False)` | unknown | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/serializers.py:59` | `        if not getattr(obj, 'is_facility_admin', False)` | unknown | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/serializers.py:89` | `    is_super_admin = serializers.SerializerMethodField()` | unknown | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/serializers.py:90` | `    is_facility_admin = serializers.SerializerMethodField()` | unknown | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/serializers.py:98` | `            'role', 'roles', 'is_super_admin', 'is_facility_admin', 'is_doctor',` | unknown | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/serializers.py:103` | `            'role', 'roles', 'is_super_admin', 'is_facility_admin', 'is_doctor',` | unknown | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/serializers.py:108` | `        if getattr(obj, 'is_superuser', False) or getattr(obj, 'is_super_admin', False)` | unknown | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/serializers.py:110` | `        if getattr(obj, 'is_facility_admin', False)` | unknown | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/serializers.py:123` | `    def get_is_super_admin(self, obj)` | unknown | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/serializers.py:124` | `        return getattr(obj, 'is_superuser', False) or getattr(obj, 'is_super_admin', False)` | unknown | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/serializers.py:126` | `    def get_is_facility_admin(self, obj)` | unknown | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/serializers.py:127` | `        return getattr(obj, 'is_facility_admin', False)` | unknown | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/serializers.py:134` | `        if not getattr(obj, 'is_facility_admin', False)` | unknown | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/serializers.py:212` | `        is_creator_super = getattr(request_user, 'is_superuser', False) or getattr(request_user, 'is_super_admin', False)` | unknown | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/views.py:314` | `        if getattr(user, "is_super_admin", False)` | platform-wide | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/views.py:465` | `        if not (request.user.is_super_admin or request.user.user_roles.filter(` | platform-wide | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/models.py:113` | `    def is_super_admin(self)` | unknown | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/models.py:123` | `    def is_facility_staff(self)` | unknown | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/models.py:130` | `    def is_facility_admin(self)` | unknown | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/accounts/serializers_onboarding.py:122` | `        # Grant roles.edit so is_facility_admin returns True` | unknown | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/bookings/views.py:164` | `        if getattr(user, "is_super_admin", False)` | row scoping (queryset) | is_facility_staff | is_facility_staff | change |
| `doctors_hub_backend/bookings/views.py:167` | `        if getattr(user, "is_facility_admin", False)` | row scoping (queryset) | is_facility_staff | is_facility_staff | change |
| `doctors_hub_backend/bookings/views.py:211` | `        if getattr(user, "is_super_admin", False)` | row scoping (queryset) | is_facility_staff | is_facility_staff | change |
| `doctors_hub_backend/bookings/views.py:214` | `        if getattr(user, "is_facility_admin", False)` | row scoping (queryset) | is_facility_staff | is_facility_staff | change |
| `doctors_hub_backend/bookings/views.py:259` | `        if getattr(user, "is_super_admin", False)` | row scoping (queryset) | is_facility_staff | is_facility_staff | change |
| `doctors_hub_backend/bookings/views.py:262` | `        if getattr(user, "is_facility_admin", False)` | row scoping (queryset) | is_facility_staff | is_facility_staff | change |
| `doctors_hub_backend/doctors/services/chambers.py:60` | `    is_super = getattr(user, 'is_super_admin', False) or getattr(user, 'is_superuser', False)` | chamber scope check | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/doctors/views.py:415` | `        if getattr(user, "is_superuser", False) or getattr(user, "is_super_admin", False) or has_permission(user, "doctors", "create")` | row scoping (queryset) | is_facility_staff | is_facility_staff | change |
| `doctors_hub_backend/doctors/views.py:422` | `        elif getattr(user, "is_facility_admin", False)` | row scoping (queryset) | is_facility_staff | is_facility_staff | change |
| `doctors_hub_backend/doctors/views.py:513` | `        if getattr(user, "is_super_admin", False)` | row scoping (queryset) | is_facility_staff | is_facility_staff | change |
| `doctors_hub_backend/doctors/views.py:520` | `        if getattr(user, "is_facility_admin", False)` | row scoping (queryset) | is_facility_staff | is_facility_staff | change |
| `doctors_hub_backend/doctors/views.py:560` | `        if getattr(user, "is_super_admin", False)` | row scoping (queryset) | is_facility_staff | is_facility_staff | change |
| `doctors_hub_backend/doctors/views.py:568` | `        if getattr(user, "is_facility_admin", False)` | row scoping (queryset) | is_facility_staff | is_facility_staff | change |
| `doctors_hub_backend/doctors/views.py:621` | `        if getattr(user, "is_super_admin", False)` | row scoping (queryset) | is_facility_staff | is_facility_staff | change |
| `doctors_hub_backend/doctors/views.py:629` | `        if getattr(user, "is_facility_admin", False)` | row scoping (queryset) | is_facility_staff | is_facility_staff | change |
| `doctors_hub_backend/doctors/admin.py:17` | `            getattr(request.user, 'is_super_admin', False) or` | platform-wide (Django admin) | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/doctors/admin.py:27` | `            getattr(request.user, 'is_super_admin', False) or` | platform-wide (Django admin) | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/doctors/admin.py:36` | `            getattr(request.user, 'is_super_admin', False) or` | platform-wide (Django admin) | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/doctors/admin.py:45` | `            getattr(request.user, 'is_super_admin', False) or` | platform-wide (Django admin) | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/doctors/admin.py:54` | `            getattr(request.user, 'is_super_admin', False) or` | platform-wide (Django admin) | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/facilities/views.py:117` | `        if getattr(user, "is_super_admin", False)` | row scoping (queryset) | is_facility_staff | is_facility_staff | change |
| `doctors_hub_backend/facilities/views.py:119` | `        elif getattr(user, "is_facility_admin", False)` | row scoping (queryset) | is_facility_staff | is_facility_staff | change |
| `doctors_hub_backend/core/permissions.py:65` | `        return bool(request.user and request.user.is_authenticated and getattr(request.user, "is_super_admin", False))` | object permission / row scoping | is_facility_staff | is_facility_staff | change |
| `doctors_hub_backend/core/permissions.py:71` | `        return bool(request.user and request.user.is_authenticated and getattr(request.user, "is_super_admin", False))` | object permission / row scoping | is_facility_staff | is_facility_staff | change |
| `doctors_hub_backend/core/permissions.py:79` | `                getattr(request.user, "is_super_admin", False) or` | object permission / row scoping | is_facility_staff | is_facility_staff | change |
| `doctors_hub_backend/core/permissions.py:80` | `                getattr(request.user, "is_facility_admin", False) or` | object permission / row scoping | is_facility_staff | is_facility_staff | change |
| `doctors_hub_backend/core/permissions.py:91` | `        if getattr(user, "is_super_admin", False) or getattr(user, "is_superuser", False)` | object permission / row scoping | is_facility_staff | is_facility_staff | change |
| `doctors_hub_backend/core/permissions.py:93` | `        if getattr(user, "is_facility_admin", False)` | object permission / row scoping | is_facility_staff | is_facility_staff | change |
| `doctors_hub_backend/core/permissions.py:123` | `        if getattr(user, "is_super_admin", False) or getattr(user, "is_superuser", False)` | object permission / row scoping | is_facility_staff | is_facility_staff | change |
| `doctors_hub_backend/core/permissions.py:143` | `    if getattr(user, "is_super_admin", False): return True` | object permission / row scoping | is_facility_staff | is_facility_staff | change |
| `doctors_hub_backend/core/visibility.py:11` | `    if getattr(user, "is_superuser", False) or getattr(user, "is_super_admin", False)` | row scoping | is_facility_staff | is_facility_staff | change |
| `doctors_hub_backend/core/visibility.py:15` | `    if getattr(user, "is_facility_admin", False)` | row scoping | is_facility_staff | is_facility_staff | change |
| `doctors_hub_backend/core/visibility.py:39` | `        if user and (getattr(user, "is_superuser", False) or getattr(user, "is_super_admin", False))` | row scoping | is_facility_staff | is_facility_staff | change |
| `doctors_hub_backend/core/views.py:281` | `        is_super = getattr(user, "is_super_admin", False)` | platform-wide (admin init) | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/core/views.py:282` | `        is_fac = getattr(user, "is_facility_admin", False)` | platform-wide (admin init) | is_super_admin | is_super_admin | keep |
| `doctors_hub_backend/core/scoping.py:125` | `        if getattr(user, "is_facility_admin", False)` | row scoping | is_facility_staff | is_facility_staff | change |

**Total rows: 72. UNCLEAR: 0.**
