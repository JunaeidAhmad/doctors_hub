import React, { useState, useEffect } from 'react';
import { 
  Building2, MapPin, Clock, ShieldCheck, CheckCircle, 
  Star, ArrowRight, Search, UserCheck, ChevronRight, Filter, FlaskConical, Stethoscope 
} from 'lucide-react';
import { api } from '../services/api';
import { HOSPITALS, DIAGNOSTIC_CENTERS, LOCATIONS, HOSPITAL_CATEGORIES, CITY_THANAS } from '../data/mockData';

export default function MedicalPartnersPage({ initialKeyword = '', onSelectPartner, onNavigateHome }) {
  const [partnerType, setPartnerType] = useState('all'); // 'all' | 'hospital' | 'diagnostic'
  const [hospitals, setHospitals] = useState([]);
  const [diagnosticCenters, setDiagnosticCenters] = useState([]);
  const [hospitalCategories, setHospitalCategories] = useState(HOSPITAL_CATEGORIES);
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
        const [hospData, dcData, catData] = await Promise.all([
          api.getHospitals({ location: selectedLocation }).catch(() => []),
          api.getDiagnosticCenters({ location: selectedLocation }).catch(() => []),
          api.getHospitalCategories().catch(() => [])
        ]);
        if (isMounted) {
          setHospitals(Array.isArray(hospData) && hospData.length > 0 ? hospData : HOSPITALS);
          setDiagnosticCenters(Array.isArray(dcData) && dcData.length > 0 ? dcData : DIAGNOSTIC_CENTERS);
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
        setHospitals(HOSPITALS);
        setDiagnosticCenters(DIAGNOSTIC_CENTERS);
        setLoading(false);
      }
    }

    loadData();
  }, [selectedLocation]);

  useEffect(() => {
    if (initialKeyword) {
      const str = initialKeyword.toLowerCase().trim();
      const catMatch = hospitalCategories.find(c => 
        c.id.toString().toLowerCase() === str || 
        c.name.toLowerCase().includes(str)
      );
      if (catMatch && catMatch.id !== 'all') {
        setSelectedCategory(catMatch.id);
        setSearchKeyword('');
      } else {
        setSelectedCategory('all');
        setSearchKeyword(initialKeyword);
      }
    }
  }, [initialKeyword, hospitalCategories]);

  // Reset area filter when location switches
  const handleLocationChange = (loc) => {
    setSelectedLocation(loc);
    setSelectedArea('All Areas');
  };

  // Combine or filter partners based on tab selection
  const allCombinedPartners = [
    ...hospitals.map(h => ({ ...h, type: 'Hospital', badge: h.badge || 'Verified Hospital' })),
    ...diagnosticCenters.map(d => ({ ...d, type: 'Diagnostic Center', badge: d.badge || 'Verified Diagnostic' }))
  ];

  const partnersToDisplay = partnerType === 'all' 
    ? allCombinedPartners 
    : partnerType === 'hospital' 
      ? allCombinedPartners.filter(p => p.type === 'Hospital')
      : allCombinedPartners.filter(p => p.type === 'Diagnostic Center');

  const filteredPartners = partnersToDisplay.filter(p => {
    // 1. Location (City / District) filter
    if (selectedLocation && selectedLocation !== 'All Bangladesh') {
      const pCity = (p.city || p.district || '').toLowerCase();
      if (pCity && !pCity.includes(selectedLocation.toLowerCase())) {
        return false;
      }
    }

    // 2. Area / Thana filter
    if (selectedLocation !== 'All Bangladesh' && selectedArea && selectedArea !== 'All Areas') {
      const locText = `${p.location || ''} ${p.address || ''} ${p.name || ''}`.toLowerCase();
      if (!locText.includes(selectedArea.toLowerCase())) {
        return false;
      }
    }

    // 3. Hospital Category filter
    if (selectedCategory && selectedCategory !== 'all' && selectedCategory !== 'All Categories') {
      const catKw = selectedCategory.toString().toLowerCase();
      const pCats = p.categories || [];
      const hasCatMatch = pCats.some(c => (c.id && c.id.toString().toLowerCase() === catKw) || (c.name && c.name.toLowerCase().includes(catKw)));
      const matchesName = p.name.toLowerCase().includes(catKw);
      if (!hasCatMatch && !matchesName) return false;
    }

    // 4. Keyword search
    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      const matchName = p.name.toLowerCase().includes(kw);
      const matchLoc = (p.location && p.location.toLowerCase().includes(kw)) || (p.address && p.address.toLowerCase().includes(kw));
      const matchCity = (p.city && p.city.toLowerCase().includes(kw)) || (p.district && p.district.toLowerCase().includes(kw));
      const matchTag = (p.tagline && p.tagline.toLowerCase().includes(kw));
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
                <span>Verified Hospitals & Diagnostic Network</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                Hospitals & Diagnostic Partners
              </h1>
              <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-2xl">
                Explore Bangladesh's top multi-specialty hospitals and automated diagnostic centers. View visiting doctor rosters, specialized services, and lab test packages.
              </p>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700 text-xs flex items-center gap-3 shrink-0">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
              <div>
                <div className="font-extrabold text-white">{filteredPartners.length} Active Medical Partners</div>
                <div className="text-slate-400">Hospitals & Diagnostic Labs</div>
              </div>
            </div>
          </div>

          {/* TYPE TOGGLE STRIP (Hospitals vs Diagnostic Centers) */}
          <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-2xl border border-slate-700 w-fit">
            <button
              onClick={() => setPartnerType('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                partnerType === 'all'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>All Partners ({allCombinedPartners.length})</span>
            </button>
            <button
              onClick={() => setPartnerType('hospital')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                partnerType === 'hospital'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Hospitals ({hospitals.length})</span>
            </button>
            <button
              onClick={() => setPartnerType('diagnostic')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                partnerType === 'diagnostic'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              <span>Diagnostic Centers ({diagnosticCenters.length})</span>
            </button>
          </div>

          {/* SEARCH & FILTER CONTROLS BAR */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-700/60">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-400" />
                <span>Search & Filter Controls</span>
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
        ) : filteredPartners.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 max-w-lg mx-auto">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No Medical Partners Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try resetting your search query, location, or partner category filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPartners.map((partner) => {
              const docCount = (partner.affiliated_doctors || partner.doctors || []).length;
              const testCount = (partner.offered_tests || partner.tests || []).length;
              return (
                <div
                  key={partner.id}
                  onClick={() => onSelectPartner(partner.id)}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-md hover:shadow-xl hover:border-emerald-400 transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    {/* Top Image */}
                    <div className="relative h-48 overflow-hidden bg-slate-900">
                      <img
                        src={partner.image || partner.logo || "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80"}
                        alt={partner.name}
                        className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <div className="inline-flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-emerald-500/40 text-emerald-400 text-xs font-extrabold px-3 py-1 rounded-full">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{partner.badge || partner.type}</span>
                        </div>
                        <div className="bg-slate-900/90 backdrop-blur-md text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-500/30 flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{partner.rating || 4.8} ({partner.reviews_count || partner.reviewsCount || 250})</span>
                        </div>
                      </div>

                      <div className="absolute bottom-3 left-4 right-4 text-white">
                        <h3 className="text-lg font-extrabold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-2">
                          <span>{partner.name}{partner.branch ? ` - ${partner.branch}` : ''}</span>
                          {partner.is_verified && (
                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                        </h3>
                        <p className="text-xs text-slate-300 font-medium line-clamp-1 mt-0.5">
                          {partner.tagline || partner.description}
                        </p>
                      </div>
                    </div>

                    {/* Details Strip */}
                    <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 space-y-2">
                      <div className="flex items-center gap-2 font-semibold text-slate-800">
                        <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate">{partner.address || partner.location || partner.district}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 pt-1">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{partner.open_timing || partner.openTiming || "24/7 Service"}</span>
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
                        {((partner.services && partner.services.length > 0 ? partner.services : [
                          "Specialist OPD Consultation",
                          "Automated Lab Testing",
                          "Radiology & Ultrasound"
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
                    <span>View Doctors, Tests & Book</span>
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
