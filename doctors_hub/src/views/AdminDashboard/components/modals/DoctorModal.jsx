import React, { useState, useEffect } from 'react';
import { XCircle } from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';
import { api } from '../../../../services/api';

export default function DoctorModal() {
  const {
    showDoctorModal,
    setShowDoctorModal,
    editingDoctor,
    doctorSpecialties,
    hospitals,
    showNotification,
    loadAllData
  } = useAdminContext();

  const [doctorForm, setDoctorForm] = useState({
    id: '',
    name: '',
    qualification: '',
    experience: '10+ Yrs Exp.',
    selectedSpecialties: [],
    affiliations: []
  });

  useEffect(() => {
    if (editingDoctor) {
      const specIds = Array.isArray(editingDoctor.specialties) 
        ? editingDoctor.specialties.map(s => typeof s === 'object' ? (s.id || s) : s)
        : [];

      const affs = Array.isArray(editingDoctor.affiliations) && editingDoctor.affiliations.length > 0
        ? editingDoctor.affiliations.map(a => ({
            hospital: a.hospital?.id || a.hospital || null,
            diagnostic_center: a.diagnostic_center?.id || a.diagnostic_center || null,
            consultation_type: a.consultation_type || 'Doctor',
            fee: a.fee || '1200',
            schedules: Array.isArray(a.schedules) ? a.schedules : []
          }))
        : [];

      setDoctorForm({
        id: editingDoctor.id,
        name: editingDoctor.name,
        qualification: editingDoctor.qualification,
        experience: editingDoctor.experience,
        selectedSpecialties: specIds,
        affiliations: affs
      });
    } else {
      setDoctorForm({
        id: '',
        name: '',
        qualification: 'MBBS, FCPS (Medicine)',
        experience: '12+ Yrs Exp.',
        selectedSpecialties: (doctorSpecialties || [])[0] ? [(doctorSpecialties || [])[0].id] : [],
        affiliations: [
          {
            hospital: (hospitals || [])[0]?.id || null,
            diagnostic_center: null,
            consultation_type: 'Doctor',
            fee: '1200',
            schedules: [{ day_of_week: 'Sat', start_time: '17:00', end_time: '21:00' }]
          }
        ]
      });
    }
  }, [editingDoctor, showDoctorModal, doctorSpecialties, hospitals]);

  if (!showDoctorModal) return null;

  const handleSaveDoctor = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: doctorForm.name,
        qualification: doctorForm.qualification,
        experience: doctorForm.experience,
        specialty_ids: doctorForm.selectedSpecialties,
        affiliations: (doctorForm.affiliations || []).map(a => ({
          location_id: a.location_id || a.hospital || a.diagnostic_center || a.location || (typeof a.hospital === 'object' ? a.hospital.id : null) || (typeof a.diagnostic_center === 'object' ? a.diagnostic_center.id : null),
          consultation_type: a.consultation_type || 'Doctor',
          fee: parseFloat(a.fee) || 1000,
          schedules: Array.isArray(a.schedules) ? a.schedules : []
        }))
      };

      if (editingDoctor) {
        await api.updateDoctor(editingDoctor.id, payload);
        showNotification(`Doctor "${payload.name}" updated!`);
      } else {
        await api.createDoctor(payload);
        showNotification(`Doctor "${payload.name}" added!`);
      }
      setShowDoctorModal(false);
      loadAllData();
    } catch (err) {
      alert(`Error saving doctor: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full space-y-4 my-8 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white">
            {editingDoctor ? 'Edit Specialist Doctor' : 'Add New Specialist Doctor'}
          </h3>
          <button onClick={() => setShowDoctorModal(false)} className="text-slate-400 hover:text-white">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveDoctor} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Doctor Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Prof. Dr. M. A. Karim"
              value={doctorForm.name}
              onChange={e => setDoctorForm({ ...doctorForm, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Qualifications *</label>
              <input
                type="text"
                required
                placeholder="e.g. MBBS, FCPS (Cardiology), FACC"
                value={doctorForm.qualification}
                onChange={e => setDoctorForm({ ...doctorForm, qualification: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Experience *</label>
              <input
                type="text"
                required
                placeholder="e.g. 15+ Yrs Exp."
                value={doctorForm.experience}
                onChange={e => setDoctorForm({ ...doctorForm, experience: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-teal-400 font-bold mb-1.5">Doctor Specialties *</label>
            <div className="flex flex-wrap gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl max-h-36 overflow-y-auto">
              {doctorSpecialties.map(spec => {
                const isSelected = (doctorForm.selectedSpecialties || []).includes(spec.id);
                return (
                  <button
                    key={spec.id}
                    type="button"
                    onClick={() => {
                      const current = doctorForm.selectedSpecialties || [];
                      const updated = current.includes(spec.id)
                        ? current.filter(id => id !== spec.id)
                        : [...current, spec.id];
                      setDoctorForm({ ...doctorForm, selectedSpecialties: updated });
                    }}
                    className={`px-3 py-1 rounded-lg border text-xs font-bold transition ${
                      isSelected 
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/50' 
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    {spec.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button type="button" onClick={() => setShowDoctorModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-lg">
              Save Doctor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
