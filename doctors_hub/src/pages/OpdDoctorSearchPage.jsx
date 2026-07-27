import React, { useState, useMemo, useEffect } from 'react';
import { Stethoscope, MapPin, Filter, ArrowLeft, Building2, ShieldCheck, Calendar, Clock, ArrowRight, X, Heart, Award } from 'lucide-react';
import { SPECIALTIES as MOCK_SPECIALTIES, LOCATIONS, OPD_CHAMBERS as MOCK_CHAMBERS } from '../data/mockData';
import { api } from '../services/api';

export default function OpdDoctorSearchPage({
  initialSpecialty = '',
  initialLocation = 'All Bangladesh',
  initialKeyword = '',
  onBookDoctorSlot,
  onSelectPartner,
  onNavigateHome
}) {
  const [specialty, setSpecialty] = useState(initialSpecialty);
  const [location, setLocation] = useState(initialLocation);
  const [keyword, setKeyword] = useState(initialKeyword);
  const [maxFee, setMaxFee] = useState(2000);
  const [selectedDay, setSelectedDay] = useState('All');

  const [chambers, setChambers] = useState(MOCK_CHAMBERS);
  const [specialties, setSpecialties] = useState(MOCK_SPECIALTIES);
  const [doctors, setDoctors] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState({});

  useEffect(() => {
    let isMounted = true;

    // Fetch OPD doctors specifically
    api.getDoctors({ consultation_type: 'OPD' })
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setDoctors(data);
        }
      })
      .catch(() => {});

    api.getBranches({ location })
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setChambers(data);
        }
      })
      .catch(() => {});

    api.getSpecialties()
      .then((data) => {
        if (isMounted && data && data.length > 0) setSpecialties(data);
      })
      .catch(() => {});

    return () => { isMounted = false; };
  }, [location]);

  // Combine doctor affiliations with chambers for OPD display
  const opdChambersList = useMemo(() => {
    if (doctors.length > 0) {
      // Build chamber map from doctors' OPD affiliations
      const map = {};
      doctors.forEach((doc) => {
        const affiliations = (doc.affiliations || []).filter(a => a.consultation_type === 'OPD');
        affiliations.forEach((aff) => {
          const bId = aff.branch_id || aff.branch || 'general-branch';
          if (!map[bId]) {
            map[bId] = {
              id: bId,
              name: aff.branch_name || 'Medical Center OPD',
              city: aff.city || 'Dhaka',
              location: aff.branch_name || 'Main Location',
              verified: true,
              rating: 4.9,
              doctors: []
            };
          }
          map[bId].doctors.push({
            ...doc,
            affiliationId: aff.id,
            fee: aff.fee || doc.fee || 1000,
            schedules: aff.schedules || [],
            branchName: aff.branch_name,
            visitDays: aff.schedules && aff.schedules.length > 0 
              ? aff.schedules.map(s => s.day_of_week).join(', ') 
              : 'Sat, Mon, Wed',
            visitTime: aff.schedules && aff.schedules.length > 0 
              ? `${aff.schedules[0].start_time} - ${aff.schedules[0].end_time}` 
              : '05:00 PM - 09:00 PM',
            slots: ['05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM']
          });
        });
      });
      const list = Object.values(map);
      if (list.length > 0) return list;
    }
    return chambers;
  }, [doctors, chambers]);

  // Filter logic
  const filteredChambers = useMemo(() => {
    return opdChambersList.map((chamber) => {
      const matchingDoctors = (chamber.doctors || []).filter((doc) => {
        // Specialty match (array of specialties or single)
        const docSpecs = Array.isArray(doc.specialties) 
          ? doc.specialties.map(s => s.name || s)
          : [doc.specialty || doc.specialty_details?.name || ''];

        if (specialty && !docSpecs.some(s => s.toLowerCase().includes(specialty.toLowerCase()))) {
          return false;
        }

        // Fee match
        if (doc.fee > maxFee) {
          return false;
        }

        // Day match
        if (selectedDay !== 'All') {
          const vDays = doc.visitDays || '';
          if (!vDays.toLowerCase().includes(selectedDay.toLowerCase()) && !vDays.toLowerCase().includes('everyday')) {
            return false;
          }
        }

        // Keyword match
        if (keyword.trim()) {
          const q = keyword.toLowerCase();
          const matchesDoc = doc.name.toLowerCase().includes(q) || 
            (doc.qualification && doc.qualification.toLowerCase().includes(q)) || 
            docSpecs.some(s => s.toLowerCase().includes(q));
          const matchesChamber = chamber.name.toLowerCase().includes(q) || (chamber.location && chamber.location.toLowerCase().includes(q));
          if (!matchesDoc && !matchesChamber) return false;
        }
        return true;
      });

      if (location !== 'All Bangladesh' && chamber.city !== location) {
        return null;
      }

      if ((specialty || keyword) && matchingDoctors.length === 0) {
        return null;
      }

      return {
        ...chamber,
        doctors: matchingDoctors
      };
    }).filter(Boolean);
  }, [opdChambersList, specialty, location, keyword, maxFee, selectedDay]);

  const totalMatchingDoctors = useMemo(() => {
    return filteredChambers.reduce((acc, c) => acc + c.doctors.length, 0);
  }, [filteredChambers]);

  const handleSelectSlot = (docId, slotTime) => {
    setSelectedSlots(prev => ({
      ...prev,
      [docId]: slotTime
    }));
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      
      {/* Search Header Banner */}
      <div className="bg-slate-900 text-white pt-8 pb-12 px-4 sm:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto">
          
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Dedicated OPD Doctor Search</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">
                {specialty ? `${specialty} OPD Doctors` : 'OPD Visiting Specialist Doctors'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Showing <strong className="text-emerald-400">{totalMatchingDoctors} OPD visiting doctors</strong> across <strong className="text-emerald-400">{filteredChambers.length} chambers/branches</strong> in {location}.
              </p>
            </div>

            {/* Quick Search Controls Bar */}
            <div className="bg-slate-800/90 border border-slate-700/80 p-3 rounded-2xl flex flex-wrap sm:flex-nowrap items-center gap-2 max-w-xl w-full">
              <div className="relative flex-1 min-w-[140px]">
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full bg-slate-900 text-white text-xs font-semibold border border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">All Specialties</option>
                  {specialties.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="relative flex-1 min-w-[130px]">
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-900 text-white text-xs font-semibold border border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
                >
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Doctor / chamber..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full bg-slate-900 text-white text-xs border border-slate-700 rounded-xl px-3 py-2.5 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Results Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
        
        {/* Filters & Results Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Sidebar Filter Controls */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-emerald-600" />
                  Refine Search
                </h3>
                {(specialty || location !== 'All Bangladesh' || keyword || selectedDay !== 'All') && (
                  <button
                    onClick={() => {
                      setSpecialty('');
                      setLocation('All Bangladesh');
                      setKeyword('');
                      setSelectedDay('All');
                      setMaxFee(2000);
                    }}
                    className="text-[11px] font-semibold text-rose-500 hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Day filter */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Available Day</label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {['All', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`py-1.5 rounded-lg border font-semibold text-center transition-all ${
                        selectedDay === day
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fee filter */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <label className="font-bold text-slate-700">Max Fee (BDT)</label>
                  <span className="font-bold text-emerald-600">{maxFee} BDT</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="3000"
                  step="100"
                  value={maxFee}
                  onChange={(e) => setMaxFee(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Right Doctor Cards Container */}
          <div className="lg:col-span-3 space-y-6">
            {filteredChambers.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
                <Stethoscope className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-lg font-bold text-slate-800">No OPD Doctors Found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  We couldn't find OPD specialist doctors matching your selected criteria. Try adjusting your specialty or location filters.
                </p>
              </div>
            ) : (
              filteredChambers.map((chamber) => (
                <div key={chamber.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow">
                  {/* Chamber Header */}
                  <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between flex-wrap gap-2 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <h2 
                          onClick={() => onSelectPartner && onSelectPartner(chamber.id)}
                          className="font-extrabold text-white text-base hover:text-emerald-400 cursor-pointer transition-colors"
                        >
                          {chamber.name}
                        </h2>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          {chamber.location} ({chamber.city})
                        </p>
                      </div>
                    </div>

                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full font-bold border border-emerald-500/30">
                      OPD Facility
                    </span>
                  </div>

                  {/* Doctor List under Chamber */}
                  <div className="divide-y divide-slate-100">
                    {chamber.doctors.map((doc) => {
                      const docSpecs = Array.isArray(doc.specialties) 
                        ? doc.specialties.map(s => s.name || s).join(', ')
                        : (doc.specialty || doc.specialty_details?.name || 'Specialist Doctor');
                      
                      const selectedSlot = selectedSlots[doc.id] || doc.slots[0];

                      return (
                        <div key={doc.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/60 transition-colors">
                          
                          {/* Doctor Profile Info */}
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[10px] uppercase tracking-wider">
                                OPD Doctor
                              </span>
                              <span className="text-xs font-bold text-slate-500">{doc.experience}</span>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                              {doc.name}
                            </h3>

                            <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                              <Stethoscope className="w-3.5 h-3.5" />
                              {docSpecs}
                            </p>

                            <p className="text-xs text-slate-600 line-clamp-2 max-w-xl">
                              {doc.qualification}
                            </p>

                            {/* Schedule & Timing details */}
                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-2">
                              <span className="flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                Days: {doc.visitDays}
                              </span>
                              <span className="flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                {doc.visitTime}
                              </span>
                            </div>

                            {/* Clickable Time Slots */}
                            <div className="pt-2">
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                Select Visiting Slot:
                              </label>
                              <div className="flex flex-wrap gap-1.5">
                                {doc.slots.map((slotTime) => (
                                  <button
                                    key={slotTime}
                                    onClick={() => handleSelectSlot(doc.id, slotTime)}
                                    className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                                      selectedSlot === slotTime
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs scale-105'
                                        : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400'
                                    }`}
                                  >
                                    {slotTime}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Fee & Action */}
                          <div className="md:text-right shrink-0 space-y-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                            <div>
                              <div className="text-xs text-slate-500">OPD Consultation Fee</div>
                              <div className="text-2xl font-black text-slate-900">{doc.fee} BDT</div>
                            </div>

                            <button
                              onClick={() => onBookDoctorSlot && onBookDoctorSlot({
                                doctor: doc,
                                chamber: chamber,
                                slot: selectedSlot,
                                fee: doc.fee
                              })}
                              className="w-full md:w-auto px-5 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                            >
                              <span>Book Appointment</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
