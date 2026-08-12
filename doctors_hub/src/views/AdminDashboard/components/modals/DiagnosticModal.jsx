import React, { useState, useEffect } from 'react';
import { XCircle, CheckCircle } from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';
import { api } from '../../../../services/api';
import { CITY_THANAS, LOCATIONS } from '../../../../data/constants';

export default function DiagnosticModal() {
  const {
    showDiagnosticModal,
    setShowDiagnosticModal,
    editingDiagnostic,
    diagnosticCategories,
    testCategories,
    diagnosticServices,
    tests,
    showNotification,
    loadAllData
  } = useAdminContext();

  const [diagnosticForm, setDiagnosticForm] = useState({
    id: '',
    name: 'Popular Diagnostic Centre',
    city: 'Dhaka',
    district: 'Dhaka',
    branch: 'Panthapath',
    isCustomBranch: false,
    customBranch: '',
    specialization_category_id: '',
    ownership_category_id: '',
    test_category_ids: [],
    service_ids: [],
    address: 'House 16, Road 2, Dhanmondi / Panthapath',
    phone: '+880 9613-787801',
    email: 'info@populardiagnostic.com',
    rating: 4.85,
    reviews_count: 410,
    open_timing: '07:00 AM - 11:00 PM',
    tagline: 'Nationwide Leading Diagnostic & Imaging Hub',
    badge: 'Verified Hospital',
    logo: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80',
    image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80',
    description: 'Popular Medical Center providing state-of-the-art diagnostic imaging and visiting doctor chambers.',
    is_verified: true
  });

  useEffect(() => {
    if (editingDiagnostic) {
      const specCatId = editingDiagnostic.specialization_category?.id || editingDiagnostic.specialization_category || '';
      const ownCatId = editingDiagnostic.ownership_category?.id || editingDiagnostic.ownership_category || '';
      const srvIds = Array.isArray(editingDiagnostic.services) 
        ? editingDiagnostic.services.map(s => typeof s === 'object' ? s.id : s) 
        : [];

      const existingTestCatIds = [];
      if (Array.isArray(editingDiagnostic.offered_tests)) {
        editingDiagnostic.offered_tests.forEach(ot => {
          const testCatId = ot.test?.category || ot.test?.category_id || ot.category;
          if (testCatId && !existingTestCatIds.includes(testCatId.toString())) {
            existingTestCatIds.push(testCatId.toString());
          }
        });
      }

      setDiagnosticForm({
        id: editingDiagnostic.id,
        name: editingDiagnostic.name,
        city: editingDiagnostic.district || editingDiagnostic.city || 'Dhaka',
        district: editingDiagnostic.district || editingDiagnostic.city || 'Dhaka',
        branch: editingDiagnostic.branch || 'Main',
        isCustomBranch: false,
        customBranch: '',
        specialization_category_id: specCatId,
        ownership_category_id: ownCatId,
        test_category_ids: existingTestCatIds,
        service_ids: srvIds,
        address: editingDiagnostic.address || '',
        phone: editingDiagnostic.phone || '',
        email: editingDiagnostic.email || '',
        rating: editingDiagnostic.rating || 4.85,
        reviews_count: editingDiagnostic.reviews_count || 100,
        open_timing: editingDiagnostic.open_timing || '07:00 AM - 11:00 PM',
        tagline: editingDiagnostic.tagline || '',
        badge: editingDiagnostic.badge || '',
        logo: editingDiagnostic.logo || '',
        image: editingDiagnostic.image || '',
        description: editingDiagnostic.description || '',
        is_verified: editingDiagnostic.is_verified ?? true
      });
    } else {
      setDiagnosticForm({
        id: '',
        name: '',
        city: 'Dhaka',
        district: 'Dhaka',
        branch: 'Panthapath',
        isCustomBranch: false,
        customBranch: '',
        specialization_category_id: '',
        ownership_category_id: '',
        test_category_ids: [],
        service_ids: (diagnosticServices || []).slice(0, 3).map(s => s.id),
        address: '',
        phone: '',
        email: '',
        rating: 4.85,
        reviews_count: 200,
        open_timing: '07:00 AM - 11:00 PM',
        tagline: '',
        badge: 'Verified Hospital',
        logo: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80',
        image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80',
        description: '',
        is_verified: true
      });
    }
  }, [editingDiagnostic, showDiagnosticModal, diagnosticServices]);

  if (!showDiagnosticModal) return null;

  const handleSaveDiagnostic = async (e) => {
    e.preventDefault();
    try {
      const finalBranch = diagnosticForm.isCustomBranch ? diagnosticForm.customBranch : diagnosticForm.branch;
      const payload = {
        name: diagnosticForm.name,
        city: diagnosticForm.city,
        district: diagnosticForm.city,
        branch: finalBranch,
        specialization_category_id: diagnosticForm.specialization_category_id || null,
        ownership_category_id: diagnosticForm.ownership_category_id || null,
        test_category_ids: diagnosticForm.test_category_ids || [],
        service_ids: diagnosticForm.service_ids,
        address: diagnosticForm.address,
        phone: diagnosticForm.phone,
        email: diagnosticForm.email,
        rating: parseFloat(diagnosticForm.rating) || 4.85,
        reviews_count: parseInt(diagnosticForm.reviews_count, 10) || 100,
        open_timing: diagnosticForm.open_timing,
        tagline: diagnosticForm.tagline,
        badge: diagnosticForm.badge,
        logo: diagnosticForm.logo,
        image: diagnosticForm.image,
        description: diagnosticForm.description,
        is_verified: diagnosticForm.is_verified
      };

      let savedCenter;
      if (editingDiagnostic) {
        savedCenter = await api.updateDiagnosticCenter(editingDiagnostic.id, payload);
        showNotification(`Diagnostic Center "${payload.name} (${payload.branch})" updated!`);
      } else {
        savedCenter = await api.createDiagnosticCenter(payload);
        showNotification(`Diagnostic Center "${payload.name} (${payload.branch})" created!`);
      }

      setShowDiagnosticModal(false);
      loadAllData();
    } catch (err) {
      alert(`Error saving diagnostic center: ${err.message}`);
    }
  };

  const toggleDiagnosticServiceSelection = (srvId) => {
    const current = diagnosticForm.service_ids || [];
    const updated = current.includes(srvId)
      ? current.filter(id => id !== srvId)
      : [...current, srvId];
    setDiagnosticForm({ ...diagnosticForm, service_ids: updated });
  };

  const toggleDiagnosticTestCategorySelection = (catId) => {
    const current = diagnosticForm.test_category_ids || [];
    const updated = current.includes(catId)
      ? current.filter(id => id !== catId)
      : [...current, catId];
    setDiagnosticForm({ ...diagnosticForm, test_category_ids: updated });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        
        {/* FIXED HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <h3 className="text-base sm:text-lg font-bold text-white">
            {editingDiagnostic ? 'Edit Diagnostic Center' : 'Add New Diagnostics / Branch'}
          </h3>
          <button onClick={() => setShowDiagnosticModal(false)} className="text-slate-400 hover:text-white p-1">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* FORM CONTAINING SCROLLABLE BODY & STICKY FOOTER */}
        <form onSubmit={handleSaveDiagnostic} className="flex-1 flex flex-col overflow-hidden min-h-0 pt-3">
          
          {/* SCROLLABLE BODY CONTENT */}
          <div className="flex-1 overflow-y-auto pr-1.5 space-y-3.5 text-xs">
            
            {/* TWO SEPARATE CATEGORY OPTIONS (SPECIALIZATION & OWNERSHIP) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Category 1: Specialization (Optional)</label>
                <select
                  value={diagnosticForm.specialization_category_id}
                  onChange={e => setDiagnosticForm({ ...diagnosticForm, specialization_category_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                >
                  <option value="">-- None / Unspecified --</option>
                  {diagnosticCategories
                    .filter(c => {
                      const pId = typeof c.parent === 'object' && c.parent ? c.parent.id : c.parent;
                      const pName = (typeof c.parent === 'object' && c.parent ? c.parent.name : c.parent_name) || '';
                      return (
                        pId === 'by-specialization' ||
                        c.parent === 'by-specialization' ||
                        String(pName).toLowerCase().includes('specialization')
                      );
                    })
                    .map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Category 2: Ownership & Type (Optional)</label>
                <select
                  value={diagnosticForm.ownership_category_id}
                  onChange={e => setDiagnosticForm({ ...diagnosticForm, ownership_category_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                >
                  <option value="">-- None / Unspecified --</option>
                  {(diagnosticCategories || [])
                    .filter(c => {
                      const pId = typeof c.parent === 'object' && c.parent ? c.parent.id : c.parent;
                      const pName = (typeof c.parent === 'object' && c.parent ? c.parent.name : c.parent_name) || '';
                      return (
                        pId === 'by-ownership-type' ||
                        c.parent === 'by-ownership-type' ||
                        String(pName).toLowerCase().includes('ownership')
                      );
                    })
                    .map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))
                  }
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Diagnostic Center Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Popular Diagnostic Centre"
                value={diagnosticForm.name}
                onChange={e => setDiagnosticForm({ ...diagnosticForm, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
              <div>
                <label className="block text-cyan-400 font-bold mb-1">Step 1: Select City *</label>
                <select
                  required
                  value={diagnosticForm.city}
                  onChange={e => {
                    const newCity = e.target.value;
                    const thanas = CITY_THANAS[newCity] || [];
                    setDiagnosticForm({
                      ...diagnosticForm,
                      city: newCity,
                      district: newCity,
                      branch: thanas[0] || 'Main',
                      isCustomBranch: false,
                      customBranch: ''
                    });
                  }}
                  className="w-full bg-slate-900 border border-cyan-500/50 rounded-xl px-3 py-2 text-white font-bold"
                >
                  {LOCATIONS.filter(l => l !== 'All Bangladesh').map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-cyan-400 font-bold mb-1">Step 2: Select Branch (Thanas in {diagnosticForm.city}) *</label>
                <select
                  required
                  value={diagnosticForm.isCustomBranch ? 'Other' : diagnosticForm.branch}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === 'Other') {
                      setDiagnosticForm({ ...diagnosticForm, isCustomBranch: true, branch: 'Other' });
                    } else {
                      setDiagnosticForm({ ...diagnosticForm, isCustomBranch: false, branch: val, customBranch: '' });
                    }
                  }}
                  className="w-full bg-slate-900 border border-cyan-500/50 rounded-xl px-3 py-2 text-white font-bold"
                >
                  {(CITY_THANAS[diagnosticForm.city] || []).map(th => (
                    <option key={th} value={th}>{th} Branch</option>
                  ))}
                  <option value="Other">+ Other (Custom Branch Name)</option>
                </select>
              </div>

              {diagnosticForm.isCustomBranch && (
                <div className="md:col-span-2 mt-1">
                  <label className="block text-slate-300 font-semibold mb-1">Specify Custom Branch Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Panthapath Main Branch"
                    value={diagnosticForm.customBranch}
                    onChange={e => setDiagnosticForm({ ...diagnosticForm, customBranch: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Full Address</label>
              <input
                type="text"
                placeholder="e.g. House 16, Road 2, Dhanmondi / Panthapath"
                value={diagnosticForm.address}
                onChange={e => setDiagnosticForm({ ...diagnosticForm, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={diagnosticForm.phone}
                  onChange={e => setDiagnosticForm({ ...diagnosticForm, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Open Hours / Timing</label>
                <input
                  type="text"
                  value={diagnosticForm.open_timing}
                  onChange={e => setDiagnosticForm({ ...diagnosticForm, open_timing: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Center Description</label>
              <textarea
                rows="2"
                value={diagnosticForm.description}
                onChange={e => setDiagnosticForm({ ...diagnosticForm, description: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              ></textarea>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="diag_verified"
                checked={diagnosticForm.is_verified}
                onChange={e => setDiagnosticForm({ ...diagnosticForm, is_verified: e.target.checked })}
                className="w-4 h-4 text-cyan-500 rounded bg-slate-950 border-slate-800"
              />
              <label htmlFor="diag_verified" className="text-slate-300 font-semibold cursor-pointer">Verified Diagnostic Hospital / Center</label>
            </div>

            {/* TEST CATEGORIES MULTI-SELECT */}
            <div className="pt-1">
              <label className="block text-emerald-400 font-bold mb-1">
                Attach Test Categories (Multi-select Test Categories) *
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                Select test categories to automatically attach all tests under those categories to this diagnostic center.
              </p>
              <div className="flex flex-wrap gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-xl max-h-32 overflow-y-auto">
                {testCategories.filter(c => c.id !== 'all').map(cat => {
                  const isSelected = (diagnosticForm.test_category_ids || []).includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleDiagnosticTestCategorySelection(cat.id)}
                      className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold transition flex items-center gap-1.5 ${
                        isSelected 
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20' 
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <CheckCircle className={`w-3.5 h-3.5 ${isSelected ? 'opacity-100 text-emerald-400' : 'opacity-0'}`} />
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SERVICES & FACILITIES AT BOTTOM */}
            <div className="pt-1">
              <label className="block text-slate-300 font-semibold mb-1">Services & Facilities (Click to Select / Deselect) *</label>
              <div className="flex flex-wrap gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-xl max-h-32 overflow-y-auto">
                {diagnosticServices.map(srv => {
                  const isSelected = diagnosticForm.service_ids.includes(srv.id);
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => toggleDiagnosticServiceSelection(srv.id)}
                      className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold transition flex items-center gap-1.5 ${
                        isSelected 
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/20' 
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <CheckCircle className={`w-3.5 h-3.5 ${isSelected ? 'opacity-100 text-cyan-400' : 'opacity-0'}`} />
                      <span>{srv.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* FIXED FOOTER */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800 shrink-0 mt-2">
            <button type="button" onClick={() => setShowDiagnosticModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg text-xs">
              Save Diagnostic Center
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
