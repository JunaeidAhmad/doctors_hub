import React from 'react';
import { Search, Plus, Edit, Trash2, TestTube } from 'lucide-react';
import { useAdminContext } from '../context/AdminContext';
import { api } from '../../../services/api';
import TestModal from './modals/TestModal';

export default function TestsTab() {
  const {
    tests,
    setTests,
    testCategories,
    searchTerm,
    setSearchTerm,
    setShowTestModal,
    setEditingTest,
    showNotification
  } = useAdminContext();

  const handleOpenTestModal = (t = null) => {
    setEditingTest(t);
    setShowTestModal(true);
  };

  const handleDeleteTest = async (id, name) => {
    if (!window.confirm(`Delete Base Test "${name}"?`)) return;
    try {
      await api.deleteTest(id).catch(() => null);
      setTests(prev => prev.filter(t => String(t.id) !== String(id)));
      showNotification(`Test "${name}" deleted.`);
    } catch (err) {
      alert(`Error deleting test: ${err.message}`);
    }
  };

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
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-amber-600/20"
          >
            <Plus className="w-4 h-4" /> Add New Diagnostic Test
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Test Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Fasting Required</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(tests || [])
                .filter(t => {
                  const catStr = typeof t?.category === 'object' && t?.category ? (t.category.name || '') : (t?.category_name || t?.category || '');
                  return `${t?.name || ''} ${catStr}`.toLowerCase().includes((searchTerm || '').toLowerCase());
                })
                .map(t => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition">
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
                      <button onClick={() => handleOpenTestModal(t)} className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteTest(t.id, t.name)} className="p-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <TestModal />
    </>
  );
}
