import React, { useState } from 'react';
import { 
  Clock, Calendar, Plus, Trash2, Building2, 
  CheckCircle, AlertCircle, RefreshCw, X, Stethoscope 
} from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';
import { api } from '../../../../services/api';

const DAYS_OF_WEEK = [
  'Saturday', 'Sunday', 'Monday', 'Tuesday', 
  'Wednesday', 'Thursday', 'Friday'
];

export default function DoctorScheduleManager() {
  const {
    doctors,
    loadAllData,
    setSuccessMsg,
    setError
  } = useAdminContext();

  const doctor = doctors && doctors.length > 0 ? doctors[0] : null;
  const affiliations = doctor?.affiliations || [];

  const [showModal, setShowModal] = useState(false);
  const [selectedAffiliationId, setSelectedAffiliationId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('Saturday');
  const [startTime, setStartTime] = useState('17:00:00');
  const [endTime, setEndTime] = useState('21:00:00');
  const [saving, setSaving] = useState(false);
  const [localErr, setLocalErr] = useState('');

  const handleOpenAddModal = (affId = '') => {
    setSelectedAffiliationId(affId || (affiliations[0]?.id || ''));
    setDayOfWeek('Saturday');
    setStartTime('17:00:00');
    setEndTime('21:00:00');
    setLocalErr('');
    setShowModal(true);
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!selectedAffiliationId) {
      setLocalErr('Please select a chamber or hospital location.');
      return;
    }

    setSaving(true);
    setLocalErr('');

    try {
      await api.createAffiliationSchedule({
        affiliation_id: selectedAffiliationId,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime
      });

      setShowModal(false);
      if (setSuccessMsg) setSuccessMsg('Schedule slot added successfully!');
      await loadAllData();
    } catch (err) {
      setLocalErr(err.message || 'Failed to create schedule.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm('Are you sure you want to delete this visiting schedule slot?')) return;
    try {
      await api.deleteAffiliationSchedule(id);
      if (setSuccessMsg) setSuccessMsg('Schedule slot removed.');
      await loadAllData();
    } catch (err) {
      if (setError) setError(err.message || 'Failed to remove schedule.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-cyan-400" />
            <span>Weekly Consultation Schedule Builder</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure visiting days, consultation hours, and time slots per hospital OPD and chamber.
          </p>
        </div>

        <button
          onClick={() => handleOpenAddModal()}
          className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-600/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Weekly Slot</span>
        </button>
      </div>

      {/* Schedules by Affiliation */}
      <div className="space-y-6">
        {affiliations.map((aff, idx) => {
          const schedules = Array.isArray(aff.schedules) ? aff.schedules : [];
          return (
            <div key={aff.id || idx} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {aff.hospital?.name || aff.diagnostic_center?.name || aff.chamber_name || aff.facility_name || 'Consultation Location'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Fee: ৳{aff.fee || 1500}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenAddModal(aff.id)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-slate-700 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Slot Here</span>
                </button>
              </div>

              {/* Weekly Days Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {schedules.map((s, sIdx) => (
                  <div key={s.id || sIdx} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-cyan-500/40 transition flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{s.day_of_week}</span>
                      </div>
                      <div className="text-slate-300 text-[11px] font-mono mt-1">
                        {s.start_time} - {s.end_time}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteSchedule(s.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/20 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {schedules.length === 0 && (
                  <div className="col-span-full py-6 text-center text-slate-500 text-xs">
                    No visiting schedule slots configured for this location yet. Click "Add Slot Here" to configure visiting hours.
                  </div>
                )}
              </div>

            </div>
          );
        })}

        {affiliations.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
            No chambers or hospitals found. Please add a Practice Location under the "Chambers & Affiliations" tab first.
          </div>
        )}
      </div>

      {/* Add Slot Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Add Weekly Visiting Slot</h3>
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

            <form onSubmit={handleSaveSchedule} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Select Practice Location</label>
                <select
                  value={selectedAffiliationId}
                  onChange={e => setSelectedAffiliationId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                >
                  {affiliations.map(aff => (
                    <option key={aff.id} value={aff.id}>
                      {aff.hospital?.name || aff.diagnostic_center?.name || aff.facility_name || aff.chamber_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Day of Week</label>
                <select
                  value={dayOfWeek}
                  onChange={e => setDayOfWeek(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                >
                  {DAYS_OF_WEEK.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime.slice(0, 5)}
                    onChange={e => setStartTime(`${e.target.value}:00`)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime.slice(0, 5)}
                    onChange={e => setEndTime(`${e.target.value}:00`)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
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
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Save Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
