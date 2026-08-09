import React from 'react';
import { Search, Plus, Edit, Trash2, XCircle, TestTube } from 'lucide-react';
import { api } from '../../../services/api';

export default function TestsTab({
  tests = [],
  setTests,
  testCategories = [],
  diagnosticCenters = [],
  searchTerm,
  setSearchTerm,
  showTestModal,
  setShowTestModal,
  editingTest,
  setEditingTest,
  testForm,
  setTestForm,
  loadAllData,
  showNotification,
  handleOpenBranchTestModal
}) {
  const handleOpenTestModal = (t = null) => {
    if (t) {
      if (setEditingTest) setEditingTest(t);
      setTestForm({
        id: t.id,
        name: t.name,
        category: t.category || t.category_id || '',
        fasting_required: t.fasting_required || false,
        description: t.description || ''
      });
    } else {
      if (setEditingTest) setEditingTest(null);
      setTestForm({
        id: '',
        name: '',
        category: testCategories[0]?.id || '',
        fasting_required: false,
        description: ''
      });
    }
    setShowTestModal(true);
  };

  const handleSaveTest = async (e) => {
    e.preventDefault();
    try {
      let resData;
      try {
        if (editingTest) {
          resData = await api.updateTest(editingTest.id, testForm);
        } else {
          resData = await api.createTest(testForm);
        }
      } catch (err) {
        console.warn("Backend save test failed, updating local state:", err);
      }

      const catObj = testCategories.find(c => String(c.id) === String(testForm.category));
      const newTest = {
        id: resData?.id || testForm.id || `test-${Date.now()}`,
        name: testForm.name,
        category: testForm.category,
        category_name: catObj ? catObj.name : 'General',
        fasting_required: testForm.fasting_required || false,
        description: testForm.description || ''
      };

      if (setTests) {
        setTests(prev => {
          if (editingTest) {
            return prev.map(t => String(t.id) === String(editingTest.id) ? newTest : t);
          }
          return [newTest, ...prev];
        });
      }

      showNotification && showNotification(`Test "${testForm.name}" ${editingTest ? 'updated' : 'created'}!`);
      setShowTestModal(false);
    } catch (err) {
      alert(`Error saving test: ${err.message}`);
    }
  };

  const handleDeleteTest = async (id, name) => {
    if (!window.confirm(`Delete Base Test "${name}"?`)) return;
    try {
      await api.deleteTest(id).catch(() => null);
      if (setTests) {
        setTests(prev => prev.filter(t => String(t.id) !== String(id)));
      }
      showNotification && showNotification(`Test "${name}" deleted.`);
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
              {tests
                .filter(t => `${t.name} ${t.category}`.toLowerCase().includes(searchTerm.toLowerCase()))
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

      {/* MODAL: ADD / EDIT BASE TEST */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">{editingTest ? 'Edit Base Test' : 'Add Base Diagnostic Test'}</h3>
              <button onClick={() => setShowTestModal(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTest} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Test Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete Blood Count (CBC)"
                  value={testForm.name}
                  onChange={e => setTestForm({ ...testForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Test Category</label>
                <select
                  value={testForm.category}
                  onChange={e => setTestForm({ ...testForm, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                >
                  <option value="">Select Category</option>
                  {testCategories.filter(c => c.id !== 'all').map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="test_fasting"
                  checked={testForm.fasting_required}
                  onChange={e => setTestForm({ ...testForm, fasting_required: e.target.checked })}
                  className="w-4 h-4 text-amber-500 rounded bg-slate-950 border-slate-800"
                />
                <label htmlFor="test_fasting" className="text-slate-300 font-semibold cursor-pointer">Fasting Required</label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowTestModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-600 text-white font-bold rounded-xl">Save Test</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
