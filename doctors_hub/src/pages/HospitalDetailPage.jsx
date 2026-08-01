import React, { useState, useEffect } from 'react';
import { 
  Building2, MapPin, Phone, Clock, ShieldCheck, Stethoscope, Calendar, CheckCircle, 
  Star, ArrowLeft, UserCheck, Activity, TestTube, ChevronRight, Award, Info, Sparkles, Filter, ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { OPD_CHAMBERS, PATHOLOGY_TESTS, BRANCH_TESTS } from '../data/mockData';

export default function HospitalDetailPage({ hospitalId, onBookDoctorSlot, onBookLabTest, onNavigateHome, onNavigateHospitals }) {
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('doctors'); // 'doctors' | 'services' | 'tests' | 'info'
  const [doctorConsultationFilter, setDoctorConsultationFilter] = useState('In-patient'); // Default to In-patient when searching hospital
  const [doctorSpecialtyFilter, setDoctorSpecialtyFilter] = useState('All');
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
      
      const foundMock = OPD_CHAMBERS.find(c => c.id === hospitalId) || OPD_CHAMBERS[0];
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
  
  // Filter doctors based on consultation_type (In-patient for hospital view, or OPD)
  const doctorsList = allDoctors.filter(doc => {
    if (doc.affiliations && doc.affiliations.length > 0) {
      return doc.affiliations.some(a => a.consultation_type === doctorConsultationFilter);
    }
    return true; // Fallback
  });

  const facilityBadges = hospital.facility_types && hospital.facility_types.length > 0
    ? hospital.facility_types
    : ["Hospital", "Diagnostic Center"];

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
                  {hospital.hospital_name || 'Verified Hospital'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-white">{hospital.name}</h1>

              <p className="text-sm text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{hospital.location} ({hospital.city})</span>
              </p>

              <div className="flex items-center gap-4 text-xs text-slate-300 pt-1">
                <span className="flex items-center gap-1 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  {hospital.openTiming || '08:00 AM - 10:00 PM'}
                </span>
                <span className="flex items-center gap-1 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  {hospital.contactPhone || '+880 9610-000000'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TABS NAVIGATION */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('doctors')}
            className={`px-5 py-3.5 font-extrabold text-xs border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'doctors'
                ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Doctors Roster ({filteredDoctors.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tests')}
            className={`px-5 py-3.5 font-extrabold text-xs border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'tests'
                ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <TestTube className="w-4 h-4" />
            <span>Available Diagnostic Tests ({branchTests.length})</span>
          </button>
        </div>
      </div>

      {/* 4. MAIN CONTENT BY TAB */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">

        {activeTab === 'doctors' && (
          <div className="space-y-6">
            
            {/* Filter controls: OPD vs In-patient tag */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Filter Consultation Tag:</span>
                <div className="inline-flex p-1 bg-slate-100 rounded-xl">
                  <button
                    onClick={() => setDoctorConsultationFilter('In-patient')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      doctorConsultationFilter === 'In-patient'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    In-patient Doctors
                  </button>
                  <button
                    onClick={() => setDoctorConsultationFilter('OPD')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      doctorConsultationFilter === 'OPD'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    OPD Chamber Doctors
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
                  No doctors currently registered with <strong>"{doctorConsultationFilter}"</strong> status for this branch. Try toggling between In-patient and OPD filters.
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
                            {doctorConsultationFilter} Doctor
                          </span>
                          <span className="text-xs font-bold text-slate-500">{doc.experience}</span>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900">{doc.name}</h3>

                        <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                          <Stethoscope className="w-3.5 h-3.5" />
                          {docSpecs}
                        </p>

                        <p className="text-xs text-slate-600 line-clamp-2">{doc.qualification}</p>

                        {/* Structured Schedules */}
                        {schedules.length > 0 ? (
                          <div className="pt-2 space-y-1">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Visiting Hours:</span>
                            {schedules.map((sch, i) => (
                              <div key={i} className="text-xs bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 flex items-center justify-between">
                                <span className="font-bold text-slate-700">{sch.day_of_week}</span>
                                <span className="text-slate-600 font-medium">{sch.start_time} - {sch.end_time}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 text-slate-600">
                            Visit Days: Sat, Mon, Wed (05:00 PM - 09:00 PM)
                          </div>
                        )}

                        {/* Clickable Slots */}
                        <div className="pt-2">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Select Time Slot:</span>
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
                          <span>Book Appointment</span>
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

        {activeTab === 'tests' && (
          <div className="space-y-6">
            <h2 className="text-lg font-extrabold text-slate-900">Diagnostic Tests Offered at {hospital.name}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {branchTests.map((bt) => {
                const testObj = bt.test_details || PATHOLOGY_TESTS[0];

                return (
                  <div key={bt.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded uppercase">
                        {typeof testObj.category === 'object' ? (testObj.category.name || 'Pathology Test') : (testObj.category || 'Pathology Test')}
                      </span>

                      <h3 className="text-base font-bold text-slate-900 mt-2">{testObj.name || 'Lab Test'}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{testObj.description}</p>

                      <div className="flex items-center gap-4 text-xs text-slate-600 mt-3">
                        <span className="font-semibold">Report Time: <strong className="text-slate-800">{bt.report_time || 'Same Day'}</strong></span>
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
          </div>
        )}
      </div>
    </div>
  );
}
