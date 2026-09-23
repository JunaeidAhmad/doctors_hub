import React, { useState } from 'react';
import { 
  Clock, Calendar, Plus, Trash2, Building2, 
  CheckCircle, AlertCircle, RefreshCw, X, ShieldAlert 
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
      
      {/* Editorial Header */}
      <div className="bg-white border border-[#d1d5dc] rounded-sm p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-label text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm bg-[#e7ebff] text-[#094cb2] border border-[#cbd5e1] tracking-wider">
              Consultation Availability
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#094cb2]" />
            <span>Weekly Consultation Schedule Builder</span>
          </h2>
          <p className="text-xs font-body text-slate-500 mt-1 max-w-2xl">
            Configure visiting days, OPD consultation hours, and appointment time slots across hospital OPDs and chamber clinics.
          </p>
        </div>

        <button
          onClick={() => handleOpenAddModal()}
          className="px-4 py-2 bg-[#094cb2] hover:bg-[#083e91] text-white font-label text-xs font-semibold uppercase tracking-wider rounded-sm flex items-center gap-2 shadow-sm transition cursor-pointer self-start sm:self-auto"
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
            <div key={aff.id || idx} className="bg-white border border-[#d1d5dc] rounded-sm p-6 shadow-sm space-y-4">
              
              <div className="flex items-center justify-between border-b border-[#e3e5ea] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-sm bg-[#e7ebff] border border-[#cbd5e1] text-[#094cb2] flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-bold text-slate-900 leading-tight">
                      {aff.hospital?.name || aff.diagnostic_center?.name || aff.chamber_name || aff.facility_name || 'Consultation Location'}
                    </h3>
                    <p className="text-xs font-body text-slate-500">
                      Standard Fee: <span className="font-semibold text-slate-800">৳{aff.fee || 1500}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenAddModal(aff.id)}
                  className="px-2.5 py-1 text-xs font-label font-semibold text-[#094cb2] hover:bg-[#e7ebff] border border-[#cbd5e1] rounded-sm transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Slot</span>
                </button>
              </div>

              {/* Weekly Days Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {schedules.map((s, sIdx) => {
                  const duration = calculateSlotDuration(s.start_time, s.end_time);
                  return (
                    <div 
                      key={s.id || sIdx} 
                      className="p-3.5 rounded-sm bg-[#f7f6f7] border border-[#d1d5dc] hover:border-[#094cb2] transition flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-serif font-bold text-slate-900 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#094cb2]" />
                          <span>{s.day_of_week}</span>
                        </div>
                        <div className="text-slate-600 text-[11px] font-mono mt-1.5 flex items-center gap-1.5 flex-wrap">
                          <span>{formatDisplayTime(s.start_time)} - {formatDisplayTime(s.end_time)}</span>
                          {duration && (
                            <span className="text-[10px] font-sans text-[#094cb2] bg-[#e7ebff] border border-[#cbd5e1] px-1.5 py-0.2 rounded-xs">
                              {duration}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => setScheduleToDelete(s)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-sm hover:bg-rose-50 transition cursor-pointer"
                        title="Delete Slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}

                {schedules.length === 0 && (
                  <div className="col-span-full py-8 text-center text-slate-400 text-xs font-body">
                    No visiting schedule slots configured for this location yet. Click &quot;Add Weekly Slot&quot; to configure visiting hours.
                  </div>
                )}
              </div>

            </div>
          );
        })}

        {affiliations.length === 0 && (
          <div className="bg-white border border-[#d1d5dc] rounded-sm p-12 text-center text-slate-400 text-xs font-body">
            No chambers or hospitals found. Please add a Practice Location under the &quot;Chambers &amp; Affiliations&quot; tab first.
          </div>
        )}
      </div>

      {/* Add Slot Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#d1d5dc] rounded-sm max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#e3e5ea] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-sm bg-[#e7ebff] border border-[#cbd5e1] text-[#094cb2] flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="font-serif font-bold text-slate-900 text-base">Add Weekly Visiting Slot</h3>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-slate-400 hover:text-slate-700 p-1 rounded-sm transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Display */}
            {localErr && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{localErr}</span>
              </div>
            )}

            {/* Real-time Conflict Alert */}
            {!localErr && conflictCheck.hasConflict && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-sm flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block font-serif">Schedule Conflict Detected</span>
                  <span className="text-[11px] text-amber-700">{conflictCheck.error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveSchedule} className="space-y-4 text-xs font-body">
              <div>
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1.5">
                  Select Practice Location *
                </label>
                <select
                  value={selectedAffiliationId}
                  onChange={e => setSelectedAffiliationId(e.target.value)}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 focus:outline-none focus:border-[#094cb2] cursor-pointer"
                >
                  {affiliations.map(aff => (
                    <option key={aff.id} value={aff.id}>
                      {formatFacilityName(aff.hospital || aff.diagnostic_center || aff.location || aff) || aff.facility_name || aff.chamber_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1.5">
                  Day of Week *
                </label>
                <select
                  value={dayOfWeek}
                  onChange={e => {
                    setDayOfWeek(e.target.value);
                    setLocalErr('');
                  }}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 focus:outline-none focus:border-[#094cb2] cursor-pointer"
                >
                  {DAYS_OF_WEEK.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Existing schedule on this day */}
              <div className="p-3 bg-[#f7f6f7] rounded-sm border border-[#d1d5dc] space-y-1.5">
                <div className="text-[11px] font-label uppercase font-bold text-slate-500 flex items-center justify-between">
                  <span>Current Schedule on {dayOfWeek}:</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {dayExistingSlots.length} slot{dayExistingSlots.length === 1 ? '' : 's'}
                  </span>
                </div>
                {dayExistingSlots.length === 0 ? (
                  <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>No slots configured on {dayOfWeek}. Day is fully open!</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {dayExistingSlots.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-sm bg-white border border-[#d1d5dc] text-[10px] text-slate-700 font-mono">
                        {formatDisplayTime(s.start_time)} - {formatDisplayTime(s.end_time)} <span className="text-slate-400">({s.loc})</span>
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
              <div className={`p-3 rounded-sm border flex items-center justify-between transition-colors ${
                conflictCheck.hasConflict
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-[#f7f6f7] border-[#d1d5dc] text-slate-700'
              }`}>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#094cb2] shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 font-mono">{formatDisplayTime(startTime)}</span>
                    <span className="text-slate-400 mx-1.5 font-bold">➔</span>
                    <span className="font-bold text-slate-900 font-mono">{formatDisplayTime(endTime)}</span>
                  </div>
                </div>

                {currentDuration ? (
                  <span className="px-2 py-0.5 rounded-sm bg-[#e7ebff] border border-[#cbd5e1] text-[#094cb2] text-[11px] font-bold font-mono">
                    {currentDuration}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-sm bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold">
                    Invalid Slot Duration
                  </span>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e3e5ea]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 rounded-sm font-label text-xs font-semibold uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || conflictCheck.hasConflict}
                  className="px-4 py-2 bg-[#094cb2] hover:bg-[#083e91] text-white rounded-sm font-label text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#d1d5dc] rounded-sm max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-[#e3e5ea] pb-3">
              <div className="w-10 h-10 rounded-sm bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-slate-900">Delete Visiting Slot</h3>
                <p className="text-xs text-slate-500 font-body">This will remove this consultation time slot.</p>
              </div>
            </div>

            <div className="bg-[#f7f6f7] p-3.5 rounded-sm border border-[#d1d5dc] text-xs space-y-2 font-body">
              <p className="text-slate-700">
                Are you sure you want to remove this consultation schedule slot from your active visiting timetable?
              </p>
              <div className="flex items-center gap-2 text-slate-900 font-bold mt-2 pt-2 border-t border-[#e3e5ea]">
                <Calendar className="w-4 h-4 text-[#094cb2]" />
                <span>{scheduleToDelete.day_of_week}</span>
                <span className="text-slate-300">•</span>
                <Clock className="w-4 h-4 text-[#094cb2]" />
                <span className="font-mono text-slate-700">{formatDisplayTime(scheduleToDelete.start_time)} - {formatDisplayTime(scheduleToDelete.end_time)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setScheduleToDelete(null)}
                className="px-4 py-2 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 rounded-sm font-label text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-sm font-label text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition disabled:opacity-50 cursor-pointer"
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
