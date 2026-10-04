import React, { useState, useEffect, useMemo } from 'react';
import { Stethoscope, FlaskConical, Search, Filter, Sparkles, MapPin, ChevronRight, Building2 } from 'lucide-react';
import { api, ensureArray } from '../../../services/api';
import CascadingLocationFilter from '../../../components/CascadingLocationFilter';



export default function ThreeWayEngine({
  selectedSpecialty,
  setSelectedSpecialty,
  selectedTest,
  setSelectedTest,
  selectedHospitalCategory: propHospitalCat,
  setSelectedHospitalCategory: propSetHospitalCat,
  searchKeyword,
  doctorKeyword,
  setDoctorKeyword,
  selectedLocation,
  setSelectedLocation,
  onExecuteSearch,
  onSearchExecute,
  activeEngineTab,
  setActiveEngineTab
}) {
  const [specialties, setSpecialties] = useState([]);
  const [specialtyGroups, setSpecialtyGroups] = useState([]);
  const [testCategories, setTestCategories] = useState([]);
  const [hospitalCategories, setHospitalCategories] = useState([]);

  useEffect(() => {
    let isMounted = true;
    api.getSearchMetadata()
      .then((meta) => {
        if (isMounted && meta) {
          if (meta.specialty_groups) setSpecialtyGroups(ensureArray(meta.specialty_groups));
          if (meta.specialties_az) setSpecialties(ensureArray(meta.specialties_az));
          else if (meta.specialties) setSpecialties(ensureArray(meta.specialties));
          if (meta.test_categories) setTestCategories(ensureArray(meta.test_categories));
          if (meta.hospital_categories) setHospitalCategories(ensureArray(meta.hospital_categories));
        }
      })
      .catch(() => {
        // Fallback to legacy endpoints if search-metadata fails
        Promise.all([
          api.getSpecialties().catch(() => null),
          api.getTestCategories().catch(() => null),
          api.getHospitalCategories().catch(() => null)
        ]).then(([specData, testCatData, hospCatData]) => {
          if (isMounted) {
            if (specData) setSpecialties(ensureArray(specData));
            if (testCatData) setTestCategories(ensureArray(testCatData));
            if (hospCatData) setHospitalCategories(ensureArray(hospCatData));
          }
        });
      });
    return () => { isMounted = false; };
  }, []);

  const [internalHospitalCat, setInternalHospitalCat] = useState('');
  const selectedHospitalCategory = propHospitalCat !== undefined ? propHospitalCat : internalHospitalCat;
  const setSelectedHospitalCategory = propSetHospitalCat || setInternalHospitalCat;
  
  // Location states per search engine
  const [doctorLocState, setDoctorLocState] = useState({
    divisionId: null,
    districtId: null,
    thanaId: null
  });

  const [diagLocState, setDiagLocState] = useState({
    divisionId: null,
    districtId: null,
    thanaId: null
  });

  const [hospLocState, setHospLocState] = useState({
    divisionId: null,
    districtId: null,
    thanaId: null
  });

  // Normalize specialty value to match option values whether slug or name was passed
  const currentSpecialtyValue = useMemo(() => {
    if (!selectedSpecialty) return '';
    for (const grp of specialtyGroups) {
      const gSlug = grp.slug || grp.name;
      if (selectedSpecialty === gSlug || selectedSpecialty === grp.name || selectedSpecialty === grp.slug) {
        return gSlug;
      }
      for (const child of (grp.children || [])) {
        const cSlug = child.slug || child.name;
        if (selectedSpecialty === cSlug || selectedSpecialty === child.name || selectedSpecialty === child.slug) {
          return cSlug;
        }
      }
    }
    return selectedSpecialty;
  }, [selectedSpecialty, specialtyGroups]);

  const handleSearch = (mode, param, locState) => {
    if (typeof setActiveEngineTab === 'function') {
      setActiveEngineTab(mode);
    }
    const searchFn = onExecuteSearch || onSearchExecute;
    if (typeof searchFn === 'function') {
      searchFn(mode, param, locState);
    }
  };

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
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
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
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Specialization:
                </label>
                <div className="relative">
                  <select
                    value={currentSpecialtyValue}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="w-full bg-white text-slate-800 font-medium text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all appearance-none cursor-pointer shadow-xs truncate"
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
                              className="font-bold text-slate-900 bg-slate-50"
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
                                  className="text-slate-600"
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
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>
              </div>

              {/* Cascading Location Filter (Division -> District -> Thana) */}
              <CascadingLocationFilter
                divisionId={doctorLocState.divisionId}
                districtId={doctorLocState.districtId}
                thanaId={doctorLocState.thanaId}
                onChange={setDoctorLocState}
                theme="light"
                accent="emerald"
                layout="stacked"
                showLabels={true}
                divisionOnly={true}
              />
            </div>

            {/* Search Button */}
            <div className="pt-2 border-t border-slate-200/60">
              <button
                type="button"
                onClick={() => handleSearch('doctor', selectedSpecialty, doctorLocState)}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search Doctors</span>
              </button>
            </div>
          </div>

          {/* COMPONENT 2: SEARCH DIAGNOSTICS */}
          <div className="bg-gradient-to-br from-slate-50 to-teal-50/40 p-5 rounded-xl border border-slate-200/90 hover:border-teal-300 transition-all shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Search Diagnostics
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Filter by Lab Test & Location
                  </p>
                </div>
              </div>

              {/* Lab Test Category Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Types:
                </label>
                <div className="relative">
                  <select
                    value={selectedTest}
                    onChange={(e) => setSelectedTest(e.target.value)}
                    className="w-full bg-white text-slate-800 font-medium text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all appearance-none cursor-pointer shadow-xs"
                  >
                    <option value="">All Test Categories</option>

                    {testCategories.filter((cat) => cat && cat.id !== 'all').map((cat) => (
                      <option key={cat.slug || cat.id} value={cat.slug || cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>
              </div>

              {/* Cascading Location Filter (Division -> District -> Thana) */}
              <CascadingLocationFilter
                divisionId={diagLocState.divisionId}
                districtId={diagLocState.districtId}
                thanaId={diagLocState.thanaId}
                onChange={setDiagLocState}
                theme="light"
                accent="teal"
                layout="stacked"
                showLabels={true}
                divisionOnly={true}
              />
            </div>

            {/* Search Button */}
            <div className="pt-2 border-t border-slate-200/60">
              <button
                type="button"
                onClick={() => handleSearch('diagnostics', selectedTest, diagLocState)}
                className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search Diagnostics</span>
              </button>
            </div>
          </div>

          {/* COMPONENT 3: SEARCH HOSPITAL */}
          <div className="bg-gradient-to-br from-slate-50 to-cyan-50/40 p-5 rounded-xl border border-slate-200/90 hover:border-cyan-300 transition-all shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
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
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Category:
                </label>
                <div className="relative">
                  <select
                    value={selectedHospitalCategory}
                    onChange={(e) => setSelectedHospitalCategory(e.target.value)}
                    className="w-full bg-white text-slate-800 font-medium text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all appearance-none cursor-pointer shadow-xs"
                  >
                    <option value="">All Hospital Categories</option>
                    {hospitalCategories.filter((cat) => cat && cat.id !== 'all').map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>
              </div>

              {/* Cascading Location Filter (Division -> District -> Thana) */}
              <CascadingLocationFilter
                divisionId={hospLocState.divisionId}
                districtId={hospLocState.districtId}
                thanaId={hospLocState.thanaId}
                onChange={setHospLocState}
                theme="light"
                accent="cyan"
                layout="stacked"
                showLabels={true}
                divisionOnly={true}
              />
            </div>

            {/* Search Button */}
            <div className="pt-2 border-t border-slate-200/60">
              <button
                type="button"
                onClick={() => handleSearch('hospital', selectedHospitalCategory, hospLocState)}
                className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search Hospitals</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

