import React from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
import { DIVISIONS, DIVISION_DISTRICTS, DISTRICT_THANAS, getDistrictsForDivision, getThanasForDistrict } from '../data/constants';

/**
 * CascadingLocationFilter
 * 1. Division: "All Bangladesh" + 8 Divisions
 * 2. District: Opens when a Division is selected (All Districts in {Division} + Districts)
 * 3. Area / Thana: Opens when a District is selected (All Areas in {District} + Thanas/Upazilas)
 */
export default function CascadingLocationFilter({
  division = 'All Bangladesh',
  district = 'All Districts',
  area = 'All Areas',
  onChange,
  theme = 'dark', // 'dark' | 'light'
  accent = 'emerald', // 'emerald' | 'teal' | 'cyan'
  layout = 'stacked', // 'stacked' | 'inline' | 'grid'
  showLabels = true,
  className = ''
}) {
  const currentDistricts = division && division !== 'All Bangladesh' 
    ? getDistrictsForDivision(division) 
    : [];

  const currentThanas = district && district !== 'All Districts' 
    ? getThanasForDistrict(district) 
    : [];

  const isDark = theme === 'dark';

  // Accent color utilities
  const accentBorder = {
    emerald: isDark ? 'focus:border-emerald-500 border-slate-700' : 'focus:border-emerald-500 border-slate-300',
    teal: isDark ? 'focus:border-teal-500 border-slate-700' : 'focus:border-teal-500 border-slate-300',
    cyan: isDark ? 'focus:border-cyan-500 border-slate-700' : 'focus:border-cyan-500 border-slate-300'
  }[accent] || (isDark ? 'focus:border-emerald-500 border-slate-700' : 'focus:border-emerald-500 border-slate-300');

  const accentLabel = {
    emerald: 'text-emerald-400',
    teal: 'text-teal-400',
    cyan: 'text-cyan-400'
  }[accent] || 'text-emerald-400';

  const selectBg = isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-800';

  const handleDivisionChange = (newDiv) => {
    onChange({
      division: newDiv,
      district: 'All Districts',
      area: 'All Areas'
    });
  };

  const handleDistrictChange = (newDist) => {
    onChange({
      division,
      district: newDist,
      area: 'All Areas'
    });
  };

  const handleAreaChange = (newArea) => {
    onChange({
      division,
      district,
      area: newArea
    });
  };

  const containerClasses = {
    stacked: 'space-y-3',
    inline: 'flex flex-wrap sm:flex-nowrap items-center gap-2',
    grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'
  }[layout] || 'space-y-3';

  return (
    <div className={`${containerClasses} ${className}`}>
      {/* 1. PRIMARY LEVEL: DIVISION / ALL BANGLADESH */}
      <div className={layout === 'inline' ? 'flex-1 min-w-[140px]' : ''}>
        {showLabels && (
          <label className={`block text-[11px] font-bold mb-1 flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <MapPin className={`w-3.5 h-3.5 ${accentLabel}`} />
            <span>Division / Location</span>
          </label>
        )}
        <div className="relative">
          <select
            value={division || 'All Bangladesh'}
            onChange={(e) => handleDivisionChange(e.target.value)}
            className={`w-full ${selectBg} text-xs font-semibold border ${accentBorder} rounded-xl px-3 py-2.5 focus:outline-none transition-all appearance-none cursor-pointer shadow-xs`}
          >
            <option value="All Bangladesh">All Bangladesh</option>
            {DIVISIONS.map((div) => (
              <option key={div} value={div}>
                {div} Division
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
            <ChevronRight className="w-4 h-4 rotate-90" />
          </div>
        </div>
      </div>

      {/* 2. SECONDARY LEVEL: DISTRICT (Opens only when a specific Division is selected) */}
      {division && division !== 'All Bangladesh' && (
        <div className={`transition-all duration-300 animate-in fade-in slide-in-from-top-1 ${layout === 'inline' ? 'flex-1 min-w-[140px]' : ''}`}>
          {showLabels && (
            <label className={`block text-[11px] font-bold mb-1 ${accentLabel}`}>
              District in {division}
            </label>
          )}
          <div className="relative">
            <select
              value={district || 'All Districts'}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className={`w-full ${selectBg} text-xs font-semibold border ${accentBorder} rounded-xl px-3 py-2.5 focus:outline-none transition-all appearance-none cursor-pointer shadow-xs`}
            >
              <option value="All Districts">All Districts in {division}</option>
              {currentDistricts.map((dist) => (
                <option key={dist} value={dist}>
                  {dist}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <ChevronRight className="w-4 h-4 rotate-90" />
            </div>
          </div>
        </div>
      )}

      {/* 3. TERTIARY LEVEL: AREA / THANA (Opens only when a specific District is selected) */}
      {division && division !== 'All Bangladesh' && district && district !== 'All Districts' && (
        <div className={`transition-all duration-300 animate-in fade-in slide-in-from-top-1 ${layout === 'inline' ? 'flex-1 min-w-[140px]' : ''}`}>
          {showLabels && (
            <label className={`block text-[11px] font-bold mb-1 ${accentLabel}`}>
              Area / Thana in {district}
            </label>
          )}
          <div className="relative">
            <select
              value={area || 'All Areas'}
              onChange={(e) => handleAreaChange(e.target.value)}
              className={`w-full ${selectBg} text-xs font-semibold border ${accentBorder} rounded-xl px-3 py-2.5 focus:outline-none transition-all appearance-none cursor-pointer shadow-xs`}
            >
              <option value="All Areas">All Areas in {district}</option>
              {currentThanas.map((th) => (
                <option key={th} value={th}>
                  {th}
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
