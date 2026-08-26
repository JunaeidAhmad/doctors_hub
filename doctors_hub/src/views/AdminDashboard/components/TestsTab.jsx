import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, TestTube } from 'lucide-react';
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
      await api.deleteTest(id).catch(() => null);
      setTabTests(prev => prev.filter(t => String(t.id) !== String(id)));
      setTests(prev => prev.filter(t => String(t.id) !== String(id)));
      showNotification(`Test "${name}" deleted.`);
    } catch (err) {
      alert(`Error deleting test: ${err.message}`);
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
             setTabTests(ensureArray(data.results));
             const count = data.count || 0;
             setTotalPages(Math.max(1, Math.ceil(count / 20)));
          } else {
             const arr = ensureArray(data);
             setTabTests(arr);
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
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search diagnostic test name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            onClick={() => handleOpenTestModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-amber-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add New Diagnostic Test
          </button>
        </div>

        <div className="overflow-x-auto relative">
          {/* Slim progress indicator for page changes */}
          {isFetching && !isInitialLoad && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-800 overflow-hidden z-10">
              <div className="h-full bg-amber-500 w-full animate-pulse"></div>
            </div>
          )}

          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 w-[25%]">Test Name</th>
                <th className="py-3.5 px-4 w-[20%]">Category</th>
                <th className="py-3.5 px-4 w-[15%]">Fasting Required</th>
                <th className="py-3.5 px-4 w-[25%]">Description</th>
                <th className="py-3.5 px-4 w-[15%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 relative">
              {isInitialLoad ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skel-test-${i}`} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 bg-slate-800 rounded w-3/4 mb-2"></div><div className="h-3 bg-slate-800 rounded w-1/2"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-800 rounded w-1/2"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-800 rounded w-1/3"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-800 rounded w-full mb-1"></div><div className="h-4 bg-slate-800 rounded w-5/6"></div></td>
                    <td className="py-4 px-4 text-right"><div className="h-6 bg-slate-800 rounded w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : tabTests.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500">
                    No tests found matching your search.
                  </td>
                </tr>
              ) : (
                tabTests.map(t => (
                  <tr key={t.id} className={`hover:bg-slate-800/40 transition ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
                    <td className="py-4 px-4 font-bold text-white">
                      <div className="text-sm text-amber-400 flex items-center gap-1.5">
                        <TestTube className="w-4 h-4 text-amber-400" />
                        <span>{t.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-300">
                      {t.category_name || t.category || 'General'}
                    </td>
                    <td className="py-4 px-4">
                      {t.fasting_required ? (
                        <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-[10px] font-bold">Yes (Fasting)</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded text-[10px]">No</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                      {t.description || 'Standard diagnostic lab investigation'}
                    </td>
                    <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                      <button onClick={() => handleOpenTestModal(t)} className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 cursor-pointer">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteTest(t.id, t.name)} className="p-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isInitialLoad && (
          <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        )}
      </div>

      <TestModal />
    </>
  );
}
