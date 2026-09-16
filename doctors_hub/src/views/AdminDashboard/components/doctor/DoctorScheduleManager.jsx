import React, { useState } from 'react';
import { 
  Clock, Calendar, Plus, Trash2, Building2, 
  CheckCircle, AlertCircle, RefreshCw, X 
} from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';
import { api } from '../../../../services/api';
import TimePickerInput from '../../../../components/TimePickerInput';
import {
  DAYS_OF_WEEK,
  TIME_PRESETS,
  formatDisplayTime,
  calculateSlotDuration,
  checkScheduleConflict
} from '../../../../utils/scheduleUtils';
import { formatFacilityName } from '../../../../utils/facilityUtils';


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
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Real-time conflict validation
  const conflictCheck = showModal
    ? checkScheduleConflict(dayOfWeek, startTime, endTime, affiliations)
    : { hasConflict: false };

  const currentDuration = calculateSlotDuration(startTime, endTime);

  // Slots existing on the selected day
  const dayExistingSlots = affiliations.flatMap(a =>
    (a.schedules || [])
      .filter(s => s.day_of_week === dayOfWeek)
      .map(s => ({
        ...s,
        loc: formatFacilityName(a.hospital || a.diagnostic_center || a.location || a) || a.chamber_name || a.facility_name || 'Practice Location'
      }))
  );

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

    const validation = checkScheduleConflict(dayOfWeek, startTime, endTime, affiliations);
    if (validation.hasConflict) {
      setLocalErr(validation.error);
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
      const msg = typeof err.message === 'string' ? err.message : 'Failed to create schedule.';
      setLocalErr(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!scheduleToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteAffiliationSchedule(scheduleToDelete.id);
      setScheduleToDelete(null);
      if (setSuccessMsg) setSuccessMsg('Schedule slot deleted successfully!');
      await loadAllData();
    } catch (err) {
      if (setError) setError(err.message || 'Failed to remove schedule.');
    } finally {
      setIsDeleting(false);
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
              </div>

              {/* Weekly Days Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {schedules.map((s, sIdx) => {
                  const duration = calculateSlotDuration(s.start_time, s.end_time);
                  return (
                    <div key={s.id || sIdx} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-cyan-500/40 transition flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{s.day_of_week}</span>
                        </div>
                        <div className="text-slate-300 text-[11px] font-mono mt-1 flex items-center gap-1.5 flex-wrap">
                          <span>{formatDisplayTime(s.start_time)} - {formatDisplayTime(s.end_time)}</span>
                          {duration && (
                            <span className="text-[10px] font-sans text-cyan-400/80 bg-cyan-950/80 border border-cyan-800/40 px-1.5 py-0.5 rounded-md">
                              {duration}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => setScheduleToDelete(s)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/20 transition cursor-pointer"
                        title="Delete Slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}

                {schedules.length === 0 && (
                  <div className="col-span-full py-6 text-center text-slate-500 text-xs">
                    No visiting schedule slots configured for this location yet. Click "Add Weekly Slot" to configure visiting hours.
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-white text-base">Add Weekly Visiting Slot</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Display */}
            {localErr && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{localErr}</span>
              </div>
            )}

            {/* Real-time Conflict Alert */}
            {!localErr && conflictCheck.hasConflict && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Schedule Conflict Detected</span>
                  <span className="text-[11px] text-amber-200/90">{conflictCheck.error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveSchedule} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Select Practice Location</label>
                <select
                  value={selectedAffiliationId}
                  onChange={e => setSelectedAffiliationId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  {affiliations.map(aff => (
                    <option key={aff.id} value={aff.id}>
                      {formatFacilityName(aff.hospital || aff.diagnostic_center || aff.location || aff) || aff.facility_name || aff.chamber_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Day of Week</label>
                <select
                  value={dayOfWeek}
                  onChange={e => {
                    setDayOfWeek(e.target.value);
                    setLocalErr('');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  {DAYS_OF_WEEK.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Existing schedule on this day */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
                  <span>Current Schedule on {dayOfWeek}:</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    {dayExistingSlots.length} slot{dayExistingSlots.length === 1 ? '' : 's'}
                  </span>
                </div>
                {dayExistingSlots.length === 0 ? (
                  <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>No slots on {dayOfWeek}. Day is available!</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {dayExistingSlots.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700/60 text-[10px] text-slate-300 font-mono">
                        {formatDisplayTime(s.start_time)} - {formatDisplayTime(s.end_time)} <span className="text-slate-500">({s.loc})</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>


              {/* Start Time and End Time Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TimePickerInput
                  label="Start Time"
                  value={startTime}
                  onChange={(newTime) => {
                    setStartTime(newTime);
                    setLocalErr('');
                  }}
                  hasError={conflictCheck.hasConflict}
                />
                <TimePickerInput
                  label="End Time"
                  value={endTime}
                  onChange={(newTime) => {
                    setEndTime(newTime);
                    setLocalErr('');
                  }}
                  hasError={conflictCheck.hasConflict}
                />
              </div>

              {/* Live Time Range & Duration Summary Bar */}
              <div className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                conflictCheck.hasConflict
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-slate-950/70 border-slate-800/80 text-slate-300'
              }`}>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold text-white font-mono">{formatDisplayTime(startTime)}</span>
                    <span className="text-slate-500 mx-1.5 font-bold">➔</span>
                    <span className="font-bold text-white font-mono">{formatDisplayTime(endTime)}</span>
                  </div>
                </div>

                {currentDuration ? (
                  <span className="px-2.5 py-0.5 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-300 text-[11px] font-bold">
                    ⏱️ {currentDuration}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-bold">
                    Invalid Slot Duration
                  </span>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || conflictCheck.hasConflict}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Save Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Slot Confirmation Modal */}
      {scheduleToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Visiting Slot</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 text-xs space-y-2">
              <p className="text-slate-300">
                Are you sure you want to delete this visiting schedule slot?
              </p>
              <div className="flex items-center gap-2 text-cyan-300 font-bold mt-2 pt-2 border-t border-slate-800/60">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>{scheduleToDelete.day_of_week}</span>
                <span className="text-slate-500">•</span>
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="font-mono">{formatDisplayTime(scheduleToDelete.start_time)} - {formatDisplayTime(scheduleToDelete.end_time)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setScheduleToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Slot</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
