import React, { useState, useEffect } from 'react';
import { 
  Building2, MapPin, Phone, Clock, ShieldCheck, Stethoscope, Calendar, CheckCircle, 
  Star, ArrowLeft, UserCheck, Activity, TestTube, ChevronRight, Award, Info, Sparkles, Filter 
} from 'lucide-react';
import { api } from '../services/api';
import { OPD_CHAMBERS, PATHOLOGY_TESTS } from '../data/mockData';

export default function MedicalPartnerDetailPage({ partnerId, onBookDoctorSlot, onBookLabTest, onNavigateHome, onNavigatePartners }) {
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('doctors'); // 'doctors' | 'services' | 'tests' | 'info'
  const [doctorSpecialtyFilter, setDoctorSpecialtyFilter] = useState('All');

  useEffect(() => {
    let isMounted = true;
    async function loadPartner() {
      setLoading(true);
      try {
        const data = await api.getChamberById(partnerId);
        if (isMounted && data && data.id) {
          setPartner(data);
          setLoading(false);
          return;
        }
      } catch {
        // Fallback to local mock data if API fails or offline
      }
      
      const foundMock = OPD_CHAMBERS.find(c => c.id === partnerId) || OPD_CHAMBERS[0];
      if (isMounted) {
        setPartner(foundMock);
        setLoading(false);
      }
    }
    loadPartner();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => { isMounted = false; };
  }, [partnerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-600">Loading Medical Partner Details...</p>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md">
          <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800">Medical Partner Not Found</h2>
          <p className="text-xs text-slate-500 mt-2 mb-6">
            The requested medical partner chamber could not be loaded.
          </p>
          <button
            onClick={onNavigatePartners || onNavigateHome}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-md hover:bg-emerald-700 transition-all"
          >
            Return to Medical Partners
          </button>
        </div>
      </div>
    );
  }

  const doctorsList = partner.doctors || [];
  const servicesList = partner.services && partner.services.length > 0 
    ? partner.services 
    : [
        "24/7 Specialist OPD Consultation",
        "Digital Diagnostic Radiology & X-Ray",
        "4D Ultrasonography & Color Doppler",
        "Automated Pathology & Biochemistry",
        "Emergency Ambulance & Pharmacy Service"
      ];

  const specialties = ['All', ...new Set(doctorsList.map(d => d.specialty || d.specialty_details?.name).filter(Boolean))];

  const filteredDoctors = doctorSpecialtyFilter === 'All' 
    ? doctorsList 
    : doctorsList.filter(d => (d.specialty || d.specialty_details?.name) === doctorSpecialtyFilter);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      
      {/* 1. TOP BREADCRUMB & BACK STRIP */}
      <div className="bg-slate-900 text-slate-300 py-3 px-4 sm:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button 
              onClick={onNavigatePartners || onNavigateHome}
              className="flex items-center gap-1 hover:text-emerald-400 font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Medical Partners</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-slate-100 font-bold truncate max-w-[200px] sm:max-w-xs">{partner.name}</span>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] bg-slate-800 text-emerald-400 px-2.5 py-1 rounded-full border border-slate-700 font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            Verified Medical Center
          </span>
        </div>
      </div>

      {/* 2. HERO PARTNER BANNER */}
      <div className="relative bg-slate-950 text-white overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0">
          <img 
            src={partner.image} 
            alt={partner.name} 
            className="w-full h-full object-cover opacity-25 filter blur-xs"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            
            <div className="space-y-4 max-w-3xl">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-1 rounded-full font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  {partner.badge || "Verified Partner"}
                </span>
                <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {partner.rating || 4.9} ({partner.reviews_count || partner.reviewsCount || 250}+ Patient Reviews)
                </span>
                <span className="bg-slate-800/90 text-slate-300 px-3 py-1 rounded-full font-semibold border border-slate-700">
                  {partner.city}
                </span>
              </div>

              {/* Title & Tagline */}
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight flex items-center gap-3 flex-wrap">
                  <span>{partner.name}</span>
                  {partner.verified && (
                    <CheckCircle className="w-8 h-8 text-emerald-400 shrink-0" />
                  )}
                </h1>
                <p className="mt-2 text-slate-300 text-sm sm:text-base font-medium">
                  {partner.tagline || "Leading Multispecialty OPD & Diagnostic Center in Bangladesh"}
                </p>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-300">
                <div className="flex items-center gap-2.5 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="line-clamp-2">{partner.location}</span>
                </div>
                <div className="flex items-center gap-2.5 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{partner.open_timing || partner.openTiming}</span>
                </div>
                <div className="flex items-center gap-2.5 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">{partner.contact_phone || partner.contactPhone}</span>
                </div>
              </div>
            </div>

            {/* Right Header Action Card */}
            <div className="bg-slate-900/90 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4 shrink-0 lg:w-80">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Partner Status</span>
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  Active Roster
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 text-slate-300">
                  <span>Visiting Specialists:</span>
                  <span className="font-bold text-white">{doctorsList.length} Doctors</span>
                </div>
                <div className="flex justify-between py-1 text-slate-300">
                  <span>Diagnostic Facilities:</span>
                  <span className="font-bold text-white">{servicesList.length} Services</span>
                </div>
                <div className="flex justify-between py-1 text-slate-300">
                  <span>Direct Token Gen:</span>
                  <span className="font-bold text-emerald-400">Available</span>
                </div>
              </div>

              <a
                href={`tel:${(partner.contact_phone || partner.contactPhone || '').split('/')[0].trim()}`}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span>Call Center Hotline</span>
              </a>
            </div>

          </div>
        </div>
      </div>

      {/* 3. NAVIGATION TABS BAR */}
      <div className="sticky top-20 z-30 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex items-center gap-2 sm:gap-6 overflow-x-auto no-scrollbar py-3">
            
            <button
              onClick={() => setActiveTab('doctors')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'doctors'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Visiting Doctors ({doctorsList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('services')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'services'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Medical & Diagnostic Services</span>
            </button>

            <button
              onClick={() => setActiveTab('tests')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'tests'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <TestTube className="w-4 h-4" />
              <span>Pathology & Lab Tests</span>
            </button>

            <button
              onClick={() => setActiveTab('info')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'info'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>About Partner</span>
            </button>

          </div>
        </div>
      </div>

      {/* 4. MAIN CONTENT CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">

        {/* TAB 1: VISITING DOCTORS */}
        {activeTab === 'doctors' && (
          <div className="space-y-6">
            
            {/* Doctors Header & Specialty Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Visiting Specialist Doctors
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  View visiting schedules and generate instant OPD appointment serial tokens.
                </p>
              </div>

              {/* Specialty Filter Dropdown */}
              {specialties.length > 2 && (
                <div className="flex items-center gap-2 text-xs">
                  <Filter className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-700">Filter Specialty:</span>
                  <select
                    value={doctorSpecialtyFilter}
                    onChange={(e) => setDoctorSpecialtyFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-800 focus:outline-none focus:border-emerald-500 shadow-xs"
                  >
                    {specialties.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Doctors List */}
            {filteredDoctors.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 max-w-md mx-auto my-8">
                <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No Doctors Found for filter</h3>
                <button 
                  onClick={() => setDoctorSpecialtyFilter('All')}
                  className="mt-3 text-xs font-bold text-emerald-600 hover:underline"
                >
                  Clear Specialty Filter
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredDoctors.map((doc) => {
                  const specName = doc.specialty_details?.name || doc.specialty || 'Specialist';
                  return (
                    <div
                      key={doc.id}
                      className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-base shrink-0 border border-emerald-300">
                              {doc.name.split(' ').slice(-1)[0][0]}
                            </div>
                            <div>
                              <h3 className="font-extrabold text-slate-900 text-base">
                                {doc.name}
                              </h3>
                              <span className="inline-block text-[11px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200 mt-1">
                                {specName}
                              </span>
                              <p className="text-xs text-slate-500 font-medium mt-1">
                                {doc.qualification}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{doc.visit_days || doc.visitDays}</span>
                            </span>
                            <span className="flex items-center gap-1 text-slate-600">
                              <Clock className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{doc.visit_time || doc.visitTime}</span>
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                            <span className="text-slate-500">Experience: {doc.experience}</span>
                            <span className="font-extrabold text-emerald-700 text-sm">
                              Fee: ৳{doc.fee}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">Instant Chamber Token</span>
                        <button
                          onClick={() => onBookDoctorSlot(partner, doc)}
                          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                        >
                          <span>Book Serial</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MEDICAL SERVICES */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-200">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Medical & Clinical Diagnostic Facilities
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Comprehensive healthcare, radiology, and diagnostic services provided at {partner.name}.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {servicesList.map((service, index) => (
                <div
                  key={index}
                  className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-emerald-400 hover:shadow-md transition-all flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{service}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Available with verified precision & high-tech medical standard at this center.
                    </p>
                    <div className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle className="w-3 h-3" />
                      <span>Operational</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PATHOLOGY & LAB TESTS */}
        {activeTab === 'tests' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-200">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Pathology & Clinical Diagnostic Tests
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Standardized diagnostic tests available at {partner.name} with online home pickup option.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {PATHOLOGY_TESTS.map((test) => (
                <div
                  key={test.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-400 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                        {test.category}
                      </span>
                      {test.discount && (
                        <span className="text-[10px] font-black bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
                          {test.discount}
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-base">{test.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{test.description}</p>
                    
                    <div className="pt-2 text-xs text-slate-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Report Time:</span>
                        <span className="font-semibold text-slate-800">{test.reportTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fasting Required:</span>
                        <span className={`font-semibold ${test.fastingRequired ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {test.fastingRequired ? 'Yes (8 Hours)' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-base font-black text-emerald-700">৳{test.price}</span>
                      {test.originalPrice && (
                        <span className="text-xs text-slate-400 line-through ml-1.5">৳{test.originalPrice}</span>
                      )}
                    </div>
                    <button
                      onClick={() => onBookLabTest(test)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all"
                    >
                      Book Test
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ABOUT PARTNER INFO */}
        {activeTab === 'info' && (
          <div className="space-y-6 max-w-4xl">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-2xs space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 mb-2">About {partner.name}</h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {partner.description || `${partner.name} is a premier multispecialty OPD and clinical diagnostic center in ${partner.city}. Equipped with state-of-the-art medical radiology, automated pathological laboratories, highly qualified visiting specialists, and dedicated patient care services.`}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-xs">
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>Location & Address</span>
                  </h3>
                  <p className="text-slate-600 font-medium pl-5">{partner.location}</p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>Operating Hours</span>
                  </h3>
                  <p className="text-slate-600 font-medium pl-5">{partner.open_timing || partner.openTiming}</p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span>Contact Hotline</span>
                  </h3>
                  <p className="text-slate-600 font-medium pl-5">{partner.contact_phone || partner.contactPhone}</p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>Verification Badge</span>
                  </h3>
                  <p className="text-emerald-700 font-bold pl-5 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Verified DoctorHub Medical Partner</span>
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
