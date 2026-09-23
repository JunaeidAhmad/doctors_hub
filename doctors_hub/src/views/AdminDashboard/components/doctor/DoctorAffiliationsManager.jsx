import React, { useState } from 'react';
import { 
  Building2, Plus, Edit, Trash2, MapPin, 
  AlertCircle, RefreshCw, X, Stethoscope, Landmark 
} from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';
import { api } from '../../../../services/api';
import { formatFacilityName } from '../../../../utils/facilityUtils';

export default function DoctorAffiliationsManager() {
  const {
    doctors,
    hospitals,
    diagnosticCenters,
    loadAllData,
    setSuccessMsg,
    setError
  } = useAdminContext();

  const doctor = doctors && doctors.length > 0 ? doctors[0] : null;
  const affiliations = doctor?.affiliations || [];

  const [showModal, setShowModal] = useState(false);
  const [editingAff, setEditingAff] = useState(null);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [fee, setFee] = useState('1500');
  const [saving, setSaving] = useState(false);
  const [localErr, setLocalErr] = useState('');

  const allLocations = [
    ...(hospitals || []).map(h => ({ id: h.id, name: formatFacilityName(h), type: 'hospital' })),
    ...(diagnosticCenters || []).map(dc => ({ id: dc.id, name: formatFacilityName(dc), type: 'diagnostic' }))
  ];

  const handleOpenAddModal = () => {
    setEditingAff(null);
    setSelectedLocationId(allLocations[0]?.id || '');
    setFee('1500');
    setLocalErr('');
    setShowModal(true);
  };

  const handleOpenEditModal = (aff) => {
    setEditingAff(aff);
    setSelectedLocationId(aff.location_id || aff.location?.id || '');
    setFee(String(aff.fee || '1500'));
    setLocalErr('');
    setShowModal(true);
  };

  const handleSaveAffiliation = async (e) => {
    e.preventDefault();
    setSaving(true);
    setLocalErr('');

    try {
      if (editingAff && editingAff.id) {
        await api.updateDoctorAffiliation(editingAff.id, {
          fee: parseFloat(fee) || 1500
        });
      } else {
        await api.createDoctorAffiliation({
          doctor: doctor?.id,
          location_id: selectedLocationId || allLocations[0]?.id,
          fee: parseFloat(fee) || 1500
        });
      }

      setShowModal(false);
      if (setSuccessMsg) setSuccessMsg('Consultation chamber updated successfully!');
      await loadAllData();
    } catch (err) {
      setLocalErr(err.message || 'Failed to save chamber.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAffiliation = async (id) => {
    if (!window.confirm('Are you sure you want to remove this consultation chamber?')) return;
    try {
      await api.deleteDoctorAffiliation(id);
      if (setSuccessMsg) setSuccessMsg('Chamber removed.');
      await loadAllData();
    } catch (err) {
      if (setError) setError(err.message || 'Failed to remove chamber.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Editorial Page Header */}
      <div className="bg-white border border-[#d1d5dc] rounded-sm p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-label text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm bg-[#e7ebff] text-[#094cb2] border border-[#cbd5e1] tracking-wider">
              Practicing Locations & OPD
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#094cb2]" />
            <span>Consultation Chambers & Hospital Affiliations</span>
          </h2>
          <p className="text-xs font-body text-slate-500 mt-1 max-w-2xl">
            Manage your institutional hospital appointments, private chamber clinics, OPD consultation fees, and visiting facilities.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-[#094cb2] hover:bg-[#083e91] text-white font-label text-xs font-semibold uppercase tracking-wider rounded-sm flex items-center gap-2 shadow-sm transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Practice Location</span>
        </button>
      </div>

      {/* Affiliations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {affiliations.map((aff, idx) => (
          <div 
            key={aff.id || idx} 
            className="bg-white border border-[#d1d5dc] rounded-sm p-5 shadow-sm space-y-4 hover:border-[#094cb2] transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-sm bg-[#e7ebff] border border-[#cbd5e1] text-[#094cb2] flex items-center justify-center shrink-0 mt-0.5">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-serif font-bold text-slate-900 leading-tight">
                    {formatFacilityName(aff.hospital || aff.diagnostic_center || aff.location || aff) || aff.chamber_name || aff.facility_name || 'Specialist Chamber'}
                  </h3>
                  <p className="text-xs font-body text-slate-500 flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{aff.location?.address_line || aff.location?.area || 'Dhaka, Bangladesh'}</span>
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-base font-serif font-bold text-[#094cb2]">৳{aff.fee || 1500}</div>
                <div className="font-label text-[10px] uppercase font-bold text-slate-400 tracking-wider">Visiting Fee</div>
              </div>
            </div>

            {/* Schedules pill list */}
            {Array.isArray(aff.schedules) && aff.schedules.length > 0 && (
              <div className="pt-3 border-t border-[#f1f3f5] space-y-1.5">
                <div className="font-label text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Weekly Consultation Hours
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {aff.schedules.map((s, sIdx) => (
                    <span 
                      key={s.id || sIdx} 
                      className="px-2 py-0.5 rounded-sm bg-[#f7f6f7] text-slate-700 border border-[#d1d5dc] font-mono text-[11px]"
                    >
                      {s.day_of_week}: {s.start_time} - {s.end_time}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-[#f1f3f5]">
              <button
                onClick={() => handleOpenEditModal(aff)}
                className="px-2.5 py-1 text-xs font-label font-semibold text-slate-600 hover:text-[#094cb2] bg-white border border-[#d1d5dc] hover:border-[#094cb2] rounded-sm transition flex items-center gap-1"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Fee</span>
              </button>
              <button
                onClick={() => handleDeleteAffiliation(aff.id)}
                className="px-2.5 py-1 text-xs font-label font-semibold text-rose-600 hover:text-rose-700 bg-white border border-rose-200 hover:border-rose-400 rounded-sm transition flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        ))}

        {affiliations.length === 0 && (
          <div className="col-span-full bg-white border border-[#d1d5dc] rounded-sm p-12 text-center text-slate-400 text-xs font-body">
            No chambers or hospital affiliations added yet. Click &quot;Add Practice Location&quot; above to register your practice facilities.
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#d1d5dc] rounded-sm max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e3e5ea] pb-3">
              <h3 className="font-serif font-bold text-slate-900 text-base">
                {editingAff ? 'Edit Practice Chamber Fee' : 'Add Practice Location'}
              </h3>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-slate-400 hover:text-slate-700 transition p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {localErr && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{localErr}</span>
              </div>
            )}

            <form onSubmit={handleSaveAffiliation} className="space-y-4 text-xs font-body">
              <div>
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1.5">
                  Hospital or Chamber Facility *
                </label>
                <select
                  required
                  disabled={Boolean(editingAff)}
                  value={selectedLocationId}
                  onChange={e => setSelectedLocationId(e.target.value)}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 focus:outline-none focus:border-[#094cb2] disabled:opacity-60 font-semibold"
                >
                  <option value="">Select Hospital / Chamber</option>
                  {allLocations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} {loc.type === 'hospital' ? '(Hospital)' : '(Diagnostic Center)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1.5">
                  Visiting Consultation Fee (৳) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="50"
                  value={fee}
                  onChange={e => setFee(e.target.value)}
                  placeholder="1500"
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 focus:outline-none focus:border-[#094cb2] font-mono text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e3e5ea]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 rounded-sm font-label text-xs font-semibold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#094cb2] hover:bg-[#083e91] text-white rounded-sm font-label text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Save Chamber'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
