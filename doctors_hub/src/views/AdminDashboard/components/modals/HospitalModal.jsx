import React, { useState, useEffect } from 'react';
import { XCircle, CheckCircle } from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';
import { api } from '../../../../services/api';
import { CITY_THANAS, LOCATIONS } from '../../../../data/constants';

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
    city: 'Dhaka',
    branch: 'Dhanmondi',
    isCustomBranch: false,
    customBranch: '',
    category_id: '',
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
    is_verified: true
  });

  useEffect(() => {
    if (editingHospital) {
      const catId = typeof editingHospital.category === 'object' ? editingHospital.category?.id : (editingHospital.category || editingHospital.category_id || '');
      const srvIds = Array.isArray(editingHospital.services) 
        ? editingHospital.services.map(s => typeof s === 'object' ? s.id : s) 
        : [];

      setHospitalForm({
        id: editingHospital.id,
        name: editingHospital.name,
        city: editingHospital.city || editingHospital.district || 'Dhaka',
        branch: editingHospital.branch || 'Main',
        isCustomBranch: false,
        customBranch: '',
        category_id: catId,
        service_ids: srvIds,
        address: editingHospital.address || '',
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
        is_verified: editingHospital.is_verified ?? true
      });
    } else {
      setHospitalForm({
        id: '',
        name: '',
        city: 'Dhaka',
        branch: 'Dhanmondi',
        isCustomBranch: false,
        customBranch: '',
        category_id: hospitalCategories[0]?.id || '',
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
        is_verified: true
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
        city: hospitalForm.city,
        district: hospitalForm.city,
        branch: finalBranch,
        category_id: hospitalForm.category_id,
        service_ids: hospitalForm.service_ids,
        address: hospitalForm.address,
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
        is_verified: hospitalForm.is_verified
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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full space-y-4 my-8 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white">
            {editingHospital ? 'Edit Hospital' : 'Add New Hospital Branch'}
          </h3>
          <button onClick={() => setShowHospitalModal(false)} className="text-slate-400 hover:text-white">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveHospital} className="space-y-4 text-xs">
          
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Hospital Category *</label>
            <select
              required
              value={hospitalForm.category_id}
              onChange={e => setHospitalForm({ ...hospitalForm, category_id: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-bold"
            >
              <option value="">Select Hospital Category</option>
              {hospitalCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Hospital Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ibn Sina Healthcare Group"
              value={hospitalForm.name}
              onChange={e => setHospitalForm({ ...hospitalForm, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            <div>
              <label className="block text-emerald-400 font-bold mb-1">Step 1: Select City *</label>
              <select
                required
                value={hospitalForm.city}
                onChange={e => {
                  const newCity = e.target.value;
                  const thanas = CITY_THANAS[newCity] || [];
                  setHospitalForm({
                    ...hospitalForm,
                    city: newCity,
                    district: newCity,
                    branch: thanas[0] || 'Main',
                    isCustomBranch: false,
                    customBranch: ''
                  });
                }}
                className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl px-3 py-2 text-white font-bold"
              >
                {LOCATIONS.filter(l => l !== 'All Bangladesh').map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-emerald-400 font-bold mb-1">Step 2: Select Branch (Thanas in {hospitalForm.city}) *</label>
              <select
                required
                value={hospitalForm.isCustomBranch ? 'Other' : hospitalForm.branch}
                onChange={e => {
                  const val = e.target.value;
                  if (val === 'Other') {
                    setHospitalForm({ ...hospitalForm, isCustomBranch: true, branch: 'Other' });
                  } else {
                    setHospitalForm({ ...hospitalForm, isCustomBranch: false, branch: val, customBranch: '' });
                  }
                }}
                className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl px-3 py-2 text-white font-bold"
              >
                {(CITY_THANAS[hospitalForm.city] || []).map(th => (
                  <option key={th} value={th}>{th} Branch</option>
                ))}
                <option value="Other">+ Other (Custom Branch Name)</option>
              </select>
            </div>

            {hospitalForm.isCustomBranch && (
              <div className="md:col-span-2 mt-1">
                <label className="block text-slate-300 font-semibold mb-1">Specify Custom Branch Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rampura Main Branch"
                  value={hospitalForm.customBranch}
                  onChange={e => setHospitalForm({ ...hospitalForm, customBranch: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Full Address</label>
            <input
              type="text"
              placeholder="e.g. House 48, Road 9/A, Dhanmondi"
              value={hospitalForm.address}
              onChange={e => setHospitalForm({ ...hospitalForm, address: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Contact Phone</label>
              <input
                type="text"
                value={hospitalForm.phone}
                onChange={e => setHospitalForm({ ...hospitalForm, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Open Hours / Timing</label>
              <input
                type="text"
                value={hospitalForm.open_timing}
                onChange={e => setHospitalForm({ ...hospitalForm, open_timing: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Tagline</label>
              <input
                type="text"
                value={hospitalForm.tagline}
                onChange={e => setHospitalForm({ ...hospitalForm, tagline: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Badge Tag</label>
              <input
                type="text"
                value={hospitalForm.badge}
                onChange={e => setHospitalForm({ ...hospitalForm, badge: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Hospital Description</label>
            <textarea
              rows="2"
              value={hospitalForm.description}
              onChange={e => setHospitalForm({ ...hospitalForm, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
            ></textarea>
          </div>

          <div className="pt-2">
            <label className="block text-slate-300 font-semibold mb-1.5">Services & Facilities (Click to Select / Deselect) *</label>
            <div className="flex flex-wrap gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl max-h-44 overflow-y-auto">
              {hospitalServices.map(srv => {
                const isSelected = hospitalForm.service_ids.includes(srv.id);
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => toggleHospitalServiceSelection(srv.id)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                      isSelected 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20' 
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <CheckCircle className={`w-3.5 h-3.5 ${isSelected ? 'opacity-100 text-emerald-400' : 'opacity-0'}`} />
                    <span>{srv.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button type="button" onClick={() => setShowHospitalModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg">
              Save Hospital
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
