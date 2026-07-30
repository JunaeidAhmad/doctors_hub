import React, { useState, useMemo, useEffect } from 'react';
import { 
  FlaskConical, Clock, ArrowLeft, Filter, Search, Building2, ShieldCheck, 
  MapPin, CheckCircle, Home, FileText, ChevronRight, Tag
} from 'lucide-react';
import { 
  TESTS, DIAGNOSTIC_CENTER_TESTS, DIAGNOSTIC_CENTERS, LOCATIONS, 
  CITY_THANAS, TEST_CATEGORIES, DIAGNOSTIC_CENTER_CATEGORIES 
} from '../data/mockData';
import { api } from '../services/api';

export default function PathologySearchPage({
  initialTest = '',
  onBookLabTest,
  onNavigateHome
}) {
  const [viewMode, setViewMode] = useState('centers'); // 'centers' | 'tests'
  const [diagnosticCenters, setDiagnosticCenters] = useState(DIAGNOSTIC_CENTERS);
  const [centerCategories, setCenterCategories] = useState(DIAGNOSTIC_CENTER_CATEGORIES);
  const [testCategories, setTestCategories] = useState(TEST_CATEGORIES);
  const [tests, setTests] = useState(TESTS);
  const [centerTests, setCenterTests] = useState(DIAGNOSTIC_CENTER_TESTS);

  // Filters
  const [selectedCenterCategory, setSelectedCenterCategory] = useState('all');
  const [selectedTestCategory, setSelectedTestCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('All Bangladesh');
  const [selectedArea, setSelectedArea] = useState('All Areas');
  const [searchKeyword, setSearchKeyword] = useState(initialTest);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      api.getDiagnosticCenters().catch(() => []),
      api.getDiagnosticCenterCategories().catch(() => []),
      api.getDiagnosticCenterTests().catch(() => []),
      api.getTestCategories().catch(() => []),
      api.getTests().catch(() => [])
    ]).then(([dcs, dccats, dctests, tcats, tlist]) => {
      if (isMounted) {
        if (dcs && dcs.length > 0) setDiagnosticCenters(dcs);
        if (dccats && dccats.length > 0) setCenterCategories(dccats);
        if (dctests && dctests.length > 0) setCenterTests(dctests);
        if (tcats && tcats.length > 0) setTestCategories(tcats);
        if (tlist && tlist.length > 0) setTests(tlist);
      }
    });
    return () => { isMounted = false; };
  }, []);

  // Handle location change
  const handleLocationChange = (loc) => {
    setSelectedLocation(loc);
    setSelectedArea('All Areas');
  };

  // Group Diagnostic Centers and their offered tests
  const filteredDiagnosticCenters = useMemo(() => {
    return diagnosticCenters.filter(center => {
      // Location filter
      if (selectedLocation && selectedLocation !== 'All Bangladesh') {
        const cDist = (center.district || center.city || '').toLowerCase();
        if (cDist && !cDist.includes(selectedLocation.toLowerCase())) {
          return false;
        }
      }

      // Area filter
      if (selectedLocation !== 'All Bangladesh' && selectedArea && selectedArea !== 'All Areas') {
        const locText = `${center.address || ''} ${center.name || ''}`.toLowerCase();
        if (!locText.includes(selectedArea.toLowerCase())) {
          return false;
        }
      }

      // Center Category filter
      if (selectedCenterCategory && selectedCenterCategory !== 'all') {
        const cCatLow = selectedCenterCategory.toString().toLowerCase();
        const cats = center.categories || [];
        const matchesCat = cats.some(c => 
          (c.id && c.id.toString().toLowerCase() === cCatLow) || 
          (c.slug && c.slug.toLowerCase() === cCatLow) ||
          (c.name && c.name.toLowerCase().includes(cCatLow))
        );
        if (!matchesCat) return false;
      }

      // Keyword search
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const matchName = center.name.toLowerCase().includes(kw);
        const matchAddr = (center.address || '').toLowerCase().includes(kw);
        const offered = center.offered_tests || centerTests.filter(ct => ct.center_id === center.id || ct.center === center.id);
        const matchTest = offered.some(t => {
          const tName = t.test_details?.name || t.test_name || '';
          return tName.toLowerCase().includes(kw);
        });

        if (!matchName && !matchAddr && !matchTest) return false;
      }

      return true;
    });
  }, [diagnosticCenters, selectedLocation, selectedArea, selectedCenterCategory, searchKeyword, centerTests]);

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      
      {/* HERO HEADER */}
      <div className="bg-slate-900 text-white py-12 px-4 sm:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3 border border-emerald-500/30">
                <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
                <span>Categorized Diagnostic Centers & Test Profiles</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                Diagnostic Centers & Tests
              </h1>
              <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-2xl">
                Browse verified diagnostic centers by category, explore complete test menus, compare pricing, and book doorstep home blood sample collection.
              </p>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700 text-xs flex items-center gap-3 shrink-0">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
              <div>
                <div className="font-extrabold text-white">{filteredDiagnosticCenters.length} Diagnostic Centers</div>
                <div className="text-slate-400">Categorized Labs Nationwide</div>
              </div>
            </div>
          </div>

          {/* VIEW MODE & CATEGORY STRIP */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
              <button
                onClick={() => setViewMode('centers')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'centers'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Categorized Centers</span>
              </button>
              <button
                onClick={() => setViewMode('tests')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'tests'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FlaskConical className="w-4 h-4" />
                <span>Pathology Tests</span>
              </button>
            </div>
          </div>

          {/* SEARCH & FILTER CONTROLS BAR */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-700/60">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-400" />
                <span>Diagnostic Center & Test Search Filters</span>
              </div>
              {(selectedCenterCategory !== 'all' || selectedTestCategory !== 'all' || selectedLocation !== 'All Bangladesh' || selectedArea !== 'All Areas' || searchKeyword) && (
                <button
                  onClick={() => {
                    setSelectedCenterCategory('all');
                    setSelectedTestCategory('all');
                    setSelectedLocation('All Bangladesh');
                    setSelectedArea('All Areas');
                    setSearchKeyword('');
                  }}
                  className="text-emerald-400 hover:underline font-bold"
                >
                  Reset All Filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* Keyword Search */}
              <div className="relative">
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Search Keyword</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search diagnostic center or test..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 font-medium"
                  />
                </div>
              </div>

              {/* City Location */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">City / District</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-bold"
                >
                  {LOCATIONS.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Area / Thana Filter */}
              {selectedLocation !== 'All Bangladesh' ? (
                <div>
                  <label className="block text-[11px] font-bold text-emerald-400 mb-1">Area / Thana ({selectedLocation})</label>
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="w-full bg-slate-900 border border-emerald-500/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-bold"
                  >
                    <option value="All Areas">All Areas in {selectedLocation}</option>
                    {(CITY_THANAS[selectedLocation] || []).map(th => (
                      <option key={th} value={th}>{th}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="hidden lg:block"></div>
              )}

              {/* Center Category or Test Category Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  {viewMode === 'centers' ? 'Center Category' : 'Test Category'}
                </label>
                {viewMode === 'centers' ? (
                  <select
                    value={selectedCenterCategory}
                    onChange={(e) => setSelectedCenterCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-bold"
                  >
                    <option value="all">All Center Categories</option>
                    {centerCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={selectedTestCategory}
                    onChange={(e) => setSelectedTestCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-bold"
                  >
                    <option value="all">All Test Categories</option>
                    {testCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* MAIN RESULTS CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-10">
        
        {viewMode === 'centers' ? (
          /* CATEGORIZED DIAGNOSTIC CENTERS AND THEIR TESTS */
          <div className="space-y-8">
            {filteredDiagnosticCenters.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 max-w-lg mx-auto">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800">No Diagnostic Centers Found</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Try adjusting your city, area, or center category filter.
                </p>
              </div>
            ) : (
              filteredDiagnosticCenters.map((center) => {
                const offered = center.offered_tests && center.offered_tests.length > 0 
                  ? center.offered_tests 
                  : centerTests.filter(ct => ct.center_id === center.id || ct.center === center.id);

                return (
                  <div key={center.id} className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-md hover:shadow-lg transition-all space-y-5">
                    
                    {/* CENTER HEADER */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                          <Building2 className="w-7 h-7 text-emerald-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded uppercase tracking-wider">
                              {center.district || "Diagnostic Center"}
                            </span>
                            {(center.categories || []).map(cat => (
                              <span key={cat.id || cat.name} className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {cat.name}
                              </span>
                            ))}
                          </div>
                          <h2 className="text-xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                            <span>{center.name}</span>
                            {center.is_verified && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
                          </h2>
                          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{center.address}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{center.open_timing || "08:00 AM - 10:00 PM"}</span>
                        </span>
                      </div>
                    </div>

                    {/* OFFERED TESTS SECTION */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <FlaskConical className="w-4 h-4 text-emerald-600" />
                          <span>Available Tests & Pricing at {center.name} ({offered.length}):</span>
                        </span>
                      </h4>

                      {offered.length === 0 ? (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-500 italic">
                          No test packages listed for this center yet.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {offered.map((offering) => {
                            const testName = offering.test_details?.name || offering.test_name || "Lab Test Profile";
                            const testDesc = offering.test_details?.description || "Pathology & Clinical Testing";
                            const isHome = offering.home_sample_collection;

                            return (
                              <div key={offering.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 flex flex-col justify-between space-y-3 hover:bg-emerald-50/40 hover:border-emerald-300 transition-colors">
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-extrabold text-slate-700 uppercase">
                                      {offering.test_details?.category_name || "Pathology"}
                                    </span>
                                    {isHome && (
                                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                                        Home Sample Available
                                      </span>
                                    )}
                                  </div>

                                  <div className="font-extrabold text-slate-900 text-xs mt-1">{testName}</div>
                                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{testDesc}</p>
                                  
                                  <div className="text-[11px] text-slate-500 mt-2">
                                    Report Time: <strong className="text-slate-700">{offering.report_time || "Same Day"}</strong>
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
                                  <div>
                                    <div className="text-sm font-black text-emerald-700">৳{offering.price}</div>
                                    {offering.original_price && (
                                      <div className="text-[10px] text-slate-400 line-through">৳{offering.original_price}</div>
                                    )}
                                  </div>

                                  <button
                                    onClick={() => onBookLabTest && onBookLabTest({
                                      test: offering.test_details || { name: testName },
                                      branchTest: offering,
                                      branch: center
                                    })}
                                    className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-colors shadow-xs"
                                  >
                                    Book Test
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* PATHOLOGY TESTS VIEW */
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 mb-4">Pathology Test Directory ({tests.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tests.map((test) => (
                <div key={test.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded uppercase">
                      {test.category_name || "Pathology Test"}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-2">{test.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{test.description}</p>

                    {test.fasting_required && (
                      <span className="inline-block text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 mt-2">
                        Fasting Required
                      </span>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-semibold">Available across partner labs</span>
                    <button
                      onClick={() => onBookLabTest && onBookLabTest({ test })}
                      className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors"
                    >
                      Book Test
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
