import React, { useState, useEffect } from 'react';
import { 
  Building2, MapPin, Phone, Clock, ShieldCheck, CheckCircle, 
  Star, ArrowRight, Search, UserCheck, Activity, ChevronRight, Filter, Sparkles 
} from 'lucide-react';
import { api } from '../services/api';
import { OPD_CHAMBERS, LOCATIONS, HOSPITAL_SPECIALTIES, CITY_THANAS } from '../data/mockData';

export default function MedicalPartnersPage({ initialKeyword = '', onSelectPartner, onNavigateHome }) {
  const [chambers, setChambers] = useState([]);
  const [hospitalCategories, setHospitalCategories] = useState(HOSPITAL_SPECIALTIES);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [selectedLocation, setSelectedLocation] = useState('All Bangladesh');
  const [selectedArea, setSelectedArea] = useState('All Areas');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState(initialKeyword);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [chambData, catData] = await Promise.all([
          api.getChambers(selectedLocation),
          api.getHospitalSpecialties().catch(() => [])
        ]);
        if (isMounted) {
          if (Array.isArray(chambData) && chambData.length > 0) {
            setChambers(chambData);
          } else {
            setChambers(OPD_CHAMBERS);
          }
          if (Array.isArray(catData) && catData.length > 0) {
            setHospitalCategories(catData);
          }
          setLoading(false);
          return;
        }
      } catch {
        // Fallback
      }

      if (isMounted) {
        setChambers(OPD_CHAMBERS);
        setLoading(false);
      }
    }

    loadData();
  }, [selectedLocation]);

  // Reset area filter when location switches to "All Bangladesh"
  const handleLocationChange = (loc) => {
    setSelectedLocation(loc);
    setSelectedArea('All Areas');
  };

  const filteredChambers = chambers.filter(c => {
    // 1. Location (City) filter
    if (selectedLocation && selectedLocation !== 'All Bangladesh') {
      if (c.city && c.city.toLowerCase() !== selectedLocation.toLowerCase()) {
        return false;
      }
    }

    // 2. Area / Thana filter (visible and active when location !== 'All Bangladesh')
    if (selectedLocation !== 'All Bangladesh' && selectedArea && selectedArea !== 'All Areas') {
      const locText = `${c.location || ''} ${c.name || ''}`.toLowerCase();
      if (!locText.includes(selectedArea.toLowerCase())) {
        return false;
      }
    }

    // 3. Hospital Category filter
    if (selectedCategory && selectedCategory !== 'all' && selectedCategory !== 'All Categories') {
      const catKw = selectedCategory.toLowerCase();
      const matchesCategoryProp = c.specialtyCategory && c.specialtyCategory.toLowerCase() === catKw;
      const matchesNameOrTag = c.name.toLowerCase().includes(catKw) || (c.tagline && c.tagline.toLowerCase().includes(catKw));
      let keywordMatch = false;

      if (catKw === 'cardiac') keywordMatch = c.name.toLowerCase().includes('heart') || c.name.toLowerCase().includes('cardiac');
      if (catKw === 'eye') keywordMatch = c.name.toLowerCase().includes('eye') || c.name.toLowerCase().includes('ophthalmology');
      if (catKw === 'diagnostic') keywordMatch = c.facility_types?.includes('Diagnostic Center') || c.name.toLowerCase().includes('diagnostic');
      if (catKw === 'orthopedic') keywordMatch = c.name.toLowerCase().includes('ortho') || c.name.toLowerCase().includes('bone');
      if (catKw === 'multispecialty') keywordMatch = c.facility_types?.includes('Hospital');

      if (!matchesCategoryProp && !matchesNameOrTag && !keywordMatch) {
        return false;
      }
    }

    // 4. Keyword search
    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      const matchName = c.name.toLowerCase().includes(kw);
      const matchLoc = (c.location && c.location.toLowerCase().includes(kw));
      const matchCity = (c.city && c.city.toLowerCase().includes(kw));
      const matchTag = (c.tagline && c.tagline.toLowerCase().includes(kw));
      if (!matchName && !matchLoc && !matchCity && !matchTag) return false;
    }

    return true;
  });

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
            <span className="text-emerald-400 font-bold">Hospitals & Diagnostic Centers</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3 border border-emerald-500/30">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Diagnostic & OPD Network</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                Hospital & Diagnostic Partner
              </h1>
              <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-2xl">
                Explore Bangladesh's top diagnostic centers, super clinics, and visiting doctor chambers. Click any medical partner to view complete visiting doctors roster, services, and diagnostic tests.
              </p>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700 text-xs flex items-center gap-3 shrink-0">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
              <div>
                <div className="font-extrabold text-white">{filteredChambers.length} Active Partners</div>
                <div className="text-slate-400">Filtered Medical Network</div>
              </div>
            </div>
          </div>

          {/* SEARCH & FILTER CONTROLS BAR (OPD STYLE FILTERING) */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-700/60">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-400" />
                <span>Hospital & Diagnostic Search Filters</span>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* Search Keyword */}
              <div className="relative">
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Keyword Search</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search hospital or diagnostic..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              {/* City / Location */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">City Location</label>
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

              {/* Area / Thana Filter (Only visible when city selected != 'All Bangladesh') */}
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

              {/* Hospital Specialty / Category Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Hospital Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                >
                  <option value="all">All Hospital Categories</option>
                  {hospitalCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* PARTNERS GRID */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-slate-500 mt-3">Loading Medical Partners...</p>
          </div>
        ) : filteredChambers.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 max-w-lg mx-auto">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No Medical Partners Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try resetting your search query or location filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredChambers.map((chamber) => {
              const docCount = (chamber.doctors || []).length;
              return (
                <div
                  key={chamber.id}
                  onClick={() => onSelectPartner(chamber.id)}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-md hover:shadow-xl hover:border-emerald-400 transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    {/* Top Image */}
                    <div className="relative h-48 overflow-hidden bg-slate-900">
                      <img
                        src={chamber.image}
                        alt={chamber.name}
                        className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <div className="inline-flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-emerald-500/40 text-emerald-400 text-xs font-extrabold px-3 py-1 rounded-full">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{chamber.badge || "Verified Partner"}</span>
                        </div>
                        <div className="bg-slate-900/90 backdrop-blur-md text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-500/30 flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{chamber.rating} ({chamber.reviews_count || chamber.reviewsCount || 200})</span>
                        </div>
                      </div>

                      <div className="absolute bottom-3 left-4 right-4 text-white">
                        <h3 className="text-lg font-extrabold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-2">
                          <span>{chamber.hospital_name ? `${chamber.hospital_name} - ${chamber.name}` : chamber.name}</span>
                          {chamber.verified && (
                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                        </h3>
                        <p className="text-xs text-slate-300 font-medium line-clamp-1 mt-0.5">
                          {chamber.tagline}
                        </p>
                      </div>
                    </div>

                    {/* Details Strip */}
                    <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 space-y-2">
                      <div className="flex items-center gap-2 font-semibold text-slate-800">
                        <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate">{chamber.location}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 pt-1">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{chamber.open_timing || chamber.openTiming}</span>
                        </span>
                        <span className="flex items-center gap-1 text-emerald-700 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-md">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{docCount} Visiting Doctors</span>
                        </span>
                      </div>
                    </div>

                    {/* Services Chips Preview */}
                    <div className="p-4 space-y-2">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Available Services:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {((chamber.services && chamber.services.length > 0 ? chamber.services : [
                          "24/7 OPD Doctor Visits",
                          "Radiology & 4D USG",
                          "Automated Lab Testing"
                        ])).slice(0, 3).map((srv, idx) => (
                          <span key={idx} className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-1 rounded-md border border-slate-200">
                            {srv}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:bg-emerald-50/50 transition-colors">
                    <span>View Doctors, Services & Book</span>
                    <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
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
