/**
 * Formats a medical facility name with its branch name in standard format: `Name (Branch)`.
 * Automatically deduplicates to prevent redundant labels like "Hospital (Branch) (Branch)"
 * or "Hospital - Branch (Branch)".
 *
 * @param {string|object} facilityOrName - Facility object or facility name string.
 * @param {string} [explicitBranch=''] - Optional explicit branch name if facilityOrName is a string or needs override.
 * @returns {string} The canonical formatted facility string, e.g. "Square Hospital (Panthapath)".
 */
export function formatFacilityName(facilityOrName, explicitBranch = '') {
  if (!facilityOrName && !explicitBranch) return '';

  let name = '';
  let branch = '';

  if (typeof facilityOrName === 'object') {
    name = (
      facilityOrName.name ||
      facilityOrName.facility_name ||
      facilityOrName.center_name ||
      facilityOrName.hospital_name ||
      facilityOrName.chamber_name ||
      facilityOrName.location_details?.name ||
      facilityOrName.location?.name ||
      facilityOrName.title ||
      ''
    ).trim();

    branch = (
      explicitBranch ||
      facilityOrName.branch ||
      facilityOrName.center_branch ||
      facilityOrName.hospital_branch ||
      facilityOrName.location_details?.branch ||
      facilityOrName.location?.branch ||
      ''
    ).trim();
  } else if (typeof facilityOrName === 'string') {
    name = facilityOrName.trim();
    branch = (explicitBranch || '').trim();
  }

  if (!name) return branch ? `(${branch})` : '';
  if (!branch) return name;

  // Deduplication & Normalization:
  // Canonical rule: If the name already ends with the branch in any delimiter form
  // (- Branch, , Branch, or bare Branch), normalize it to the standard `Name (Branch)` pattern.
  // This standardizes legacy data entry patterns across all UI components and SMS notifications.
  // Exception 1: If name is strictly identical to branch (e.g. "Dhanmondi" + "Dhanmondi"), return name untouched.
  // Exception 2: If name is already enclosed in parentheses `(Branch)`, preserve as-is.
  const lowerName = name.toLowerCase();
  const lowerBranch = branch.toLowerCase();

  if (lowerName === lowerBranch) {
    return name;
  }

  // e.g. "Square Hospital (Panthapath)" with branch "Panthapath" (case-insensitive)
  if (lowerName.includes(`(${lowerBranch})`)) {
    return name;
  }

  // Normalize all trailing delimiter forms ("- Branch", ", Branch", " Branch") to canonical "Name (Branch)"
  const escaped = branch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const suffixMatch = name.match(new RegExp(`[- ,]+\\s*${escaped}$`, 'i'));
  if (suffixMatch && suffixMatch.index > 0) {
    const base = name.slice(0, suffixMatch.index).trim();
    return base ? `${base} (${branch})` : name;
  }

  return `${name} (${branch})`;
}

