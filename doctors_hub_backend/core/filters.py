import uuid
from typing import Optional, Union, Iterable
from django.db.models import Q


def exact_slug_or_id_q(prefix: str, raw: Union[str, Iterable[str], None]) -> Optional[Q]:
    """
    Build an exact-match Q object for a slug or UUID id.

    - Split raw on commas and strip each value.
    - For each value, add Q(**{f"{prefix}slug__iexact": v}).
    - If uuid.UUID(v) parses, also add Q(**{f"{prefix}id": v}).
    - OR everything together.
    - An empty value or "all" returns None, meaning no filter.
    """
    if raw is None:
        return None

    if isinstance(raw, str):
        values = [v.strip() for v in raw.split(',') if v.strip()]
    elif isinstance(raw, (list, tuple, set)):
        values = []
        for item in raw:
            if isinstance(item, str):
                values.extend([v.strip() for v in item.split(',') if v.strip()])
            elif item is not None:
                values.append(str(item).strip())
    else:
        values = [str(raw).strip()]

    # Filter out empty strings and 'all' / 'all categories' (case-insensitive)
    values = [v for v in values if v and v.lower() not in ('all', 'all categories')]
    if not values:
        return None

    if prefix and not prefix.endswith('__'):
        prefix = f"{prefix}__"

    combined_q = Q()
    for v in values:
        term_q = Q(**{f"{prefix}slug__iexact": v})
        try:
            val_uuid = uuid.UUID(v)
            term_q |= Q(**{f"{prefix}id": val_uuid})
        except (ValueError, AttributeError):
            pass
        combined_q |= term_q

    return combined_q
