import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DIVISIONS, findDivisionForDistrict } from '../../data/constants';
import { api, ensureArray } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';

import DoctorSearchHeader from './components/DoctorSearchHeader';
import DoctorActiveFiltersBar from './components/DoctorActiveFiltersBar';
import DoctorSearchBarStrip from './components/DoctorSearchBarStrip';
import DoctorFilterSidebar from './components/DoctorFilterSidebar';
import DoctorCard from './components/DoctorCard';
import DoctorPagination from './components/DoctorPagination';
import DoctorTrustSeal from './components/DoctorTrustSeal';
import DoctorProfileModal from './components/DoctorProfileModal';

export default function DoctorSearchPage({
  initialSpecialty = '',
  initialLocation = 'All Bangladesh',
  initialKeyword = '',
  onBookDoctorSlot,
  onSelectHospital,
  onNavigateHome
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const lastParamsRef = useRef(searchParams.toString());

  const getParam = (key, fallback) => {
    const v = searchParams.get(key);
    return v === null || v === undefined ? fallback : v;
  };

  // State
  const [specialty, setSpecialty] = useState(() => getParam('spec', initialSpecialty));
  const [division, setDivision] = useState(() => {
    const urlDiv = getParam('division', '');
    if (urlDiv) return urlDiv;
    const urlLoc = getParam('loc', initialLocation);
    if (DIVISIONS.includes(urlLoc)) return urlLoc;
    const found = findDivisionForDistrict(urlLoc);
    return found || 'All Bangladesh';
  });
  const [district, setDistrict] = useState(() => {
    const urlDist = getParam('district', '');
    if (urlDist) return urlDist;
    const urlLoc = getParam('loc', '');
    if (urlLoc && !DIVISIONS.includes(urlLoc) && urlLoc !== 'All Bangladesh') return urlLoc;
    return 'All Districts';
  });
  const [area, setArea] = useState(() => getParam('area', 'All Areas'));
  const [facility, setFacility] = useState(() => getParam('facility', ''));
  const [keyword, setKeyword] = useState(() => getParam('q', initialKeyword));
  const debouncedKeyword = useDebounce(keyword, 350);
  const [selectedDay, setSelectedDay] = useState(() => getParam('day', 'All'));
  const [gender, setGender] = useState(() => getParam('gender', 'All'));
  const [maxFee, setMaxFee] = useState(3000);
  const [sortOrder, setSortOrder] = useState(() => getParam('sort', 'recommended'));
  const [currentPage, setCurrentPage] = useState(() => {
    const p = parseInt(getParam('page', '1'), 10);
    return isNaN(p) || p < 1 ? 1 : p;
  });

  const pageSize = 20;
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDoctorForProfile, setSelectedDoctorForProfile] = useState(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Sync state from URL search params on back/forward navigation
  useEffect(() => {
    if (lastParamsRef.current === searchParams.toString()) return;
    lastParamsRef.current = searchParams.toString();

    setSpecialty(searchParams.get('spec') || '');
    setDivision(searchParams.get('division') || 'All Bangladesh');
    setDistrict(searchParams.get('district') || 'All Districts');
    setArea(searchParams.get('area') || 'All Areas');
    setFacility(searchParams.get('facility') || '');
    setKeyword(searchParams.get('q') || '');
    setSelectedDay(searchParams.get('day') || 'All');
    setGender(searchParams.get('gender') || 'All');
    setSortOrder(searchParams.get('sort') || 'recommended');
    const p = parseInt(searchParams.get('page') || '1', 10);
    setCurrentPage(isNaN(p) || p < 1 ? 1 : p);
  }, [searchParams]);

  // Sync state to URL search params
  useEffect(() => {
    const params = new URLSearchParams();
    if (specialty) params.set('spec', specialty);
    if (division && division !== 'All Bangladesh') params.set('division', division);
    if (district && district !== 'All Districts') params.set('district', district);
    if (area && area !== 'All Areas') params.set('area', area);
    if (facility) params.set('facility', facility);
    if (keyword.trim()) params.set('q', keyword.trim());
    if (selectedDay && selectedDay !== 'All' && selectedDay !== 'All Days') params.set('day', selectedDay);
    if (gender && gender !== 'All') params.set('gender', gender);
    if (sortOrder && sortOrder !== 'recommended') params.set('sort', sortOrder);
    if (currentPage > 1) params.set('page', String(currentPage));

    const next = params.toString();
    if (next !== lastParamsRef.current) {
      lastParamsRef.current = next;
      setSearchParams(params, { replace: true });
    }
  }, [specialty, division, district, area, facility, keyword, selectedDay, gender, sortOrder, currentPage, setSearchParams]);

  // Load specialties and facility options on mount
  useEffect(() => {
    let isMounted = true;
    api.getSearchMetadata()
      .then((meta) => {
        if (isMounted && meta) {
          if (meta.specialties) setSpecialties(ensureArray(meta.specialties));
          if (meta.hospitals || meta.diagnostic_centers) {
            const list = [
              ...ensureArray(meta.hospitals),
              ...ensureArray(meta.diagnostic_centers)
            ];
            setFacilities(list);
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
      division: division !== 'All Bangladesh' ? division : undefined,
      district: district !== 'All Districts' ? district : undefined,
      area: area !== 'All Areas' ? area : undefined,
      facility: facility || undefined,
      gender: gender !== 'All' ? gender : undefined,
      search: debouncedKeyword.trim() || undefined,
      fee_max: maxFee < 3000 ? maxFee : undefined,
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
  }, [specialty, division, district, area, facility, gender, debouncedKeyword, maxFee, selectedDay, currentPage]);

  // Client-side sorting
  const sortedDoctors = useMemo(() => {
    const list = [...doctors];
    if (sortOrder === 'highest_rated') {
      return list.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    }
    if (sortOrder === 'experience') {
      return list.sort((a, b) => {
        const expA = parseInt(a.experience || '0', 10) || 0;
        const expB = parseInt(b.experience || '0', 10) || 0;
        return expB - expA;
      });
    }
    if (sortOrder === 'fee_low') {
      return list.sort((a, b) => {
        const feeA = Number(a.fee) || (a.affiliations?.[0]?.fee) || 1000;
        const feeB = Number(b.fee) || (b.affiliations?.[0]?.fee) || 1000;
        return feeA - feeB;
      });
    }
    if (sortOrder === 'fee_high') {
      return list.sort((a, b) => {
        const feeA = Number(a.fee) || (a.affiliations?.[0]?.fee) || 1000;
        const feeB = Number(b.fee) || (b.affiliations?.[0]?.fee) || 1000;
        return feeB - feeA;
      });
    }
    return list;
  }, [doctors, sortOrder]);

  const hasActiveFilters = Boolean(
    specialty ||
    (division && division !== 'All Bangladesh') ||
    (district && district !== 'All Districts') ||
    (area && area !== 'All Areas') ||
    facility ||
    (keyword && keyword.trim()) ||
    (selectedDay && selectedDay !== 'All' && selectedDay !== 'All Days') ||
    (gender && gender !== 'All') ||
    maxFee < 3000
  );

  const handleClearAll = () => {
    setSpecialty('');
    setDivision('All Bangladesh');
    setDistrict('All Districts');
    setArea('All Areas');
    setFacility('');
    setKeyword('');
    setSelectedDay('All');
    setGender('All');
    setMaxFee(3000);
    setCurrentPage(1);
  };

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col selection:bg-primary selection:text-on-primary">
      {/* 1. Sub-Header & Breadcrumb Bar */}
      <DoctorSearchHeader
        specialty={specialty}
        location={district !== 'All Districts' ? district : (division !== 'All Bangladesh' ? division : 'Dhaka')}
        onNavigateHome={onNavigateHome}
      />

      {/* 2. Filter Summary & Results Header Strip */}
      <DoctorActiveFiltersBar
        division={division}
        district={district}
        area={area}
        specialty={specialty}
        facility={facility}
        facilityName={facilities.find(f => String(f.id) === String(facility))?.name}
        selectedDay={selectedDay}
        gender={gender}
        maxFee={maxFee}
        totalDoctors={totalCount}
        hasActiveFilters={hasActiveFilters}
        onRemoveDivision={() => { setDivision('All Bangladesh'); setDistrict('All Districts'); setArea('All Areas'); }}
        onRemoveDistrict={() => { setDistrict('All Districts'); setArea('All Areas'); }}
        onRemoveArea={() => setArea('All Areas')}
        onRemoveSpecialty={() => setSpecialty('')}
        onRemoveFacility={() => setFacility('')}
        onRemoveDay={() => setSelectedDay('All')}
        onRemoveGender={() => setGender('All')}
        onRemoveFee={() => setMaxFee(3000)}
        onClearAll={handleClearAll}
      />

      {/* 3. Main Container: Search Bar Strip + 2-Column Responsive Layout */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 lg:px-12 py-8 space-y-6">
        {/* Top Search Bar Strip */}
        <DoctorSearchBarStrip
          specialty={specialty}
          onSpecialtyChange={(val) => { setSpecialty(val); setCurrentPage(1); }}
          specialties={specialties}
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
            division={division}
            district={district}
            area={area}
            selectedDay={selectedDay}
            gender={gender}
            totalCount={totalCount}
            onDivisionChange={(val) => {
              setDivision(val);
              setDistrict('All Districts');
              setArea('All Areas');
              setCurrentPage(1);
            }}
            onDistrictChange={(val) => {
              setDistrict(val);
              setArea('All Areas');
              setCurrentPage(1);
            }}
            onAreaChange={(val) => {
              setArea(val);
              setCurrentPage(1);
            }}
            onClearLocation={() => {
              setDivision('All Bangladesh');
              setDistrict('All Districts');
              setArea('All Areas');
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
            ) : sortedDoctors.length > 0 ? (
              sortedDoctors.map((doc, idx) => (
                <DoctorCard
                  key={doc.id || idx}
                  doctor={doc}
                  index={idx}
                  onBookDoctorSlot={onBookDoctorSlot}
                  onViewProfile={(d) => {
                    navigate(`/doctor/${d.slug || d.id}`, { state: { doctor: d, chambers: d.chambers } });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onSelectHospital={onSelectHospital}
                />
              ))
            ) : (
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-12 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-3xl">person_search</span>
                </div>
                <h3 className="text-lg font-bold text-on-surface">No Doctors Found</h3>
                <p className="text-xs sm:text-sm text-outline max-w-md mx-auto">
                  We couldn't find any verified specialists matching your criteria. Try adjusting your specialty, location, or day filters.
                </p>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                  Reset All Filters
                </button>
              </div>
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
