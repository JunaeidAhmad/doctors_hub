import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, FlaskConical, MapPin, Activity, CheckCircle, ShieldCheck } from 'lucide-react';
import { useAdminContext } from '../context/AdminContext';
import DiagnosticModal from './modals/DiagnosticModal';
import AdminPagination from './AdminPagination';
import { api, ensureArray } from '../../../services/api';
import { useDebounce } from '../../../hooks/useDebounce';
import { formatFacilityName } from '../../../utils/facilityUtils';

export default function DiagnosticsTab() {
  const {
    diagnosticCenters: contextDiagnosticCenters,
    searchTerm,
    setSearchTerm,
    refreshTrigger,
    handleOpenDiagnosticModal,
    handleDeleteDiagnostic,
    handleOpenBranchTestModal,
    handleNavigateToAddTests,
    setActiveTab
  } = useAdminContext();

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [tabDiagnostics, setTabDiagnostics] = useState(contextDiagnosticCenters || []);
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
    const fetchDiagnostics = async () => {
      setIsFetching(true);
      try {
        const data = await api.getDiagnosticCenters({ search: debouncedSearchTerm, page, page_size: 20 });
        if (isMounted) {
          if (data && typeof data === 'object' && 'results' in data) {
             const results = ensureArray(data.results);
             setTabDiagnostics(results);
             const count = data.count || results.length;
             setTotalCount(count);
             setTotalPages(Math.max(1, Math.ceil(count / 20)));
          } else {
             const arr = ensureArray(data);
             setTabDiagnostics(arr);
             setTotalCount(arr.length);
             setTotalPages(Math.max(1, Math.ceil(arr.length / 20)));
          }
        }
      } catch (error) {
        console.error("Error fetching diagnostics for tab:", error);
      } finally {
        if (isMounted) {
          setIsFetching(false);
          setIsInitialLoad(false);
        }
      }
    };

    fetchDiagnostics();
    return () => { isMounted = false; };
  }, [debouncedSearchTerm, page, refreshTrigger]);

  return (
    <div className="space-y-6">
      {/* Editorial Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#d1d5dc]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-label font-bold tracking-widest text-[#094cb2] uppercase bg-[#e7ebff] px-2 py-0.5 rounded-xs">
              Laboratory & Imaging
            </span>
            <span className="text-[10px] text-slate-400 font-label">• Pathology Registry</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#1b1c1d] tracking-tight">
            Diagnostic Centers & Pathology Labs
          </h1>
          <p className="text-xs text-slate-500 font-body mt-1 max-w-2xl">
            Accredited pathology laboratories, clinical imaging centers, radiology units, and regional test collection branches.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => handleOpenDiagnosticModal()}
            className="flex items-center gap-2 px-4 py-2 bg-[#094cb2] hover:bg-[#083e91] text-white font-label text-xs font-semibold rounded-sm transition shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Register Diagnostic Branch
          </button>
        </div>
      </div>

      {/* Telemetry Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white border border-[#d1d5dc] p-3.5 rounded-sm shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-label uppercase tracking-wider text-slate-500 font-semibold">Total Labs</span>
            <FlaskConical className="w-4 h-4 text-[#094cb2]" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-[#1b1c1d]">
              {totalCount || tabDiagnostics.length}
            </div>
            <p className="text-[10px] text-slate-500 font-label mt-0.5 flex items-center gap-1">
              <span className="text-emerald-700 font-semibold">Accredited Units</span>
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#d1d5dc] p-3.5 rounded-sm shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-label uppercase tracking-wider text-slate-500 font-semibold">District Footprint</span>
            <MapPin className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-[#1b1c1d]">
              {Array.from(new Set(tabDiagnostics.map(dc => dc.district || dc.location_details?.district || 'Dhaka'))).length}
            </div>
            <p className="text-[10px] text-slate-500 font-label mt-0.5">
              Geographic coverage
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#d1d5dc] p-3.5 rounded-sm shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-label uppercase tracking-wider text-slate-500 font-semibold">Test Catalog Mapped</span>
            <Activity className="w-4 h-4 text-cyan-600" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-[#1b1c1d]">
              Synced
            </div>
            <p className="text-[10px] text-slate-500 font-label mt-0.5">
              Automated fee matrix
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#d1d5dc] p-3.5 rounded-sm shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-label uppercase tracking-wider text-slate-500 font-semibold">Quality Standard</span>
            <ShieldCheck className="w-4 h-4 text-[#094cb2]" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-[#1b1c1d]">
              ISO 15189
            </div>
            <p className="text-[10px] text-slate-500 font-label mt-0.5">
              Diagnostic compliance
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
              placeholder="Search diagnostic center name, branch, district or division..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-[#d1d5dc] rounded-sm pl-8 pr-3 py-1.5 text-xs text-[#1b1c1d] placeholder-slate-400 focus:outline-none focus:border-[#094cb2] focus:ring-1 focus:ring-[#094cb2]/20 font-body"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-label text-slate-500">
              Showing <span className="font-semibold text-slate-800">{tabDiagnostics.length}</span> diagnostic centers
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
                <th className="py-3 px-4 w-[28%] font-semibold">Diagnostic Center & Tier</th>
                <th className="py-3 px-4 w-[14%] font-semibold">Branch Identity</th>
                <th className="py-3 px-4 w-[26%] font-semibold">Services & Laboratories</th>
                <th className="py-3 px-4 w-[20%] font-semibold">District / Division</th>
                <th className="py-3 px-4 w-[12%] text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3e5ea] text-slate-700">
              {isInitialLoad ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skel-diag-${i}`} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded-sm w-3/4 mb-1.5"></div><div className="h-3 bg-slate-100 rounded-sm w-1/2"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded-sm w-1/2"></div></td>
                    <td className="py-3.5 px-4"><div className="flex gap-1.5"><div className="h-4 bg-slate-200 rounded-sm w-1/3"></div><div className="h-4 bg-slate-200 rounded-sm w-1/3"></div></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded-sm w-3/4 mb-1.5"></div><div className="h-3 bg-slate-100 rounded-sm w-1/2"></div></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-6 bg-slate-200 rounded-sm w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : tabDiagnostics.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500">
                    <FlaskConical className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-serif text-sm text-slate-700">No diagnostic centers found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search criteria or register a new diagnostic branch.</p>
                  </td>
                </tr>
              ) : (
                tabDiagnostics.map(dc => {
                  const dcId = dc.id || dc.location_details?.id || dc.location_id || dc.location;
                  const dcName = dc.name || dc.location_details?.name || dc.center_name || dc.facility_name || 'Diagnostic Center';
                  const dcTagline = dc.tagline || dc.location_details?.tagline || '';
                  const dcBranch = dc.branch || dc.location_details?.branch || 'Main Branch';
                  const dcCategory = dc.category || dc.location_details?.category;
                  const dcCategoryName = typeof dcCategory === 'object' ? dcCategory?.name : (dcCategory || dc.category_name || '');
                  const dcServices = Array.isArray(dc.services) ? dc.services : (Array.isArray(dc.location_details?.services) ? dc.location_details.services : []);
                  const dcAddress = dc.address || dc.address_line || dc.location_details?.address_line || dc.location_details?.address || '';
                  const dcArea = dc.area || dc.location_details?.area || '';
                  const dcDistrict = dc.district || dc.city || dc.location_details?.district || dc.location_details?.city || 'Dhaka';
                  const dcDivision = dc.division || dc.location_details?.division || '';

                  return (
                    <tr key={dcId || dcName} className={`hover:bg-[#e7ebff]/25 transition-colors ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
                      <td className="py-3.5 px-4">
                        <div className="font-serif font-bold text-sm text-[#1b1c1d]">
                          {formatFacilityName(dcName, dcBranch)}
                        </div>
                        {dcTagline && <div className="text-slate-500 text-[11px] font-normal mt-0.5">{dcTagline}</div>}
                        {dcCategoryName && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 bg-[#e7ebff] text-[#094cb2] border border-[#094cb2]/20 rounded-xs text-[10px] font-label font-semibold">
                            {dcCategoryName}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 border border-[#d1d5dc] rounded-xs text-xs font-label font-medium">
                          {dcBranch}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {dcServices.length > 0 ? (
                            dcServices.map((s, idx) => (
                              <span key={s.id || idx} className="px-1.5 py-0.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-xs text-[10px] font-label">
                                {s.name || s}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Biochemistry, Hematology & Radiology</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-700 text-xs">{dcAddress || 'Registered Diagnostic Facility'}</div>
                        <div className="text-slate-500 font-label text-[11px] mt-0.5">
                          {dcArea ? `${dcArea}, ` : ''}<span className="font-semibold text-slate-800">{dcDistrict}</span>{dcDivision ? ` (${dcDivision})` : ''}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => {
                            if (handleNavigateToAddTests) {
                              handleNavigateToAddTests('diagnostic_center', dcId, dc);
                            } else if (setActiveTab) {
                              setActiveTab('add-tests-to-diagnostics');
                            }
                          }}
                          title="Add Tests to Facility"
                          className="px-2 py-1 bg-[#e7ebff] text-[#094cb2] hover:bg-[#d9e2ff] border border-[#094cb2]/30 rounded-sm inline-flex items-center gap-1 text-[11px] font-label font-semibold transition cursor-pointer"
                        >
                          <FlaskConical className="w-3 h-3" /> + Test
                        </button>
                        <button 
                          onClick={() => handleOpenDiagnosticModal(dc)} 
                          title="Edit Diagnostic Details"
                          className="p-1.5 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 rounded-sm transition cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={async () => {
                            const success = await handleDeleteDiagnostic(dcId, dcName);
                            if (success) {
                              setTabDiagnostics(prev => prev.filter(x => (x.id || x.location_details?.id) !== dcId));
                              setTotalCount(prev => Math.max(0, prev - 1));
                            }
                          }} 
                          title="Delete Diagnostic Center"
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

      <DiagnosticModal />
    </div>
  );
}
