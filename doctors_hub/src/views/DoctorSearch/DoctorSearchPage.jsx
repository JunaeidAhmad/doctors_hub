import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Stethoscope, MapPin, Filter, ArrowLeft, Building2, ShieldCheck, Calendar, Clock, ArrowRight, X, Heart, Award, ArrowDownAZ, ArrowUpAZ } from 'lucide-react';
import { DIVISIONS, findDivisionForDistrict } from '../../data/constants';
import { api, ensureArray, isPageReload, getIsInitialLoad } from '../../services/api';
import Pagination from '../../components/Pagination';
import CascadingLocationFilter from '../../components/CascadingLocationFilter';

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

  const [division, setDivision] = useState(() => {
    const urlDiv = getParam('division', '');
    if (urlDiv) return urlDiv;
    const urlLoc = getParam('loc', initialLocation);
    if (DIVISIONS.includes(urlLoc)) return urlLoc;
    const found = findDivisionForDistrict(urlLoc);
    if (found) return found;
    return 'All Bangladesh';
  });

  const [district, setDistrict] = useState(() => {
    const urlDist = getParam('district', '');
    if (urlDist) return urlDist;
    const urlLoc = getParam('loc', '');
    if (urlLoc && !DIVISIONS.includes(urlLoc) && urlLoc !== 'All Bangladesh') return urlLoc;
    return 'All Districts';
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
    const urlDiv = searchParams.get('division');
    const urlDist = searchParams.get('district');
    const urlLoc = searchParams.get('loc');
    const urlQ = searchParams.get('q');
    const urlArea = searchParams.get('area');

    setSpecialty(urlSpec || '');
    if (urlDiv) {
      setDivision(urlDiv);
    } else if (urlLoc) {
      if (DIVISIONS.includes(urlLoc)) setDivision(urlLoc);
      else {
        const found = findDivisionForDistrict(urlLoc);
        if (found) setDivision(found);
        else setDivision('All Bangladesh');
      }
    } else {
      setDivision('All Bangladesh');
    }

    if (urlDist) {
      setDistrict(urlDist);
    } else if (urlLoc && !DIVISIONS.includes(urlLoc) && urlLoc !== 'All Bangladesh') {
      setDistrict(urlLoc);
    } else {
      setDistrict('All Districts');
    }

    if (urlArea !== null) setArea(urlArea);
    if (urlQ !== null) setKeyword(urlQ);
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (specialty) params.set('spec', specialty);
    if (division && division !== 'All Bangladesh') params.set('division', division);
    if (district && district !== 'All Districts') params.set('district', district);
    if (area && area !== 'All Areas') params.set('area', area);
    if (keyword.trim()) params.set('q', keyword.trim());

    const next = params.toString();
    if (next !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [specialty, division, district, area, keyword, searchParams, setSearchParams]);

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
        specialty: specialty || undefined,
        division: division !== 'All Bangladesh' ? division : undefined,
        district: district !== 'All Districts' ? district : undefined,
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
  }, [specialty, division, district, area, keyword, maxFee, selectedDay, currentPage]);


  useEffect(() => {
    let isMounted = true;

    api.getBranches({ location })
      .then((data) => {
        if (isMounted && data !== null) {
          setChambers(ensureArray(data));
        }
      })
      .catch(() => {});

    api.getSearchFacets({ location, area })
      .then((facets) => {
        if (isMounted && facets && facets.specialties) {
          setSpecialties(ensureArray(facets.specialties));
        }
      })
      .catch(() => {
        api.getSearchMetadata()
          .then((meta) => {
            if (isMounted && meta && meta.specialties) setSpecialties(ensureArray(meta.specialties));
          })
          .catch(() => {
            api.getSpecialties().then((data) => {
              if (isMounted && data !== null) setSpecialties(ensureArray(data));
            });
          });
      });

    return () => { isMounted = false; };
  }, [location, area]);

  // Combine doctor affiliations with chambers for display
  const doctorChambersList = useMemo(() => {
    if (doctors.length > 0) {
      const map = {};
      doctors.forEach((doc) => {
        const affiliations = Array.isArray(doc.affiliations) && doc.affiliations.length > 0
          ? doc.affiliations
          : [{
              id: `virtual-${doc.id}`,
              facility_name: doc.hospital_name || doc.chamber_name || 'Specialist Doctor Chamber',
              city: doc.city || 'Dhaka',
              fee: doc.fee || 1000,
              schedules: []
            }];

        affiliations.forEach((aff, affIdx) => {
          const facilityId = aff.location_id || aff.hospital || aff.diagnostic_center || (aff.location_details && aff.location_details.id) || `fac-${aff.id || affIdx}`;
          const facilityName = aff.facility_name || (aff.location_details && aff.location_details.name) || 'Medical Center Chamber';
          const nameParts = String(facilityName).split(' - ');
          const baseName = nameParts[0] || 'Medical Center Chamber';
          const branchName = nameParts.slice(1).join(' - ') || aff.hospital_branch || aff.diagnostic_center_branch || (aff.location_details && aff.location_details.branch) || '';
          const city = aff.city || (aff.location_details && aff.location_details.city) || (aff.location_details && aff.location_details.district) || 'Dhaka';
          const affArea = (aff.location_details && aff.location_details.area) || '';
          const affDistrict = (aff.location_details && aff.location_details.district) || '';
          const affDivision = (aff.location_details && aff.location_details.division) || '';

          // Filter affiliation by Division
          if (division && division !== 'All Bangladesh') {
            const divLow = division.toLowerCase();
            const matchesDiv = affDivision.toLowerCase().includes(divLow) ||
              affDistrict.toLowerCase().includes(divLow) ||
              city.toLowerCase().includes(divLow);
            if (!matchesDiv) return;
          }

          // Filter affiliation by District
          if (district && district !== 'All Districts') {
            const distLow = district.toLowerCase();
            const matchesDist = affDistrict.toLowerCase().includes(distLow) ||
              city.toLowerCase().includes(distLow);
            if (!matchesDist) return;
          }

          // Filter affiliation by Area
          if (area && area !== 'All Areas') {
            const areaLow = area.toLowerCase();
            const matchesArea = affArea.toLowerCase().includes(areaLow) ||
              branchName.toLowerCase().includes(areaLow);
            if (!matchesArea) return;
          }

          // Filter affiliation by Fee
          const affFee = Number(aff.fee) || doc.fee || 1000;
          if (maxFee && maxFee < 5000 && affFee > maxFee) {
            return;
          }

          // Filter affiliation by Day
          let filteredSchedules = aff.schedules || [];
          if (selectedDay && selectedDay !== 'All') {
            filteredSchedules = (aff.schedules || []).filter(s => 
              String(s.day_of_week).toLowerCase().includes(selectedDay.toLowerCase())
            );
            if (filteredSchedules.length === 0 && (aff.schedules || []).length > 0) {
              return;
            }
          }

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
            uniqueKey: `${facilityId}-${doc.id}-${aff.id || affIdx}`,
            affiliationId: aff.id || `aff-${affIdx}`,
            facilityId,
            facilityName,
            branchName,
            city,
            fee: affFee,
            schedules: filteredSchedules,
            visitDays: filteredSchedules && filteredSchedules.length > 0 
              ? filteredSchedules.map(s => s.day_of_week).join(', ') 
              : (aff.schedules && aff.schedules.length > 0 ? aff.schedules.map(s => s.day_of_week).join(', ') : 'Sat, Mon, Wed'),
            visitTime: filteredSchedules && filteredSchedules.length > 0 
              ? `${formatTime(filteredSchedules[0].start_time)} - ${formatTime(filteredSchedules[0].end_time)}` 
              : '05:00 PM - 09:00 PM',
            slots: ['05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM']
          });
        });
      });
      return Object.values(map);
    }
    return [];
  }, [doctors, division, district, area, maxFee, selectedDay]);

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
  }, [specialty, division, district, area, keyword, maxFee, selectedDay]);

  const handleSelectSlot = (docId, slotTime) => {
    setSelectedSlots(prev => ({
      ...prev,
      [docId]: slotTime
    }));
  };

  const displayLocationText = district !== 'All Districts' 
    ? district 
    : (division !== 'All Bangladesh' ? `${division} Division` : 'All Bangladesh');

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      
      {/* Search Header Banner */}
      <div className="bg-slate-900 text-white pt-8 pb-12 px-4 sm:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto">
          
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors mb-4 cursor-pointer"
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
                Showing <strong className="text-emerald-400">{totalMatchingDoctors} doctors</strong> across <strong className="text-emerald-400">{filteredChambers.length} chambers</strong> in {displayLocationText}.
              </p>
            </div>

            {/* Quick Search Controls Bar */}
            <div className="bg-slate-800/90 border border-slate-700/80 p-3 rounded-2xl flex flex-wrap items-center gap-2 max-w-2xl w-full">
              <div className="relative flex-1 min-w-[130px]">
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full bg-slate-900 text-white text-xs font-semibold border border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="">All Specialties</option>
                  {specialties.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Cascading Location Filter (Division -> District -> Thana) in Top Bar */}
              <CascadingLocationFilter
                division={division}
                district={district}
                area={area}
                onChange={({ division: d, district: dist, area: a }) => {
                  setDivision(d);
                  setDistrict(dist);
                  setArea(a);
                }}
                theme="dark"
                accent="emerald"
                layout="inline"
                showLabels={false}
              />

              <div className="flex-1 min-w-[130px]">
                <input
                  type="text"
                  placeholder="Doctor, keyword..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full bg-slate-900 text-white text-xs border border-slate-700 rounded-xl px-3 py-2.5 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
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
                {(specialty || division !== 'All Bangladesh' || district !== 'All Districts' || area !== 'All Areas' || keyword || selectedDay !== 'All') && (
                  <button
                    onClick={() => {
                      setSpecialty('');
                      setDivision('All Bangladesh');
                      setDistrict('All Districts');
                      setArea('All Areas');
                      setKeyword('');
                      setSelectedDay('All');
                      setMaxFee(2500);
                    }}
                    className="text-[11px] font-semibold text-rose-500 hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Cascading Location Filter in Sidebar */}
              <CascadingLocationFilter
                division={division}
                district={district}
                area={area}
                onChange={({ division: d, district: dist, area: a }) => {
                  setDivision(d);
                  setDistrict(dist);
                  setArea(a);
                }}
                theme="light"
                accent="emerald"
                layout="stacked"
                showLabels={true}
              />



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
                    {chamber.doctors.map((doc, docIdx) => {
                      const docSpecs = Array.isArray(doc.specialties) 
                        ? doc.specialties.map(s => s.name || s).join(', ')
                        : (doc.specialty || doc.specialty_details?.name || 'Specialist Doctor');
                      
                      const slotsList = Array.isArray(doc.slots) && doc.slots.length > 0 
                        ? doc.slots 
                        : ['05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM'];
                      const selectedSlot = selectedSlots[doc.uniqueKey || doc.id] || slotsList[0];

                      return (
                        <div key={doc.uniqueKey || `${chamber.id}-${doc.id}-${docIdx}`} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/60 transition-colors">
                          
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
                                    key={`${doc.uniqueKey || doc.id}-${slotTime}`}
                                    onClick={() => handleSelectSlot(doc.uniqueKey || doc.id, slotTime)}
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
