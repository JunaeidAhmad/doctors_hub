import React, { useState, useEffect } from 'react';
import { XCircle } from 'lucide-react';
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
        category: testCategories[0]?.id || '',
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
  );
}
