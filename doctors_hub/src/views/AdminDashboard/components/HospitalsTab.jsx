import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Building2, MapPin, Activity, CheckCircle, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { useAdminContext } from '../context/AdminContext';
import HospitalModal from './modals/HospitalModal';
import AdminPagination from './AdminPagination';
import { api, ensureArray } from '../../../services/api';
import { useDebounce } from '../../../hooks/useDebounce';
import { formatFacilityName } from '../../../utils/facilityUtils';

export default function HospitalsTab() {
  const {
    hospitals: contextHospitals,
    searchTerm,
    setSearchTerm,
    refreshTrigger,
    handleOpenHospitalModal,
    handleDeleteHospital,
    handleOpenBranchTestModal,
    handleNavigateToAddTests,
    setActiveTab
  } = useAdminContext();

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [tabHospitals, setTabHospitals] = useState(contextHospitals || []);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Sync back to page 1 if search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm]);

  // Fetch paginated data (instant on page/refreshTrigger, debounced on search input)
  useEffect(() => {
    let isMounted = true;
    const fetchHospitals = async () => {
      setIsFetching(true);
      try {
        const data = await api.getHospitals({ search: debouncedSearchTerm, page, page_size: 20 });
        if (isMounted) {
          if (data && typeof data === 'object' && 'results' in data) {
             const results = ensureArray(data.results);
             setTabHospitals(results);
             const count = data.count || results.length;
             setTotalCount(count);
             setTotalPages(Math.max(1, Math.ceil(count / 20)));
          } else {
             const arr = ensureArray(data);
             setTabHospitals(arr);
             setTotalCount(arr.length);
             setTotalPages(Math.max(1, Math.ceil(arr.length / 20)));
          }
        }
      } catch (error) {
        console.error("Error fetching hospitals for tab:", error);
      } finally {
        if (isMounted) {
          setIsFetching(false);
          setIsInitialLoad(false);
        }
      }
    };

    fetchHospitals();
    return () => { isMounted = false; };
  }, [debouncedSearchTerm, page, refreshTrigger]);

  return (
    <div className="space-y-6">
      {/* Editorial Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#d1d5dc]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-label font-bold tracking-widest text-[#094cb2] uppercase bg-[#e7ebff] px-2 py-0.5 rounded-xs">
              Healthcare Network
            </span>
            <span className="text-[10px] text-slate-400 font-label">• Institutional Registry</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#1b1c1d] tracking-tight">
            Hospitals & Clinical Campuses
          </h1>
          <p className="text-xs text-slate-500 font-body mt-1 max-w-2xl">
            Centralized registry of affiliated general hospitals, specialized healthcare centers, and regional branch networks across Bangladesh.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => handleOpenHospitalModal()}
            className="flex items-center gap-2 px-4 py-2 bg-[#094cb2] hover:bg-[#083e91] text-white font-label text-xs font-semibold rounded-sm transition shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Register Hospital Branch
          </button>
        </div>
      </div>

      {/* Telemetry Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white border border-[#d1d5dc] p-3.5 rounded-sm shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-label uppercase tracking-wider text-slate-500 font-semibold">Total Facilities</span>
            <Building2 className="w-4 h-4 text-[#094cb2]" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-[#1b1c1d]">
              {totalCount || tabHospitals.length}
            </div>
            <p className="text-[10px] text-slate-500 font-label mt-0.5 flex items-center gap-1">
              <span className="text-emerald-700 font-semibold">Active & Audited</span>
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#d1d5dc] p-3.5 rounded-sm shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-label uppercase tracking-wider text-slate-500 font-semibold">District Coverage</span>
            <MapPin className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-[#1b1c1d]">
              {Array.from(new Set(tabHospitals.map(h => h.district || h.location_details?.district || 'Dhaka'))).length}
            </div>
            <p className="text-[10px] text-slate-500 font-label mt-0.5">
              Districts in active view
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#d1d5dc] p-3.5 rounded-sm shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-label uppercase tracking-wider text-slate-500 font-semibold">Diagnostic Sync</span>
            <Activity className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-[#1b1c1d]">
              100%
            </div>
            <p className="text-[10px] text-slate-500 font-label mt-0.5">
              Pathology catalog mapped
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#d1d5dc] p-3.5 rounded-sm shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-label uppercase tracking-wider text-slate-500 font-semibold">Facility Standards</span>
            <ShieldCheck className="w-4 h-4 text-[#094cb2]" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-[#1b1c1d]">
              DGHS
            </div>
            <p className="text-[10px] text-slate-500 font-label mt-0.5">
              Verified clinical grade
            </p>
          </div>
        </div>
      </div>

      {/* Main Registry Table Container */}
      <div className="bg-white border border-[#d1d5dc] rounded-sm overflow-hidden shadow-card">
        {/* Search & Actions Strip */}
        <div className="p-3.5 border-b border-[#d1d5dc] bg-[#faf9fa] flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search hospital name, branch, district or division..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-[#d1d5dc] rounded-sm pl-8 pr-3 py-1.5 text-xs text-[#1b1c1d] placeholder-slate-400 focus:outline-none focus:border-[#094cb2] focus:ring-1 focus:ring-[#094cb2]/20 font-body"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-label text-slate-500">
              Showing <span className="font-semibold text-slate-800">{tabHospitals.length}</span> facilities
            </span>
          </div>
        </div>

        {/* Responsive Table View */}
        <div className="overflow-x-auto relative">
          {/* Progress indicator for page / filter fetch */}
          {isFetching && !isInitialLoad && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#e7ebff] overflow-hidden z-10">
              <div className="h-full bg-[#094cb2] w-full animate-pulse"></div>
            </div>
          )}

          <table className="w-full text-left text-xs font-body">
            <thead className="bg-[#f7f6f7] text-slate-500 font-label text-[11px] uppercase tracking-wider border-b border-[#d1d5dc]">
              <tr>
                <th className="py-3 px-4 w-[28%] font-semibold">Hospital Name & Tier</th>
                <th className="py-3 px-4 w-[14%] font-semibold">Branch Identity</th>
                <th className="py-3 px-4 w-[26%] font-semibold">Services & Clinical Units</th>
                <th className="py-3 px-4 w-[20%] font-semibold">Location & District</th>
                <th className="py-3 px-4 w-[12%] text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3e5ea] text-slate-700">
              {isInitialLoad ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skel-${i}`} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded-sm w-3/4 mb-1.5"></div><div className="h-3 bg-slate-100 rounded-sm w-1/2"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded-sm w-1/2"></div></td>
                    <td className="py-3.5 px-4"><div className="flex gap-1.5"><div className="h-4 bg-slate-200 rounded-sm w-1/3"></div><div className="h-4 bg-slate-200 rounded-sm w-1/3"></div></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded-sm w-3/4 mb-1.5"></div><div className="h-3 bg-slate-100 rounded-sm w-1/2"></div></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-6 bg-slate-200 rounded-sm w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : tabHospitals.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500">
                    <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-serif text-sm text-slate-700">No hospital facilities found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try refining your search keyword or add a new branch.</p>
                  </td>
                </tr>
              ) : (
                tabHospitals.map(h => {
                  const hId = h.id || h.location_details?.id || h.location_id || h.location;
                  const hName = h.name || h.location_details?.name || h.hospital_name || h.facility_name || 'Hospital';
                  const hTagline = h.tagline || h.location_details?.tagline || '';
                  const hBranch = h.branch || h.location_details?.branch || 'Main Branch';
                  const hCategory = h.category || h.location_details?.category;
                  const hCategoryName = typeof hCategory === 'object' ? hCategory?.name : (hCategory || h.category_name || '');
                  const hServices = Array.isArray(h.services) ? h.services : (Array.isArray(h.location_details?.services) ? h.location_details.services : []);
                  const hAddress = h.address || h.address_line || h.location_details?.address_line || h.location_details?.address || '';
                  const hArea = h.area || h.location_details?.area || '';
                  const hDistrict = h.district || h.city || h.location_details?.district || h.location_details?.city || 'Dhaka';
                  const hDivision = h.division || h.location_details?.division || '';

                  return (
                    <tr key={hId || hName} className={`hover:bg-[#e7ebff]/25 transition-colors ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
                      <td className="py-3.5 px-4">
                        <div className="font-serif font-bold text-sm text-[#1b1c1d]">
                          {formatFacilityName(hName, hBranch)}
                        </div>
                        {hTagline && <div className="text-slate-500 text-[11px] font-normal mt-0.5">{hTagline}</div>}
                        {hCategoryName && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 bg-[#e7ebff] text-[#094cb2] border border-[#094cb2]/20 rounded-xs text-[10px] font-label font-semibold">
                            {hCategoryName}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 border border-[#d1d5dc] rounded-xs text-xs font-label font-medium">
                          {hBranch}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {hServices.length > 0 ? (
                            hServices.map((s, idx) => (
                              <span key={s.id || idx} className="px-1.5 py-0.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-xs text-[10px] font-label">
                                {s.name || s}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">General Inpatient & Emergency</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-700 text-xs">{hAddress || 'Registered Campus Address'}</div>
                        <div className="text-slate-500 font-label text-[11px] mt-0.5">
                          {hArea ? `${hArea}, ` : ''}<span className="font-semibold text-slate-800">{hDistrict}</span>{hDivision ? ` (${hDivision})` : ''}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => {
                            if (handleNavigateToAddTests) {
                              handleNavigateToAddTests('hospital', hId, h);
                            } else if (setActiveTab) {
                              setActiveTab('add-tests-to-diagnostics');
                            }
                          }}
                          title="Add Tests to Facility"
                          className="px-2 py-1 bg-[#e7ebff] text-[#094cb2] hover:bg-[#d9e2ff] border border-[#094cb2]/30 rounded-sm inline-flex items-center gap-1 text-[11px] font-label font-semibold transition cursor-pointer"
                        >
                          <Building2 className="w-3 h-3" /> + Test
                        </button>
                        <button 
                          onClick={() => handleOpenHospitalModal(h)} 
                          title="Edit Hospital Details"
                          className="p-1.5 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 rounded-sm transition cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={async () => {
                            const success = await handleDeleteHospital(hId, hName);
                            if (success) {
                              setTabHospitals(prev => prev.filter(x => (x.id || x.location_details?.id) !== hId));
                              setTotalCount(prev => Math.max(0, prev - 1));
                            }
                          }} 
                          title="Delete Facility"
                          className="p-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-sm transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!isInitialLoad && (
          <div className="border-t border-[#d1d5dc] bg-white px-4 py-3">
            <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      <HospitalModal />
    </div>
  );
}
