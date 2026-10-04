from django.core.management.base import CommandError
from django.db.models import Q
from facilities.models import District, Thana


def get_thana_strict(district_name: str, thana_name: str) -> Thana:
    """
    Strictly resolves a Thana from district_name and thana_name.
    Matches by iexact on name or bn_name within the district.
    Never creates rows.
    Raises CommandError listing the unknown value if not found.
    """
    if not district_name or not str(district_name).strip():
        raise CommandError(f"District name must not be empty (got {district_name!r}).")
    if not thana_name or not str(thana_name).strip():
        raise CommandError(f"Thana name must not be empty (got {thana_name!r}).")

    dist_str = str(district_name).strip()
    thana_str = str(thana_name).strip()

    dist = District.objects.filter(
        Q(name__iexact=dist_str) | Q(bn_name__iexact=dist_str)
    ).first()
    if not dist:
        raise CommandError(f"Unknown district: {district_name!r}")

    thana = Thana.objects.filter(
        district=dist
    ).filter(
        Q(name__iexact=thana_str) | Q(bn_name__iexact=thana_str)
    ).first()

    if not thana:
        raise CommandError(f"Unknown thana {thana_name!r} in district {dist.name!r}")

    return thana
