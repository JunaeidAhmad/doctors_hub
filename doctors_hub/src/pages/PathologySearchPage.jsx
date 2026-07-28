import React, { useState, useMemo, useEffect } from 'react';
import { FlaskConical, Home, Clock, FileText, ArrowLeft, Percent, Filter, ArrowRight, X, ShieldCheck, Building2, Search, Sparkles } from 'lucide-react';
import { PATHOLOGY_TESTS, BRANCH_TESTS, LOCATIONS, CITY_THANAS, PATHOLOGY_CATEGORIES } from '../data/mockData';
import { api } from '../services/api';

export default function PathologySearchPage({
  initialTest = '',
  onBookLabTest,
  onNavigateHome
}) {
  const [testCategories, setTestCategories] = useState(PATHOLOGY_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState(initialTest);
  const [selectedLocation, setSelectedLocation] = useState('All Bangladesh');
  const [selectedArea, setSelectedArea] = useState('All Areas');
  const [branchTests, setBranchTests] = useState(BRANCH_TESTS);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      api.getBranchTests().catch(() => []),
      api.getTestCategories().catch(() => [])
    ]).then(([bTests, cats]) => {
      if (isMounted) {
        if (bTests && bTests.length > 0) setBranchTests(bTests);
        if (cats && cats.length > 0) setTestCategories(cats);
      }
    });
    return () => { isMounted = false; };
  }, []);

  // Group branch tests by test ID
  const testOfferingsMap = useMemo(() => {
    const map = {};
    branchTests.forEach(bt => {
      const tId = bt.test || bt.test_id || (bt.test_details && bt.test_details.id);
      if (tId) {
        if (!map[tId]) map[tId] = [];
        map[tId].push(bt);
      }
    });
    return map;
  }, [branchTests]);

  // Handle location change
  const handleLocationChange = (loc) => {
    setSelectedLocation(loc);
    setSelectedArea('All Areas');
  };

  const filteredTests = useMemo(() => {
    return PATHOLOGY_TESTS.filter((test) => {
      // 1. Test Category match
      if (selectedCategory && selectedCategory !== 'all' && selectedCategory !== 'All Categories') {
        const catLow = selectedCategory.toLowerCase();
        const matchesGroup = test.categoryGroup && test.categoryGroup.toLowerCase() === catLow;
        const matchesCategoryName = test.category && test.category.toLowerCase().includes(catLow);
        const matchesName = test.name && test.name.toLowerCase().includes(catLow);
        let categoryAliasMatch = false;

        if (catLow === 'blood') categoryAliasMatch = test.name.toLowerCase().includes('blood') || test.category.toLowerCase().includes('blood');
        if (catLow === 'radiology') categoryAliasMatch = test.name.toLowerCase().includes('ct') || test.name.toLowerCase().includes('mri') || test.category.toLowerCase().includes('radiology');
        if (catLow === 'usg') categoryAliasMatch = test.name.toLowerCase().includes('usg') || test.category.toLowerCase().includes('sonography');
        if (catLow === 'cardiac_profile') categoryAliasMatch = test.name.toLowerCase().includes('lipid') || test.name.toLowerCase().includes('ecg') || test.category.toLowerCase().includes('cardiac');

        if (!matchesGroup && !matchesCategoryName && !matchesName && !categoryAliasMatch) {
          return false;
        }
      }

      // 2. Search Keyword match
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        const matchesName = test.name.toLowerCase().includes(q) || 
          test.category.toLowerCase().includes(q) || 
          (test.description && test.description.toLowerCase().includes(q));
        if (!matchesName) return false;
      }

      return true;
    });
  }, [selectedCategory, searchKeyword]);

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      
      {/* HERO HEADER & SEARCH FILTERS BAR */}
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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold uppercase tracking-wider mb-3 border border-teal-500/30">
                <FlaskConical className="w-3.5 h-3.5" />
                <span>NABL & DGHS Approved Diagnostic Network</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                Pathology Tests & Diagnostic Selection
              </h1>
              <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-2xl">
                Compare prices across top verified diagnostic centers, choose test packages, and book doorstep home blood pickup or center appointment.
              </p>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700 text-xs flex items-center gap-3 shrink-0">
              <div className="w-3 h-3 rounded-full bg-teal-400 animate-ping"></div>
              <div>
                <div className="font-extrabold text-white">{filteredTests.length} Active Test Profiles</div>
                <div className="text-slate-400">Available Nationwide</div>
              </div>
            </div>
          </div>

          {/* SEARCH & FILTER CONTROLS BAR (IDENTICAL TOP FILTER UI) */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-700/60">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-teal-400" />
                <span>DIAGNOSTICS & PATHOLOGY SEARCH FILTERS</span>
              </div>
              {(selectedCategory !== 'all' || selectedLocation !== 'All Bangladesh' || selectedArea !== 'All Areas' || searchKeyword) && (
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedLocation('All Bangladesh');
                    setSelectedArea('All Areas');
                    setSearchKeyword('');
                  }}
                  className="text-teal-400 hover:underline font-bold"
                >
                  Reset All Filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* Keyword Search */}
              <div className="relative">
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Keyword Search</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search test name (e.g. CBC, CT Scan)..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-400 font-medium"
                  />
                </div>
              </div>

              {/* City Location */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">City Location</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-teal-400 font-bold"
                >
                  {LOCATIONS.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Area / Thana Filter (Only visible when city selected != 'All Bangladesh') */}
              {selectedLocation !== 'All Bangladesh' ? (
                <div>
                  <label className="block text-[11px] font-bold text-teal-400 mb-1">Area / Thana ({selectedLocation})</label>
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="w-full bg-slate-900 border border-teal-500/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-teal-400 font-bold"
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

              {/* Test Category Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Test Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-teal-400 font-bold"
                >
                  <option value="all">All Test Categories</option>
                  {testCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Main Results Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-10">
        {filteredTests.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 max-w-lg mx-auto">
            <FlaskConical className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No Pathology Tests Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try resetting your search query, category, or location filter.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredTests.map((test) => {
              const rawOfferings = testOfferingsMap[test.id] || [
                {
                  id: `default-${test.id}`,
                  branch_name: "Ibn Sina Diagnostic - Dhanmondi",
                  city: "Dhaka",
                  location: "Dhanmondi, Dhaka",
                  price: test.price || 450,
                  original_price: test.originalPrice || 600,
                  discount: test.discount || "25% OFF",
                  report_time: test.reportTime || "Same Day"
                },
                {
                  id: `default2-${test.id}`,
                  branch_name: "Popular Diagnostic - Panthapath",
                  city: "Dhaka",
                  location: "Panthapath, Dhaka",
                  price: (test.price || 450) + 50,
                  original_price: (test.originalPrice || 600) + 50,
                  discount: "20% OFF",
                  report_time: "Same Day (4 Hours)"
                }
              ];

              // Filter offerings by selected location & area
              const offerings = rawOfferings.filter(offering => {
                if (selectedLocation && selectedLocation !== 'All Bangladesh') {
                  const offeringCity = offering.city || (offering.branch && offering.branch.city) || '';
                  const offeringBranchName = offering.branch_name || (offering.branch && offering.branch.name) || '';
                  const isCityMatch = offeringCity.toLowerCase() === selectedLocation.toLowerCase() || offeringBranchName.toLowerCase().includes(selectedLocation.toLowerCase());
                  if (!isCityMatch && offeringCity) return false;
                }
                if (selectedLocation !== 'All Bangladesh' && selectedArea && selectedArea !== 'All Areas') {
                  const locText = `${offering.location || ''} ${offering.branch_name || ''}`.toLowerCase();
                  if (!locText.includes(selectedArea.toLowerCase())) return false;
                }
                return true;
              });

              return (
                <div key={test.id} className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-md hover:shadow-lg hover:border-teal-300 transition-all duration-300 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-extrabold text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded uppercase tracking-wider">
                        {test.category}
                      </span>
                      <h2 className="text-xl font-extrabold text-slate-900 mt-1">{test.name}</h2>
                      <p className="text-xs text-slate-500 mt-1">{test.description}</p>
                    </div>

                    {test.fastingRequired && (
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 shrink-0">
                        Fasting Required
                      </span>
                    )}
                  </div>

                  {/* Available Diagnostic Centers & Prices for this Test */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-teal-600" />
                        <span>Available Diagnostic Centers & Pricing ({offerings.length}):</span>
                      </span>
                    </h4>

                    {offerings.length === 0 ? (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-500 italic">
                        No diagnostic partners found in {selectedLocation} {selectedArea !== 'All Areas' ? `(${selectedArea})` : ''} offering this specific test profile.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {offerings.map((offering) => (
                          <div key={offering.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 flex flex-col justify-between space-y-2 hover:bg-teal-50/40 hover:border-teal-300 transition-colors">
                            <div>
                              <div className="font-extrabold text-slate-900 text-xs">{offering.branch_name || 'Partner Diagnostic'}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5">Report Time: <strong className="text-slate-700">{offering.report_time || 'Same Day'}</strong></div>
                            </div>

                            <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
                              <div>
                                <div className="text-sm font-black text-teal-700">{offering.price} BDT</div>
                                {offering.original_price && (
                                  <div className="text-[10px] text-slate-400 line-through">৳{offering.original_price}</div>
                                )}
                              </div>

                              <button
                                onClick={() => onBookLabTest && onBookLabTest({
                                  test: test,
                                  branchTest: offering,
                                  branch: { name: offering.branch_name }
                                })}
                                className="px-3.5 py-1.5 bg-teal-600 text-white rounded-xl font-bold text-xs hover:bg-teal-700 transition-colors shadow-xs"
                              >
                                Book Test
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
