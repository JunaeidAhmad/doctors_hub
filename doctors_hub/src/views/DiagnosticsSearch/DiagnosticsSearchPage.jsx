import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { 
  FlaskConical, Clock, ArrowLeft, Filter, Search, Building2, ShieldCheck, 
  MapPin, CheckCircle, Home, FileText, ChevronRight, ChevronDown, Tag, Stethoscope
} from 'lucide-react';
import { LOCATIONS, CITY_THANAS } from '../../data/constants';
import { api, ensureArray, isPageReload, getIsInitialLoad } from '../../services/api';
import Pagination from '../../components/Pagination';

export default function DiagnosticsSearchPage({
  initialTest = '',
  onBookLabTest,
  onNavigateHome
}) {
  const [diagnosticCenters, setDiagnosticCenters] = useState([]);
  const [centerCategories, setCenterCategories] = useState([]);
  const [testCategories, setTestCategories] = useState([]);
  const [tests, setTests] = useState([]);
  const [centerTests, setCenterTests] = useState([]);

  // URL-serialized state (filters)
  const [searchParams, setSearchParams] = useSearchParams();
  const routerLocation = useLocation();
  const [isRefresh] = useState(() => getIsInitialLoad() && isPageReload());

  const getParam = (key, fallback) => {
    const v = searchParams.get(key);
    return v === null || v === undefined ? fallback : v;
  };
  const getParamList = (key) => {
    const v = searchParams.get(key);
    if (!v) return [];
    return v.split(',').filter(Boolean);
  };
  const hasUrlFilters = searchParams.toString().length > 0;

  // Filter states
  const [selectedLocation, setSelectedLocation] = useState(() => {
    if (isRefresh) return 'All Bangladesh';
    return getParam('loc', 'All Bangladesh');
  });
  const [selectedArea, setSelectedArea] = useState(() => {
    if (isRefresh) return 'All Areas';
    return getParam('area', 'All Areas');
  });

  const [selectedTestCategory, setSelectedTestCategory] = useState(() => {
    if (isRefresh) return 'all';
    const urlCat = getParam('testcat', '');
    if (urlCat) return urlCat;
    if (initialTest) {
      const cleanTest = initialTest.toLowerCase().trim();
      const isTestCat = [].some(c => c.id === initialTest || c.id.toLowerCase() === cleanTest);
      if (isTestCat) return initialTest;
    }
    return 'all';
  });

  const [selectedCenterCategories, setSelectedCenterCategories] = useState(() => {
    if (isRefresh) return [];
    const fromUrl = [...getParamList('spec'), ...getParamList('owner')];
    if (fromUrl.length > 0) return fromUrl;
    if (!initialTest) return [];
    const isUuid = typeof initialTest === 'string' && /^[0-9a-fA-F-]{36}$/.test(initialTest.trim());
    if (isUuid) return [initialTest];
    if ([].some(c => (c.id === initialTest || c.slug === initialTest))) {
      return [initialTest];
    }
    return [];
  });

  const [specDropdownOpen, setSpecDropdownOpen] = useState(false);
  const specDropdownRef = useRef(null);
  const [ownerDropdownOpen, setOwnerDropdownOpen] = useState(false);
  const ownerDropdownRef = useRef(null);

  useEffect(() => {
    if (isRefresh) {
      setSelectedTestCategory('all');
      setSelectedCenterCategories([]);
      setSelectedLocation('All Bangladesh');
      setSelectedArea('All Areas');
      setSearchKeyword('');
      setSearchParams({}, { replace: true });
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (specDropdownRef.current && !specDropdownRef.current.contains(event.target)) {
        setSpecDropdownOpen(false);
      }
      if (ownerDropdownRef.current && !ownerDropdownRef.current.contains(event.target)) {
        setOwnerDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [searchKeyword, setSearchKeyword] = useState(() => {
    if (isRefresh) return '';
    const urlQ = getParam('q', '');
    if (urlQ) return urlQ;
    if (!initialTest) return '';
    const isUuid = typeof initialTest === 'string' && /^[0-9a-fA-F-]{36}$/.test(initialTest.trim());
    if (isUuid) return '';
    const cleanTest = initialTest.toLowerCase().trim();
    if (cleanTest === 'diagnostics' || cleanTest === 'diagnostics-search') {
      return '';
    }
    const isCat = [].some(c => 
      c.id === initialTest || c.slug === initialTest || (c.name && c.name.toLowerCase() === cleanTest)
    );
    if (isCat) return '';

    const isTestCat = [].some(c => 
      c.id === initialTest || c.id.toLowerCase() === cleanTest || (c.name && c.name.toLowerCase() === cleanTest)
    );
    if (isTestCat) return '';

    return initialTest;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [totalPages, setTotalPages] = useState(1);

  // Fetch reference metadata (categories, tests) once
  useEffect(() => {
    let isMounted = true;
    api.getSearchMetadata()
      .then((meta) => {
        if (isMounted && meta) {
          if (meta.diagnostic_center_categories) setCenterCategories(ensureArray(meta.diagnostic_center_categories));
          if (meta.test_categories) setTestCategories(ensureArray(meta.test_categories));
        }
      })
      .catch(() => {
        Promise.all([
          api.getDiagnosticCenterCategories().catch(() => []),
          api.getTestCategories().catch(() => []),
        ]).then(([dccats, tcats]) => {
          if (isMounted) {
            setCenterCategories(ensureArray(dccats, []));
            setTestCategories(ensureArray(tcats, []));
          }
        });
      });
    return () => { isMounted = false; };
  }, []);

  // Group fetched categories into Specialization and Ownership types for the unified filter
  const { specializationCategories, ownershipCategories } = useMemo(() => {
    const safeCats = ensureArray(centerCategories, []);
    const spec = [];
    const owner = [];
    
    safeCats.forEach(c => {
      const cId = (c?.id || '').toString().toLowerCase();
      const cSlug = (c?.slug || '').toString().toLowerCase();
      const nameStr = (c?.name || '').toString().toLowerCase();
      
      if (
        !c || 
        cId === 'all' || 
        cId === 'by-specialization' || 
        cId === 'by-ownership-type' || 
        cId === 'by-ownership-and-type' ||
        cSlug === 'by-specialization' ||
        cSlug === 'by-ownership-type' ||
        cSlug === 'by-ownership-and-type' ||
        nameStr.includes('by specialization') ||
        nameStr.includes('by ownership')
      ) {
        return;
      }
      
      const parentStr = (c.parent || c.parent_name || '').toString().toLowerCase();
      
      if (
        parentStr.includes('specialization') || 
        nameStr.includes('pathology') || 
        nameStr.includes('imaging') || 
        nameStr.includes('radiology') || 
        nameStr.includes('cardiac') || 
        nameStr.includes('neuro') || 
        nameStr.includes('genetic') ||
        nameStr.includes('molecular') ||
        nameStr.includes('general diagnostic') ||
        nameStr.includes('multi-specialty')
      ) {
        spec.push(c);
      } else if (
        parentStr.includes('ownership') || 
        nameStr.includes('government') || 
        nameStr.includes('private') || 
        nameStr.includes('corporate') || 
        nameStr.includes('chain') || 
        nameStr.includes('hospital-affiliated')
      ) {
        owner.push(c);
      } else {
        spec.push(c);
      }
    });
    
    return { specializationCategories: spec, ownershipCategories: owner };
  }, [centerCategories]);

  // Fetch filtered Diagnostic Centers from backend
  useEffect(() => {
    let isMounted = true;

    const specIds = selectedCenterCategories.filter(id => specializationCategories.some(sc => (sc.id || sc.slug || '').toString() === id.toString()));
    const ownerIds = selectedCenterCategories.filter(id => ownershipCategories.some(oc => (oc.id || oc.slug || '').toString() === id.toString()));

    const delay = searchKeyword.trim() ? 350 : 0;
    const timer = setTimeout(() => {
      api.getDiagnosticCenters({
        location: selectedLocation,
        area: selectedArea !== 'All Areas' ? selectedArea : undefined,
        testcat: selectedTestCategory !== 'all' ? selectedTestCategory : undefined,
        spec: specIds.length > 0 ? specIds.join(',') : undefined,
        owner: ownerIds.length > 0 ? ownerIds.join(',') : undefined,
        search: searchKeyword.trim() || undefined,
        page: currentPage,
        page_size: pageSize
      })
        .then((data) => {
          if (isMounted) {
            setDiagnosticCenters(ensureArray(data, []));
            if (data && typeof data === 'object' && data.count) {
              setTotalPages(Math.ceil(data.count / pageSize));
            } else {
              setTotalPages(1);
            }
          }
        })
        .catch(() => {});
    }, delay);

    return () => { isMounted = false; clearTimeout(timer); };
  }, [selectedLocation, selectedArea, selectedTestCategory, selectedCenterCategories, searchKeyword, currentPage, specializationCategories, ownershipCategories]);

  // Handle location change
  const handleLocationChange = (loc) => {
    setSelectedLocation(loc);
    setSelectedArea('All Areas');
  };

  // Serialize filters to URL query parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedLocation && selectedLocation !== 'All Bangladesh') params.set('loc', selectedLocation);
    if (selectedArea && selectedArea !== 'All Areas') params.set('area', selectedArea);
    if (selectedTestCategory && selectedTestCategory !== 'all') params.set('testcat', selectedTestCategory);
    if (searchKeyword.trim()) params.set('q', searchKeyword.trim());
    
    const specIds = selectedCenterCategories.filter(id => specializationCategories.some(sc => (sc.id || sc.slug || '').toString() === id.toString()));
    const ownerIds = selectedCenterCategories.filter(id => ownershipCategories.some(oc => (oc.id || oc.slug || '').toString() === id.toString()));
    if (specIds.length > 0) params.set('spec', specIds.join(','));
    if (ownerIds.length > 0) params.set('owner', ownerIds.join(','));

    const next = params.toString();
    if (next !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [selectedLocation, selectedArea, selectedTestCategory, searchKeyword, selectedCenterCategories, searchParams, setSearchParams, specializationCategories, ownershipCategories]);

  // Use backend results directly
  const filteredDiagnosticCenters = useMemo(() => {
    return ensureArray(diagnosticCenters, []);
  }, [diagnosticCenters]);

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
                <span>Diagnostics Search Portal</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                Diagnostics Search
              </h1>
              <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-2xl">
                Browse verified diagnostic centers by ownership and specialization categories, explore complete test menus, compare pricing, and book doorstep home blood sample collection.
              </p>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700 text-xs flex items-center gap-3 shrink-0">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
              <div>
                <div className="font-extrabold text-white">{filteredDiagnosticCenters.length} Diagnostic Centers</div>
                <div className="text-slate-400">Categorized Labs & Centers</div>
              </div>
            </div>
          </div>

          {/* SEARCH & FILTER CONTROLS BAR */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-700/60">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-400" />
                <span>Diagnostic Center & Test Search Filters</span>
              </div>
              {(selectedCenterCategories.length > 0 || selectedTestCategory !== 'all' || selectedLocation !== 'All Bangladesh' || selectedArea !== 'All Areas' || searchKeyword) && (
                <button
                  onClick={() => {
                    setSelectedCenterCategories([]);
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

            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${selectedLocation !== 'All Bangladesh' ? 'xl:grid-cols-6' : 'xl:grid-cols-5'} gap-3`}>
              
              {/* 1. Test Category Filter */}
              <div>
                <label className="block text-[11px] font-bold text-cyan-400 mb-1">
                  Test Category
                </label>
                <select
                  value={selectedTestCategory}
                  onChange={(e) => setSelectedTestCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-cyan-500/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-bold"
                >
                  <option value="all">All Test Categories</option>
                  {testCategories.filter(c => c && c.id !== 'all').map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* 2a. City / Location Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Location</label>
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

              {/* 2b. Area / Thana Filter */}
              {selectedLocation !== 'All Bangladesh' && (
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
              )}

             {/* 4. Specialization Filter (Multi-Select) */}
             {/* 
              <div className="relative" ref={specDropdownRef}>
                <label className="block text-[11px] font-bold text-emerald-400 mb-1 flex items-center justify-between">
                  <span>Specialization</span>
                  {selectedCenterCategories.filter(id => specializationCategories.some(sc => (sc.id || sc.slug || '').toString() === id.toString())).length > 0 && (
                    <span className="text-[10px] text-emerald-300 font-extrabold bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-700/60">
                      {selectedCenterCategories.filter(id => specializationCategories.some(sc => (sc.id || sc.slug || '').toString() === id.toString())).length} selected
                    </span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={() => setSpecDropdownOpen(!specDropdownOpen)}
                  className="w-full bg-slate-900 border border-emerald-500/80 rounded-xl px-3 py-2.5 text-xs text-left text-white focus:outline-none focus:border-emerald-400 font-bold flex items-center justify-between cursor-pointer shadow-xs"
                >
                  <span className="truncate">
                    {selectedCenterCategories.filter(id => specializationCategories.some(sc => (sc.id || sc.slug || '').toString() === id.toString())).length === 0
                      ? "All Specializations"
                      : selectedCenterCategories.filter(id => specializationCategories.some(sc => (sc.id || sc.slug || '').toString() === id.toString())).length === 1
                      ? (
                          specializationCategories.find(c => (c.id || c.slug).toString() === selectedCenterCategories.find(id => specializationCategories.some(sc => (sc.id || sc.slug || '').toString() === id.toString()))?.toString())?.name || "1 Selected"
                        )
                      : `${selectedCenterCategories.filter(id => specializationCategories.some(sc => (sc.id || sc.slug || '').toString() === id.toString())).length} Selected`}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-emerald-400 shrink-0 transition-transform ${specDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Specialization Interactive Popover 
                {specDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 z-50 max-h-80 overflow-y-auto space-y-3 font-sans">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <button
                        type="button"
                        onClick={() => {
                          const specIds = new Set(specializationCategories.map(sc => (sc.id || sc.slug || '').toString()));
                          setSelectedCenterCategories(selectedCenterCategories.filter(id => !specIds.has(id.toString())));
                        }}
                        className={`text-xs font-bold px-2 py-1 rounded transition ${selectedCenterCategories.filter(id => specializationCategories.some(sc => (sc.id || sc.slug || '').toString() === id.toString())).length === 0 ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-white'}`}
                      >
                        Clear All
                      </button>
                      <span className="text-[10px] text-slate-500 font-semibold">Select Specializations</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      {specializationCategories.map(cat => {
                        const catId = cat.id || cat.slug;
                        const isChecked = selectedCenterCategories.includes(catId);
                        return (
                          <label
                            key={catId}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition ${isChecked ? 'bg-emerald-950/80 text-emerald-200 font-bold border border-emerald-600/50' : 'text-slate-300 hover:bg-slate-800 font-medium'}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedCenterCategories(selectedCenterCategories.filter(id => id !== catId));
                                } else {
                                  setSelectedCenterCategories([...selectedCenterCategories, catId]);
                                }
                              }}
                              className="w-3.5 h-3.5 rounded accent-emerald-500 cursor-pointer"
                            />
                            <span className="truncate">{cat.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div> */}

              {/* 5. Ownership Filter (Multi-Select) */}
              <div className="relative" ref={ownerDropdownRef}>
                <label className="block text-[11px] font-bold text-teal-400 mb-1 flex items-center justify-between">
                  <span>Ownership</span>
                  {selectedCenterCategories.filter(id => ownershipCategories.some(oc => (oc.id || oc.slug || '').toString() === id.toString())).length > 0 && (
                    <span className="text-[10px] text-teal-300 font-extrabold bg-teal-950 px-1.5 py-0.5 rounded border border-teal-700/60">
                      {selectedCenterCategories.filter(id => ownershipCategories.some(oc => (oc.id || oc.slug || '').toString() === id.toString())).length} selected
                    </span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={() => setOwnerDropdownOpen(!ownerDropdownOpen)}
                  className="w-full bg-slate-900 border border-teal-500/80 rounded-xl px-3 py-2.5 text-xs text-left text-white focus:outline-none focus:border-teal-400 font-bold flex items-center justify-between cursor-pointer shadow-xs"
                >
                  <span className="truncate">
                    {selectedCenterCategories.filter(id => ownershipCategories.some(oc => (oc.id || oc.slug || '').toString() === id.toString())).length === 0
                      ? "All Ownership Types"
                      : selectedCenterCategories.filter(id => ownershipCategories.some(oc => (oc.id || oc.slug || '').toString() === id.toString())).length === 1
                      ? (
                          ownershipCategories.find(c => (c.id || c.slug).toString() === selectedCenterCategories.find(id => ownershipCategories.some(oc => (oc.id || oc.slug || '').toString() === id.toString()))?.toString())?.name || "1 Selected"
                        )
                      : `${selectedCenterCategories.filter(id => ownershipCategories.some(oc => (oc.id || oc.slug || '').toString() === id.toString())).length} Selected`}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-teal-400 shrink-0 transition-transform ${ownerDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Ownership Interactive Popover */}
                {ownerDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 z-50 max-h-80 overflow-y-auto space-y-3 font-sans">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <button
                        type="button"
                        onClick={() => {
                          const ownerIds = new Set(ownershipCategories.map(oc => (oc.id || oc.slug || '').toString()));
                          setSelectedCenterCategories(selectedCenterCategories.filter(id => !ownerIds.has(id.toString())));
                        }}
                        className={`text-xs font-bold px-2 py-1 rounded transition ${selectedCenterCategories.filter(id => ownershipCategories.some(oc => (oc.id || oc.slug || '').toString() === id.toString())).length === 0 ? 'bg-teal-500/20 text-teal-300' : 'text-slate-400 hover:text-white'}`}
                      >
                        Clear All
                      </button>
                      <span className="text-[10px] text-slate-500 font-semibold">Select Ownership Types</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      {ownershipCategories.map(cat => {
                        const catId = cat.id || cat.slug;
                        const isChecked = selectedCenterCategories.includes(catId);
                        return (
                          <label
                            key={catId}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition ${isChecked ? 'bg-teal-950/80 text-teal-200 font-bold border border-teal-600/50' : 'text-slate-300 hover:bg-slate-800 font-medium'}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedCenterCategories(selectedCenterCategories.filter(id => id !== catId));
                                } else {
                                  setSelectedCenterCategories([...selectedCenterCategories, catId]);
                                }
                              }}
                              className="w-3.5 h-3.5 rounded accent-teal-500 cursor-pointer"
                            />
                            <span className="truncate">{cat.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Search Keyword Filter */}
              <div className="relative">
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Search</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search center, branch, test..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 font-medium"
                  />
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* MAIN RESULTS CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-10">
        
        {/* CATEGORIZED DIAGNOSTIC CENTERS AND THEIR [] */}
        <div className="space-y-8">
          {filteredDiagnosticCenters.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 max-w-lg mx-auto">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">No Diagnostic Centers Found</h3>
              <p className="text-xs text-slate-500 mt-1">
                Try adjusting your search keyword, location, specialization, or ownership category filters.
              </p>
            </div>
          ) : (
            filteredDiagnosticCenters.map((center) => {
              let offered = center.offered_tests && center.offered_tests.length > 0 
                ? center.offered_tests 
                : centerTests.filter(ct => ct && (ct.center_id === center.id || ct.center === center.id));

              // NEW: Frontend fallback filtering to ensure matching tests are always visible
              if (searchKeyword.trim()) {
                const q = searchKeyword.trim().toLowerCase();
                const matchedTests = offered.filter(offering => {
                  const testName = (offering.test_details?.name || offering.test_name || offering.name || "").toLowerCase();
                  const catName = (offering.test_details?.category_name || offering.category_name || "").toLowerCase();
                  return testName.includes(q) || catName.includes(q);
                });
                if (matchedTests.length > 0) {
                  offered = matchedTests;
                }
              }

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
                          {(center.categories || []).map(cat => {
                            const catName = typeof cat === 'string' ? cat : (cat?.name || cat?.id || '');
                            if (!catName) return null;
                            return (
                              <span key={typeof cat === 'object' && cat.id ? cat.id : catName} className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {catName}
                              </span>
                            );
                          })}
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

                  {/* OFFERED [] SECTION */}
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
                          const testName = offering.test_details?.name || offering.test_name || offering.name || "Lab Test Profile";
                          const testDesc = offering.test_details?.description || offering.description || "Diagnostic & Clinical Testing";
                          const isHome = offering.home_sample_collection;

                          return (
                            <div key={offering.id || testName} className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 flex flex-col justify-between space-y-3 hover:bg-emerald-50/40 hover:border-emerald-300 transition-colors">
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-extrabold text-slate-700 uppercase">
                                    {offering.test_details?.category_name || offering.category_name || "Diagnostic"}
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

          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>

      </div>
    </div>
  );
}
