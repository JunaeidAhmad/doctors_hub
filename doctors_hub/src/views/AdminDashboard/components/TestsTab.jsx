import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, TestTube, Activity, Clock, ShieldCheck, CheckCircle } from 'lucide-react';
import { useAdminContext } from '../context/AdminContext';
import { api, ensureArray } from '../../../services/api';
import TestModal from './modals/TestModal';
import AdminPagination from './AdminPagination';
import { useDebounce } from '../../../hooks/useDebounce';

export default function TestsTab() {
  const {
    tests: contextTests,
    setTests,
    testCategories,
    searchTerm,
    setSearchTerm,
    refreshTrigger,
    setShowTestModal,
    setEditingTest,
    showNotification
  } = useAdminContext();

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [tabTests, setTabTests] = useState(contextTests || []);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const handleOpenTestModal = (t = null) => {
    setEditingTest(t);
    setShowTestModal(true);
  };

  const handleDeleteTest = async (id, name) => {
    if (!window.confirm(`Delete Base Test "${name}"?`)) return;
    try {
      await api.deleteTest(id);
      setTabTests(prev => prev.filter(t => String(t.id) !== String(id)));
      setTests(prev => prev.filter(t => String(t.id) !== String(id)));
      showNotification(`Test "${name}" deleted.`);
    } catch (err) {
      if (showToast) showToast(`Error deleting test: ${err.message}`, 'error');
      else alert(`Error deleting test: ${err.message}`);
    }
  };

  // Sync back to page 1 if search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm]);

  // Fetch paginated data (instant on page/refreshTrigger, debounced on search text)
  useEffect(() => {
    let isMounted = true;
    const fetchTests = async () => {
      setIsFetching(true);
      try {
        const data = await api.getTests({ search: debouncedSearchTerm, page, page_size: 20 });
        if (isMounted) {
          if (data && typeof data === 'object' && 'results' in data) {
             const results = ensureArray(data.results);
             setTabTests(results);
             const count = data.count || results.length;
             setTotalCount(count);
             setTotalPages(Math.max(1, Math.ceil(count / 20)));
          } else {
             const arr = ensureArray(data);
             setTabTests(arr);
             setTotalCount(arr.length);
             setTotalPages(Math.max(1, Math.ceil(arr.length / 20)));
          }
        }
      } catch (error) {
        console.error("Error fetching tests for tab:", error);
      } finally {
        if (isMounted) {
          setIsFetching(false);
          setIsInitialLoad(false);
        }
      }
    };

    fetchTests();
    return () => { isMounted = false; };
  }, [debouncedSearchTerm, page, refreshTrigger]);

  return (
    <div className="space-y-6">
      {/* Editorial Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#d1d5dc]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-label font-bold tracking-widest text-[#094cb2] uppercase bg-[#e7ebff] px-2 py-0.5 rounded-xs">
              Pathology Master Catalog
            </span>
            <span className="text-[10px] text-slate-400 font-label">• Investigation Specs</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#1b1c1d] tracking-tight">
            Base Diagnostic Tests
          </h1>
          <p className="text-xs text-slate-500 font-body mt-1 max-w-2xl">
            Standard pathology definitions, biological specimen requirements, patient fasting instructions, and turnaround metrics.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => handleOpenTestModal()}
            className="flex items-center gap-2 px-4 py-2 bg-[#094cb2] hover:bg-[#083e91] text-white font-label text-xs font-semibold rounded-sm transition shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Diagnostic Test
          </button>
        </div>
      </div>

      {/* Telemetry Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white border border-[#d1d5dc] p-3.5 rounded-sm shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-label uppercase tracking-wider text-slate-500 font-semibold">Total Catalog Tests</span>
            <TestTube className="w-4 h-4 text-[#094cb2]" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-[#1b1c1d]">
              {totalCount || tabTests.length}
            </div>
            <p className="text-[10px] text-slate-500 font-label mt-0.5">Standardized test models</p>
          </div>
        </div>

        <div className="bg-white border border-[#d1d5dc] p-3.5 rounded-sm shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-label uppercase tracking-wider text-slate-500 font-semibold">Categories</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-[#1b1c1d]">
              {testCategories?.length || 8}
            </div>
            <p className="text-[10px] text-slate-500 font-label mt-0.5">Investigation domains</p>
          </div>
        </div>

        <div className="bg-white border border-[#d1d5dc] p-3.5 rounded-sm shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-label uppercase tracking-wider text-slate-500 font-semibold">Fasting Tests</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-[#1b1c1d]">
              {tabTests.filter(t => t.fasting_required).length}
            </div>
            <p className="text-[10px] text-slate-500 font-label mt-0.5">Requires patient preparation</p>
          </div>
        </div>

        <div className="bg-white border border-[#d1d5dc] p-3.5 rounded-sm shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-label uppercase tracking-wider text-slate-500 font-semibold">Compliance</span>
            <ShieldCheck className="w-4 h-4 text-[#094cb2]" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-[#1b1c1d]">
              100%
            </div>
            <p className="text-[10px] text-slate-500 font-label mt-0.5">Clinical laboratory spec</p>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-[#d1d5dc] rounded-sm overflow-hidden shadow-card">
        <div className="p-3.5 border-b border-[#d1d5dc] bg-[#faf9fa] flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search diagnostic test name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-[#d1d5dc] rounded-sm pl-8 pr-3 py-1.5 text-xs text-[#1b1c1d] placeholder-slate-400 focus:outline-none focus:border-[#094cb2] font-body"
            />
          </div>
          <span className="text-[11px] font-label text-slate-500">
            Showing <span className="font-semibold text-slate-800">{tabTests.length}</span> tests
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
                <th className="py-3 px-4 w-[28%] font-semibold">Test Name & Spec</th>
                <th className="py-3 px-4 w-[20%] font-semibold">Category Domain</th>
                <th className="py-3 px-4 w-[16%] font-semibold">Preparation</th>
                <th className="py-3 px-4 w-[24%] font-semibold">Description</th>
                <th className="py-3 px-4 w-[12%] text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3e5ea] text-slate-700">
              {isInitialLoad ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skel-test-${i}`} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded-sm w-3/4 mb-1.5"></div><div className="h-3 bg-slate-100 rounded-sm w-1/2"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded-sm w-1/2"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded-sm w-1/3"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded-sm w-full mb-1"></div></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-6 bg-slate-200 rounded-sm w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : tabTests.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500">
                    <TestTube className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-serif text-sm text-slate-700">No diagnostic tests found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try refining your search keyword or add a new diagnostic test.</p>
                  </td>
                </tr>
              ) : (
                tabTests.map(t => (
                  <tr key={t.id} className={`hover:bg-[#e7ebff]/25 transition-colors ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
                    <td className="py-3.5 px-4">
                      <div className="font-serif font-bold text-sm text-[#1b1c1d] flex items-center gap-1.5">
                        <TestTube className="w-3.5 h-3.5 text-[#094cb2]" />
                        <span>{t.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 border border-[#d1d5dc] rounded-xs text-[11px] font-label font-medium">
                        {t.category_name || t.category || 'General'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {t.fasting_required ? (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xs text-[10px] font-label font-bold">
                          Yes (Fasting)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-200 rounded-xs text-[10px] font-label">
                          No Fasting
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs font-body max-w-xs truncate">
                      {t.description || 'Standard diagnostic lab investigation'}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button 
                        onClick={() => handleOpenTestModal(t)} 
                        title="Edit Test Details"
                        className="p-1.5 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 rounded-sm transition cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteTest(t.id, t.name)} 
                        title="Delete Test"
                        className="p-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-sm transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
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

      <TestModal />
    </div>
  );
}
