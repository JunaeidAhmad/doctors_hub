import React, { useState } from 'react';
import { 
  Building2, Plus, Edit, Trash2, MapPin, Phone, 
  DollarSign, CheckCircle, AlertCircle, RefreshCw, X, Stethoscope 
} from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';
import { api } from '../../../../services/api';

export default function DoctorAffiliationsManager() {
  const {
    doctors,
    hospitals,
    loadAllData,
    setSuccessMsg,
    setError
  } = useAdminContext();

  const doctor = doctors && doctors.length > 0 ? doctors[0] : null;
  const affiliations = doctor?.affiliations || [];

  const [showModal, setShowModal] = useState(false);
  const [editingAff, setEditingAff] = useState(null);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [consultationType, setConsultationType] = useState('OPD');
  const [fee, setFee] = useState('1500');
  const [saving, setSaving] = useState(false);
  const [localErr, setLocalErr] = useState('');

  const allLocations = [
    ...(hospitals || []).map(h => ({ id: h.id, name: `${h.name} (${h.branch || 'Main'})`, type: 'hospital' })),
    ...(diagnosticCenters || []).map(dc => ({ id: dc.id, name: `${dc.name} (${dc.branch || 'Main'})`, type: 'diagnostic' }))
  ];

  const handleOpenAddModal = () => {
    setEditingAff(null);
    setSelectedLocationId(allLocations[0]?.id || '');
    setConsultationType('OPD');
    setFee('1500');
    setLocalErr('');
    setShowModal(true);
  };

  const handleOpenEditModal = (aff) => {
    setEditingAff(aff);
    setSelectedLocationId(aff.location_id || aff.location?.id || '');
    setConsultationType(aff.consultation_type || 'OPD');
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
          consultation_type: consultationType,
          fee: parseFloat(fee) || 1500
        });
      } else {
        // Create new affiliation
        await api.createDoctorAffiliation({
          doctor: doctor?.id,
          location_id: selectedLocationId || allLocations[0]?.id,
          consultation_type: consultationType,
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
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-teal-400" />
            <span>Consultation Chambers & Hospital Affiliations</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage your hospital OPD visits, private chamber clinics, consultation fees, and visiting locations.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-teal-600/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Practice Location</span>
        </button>
      </div>

      {/* Affiliations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {affiliations.map((aff, idx) => (
          <div key={aff.id || idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3 relative group hover:border-teal-500/40 transition">
            
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold uppercase tracking-wider">
                  {aff.consultation_type || 'OPD Consultation'}
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  {aff.hospital?.name || aff.diagnostic_center?.name || aff.chamber_name || aff.facility_name || 'Specialist Chamber'}
                </h3>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-400" />
                  <span>{aff.location?.address_line || aff.location?.area || 'Dhaka, Bangladesh'}</span>
                </p>
              </div>

              <div className="text-right">
                <div className="text-sm font-black text-teal-300">৳{aff.fee || 1500}</div>
                <div className="text-[10px] text-slate-400">Visiting Fee</div>
              </div>
            </div>

            {/* Schedules pill list */}
            {Array.isArray(aff.schedules) && aff.schedules.length > 0 && (
              <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-1.5">
                {aff.schedules.map((s, sIdx) => (
                  <span key={s.id || sIdx} className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 text-[10px]">
                    {s.day_of_week}: {s.start_time} - {s.end_time}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/80">
              <button
                onClick={() => handleOpenEditModal(aff)}
                className="p-1.5 text-slate-400 hover:text-teal-400 bg-slate-950 rounded-lg hover:bg-slate-800 transition"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteAffiliation(aff.id)}
                className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-950 rounded-lg hover:bg-rose-500/20 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

          </div>
        ))}

        {affiliations.length === 0 && (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
            No chambers or hospital affiliations added yet. Click "Add Practice Location" above to get started.
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                {editingAff ? 'Edit Practice Chamber' : 'Add New Practice Location'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {localErr && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{localErr}</span>
              </div>
            )}

            <form onSubmit={handleSaveAffiliation} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Hospital or Chamber Location *</label>
                <select
                  required
                  disabled={Boolean(editingAff)}
                  value={selectedLocationId}
                  onChange={e => setSelectedLocationId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-teal-500 disabled:opacity-60 font-semibold"
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
                <label className="block text-slate-300 font-bold mb-1.5">Consultation Type</label>
                <select
                  value={consultationType}
                  onChange={e => setConsultationType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="OPD">Hospital OPD Consultation</option>
                  <option value="Chamber">Private Consultation Chamber</option>
                  <option value="In-patient">In-patient Rounds & Clinical Care</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Visiting Consultation Fee (৳)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="50"
                  value={fee}
                  onChange={e => setFee(e.target.value)}
                  placeholder="1500"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50"
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
