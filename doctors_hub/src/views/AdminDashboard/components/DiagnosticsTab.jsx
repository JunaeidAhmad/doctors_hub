import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, FlaskConical } from 'lucide-react';
import { useAdminContext } from '../context/AdminContext';
import DiagnosticModal from './modals/DiagnosticModal';
import AdminPagination from './AdminPagination';
import { api, ensureArray } from '../../../services/api';
import { useDebounce } from '../../../hooks/useDebounce';

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
             setTabDiagnostics(ensureArray(data.results));
             const count = data.count || 0;
             setTotalPages(Math.max(1, Math.ceil(count / 20)));
          } else {
             const arr = ensureArray(data);
             setTabDiagnostics(arr);
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
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search diagnostic center name, branch, district or division..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            onClick={() => handleOpenDiagnosticModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-cyan-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add New Diagnostics / Branch
          </button>
        </div>

        <div className="overflow-x-auto relative">
          {/* Slim progress indicator for page changes */}
          {isFetching && !isInitialLoad && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-800 overflow-hidden z-10">
              <div className="h-full bg-cyan-500 w-full animate-pulse"></div>
            </div>
          )}

          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 w-[25%]">Diagnostic Center Name</th>
                <th className="py-3.5 px-4 w-[15%]">Branch</th>
                <th className="py-3.5 px-4 w-[25%]">Services & Facilities</th>
                <th className="py-3.5 px-4 w-[20%]">District / Division</th>
                <th className="py-3.5 px-4 w-[15%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 relative">
              {isInitialLoad ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skel-diag-${i}`} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 bg-slate-800 rounded w-3/4 mb-2"></div><div className="h-3 bg-slate-800 rounded w-1/2"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-800 rounded w-1/2"></div></td>
                    <td className="py-4 px-4"><div className="flex gap-1"><div className="h-4 bg-slate-800 rounded w-1/3"></div><div className="h-4 bg-slate-800 rounded w-1/3"></div></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-800 rounded w-3/4 mb-2"></div><div className="h-3 bg-slate-800 rounded w-1/2"></div></td>
                    <td className="py-4 px-4 text-right"><div className="h-6 bg-slate-800 rounded w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : tabDiagnostics.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500">
                    No diagnostic centers found matching your search.
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
                    <tr key={dcId || dcName} className={`hover:bg-slate-800/40 transition ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
                      <td className="py-4 px-4 font-bold text-white">
                        <div className="text-sm text-cyan-400">{dcName}</div>
                        {dcTagline && <div className="text-slate-400 text-[11px] font-normal">{dcTagline}</div>}
                        {dcCategoryName && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded text-[10px] font-bold">
                            {dcCategoryName}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-bold text-teal-300">
                        {dcBranch}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {dcServices.map((s, idx) => (
                            <span key={s.id || idx} className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded text-[10px] font-bold">
                              {s.name || s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-slate-200">{dcAddress}</div>
                        <div className="text-slate-400 font-bold">
                          {dcArea ? `${dcArea}, ` : ''}{dcDistrict}{dcDivision ? ` (${dcDivision})` : ''}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => {
                            if (handleNavigateToAddTests) {
                              handleNavigateToAddTests('diagnostic_center', dcId, dc);
                            } else if (setActiveTab) {
                              setActiveTab('add-tests-to-diagnostics');
                            }
                          }}
                          title="Add Tests to Facility"
                          className="px-2.5 py-1.5 bg-cyan-500/20 text-cyan-300 rounded-lg hover:bg-cyan-500/30 inline-flex items-center gap-1 text-[11px] font-bold border border-cyan-500/30 transition cursor-pointer"
                        >
                          <FlaskConical className="w-3.5 h-3.5" /> + Test
                        </button>
                        <button onClick={() => handleOpenDiagnosticModal(dc)} className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 cursor-pointer">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={async () => {
                          await handleDeleteDiagnostic(dcId, dcName);
                          setTabDiagnostics(prev => prev.filter(x => (x.id || x.location_details?.id) !== dcId));
                        }} className="p-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
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
          <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        )}
      </div>

      <DiagnosticModal />
    </>
  );
}
