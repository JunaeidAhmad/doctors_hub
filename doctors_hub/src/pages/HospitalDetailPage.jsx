import React, { useState, useEffect } from 'react';
import { 
  Building2, MapPin, Phone, Clock, ShieldCheck, Stethoscope, Calendar, CheckCircle, 
  Star, ArrowLeft, UserCheck, Activity, TestTube, ChevronRight, Award, Info, Sparkles, Filter, ArrowRight, Search, AlertCircle, HeartPulse, Eye, FlaskConical
} from 'lucide-react';
import { api } from '../services/api';
import { DOCTOR_CHAMBERS, PATHOLOGY_TESTS, BRANCH_TESTS, HOSPITAL_SERVICES } from '../data/mockData';

export default function HospitalDetailPage({ hospitalId, onBookDoctorSlot, onBookLabTest, onNavigateHome, onNavigateHospitals }) {
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('doctors'); // Default tab: 'doctors' (Doctor Chamber) | 'services' | 'diagnostic'
  const [doctorConsultationFilter, setDoctorConsultationFilter] = useState('Doctor'); // Default to Doctor Chamber
  const [doctorSpecialtyFilter, setDoctorSpecialtyFilter] = useState('All');
  const [testSearch, setTestSearch] = useState('');
  const [testCategoryFilter, setTestCategoryFilter] = useState('All');
  const [branchTests, setBranchTests] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState({});

  useEffect(() => {
    let isMounted = true;
    async function loadHospital() {
      setLoading(true);
      try {
        const data = await api.getBranchById(hospitalId);
        if (isMounted && data && data.id) {
          setHospital(data);
          if (data.offered_tests && data.offered_tests.length > 0) {
            setBranchTests(data.offered_tests);
          }
          setLoading(false);
          return;
        }
      } catch {
        // Fallback to local mock data
      }
      
      const foundMock = DOCTOR_CHAMBERS.find(c => c.id === hospitalId) || DOCTOR_CHAMBERS[0];
      if (isMounted) {
        setHospital(foundMock);
        // Fallback branch tests for mock
        const filteredMockTests = BRANCH_TESTS.filter(bt => bt.branch_id === hospitalId || bt.branch_id === foundMock.id);
        setBranchTests(filteredMockTests.length > 0 ? filteredMockTests : BRANCH_TESTS);
        setLoading(false);
      }
    }
    loadHospital();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => { isMounted = false; };
  }, [hospitalId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-600">Loading Hospital Branch Details...</p>
        </div>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md">
          <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800">Hospital Not Found</h2>
          <p className="text-xs text-slate-500 mt-2 mb-6">
            The requested hospital branch could not be loaded.
          </p>
          <button
            onClick={onNavigateHospitals || onNavigateHome}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-md hover:bg-emerald-700 transition-all"
          >
            Return to Hospitals
          </button>
        </div>
      </div>
    );
  }

  const allDoctors = hospital.doctors || [];
  
  // Filter doctors based on consultation_type
  const doctorsList = allDoctors.filter(doc => {
    if (doc.affiliations && doc.affiliations.length > 0) {
      return doc.affiliations.some(a => !a.consultation_type || a.consultation_type === doctorConsultationFilter || (doctorConsultationFilter === 'Doctor' && a.consultation_type === 'OPD'));
    }
    return true;
  });

  const facilityBadges = hospital.facility_types && hospital.facility_types.length > 0
    ? hospital.facility_types
    : [hospital.type || "Hospital", hospital.has_diagnostic_center !== false ? "Diagnostic Center Available" : "OPD Chambers"];

  const specialties = ['All', ...new Set(doctorsList.map(d => {
    if (Array.isArray(d.specialties)) return d.specialties.map(s => s.name || s).join(', ');
    return d.specialty || d.specialty_details?.name;
  }).filter(Boolean))];

  const filteredDoctors = doctorSpecialtyFilter === 'All' 
    ? doctorsList 
    : doctorsList.filter(d => {
        const specName = Array.isArray(d.specialties) 
          ? d.specialties.map(s => s.name || s).join(', ')
          : (d.specialty || d.specialty_details?.name || '');
        return specName.includes(doctorSpecialtyFilter);
      });

  const handleSelectSlot = (docId, slotTime) => {
    setSelectedSlots(prev => ({
      ...prev,
      [docId]: slotTime
    }));
  };

  // Hospital services list normalized
  const hospitalServicesList = hospital.services && hospital.services.length > 0
    ? hospital.services.map(s => {
        if (typeof s === 'string') return { name: s, description: 'Comprehensive clinical service provided by the hospital.', icon: 'Activity' };
        return { name: s.name || s.title, description: s.description || 'Quality patient care and specialized medical procedures.', icon: s.icon || 'Activity' };
      })
    : [
        { name: "24/7 ICU & In-patient Care", description: "Round-the-clock intensive care unit with advanced life support and bed admission.", icon: "Activity" },
        { name: "Specialist Doctor Chambers", description: "Outpatient consultant chambers featuring senior multi-specialty professors.", icon: "Stethoscope" },
        { name: "Modular Operation Theater", description: "State-of-the-art surgery suite equipped for laparoscopic and complex procedures.", icon: "ShieldCheck" },
        { name: "24/7 Emergency & Ambulance", description: "Immediate trauma care, emergency triage, and fully equipped ICU ambulance service.", icon: "Clock" },
        { name: "Specialized Maternity Suite", description: "Comprehensive prenatal, birthing center, and neonatal intensive care (NICU).", icon: "HeartPulse" }
      ];

  // Internal diagnostic center check
  const hasDiagnosticCenter = hospital.has_diagnostic_center !== false && (branchTests.length > 0 || (hospital.categories && hospital.categories.some(c => (c.name || c).toLowerCase().includes('diagnostic'))));

  // Filtered diagnostic tests
  const testCategories = ['All', ...new Set(branchTests.map(bt => {
    const tObj = bt.test_details || {};
    return typeof tObj.category === 'object' ? (tObj.category.name || 'General') : (tObj.category || 'General');
  }))];

  const filteredTests = branchTests.filter(bt => {
    const tObj = bt.test_details || {};
    const tName = tObj.name || '';
    const tCat = typeof tObj.category === 'object' ? (tObj.category.name || '') : (tObj.category || '');
    const matchesSearch = tName.toLowerCase().includes(testSearch.toLowerCase()) || tCat.toLowerCase().includes(testSearch.toLowerCase());
    const matchesCategory = testCategoryFilter === 'All' || tCat === testCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      
      {/* 1. TOP BREADCRUMB & BACK STRIP */}
      <div className="bg-slate-900 text-slate-300 py-3 px-4 sm:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button 
              onClick={onNavigateHospitals || onNavigateHome}
              className="flex items-center gap-1 hover:text-emerald-400 font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Hospitals</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-slate-100 font-bold truncate max-w-[200px] sm:max-w-xs">{hospital.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {facilityBadges.map((badge) => (
              <span key={badge} className="inline-flex items-center gap-1 text-[11px] bg-slate-800 text-emerald-400 px-2.5 py-0.5 rounded-full border border-slate-700 font-bold">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 2. HERO HOSPITAL BANNER */}
      <div className="relative bg-slate-950 text-white overflow-hidden border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
                  {hospital.badge || hospital.hospital_name || 'Verified Hospital'}
                </span>
                {hasDiagnosticCenter && (
                  <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-500/30 flex items-center gap-1">
                    <FlaskConical className="w-3 h-3" />
                    Internal Diagnostic Center
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-white">{hospital.name}</h1>

              <p className="text-sm text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{hospital.location || hospital.address} ({hospital.city || hospital.district})</span>
              </p>

              <div className="flex items-center gap-4 text-xs text-slate-300 pt-1">
                <span className="flex items-center gap-1 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  {hospital.openTiming || hospital.open_timing || '24/7 Emergency & Doctor Services'}
                </span>
                <span className="flex items-center gap-1 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  {hospital.phone || hospital.contactPhone || '+880 9610-000000'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TABS NAVIGATION */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center gap-2 overflow-x-auto">
          {/* Tab 1: Doctor Chamber */}
          <button
            onClick={() => setActiveTab('doctors')}
            className={`px-5 py-3.5 font-extrabold text-xs border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'doctors'
                ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Doctor Chamber ({filteredDoctors.length})</span>
          </button>

          {/* Tab 2: Services */}
          <button
            onClick={() => setActiveTab('services')}
            className={`px-5 py-3.5 font-extrabold text-xs border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'services'
                ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Services ({hospitalServicesList.length})</span>
          </button>

          {/* Tab 3: Diagnostic Center */}
          <button
            onClick={() => setActiveTab('diagnostic')}
            className={`px-5 py-3.5 font-extrabold text-xs border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'diagnostic'
                ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <TestTube className="w-4 h-4" />
            <span>Diagnostic Center {hasDiagnosticCenter ? `(${branchTests.length})` : '(N/A)'}</span>
          </button>
        </div>
      </div>

      {/* 4. MAIN CONTENT BY TAB */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">

        {/* TAB 1: DOCTOR CHAMBER */}
        {activeTab === 'doctors' && (
          <div className="space-y-6">
            
            {/* Filter controls */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Filter Chamber Category:</span>
                <div className="inline-flex p-1 bg-slate-100 rounded-xl">
                  <button
                    onClick={() => setDoctorConsultationFilter('Doctor')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      doctorConsultationFilter === 'Doctor'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Doctor Chamber
                  </button>
                  <button
                    onClick={() => setDoctorConsultationFilter('In-patient')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      doctorConsultationFilter === 'In-patient'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    In-patient Specialists
                  </button>
                </div>
              </div>

              {/* Specialty filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Specialty:</span>
                <select
                  value={doctorSpecialtyFilter}
                  onChange={(e) => setDoctorSpecialtyFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  {specialties.map((spec) => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
            </div>

            {filteredDoctors.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
                <Stethoscope className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-lg font-bold text-slate-800">No {doctorConsultationFilter} Doctors Listed</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  No doctors currently registered under <strong>"{doctorConsultationFilter}"</strong> status for this branch. Try toggling between Doctor Chamber and In-patient filters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredDoctors.map((doc) => {
                  const docSpecs = Array.isArray(doc.specialties) 
                    ? doc.specialties.map(s => s.name || s).join(', ')
                    : (doc.specialty || doc.specialty_details?.name || 'Specialist Doctor');
                  
                  const affiliation = (doc.affiliations || []).find(a => a.consultation_type === doctorConsultationFilter) || {};
                  const fee = affiliation.fee || doc.fee || 1200;
                  const schedules = affiliation.schedules || [];
                  const slots = ['09:00 AM', '10:00 AM', '11:30 AM', '04:00 PM', '05:30 PM'];
                  const selectedSlot = selectedSlots[doc.id] || slots[0];

                  return (
                    <div key={doc.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-colors">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            doctorConsultationFilter === 'In-patient' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {doctorConsultationFilter === 'Doctor' ? 'Chamber Doctor' : 'In-patient Specialist'}
                          </span>
                          <span className="text-xs font-bold text-slate-500">{doc.experience || '10+ Years Exp'}</span>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900">{doc.name}</h3>

                        <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                          <Stethoscope className="w-3.5 h-3.5" />
                          {docSpecs}
                        </p>

                        <p className="text-xs text-slate-600 line-clamp-2">{doc.qualification || 'MBBS, Specialist'}</p>

                        {/* Structured Schedules */}
                        {schedules.length > 0 ? (
                          <div className="pt-2 space-y-1">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Chamber Visiting Hours:</span>
                            {schedules.map((sch, i) => (
                              <div key={i} className="text-xs bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 flex items-center justify-between">
                                <span className="font-bold text-slate-700">{sch.day_of_week}</span>
                                <span className="text-slate-600 font-medium">{sch.start_time} - {sch.end_time}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 text-slate-600">
                            Visit Days: {doc.visitDays || 'Sat, Mon, Wed'} ({doc.visitTime || '05:00 PM - 09:00 PM'})
                          </div>
                        )}

                        {/* Clickable Slots */}
                        <div className="pt-2">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Select Chamber Slot:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {slots.map((sTime) => (
                              <button
                                key={sTime}
                                onClick={() => handleSelectSlot(doc.id, sTime)}
                                className={`px-2 py-1 rounded text-xs font-semibold border transition-all ${
                                  selectedSlot === sTime
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400'
                                }`}
                              >
                                {sTime}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="text-[11px] text-slate-500">Consultation Fee</div>
                          <div className="text-xl font-black text-slate-900">{fee} BDT</div>
                        </div>

                        <button
                          onClick={() => onBookDoctorSlot && onBookDoctorSlot({
                            doctor: doc,
                            chamber: hospital,
                            slot: selectedSlot,
                            fee: fee
                          })}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-xs hover:bg-emerald-700 transition-all flex items-center gap-1.5"
                        >
                          <span>Book Chamber Appointment</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SERVICES */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="bg-emerald-900 text-white p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">Medical Services & Facilities</h2>
                <p className="text-xs text-emerald-200 mt-1 max-w-xl">
                  {hospital.name} provides multi-specialty clinical care, 24/7 critical emergency units, advanced diagnostics, and inpatient surgical facilities.
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-800 text-emerald-200 text-xs font-bold rounded-full border border-emerald-700 shrink-0">
                Verified Medical Provider
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hospitalServicesList.map((srv, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-emerald-400 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Activity className="w-5 h-5" />
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{srv.name}</h3>

                  <p className="text-xs text-slate-600 leading-relaxed">{srv.description}</p>

                  <div className="pt-2 flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Available at {hospital.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: DIAGNOSTIC CENTER */}
        {activeTab === 'diagnostic' && (
          <div className="space-y-6">
            {hasDiagnosticCenter ? (
              <>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">Internal Diagnostic Center & Tests</h2>
                    <p className="text-xs text-slate-500">
                      Book pathology lab tests and diagnostic imaging directly at {hospital.name}.
                    </p>
                  </div>

                  {/* Search and Category Filter */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search lab tests..."
                        value={testSearch}
                        onChange={(e) => setTestSearch(e.target.value)}
                        className="pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 w-48 sm:w-64 font-semibold text-slate-800"
                      />
                    </div>

                    <select
                      value={testCategoryFilter}
                      onChange={(e) => setTestCategoryFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                    >
                      {testCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {filteredTests.length === 0 ? (
                  <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
                    <TestTube className="w-12 h-12 text-slate-300 mx-auto" />
                    <h3 className="text-base font-bold text-slate-800">No Tests Found</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      No diagnostic tests matched your search query or filter. Try searching for other test names like CBC, MRI, or Blood Sugar.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTests.map((bt) => {
                      const testObj = bt.test_details || PATHOLOGY_TESTS[0];

                      return (
                        <div key={bt.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-colors">
                          <div>
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded uppercase">
                              {typeof testObj.category === 'object' ? (testObj.category.name || 'Test') : (testObj.category || 'Test')}
                            </span>

                            <h3 className="text-base font-bold text-slate-900 mt-2">{testObj.name || 'Lab Test'}</h3>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{testObj.description}</p>

                            <div className="flex items-center gap-4 text-xs text-slate-600 mt-3">
                              <span className="font-semibold">Report Time: <strong className="text-slate-800">{bt.report_time || 'Same Day'}</strong></span>
                              {bt.home_sample_collection && (
                                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">Home Sample Available</span>
                              )}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                            <div>
                              <span className="text-lg font-black text-emerald-600">{bt.price} BDT</span>
                              {bt.original_price && (
                                <span className="text-xs text-slate-400 line-through ml-2">{bt.original_price} BDT</span>
                              )}
                            </div>

                            <button
                              onClick={() => onBookLabTest && onBookLabTest({
                                test: testObj,
                                branchTest: bt,
                                branch: hospital
                              })}
                              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors"
                            >
                              Book Test
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              /* Notice when Internal Diagnostic Center is NOT available */
              <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-8 text-center max-w-2xl mx-auto space-y-4">
                <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
                  <AlertCircle className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-amber-900">No Internal Diagnostic Center Available</h3>
                  <p className="text-xs text-amber-700 max-w-md mx-auto leading-relaxed">
                    This hospital branch provides outpatient doctor chambers and inpatient clinical care, but does not operate an internal diagnostic center for direct lab test bookings.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={onNavigateHospitals || onNavigateHome}
                    className="px-5 py-2.5 bg-amber-700 text-white rounded-xl text-xs font-bold hover:bg-amber-800 transition-all shadow-xs"
                  >
                    Browse Nearby Diagnostic Centers
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
