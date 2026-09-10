import React, { useMemo } from 'react';
import { DIVISIONS, DIVISION_DISTRICTS, DISTRICT_THANAS } from '../../../data/constants';

const DAYS = ['All Days', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'];

export default function DoctorFilterSidebar({
  division,
  district,
  area,
  selectedDay,
  gender,
  totalCount = 0,
  onDivisionChange,
  onDistrictChange,
  onAreaChange,
  onClearLocation,
  onDayChange,
  onGenderChange,
  onResetAll,
  onApplyFilters
}) {
  const districtList = useMemo(() => {
    if (!division || division === 'All Bangladesh') {
      return Object.values(DIVISION_DISTRICTS).flat();
    }
    return DIVISION_DISTRICTS[division] || [];
  }, [division]);

  const areaList = useMemo(() => {
    if (!district || district === 'All Districts') {
      return [];
    }
    return DISTRICT_THANAS[district] || [];
  }, [district]);

  const handleClearLocation = () => {
    if (onClearLocation) {
      onClearLocation();
    } else {
      onDivisionChange?.('All Bangladesh');
      onDistrictChange?.('All Districts');
      onAreaChange?.('All Areas');
    }
  };

  return (
    <aside className="w-full lg:w-80 shrink-0 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-xs p-5 space-y-6 lg:sticky lg:top-24">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
          <h3 className="text-base font-bold text-on-surface">Filters</h3>
        </div>
        <button
          onClick={onResetAll}
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer transition-colors"
          type="button"
        >
          <span className="material-symbols-outlined text-[15px]">restart_alt</span>
          Reset All
        </button>
      </div>

      {/* LOCATION Filter Section */}
      <div className="space-y-3 pb-4 border-b border-outline-variant/60">
        <div className="flex items-center justify-between">
          <h4 className="font-label-md text-xs uppercase tracking-wider text-on-surface-variant font-bold">
            Location
          </h4>
          <button
            type="button"
            onClick={handleClearLocation}
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
                value={division || 'All Bangladesh'}
                onChange={(e) => onDivisionChange(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface font-label-md text-xs focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                style={{ backgroundImage: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
              >
                <option value="All Bangladesh">All Bangladesh</option>
                {DIVISIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
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
                value={district || 'All Districts'}
                onChange={(e) => onDistrictChange(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface font-label-md text-xs focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                style={{ backgroundImage: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
              >
                <option value="All Districts">All Districts</option>
                {districtList.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
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
                value={area || 'All Areas'}
                onChange={(e) => onAreaChange(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface font-label-md text-xs focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                style={{ backgroundImage: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
              >
                <option value="All Areas">All Areas</option>
                {areaList.map((a) => (
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

      {/* VISITING DAYS Section */}
      <div className="space-y-3 pb-4 border-b border-outline-variant/60">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary">calendar_today</span>
            Visiting Days
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 pt-1 text-xs">
          {DAYS.map((d) => {
            const isActive =
              (d === 'All Days' && (!selectedDay || selectedDay === 'All' || selectedDay === 'All Days')) ||
              (d !== 'All Days' && selectedDay === d);

            return (
              <button
                key={d}
                type="button"
                onClick={() => onDayChange(d === 'All Days' ? 'All' : d)}
                className={`py-2 px-1 rounded-lg font-semibold text-center text-xs transition-all active:scale-[0.98] cursor-pointer ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-low hover:bg-surface-container border border-outline-variant/60 text-on-surface'
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* DOCTOR GENDER Section */}
      <div className="space-y-2.5 pb-2">
        <label className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-primary">person</span>
          Doctor Gender
        </label>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-surface-container-low rounded-lg border border-outline-variant text-xs text-center">
          {['All', 'Male', 'Female'].map((g) => {
            const isGenderActive =
              (g === 'All' && (!gender || gender === 'All')) ||
              (g !== 'All' && String(gender).toLowerCase() === g.toLowerCase());
            return (
              <button
                key={g}
                type="button"
                onClick={() => onGenderChange(g)}
                className={`py-1.5 rounded transition-colors font-medium cursor-pointer ${
                  isGenderActive
                    ? 'bg-surface-container-lowest font-semibold text-primary shadow-xs'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* Apply Filter Action */}
      <button
        type="button"
        onClick={onApplyFilters}
        className="w-full py-2.5 bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs sm:text-sm rounded-lg transition-all shadow-xs flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
      >
        <span className="material-symbols-outlined text-[16px]">check</span>
        Apply Filters ({totalCount})
      </button>
    </aside>
  );
}
