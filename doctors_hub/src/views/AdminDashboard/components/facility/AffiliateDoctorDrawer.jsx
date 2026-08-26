import React, { useState } from 'react';
import { 
  Stethoscope, UserPlus, Link2, Clock, CheckCircle2, 
  AlertCircle, RefreshCw, X, DollarSign, Calendar, Plus, Trash2
} from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';
import { api } from '../../../../services/api';
import { Drawer, SearchSelect, EditableField } from '../shared';

const DAYS_OF_WEEK = [
  'Saturday', 'Sunday', 'Monday', 'Tuesday', 
  'Wednesday', 'Thursday', 'Friday'
];

export default function AffiliateDoctorDrawer({ 
  isOpen, 
  onClose, 
  facilityId, 
  facilityName 
}) {
  const { 
    doctors = [], 
    doctorSpecialties = [], 
    loadAllData, 
    showNotification 
  } = useAdminContext();

  const [mode, setMode] = useState('existing'); // 'existing' | 'new'
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  
  // New Doctor Form State
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    qualification: '',
    experience: '',
    bmdc_number: '',
    description: '',
    specialty_ids: []
  });

  // Affiliation Details State
  const [affiliation, setAffiliation] = useState({
    fee: '1200'
  });

  // Visiting Schedule Slots State
  const [schedules, setSchedules] = useState([
    {
      id: `temp-sched-${Date.now()}`,
      day_of_week: 'Saturday',
      start_time: '17:00',
      end_time: '20:00'
    }
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedDoctorObj = doctors.find(d => String(d.id) === String(selectedDoctorId));

  const handleAddScheduleSlot = () => {
    setSchedules(prev => [
      ...prev,
      {
        id: `temp-sched-${Date.now()}-${Math.random()}`,
        day_of_week: 'Saturday',
        start_time: '17:00',
        end_time: '20:00'
      }
    ]);
  };

  const handleUpdateScheduleSlot = (schedIndex, field, value) => {
    setSchedules(prev => {
      const next = [...prev];
      next[schedIndex] = {
        ...next[schedIndex],
        [field]: value
      };
      return next;
    });
  };

  const handleRemoveScheduleSlot = (schedIndex) => {
    setSchedules(prev => prev.filter((_, sIdx) => sIdx !== schedIndex));
  };

  const resetForm = () => {
    setSelectedDoctorId('');
    setNewDoctor({
      name: '',
      qualification: '',
      experience: '',
      bmdc_number: '',
      description: '',
      specialty_ids: doctorSpecialties[0] ? [doctorSpecialties[0].id] : []
    });
    setAffiliation({
      fee: '1200'
    });
    setSchedules([
      {
        id: `temp-sched-${Date.now()}`,
        day_of_week: 'Saturday',
        start_time: '17:00',
        end_time: '20:00'
      }
    ]);
    setErrorMsg('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!facilityId) {
      setErrorMsg('No facility targeted for affiliation.');
      return;
    }

    // Check schedule validity and overlaps
    const allSchedules = [];
    for (const sched of (schedules || [])) {
      const start = sched.start_time || '17:00';
      const end = sched.end_time || '20:00';
      const startMin = parseInt(start.split(':')[0] || '0', 10) * 60 + parseInt(start.split(':')[1] || '0', 10);
      const endMin = parseInt(end.split(':')[0] || '0', 10) * 60 + parseInt(end.split(':')[1] || '0', 10);

      if (startMin >= endMin) {
        setErrorMsg(`Invalid visiting hours (${start} - ${end}): End time must be after start time.`);
        return;
      }

      allSchedules.push({
        day: sched.day_of_week || 'Saturday',
        startMin,
        endMin,
        startStr: start,
        endStr: end
      });
    }

    for (let i = 0; i < allSchedules.length; i++) {
      for (let j = i + 1; j < allSchedules.length; j++) {
        const s1 = allSchedules[i];
        const s2 = allSchedules[j];
        if (s1.day === s2.day && s1.startMin < s2.endMin && s1.endMin > s2.startMin) {
          setErrorMsg(
            `Schedule conflict on ${s1.day}: Slot (${s1.startStr} - ${s1.endStr}) overlaps with slot (${s2.startStr} - ${s2.endStr}).`
          );
          return;
        }
      }
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      let docPayload = {};
      if (mode === 'existing') {
        if (!selectedDoctorId) {
          setErrorMsg('Please select a doctor to affiliate.');
          setIsSaving(false);
          return;
        }
        docPayload = { id: selectedDoctorId };
      } else {
        if (!newDoctor.name.trim()) {
          setErrorMsg('Doctor name is required.');
          setIsSaving(false);
          return;
        }
        docPayload = {
          name: newDoctor.name.trim(),
          qualification: newDoctor.qualification.trim(),
          experience: newDoctor.experience.trim(),
          bmdc_number: newDoctor.bmdc_number.trim(),
          description: newDoctor.description.trim(),
          specialty_ids: newDoctor.specialty_ids
        };
      }

      const affPayload = {
        fee: parseFloat(affiliation.fee) || 1200
      };

      const resultAff = await api.onboardFacilityDoctor(facilityId, {
        doctor: docPayload,
        affiliation: affPayload
      });

      // If user configured schedule slots, add each
      if (schedules.length > 0 && resultAff?.id) {
        for (const sched of schedules) {
          try {
            const startTimeFormatted = sched.start_time?.length === 5 
              ? `${sched.start_time}:00` 
              : (sched.start_time || '17:00:00');
            const endTimeFormatted = sched.end_time?.length === 5 
              ? `${sched.end_time}:00` 
              : (sched.end_time || '20:00:00');

            await api.createAffiliationSchedule({
              affiliation_id: resultAff.id,
              day_of_week: sched.day_of_week || 'Saturday',
              start_time: startTimeFormatted,
              end_time: endTimeFormatted
            });
          } catch (schedErr) {
            console.warn('Affiliation created, but schedule slot creation failed:', schedErr);
          }
        }
      }

      showNotification(
        mode === 'existing' 
          ? `Dr. ${selectedDoctorObj?.name || 'Specialist'} affiliated successfully!` 
          : `Dr. ${newDoctor.name} onboarded and affiliated successfully!`
      );

      await loadAllData();
      handleClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to affiliate doctor.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSpecialty = (specId) => {
    const next = newDoctor.specialty_ids.includes(specId)
      ? newDoctor.specialty_ids.filter(id => id !== specId)
      : [...newDoctor.specialty_ids, specId];
    setNewDoctor({ ...newDoctor, specialty_ids: next });
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-teal-400" />
          <span>Affiliate Specialist Doctor</span>
        </div>
      }
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="affiliate-doctor-form"
            disabled={isSaving}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{mode === 'existing' ? 'Attach Doctor' : 'Onboard & Attach'}</span>
          </button>
        </>
      }
    >
      <form id="affiliate-doctor-form" onSubmit={handleSubmit} className="space-y-5 text-xs">
        
        {/* FACILITY CONTEXT CHIP */}
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
          <span className="text-slate-400 font-medium">Affiliating to Facility:</span>
          <span className="font-bold text-teal-300">{facilityName || 'Your Facility'}</span>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* MODE TABS (Attach Existing vs Onboard New) */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setMode('existing')}
            className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              mode === 'existing'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Attach Existing</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('new')}
            className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              mode === 'new'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Onboard New</span>
          </button>
        </div>

        {/* MODE 1: ATTACH EXISTING DOCTOR */}
        {mode === 'existing' && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Search Platform Doctors *
              </label>
              <SearchSelect
                options={doctors}
                value={selectedDoctorId}
                onChange={(val) => setSelectedDoctorId(val)}
                placeholder="Search by doctor name or qualification..."
                searchPlaceholder="Type doctor name..."
                labelKey="name"
                valueKey="id"
                subtitleKey="qualification"
              />
            </div>

            {selectedDoctorObj && (
              <div className="p-3.5 bg-slate-950 border border-teal-500/30 rounded-xl space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{selectedDoctorObj.name}</span>
                  {selectedDoctorObj.experience && (
                    <span className="text-[10px] bg-slate-800 text-teal-400 px-2 py-0.5 rounded-full font-semibold">
                      {selectedDoctorObj.experience}
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-[11px]">{selectedDoctorObj.qualification}</p>
                {selectedDoctorObj.bmdc_number && (
                  <p className="text-slate-500 text-[10px] font-mono">BMDC: {selectedDoctorObj.bmdc_number}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* MODE 2: ONBOARD NEW DOCTOR */}
        {mode === 'new' && (
          <div className="space-y-4 animate-fadeIn">
            <EditableField
              label="Doctor Full Name"
              required
              value={newDoctor.name}
              onChange={val => setNewDoctor({ ...newDoctor, name: val })}
              placeholder="e.g. Prof. Dr. Farhana Ahmed"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <EditableField
                label="Qualifications / Degrees"
                required
                value={newDoctor.qualification}
                onChange={val => setNewDoctor({ ...newDoctor, qualification: val })}
                placeholder="e.g. MBBS, FCPS (Cardiology)"
              />
              <EditableField
                label="Experience Tag"
                value={newDoctor.experience}
                onChange={val => setNewDoctor({ ...newDoctor, experience: val })}
                placeholder="e.g. 15+ Yrs Exp."
              />
            </div>

            <EditableField
              label="BMDC Registration Number"
              value={newDoctor.bmdc_number}
              onChange={val => setNewDoctor({ ...newDoctor, bmdc_number: val })}
              placeholder="e.g. A-45892"
            />

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Doctor Specialties (Select multiple)
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                {doctorSpecialties.map(spec => {
                  const isSelected = newDoctor.specialty_ids.includes(spec.id);
                  return (
                    <button
                      key={spec.id}
                      type="button"
                      onClick={() => toggleSpecialty(spec.id)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                        isSelected 
                          ? 'bg-teal-500/20 text-teal-300 border-teal-500/50' 
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <CheckCircle2 className={`w-3 h-3 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                      <span>{spec.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <EditableField
              type="textarea"
              rows={2}
              label="Professional Bio / Summary"
              value={newDoctor.description}
              onChange={val => setNewDoctor({ ...newDoctor, description: val })}
              placeholder="Key clinical interests, training, and fellowships..."
            />
          </div>
        )}

        {/* AFFILIATION PARAMETERS */}
        <div className="pt-3 border-t border-slate-800 space-y-3">
          <h4 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">
            Consultation fee at this Facility
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Visiting Fee (৳) *</label>
              <input
                type="number"
                min="0"
                step="50"
                required
                value={affiliation.fee}
                onChange={e => setAffiliation({ ...affiliation, fee: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* VISITING SCHEDULE SLOTS */}
        <div className="pt-3 border-t border-slate-800 space-y-3">
          <div className="bg-slate-950/70 border border-slate-800/60 rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                <span>Visiting Days & Schedule Slots</span>
              </div>
              <button
                type="button"
                onClick={handleAddScheduleSlot}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/20 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Time Slot</span>
              </button>
            </div>

            {schedules.length === 0 ? (
              <div className="text-[11px] text-slate-500 italic py-1">
                No schedule slots added yet. Click &quot;Add Time Slot&quot; above.
              </div>
            ) : (
              <div className="space-y-2">
                {schedules.map((s, sIdx) => (
                  <div key={s.id || sIdx} className="bg-slate-900 border border-slate-800/80 rounded-xl p-2.5 flex flex-wrap items-center gap-2 text-xs">
                    
                    <div className="flex-1 min-w-[110px]">
                      <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Day</label>
                      <select
                        value={s.day_of_week}
                        onChange={e => handleUpdateScheduleSlot(sIdx, 'day_of_week', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white text-[11px] focus:outline-none focus:border-teal-500"
                      >
                        {DAYS_OF_WEEK.map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>

                    <div className="w-24">
                      <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Start Time</label>
                      <input
                        type="time"
                        required
                        value={s.start_time ? s.start_time.slice(0, 5) : '17:00'}
                        onChange={e => handleUpdateScheduleSlot(sIdx, 'start_time', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white text-[11px] focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div className="w-24">
                      <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">End Time</label>
                      <input
                        type="time"
                        required
                        value={s.end_time ? s.end_time.slice(0, 5) : '20:00'}
                        onChange={e => handleUpdateScheduleSlot(sIdx, 'end_time', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white text-[11px] focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div className="self-end pb-1">
                      <button
                        type="button"
                        onClick={() => handleRemoveScheduleSlot(sIdx)}
                        className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                        title="Remove slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </form>
    </Drawer>
  );
}
