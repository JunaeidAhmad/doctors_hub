import React, { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-[#d1d5dc] rounded-sm max-w-2xl w-full my-auto shadow-xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* FIXED HEADER */}
        <div className="flex items-center justify-between border-b border-[#e3e5ea] px-6 py-4 shrink-0 bg-white">
          <h3 className="text-lg font-serif font-bold text-slate-900">
            {editingDiagnostic ? 'Edit Diagnostic Center' : 'Register New Diagnostic Center Branch'}
          </h3>
          <button 
            onClick={() => setShowDiagnosticModal(false)} 
            className="text-slate-400 hover:text-slate-700 transition cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSaveDiagnostic} className="flex flex-col min-h-0 flex-1 overflow-hidden">
          <div className="overflow-y-auto px-6 py-4 space-y-4 text-xs font-body flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              
              {/* OWNERSHIP TYPE */}
              <div>
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Ownership Type *</label>
                <select
                  required
                  value={diagnosticForm.ownership_type}
                  onChange={e => setDiagnosticForm({ ...diagnosticForm, ownership_type: e.target.value })}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-[#094cb2]"
                >
                  <option value="private">Private Diagnostic Lab</option>
                  <option value="government">Government / Public Diagnostic Facility</option>
                </select>
              </div>

              {/* DIAGNOSTIC CENTER CATEGORY */}
              <div>
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Diagnostic Category</label>
                <select
                  value={diagnosticForm.category_id}
                  onChange={e => setDiagnosticForm({ ...diagnosticForm, category_id: e.target.value })}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-[#094cb2]"
                >
                  <option value="">-- None / Select Category --</option>
                  {(diagnosticCategories || []).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Center Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Popular Diagnostic Centre"
                  value={diagnosticForm.name}
                  onChange={e => setDiagnosticForm({ ...diagnosticForm, name: e.target.value })}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-[#094cb2]"
                />
              </div>

              {/* 3-LEVEL LOCATION NARROWING: Division -> District -> Area (Thana) */}
              <div className="md:col-span-2 bg-[#f7f6f7] p-3.5 rounded-sm border border-[#d1d5dc] space-y-3">
                <div className="text-[10px] font-label font-bold uppercase tracking-wider text-[#094cb2]">
                  Location &amp; Branch Geography (Division &gt; District &gt; Thana)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Division */}
                  <div>
                    <label className="block text-slate-700 font-label font-bold uppercase text-[10px] mb-1">1. Division *</label>
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
                      className="w-full bg-white border border-[#d1d5dc] rounded-sm px-2.5 py-1.5 text-slate-800 font-bold focus:outline-none focus:border-[#094cb2]"
                    >
                      {DIVISIONS.map(div => (
                        <option key={div} value={div}>{div} Division</option>
                      ))}
                    </select>
                  </div>

                  {/* District */}
                  <div>
                    <label className="block text-slate-700 font-label font-bold uppercase text-[10px] mb-1">2. District *</label>
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
                      className="w-full bg-white border border-[#d1d5dc] rounded-sm px-2.5 py-1.5 text-slate-800 font-bold focus:outline-none focus:border-[#094cb2]"
                    >
                      {currentDistricts.map(dist => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                  </div>

                  {/* Area / Thana */}
                  <div>
                    <label className="block text-slate-700 font-label font-bold uppercase text-[10px] mb-1">3. Thana / Branch *</label>
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
                      className="w-full bg-white border border-[#d1d5dc] rounded-sm px-2.5 py-1.5 text-slate-800 font-bold focus:outline-none focus:border-[#094cb2]"
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
                    <label className="block text-slate-700 font-label font-bold uppercase text-[10px] mb-1">Custom Branch / Area Name *</label>
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
                      className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-1.5 text-slate-800 focus:outline-none focus:border-[#094cb2]"
                    />
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Full Street Address</label>
                <input
                  type="text"
                  placeholder="e.g. House 16, Road 2, Dhanmondi / Panthapath"
                  value={diagnosticForm.address}
                  onChange={e => setDiagnosticForm({ ...diagnosticForm, address: e.target.value })}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 focus:outline-none focus:border-[#094cb2]"
                />
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={diagnosticForm.phone}
                    onChange={e => setDiagnosticForm({ ...diagnosticForm, phone: e.target.value })}
                    className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-[#094cb2]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Email</label>
                  <input
                    type="email"
                    value={diagnosticForm.email}
                    onChange={e => setDiagnosticForm({ ...diagnosticForm, email: e.target.value })}
                    className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 focus:outline-none focus:border-[#094cb2]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Open Hours / Timing</label>
                  <input
                    type="text"
                    value={diagnosticForm.open_timing}
                    onChange={e => setDiagnosticForm({ ...diagnosticForm, open_timing: e.target.value })}
                    className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 focus:outline-none focus:border-[#094cb2]"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Center Description</label>
                <textarea
                  rows="2"
                  value={diagnosticForm.description}
                  onChange={e => setDiagnosticForm({ ...diagnosticForm, description: e.target.value })}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 focus:outline-none focus:border-[#094cb2] resize-y"
                ></textarea>
              </div>

              <div className="md:col-span-2 flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="diag_verified"
                  checked={diagnosticForm.is_verified}
                  onChange={e => setDiagnosticForm({ ...diagnosticForm, is_verified: e.target.checked })}
                  className="w-4 h-4 text-[#094cb2] rounded-xs border-[#d1d5dc] focus:ring-[#094cb2]"
                />
                <label htmlFor="diag_verified" className="text-slate-700 font-semibold cursor-pointer">
                  Verified Diagnostic Facility / Center
                </label>
              </div>

              {/* TEST CATEGORIES MULTI-SELECT */}
              <div className="md:col-span-2 pt-1">
                <label className="block text-[#094cb2] font-label font-bold uppercase text-[11px] mb-1">
                  Attach Test Categories (Multi-select Test Categories) *
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Select test categories to automatically associate all standard tests under those categories to this diagnostic branch.
                </p>
                <div className="flex flex-wrap gap-2 p-2.5 bg-[#f7f6f7] border border-[#d1d5dc] rounded-sm max-h-36 overflow-y-auto">
                  {testCategories.filter(c => c.id !== 'all').map(cat => {
                    const isSelected = (diagnosticForm.test_category_ids || []).includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleTestCategorySelection(cat.id)}
                        className={`px-2.5 py-1 rounded-sm border text-[11px] font-body font-semibold transition flex items-center gap-1.5 ${
                          isSelected 
                            ? 'bg-[#e7ebff] text-[#094cb2] border-[#094cb2] shadow-xs' 
                            : 'bg-white text-slate-600 border-[#d1d5dc] hover:border-slate-400'
                        }`}
                      >
                        <CheckCircle className={`w-3.5 h-3.5 ${isSelected ? 'opacity-100 text-[#094cb2]' : 'opacity-0'}`} />
                        <span>{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SERVICES & FACILITIES AT BOTTOM */}
              <div className="md:col-span-2 pt-1">
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Services &amp; Facilities (Click to Select / Deselect) *</label>
                <div className="flex flex-wrap gap-2 p-2.5 bg-[#f7f6f7] border border-[#d1d5dc] rounded-sm max-h-36 overflow-y-auto">
                  {diagnosticServices.map(srv => {
                    const isSelected = diagnosticForm.service_ids.includes(srv.id);
                    return (
                      <button
                        key={srv.id}
                        type="button"
                        onClick={() => toggleDiagnosticServiceSelection(srv.id)}
                        className={`px-2.5 py-1 rounded-sm border text-[11px] font-body font-semibold transition flex items-center gap-1.5 ${
                          isSelected 
                            ? 'bg-[#e7ebff] text-[#094cb2] border-[#094cb2] shadow-xs' 
                            : 'bg-white text-slate-600 border-[#d1d5dc] hover:border-slate-400'
                        }`}
                      >
                        <CheckCircle className={`w-3.5 h-3.5 ${isSelected ? 'opacity-100 text-[#094cb2]' : 'opacity-0'}`} />
                        <span>{srv.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* FIXED FOOTER */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#e3e5ea] shrink-0 bg-[#faf9fa]">
            <button 
              type="button" 
              onClick={() => setShowDiagnosticModal(false)} 
              className="px-4 py-2 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 font-label text-xs font-semibold uppercase tracking-wider rounded-sm transition cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-5 py-2 bg-[#094cb2] hover:bg-[#083e91] text-white font-label text-xs font-semibold uppercase tracking-wider rounded-sm shadow-sm transition cursor-pointer"
            >
              Save Diagnostic Center
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
