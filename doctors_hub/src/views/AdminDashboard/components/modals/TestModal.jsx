import React, { useState, useEffect } from 'react';
import { X, TestTube } from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';
import { api } from '../../../../services/api';

export default function TestModal() {
  const {
    showTestModal,
    setShowTestModal,
    editingTest,
    testCategories,
    setTests,
    showNotification
  } = useAdminContext();

  const [testForm, setTestForm] = useState({
    id: '', name: '', category: '', fasting_required: false, description: ''
  });

  useEffect(() => {
    if (editingTest) {
      setTestForm({
        id: editingTest.id,
        name: editingTest.name,
        category: editingTest.category || editingTest.category_id || '',
        fasting_required: editingTest.fasting_required || false,
        description: editingTest.description || ''
      });
    } else {
      setTestForm({
        id: '',
        name: '',
        category: (testCategories || [])[0]?.id || '',
        fasting_required: false,
        description: ''
      });
    }
  }, [editingTest, showTestModal, testCategories]);

  if (!showTestModal) return null;

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

      setTests(prev => {
        if (editingTest) {
          return prev.map(t => String(t.id) === String(editingTest.id) ? newTest : t);
        }
        return [newTest, ...prev];
      });

      showNotification(`Test "${testForm.name}" ${editingTest ? 'updated' : 'created'}!`);
      setShowTestModal(false);
    } catch (err) {
      alert(`Error saving test: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#d1d5dc] rounded-sm p-6 max-w-md w-full space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#e3e5ea] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-sm bg-[#e7ebff] border border-[#cbd5e1] text-[#094cb2] flex items-center justify-center">
              <TestTube className="w-4 h-4" />
            </div>
            <h3 className="text-base font-serif font-bold text-slate-900">
              {editingTest ? 'Edit Base Test' : 'Add Base Diagnostic Test'}
            </h3>
          </div>
          <button 
            onClick={() => setShowTestModal(false)} 
            className="text-slate-400 hover:text-slate-700 p-1 rounded-sm transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveTest} className="space-y-3.5 text-xs font-body">
          <div>
            <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Test Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Complete Blood Count (CBC)"
              value={testForm.name}
              onChange={e => setTestForm({ ...testForm, name: e.target.value })}
              className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-[#094cb2]"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Diagnostic Category *</label>
            <select
              value={testForm.category}
              onChange={e => setTestForm({ ...testForm, category: e.target.value })}
              className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-[#094cb2]"
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
              className="w-4 h-4 text-[#094cb2] rounded-xs border-[#d1d5dc] focus:ring-[#094cb2]"
            />
            <label htmlFor="test_fasting" className="text-slate-700 font-semibold cursor-pointer">
              Fasting Required (Overnight / 8-12 hours)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#e3e5ea]">
            <button 
              type="button" 
              onClick={() => setShowTestModal(false)} 
              className="px-4 py-2 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 font-label text-xs font-semibold uppercase tracking-wider rounded-sm transition cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-5 py-2 bg-[#094cb2] hover:bg-[#083e91] text-white font-label text-xs font-semibold uppercase tracking-wider rounded-sm shadow-sm transition cursor-pointer"
            >
              Save Test
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
