import React from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
import { useDivisions, useDistricts, useThanas } from '../hooks/useGeo';

/**
 * CascadingLocationFilter
 * Uses ID-based geography via useGeo hooks.
 * Emits { divisionId, districtId, thanaId } as numbers or null.
 */
export default function CascadingLocationFilter({
  divisionId = null,
  districtId = null,
  thanaId = null,
  onChange,
  theme = 'dark', // 'dark' | 'light'
  accent = 'emerald', // 'emerald' | 'teal' | 'cyan'
  layout = 'stacked', // 'stacked' | 'inline' | 'grid'
  showLabels = true,
  className = '',
  divisionOnly = false,
}) {
  const { items: divisions, isLoading: loadingDivisions } = useDivisions();
  const { items: districts, isLoading: loadingDistricts } = useDistricts(divisionId);
  const { items: thanas, isLoading: loadingThanas } = useThanas(districtId);

  const isDark = theme === 'dark';

  const accentBorder = {
    emerald: isDark ? 'focus:border-emerald-500 border-slate-700' : 'focus:border-emerald-500 border-slate-300',
    teal: isDark ? 'focus:border-teal-500 border-slate-700' : 'focus:border-teal-500 border-slate-300',
    cyan: isDark ? 'focus:border-cyan-500 border-slate-700' : 'focus:border-cyan-500 border-slate-300',
  }[accent] || (isDark ? 'focus:border-emerald-500 border-slate-700' : 'focus:border-emerald-500 border-slate-300');

  const accentLabel = {
    emerald: 'text-emerald-400',
    teal: 'text-teal-400',
    cyan: 'text-cyan-400',
  }[accent] || 'text-emerald-400';

  const selectBg = isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-800';

  const handleDivisionChange = (newVal) => {
    const divId = newVal ? Number(newVal) : null;
    onChange({
      divisionId: divId,
      districtId: null,
      thanaId: null,
    });
  };

  const handleDistrictChange = (newVal) => {
    const distId = newVal ? Number(newVal) : null;
    onChange({
      divisionId,
      districtId: distId,
      thanaId: null,
    });
  };

  const handleThanaChange = (newVal) => {
    const tId = newVal ? Number(newVal) : null;
    onChange({
      divisionId,
      districtId,
      thanaId: tId,
    });
  };

  const containerClasses = {
    stacked: 'space-y-3',
    inline: 'contents',
    grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3',
  }[layout] || 'space-y-3';

  return (
    <div className={`${containerClasses} ${className}`}>
      {/* 1. PRIMARY LEVEL: DIVISION */}
      <div className={layout === 'inline' ? 'flex-1 min-w-[160px]' : ''}>
        {showLabels && (
          <label className={`block text-[11px] font-bold mb-1 flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-700'} whitespace-nowrap`}>
            <MapPin className={`w-3.5 h-3.5 ${accentLabel} shrink-0`} />
            <span>Division</span>
          </label>
        )}
        <div className="relative">
          <select
            value={divisionId ?? ''}
            onChange={(e) => handleDivisionChange(e.target.value)}
            disabled={loadingDivisions}
            className={`w-full ${selectBg} text-xs font-semibold border ${accentBorder} rounded-xl pl-3 pr-8 py-2.5 focus:outline-none transition-all appearance-none cursor-pointer shadow-xs disabled:opacity-60`}
          >
            <option value="">All Divisions</option>
            {divisions.map((div) => (
              <option key={div.id} value={div.id}>
                {div.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
            <ChevronRight className="w-4 h-4 rotate-90" />
          </div>
        </div>
      </div>

      {/* 2. SECONDARY LEVEL: DISTRICT */}
      {!divisionOnly && divisionId && (
        <div className={`transition-all duration-300 animate-in fade-in slide-in-from-top-1 ${layout === 'inline' ? 'flex-1 min-w-[160px]' : ''}`}>
          {showLabels && (
            <label className={`block text-[11px] font-bold mb-1 flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'} whitespace-nowrap`}>
              <MapPin className={`w-3.5 h-3.5 ${accentLabel} shrink-0`} />
              <span>District</span>
            </label>
          )}
          <div className="relative">
            <select
              value={districtId ?? ''}
              onChange={(e) => handleDistrictChange(e.target.value)}
              disabled={loadingDistricts}
              className={`w-full ${selectBg} text-xs font-semibold border ${accentBorder} rounded-xl pl-3 pr-8 py-2.5 focus:outline-none transition-all appearance-none cursor-pointer shadow-xs disabled:opacity-60`}
            >
              <option value="">Select District</option>
              {districts.map((dist) => (
                <option key={dist.id} value={dist.id}>
                  {dist.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <ChevronRight className="w-4 h-4 rotate-90" />
            </div>
          </div>
        </div>
      )}

      {/* 3. TERTIARY LEVEL: THANA / AREA */}
      {!divisionOnly && divisionId && districtId && (
        <div className={`transition-all duration-300 animate-in fade-in slide-in-from-top-1 ${layout === 'inline' ? 'flex-1 min-w-[160px]' : ''}`}>
          {showLabels && (
            <label className={`block text-[11px] font-bold mb-1 flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'} whitespace-nowrap`}>
              <MapPin className={`w-3.5 h-3.5 ${accentLabel} shrink-0`} />
              <span>Area / Thana</span>
            </label>
          )}
          <div className="relative">
            <select
              value={thanaId ?? ''}
              onChange={(e) => handleThanaChange(e.target.value)}
              disabled={loadingThanas}
              className={`w-full ${selectBg} text-xs font-semibold border ${accentBorder} rounded-xl pl-3 pr-8 py-2.5 focus:outline-none transition-all appearance-none cursor-pointer shadow-xs disabled:opacity-60`}
            >
              <option value="">Select Thana / Area</option>
              {thanas.map((th) => (
                <option key={th.id} value={th.id}>
                  {th.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <ChevronRight className="w-4 h-4 rotate-90" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
