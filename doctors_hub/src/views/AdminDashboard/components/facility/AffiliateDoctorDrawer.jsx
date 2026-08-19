import React, { useState } from 'react';
import { 
  Stethoscope, UserPlus, Link2, Clock, CheckCircle2, 
  AlertCircle, RefreshCw, X, DollarSign, Calendar
} from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';
import { api } from '../../../../services/api';
import { Drawer, SearchSelect, EditableField, Toggle } from '../shared';

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
    consultation_type: 'OPD',
    fee: '1200'
  });

  // Schedule Slot State
  const [includeSchedule, setIncludeSchedule] = useState(false);
  const [schedule, setSchedule] = useState({
    day_of_week: 'Saturday',
    start_time: '17:00:00',
    end_time: '20:00:00'
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedDoctorObj = doctors.find(d => String(d.id) === String(selectedDoctorId));

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
      consultation_type: 'OPD',
      fee: '1200'
    });
    setIncludeSchedule(false);
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
        consultation_type: affiliation.consultation_type,
        fee: parseFloat(affiliation.fee) || 1200
      };

      const resultAff = await api.onboardFacilityDoctor(facilityId, {
        doctor: docPayload,
        affiliation: affPayload
      });

      // If user configured a schedule slot, add it
      if (includeSchedule && resultAff?.id) {
        try {
          await api.createAffiliationSchedule({
            affiliation_id: resultAff.id,
            day_of_week: schedule.day_of_week,
            start_time: schedule.start_time,
            end_time: schedule.end_time
          });
        } catch (schedErr) {
          console.warn('Affiliation created, but schedule slot creation failed:', schedErr);
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
            Consultation & Fee at this Facility
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Consultation Type</label>
              <select
                value={affiliation.consultation_type}
                onChange={e => setAffiliation({ ...affiliation, consultation_type: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-teal-500"
              >
                <option value="OPD">OPD Consultation</option>
                <option value="Chamber">Private Chamber</option>
                <option value="In-patient">In-patient Care</option>
              </select>
            </div>
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

        {/* OPTIONAL VISITING SCHEDULE SLOT */}
        <div className="pt-3 border-t border-slate-800 space-y-3">
          <Toggle
            id="include_sched_toggle"
            checked={includeSchedule}
            onChange={setIncludeSchedule}
            label="Add Initial Visiting Schedule Slot"
            description="Optionally configure doctor's first weekly visiting time slot right now."
          />

          {includeSchedule && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-3 animate-fadeIn">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Visiting Day</label>
                <select
                  value={schedule.day_of_week}
                  onChange={e => setSchedule({ ...schedule, day_of_week: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-semibold focus:outline-none focus:border-teal-500"
                >
                  {DAYS_OF_WEEK.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Start Time</label>
                  <input
                    type="time"
                    step="60"
                    value={schedule.start_time.slice(0, 5)}
                    onChange={e => setSchedule({ ...schedule, start_time: `${e.target.value}:00` })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">End Time</label>
                  <input
                    type="time"
                    step="60"
                    value={schedule.end_time.slice(0, 5)}
                    onChange={e => setSchedule({ ...schedule, end_time: `${e.target.value}:00` })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

      </form>
    </Drawer>
  );
}
