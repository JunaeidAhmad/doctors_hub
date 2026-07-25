import React, { useState, useMemo, useEffect } from 'react';
import { Stethoscope, MapPin, Filter, ArrowLeft, Building2, ShieldCheck, Calendar, Clock, ArrowRight, X } from 'lucide-react';
import { SPECIALTIES as MOCK_SPECIALTIES, LOCATIONS, OPD_CHAMBERS as MOCK_CHAMBERS } from '../data/mockData';
import { api } from '../services/api';

export default function OpdDoctorSearchPage({
  initialSpecialty = '',
  initialLocation = 'All Bangladesh',
  initialKeyword = '',
  onBookDoctorSlot,
  onNavigateHome
}) {
  const [specialty, setSpecialty] = useState(initialSpecialty);
  const [location, setLocation] = useState(initialLocation);
  const [keyword, setKeyword] = useState(initialKeyword);
  const [maxFee, setMaxFee] = useState(2000);
  const [selectedDay, setSelectedDay] = useState('All');

  const [chambers, setChambers] = useState(MOCK_CHAMBERS);
  const [specialties, setSpecialties] = useState(MOCK_SPECIALTIES);

  useEffect(() => {
    let isMounted = true;
    api.getChambers()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          const normalized = data.map(ch => ({
            ...ch,
            reviewsCount: ch.reviews_count || ch.reviewsCount,
            openTiming: ch.open_timing || ch.openTiming,
            contactPhone: ch.contact_phone || ch.contactPhone,
            doctors: (ch.doctors || []).map(doc => ({
              ...doc,
              specialty: typeof doc.specialty === 'object' ? doc.specialty?.name : (doc.specialty_details?.name || doc.specialty),
              visitDays: doc.visit_days || doc.visitDays,
              visitTime: doc.visit_time || doc.visitTime
            }))
          }));
          setChambers(normalized);
        }
      })
      .catch((err) => {
        console.warn("Using mock chambers fallback", err);
      });

    api.getSpecialties()
      .then((data) => {
        if (isMounted && data && data.length > 0) setSpecialties(data);
      })
      .catch(() => {});

    return () => { isMounted = false; };
  }, []);

  // Filter logic
  const filteredChambers = useMemo(() => {
    return chambers.map((chamber) => {
      // Filter attached doctors of chamber
      const matchingDoctors = (chamber.doctors || []).filter((doc) => {
        const docSpec = typeof doc.specialty === 'object' ? doc.specialty?.name : (doc.specialty_details?.name || doc.specialty || '');
        // Specialty match
        if (specialty && docSpec.toLowerCase() !== specialty.toLowerCase()) {
          return false;
        }
        // Fee match
        if (doc.fee > maxFee) {
          return false;
        }
        // Day match
        if (selectedDay !== 'All') {
          const vDays = doc.visitDays || doc.visit_days || '';
          if (selectedDay === 'Everyday') {
            if (!vDays.toLowerCase().includes('everyday') && !vDays.toLowerCase().includes('mon - sat')) {
              return false;
            }
          } else if (!vDays.toLowerCase().includes(selectedDay.toLowerCase()) && !vDays.toLowerCase().includes('everyday')) {
            return false;
          }
        }
        // Keyword match on doctor name or qualification
        if (keyword.trim()) {
          const q = keyword.toLowerCase();
          const matchesDoc = doc.name.toLowerCase().includes(q) || (doc.qualification && doc.qualification.toLowerCase().includes(q)) || docSpec.toLowerCase().includes(q);
          const matchesChamber = chamber.name.toLowerCase().includes(q) || chamber.location.toLowerCase().includes(q);
          if (!matchesDoc && !matchesChamber) return false;
        }
        return true;
      });

      // Location match on chamber
      if (location !== 'All Bangladesh' && chamber.city !== location) {
        return null;
      }

      // If specialty or keyword specified and no doctors match, omit chamber
      if ((specialty || keyword) && matchingDoctors.length === 0) {
        return null;
      }

      return {
        ...chamber,
        doctors: matchingDoctors
      };
    }).filter(Boolean);
  }, [chambers, specialty, location, keyword, maxFee, selectedDay]);

  const totalMatchingDoctors = useMemo(() => {
    return filteredChambers.reduce((acc, c) => acc + c.doctors.length, 0);
  }, [filteredChambers]);

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
                <span>Dedicated OPD Doctor Search Page</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">
                {specialty ? `${specialty} OPD Chambers` : 'Specialist Doctor OPD Chambers'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Showing <strong className="text-emerald-400">{totalMatchingDoctors} visiting specialists</strong> across <strong className="text-emerald-400">{filteredChambers.length} partner clinics</strong> in {location}.
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

              <div className="relative flex-1 min-w-[150px]">
                <input
                  type="text"
                  placeholder="Doctor / Clinic name..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full bg-slate-900 text-white text-xs font-medium border border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Active Filter Badges */}
          <div className="mt-4 flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-400 font-semibold">Active Filters:</span>
            {specialty && (
              <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                Specialty: {specialty}
                <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setSpecialty('')} />
              </span>
            )}
            {location !== 'All Bangladesh' && (
              <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                City: {location}
                <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setLocation('All Bangladesh')} />
              </span>
            )}
            {keyword && (
              <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                Keyword: "{keyword}"
                <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setKeyword('')} />
              </span>
            )}
            {selectedDay !== 'All' && (
              <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                Day: {selectedDay}
                <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setSelectedDay('All')} />
              </span>
            )}
            {(specialty || location !== 'All Bangladesh' || keyword || selectedDay !== 'All') && (
              <button
                onClick={() => {
                  setSpecialty('');
                  setLocation('All Bangladesh');
                  setKeyword('');
                  setSelectedDay('All');
                  setMaxFee(2000);
                }}
                className="text-slate-400 hover:text-white underline ml-2"
              >
                Reset All
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Main Search Layout (Sidebar + Results) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* LEFT SIDEBAR FILTERS */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-5">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-emerald-600" />
                  <span>Filter Options</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-semibold">{totalMatchingDoctors} Results</span>
              </div>

              {/* Specialty Selector List */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Medical Specialty:
                </label>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  <button
                    onClick={() => setSpecialty('')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      specialty === '' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    All Specialties
                  </button>
                  {specialties.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSpecialty(s.name)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                        specialty === s.name ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{s.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{s.count || ''}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Day Filter */}
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Doctor Visiting Day:
                </label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                >
                  <option value="All">Any Day</option>
                  <option value="Sat">Saturday</option>
                  <option value="Sun">Sunday</option>
                  <option value="Mon">Monday</option>
                  <option value="Tue">Tuesday</option>
                  <option value="Wed">Wednesday</option>
                  <option value="Thu">Thursday</option>
                  <option value="Fri">Friday</option>
                </select>
              </div>

              {/* Max Consultation Fee */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1">
                  <span>Max Consultation Fee:</span>
                  <span className="text-emerald-700">৳{maxFee}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="2000"
                  step="100"
                  value={maxFee}
                  onChange={(e) => setMaxFee(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
                  <span>৳500</span>
                  <span>৳1,200</span>
                  <span>৳2,000</span>
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT RESULTS LISTING */}
          <div className="lg:col-span-3 space-y-6">
            
            {filteredChambers.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800">No OPD Chambers Found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  We couldn't find any visiting doctors matching your exact filter parameters for {specialty || 'the selected criteria'}. Try clearing filters or expanding your search location.
                </p>
                <button
                  onClick={() => {
                    setSpecialty('');
                    setLocation('All Bangladesh');
                    setKeyword('');
                    setSelectedDay('All');
                    setMaxFee(2000);
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              filteredChambers.map((chamber) => (
                <div
                  key={chamber.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  {/* Chamber Top Banner */}
                  <div className="p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-extrabold text-white">
                          {chamber.name}
                        </h2>
                        {chamber.verified && (
                          <span className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Verified Chamber
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{chamber.location}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-emerald-400 inline mr-1" />
                        {chamber.openTiming || chamber.open_timing}
                      </div>
                    </div>
                  </div>

                  {/* Doctors Sub-list for this Chamber */}
                  <div className="p-5 space-y-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Available Specialist Doctors in Chamber:
                    </div>

                    {chamber.doctors.map((doc) => {
                      const docSpec = typeof doc.specialty === 'object' ? doc.specialty?.name : (doc.specialty_details?.name || doc.specialty || '');
                      const docDays = doc.visitDays || doc.visit_days || '';
                      const docTime = doc.visitTime || doc.visit_time || '';

                      return (
                        <div
                          key={doc.id}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-emerald-50/20 hover:border-emerald-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center text-base shrink-0 shadow-md">
                              {doc.name.split(' ').slice(-1)[0][0]}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-extrabold text-slate-900 text-base">
                                  {doc.name}
                                </h4>
                                <span className="text-xs font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                                  {docSpec}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 font-medium mt-0.5">
                                {doc.qualification} • <span className="text-emerald-700 font-bold">{doc.experience}</span>
                              </p>
                              
                              <div className="mt-2 flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                                <span className="flex items-center gap-1 text-slate-800 font-semibold bg-white px-2.5 py-1 rounded-md border border-slate-200">
                                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                                  {docDays}
                                </span>
                                <span className="flex items-center gap-1 text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                  {docTime}
                                </span>
                                <span className="font-black text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-md">
                                  Fee: ৳{doc.fee}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Trigger */}
                          <div className="shrink-0 flex items-center gap-2">
                            <button
                              onClick={() => onBookDoctorSlot(chamber, doc)}
                              className="w-full md:w-auto px-5 py-3 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
                            >
                              <span>Book Serial Ticket</span>
                              <ArrowRight className="w-3.5 h-3.5" />
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
