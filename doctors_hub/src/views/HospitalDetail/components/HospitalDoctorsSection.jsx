import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Stethoscope, Search, ShieldCheck, Calendar, Clock, 
  DoorClosed, ArrowRight, UserCheck, Loader2
} from 'lucide-react';
import { formatFacilityName } from '../../../utils/facilityUtils';
import { formatNextAvailable } from '../../../utils/doctorUtils';
import { getFacilityDoctors } from '../../../services/api/hospitals';

export default function HospitalDoctorsSection({ 
  hospital, 
  onBookDoctorSlot 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [doctors, setDoctors] = useState([]);
  const [facets, setFacets] = useState({ specialties: [] });
  const [totalCount, setTotalCount] = useState(0);
  const [nextPage, setNextPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const debounceRef = useRef(null);

  const hospitalName = formatFacilityName(hospital) || '';
  const facilityId = hospital?.slug || hospital?.id;
  const facilityKind = hospital?.location_type === 'diagnostic_center' ? 'diagnostic-centers' : 'hospitals';

  // Helper to format 24h to 12h AM/PM
  const formatTime12h = (tStr) => {
    if (!tStr) return '';
    const parts = tStr.split(':');
    let h = parseInt(parts[0], 10);
    const m = parts[1] || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
  };

  const fetchDoctors = useCallback(async (page = 1, append = false) => {
    if (!facilityId) return;

    if (page === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const params = { page, page_size: 12 };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedSpecialty && selectedSpecialty !== 'all') params.specialty = selectedSpecialty;

      const data = await getFacilityDoctors(facilityKind, facilityId, params);

      const results = data?.results || [];
      const newFacets = data?.facets || { specialties: [] };
      const count = data?.count ?? 0;

      if (append) {
        setDoctors(prev => [...prev, ...results]);
      } else {
        setDoctors(results);
        setFacets(newFacets);
      }
      setTotalCount(count);
      setNextPage(data?.next ? page + 1 : null);
      setCurrentPage(page);
    } catch (err) {
      console.error('Failed to fetch facility doctors:', err);
      setError('Failed to load doctors. Please try again.');
      if (!append) {
        setDoctors([]);
        setFacets({ specialties: [] });
        setTotalCount(0);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [facilityId, facilityKind, searchQuery, selectedSpecialty]);

  // Fetch on mount and when specialty changes
  useEffect(() => {
    fetchDoctors(1, false);
  }, [selectedSpecialty, facilityId]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchDoctors(1, false);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  const handleLoadMore = () => {
    if (nextPage && !loadingMore) {
      fetchDoctors(nextPage, true);
    }
  };

  const handleBookDoctor = (item) => {
    if (onBookDoctorSlot) {
      const doc = item.doctor || {};
      onBookDoctorSlot({
        doctor: {
          id: doc.id,
          slug: doc.slug,
          name: doc.name,
          academic_title: doc.academic_title,
          qualification: doc.qualification,
          image: doc.image,
          primary_specialty: doc.primary_specialty,
          bmdc_number: doc.bmdc_number,
        },
        chamber: {
          affiliation_id: item.affiliation_id,
          facility_name: hospitalName,
          fee: item.fee,
          chamber_type: item.chamber_type,
          schedules: item.schedules,
        }
      });
    }
  };

  // Build specialty chips from facets
  const allCount = totalCount;
  const specialtyChips = [
    { slug: 'all', name: 'All Specialties', count: allCount },
    ...(facets.specialties || []).map(s => ({
      slug: s.slug,
      name: s.name,
      count: s.count,
    })),
  ];

  // Skeleton loading
  if (loading && doctors.length === 0) {
    return (
      <section className="space-y-6 scroll-mt-24" id="specialist-section">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="h-5 w-32 bg-surface-container-high rounded-full animate-pulse mb-2" />
            <div className="h-7 w-80 bg-surface-container-high rounded animate-pulse" />
            <div className="h-4 w-64 bg-surface-container-high rounded animate-pulse mt-1.5" />
          </div>
          <div className="h-10 w-72 bg-surface-container-high rounded-lg animate-pulse" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-8 w-28 bg-surface-container-high rounded-full animate-pulse shrink-0" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-surface-container-lowest rounded-xl border border-outline-variant/70 p-5 space-y-4 animate-pulse">
              <div className="flex gap-3.5">
                <div className="w-16 h-16 rounded-xl bg-surface-container-high" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-surface-container-high rounded" />
                  <div className="h-5 w-40 bg-surface-container-high rounded" />
                  <div className="h-3 w-32 bg-surface-container-high rounded" />
                </div>
              </div>
              <div className="h-20 bg-surface-container-high rounded-lg" />
              <div className="h-10 bg-surface-container-high rounded-lg" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6 scroll-mt-24" id="specialist-section">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-1.5">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Accredited Faculty</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
            Available Consultants & Specialists{hospitalName ? ` at ${hospitalName}` : ''}
          </h2>
          {hospitalName && (
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
              Showing {totalCount} specialist{totalCount !== 1 ? 's' : ''} available at this facility.
            </p>
          )}
        </div>

        {/* Doctor search input */}
        <div className="flex items-center gap-2">
          <div className="relative min-w-[240px] sm:min-w-[280px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-outline" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search doctor by name..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Quick Specialty Chips */}
      {specialtyChips.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {specialtyChips.map((spec) => {
            const isSelected = selectedSpecialty === spec.slug;
            return (
              <button
                key={spec.slug}
                onClick={() => setSelectedSpecialty(spec.slug)}
                type="button"
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
                }`}
              >
                {spec.name} ({spec.count})
              </button>
            );
          })}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-error/5 rounded-xl border border-error/20 p-6 text-center">
          <p className="text-sm font-medium text-error">{error}</p>
          <button
            onClick={() => fetchDoctors(1, false)}
            className="mt-2 text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Doctor Bento Grid */}
      {!error && doctors.length === 0 && !loading ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/70 p-8 text-center">
          <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-on-surface">No specialists found matching your search</p>
          <p className="text-xs text-on-surface-variant mt-1">Try searching for a different name or choosing another specialty filter.</p>
        </div>
      ) : !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((item) => {
            const doc = item.doctor || {};
            const schedules = item.schedules || [];
            const schedStr = schedules.length > 0
              ? schedules.map(s => `${s.day_of_week?.slice(0, 3)} (${formatTime12h(s.start_time)} - ${formatTime12h(s.end_time)})`).join(', ')
              : null;
            const fee = item.fee ? Number(item.fee) : null;

            return (
              <div
                key={item.affiliation_id}
                className="bg-surface-container-lowest rounded-xl border border-outline-variant/70 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3.5 sm:gap-4">
                    <div className="relative shrink-0">
                      {doc.image ? (
                        <img
                          src={doc.image}
                          alt={doc.name}
                          className="w-16 h-16 rounded-xl object-cover border border-outline-variant"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-primary/10 border border-outline-variant flex items-center justify-center">
                          <Stethoscope className="w-7 h-7 text-primary/60" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {doc.bmdc_number && (
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                            <ShieldCheck className="w-3 h-3 text-primary" />
                            <span>{doc.bmdc_number}</span>
                          </span>
                        </div>
                      )}

                      <h3 className="text-sm sm:text-base font-bold text-on-surface mt-0.5 truncate">
                        {doc.name}
                      </h3>
                      {doc.academic_title && (
                        <p className="text-xs text-tertiary font-semibold truncate">
                          {doc.academic_title}
                        </p>
                      )}
                      {doc.primary_specialty && (
                        <p className="text-[11px] text-primary/80 font-medium mt-0.5 truncate">
                          {doc.primary_specialty.name}
                        </p>
                      )}
                      {doc.qualification && (
                        <p className="text-[11px] text-outline mt-0.5 truncate">
                          {doc.qualification}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Schedule & Chamber Box */}
                  {(schedStr || item.chamber_type) && (
                    <div className="mt-4 p-3 rounded-lg bg-surface-container-low/60 border border-outline-variant/40 space-y-2">
                      {schedStr && (
                        <div className="flex items-start justify-between text-xs gap-2">
                          <span className="text-on-surface-variant flex items-center gap-1 shrink-0 mt-0.5">
                            <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>Schedule:</span>
                          </span>
                          <span className="font-semibold text-on-surface text-right leading-snug break-words max-w-[210px]">
                            {schedStr}
                          </span>
                        </div>
                      )}

                      {item.chamber_type && (
                        <div className="flex items-start justify-between text-xs gap-2">
                          <span className="text-on-surface-variant flex items-center gap-1 shrink-0 mt-0.5">
                            <DoorClosed className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>Chamber:</span>
                          </span>
                          <span className="font-medium text-on-surface text-right leading-snug break-words max-w-[210px]">
                            {item.chamber_type}
                          </span>
                        </div>
                      )}

                      <div className="flex items-start justify-between text-xs gap-2 pt-1 border-t border-outline-variant/30">
                        <span className="text-on-surface-variant flex items-center gap-1 shrink-0 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>Availability:</span>
                        </span>
                        <span className="font-semibold text-primary text-right leading-snug break-words max-w-[210px]">
                          {formatNextAvailable(item.next_available)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Fee */}
                  {fee != null && (
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-on-surface-variant">Consultation Fee:</span>
                      <span className="text-sm sm:text-base font-bold text-on-surface">৳{fee.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Rating */}
                  {doc.rating && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-on-surface-variant">
                      <span className="font-semibold text-amber-600">★ {Number(doc.rating).toFixed(1)}</span>
                      {doc.review_count > 0 && (
                        <span>({doc.review_count} review{doc.review_count !== 1 ? 's' : ''})</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3.5 border-t border-outline-variant/40 flex items-center gap-2">
                  <button
                    onClick={() => handleBookDoctor(item)}
                    className="flex-1 py-2 px-3 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container active:scale-[0.98] transition-all text-center cursor-pointer shadow-xs"
                  >
                    Book Appointment
                  </button>

                  <button
                    onClick={() => handleBookDoctor(item)}
                    className="py-2 px-3 rounded-lg border border-outline-variant text-on-surface text-xs font-medium hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Loading indicator during refetch */}
      {loading && doctors.length > 0 && (
        <div className="text-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
        </div>
      )}

      {/* Load More Button */}
      {nextPage && !loading && (
        <div className="text-center pt-2">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-primary text-primary text-xs sm:text-sm font-semibold hover:bg-primary/5 transition-all cursor-pointer disabled:opacity-50"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <span>Load More Specialists ({doctors.length} of {totalCount})</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
