import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Building2 } from 'lucide-react';
import { useAdminContext } from '../context/AdminContext';
import HospitalModal from './modals/HospitalModal';
import AdminPagination from './AdminPagination';
import { api, ensureArray } from '../../../services/api';

export default function HospitalsTab() {
  const {
    hospitals: contextHospitals,
    searchTerm,
    setSearchTerm,
    refreshTrigger,
    handleOpenHospitalModal,
    handleDeleteHospital,
    handleOpenBranchTestModal
  } = useAdminContext();

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tabHospitals, setTabHospitals] = useState(contextHospitals || []);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // Sync back to page 1 if search changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // Fetch paginated data
  useEffect(() => {
    let isMounted = true;
    const fetchHospitals = async () => {
      setIsFetching(true);
      try {
        const data = await api.getHospitals({ search: searchTerm, page, page_size: 20 });
        if (isMounted) {
          if (data && typeof data === 'object' && 'results' in data) {
             setTabHospitals(ensureArray(data.results));
             const count = data.count || 0;
             setTotalPages(Math.max(1, Math.ceil(count / 20)));
          } else {
             const arr = ensureArray(data);
             setTabHospitals(arr);
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

    const delay = searchTerm ? 300 : 0;
    const timer = setTimeout(fetchHospitals, delay);
    return () => { isMounted = false; clearTimeout(timer); };
  }, [searchTerm, page, refreshTrigger]);

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search hospital name, branch, district or division..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            onClick={() => handleOpenHospitalModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add New Hospital Branch
          </button>
        </div>

        <div className="overflow-x-auto relative">
          {/* Slim progress indicator for page changes */}
          {isFetching && !isInitialLoad && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-800 overflow-hidden z-10">
              <div className="h-full bg-emerald-500 w-full animate-pulse"></div>
            </div>
          )}

          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 w-[25%]">Hospital Name</th>
                <th className="py-3.5 px-4 w-[15%]">Branch</th>
                <th className="py-3.5 px-4 w-[25%]">Services & Facilities</th>
                <th className="py-3.5 px-4 w-[20%]">Location & District</th>
                <th className="py-3.5 px-4 w-[15%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 relative">
              {isInitialLoad ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skel-${i}`} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 bg-slate-800 rounded w-3/4 mb-2"></div><div className="h-3 bg-slate-800 rounded w-1/2"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-800 rounded w-1/2"></div></td>
                    <td className="py-4 px-4"><div className="flex gap-1"><div className="h-4 bg-slate-800 rounded w-1/3"></div><div className="h-4 bg-slate-800 rounded w-1/3"></div></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-800 rounded w-3/4 mb-2"></div><div className="h-3 bg-slate-800 rounded w-1/2"></div></td>
                    <td className="py-4 px-4 text-right"><div className="h-6 bg-slate-800 rounded w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : tabHospitals.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500">
                    No hospitals found matching your search.
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
                    <tr key={hId || hName} className={`hover:bg-slate-800/40 transition ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
                      <td className="py-4 px-4 font-bold text-white">
                        <div className="text-sm text-emerald-400">{hName}</div>
                        {hTagline && <div className="text-slate-400 text-[11px] font-normal">{hTagline}</div>}
                        {hCategoryName && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold">
                            {hCategoryName}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-bold text-teal-300">
                        {hBranch}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {hServices.map((s, idx) => (
                            <span key={s.id || idx} className="px-2 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded text-[10px] font-bold">
                              {s.name || s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-slate-200">{hAddress}</div>
                        <div className="text-slate-400 font-bold">
                          {hArea ? `${hArea}, ` : ''}{hDistrict}{hDivision ? ` (${hDivision})` : ''}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenBranchTestModal && handleOpenBranchTestModal(null, 'hospital', hId)}
                          title="Add Diagnostic Test to this Hospital's Internal Lab"
                          className="px-2.5 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg hover:bg-emerald-500/30 inline-flex items-center gap-1 text-[11px] font-bold border border-emerald-500/30 transition cursor-pointer"
                        >
                          <Building2 className="w-3.5 h-3.5" /> + Test
                        </button>
                        <button onClick={() => handleOpenHospitalModal(h)} className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 cursor-pointer">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={async () => {
                          await handleDeleteHospital(hId, hName);
                          setTabHospitals(prev => prev.filter(x => (x.id || x.location_details?.id) !== hId));
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

      <HospitalModal />
    </>
  );
}
