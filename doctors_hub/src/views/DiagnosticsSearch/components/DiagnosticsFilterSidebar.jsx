import React from 'react';
import { DIVISIONS, DIVISION_DISTRICTS, DISTRICT_THANAS } from '../../../data/constants';

export default function DiagnosticsFilterSidebar({
  division = 'Dhaka Division',
  district = 'Dhaka District',
  area = 'Dhanmondi',
  onLocationChange,
  onClearLocation,
  fulfillment = 'home', // 'all' | 'home' | 'center'
  onFulfillmentChange,
  ownership = 'private', // 'all' | 'private' | 'hospital_affiliated' | 'government' | 'ngo'
  onOwnershipChange,
  ownershipCounts = {},
  onResetAll,
  onApplyFilters,
  onClose,
  className = 'hidden lg:block',
}) {
  // Clean division name
  const cleanDivision = (division || '').replace(/\s*Division$/i, '').trim();
  const activeDivision = DIVISIONS.includes(cleanDivision) ? cleanDivision : 'Dhaka';
  const availableDistricts = DIVISION_DISTRICTS[activeDivision] || DIVISION_DISTRICTS['Dhaka'] || [];

  // Clean district name
  const cleanDistrict = (district || '').replace(/\s*District$/i, '').trim();
  const activeDistrict = availableDistricts.includes(cleanDistrict) ? cleanDistrict : (availableDistricts[0] || 'Dhaka');
  const availableAreas = DISTRICT_THANAS[activeDistrict] || DISTRICT_THANAS['Dhaka'] || [];

  return (
    <aside className={`bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-6 shadow-sm space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-outline-variant/60">
        <div className="flex items-center gap-2 text-on-surface font-title-md font-bold">
          <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
          <span>Filters</span>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onResetAll}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[15px]">restart_alt</span>
            Reset All
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1 text-on-surface-variant hover:text-on-surface cursor-pointer rounded-md hover:bg-surface-container-low transition-colors flex items-center justify-center"
              title="Close Filters"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Location Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-label-md text-xs uppercase tracking-wider text-on-surface-variant font-bold">
            Location
          </h4>
          <button
            type="button"
            onClick={onClearLocation}
            className="text-[11px] text-primary font-medium cursor-pointer hover:underline"
          >
            Clear
          </button>
        </div>

        <div className="space-y-2.5">
          {/* Division */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-on-surface-variant">Division</label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-secondary text-[18px] pointer-events-none">
                map
              </span>
              <select
                value={activeDivision}
                onChange={(e) => onLocationChange({ division: `${e.target.value} Division`, district: 'Dhaka District', area: 'Dhanmondi' })}
                className="w-full pl-9 pr-8 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface font-label-md text-xs focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                style={{ backgroundImage: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
              >
                <option value="All Bangladesh">All Bangladesh</option>
                {DIVISIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} Division
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 text-on-surface-variant text-[16px] pointer-events-none">
                keyboard_arrow_down
              </span>
            </div>
          </div>

          {/* District */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-on-surface-variant">District</label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-secondary text-[18px] pointer-events-none">
                location_city
              </span>
              <select
                value={activeDistrict}
                onChange={(e) => onLocationChange({ division, district: `${e.target.value} District`, area: 'All Areas' })}
                className="w-full pl-9 pr-8 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface font-label-md text-xs focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                style={{ backgroundImage: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
              >
                {availableDistricts.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist} District
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 text-on-surface-variant text-[16px] pointer-events-none">
                keyboard_arrow_down
              </span>
            </div>
          </div>

          {/* Thana / Area */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-on-surface-variant">Thana / Area</label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-secondary text-[18px] pointer-events-none">
                near_me
              </span>
              <select
                value={area}
                onChange={(e) => onLocationChange({ division, district, area: e.target.value })}
                className="w-full pl-9 pr-8 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface font-label-md text-xs focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                style={{ backgroundImage: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
              >
                <option value="Dhanmondi">Dhanmondi</option>
                <option value="Gulshan / Banani">Gulshan / Banani</option>
                <option value="Uttara">Uttara</option>
                <option value="Mirpur">Mirpur</option>
                <option value="Mohakhali">Mohakhali</option>
                <option value="Mohammadpur">Mohammadpur</option>
                <option value="Badda">Badda</option>
                <option value="Motijheel">Motijheel</option>
                <option value="All Areas">All Areas / Thanas</option>
                {availableAreas.filter((a) => !['Dhanmondi', 'Mirpur', 'Uttara', 'Mohammadpur', 'Motijheel', 'Badda'].includes(a)).map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 text-on-surface-variant text-[16px] pointer-events-none">
                keyboard_arrow_down
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Fulfillment */}
      <div className="pt-4 border-t border-outline-variant/60 space-y-3">
        <h4 className="font-label-md text-xs uppercase tracking-wider text-on-surface-variant font-bold">
          Fulfillment
        </h4>
        <div className="space-y-2">
          <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-surface-container-low transition-colors">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={fulfillment === 'home'}
                onChange={() => onFulfillmentChange(fulfillment === 'home' ? 'all' : 'home')}
                className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 cursor-pointer"
              />
              <span className="text-xs font-medium text-on-surface">Home Sample Pickup</span>
            </div>
            {fulfillment === 'home' && (
              <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
          </label>

          <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-surface-container-low transition-colors">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={fulfillment === 'center'}
                onChange={() => onFulfillmentChange(fulfillment === 'center' ? 'all' : 'center')}
                className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 cursor-pointer"
              />
              <span className="text-xs font-medium text-on-surface">Center Visit Only</span>
            </div>
          </label>
        </div>
      </div>

      {/* Ownership Type */}
      <div className="pt-4 border-t border-outline-variant/60 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-label-md text-xs uppercase tracking-wider text-on-surface-variant font-bold">
            Ownership Type
          </h4>
          <button
            type="button"
            onClick={() => onOwnershipChange('all')}
            className="text-[11px] text-primary font-medium cursor-pointer hover:underline"
          >
            All
          </button>
        </div>

        <div className="space-y-2">
          {[
            { key: 'private', label: 'Private Diagnostic Center', count: ownershipCounts.private || 18 },
            { key: 'hospital_affiliated', label: 'Hospital Affiliated Lab', count: ownershipCounts.hospital_affiliated || 12 },
            { key: 'government', label: 'Govt. / Autonomous Facility', count: ownershipCounts.government || 5 },
            { key: 'ngo', label: 'NGO / Non-Profit Laboratory', count: ownershipCounts.ngo || 3 },
          ].map((item) => {
            const isChecked = ownership === item.key;
            return (
              <label
                key={item.key}
                className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-surface-container-low transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onOwnershipChange(isChecked ? 'all' : item.key)}
                    className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                  />
                  <span className="text-xs font-medium text-on-surface">{item.label}</span>
                </div>
                <span className="text-[11px] text-on-surface-variant font-medium">{item.count}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Apply / Close Filters Button on Mobile */}
      {onApplyFilters && (
        <button
          type="button"
          onClick={onApplyFilters}
          className="lg:hidden w-full py-2.5 bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs sm:text-sm rounded-lg transition-all shadow-xs flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">check</span>
          Apply Filters
        </button>
      )}
    </aside>
  );
}
