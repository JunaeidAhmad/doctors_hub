import React, { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';
import { api } from '../../../../services/api';
import { useDivisions, useDistricts, useThanas } from '../../../../hooks/useGeo';

export default function HospitalModal() {
  const {
    showHospitalModal,
    setShowHospitalModal,
    editingHospital,
    hospitalCategories,
    hospitalServices,
    showNotification,
    loadAllData
  } = useAdminContext();

  const [hospitalForm, setHospitalForm] = useState({
    id: '',
    name: 'Ibn Sina Healthcare Group',
    division_id: null,
    district_id: null,
    thana_id: null,
    branch: 'Dhanmondi',
    isCustomBranch: false,
    customBranch: '',
    category_id: '',
    ownership_type: 'private',
    service_ids: [],
    address: 'House 48, Road 9/A, Dhanmondi',
    phone: '+880 9610-010615',
    email: 'info@ibnsina.com.bd',
    rating: 4.9,
    reviews_count: 320,
    open_timing: '24/7 Inpatient & Doctor Services',
    tagline: 'Premier Multispecialty Doctor & Inpatient Hospital in Dhanmondi',
    badge: 'Super Hospital',
    logo: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
    description: 'Leading hospital offering inpatient and doctor consultation.',
    is_verified: true,
    details_reviewed: false
  });

  const { items: divisions, isLoading: loadingDivisions } = useDivisions();
  const { items: districts, isLoading: loadingDistricts } = useDistricts(hospitalForm.division_id);
  const { items: thanas, isLoading: loadingThanas } = useThanas(hospitalForm.district_id);

  useEffect(() => {
    if (editingHospital) {
      const catId = typeof editingHospital.category === 'object' ? editingHospital.category?.id : (editingHospital.category || editingHospital.category_id || '');
      const srvIds = Array.isArray(editingHospital.services) 
        ? editingHospital.services.map(s => typeof s === 'object' ? s.id : s) 
        : [];

      const initialThanaId = editingHospital.thana_id || (typeof editingHospital.thana === 'object' ? editingHospital.thana?.id : editingHospital.thana) || null;
      const initialDistrictId = editingHospital.district_id || null;
      const initialDivisionId = editingHospital.division_id || null;

      setHospitalForm({
        id: editingHospital.id,
        name: editingHospital.name || '',
        division_id: initialDivisionId,
        district_id: initialDistrictId,
        thana_id: initialThanaId,
        branch: editingHospital.branch || 'Main',
        isCustomBranch: false,
        customBranch: '',
        category_id: catId,
        ownership_type: editingHospital.ownership_type || 'private',
        service_ids: srvIds,
        address: editingHospital.address || editingHospital.address_line || '',
        phone: editingHospital.phone || '',
        email: editingHospital.email || '',
        rating: editingHospital.rating || 4.9,
        reviews_count: editingHospital.reviews_count || 100,
        open_timing: editingHospital.open_timing || '24/7 Inpatient & Doctor Services',
        tagline: editingHospital.tagline || '',
        badge: editingHospital.badge || '',
        logo: editingHospital.logo || '',
        image: editingHospital.image || '',
        description: editingHospital.description || '',
        is_verified: editingHospital.is_verified ?? true,
        details_reviewed: editingHospital.details_reviewed ?? false,
        has_diagnostic_center: editingHospital.has_diagnostic_center ?? false
      });
    } else {
      setHospitalForm({
        id: '',
        name: '',
        division_id: null,
        district_id: null,
        thana_id: null,
        branch: 'Main',
        isCustomBranch: false,
        customBranch: '',
        category_id: '',
        ownership_type: 'private',
        service_ids: (hospitalServices || []).slice(0, 3).map(s => s.id),
        address: '',
        phone: '',
        email: '',
        rating: 4.9,
        reviews_count: 150,
        open_timing: '24/7 Inpatient & Doctor Services',
        tagline: '',
        badge: 'Hospital',
        logo: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
        image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
        description: '',
        is_verified: true,
        details_reviewed: false,
        has_diagnostic_center: false
      });
    }
  }, [editingHospital, showHospitalModal, hospitalCategories, hospitalServices]);

  if (!showHospitalModal) return null;

  const handleSaveHospital = async (e) => {
    e.preventDefault();
    try {
      const finalBranch = hospitalForm.isCustomBranch ? hospitalForm.customBranch : hospitalForm.branch;
      const payload = {
        name: hospitalForm.name,
        thana: hospitalForm.thana_id,
        thana_id: hospitalForm.thana_id,
        branch: finalBranch,
        address_line: hospitalForm.address,
        address: hospitalForm.address,
        category_id: hospitalForm.category_id || null,
        ownership_type: hospitalForm.ownership_type,
        service_ids: hospitalForm.service_ids,
        phone: hospitalForm.phone,
        email: hospitalForm.email,
        rating: parseFloat(hospitalForm.rating) || 4.9,
        reviews_count: parseInt(hospitalForm.reviews_count, 10) || 100,
        open_timing: hospitalForm.open_timing,
        tagline: hospitalForm.tagline,
        badge: hospitalForm.badge,
        logo: hospitalForm.logo,
        image: hospitalForm.image,
        description: hospitalForm.description,
        is_verified: hospitalForm.is_verified,
        details_reviewed: hospitalForm.details_reviewed,
        has_diagnostic_center: hospitalForm.has_diagnostic_center
      };

      if (editingHospital) {
        await api.updateHospital(editingHospital.id, payload);
        showNotification(`Hospital "${payload.name} (${payload.branch})" updated!`);
      } else {
        await api.createHospital(payload);
        showNotification(`Hospital "${payload.name} (${payload.branch})" created!`);
      }
      setShowHospitalModal(false);
      loadAllData();
    } catch (err) {
      alert(`Error saving hospital: ${err.message}`);
    }
  };

  const toggleHospitalServiceSelection = (srvId) => {
    const current = hospitalForm.service_ids || [];
    const updated = current.includes(srvId)
      ? current.filter(id => id !== srvId)
      : [...current, srvId];
    setHospitalForm({ ...hospitalForm, service_ids: updated });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-[#d1d5dc] rounded-sm max-w-2xl w-full my-auto shadow-xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#e3e5ea] px-6 py-4 shrink-0 bg-white">
          <h3 className="text-lg font-serif font-bold text-slate-900">
            {editingHospital ? 'Edit Hospital Facility' : 'Register New Hospital Branch'}
          </h3>
          <button
            onClick={() => setShowHospitalModal(false)}
            className="text-slate-400 hover:text-slate-700 transition cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveHospital} className="flex flex-col min-h-0 flex-1 overflow-hidden">
          <div className="overflow-y-auto px-6 py-4 space-y-4 text-xs font-body flex-1">
          
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Ownership Type *</label>
                <select
                  required
                  value={hospitalForm.ownership_type}
                  onChange={e => setHospitalForm({ ...hospitalForm, ownership_type: e.target.value })}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-[#094cb2]"
                >
                  <option value="private">Private Hospital / Clinic</option>
                  <option value="government">Government / Public Hospital</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Hospital Category</label>
                <select
                  value={hospitalForm.category_id}
                  onChange={e => setHospitalForm({ ...hospitalForm, category_id: e.target.value })}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-[#094cb2]"
                >
                  <option value="">-- None / Select Category --</option>
                  {hospitalCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Hospital Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ibn Sina Healthcare Group"
                value={hospitalForm.name}
                onChange={e => setHospitalForm({ ...hospitalForm, name: e.target.value })}
                className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-[#094cb2]"
              />
            </div>

            {/* 3-LEVEL LOCATION NARROWING: Division -> District -> Area (Thana) */}
            <div className="bg-[#f7f6f7] p-3.5 rounded-sm border border-[#d1d5dc] space-y-3">
              <div className="text-[10px] font-label font-bold uppercase tracking-wider text-[#094cb2]">
                Location &amp; Branch Geography (Division &gt; District &gt; Thana)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Division */}
                <div>
                  <label className="block text-slate-700 font-label font-bold uppercase text-[10px] mb-1">1. Division *</label>
                  <select
                    required
                    value={hospitalForm.division_id ?? ''}
                    disabled={loadingDivisions}
                    onChange={e => {
                      const newDivId = e.target.value ? Number(e.target.value) : null;
                      setHospitalForm({
                        ...hospitalForm,
                        division_id: newDivId,
                        district_id: null,
                        thana_id: null,
                      });
                    }}
                    className="w-full bg-white border border-[#d1d5dc] rounded-sm px-2.5 py-1.5 text-slate-800 font-bold focus:outline-none focus:border-[#094cb2] disabled:opacity-60"
                  >
                    <option value="">Select Division</option>
                    {divisions.map(div => (
                      <option key={div.id} value={div.id}>{div.label || div.name}</option>
                    ))}
                  </select>
                </div>

                {/* District */}
                <div>
                  <label className="block text-slate-700 font-label font-bold uppercase text-[10px] mb-1">2. District *</label>
                  <select
                    required
                    value={hospitalForm.district_id ?? ''}
                    disabled={!hospitalForm.division_id || loadingDistricts}
                    onChange={e => {
                      const newDistId = e.target.value ? Number(e.target.value) : null;
                      setHospitalForm({
                        ...hospitalForm,
                        district_id: newDistId,
                        thana_id: null,
                      });
                    }}
                    className="w-full bg-white border border-[#d1d5dc] rounded-sm px-2.5 py-1.5 text-slate-800 font-bold focus:outline-none focus:border-[#094cb2] disabled:opacity-60"
                  >
                    <option value="">Select District</option>
                    {districts.map(dist => (
                      <option key={dist.id} value={dist.id}>{dist.label || dist.name}</option>
                    ))}
                  </select>
                </div>

                {/* Area / Thana */}
                <div>
                  <label className="block text-slate-700 font-label font-bold uppercase text-[10px] mb-1">3. Thana / Branch *</label>
                  <select
                    required
                    value={hospitalForm.isCustomBranch ? 'Other' : (hospitalForm.thana_id ?? '')}
                    disabled={!hospitalForm.district_id || loadingThanas}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === 'Other') {
                        setHospitalForm({ ...hospitalForm, isCustomBranch: true, branch: 'Other' });
                      } else {
                        const selectedT = thanas.find(t => t.id === Number(val));
                        const tName = selectedT?.name || '';
                        setHospitalForm({ 
                          ...hospitalForm, 
                          isCustomBranch: false, 
                          thana_id: val ? Number(val) : null,
                          branch: tName || 'Main',
                          customBranch: '' 
                        });
                      }
                    }}
                    className="w-full bg-white border border-[#d1d5dc] rounded-sm px-2.5 py-1.5 text-slate-800 font-bold focus:outline-none focus:border-[#094cb2] disabled:opacity-60"
                  >
                    <option value="">Select Thana</option>
                    {thanas.map(th => (
                      <option key={th.id} value={th.id}>{th.label || th.name}</option>
                    ))}
                    <option value="Other">+ Custom Branch Name</option>
                  </select>
                </div>
              </div>

              {hospitalForm.isCustomBranch && (
                <div className="mt-2">
                  <label className="block text-slate-700 font-label font-bold uppercase text-[10px] mb-1">Custom Branch / Area Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rampura Main Branch"
                    value={hospitalForm.customBranch}
                    onChange={e => setHospitalForm({ 
                      ...hospitalForm, 
                      customBranch: e.target.value,
                      area: e.target.value 
                    })}
                    className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-1.5 text-slate-800 focus:outline-none focus:border-[#094cb2]"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Full Street Address</label>
              <input
                type="text"
                placeholder="e.g. House 48, Road 9/A, Dhanmondi"
                value={hospitalForm.address}
                onChange={e => setHospitalForm({ ...hospitalForm, address: e.target.value })}
                className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 focus:outline-none focus:border-[#094cb2]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={hospitalForm.phone}
                  onChange={e => setHospitalForm({ ...hospitalForm, phone: e.target.value })}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-[#094cb2]"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Email</label>
                <input
                  type="email"
                  value={hospitalForm.email}
                  onChange={e => setHospitalForm({ ...hospitalForm, email: e.target.value })}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 focus:outline-none focus:border-[#094cb2]"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Open Hours / Timing</label>
                <input
                  type="text"
                  value={hospitalForm.open_timing}
                  onChange={e => setHospitalForm({ ...hospitalForm, open_timing: e.target.value })}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 focus:outline-none focus:border-[#094cb2]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Tagline</label>
                <input
                  type="text"
                  value={hospitalForm.tagline}
                  onChange={e => setHospitalForm({ ...hospitalForm, tagline: e.target.value })}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 focus:outline-none focus:border-[#094cb2]"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Badge Tag</label>
                <input
                  type="text"
                  value={hospitalForm.badge}
                  onChange={e => setHospitalForm({ ...hospitalForm, badge: e.target.value })}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 focus:outline-none focus:border-[#094cb2]"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Hospital Description</label>
              <textarea
                rows="2"
                value={hospitalForm.description}
                onChange={e => setHospitalForm({ ...hospitalForm, description: e.target.value })}
                className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 focus:outline-none focus:border-[#094cb2] resize-y"
              ></textarea>
            </div>

            <div className="pt-2">
              <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1.5">
                Clinical Services &amp; Facilities (Click to Select / Deselect) *
              </label>
              <div className="flex flex-wrap gap-2 p-3 bg-[#f7f6f7] border border-[#d1d5dc] rounded-sm max-h-44 overflow-y-auto">
                {hospitalServices.map(srv => {
                  const isSelected = hospitalForm.service_ids.includes(srv.id);
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => toggleHospitalServiceSelection(srv.id)}
                      className={`px-3 py-1.5 rounded-sm border text-xs font-body font-semibold transition flex items-center gap-1.5 ${
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

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="has_diagnostic_center"
                checked={hospitalForm.has_diagnostic_center}
                onChange={e => setHospitalForm({ ...hospitalForm, has_diagnostic_center: e.target.checked })}
                className="w-4 h-4 text-[#094cb2] rounded-xs border-[#d1d5dc] focus:ring-[#094cb2]"
              />
              <label htmlFor="has_diagnostic_center" className="text-slate-700 font-bold cursor-pointer text-xs">
                Has Internal Diagnostic Center / Pathology Laboratory
              </label>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="details_reviewed"
                checked={hospitalForm.details_reviewed}
                onChange={e => setHospitalForm({ ...hospitalForm, details_reviewed: e.target.checked })}
                className="w-4 h-4 text-[#094cb2] rounded-xs border-[#d1d5dc] focus:ring-[#094cb2]"
              />
              <label htmlFor="details_reviewed" className="text-slate-700 font-bold cursor-pointer text-xs">
                Details verified (All operational details reviewed and audited)
              </label>
            </div>

          </div>

          <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#e3e5ea] shrink-0 bg-[#faf9fa]">
            <button 
              type="button" 
              onClick={() => setShowHospitalModal(false)} 
              className="px-4 py-2 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 font-label text-xs font-semibold uppercase tracking-wider rounded-sm transition cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-5 py-2 bg-[#094cb2] hover:bg-[#083e91] text-white font-label text-xs font-semibold uppercase tracking-wider rounded-sm shadow-sm transition cursor-pointer"
            >
              Save Hospital
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
