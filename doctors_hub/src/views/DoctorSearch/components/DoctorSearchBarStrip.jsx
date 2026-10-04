import React, { useMemo } from 'react';

export default function DoctorSearchBarStrip({
  specialty,
  onSpecialtyChange,
  specialties = [],
  specialtyGroups = [],
  facility,
  onFacilityChange,
  facilities = [],
  keyword,
  onKeywordChange,
  onSearchSubmit
}) {
  const facilityOptions = (facilities || [])
    .slice()
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  // Normalize specialty value to match option values whether slug or name was passed
  const currentSpecialtyValue = useMemo(() => {
    if (!specialty) return '';
    for (const grp of specialtyGroups) {
      const gSlug = grp.slug || grp.name;
      if (specialty === gSlug || specialty === grp.name || specialty === grp.slug) {
        return gSlug;
      }
      for (const child of (grp.children || [])) {
        const cSlug = child.slug || child.name;
        if (specialty === cSlug || specialty === child.name || specialty === child.slug) {
          return cSlug;
        }
      }
    }
    return specialty;
  }, [specialty, specialtyGroups]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearchSubmit) onSearchSubmit();
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-xs p-2.5 sm:p-3">
      <form
        className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center"
        onSubmit={handleSubmit}
      >
        {/* 1. Specialty Selector */}
        <div className="relative flex-1 lg:max-w-[270px]">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-[20px]">stethoscope</span>
          </div>
          <select
            value={currentSpecialtyValue}
            onChange={(e) => onSpecialtyChange && onSpecialtyChange(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant/60 rounded-lg pl-10 pr-9 py-2.5 text-body-sm font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer truncate"
            style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
          >
            <option value="">All Specialties</option>
            {specialtyGroups.length > 0 ? (
              specialtyGroups.map((grp) => {
                const grpVal = grp.slug || grp.name;
                const grpLabel = `${grp.label || grp.name}${grp.count ? ` (${grp.count})` : ''}`;
                return (
                  <React.Fragment key={grp.id || grp.slug || grp.name}>
                    <option
                      value={grpVal}
                      className="font-bold text-on-surface bg-surface-container-low"
                    >
                      {grpLabel}
                    </option>
                    {(grp.children || []).map((child) => {
                      const childVal = child.slug || child.name;
                      const childLabel = `${child.label || child.name}${child.count ? ` (${child.count})` : ''}`;
                      return (
                        <option
                          key={child.id || child.slug || child.name}
                          value={childVal}
                          className="text-on-surface-variant"
                        >
                          {'\u00A0\u00A0\u00A0\u00A0'}{childLabel}
                        </option>
                      );
                    })}
                  </React.Fragment>
                );
              })
            ) : specialties.length > 0 ? (
              specialties.map((s) => {
                const val = typeof s === 'object' ? (s.slug || s.name) : s;
                const label = typeof s === 'object' ? (s.label || s.name) : s;
                return (
                  <option key={val} value={val}>
                    {label}
                  </option>
                );
              })
            ) : (
              <>
                <option value="medicine-primary-care">Medicine &amp; Primary Care</option>
                <option value="heart-vascular">Heart &amp; Vascular</option>
                <option value="cancer-care">Cancer Care</option>
                <option value="brain-spine-nerves">Brain, Spine &amp; Nerves</option>
                <option value="bone-joint">Bone &amp; Joint</option>
                <option value="womens-health-pregnancy">Women's Health &amp; Pregnancy</option>
                <option value="child-health">Child Health</option>
                <option value="kidney-urinary">Kidney &amp; Urinary</option>
                <option value="digestive-liver">Digestive &amp; Liver</option>
                <option value="skin-hair-dermatology">Skin, Hair &amp; Dermatology</option>
              </>
            )}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none flex items-center">
            <span className="material-symbols-outlined text-[18px]">expand_more</span>
          </div>
        </div>

        {/* 2. Hospital & Diagnostic Center Selector */}
        <div className="relative flex-1 lg:max-w-[300px]">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-[20px]">local_hospital</span>
          </div>
          <select
            value={facility || ''}
            onChange={(e) => onFacilityChange && onFacilityChange(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant/60 rounded-lg pl-10 pr-9 py-2.5 text-body-sm font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer truncate"
            style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
          >
            <option value="">Select Hospital & Diagnostic Center</option>
            {facilityOptions.map((fac) => {
              const facVal = fac.id || fac.slug || fac.name;
              const facLabel = (fac?.display_name || fac?.name || "");
              return (
                <option key={facVal} value={facVal}>
                  {facLabel}
                </option>
              );
            })}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none flex items-center">
            <span className="material-symbols-outlined text-[18px]">expand_more</span>
          </div>
        </div>

        {/* 3. Keyword / Doctor Search Input */}
        <div className="relative flex-1 min-w-0">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </div>
          <input
            type="text"
            value={keyword || ''}
            onChange={(e) => onKeywordChange && onKeywordChange(e.target.value)}
            placeholder="Search by Doctor name or specialty"
            className="w-full bg-surface-container-low border border-outline-variant/60 rounded-lg pl-10 pr-4 py-2.5 text-body-sm text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
        </div>

        {/* 4. Emerald Search Button */}
        <button
          type="submit"
          className="bg-primary hover:bg-primary-container text-on-primary font-semibold flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg shadow-sm transition-all shrink-0 active:scale-[0.98] cursor-pointer font-label-lg text-label-lg"
        >
          <span className="material-symbols-outlined text-[18px]">search</span>
          <span>Search Doctors</span>
        </button>
      </form>
    </div>
  );
}
