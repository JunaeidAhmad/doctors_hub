import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Stethoscope, MapPin, Filter, ArrowLeft, Building2, ShieldCheck, Calendar, Clock, ArrowRight, X, Heart, Award, ArrowDownAZ, ArrowUpAZ } from 'lucide-react';
import { LOCATIONS, CITY_THANAS } from '../../data/constants';
import { api, ensureArray, isPageReload, getIsInitialLoad } from '../../services/api';
import Pagination from '../../components/Pagination';

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = String(timeStr).split(':').map(Number);
  if (!h || Number.isNaN(h)) return timeStr;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m || 0).padStart(2, '0')} ${period}`;
}

export default function DoctorSearchPage({
  initialSpecialty = '',
  initialLocation = 'All Bangladesh',
  initialKeyword = '',
  onBookDoctorSlot,
  onSelectHospital,
  onNavigateHome
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const routerLocation = useLocation();

  const getParam = (key, fallback) => {
    const v = searchParams.get(key);
    return v === null || v === undefined ? fallback : v;
  };

  const [specialty, setSpecialty] = useState(() => {
    return getParam('spec', initialSpecialty);
  });
  const [location, setLocation] = useState(() => {
    return getParam('loc', initialLocation);
  });
  const [area, setArea] = useState(() => {
    return getParam('area', 'All Areas');
  });
  const [keyword, setKeyword] = useState(() => {
    return getParam('q', initialKeyword);
  });
  const [maxFee, setMaxFee] = useState(2500);
  const [selectedDay, setSelectedDay] = useState('All');

  useEffect(() => {
    const urlSpec = searchParams.get('spec');
    const urlLoc = searchParams.get('loc');
    const urlQ = searchParams.get('q');
    const urlArea = searchParams.get('area');

    setSpecialty(urlSpec || '');
    if (urlLoc !== null) setLocation(urlLoc);
    if (urlQ !== null) setKeyword(urlQ);
    if (urlArea !== null) setArea(urlArea);
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (specialty) params.set('spec', specialty);
    if (location && location !== 'All Bangladesh') params.set('loc', location);
    if (area && area !== 'All Areas') params.set('area', area);
    if (keyword.trim()) params.set('q', keyword.trim());

    const next = params.toString();
    if (next !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [specialty, location, area, keyword, searchParams, setSearchParams]);

  const [chambers, setChambers] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState({});

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('asc');
  const pageSize = 10;
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let isMounted = true;

    // Debounced server-side search/filter for doctors
    const delay = keyword.trim() ? 350 : 0;
    const timer = setTimeout(() => {
      api.getDoctors({
        consultation_type: 'Doctor',
        specialty: specialty || undefined,
        location,
        area: area !== 'All Areas' ? area : undefined,
        search: keyword.trim() || undefined,
        fee_max: maxFee < 5000 ? maxFee : undefined,
        day: selectedDay !== 'All' ? selectedDay : undefined,
        page: currentPage,
        page_size: pageSize
      })
        .then((data) => {
          if (isMounted) {
            setDoctors(ensureArray(data));
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
  }, [specialty, location, area, keyword, maxFee, selectedDay, currentPage]);

  useEffect(() => {
    let isMounted = true;

    api.getBranches({ location })
      .then((data) => {
        if (isMounted && data !== null) {
          setChambers(ensureArray(data));
        }
      })
      .catch(() => {});

    api.getSearchMetadata()
      .then((meta) => {
        if (isMounted && meta && meta.specialties) setSpecialties(ensureArray(meta.specialties));
      })
      .catch(() => {
        api.getSpecialties().then((data) => {
          if (isMounted && data !== null) setSpecialties(ensureArray(data));
        });
      });

    return () => { isMounted = false; };
  }, [location]);

  // Combine doctor affiliations with chambers for display
  const doctorChambersList = useMemo(() => {
    if (doctors.length > 0) {
      const map = {};
      doctors.forEach((doc) => {
        const affiliations = (doc.affiliations || []).filter(a => !a.consultation_type || a.consultation_type === 'Doctor' || a.consultation_type === 'Chamber');
        affiliations.forEach((aff) => {
          const facilityId = aff.hospital || aff.diagnostic_center || 'general-branch';
          const facilityName = aff.facility_name || 'Medical Center Chamber';
          const nameParts = String(facilityName).split(' - ');
          const baseName = nameParts[0] || 'Medical Center Chamber';
          const branchName = nameParts.slice(1).join(' - ') || aff.hospital_branch || aff.diagnostic_center_branch || '';
          const city = aff.city || 'Dhaka';

          if (!map[facilityId]) {
            map[facilityId] = {
              id: facilityId,
              name: baseName,
              branch: branchName,
              city,
              location: branchName ? `${baseName} - ${branchName}` : baseName,
              verified: true,
              rating: 4.9,
              doctors: []
            };
          }
          map[facilityId].doctors.push({
            ...doc,
            affiliationId: aff.id,
            facilityId,
            facilityName,
            branchName,
            city,
            fee: Number(aff.fee) || doc.fee || 1000,
            schedules: aff.schedules || [],
            visitDays: aff.schedules && aff.schedules.length > 0 
              ? aff.schedules.map(s => s.day_of_week).join(', ') 
              : 'Sat, Mon, Wed',
            visitTime: aff.schedules && aff.schedules.length > 0 
              ? `${formatTime(aff.schedules[0].start_time)} - ${formatTime(aff.schedules[0].end_time)}` 
              : '05:00 PM - 09:00 PM',
            slots: ['05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM']
          });
        });
      });
      return Object.values(map);
    }
    return [];
  }, [doctors]);

  // Use already-filtered chambers from backend
  const filteredChambers = doctorChambersList;

  const totalMatchingDoctors = useMemo(() => {
    return doctors.length;
  }, [doctors]);

  // Alphabetically sort chambers and their doctors (asc/desc)
  const sortedChambers = useMemo(() => {
    const sorted = [...filteredChambers]
      .map((ch) => ({
        ...ch,
        doctors: [...(ch.doctors || [])].sort((a, b) => {
          const cmp = (a.name || '').localeCompare(b.name || '');
          return sortOrder === 'asc' ? cmp : -cmp;
        })
      }))
      .sort((a, b) => {
        const cmp = (a.name || '').localeCompare(b.name || '');
        return sortOrder === 'asc' ? cmp : -cmp;
      });
    return sorted;
  }, [filteredChambers, sortOrder]);

  const paginatedChambers = sortedChambers;

  useEffect(() => {
    setCurrentPage(1);
  }, [specialty, location, area, keyword, maxFee, selectedDay]);

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
                <span>Find Your Doctor</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">
                {specialty ? `${specialty} ` : 'Specialist Doctors'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Showing <strong className="text-emerald-400">{totalMatchingDoctors} doctors</strong> across <strong className="text-emerald-400">{filteredChambers.length} chambers</strong> in {location}.
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
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setArea('All Areas');
                  }}
                  className="w-full bg-slate-900 text-white text-xs font-semibold border border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
                >
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Area / Thana Filter (Only visible when city != 'All Bangladesh') */}
              {location !== 'All Bangladesh' && (
                <div className="relative flex-1 min-w-[130px]">
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full bg-slate-900 text-emerald-400 text-xs font-bold border border-emerald-500/80 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-400"
                  >
                    <option value="All Areas">All Areas in {location}</option>
                    {(CITY_THANAS[location] || []).map((th) => (
                      <option key={th} value={th}>{th}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Doctor, specialty, hospital/chamber..."
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
                {(specialty || location !== 'All Bangladesh' || area !== 'All Areas' || keyword || selectedDay !== 'All') && (
                  <button
                    onClick={() => {
                      setSpecialty('');
                      setLocation('All Bangladesh');
                      setArea('All Areas');
                      setKeyword('');
                      setSelectedDay('All');
                      setMaxFee(2500);
                    }}
                    className="text-[11px] font-semibold text-rose-500 hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Area filter (Sidebar view) */}
              {location !== 'All Bangladesh' && (
                <div>
                  <label className="block text-xs font-bold text-emerald-700 mb-1">
                    Area / Thana ({location})
                  </label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full bg-emerald-50 border border-emerald-300 rounded-xl px-3 py-2 text-xs font-bold text-emerald-900 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="All Areas">All Areas in {location}</option>
                    {(CITY_THANAS[location] || []).map((th) => (
                      <option key={th} value={th}>{th}</option>
                    ))}
                  </select>
                </div>
              )}

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
                <h3 className="text-lg font-bold text-slate-800">No Doctors Found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  We couldn't find Specialist Doctors matching your selected criteria. Try adjusting your specialty or location filters.
                </p>
              </div>
            ) : (
              <>
              {/* Sort Control */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold text-slate-600">
                  Showing <strong className="text-emerald-700">{paginatedChambers.length}</strong> of{' '}
                  <strong className="text-slate-900">{filteredChambers.length}</strong> chambers/branches
                </p>
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Sort:</span>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all ${
                      sortOrder === 'asc'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {sortOrder === 'asc' ? <ArrowDownAZ className="w-3.5 h-3.5" /> : <ArrowUpAZ className="w-3.5 h-3.5" />}
                    <span>{sortOrder === 'asc' ? 'A-Z' : 'Z-A'}</span>
                  </button>
                </div>
              </div>

              {paginatedChambers.map((chamber) => (
                <div key={chamber.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow">
                  {/* Chamber Header */}
                  <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between flex-wrap gap-2 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <h2 
                          onClick={() => onSelectHospital && onSelectHospital(chamber.id)}
                          className="font-extrabold text-white text-base hover:text-emerald-400 cursor-pointer transition-colors"
                        >
                          {chamber.name}
                        </h2>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          {chamber.branch ? `${chamber.branch} (${chamber.city})` : `${chamber.location} (${chamber.city})`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Doctor List under Chamber */}
                  <div className="divide-y divide-slate-100">
                    {chamber.doctors.map((doc) => {
                      const docSpecs = Array.isArray(doc.specialties) 
                        ? doc.specialties.map(s => s.name || s).join(', ')
                        : (doc.specialty || doc.specialty_details?.name || 'Specialist Doctor');
                      
                      const slotsList = Array.isArray(doc.slots) && doc.slots.length > 0 
                        ? doc.slots 
                        : ['05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM'];
                      const selectedSlot = selectedSlots[doc.id] || slotsList[0];

                      return (
                        <div key={doc.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/60 transition-colors">
                          
                          {/* Doctor Profile Info */}
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
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
                                {slotsList.map((slotTime) => (
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
                              <div className="text-xs text-slate-500">Consultation Fee</div>
                              <div className="text-2xl font-black text-slate-900">{doc.fee} BDT</div>
                            </div>

                            <button
                              onClick={() => onBookDoctorSlot && onBookDoctorSlot(chamber, {
                                ...doc,
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
              ))}

              <Pagination
                page={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
