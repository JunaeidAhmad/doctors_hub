import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Trash2, Edit, Calculator, Building2, FlaskConical, MapPin, Tag, Activity, Home } from 'lucide-react';
import { useAdminContext } from '../context/AdminContext';
import BranchTestModal from './modals/BranchTestModal';
import AdminPagination from './AdminPagination';
import { api, ensureArray } from '../../../services/api';
import { useDebounce } from '../../../hooks/useDebounce';
import { formatFacilityName } from '../../../utils/facilityUtils';

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
  const [totalCount, setTotalCount] = useState(0);
  const [tabBranchTests, setTabBranchTests] = useState(contextBranchTests || []);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Sync back to page 1 if search or category changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, selectedCategory]);

  // Fetch paginated data (instant on category/page/refreshTrigger, debounced on search text)
  useEffect(() => {
    let isMounted = true;
    const fetchBranchTests = async () => {
      setIsFetching(true);
      try {
        const data = await api.getDiagnosticCenterTests({ search: debouncedSearchTerm, category: selectedCategory, page, page_size: 20 });
        if (isMounted) {
          if (data && typeof data === 'object' && 'results' in data) {
             const results = ensureArray(data.results);
             setTabBranchTests(results);
             const count = data.count || results.length;
             setTotalCount(count);
             setTotalPages(Math.max(1, Math.ceil(count / 20)));
          } else {
             const arr = ensureArray(data);
             setTabBranchTests(arr);
             setTotalCount(arr.length);
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

    fetchBranchTests();
    return () => { isMounted = false; };
  }, [debouncedSearchTerm, selectedCategory, page, refreshTrigger]);

  // Extract valid category options
  const categoryOptions = useMemo(() => {
    const list = (testCategories || []).filter(c => c && c.id !== 'all');
    if (list.length > 0) return list;
    return [];
  }, [testCategories]);

  return (
    <div className="space-y-6">
      {/* Editorial Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#d1d5dc]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-label font-bold tracking-widest text-[#094cb2] uppercase bg-[#e7ebff] px-2 py-0.5 rounded-xs">
              Fee Matrices & Catalog
            </span>
            <span className="text-[10px] text-slate-400 font-label">• Localized Pricing</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#1b1c1d] tracking-tight">
            Facility Test Offerings & Pricing Matrix
          </h1>
          <p className="text-xs text-slate-500 font-body mt-1 max-w-2xl">
            Configure branch-specific pathology pricing, commercial discounts, specimen turnaround hours, and home sample collection capabilities.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => handleOpenBranchTestModal()}
            className="flex items-center gap-2 px-4 py-2 bg-[#094cb2] hover:bg-[#083e91] text-white font-label text-xs font-semibold rounded-sm transition shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Test Price Offering
          </button>
        </div>
      </div>

      {/* Telemetry Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white border border-[#d1d5dc] p-3.5 rounded-sm shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-label uppercase tracking-wider text-slate-500 font-semibold">Active Offerings</span>
            <Calculator className="w-4 h-4 text-[#094cb2]" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-[#1b1c1d]">
              {totalCount || tabBranchTests.length}
            </div>
            <p className="text-[10px] text-slate-500 font-label mt-0.5">Published branch tariffs</p>
          </div>
        </div>

        <div className="bg-white border border-[#d1d5dc] p-3.5 rounded-sm shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-label uppercase tracking-wider text-slate-500 font-semibold">Category Scope</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-[#1b1c1d]">
              {categoryOptions.length || 6}
            </div>
            <p className="text-[10px] text-slate-500 font-label mt-0.5">Covered departments</p>
          </div>
        </div>

        <div className="bg-white border border-[#d1d5dc] p-3.5 rounded-sm shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-label uppercase tracking-wider text-slate-500 font-semibold">Home Collection</span>
            <Home className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-[#1b1c1d]">
              {tabBranchTests.filter(bt => bt.home_sample_collection).length}
            </div>
            <p className="text-[10px] text-slate-500 font-label mt-0.5">Doorstep sample ready</p>
          </div>
        </div>

        <div className="bg-white border border-[#d1d5dc] p-3.5 rounded-sm shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-label uppercase tracking-wider text-slate-500 font-semibold">Discount Program</span>
            <Tag className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-[#1b1c1d]">
              Active
            </div>
            <p className="text-[10px] text-slate-500 font-label mt-0.5">Automated rate calculator</p>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-[#d1d5dc] rounded-sm overflow-hidden shadow-card">
        {/* Search & Category Filter Strip */}
        <div className="p-3.5 border-b border-[#d1d5dc] bg-[#faf9fa] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search test name or sample..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-[#d1d5dc] rounded-sm pl-8 pr-3 py-1.5 text-xs text-[#1b1c1d] placeholder-slate-400 focus:outline-none focus:border-[#094cb2] font-body"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-[#d1d5dc] rounded-sm px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-[#094cb2] font-body cursor-pointer"
            >
              <option value="">All Test Categories</option>
              {categoryOptions.map(cat => (
                <option key={cat.id || cat.slug || cat.name} value={cat.id || cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <span className="text-[11px] font-label text-slate-500">
            Showing <span className="font-semibold text-slate-800">{tabBranchTests.length}</span> price records
          </span>
        </div>

        <div className="overflow-x-auto relative">
          {/* Progress indicator */}
          {isFetching && !isInitialLoad && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#e7ebff] overflow-hidden z-10">
              <div className="h-full bg-[#094cb2] w-full animate-pulse"></div>
            </div>
          )}

          <table className="w-full text-left text-xs font-body">
            <thead className="bg-[#f7f6f7] text-slate-500 font-label text-[11px] uppercase tracking-wider border-b border-[#d1d5dc]">
              <tr>
                {isSuperAdmin && <th className="py-3 px-4 w-[18%] font-semibold">Facility & Branch</th>}
                <th className="py-3 px-4 w-[18%] font-semibold">Test Name</th>
                <th className="py-3 px-4 w-[10%] font-semibold">Category</th>
                <th className="py-3 px-4 w-[10%] font-semibold">Sample</th>
                <th className="py-3 px-4 w-[8%] font-semibold">Regular</th>
                <th className="py-3 px-4 w-[8%] font-semibold">Discount</th>
                <th className="py-3 px-4 w-[10%] font-semibold">Offer Price</th>
                <th className="py-3 px-4 w-[10%] font-semibold">Report Time</th>
                <th className="py-3 px-4 w-[8%] font-semibold">Home Pickup</th>
                <th className="py-3 px-4 w-[8%] text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3e5ea] text-slate-700">
              {isInitialLoad ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skel-bt-${i}`} className="animate-pulse">
                    {isSuperAdmin && <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded-sm w-full mb-1"></div><div className="h-3 bg-slate-100 rounded-sm w-1/2"></div></td>}
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded-sm w-3/4"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded-sm w-1/2"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded-sm w-1/2"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded-sm w-1/3"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded-sm w-1/3"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded-sm w-1/3"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded-sm w-1/2"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded-sm w-1/2"></div></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-6 bg-slate-200 rounded-sm w-12 ml-auto"></div></td>
                  </tr>
                ))
              ) : tabBranchTests.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 10 : 9} className="py-12 text-center text-slate-500">
                    <Calculator className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-serif text-sm text-slate-700">No branch test offerings found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search query or add a new pricing record.</p>
                  </td>
                </tr>
              ) : (
                tabBranchTests.map(bt => {
                  const isHospital = bt?.facility_type === 'hospital' || bt?.location_details?.location_type === 'hospital';
                  const facilityName = bt?.facility_name || bt?.location_details?.name || 'Medical Facility';
                  const branchName = bt?.location_details?.branch || 'Main Branch';
                  
                  return (
                    <tr key={bt.id} className={`hover:bg-[#e7ebff]/25 transition-colors ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
                      {isSuperAdmin && (
                        <td className="py-3.5 px-4 font-body">
                          <div className="flex items-center gap-1.5">
                            {isHospital ? (
                              <Building2 className="w-3.5 h-3.5 text-[#094cb2] shrink-0" />
                            ) : (
                              <FlaskConical className="w-3.5 h-3.5 text-cyan-700 shrink-0" />
                            )}
                            <div>
                              <div className="font-serif font-bold text-xs text-[#1b1c1d]">{formatFacilityName(facilityName, branchName)}</div>
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="py-3.5 px-4">
                        <div className="font-serif font-bold text-sm text-[#1b1c1d] flex items-center gap-1.5">
                          <Calculator className="w-3.5 h-3.5 text-[#094cb2]" />
                          <span>{bt?.test_details?.name || 'Diagnostic Test'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-[#d1d5dc] rounded-xs text-[10px] font-label">
                          {bt?.test_details?.category_name || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-body text-xs">
                        {bt?.test_details?.sample_type || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 line-through text-slate-400 font-mono text-xs">
                        {bt.price != null ? `৳${bt.price}` : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-rose-700 font-label font-bold text-xs">
                        {bt.discount_percent || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-[#094cb2] font-serif font-bold text-sm">
                        ৳{bt.calculated_price || bt.discounted_price || 0}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs font-body">
                        {bt.report_time || (bt?.test_details?.report_time_hours ? `${bt.test_details.report_time_hours} hrs` : 'N/A')}
                      </td>
                      <td className="py-3.5 px-4">
                        {bt.home_sample_collection ? (
                          <span className="px-1.5 py-0.5 rounded-xs bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-label font-bold">
                            Yes
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-body">No</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                        <button 
                          onClick={() => handleOpenBranchTestModal(bt)} 
                          title="Edit Pricing"
                          className="p-1.5 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 rounded-sm transition cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={async () => {
                            const success = await handleDeleteBranchTest(bt.id);
                            if (success) {
                              setTabBranchTests(prev => prev.filter(x => x.id !== bt.id));
                              setTotalCount(prev => Math.max(0, prev - 1));
                            }
                          }} 
                          title="Delete Offering"
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

      <BranchTestModal />
    </div>
  );
}
