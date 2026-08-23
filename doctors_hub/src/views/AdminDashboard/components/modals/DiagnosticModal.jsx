import React, { useState, useEffect } from 'react';
import { XCircle, CheckCircle } from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';
import { api } from '../../../../services/api';
import { 
  DIVISIONS, 
  DIVISION_DISTRICTS, 
  DISTRICT_THANAS, 
  findDivisionForDistrict, 
  getDistrictsForDivision, 
  getThanasForDistrict 
} from '../../../../data/constants';

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
    division: 'Dhaka',
    district: 'Dhaka',
    area: 'Panthapath',
    branch: 'Panthapath',
    isCustomBranch: false,
    customBranch: '',
    category_id: '',
    ownership_type: 'private',
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
      const catId = editingDiagnostic.category?.id || editingDiagnostic.category_id || editingDiagnostic.category || editingDiagnostic.specialization_category?.id || '';
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

      const initialDistrict = editingDiagnostic.district || 'Dhaka';
      const initialDivision = editingDiagnostic.division || findDivisionForDistrict(initialDistrict) || 'Dhaka';
      const initialArea = editingDiagnostic.area || editingDiagnostic.branch || 'Panthapath';

      setDiagnosticForm({
        id: editingDiagnostic.id,
        name: editingDiagnostic.name,
        division: initialDivision,
        district: initialDistrict,
        area: initialArea,
        branch: editingDiagnostic.branch || initialArea || 'Main',
        isCustomBranch: false,
        customBranch: '',
        category_id: catId,
        ownership_type: editingDiagnostic.ownership_type || editingDiagnostic.location_details?.ownership_type || 'private',
        test_category_ids: existingTestCatIds,
        service_ids: srvIds,
        address: editingDiagnostic.address || editingDiagnostic.address_line || '',
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
        division: 'Dhaka',
        district: 'Dhaka',
        area: 'Panthapath',
        branch: 'Panthapath',
        isCustomBranch: false,
        customBranch: '',
        category_id: '',
    ownership_type: 'private',
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
      const finalArea = diagnosticForm.area || finalBranch;
      const payload = {
        name: diagnosticForm.name,
        division: diagnosticForm.division,
        district: diagnosticForm.district,
        area: finalArea,
        branch: finalBranch,
        address_line: diagnosticForm.address,
        address: diagnosticForm.address,
        category_id: diagnosticForm.category_id || null,
        ownership_type: diagnosticForm.ownership_type,
        test_category_ids: diagnosticForm.test_category_ids || [],
        service_ids: diagnosticForm.service_ids,
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

      if (editingDiagnostic) {
        await api.updateDiagnosticCenter(editingDiagnostic.id, payload);
        showNotification(`Diagnostic Center "${payload.name} (${payload.branch})" updated!`);
      } else {
        await api.createDiagnosticCenter(payload);
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

  const toggleTestCategorySelection = (catId) => {
    const current = diagnosticForm.test_category_ids || [];
    const updated = current.includes(catId)
      ? current.filter(id => id !== catId)
      : [...current, catId];
    setDiagnosticForm({ ...diagnosticForm, test_category_ids: updated });
  };

  const currentDistricts = getDistrictsForDivision(diagnosticForm.division);
  const currentThanas = getThanasForDistrict(diagnosticForm.district);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full space-y-4 my-8 shadow-2xl">
        
        {/* FIXED HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white">
            {editingDiagnostic ? 'Edit Diagnostic Center' : 'Add New Diagnostic Center'}
          </h3>
          <button onClick={() => setShowDiagnosticModal(false)} className="text-slate-400 hover:text-white transition cursor-pointer">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSaveDiagnostic} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* OWNERSHIP TYPE */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Ownership Type *</label>
              <select
                required
                value={diagnosticForm.ownership_type}
                onChange={e => setDiagnosticForm({ ...diagnosticForm, ownership_type: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
              >
                <option value="private">Private</option>
                <option value="government">Government</option>
                              </select>
            </div>

            {/* DIAGNOSTIC CENTER CATEGORY */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Diagnostic Center Category</label>
              <select
                value={diagnosticForm.category_id}
                onChange={e => setDiagnosticForm({ ...diagnosticForm, category_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
              >
                <option value="">-- None / Select Category --</option>
                {(diagnosticCategories || []).map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">Center Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Popular Diagnostic Centre"
                value={diagnosticForm.name}
                onChange={e => setDiagnosticForm({ ...diagnosticForm, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold"
              />
            </div>

            {/* 3-LEVEL LOCATION NARROWING: Division -> District -> Area (Thana) */}
            <div className="md:col-span-2 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 space-y-3">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-400">
                Location & Branch Setup (Division &gt; District &gt; Thana)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Division */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">1. Division *</label>
                  <select
                    required
                    value={diagnosticForm.division}
                    onChange={e => {
                      const newDiv = e.target.value;
                      const dists = getDistrictsForDivision(newDiv);
                      const newDist = dists[0] || 'Dhaka';
                      const thanas = getThanasForDistrict(newDist);
                      setDiagnosticForm({
                        ...diagnosticForm,
                        division: newDiv,
                        district: newDist,
                        area: thanas[0] || '',
                        branch: thanas[0] || 'Main',
                        isCustomBranch: false,
                        customBranch: ''
                      });
                    }}
                    className="w-full bg-slate-900 border border-cyan-500/40 rounded-xl px-2.5 py-2 text-white font-bold"
                  >
                    {DIVISIONS.map(div => (
                      <option key={div} value={div}>{div} Division</option>
                    ))}
                  </select>
                </div>

                {/* District */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">2. District *</label>
                  <select
                    required
                    value={diagnosticForm.district}
                    onChange={e => {
                      const newDist = e.target.value;
                      const thanas = getThanasForDistrict(newDist);
                      setDiagnosticForm({
                        ...diagnosticForm,
                        district: newDist,
                        area: thanas[0] || '',
                        branch: thanas[0] || 'Main',
                        isCustomBranch: false,
                        customBranch: ''
                      });
                    }}
                    className="w-full bg-slate-900 border border-cyan-500/40 rounded-xl px-2.5 py-2 text-white font-bold"
                  >
                    {currentDistricts.map(dist => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>

                {/* Area / Thana */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">3. Thana / Branch *</label>
                  <select
                    required
                    value={diagnosticForm.isCustomBranch ? 'Other' : diagnosticForm.branch}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === 'Other') {
                        setDiagnosticForm({ ...diagnosticForm, isCustomBranch: true, branch: 'Other' });
                      } else {
                        setDiagnosticForm({ 
                          ...diagnosticForm, 
                          isCustomBranch: false, 
                          branch: val, 
                          area: val,
                          customBranch: '' 
                        });
                      }
                    }}
                    className="w-full bg-slate-900 border border-cyan-500/40 rounded-xl px-2.5 py-2 text-white font-bold"
                  >
                    {currentThanas.map(th => (
                      <option key={th} value={th}>{th}</option>
                    ))}
                    <option value="Other">+ Custom Branch Name</option>
                  </select>
                </div>
              </div>

              {diagnosticForm.isCustomBranch && (
                <div className="mt-2">
                  <label className="block text-slate-300 font-semibold mb-1">Custom Branch / Area Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Panthapath Main Branch"
                    value={diagnosticForm.customBranch}
                    onChange={e => setDiagnosticForm({ 
                      ...diagnosticForm, 
                      customBranch: e.target.value,
                      area: e.target.value 
                    })}
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                <label className="block text-slate-300 font-semibold mb-1">Email</label>
                <input
                  type="email"
                  value={diagnosticForm.email}
                  onChange={e => setDiagnosticForm({ ...diagnosticForm, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
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
                      onClick={() => toggleTestCategorySelection(cat.id)}
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
