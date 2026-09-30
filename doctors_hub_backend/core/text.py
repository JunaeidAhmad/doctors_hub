import re


def format_facility_name(name: str, branch: str) -> str:
    """
    Canonical rule: Normalize all suffix forms (- Branch, , Branch, bare Branch) to canonical `Name (Branch)`,
    unless the name is identical to the branch or already enclosed in parentheses.
    This ensures identical presentation parity between the UI, API, and SMS notifications.
    """
    name = (name or "").strip()
    branch = (branch or "").strip()
    if not name:
        return f"({branch})" if branch else ""
    if not branch:
        return name

    lower_name = name.lower()
    lower_branch = branch.lower()

    if lower_name == lower_branch:
        return name

    if f"({lower_branch})" in lower_name:
        return name

    # Normalize all trailing delimiter forms ("- Branch", ", Branch", " Branch") to canonical "Name (Branch)"
    pattern = rf"[- ,]+\s*{re.escape(branch)}$"
    match = re.search(pattern, name, flags=re.IGNORECASE)
    if match and match.start() > 0:
        base = name[:match.start()].strip()
        return f"{base} ({branch})" if base else name

    return f"{name} ({branch})"
