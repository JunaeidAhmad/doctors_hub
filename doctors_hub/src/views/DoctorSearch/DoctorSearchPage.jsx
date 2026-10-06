import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api, ensureArray } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import { useDivisions, useDistricts, useThanas } from '../../hooks/useGeo';

import DoctorSearchHeader from './components/DoctorSearchHeader';
import DoctorActiveFiltersBar from './components/DoctorActiveFiltersBar';
import DoctorSearchBarStrip from './components/DoctorSearchBarStrip';
import DoctorFilterSidebar from './components/DoctorFilterSidebar';
import DoctorCard from './components/DoctorCard';
import DoctorPagination from './components/DoctorPagination';
import DoctorTrustSeal from './components/DoctorTrustSeal';
import DoctorProfileModal from './components/DoctorProfileModal';
import RelatedSpecialists from './components/RelatedSpecialists';
import { useLang } from '../../hooks/useLang';
import { t, pluralizeSpecialty } from '../../data/strings';

export default function DoctorSearchPage({
  initialSpecialty = '',
  initialKeyword = '',
  onBookDoctorSlot,
  onSelectHospital,
  onNavigateHome
}) {
  const navigate = useNavigate();
  const lang = useLang();
  const [searchParams, setSearchParams] = useSearchParams();
  const lastParamsRef = useRef(searchParams.toString());

  const getParam = (key, fallback) => {
    const v = searchParams.get(key);
    return v === null || v === undefined ? fallback : v;
  };

  // State
  const [specialty, setSpecialty] = useState(() => getParam('spec', getParam('specialty', initialSpecialty)));
  const [divisionId, setDivisionId] = useState(() => {
    const v = getParam('division_id', null);
    return v ? Number(v) : null;
  });
  const [districtId, setDistrictId] = useState(() => {
    const v = getParam('district_id', null);
    return v ? Number(v) : null;
  });
  const [thanaId, setThanaId] = useState(() => {
    const v = getParam('thana_id', null);
    return v ? Number(v) : null;
  });
  const [facility, setFacility] = useState(() => getParam('facility', ''));
  const [keyword, setKeyword] = useState(() => getParam('q', initialKeyword));
  const debouncedKeyword = useDebounce(keyword, 350);
  const [selectedDay, setSelectedDay] = useState(() => getParam('day', 'All'));
  const [gender, setGender] = useState(() => getParam('gender', 'All'));
  const [currentPage, setCurrentPage] = useState(() => {
    const p = parseInt(getParam('page', '1'), 10);
    return isNaN(p) || p < 1 ? 1 : p;
  });

  const pageSize = 20;
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [specialtyGroups, setSpecialtyGroups] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDoctorForProfile, setSelectedDoctorForProfile] = useState(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [searchMeta, setSearchMeta] = useState(null);

  const { items: divisions } = useDivisions();
  const { items: districts } = useDistricts(divisionId);
  const { items: thanas } = useThanas(districtId);

  const divisionName = useMemo(() => {
    if (!divisionId) return '';
    return divisions.find(d => d.id === divisionId)?.name || '';
  }, [divisions, divisionId]);

  const districtName = useMemo(() => {
    if (!districtId) return '';
    return districts.find(d => d.id === districtId)?.name || '';
  }, [districts, districtId]);

  const thanaName = useMemo(() => {
    if (!thanaId) return '';
    return thanas.find(t => t.id === thanaId)?.name || '';
  }, [thanas, thanaId]);

  // Sync state from URL search params on back/forward navigation
  useEffect(() => {
    if (lastParamsRef.current === searchParams.toString()) return;
    lastParamsRef.current = searchParams.toString();

    setSpecialty(searchParams.get('spec') || searchParams.get('specialty') || '');
    setDivisionId(searchParams.get('division_id') ? Number(searchParams.get('division_id')) : null);
    setDistrictId(searchParams.get('district_id') ? Number(searchParams.get('district_id')) : null);
    setThanaId(searchParams.get('thana_id') ? Number(searchParams.get('thana_id')) : null);
    setFacility(searchParams.get('facility') || '');
    setKeyword(searchParams.get('q') || '');
    setSelectedDay(searchParams.get('day') || 'All');
    setGender(searchParams.get('gender') || 'All');
    const p = parseInt(searchParams.get('page') || '1', 10);
    setCurrentPage(isNaN(p) || p < 1 ? 1 : p);
  }, [searchParams]);

  // Sync state to URL search params
  useEffect(() => {
    const params = new URLSearchParams();
    if (specialty) params.set('spec', specialty);
    if (divisionId) params.set('division_id', String(divisionId));
    if (districtId) params.set('district_id', String(districtId));
    if (thanaId) params.set('thana_id', String(thanaId));
    if (facility) params.set('facility', facility);
    if (keyword.trim()) params.set('q', keyword.trim());
    if (selectedDay && selectedDay !== 'All' && selectedDay !== 'All Days') params.set('day', selectedDay);
    if (gender && gender !== 'All') params.set('gender', gender);
    if (currentPage > 1) params.set('page', String(currentPage));

    const next = params.toString();
    if (next !== lastParamsRef.current) {
      lastParamsRef.current = next;
      setSearchParams(params, { replace: true });
    }
  }, [specialty, divisionId, districtId, thanaId, facility, keyword, selectedDay, gender, currentPage, setSearchParams]);

  // Load specialties and facility options on mount
  useEffect(() => {
    let isMounted = true;
    api.getSearchMetadata()
      .then((meta) => {
        if (isMounted && meta) {
          if (meta.specialty_groups) setSpecialtyGroups(ensureArray(meta.specialty_groups));
          if (meta.specialties_az) {
            setSpecialties(ensureArray(meta.specialties_az));
          } else if (meta.specialties) {
            setSpecialties(ensureArray(meta.specialties));
          }
          if (meta.facilities) {
            setFacilities(ensureArray(meta.facilities));
          }
        }
      })
      .catch(() => {
        api.getSpecialties().then((s) => {
          if (isMounted && s) setSpecialties(ensureArray(s));
        }).catch(() => {});
      });

    return () => { isMounted = false; };
  }, []);

  // Fetch doctors with server filters
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    api.getDoctors({
      specialty: specialty || undefined,
      division_id: divisionId || undefined,
      district_id: districtId || undefined,
      thana_id: thanaId || undefined,
      facility: facility || undefined,
      gender: gender !== 'All' ? gender : undefined,
      search: debouncedKeyword.trim() || undefined,
      day: selectedDay !== 'All' && selectedDay !== 'All Days' ? selectedDay : undefined,
      page: currentPage,
      page_size: pageSize
    })
      .then((data) => {
        if (isMounted) {
          let list = [];
          let count = 0;
          if (data) {
            list = ensureArray(data);
            count = (typeof data === 'object' && typeof data.count === 'number') ? data.count : list.length;
            if (data.meta) {
               setSearchMeta(data.meta);
            } else {
              setSearchMeta(null);
            }
          } else {
            setSearchMeta(null);
          }
          setDoctors(list);
          setTotalCount(count);
          const effectivePageSize = (data && data.next && list.length > 0) ? list.length : pageSize;
          const calculatedTotalPages = Math.max(1, Math.ceil(count / effectivePageSize));
          setTotalPages(calculatedTotalPages);
          if (currentPage > calculatedTotalPages) {
            setCurrentPage(1);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setSearchMeta(null);
          if (currentPage > 1) {
            setCurrentPage(1);
            return;
          }
          setDoctors([]);
          setTotalCount(0);
          setTotalPages(1);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [specialty, divisionId, districtId, thanaId, facility, gender, debouncedKeyword, selectedDay, currentPage]);

  const hasActiveFilters = Boolean(
    specialty ||
    divisionId ||
    districtId ||
    thanaId ||
    facility ||
    (keyword && keyword.trim()) ||
    (selectedDay && selectedDay !== 'All' && selectedDay !== 'All Days') ||
    (gender && gender !== 'All')
  );

  const handleClearAll = () => {
    setSpecialty('');
    setDivisionId(null);
    setDistrictId(null);
    setThanaId(null);
    setFacility('');
    setKeyword('');
    setSelectedDay('All');
    setGender('All');
    setCurrentPage(1);
  };

  const handleClearLocation = () => {
    setDivisionId(null);
    setDistrictId(null);
    setThanaId(null);
    setCurrentPage(1);
  };

  const specialtyDisplayName = useMemo(() => {
    if (!specialty) return '';
    if (searchMeta?.specialty) return searchMeta.specialty;
    for (const grp of specialtyGroups) {
      if (grp.slug === specialty || grp.name === specialty || grp.id === specialty) return grp.name;
      for (const child of (grp.children || [])) {
        if (child.slug === specialty || child.name === specialty || child.id === specialty) return child.name;
      }
    }
    for (const s of specialties) {
      if (typeof s === 'object' && (s.slug === specialty || s.name === specialty || s.id === specialty)) return s.name;
    }
    return specialty.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }, [specialty, searchMeta, specialtyGroups, specialties]);

  const specialtyBnName = searchMeta?.specialty_bn || '';
  const specialtyPluralLabel = lang === 'bn'
    ? `${t('peopleCounter')} ${specialtyBnName || specialtyDisplayName}`
    : pluralizeSpecialty(specialtyDisplayName);

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col selection:bg-primary selection:text-on-primary">
      {/* 1. Sub-Header & Breadcrumb Bar */}
      <DoctorSearchHeader
        specialty={specialtyDisplayName}
        location={districtName || divisionName || 'Bangladesh'}
        onNavigateHome={onNavigateHome}
      />

      {/* 2. Filter Summary & Results Header Strip */}
      <DoctorActiveFiltersBar
        divisionName={divisionName}
        districtName={districtName}
        thanaName={thanaName}
        specialty={specialty}
        specialtyName={specialtyDisplayName}
        specialtyBnName={specialtyBnName}
        facility={facility}
        facilityName={(() => {
          const found = facilities.find(f => String(f.id) === String(facility) || String(f.slug) === String(facility) || String(f.name) === String(facility));
          return found ? (found?.display_name || found?.name || "") : facility;
        })()}
        selectedDay={selectedDay}
        gender={gender}
        totalDoctors={totalCount}
        hasActiveFilters={hasActiveFilters}
        onRemoveDivision={() => { setDivisionId(null); setDistrictId(null); setThanaId(null); setCurrentPage(1); }}
        onRemoveDistrict={() => { setDistrictId(null); setThanaId(null); setCurrentPage(1); }}
        onRemoveThana={() => { setThanaId(null); setCurrentPage(1); }}
        onRemoveSpecialty={() => setSpecialty('')}
        onRemoveFacility={() => setFacility('')}
        onRemoveDay={() => setSelectedDay('All')}
        onRemoveGender={() => setGender('All')}
        onClearAll={handleClearAll}
      />

      {/* 3. Main Container: Search Bar Strip + 2-Column Responsive Layout */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 lg:px-12 py-8 space-y-6">
        {/* Top Search Bar Strip */}
        <DoctorSearchBarStrip
          specialty={specialty}
          onSpecialtyChange={(val) => { setSpecialty(val); setCurrentPage(1); }}
          specialties={specialties}
          specialtyGroups={specialtyGroups}
          facility={facility}
          onFacilityChange={(val) => { setFacility(val); setCurrentPage(1); }}
          facilities={facilities}
          keyword={keyword}
          onKeywordChange={setKeyword}
          onSearchSubmit={() => setCurrentPage(1)}
        />

        {/* Two-Column Layout: Left Filter Sidebar + Right Doctors Results */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Mobile Filter Toggle Icon Button at the Right */}
          <div className="lg:hidden w-full flex justify-end">
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen((prev) => !prev)}
              className="relative p-2.5 bg-surface-container-lowest hover:bg-surface-container-low border border-outline-variant rounded-xl text-primary shadow-xs transition-all flex items-center justify-center cursor-pointer active:scale-95"
              title={isMobileFiltersOpen ? "Hide filters" : "Open filters"}
              aria-label={isMobileFiltersOpen ? "Hide filters" : "Open filters"}
            >
              <span className="material-symbols-outlined text-[22px]">
                {isMobileFiltersOpen ? 'close' : 'tune'}
              </span>
              {!isMobileFiltersOpen && hasActiveFilters && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-surface-container-lowest" />
              )}
            </button>
          </div>

          {/* Left Sidebar Filter Engine */}
          <DoctorFilterSidebar
            divisionId={divisionId}
            districtId={districtId}
            thanaId={thanaId}
            selectedDay={selectedDay}
            gender={gender}
            totalCount={totalCount}
            onDivisionChange={(id) => {
              setDivisionId(id);
              setDistrictId(null);
              setThanaId(null);
              setCurrentPage(1);
            }}
            onDistrictChange={(id) => {
              setDistrictId(id);
              setThanaId(null);
              setCurrentPage(1);
            }}
            onThanaChange={(id) => {
              setThanaId(id);
              setCurrentPage(1);
            }}
            onClearLocation={() => {
              setDivisionId(null);
              setDistrictId(null);
              setThanaId(null);
              setCurrentPage(1);
            }}
            onDayChange={(val) => {
              setSelectedDay(val);
              setCurrentPage(1);
            }}
            onGenderChange={(val) => {
              setGender(val);
              setCurrentPage(1);
            }}
            onResetAll={handleClearAll}
            onApplyFilters={() => {
              setCurrentPage(1);
              setIsMobileFiltersOpen(false);
            }}
            onClose={() => setIsMobileFiltersOpen(false)}
            className={isMobileFiltersOpen ? 'block' : 'hidden lg:block'}
          />

          {/* Right Content Area: Doctor Cards & Pagination */}
          <div className="flex-1 w-full space-y-6 min-w-0">
            {specialty && !isLoading && (
              <div className="text-body-sm text-on-surface font-body-sm">
                <strong className="font-title-md text-primary font-bold">{totalCount}</strong>{' '}
                {specialtyPluralLabel}
              </div>
            )}

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 animate-pulse space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-24 h-24 rounded-xl bg-slate-200 shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-5 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-outline-variant/60">
                      <div className="h-16 bg-slate-100 rounded-lg"></div>
                      <div className="h-16 bg-slate-100 rounded-lg"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : doctors.length > 0 ? (
              doctors.map((doc, idx) => (
                <DoctorCard
                  key={doc.id || idx}
                  doctor={doc}
                  index={idx}
                  filteredFacility={facility}
                  filteredLocation={{
                    division: divisionName,
                    district: districtName,
                    area: thanaName
                  }}
                  specialtyFilterActive={Boolean(specialty)}
                  activeSpecialtyName={specialtyDisplayName}
                  activeSpecialtyBnName={specialtyBnName}
                  onBookDoctorSlot={onBookDoctorSlot}
                  onViewProfile={(d) => {
                    navigate(`/doctor/${d.slug || d.id}`, { state: { doctor: d, chambers: d.chambers } });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onSelectHospital={onSelectHospital}
                  onSelectSpecialty={(specSlug) => {
                    setSpecialty(specSlug);
                    setCurrentPage(1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              ))
            ) : specialty ? (
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-12 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-3xl">person_search</span>
                </div>
                <h3 className="text-lg font-bold text-on-surface">
                  {t('zeroResultsSpecialty', {
                    specialty: lang === 'bn'
                      ? (specialtyBnName || specialtyDisplayName)
                      : pluralizeSpecialty(specialtyDisplayName)
                  })}
                </h3>
                <button
                  type="button"
                  onClick={handleClearLocation}
                  className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">location_off</span>
                  {t('clearLocationFilter')}
                </button>
              </div>
            ) : (
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-12 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-3xl">person_search</span>
                </div>
                <h3 className="text-lg font-bold text-on-surface">{t('noDoctorsFound')}</h3>
                <p className="text-xs sm:text-sm text-outline max-w-md mx-auto">
                  {t('noDoctorsFoundBody')}
                </p>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                  {t('resetAllFilters')}
                </button>
              </div>
            )}

            {!isLoading && currentPage === 1 && specialty && searchMeta?.related_available && (
              <RelatedSpecialists
                specialty={specialty}
                filters={{
                  division_id: divisionId || undefined,
                  district_id: districtId || undefined,
                  thana_id: thanaId || undefined,
                  facility: facility || undefined,
                  gender: gender !== 'All' ? gender : undefined,
                  day: selectedDay !== 'All' && selectedDay !== 'All Days' ? selectedDay : undefined
                }}
                limit={6}
                filteredFacility={facility}
                filteredLocation={{
                  division: divisionName,
                  district: districtName,
                  area: thanaName
                }}
                onBookDoctorSlot={onBookDoctorSlot}
                onViewProfile={(d) => {
                  navigate(`/doctor/${d.slug || d.id}`, { state: { doctor: d, chambers: d.chambers } });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onSelectHospital={onSelectHospital}
                onSelectSpecialty={(specSlug) => {
                  setSpecialty(specSlug);
                  setCurrentPage(1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {/* Pagination Controls */}
            <DoctorPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={pageSize}
              onPageChange={(p) => {
                setCurrentPage(p);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* Directory Verification Trust Seal Section */}
            <DoctorTrustSeal />
          </div>
        </div>
      </main>

      {/* Full Profile Modal */}
      {selectedDoctorForProfile && (
        <DoctorProfileModal
          doctor={selectedDoctorForProfile}
          onClose={() => setSelectedDoctorForProfile(null)}
          onBookDoctorSlot={onBookDoctorSlot}
        />
      )}
    </div>
  );
}
