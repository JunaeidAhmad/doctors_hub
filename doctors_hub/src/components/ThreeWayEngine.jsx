import React, { useState } from 'react';
import { Stethoscope, FlaskConical, Search, Filter, Sparkles, MapPin, ChevronRight, Building2 } from 'lucide-react';
import { SPECIALTIES, TEST_CATEGORIES, HOSPITAL_SPECIALTIES, LOCATIONS } from '../data/mockData';

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
  const [selectedHospitalCategory, setSelectedHospitalCategory] = useState('');

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
                    Find Your Doctor
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
                        {spec.name} {/*({spec.description})*/}
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
                <span>Search</span>
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

              {/* Lab Test Category Dropdown */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Select Lab Test Category:
                </label>
                <div className="relative">
                  <select
                    value={selectedTest}
                    onChange={(e) => setSelectedTest(e.target.value)}
                    className="w-full bg-white text-slate-800 font-medium text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all appearance-none cursor-pointer shadow-xs"
                  >
                    <option value="">All Test Categories</option>
                    {TEST_CATEGORIES.filter((cat) => cat && cat.id !== 'all').map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} {/*({cat.description})*/}
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
                  setActiveEngineTab('diagnostics');
                  onSearchExecute('diagnostics');
                }}
                className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </button>
            </div>
          </div>

          {/* COMPONENT 3: SEARCH HOSPITAL */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 p-5 rounded-xl border border-slate-200/90 hover:border-blue-300 transition-all shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Search Hospital
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Filter by Hospital Category & Location
                  </p>
                </div>
              </div>

              {/* Hospital Category Dropdown */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Select Hospital Category:
                </label>
                <div className="relative">
                  <select
                    value={selectedHospitalCategory}
                    onChange={(e) => setSelectedHospitalCategory(e.target.value)}
                    className="w-full bg-white text-slate-800 font-medium text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none cursor-pointer shadow-xs"
                  >
                    <option value="">All Hospital Categories</option>
                    {HOSPITAL_SPECIALTIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} {/*({cat.description})*/}
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
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Select Location:</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedLocation || 'All Bangladesh'}
                    onChange={(e) => setSelectedLocation && setSelectedLocation(e.target.value)}
                    className="w-full bg-white text-slate-800 font-medium text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none cursor-pointer shadow-xs"
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
                  setActiveEngineTab('hospital');
                  onSearchExecute('hospital', selectedHospitalCategory);
                }}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
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
