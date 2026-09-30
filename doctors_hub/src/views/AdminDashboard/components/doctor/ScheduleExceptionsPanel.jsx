import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, Clock, Plus, Trash2, AlertTriangle, 
  CheckCircle2, X, RefreshCw, CalendarOff, AlertCircle 
} from 'lucide-react';
import { api } from '../../../../services/api';
import TimePickerInput from '../../../../components/TimePickerInput';
import { formatDisplayTime } from '../../../../utils/scheduleUtils';

export default function ScheduleExceptionsPanel({ affiliation, onChanged }) {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [kind, setKind] = useState('cancel'); // 'cancel', 'modify', 'extra'
  const [date, setDate] = useState('');
  const [scheduleId, setScheduleId] = useState('');
  const [startTime, setStartTime] = useState('17:00:00');
  const [endTime, setEndTime] = useState('21:00:00');
  const [maxPatients, setMaxPatients] = useState('30');
  const [avgConsultMinutes, setAvgConsultMinutes] = useState('10');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [bannerMsg, setBannerMsg] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const affId = affiliation?.id;
  const schedules = Array.isArray(affiliation?.schedules) ? affiliation.schedules : [];

  const todayStr = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 60);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  const fetchExceptions = useCallback(async () => {
    if (!affId) return;
    setLoading(true);
    try {
      const res = await api.getScheduleExceptions({
        affiliation: affId,
        date_from: todayStr,
        date_to: maxDateStr,
      });
      const list = Array.isArray(res) ? res : (res?.results || []);
      setExceptions(list);
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, [affId, todayStr, maxDateStr]);

  useEffect(() => {
    fetchExceptions();
  }, [fetchExceptions]);

  const handleOpenModal = () => {
    setKind('cancel');
    setDate(todayStr);
    setScheduleId(schedules[0]?.id || '');
    setStartTime('17:00:00');
    setEndTime('21:00:00');
    setMaxPatients('30');
    setAvgConsultMinutes('10');
    setNote('');
    setErrorMsg('');
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSaving(true);

    const payload = {
      affiliation_id: affId,
      date,
      kind,
      note: note.trim() || undefined,
    };

    if (kind === 'cancel' || kind === 'modify') {
      if (!scheduleId) {
        setErrorMsg('Please select a regular weekly schedule slot.');
        setSaving(false);
        return;
      }
      payload.schedule = scheduleId;
    }

    if (kind === 'modify' || kind === 'extra') {
      payload.start_time = startTime;
      payload.end_time = endTime;
      if (maxPatients) payload.max_patients = parseInt(maxPatients, 10);
      if (avgConsultMinutes) payload.avg_consult_minutes = parseInt(avgConsultMinutes, 10);
    }

    try {
      const created = await api.createScheduleException(payload);
      setShowAddModal(false);
      const affected = created?.affected_bookings || 0;
      if (affected > 0) {
        setBannerMsg(`Schedule exception created! ${affected} existing booking(s) on this date are affected.`);
      } else {
        setBannerMsg('Schedule exception created successfully.');
      }
      setTimeout(() => setBannerMsg(''), 6000);
      await fetchExceptions();
      if (onChanged) onChanged();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save schedule exception.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this schedule exception?')) return;
    setDeletingId(id);
    try {
      await api.deleteScheduleException(id);
      await fetchExceptions();
      if (onChanged) onChanged();
    } catch (err) {
      alert(err.message || 'Failed to delete schedule exception.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="pt-4 border-t border-[#e3e5ea] space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarOff className="w-4 h-4 text-amber-600" />
          <h4 className="text-xs font-label uppercase font-bold text-slate-700 tracking-wider">
            Schedule Exceptions & Leaves
          </h4>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-xs bg-slate-100 text-slate-600 border border-slate-200">
            {exceptions.length} active
          </span>
        </div>

        <button
          type="button"
          onClick={handleOpenModal}
          className="px-2.5 py-1 text-xs font-label font-semibold text-amber-700 hover:bg-amber-50 border border-amber-300 rounded-sm transition flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Exception</span>
        </button>
      </div>

      {bannerMsg && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{bannerMsg}</span>
          </div>
          <button onClick={() => setBannerMsg('')} className="text-amber-700 hover:text-amber-950 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Exceptions List */}
      {loading ? (
        <div className="p-3 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Loading exceptions...</span>
        </div>
      ) : exceptions.length === 0 ? (
        <p className="text-[11px] font-body text-slate-400 italic">
          No upcoming leaves, modifications, or extra visiting sessions scheduled for this location in the next 60 days.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {exceptions.map(exc => {
            const isCancel = exc.kind === 'cancel';
            const isModify = exc.kind === 'modify';
            const isExtra = exc.kind === 'extra';

            return (
              <div 
                key={exc.id} 
                className={`p-2.5 rounded-sm border text-xs space-y-1.5 transition ${
                  isCancel ? 'bg-rose-50/50 border-rose-200' :
                  isModify ? 'bg-amber-50/50 border-amber-200' :
                  'bg-emerald-50/50 border-emerald-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-900 font-mono text-[11px]">
                      {exc.date}
                    </span>
                    <span className={`text-[10px] uppercase font-label font-bold px-1.5 py-0.2 rounded-xs border ${
                      isCancel ? 'bg-rose-100 text-rose-800 border-rose-300' :
                      isModify ? 'bg-amber-100 text-amber-800 border-amber-300' :
                      'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}>
                      {isCancel ? 'Cancelled' : isModify ? 'Modified' : 'Extra Session'}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={deletingId === exc.id}
                    onClick={() => handleDelete(exc.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                    title="Remove Exception"
                  >
                    {deletingId === exc.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Details */}
                <div className="text-[11px] text-slate-600 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {isCancel ? (
                    <span className="text-rose-700 font-medium">Session cancelled on this date</span>
                  ) : (
                    <span className="font-mono">
                      {formatDisplayTime(exc.start_time)} - {formatDisplayTime(exc.end_time)}
                      {exc.max_patients && ` · Max: ${exc.max_patients}`}
                    </span>
                  )}
                </div>

                {exc.note && (
                  <p className="text-[11px] text-slate-500 italic">
                    &ldquo;{exc.note}&rdquo;
                  </p>
                )}

                {exc.affected_bookings > 0 && (
                  <div className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span>{exc.affected_bookings} active booking(s) affected</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Exception Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#d1d5dc] rounded-sm max-w-md w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#e3e5ea] pb-3">
              <div className="flex items-center gap-2">
                <CalendarOff className="w-4 h-4 text-amber-600" />
                <h3 className="font-serif font-bold text-slate-900 text-base">Add Schedule Exception</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="text-slate-400 hover:text-slate-700 p-1 rounded-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-body">
              {/* Kind selection */}
              <div>
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1.5">
                  Exception Type *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'cancel', label: 'Cancel Session' },
                    { val: 'modify', label: 'Modify Hours' },
                    { val: 'extra', label: 'Extra Session' }
                  ].map(t => (
                    <button
                      key={t.val}
                      type="button"
                      onClick={() => setKind(t.val)}
                      className={`py-2 px-2 text-center rounded-sm font-label text-[11px] font-bold uppercase tracking-wider border cursor-pointer transition ${
                        kind === t.val 
                          ? 'bg-[#094cb2] text-white border-[#094cb2]' 
                          : 'bg-white text-slate-600 border-[#d1d5dc] hover:bg-slate-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1.5">
                  Specific Date *
                </label>
                <input
                  type="date"
                  required
                  min={todayStr}
                  max={maxDateStr}
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 focus:outline-none focus:border-[#094cb2] font-mono text-xs"
                />
              </div>

              {/* Schedule selection for cancel/modify */}
              {(kind === 'cancel' || kind === 'modify') && (
                <div>
                  <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1.5">
                    Target Weekly Slot to {kind === 'cancel' ? 'Cancel' : 'Modify'} *
                  </label>
                  {schedules.length === 0 ? (
                    <p className="text-rose-600 text-[11px]">
                      No weekly schedules configured for this facility.
                    </p>
                  ) : (
                    <select
                      value={scheduleId}
                      onChange={e => setScheduleId(e.target.value)}
                      className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 focus:outline-none focus:border-[#094cb2] font-mono text-xs cursor-pointer"
                    >
                      {schedules.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.day_of_week}: {formatDisplayTime(s.start_time)} - {formatDisplayTime(s.end_time)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Time inputs for modify and extra */}
              {(kind === 'modify' || kind === 'extra') && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <TimePickerInput
                      label="Start Time"
                      value={startTime}
                      onChange={setStartTime}
                    />
                    <TimePickerInput
                      label="End Time"
                      value={endTime}
                      onChange={setEndTime}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1.5">
                        Max Patients
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={maxPatients}
                        onChange={e => setMaxPatients(e.target.value)}
                        placeholder="30"
                        className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 focus:outline-none focus:border-[#094cb2] font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1.5">
                        Avg Consult (Mins)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={avgConsultMinutes}
                        onChange={e => setAvgConsultMinutes(e.target.value)}
                        placeholder="10"
                        className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 focus:outline-none focus:border-[#094cb2] font-mono text-xs"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Note / Reason */}
              <div>
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1.5">
                  Reason / Public Note
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="e.g. Leave for conference, emergency OPD"
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 focus:outline-none focus:border-[#094cb2] text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e3e5ea]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 rounded-sm font-label text-xs font-semibold uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#094cb2] hover:bg-[#083e91] text-white rounded-sm font-label text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Save Exception'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
