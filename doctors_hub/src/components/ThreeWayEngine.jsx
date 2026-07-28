import React from 'react';
import { Stethoscope, FlaskConical, Search, Filter, Sparkles, MapPin, ChevronRight } from 'lucide-react';
import { SPECIALTIES, PATHOLOGY_TESTS, LOCATIONS } from '../data/mockData';

export default function ThreeWayEngine({
  selectedSpecialty,
  setSelectedSpecialty,
  selectedTest,
  setSelectedTest,
  searchKeyword,
  setSearchKeyword,
  selectedLocation,
  setSelectedLocation,
  onSearchExecute,
  activeEngineTab,
  setActiveEngineTab
}) {
  return (
    <div className="relative pt-8 mt-2 z-30 max-w-7xl mx-auto px-4 sm:px-8">
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/80 border border-slate-200/80 p-5 sm:p-8 backdrop-blur-lg">
        
        {/* Engine Header Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-6 border-b border-slate-100 gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Smart Healthcare Search</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Find Doctors, Diagnostics & Hospitals
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md">
            Find specialist doctors, lab diagnostic tests, and hospital locations near you in real time.
          </p>
        </div>

        {/* THREE PARALLEL SELECTION COMPONENTS (Side-by-side on Desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COMPONENT 1: SEARCH YOUR DOCTOR */}
          <div className="bg-gradient-to-br from-slate-50 to-emerald-50/40 p-5 rounded-xl border border-slate-200/90 hover:border-emerald-300 transition-all shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Search Your Doctor
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Filter by Medical Specialty & Location
                  </p>
                </div>
              </div>

              {/* Specialty Dropdown */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Select Specialist Category:
                </label>
                <div className="relative">
                  <select
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="w-full bg-white text-slate-800 font-medium text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all appearance-none cursor-pointer shadow-xs"
                  >
                    <option value="">All Specialties (Show All Doctors)</option>
                    {SPECIALTIES.map((spec) => (
                      <option key={spec.id} value={spec.name}>
                        {spec.name} ({spec.description})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>
              </div>

              {/* Location Filter Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Select Location:</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedLocation || 'All Bangladesh'}
                    onChange={(e) => setSelectedLocation && setSelectedLocation(e.target.value)}
                    className="w-full bg-white text-slate-800 font-medium text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all appearance-none cursor-pointer shadow-xs"
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>
              </div>
            </div>

            {/* Search Button */}
            <div className="pt-2 border-t border-slate-200/60">
              <button
                onClick={() => {
                  setActiveEngineTab('doctor');
                  onSearchExecute('doctor');
                }}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search Doctor</span>
              </button>
            </div>
          </div>

          {/* COMPONENT 2: SEARCH DIAGNOSTICS */}
          <div className="bg-gradient-to-br from-slate-50 to-teal-50/40 p-5 rounded-xl border border-slate-200/90 hover:border-teal-300 transition-all shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Search Diagnostics
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Filter Diagnostic Profiles & Location
                  </p>
                </div>
              </div>

              {/* Lab Test Dropdown */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Select Lab Test / Profile:
                </label>
                <div className="relative">
                  <select
                    value={selectedTest}
                    onChange={(e) => setSelectedTest(e.target.value)}
                    className="w-full bg-white text-slate-800 font-medium text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all appearance-none cursor-pointer shadow-xs"
                  >
                    <option value="">All Pathology Tests & Packages</option>
                    {PATHOLOGY_TESTS.map((test) => (
                      <option key={test.id} value={test.name}>
                        {test.name} - ৳{test.price} ({test.discount})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>
              </div>

              {/* Location Filter Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  <span>Select Location:</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedLocation || 'All Bangladesh'}
                    onChange={(e) => setSelectedLocation && setSelectedLocation(e.target.value)}
                    className="w-full bg-white text-slate-800 font-medium text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all appearance-none cursor-pointer shadow-xs"
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>
              </div>
            </div>

            {/* Search Button */}
            <div className="pt-2 border-t border-slate-200/60">
              <button
                onClick={() => {
                  setActiveEngineTab('pathology');
                  onSearchExecute('pathology');
                }}
                className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search Diagnostics</span>
              </button>
            </div>
          </div>

          {/* COMPONENT 3: DIRECT TO DOCTOR SEARCH */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 p-5 rounded-xl border border-slate-200/90 hover:border-blue-300 transition-all shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Direct to Doctor Search
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Direct Search by Doctor Name, Hospital or Diagnostic Center
                  </p>
                </div>
              </div>

              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                doctor name/hospital or diagnostic center:
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Dr. Fazlul Haque, Ibn Sina, Dhanmondi..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onSearchExecute('keyword');
                    }
                  }}
                  className="w-full bg-white text-slate-800 font-medium text-xs border border-slate-300 rounded-xl pl-3.5 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-xs"
                />
                <Search className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60">
              <button
                onClick={() => onSearchExecute('keyword')}
                className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
