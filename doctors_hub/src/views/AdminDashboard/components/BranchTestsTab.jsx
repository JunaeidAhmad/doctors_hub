import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Trash2, Calculator, Building2, FlaskConical } from 'lucide-react';
import { useAdminContext } from '../context/AdminContext';
import BranchTestModal from './modals/BranchTestModal';
import AdminPagination from './AdminPagination';
import { api, ensureArray } from '../../../services/api';

export default function BranchTestsTab() {
  const {
    branchTests: contextBranchTests,
    testCategories = [],
    searchTerm,
    setSearchTerm,
    refreshTrigger,
    handleOpenBranchTestModal,
    handleDeleteBranchTest,
    isSuperAdmin
  } = useAdminContext();

  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tabBranchTests, setTabBranchTests] = useState(contextBranchTests || []);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // Sync back to page 1 if search or category changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedCategory]);

  // Fetch paginated data
  useEffect(() => {
    let isMounted = true;
    const fetchBranchTests = async () => {
      setIsFetching(true);
      try {
        const data = await api.getDiagnosticCenterTests({ search: searchTerm, category: selectedCategory, page, page_size: 20 });
        if (isMounted) {
          if (data && typeof data === 'object' && 'results' in data) {
             setTabBranchTests(ensureArray(data.results));
             const count = data.count || 0;
             const newTotal = Math.max(1, Math.ceil(count / 20));
             setTotalPages(newTotal);
          } else {
             const arr = ensureArray(data);
             setTabBranchTests(arr);
             setTotalPages(Math.max(1, Math.ceil(arr.length / 20)));
          }
        }
      } catch (error) {
        if (isMounted) {
            console.error("Error fetching branch tests for tab:", error);
        }
      } finally {
        if (isMounted) {
          setIsFetching(false);
          setIsInitialLoad(false);
        }
      }
    };

    const delay = searchTerm ? 300 : 0;
    const timer = setTimeout(fetchBranchTests, delay);
    return () => { isMounted = false; clearTimeout(timer); };
  }, [searchTerm, selectedCategory, page, refreshTrigger]);

  // Extract valid category options
  const categoryOptions = useMemo(() => {
    const list = (testCategories || []).filter(c => c && c.id !== 'all');
    if (list.length > 0) return list;
    return [];
  }, [testCategories]);

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[240px]">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search test name or sample..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-teal-500"
            >
              <option value="">All Test Categories</option>
              {categoryOptions.map(cat => (
                <option key={cat.id || cat.slug || cat.name} value={cat.id || cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => handleOpenBranchTestModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-teal-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Test Price Offering
          </button>
        </div>

        <div className="overflow-x-auto relative">
          {/* Slim progress indicator for page changes */}
          {isFetching && !isInitialLoad && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-800 overflow-hidden z-10">
              <div className="h-full bg-teal-500 w-full animate-pulse"></div>
            </div>
          )}

          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                {isSuperAdmin && <th className="py-3.5 px-4 w-[20%]">Facility & Branch</th>}
                <th className="py-3.5 px-4 w-[15%]">Test Name</th>
                <th className="py-3.5 px-4 w-[10%]">Category</th>
                <th className="py-3.5 px-4 w-[10%]">Sample Type</th>
                <th className="py-3.5 px-4 w-[8%]">Original Price</th>
                <th className="py-3.5 px-4 w-[7%]">Discount</th>
                <th className="py-3.5 px-4 w-[10%]">Offer Price</th>
                <th className="py-3.5 px-4 w-[10%]">Report Time</th>
                <th className="py-3.5 px-4 w-[5%]">Availability</th>
                <th className="py-3.5 px-4 w-[5%]">Home Collection</th>
                <th className="py-3.5 px-4 w-[5%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 relative">
              {isInitialLoad ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skel-bt-${i}`} className="animate-pulse">
                    {isSuperAdmin && <td className="py-4 px-4"><div className="h-4 bg-slate-800 rounded w-full mb-1"></div><div className="h-3 bg-slate-800 rounded w-1/2"></div></td>}
                    <td className="py-4 px-4"><div className="h-4 bg-slate-800 rounded w-3/4"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-800 rounded w-1/2"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-800 rounded w-1/2"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-800 rounded w-1/3"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-800 rounded w-1/3"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-800 rounded w-1/3"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-800 rounded w-1/2"></div></td>
                    <td className="py-4 px-4"><div className="w-3 h-3 bg-slate-800 rounded-full"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-800 rounded w-1/2"></div></td>
                    <td className="py-4 px-4 text-right"><div className="h-6 bg-slate-800 rounded w-12 ml-auto"></div></td>
                  </tr>
                ))
              ) : tabBranchTests.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 10 : 9} className="py-8 text-center text-slate-500">
                    No branch tests found matching your search.
                  </td>
                </tr>
              ) : (
                tabBranchTests.map(bt => {
                  const isHospital = bt?.facility_type === 'hospital' || bt?.location_details?.location_type === 'hospital';
                  const facilityName = bt?.facility_name || bt?.location_details?.name || 'Medical Facility';
                  const branchName = bt?.location_details?.branch || 'Main Branch';
                  
                  return (
                    <tr key={bt.id} className={`hover:bg-slate-800/40 transition ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
                      {isSuperAdmin && (
                        <td className="py-4 px-4 font-bold">
                          <div className="flex items-center gap-2">
                            {isHospital ? (
                              <span className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" title="Hospital Diagnostics">
                                <Building2 className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400" title="Diagnostic Center">
                                <FlaskConical className="w-3.5 h-3.5" />
                              </span>
                            )}
                            <div>
                              <div className="text-white text-xs font-bold">{facilityName}</div>
                              <div className="text-[10px] text-slate-400 font-normal">
                                {branchName}
                              </div>
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="py-4 px-4 font-bold text-white">
                        <div className="flex items-center gap-1.5">
                          <Calculator className="w-3.5 h-3.5 text-amber-400" />
                          <span>{bt?.test_details?.name || 'Diagnostic Test'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 rounded-md bg-slate-800 text-[10px] text-slate-300">
                          {bt?.test_details?.category_name || 'N/A'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-400">
                        {bt?.test_details?.sample_type || 'N/A'}
                      </td>
                      <td className="py-4 px-4 line-through text-slate-500">
                        {bt.price != null ? `৳${bt.price}` : '-'}
                      </td>
                      <td className="py-4 px-4 text-rose-400 font-bold">
                        {bt.discount_percent || '-'}
                      </td>
                      <td className="py-4 px-4 text-emerald-400 font-black text-sm">
                        ৳{bt.calculated_price || bt.discounted_price || 0}
                      </td>
                      <td className="py-4 px-4 text-slate-400">
                        {bt.report_time || (bt?.test_details?.report_time_hours ? `${bt.test_details.report_time_hours} hours` : 'N/A')}
                      </td>
                      <td className="py-4 px-4">
                        <div className={`w-3 h-3 rounded-full ${bt.is_available ? 'bg-emerald-500' : 'bg-rose-500'}`} title={bt.is_available ? 'Available' : 'Unavailable'} />
                      </td>
                      <td className="py-4 px-4">
                        {bt.home_sample_collection ? <span className="text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-1 rounded">Yes</span> : <span className="text-slate-500 text-[10px]">No</span>}
                      </td>
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleOpenBranchTestModal(bt)} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer">
                            Edit
                          </button>
                          <button onClick={async () => {
                            await handleDeleteBranchTest(bt.id);
                            setTabBranchTests(prev => prev.filter(x => x.id !== bt.id));
                          }} className="p-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30 cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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

      <BranchTestModal />
    </>
  );
}
