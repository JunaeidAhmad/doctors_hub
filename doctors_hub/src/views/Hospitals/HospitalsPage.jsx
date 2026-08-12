import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { 
  Building2, MapPin, Clock, ShieldCheck, CheckCircle, 
  Star, ArrowRight, Search, UserCheck, ChevronRight, Filter,
  ArrowDownAZ, ArrowUpAZ
} from 'lucide-react';
import { api, ensureArray, isPageReload, getIsInitialLoad } from '../../services/api';
import { LOCATIONS, CITY_THANAS } from '../../data/constants';
import Pagination from '../../components/Pagination';

function HospitalCardImage({ hospital }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  let rawImg = hospital.image || hospital.logo || "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=500&q=70&fm=webp";

  if (rawImg.includes('unsplash.com')) {
    if (!rawImg.includes('w=')) rawImg += '&w=500';
    else rawImg = rawImg.replace(/w=\d+/, 'w=500');
    if (!rawImg.includes('q=')) rawImg += '&q=70';
    else rawImg = rawImg.replace(/q=\d+/, 'q=70');
    if (!rawImg.includes('fm=')) rawImg += '&fm=webp';
  }

  const fallbackImg = "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=500&q=70&fm=webp";

  return (
    <div className="relative h-48 overflow-hidden bg-slate-900">
      {!loaded && !error && (
        <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center">
          <Building2 className="w-8 h-8 text-slate-600 animate-pulse" />
        </div>
      )}

      <img
        src={error ? fallbackImg : rawImg}
        alt={hospital.name}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
          loaded ? 'opacity-80 scale-100 blur-0' : 'opacity-0 scale-105 blur-xs'
        }`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
        <div className="inline-flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-emerald-500/40 text-emerald-400 text-xs font-extrabold px-3 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{typeof hospital.badge === 'string' ? hospital.badge : (hospital.badge?.name || hospital.type)}</span>
        </div>
        <div className="bg-slate-900/90 backdrop-blur-md text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-500/30 flex items-center gap-1">
          <Star className="w-3.5 h-3.5 fill-amber-400" />
          <span>{hospital.rating || 4.8} ({hospital.reviews_count || hospital.reviewsCount || 250})</span>
        </div>
      </div>

      <div className="absolute bottom-3 left-4 right-4 text-white">
        {hospital.categoryName && (
          <div className="mb-1.5 flex items-center">
            <span className="inline-flex items-center gap-1 bg-emerald-500/90 backdrop-blur-md text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
              <Building2 className="w-3 h-3 text-slate-950" />
              <span>{hospital.categoryName}</span>
            </span>
          </div>
        )}
        <h3 className="text-lg font-extrabold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-2">
          <span>{hospital.name}{hospital.branch ? ` - ${hospital.branch}` : ''}</span>
          {hospital.is_verified && (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
        </h3>
        <p className="text-xs text-slate-300 font-medium line-clamp-1 mt-0.5">
          {typeof hospital.tagline === 'string' ? hospital.tagline : (hospital.description || '')}
        </p>
      </div>
    </div>
  );
}

export default function HospitalsPage({ initialCategory = '', initialKeyword = '', onSelectHospital, onNavigateHome }) {
  const [hospitals, setHospitals] = useState([]);
  const [hospitalCategories, setHospitalCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // URL-serialized state (filters, pagination, sort)
  const [searchParams, setSearchParams] = useSearchParams();
  const routerLocation = useLocation();

  const getParam = (key, fallback) => {
    const v = searchParams.get(key);
    return v === null || v === undefined ? fallback : v;
  };

  const [page, setPage] = useState(() => Math.max(1, parseInt(getParam('page', '1'), 10) || 1));
  const [sortOrder, setSortOrder] = useState(() => (getParam('sort', 'asc') === 'desc' ? 'desc' : 'asc'));
  const pageSize = 9;
  
  // Filter states
  const [selectedLocation, setSelectedLocation] = useState(() => {
    return getParam('loc', 'All Bangladesh');
  });
  const [selectedArea, setSelectedArea] = useState(() => {
    return getParam('area', 'All Areas');
  });
  const [selectedCategory, setSelectedCategory] = useState(() => {
    const urlCat = getParam('cat', '');
    if (urlCat) return urlCat;
    if (initialCategory) return initialCategory;
    return 'all';
  });

  const [searchKeyword, setSearchKeyword] = useState(() => {
    const urlQ = getParam('q', '');
    if (urlQ) return urlQ;
    if (getParam('cat', '')) return '';
    if (initialCategory) return '';
    if (initialKeyword) return initialKeyword;
    return '';
  });

  const [totalHospitalPages, setTotalHospitalPages] = useState(1);

  // Fetch hospital categories metadata
  useEffect(() => {
    let isMounted = true;
    api.getSearchMetadata()
      .then((meta) => {
        if (isMounted && meta && meta.hospital_categories) {
          setHospitalCategories(ensureArray(meta.hospital_categories));
        }
      })
      .catch(() => {
        api.getHospitalCategories().then((data) => {
          if (isMounted && data) setHospitalCategories(ensureArray(data));
        });
      });
    return () => { isMounted = false; };
  }, []);

  // Fetch filtered Hospitals from backend
  useEffect(() => {
    let isMounted = true;
    const delay = searchKeyword.trim() ? 350 : 0;
    const timer = setTimeout(() => {
      setIsSyncing(true);
      const params = {
        location: selectedLocation,
        area: selectedArea !== 'All Areas' ? selectedArea : undefined,
        category: selectedCategory !== 'all' && selectedCategory !== 'All Categories' ? selectedCategory : undefined,
        search: searchKeyword.trim() || undefined,
        page: page,
        page_size: pageSize
      };

      api.getHospitals(params).then((hData) => {
        if (isMounted) {
          let hList = [];
          let hCount = 0;

          if (hData) {
            hList = ensureArray(hData);
            hCount = (typeof hData === 'object' && hData.count) ? hData.count : hList.length;
          }

          setHospitals(hList);
          setTotalHospitalPages(Math.max(1, Math.ceil(hCount / pageSize)));
        }
      }).catch(() => {
        if (isMounted) {
          setHospitals([]);
          setTotalHospitalPages(1);
        }
      }).finally(() => {
        if (isMounted) setIsSyncing(false);
      });
    }, delay);

    return () => { isMounted = false; clearTimeout(timer); };
  }, [selectedLocation, selectedArea, selectedCategory, searchKeyword, page]);

  // Handle URL deserialization once or when searchParams actually change from outside
  useEffect(() => {
    if (lastParamsRef.current === searchParams.toString()) return;
    
    const urlCat = searchParams.get('cat');
    const urlLoc = searchParams.get('loc');
    const urlArea = searchParams.get('area');
    const urlQ = searchParams.get('q');
    const urlSort = searchParams.get('sort');
    
    if (urlCat !== null) setSelectedCategory(urlCat || 'all');
    if (urlLoc !== null) setSelectedLocation(urlLoc || 'All Bangladesh');
    if (urlArea !== null) setSelectedArea(urlArea || 'All Areas');
    if (urlQ !== null) setSearchKeyword(urlQ || '');
    if (urlSort !== null) setSortOrder(urlSort || 'asc');
    
    lastParamsRef.current = searchParams.toString();
  }, [searchParams]);

  // Reset area filter when location switches
  const handleLocationChange = (loc) => {
    setSelectedLocation(loc);
    setSelectedArea('All Areas');
  };

  // Combine hospitals list to display
  const allHospitalsList = useMemo(() => {
    return hospitals.map(h => {
      let categoryName = h.category_name || h.categoryName || '';

      if (!categoryName) {
        if (Array.isArray(h.categories) && h.categories.length > 0) {
          categoryName = h.categories
            .map(c => (typeof c === 'object' ? (c.name || c.title) : c))
            .filter(Boolean)
            .join(', ');
        } else if (h.category && typeof h.category === 'object') {
          categoryName = h.category.name || h.category.title || '';
        } else if (typeof h.category === 'string' && h.category.trim()) {
          const foundCat = hospitalCategories.find(c => String(c.id).toLowerCase() === h.category.toLowerCase());
          categoryName = foundCat ? foundCat.name : h.category;
        } else if (h.hospital_category) {
          categoryName = typeof h.hospital_category === 'object' ? h.hospital_category.name : h.hospital_category;
        }
      }

      if (!categoryName && h.category_id) {
        const foundCat = hospitalCategories.find(c => String(c.id) === String(h.category_id));
        if (foundCat) categoryName = foundCat.name;
      }

      return {
        ...h,
        type: 'Hospital',
        badge: h.badge || 'Verified Hospital',
        categoryName: categoryName || 'Multi-Specialty'
      };
    });
  }, [hospitals, hospitalCategories]);

  const filteredHospitals = allHospitalsList;

  const lastParamsRef = useRef(searchParams.toString());
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== 'all') params.set('cat', selectedCategory);
    if (selectedLocation && selectedLocation !== 'All Bangladesh') params.set('loc', selectedLocation);
    if (selectedArea && selectedArea !== 'All Areas') params.set('area', selectedArea);
    if (searchKeyword.trim()) params.set('q', searchKeyword.trim());
    if (page > 1) params.set('page', String(page));
    if (sortOrder !== 'asc') params.set('sort', sortOrder);

    const next = params.toString();
    if (next !== lastParamsRef.current) {
      lastParamsRef.current = next;
      setSearchParams(params, { replace: true });
    }
  }, [selectedCategory, selectedLocation, selectedArea, searchKeyword, page, sortOrder, setSearchParams]);

  // Alphabetical sorting
  const sortedHospitals = useMemo(() => {
    const sorted = [...filteredHospitals].sort((a, b) => {
      const cmp = (a.name || '').localeCompare(b.name || '');
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [filteredHospitals, sortOrder]);

  const paginatedHospitals = sortedHospitals;

  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    setPage(1);
  }, [selectedCategory, selectedLocation, selectedArea, searchKeyword]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      
      {/* HERO HEADER */}
      <div className="bg-slate-900 text-white py-12 px-4 sm:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <button onClick={onNavigateHome} className="hover:text-emerald-400 font-semibold transition-colors">
              Home
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-emerald-400 font-bold">Hospitals</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3 border border-emerald-500/30">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Hospital Network</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                Hospitals
              </h1>
              <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-2xl">
                Explore Bangladesh's top multi-specialty hospitals.
              </p>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700 text-xs flex items-center gap-3 shrink-0">
              <div className={`w-3 h-3 rounded-full ${isSyncing ? 'bg-amber-400 animate-spin border-2 border-amber-300 border-t-transparent' : 'bg-emerald-400 animate-ping'}`}></div>
              <div>
                <div className="font-extrabold text-white">{filteredHospitals.length} Active Hospitals</div>
                <div className="text-slate-400">{isSyncing ? 'Updating live network data...' : 'Hospitals'}</div>
              </div>
            </div>
          </div>

          {/* SEARCH & FILTER CONTROLS BAR */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-700/60">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-400" />
                <span>Hospital Search & Filter</span>
              </div>
              {(selectedCategory !== 'all' || selectedLocation !== 'All Bangladesh' || selectedArea !== 'All Areas' || searchKeyword) && (
                <button
                  onClick={() => {
                    setSelectedCategory('all');
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

            <div className={`grid grid-cols-1 sm:grid-cols-2 ${selectedLocation !== 'All Bangladesh' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-3`}>
              
              {/* Category Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Hospital Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSearchKeyword('');
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                >
                  <option value="all">All Hospital Categories</option>
                  {hospitalCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* City / Location */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Location</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                >
                  {LOCATIONS.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Area / Thana Filter */}
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

              {/* Search Keyword */}
              <div className="relative">
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Search</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search hospital name, location..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* [] GRID */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-slate-500 mt-3">Loading Hospitals...</p>
          </div>
        ) : filteredHospitals.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 max-w-lg mx-auto">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No Hospitals Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try resetting your search query, location, or hospital category filter.
            </p>
          </div>
        ) : (
          <>
          {/* Sort Control */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
            <p className="text-xs font-semibold text-slate-600">
              Showing <strong className="text-emerald-700">{paginatedHospitals.length}</strong> of{' '}
              <strong className="text-slate-900">{filteredHospitals.length}</strong> hospitals
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sort:</span>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all ${
                  sortOrder === 'asc'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {sortOrder === 'asc' ? <ArrowDownAZ className="w-3.5 h-3.5" /> : <ArrowUpAZ className="w-3.5 h-3.5" />}
                <span>{sortOrder === 'asc' ? 'A-Z' : 'Z-A'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedHospitals.map((hospital) => {
              const docCount = (hospital.affiliated_doctors || hospital.doctors || []).length;
              const testCount = (hospital.offered_tests || hospital.tests || []).length;
              return (
                <div
                  key={hospital.id}
                  onClick={() => onSelectHospital && onSelectHospital(hospital.id)}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-md hover:shadow-xl hover:border-emerald-400 transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    {/* Top Image */}
                    <HospitalCardImage hospital={hospital} />

                    {/* Details Strip */}
                    <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 space-y-2">
                      <div className="flex items-center gap-2 font-semibold text-slate-800">
                        <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate">
                          {typeof hospital.address === 'string' ? hospital.address : (hospital.location || hospital.district || 'Dhaka, Bangladesh')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 pt-1">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{hospital.open_timing || hospital.openTiming || "24/7 Service"}</span>
                        </span>
                        <span className="flex items-center gap-1 text-emerald-700 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-md">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{docCount} Doctors {testCount > 0 ? `| ${testCount} Tests` : ''}</span>
                        </span>
                      </div>
                    </div>

                    {/* Services Chips Preview */}
                    <div className="p-4 space-y-2">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Available Services:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {((hospital.services && hospital.services.length > 0 ? hospital.services : [
                          "Specialist Consultation",
                          "Automated Lab Testing",
                          "Radiology & Ultrasound"
                        ])).slice(0, 3).map((srv, idx) => {
                          const srvName = typeof srv === 'object' ? (srv.name || srv.title || '') : srv;
                          return (
                            <span key={idx} className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-1 rounded-md border border-slate-200">
                              {srvName}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:bg-emerald-50/50 transition-colors">
                    <span>View Doctors, Tests & Book</span>
                    <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            page={page}
            totalPages={totalHospitalPages}
            onPageChange={setPage}
          />
          </>
        )}

      </div>
    </div>
  );
}
