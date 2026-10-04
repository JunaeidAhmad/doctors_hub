import React, { useState, useEffect, useRef } from 'react';
import { 
  Stethoscope, UserPlus, Link2, Clock, CheckCircle2, 
  AlertCircle, RefreshCw, Plus, Trash2,
  Award, Building2, Search, ArrowLeft, RotateCw
} from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';
import { api } from '../../../../services/api';
import { Drawer, EditableField } from '../shared';
import TimePickerInput from '../../../../components/TimePickerInput';
import { formatDisplayTime } from '../../../../utils/scheduleUtils';

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
    doctorSpecialties = [], 
    loadAllData, 
    showNotification 
  } = useAdminContext();

  // Two-step flow state: 'find' (Step 1) | 'create' (Step 2)
  const [step, setStep] = useState('find');
  
  // Step 1: Search state
  const [searchType, setSearchType] = useState('name'); // 'name' | 'bmdc'
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Step 2 & Retry safety state (P1.8.5)
  const [createdDoctorId, setCreatedDoctorId] = useState(null);
  const [affiliationFailed, setAffiliationFailed] = useState(false);

  // New Doctor Form State
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    qualification: '',
    experience: '',
    academic_title: '',
    institution: '',
    bmdc_number: '',
    description: '',
    specialty_ids: []
  });

  // Affiliation Details State
  const [affiliation, setAffiliation] = useState({
    fee: '',
    advance_booking_days: '14'
  });

  // Visiting Schedule Slots State
  const [schedules, setSchedules] = useState([
    {
      id: `temp-sched-${Date.now()}`,
      day_of_week: 'Saturday',
      start_time: '17:00:00',
      end_time: '20:00:00',
      max_patients: 30,
      avg_consult_minutes: 10
    }
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 300 ms debounced doctor search (Step 1)
  const debounceTimerRef = useRef(null);
  useEffect(() => {
    if (!isOpen || step !== 'find') return;
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const params = searchType === 'bmdc'
          ? { bmdc: trimmed }
          : { search: trimmed };
        const res = await api.getDoctors(params);
        const list = Array.isArray(res) ? res : (res?.results || []);
        setSearchResults(list);
        setHasSearched(true);
      } catch (err) {
        console.warn('Doctor search failed:', err);
        setSearchResults([]);
        setHasSearched(true);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchQuery, searchType, step, isOpen]);

  const handleAddScheduleSlot = () => {
    setSchedules(prev => [
      ...prev,
      {
        id: `temp-sched-${Date.now()}-${Math.random()}`,
        day_of_week: 'Saturday',
        start_time: '17:00:00',
        end_time: '20:00:00',
        max_patients: 30,
        avg_consult_minutes: 10
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
    setStep('find');
    setSearchQuery('');
    setSearchType('name');
    setSearchResults([]);
    setHasSearched(false);
    setSelectedDoctor(null);
    setCreatedDoctorId(null);
    setAffiliationFailed(false);
    setNewDoctor({
      name: '',
      qualification: '',
      experience: '',
      academic_title: '',
      institution: '',
      bmdc_number: '',
      description: '',
      specialty_ids: []
    });
    setAffiliation({
      fee: '',
      advance_booking_days: '14'
    });
    setSchedules([
      {
        id: `temp-sched-${Date.now()}`,
        day_of_week: 'Saturday',
        start_time: '17:00:00',
        end_time: '20:00:00',
        max_patients: 30,
        avg_consult_minutes: 10
      }
    ]);
    setErrorMsg('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSelectDoctor = (doc) => {
    setSelectedDoctor(doc);
    setErrorMsg('');
  };

  const handleGoToCreateDoctor = () => {
    setStep('create');
    setSelectedDoctor(null);
    setErrorMsg('');
    // Prefill search term into relevant field
    if (searchType === 'name' && searchQuery.trim()) {
      setNewDoctor(prev => ({ ...prev, name: searchQuery.trim() }));
    } else if (searchType === 'bmdc' && searchQuery.trim()) {
      setNewDoctor(prev => ({ ...prev, bmdc_number: searchQuery.trim() }));
    }
  };

  const handleBackToSearch = () => {
    setStep('find');
    setErrorMsg('');
  };

  // Helper to link doctor and create schedules
  const linkDoctorAndCreateSchedules = async (targetDoctorId, doctorName) => {
    const affPayload = {
      doctor: targetDoctorId,
      location_id: facilityId,
      fee: parseFloat(affiliation.fee),
      advance_booking_days: parseInt(affiliation.advance_booking_days, 10) || 14
    };

    const resultAff = await api.createDoctorAffiliation(affPayload);

    // If schedules were configured, create them
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
            end_time: endTimeFormatted,
            max_patients: parseInt(sched.max_patients, 10) || 30,
            avg_consult_minutes: parseInt(sched.avg_consult_minutes, 10) || 10
          });
        } catch (schedErr) {
          console.warn('Schedule slot creation failed:', schedErr);
        }
      }
    }

    showNotification(`Dr. ${doctorName || 'Specialist'} affiliated successfully!`);
    await loadAllData();
    handleClose();
  };

  // Retry Linking button handler (P1.8.5)
  const handleRetryAffiliation = async () => {
    if (!createdDoctorId) return;
    setIsSaving(true);
    setErrorMsg('');
    try {
      await linkDoctorAndCreateSchedules(createdDoctorId, newDoctor.name);
    } catch (err) {
      setAffiliationFailed(true);
      setErrorMsg('Doctor profile created, but linking to this facility failed: ' + (err.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!facilityId) {
      setErrorMsg('No facility targeted for affiliation.');
      return;
    }

    if (!affiliation.fee || isNaN(parseFloat(affiliation.fee))) {
      setErrorMsg('Visiting consultation fee is required.');
      return;
    }

    // Validate schedules
    for (const sched of (schedules || [])) {
      const start = sched.start_time || '17:00:00';
      const end = sched.end_time || '20:00:00';
      if (start >= end) {
        setErrorMsg(`Invalid visiting hours (${start} - ${end}): End time must be after start time.`);
        return;
      }
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      if (step === 'find') {
        if (!selectedDoctor) {
          setErrorMsg('Please select a doctor to affiliate.');
          setIsSaving(false);
          return;
        }
        await linkDoctorAndCreateSchedules(selectedDoctor.id, selectedDoctor.name);
      } else {
        // Step 2: Create new doctor and attach
        let docId = createdDoctorId;

        // P1.8.5: Never call createDoctor twice in one drawer session
        if (!docId) {
          if (!newDoctor.name.trim()) {
            setErrorMsg('Doctor name is required.');
            setIsSaving(false);
            return;
          }
          if (!newDoctor.specialty_ids || newDoctor.specialty_ids.length === 0) {
            setErrorMsg('Please select at least one specialty.');
            setIsSaving(false);
            return;
          }
          const docPayload = {
            name: newDoctor.name.trim(),
            qualification: newDoctor.qualification.trim(),
            experience: newDoctor.experience.trim(),
            academic_title: (newDoctor.academic_title || '').trim(),
            institution: (newDoctor.institution || '').trim(),
            bmdc_number: (newDoctor.bmdc_number || '').trim() || null,
            description: newDoctor.description.trim(),
            specialty_ids: newDoctor.specialty_ids
          };

          const createdDoc = await api.createDoctor(docPayload);
          docId = createdDoc.id;
          setCreatedDoctorId(createdDoc.id);
        }

        // Now link to facility
        try {
          await linkDoctorAndCreateSchedules(docId, newDoctor.name);
        } catch (affErr) {
          setAffiliationFailed(true);
          setErrorMsg('Doctor profile created, but linking to this facility failed: ' + (affErr.message || ''));
        }
      }
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
          <Stethoscope className="w-4 h-4 text-[#094cb2]" />
          <span className="font-serif font-bold text-base text-[#1b1c1d]">
            {step === 'find' ? 'Affiliate Specialist Physician' : 'Create & Affiliate Doctor'}
          </span>
        </div>
      }
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            className="px-3.5 py-2 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 font-label text-xs font-semibold rounded-sm transition cursor-pointer"
          >
            Cancel
          </button>

          {/* Show Retry button if affiliation failed after doctor was created (P1.8.5) */}
          {affiliationFailed && createdDoctorId ? (
            <button
              type="button"
              onClick={handleRetryAffiliation}
              disabled={isSaving}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-label text-xs font-semibold rounded-sm shadow-sm flex items-center gap-2 disabled:opacity-50 transition cursor-pointer"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5" />}
              <span>Retry Link to Facility</span>
            </button>
          ) : (
            <button
              type="submit"
              form="affiliate-doctor-form"
              disabled={isSaving || (step === 'find' && !selectedDoctor)}
              className="px-4 py-2 bg-[#094cb2] hover:bg-[#083e91] text-white font-label text-xs font-semibold rounded-sm shadow-sm flex items-center gap-2 disabled:opacity-50 transition cursor-pointer"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{step === 'find' ? 'Attach Physician' : 'Create & Attach'}</span>
            </button>
          )}
        </>
      }
    >
      <form id="affiliate-doctor-form" onSubmit={handleSubmit} className="space-y-4 text-xs font-body">
        
        {/* FACILITY CONTEXT CHIP */}
        <div className="p-3 bg-[#faf9fa] border border-[#d1d5dc] rounded-sm flex items-center justify-between">
          <span className="text-slate-500 font-label text-[11px]">Affiliating to Facility:</span>
          <span className="font-serif font-bold text-sm text-[#094cb2]">{facilityName || 'Your Facility'}</span>
        </div>

        {/* ERROR / RETRY NOTIFICATION */}
        {errorMsg && (
          <div className={`p-3 rounded-sm flex items-start gap-2 font-body border ${
            affiliationFailed 
              ? 'bg-amber-50 border-amber-300 text-amber-900' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{errorMsg}</span>
              {affiliationFailed && createdDoctorId && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={handleRetryAffiliation}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-label font-semibold rounded-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Retry Linking Facility</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 1: FIND EXISTING DOCTOR (P1.8.4) */}
        {step === 'find' && (
          <div className="space-y-3.5">
            <div className="p-3 bg-white border border-[#d1d5dc] rounded-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-label uppercase font-bold text-[11px] text-slate-700">
                  Step 1: Find Existing Doctor
                </span>
                {/* Search Type Toggle */}
                <div className="flex items-center gap-1 bg-[#f7f6f7] p-0.5 border border-[#d1d5dc] rounded-xs">
                  <button
                    type="button"
                    onClick={() => { setSearchType('name'); setSearchResults([]); setHasSearched(false); }}
                    className={`px-2 py-0.5 text-[10px] font-label font-semibold rounded-xs transition cursor-pointer ${
                      searchType === 'name' ? 'bg-white text-[#094cb2] shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    By Name
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSearchType('bmdc'); setSearchResults([]); setHasSearched(false); }}
                    className={`px-2 py-0.5 text-[10px] font-label font-semibold rounded-xs transition cursor-pointer ${
                      searchType === 'bmdc' ? 'bg-white text-[#094cb2] shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    By BMDC #
                  </button>
                </div>
              </div>

              {/* Search Input with 300ms debounce */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={
                    searchType === 'bmdc' 
                      ? 'Enter BMDC Registration Number (e.g. A-12345)...' 
                      : 'Search by doctor name (e.g. Farhana Ahmed)...'
                  }
                  className="w-full pl-9 pr-9 py-2 border border-[#d1d5dc] rounded-sm text-xs font-body text-slate-800 focus:outline-none focus:border-[#094cb2]"
                />
                {isSearching && (
                  <RefreshCw className="w-4 h-4 absolute right-3 top-2.5 text-[#094cb2] animate-spin" />
                )}
              </div>

              {/* Search Results */}
              {isSearching ? (
                <div className="py-4 text-center text-slate-400 text-xs">
                  Searching doctors...
                </div>
              ) : hasSearched && searchResults.length > 0 ? (
                <div className="space-y-2 max-h-56 overflow-y-auto pt-1">
                  <span className="text-[10px] text-slate-400 font-label uppercase">
                    Found {searchResults.length} matching doctor{searchResults.length === 1 ? '' : 's'}:
                  </span>
                  {searchResults.map(doc => {
                    const isSelected = selectedDoctor?.id === doc.id;
                    return (
                      <div
                        key={doc.id}
                        className={`p-2.5 rounded-sm border transition flex items-center justify-between gap-2 ${
                          isSelected 
                            ? 'bg-[#e7ebff]/50 border-[#094cb2]' 
                            : 'bg-[#faf9fa] border-[#d1d5dc] hover:border-slate-400'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-serif font-bold text-slate-900 text-xs truncate">
                            {doc.name}
                          </div>
                          <div className="text-[11px] text-slate-600 truncate">
                            {doc.qualification}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                            {doc.institution && <span>{doc.institution}</span>}
                            {doc.bmdc_number && <span className="font-mono">BMDC: {doc.bmdc_number}</span>}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectDoctor(doc)}
                          className={`px-3 py-1 rounded-sm text-[11px] font-label font-semibold transition shrink-0 cursor-pointer ${
                            isSelected
                              ? 'bg-[#094cb2] text-white'
                              : 'bg-white border border-[#094cb2] text-[#094cb2] hover:bg-[#e7ebff]'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Attach'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : hasSearched && searchResults.length === 0 ? (
                /* STEP 2 OFFERED ONLY WHEN STEP 1 FINDS NOTHING (P1.8.4) */
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm text-center space-y-2.5">
                  <p className="text-slate-600 text-xs">
                    No doctor profile found matching &ldquo;<strong>{searchQuery}</strong>&rdquo;.
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    If the specialist is not yet registered on Doctor&apos;s Hub, you can onboard them now.
                  </p>
                  <button
                    type="button"
                    onClick={handleGoToCreateDoctor}
                    className="px-3.5 py-1.5 bg-[#094cb2] hover:bg-[#083e91] text-white font-label text-xs font-semibold rounded-sm inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Create New Doctor Profile</span>
                  </button>
                </div>
              ) : (
                <p className="text-slate-400 text-[11px] italic py-1">
                  Type a name or BMDC number to find an existing doctor profile.
                </p>
              )}
            </div>

            {/* Selected Doctor Summary Card */}
            {selectedDoctor && (
              <div className="p-3 bg-[#e7ebff]/40 border border-[#094cb2] rounded-sm space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-label uppercase font-bold text-[10px] text-[#094cb2] tracking-wider">
                    Selected Physician for Affiliation
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedDoctor(null)}
                    className="text-xs text-slate-400 hover:text-rose-600 font-label cursor-pointer"
                  >
                    Change
                  </button>
                </div>
                <div className="font-serif font-bold text-slate-900 text-sm">{selectedDoctor.name}</div>
                <div className="text-slate-600 text-xs">{selectedDoctor.qualification}</div>
                {selectedDoctor.bmdc_number && (
                  <div className="text-slate-500 font-mono text-[11px]">BMDC: {selectedDoctor.bmdc_number}</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: CREATE NEW DOCTOR (P1.8.4 - only offered when Step 1 finds nothing) */}
        {step === 'create' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#e3e5ea] pb-2">
              <span className="font-label uppercase font-bold text-[11px] text-slate-700">
                Step 2: Create New Doctor Profile
              </span>
              <button
                type="button"
                onClick={handleBackToSearch}
                className="text-xs text-[#094cb2] hover:underline flex items-center gap-1 cursor-pointer font-label"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to search</span>
              </button>
            </div>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <EditableField
                label="Academic Title / Seniority"
                value={newDoctor.academic_title}
                onChange={val => setNewDoctor({ ...newDoctor, academic_title: val })}
                placeholder="e.g. Professor & Head of Department"
              />
              <EditableField
                label="Medical Institution / Hospital"
                value={newDoctor.institution}
                onChange={val => setNewDoctor({ ...newDoctor, institution: val })}
                placeholder="e.g. Dhaka Medical College & Hospital"
              />
            </div>

            <EditableField
              label="BMDC Registration Number"
              value={newDoctor.bmdc_number}
              onChange={val => setNewDoctor({ ...newDoctor, bmdc_number: val })}
              placeholder="e.g. A-45892"
            />

            <div>
              <label className="block text-slate-700 font-label font-semibold text-xs mb-1">
                Doctor Specialties (Select multiple)
              </label>
              <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto p-2 bg-[#faf9fa] border border-[#d1d5dc] rounded-sm">
                {doctorSpecialties.map(spec => {
                  const isSelected = newDoctor.specialty_ids.includes(spec.id);
                  return (
                    <button
                      key={spec.id}
                      type="button"
                      onClick={() => toggleSpecialty(spec.id)}
                      className={`px-2 py-0.5 rounded-xs border text-[11px] font-label font-medium transition flex items-center gap-1 cursor-pointer ${
                        isSelected 
                          ? 'bg-[#e7ebff] text-[#094cb2] border-[#094cb2]/40 shadow-xs' 
                          : 'bg-white text-slate-600 border-[#d1d5dc] hover:border-slate-400'
                      }`}
                    >
                      <CheckCircle2 className={`w-3 h-3 ${isSelected ? 'opacity-100 text-[#094cb2]' : 'opacity-0'}`} />
                      <span>{spec.name}{spec.bn_name ? ` · ${spec.bn_name}` : ''}</span>
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

        {/* AFFILIATION PARAMETERS (Visible once a doctor is selected in Step 1, or while creating in Step 2) */}
        {(selectedDoctor || step === 'create') && (
          <>
            <div className="pt-3 border-t border-[#d1d5dc] space-y-2.5">
              <h4 className="font-label font-semibold text-xs uppercase tracking-wider text-slate-500">
                Consultation Settings at this Facility
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-label font-semibold text-xs mb-1">Visiting Fee (৳) *</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={affiliation.fee}
                    onChange={e => setAffiliation({ ...affiliation, fee: e.target.value })}
                    className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-1.5 text-[#1b1c1d] font-body text-xs focus:outline-none focus:border-[#094cb2]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-label font-semibold text-xs mb-1">Advance Booking Window (Days) *</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    required
                    value={affiliation.advance_booking_days}
                    onChange={e => setAffiliation({ ...affiliation, advance_booking_days: e.target.value })}
                    className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-1.5 text-[#1b1c1d] font-body text-xs focus:outline-none focus:border-[#094cb2]"
                  />
                </div>
              </div>
            </div>

            {/* VISITING SCHEDULE SLOTS */}
            <div className="pt-3 border-t border-[#d1d5dc] space-y-2.5">
              <div className="bg-[#faf9fa] border border-[#d1d5dc] rounded-sm p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-label font-semibold text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-[#094cb2]" />
                    <span>Visiting Days & Schedule Slots</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddScheduleSlot}
                    className="px-2 py-0.5 bg-white hover:bg-slate-50 text-[#094cb2] border border-[#094cb2]/30 rounded-xs text-[10px] font-label font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Time Slot</span>
                  </button>
                </div>

                {schedules.length === 0 ? (
                  <div className="text-xs text-slate-400 italic py-1 font-body">
                    No schedule slots added yet. Click &quot;Add Time Slot&quot; above.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {schedules.map((s, sIdx) => (
                      <div key={s.id || sIdx} className="bg-white border border-[#d1d5dc] rounded-xs p-2.5 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 max-w-[140px]">
                            <label className="block text-[10px] text-slate-500 font-label font-semibold mb-0.5">Day</label>
                            <select
                              value={s.day_of_week}
                              onChange={e => handleUpdateScheduleSlot(sIdx, 'day_of_week', e.target.value)}
                              className="w-full bg-white border border-[#d1d5dc] rounded-xs px-2 py-1 text-[#1b1c1d] text-xs font-body focus:outline-none focus:border-[#094cb2]"
                            >
                              {DAYS_OF_WEEK.map(day => (
                                <option key={day} value={day}>{day}</option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveScheduleSlot(sIdx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-xs transition cursor-pointer"
                            title="Remove slot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <TimePickerInput
                            label="Start Time"
                            value={s.start_time}
                            onChange={(val) => handleUpdateScheduleSlot(sIdx, 'start_time', val)}
                          />
                          <TimePickerInput
                            label="End Time"
                            value={s.end_time}
                            onChange={(val) => handleUpdateScheduleSlot(sIdx, 'end_time', val)}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-slate-500 font-label font-semibold mb-0.5">Max Patients</label>
                            <input
                              type="number"
                              min="1"
                              value={s.max_patients}
                              onChange={e => handleUpdateScheduleSlot(sIdx, 'max_patients', e.target.value)}
                              className="w-full bg-white border border-[#d1d5dc] rounded-xs px-2 py-1 text-[#1b1c1d] text-xs font-mono focus:outline-none focus:border-[#094cb2]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 font-label font-semibold mb-0.5">Avg Mins/Patient</label>
                            <input
                              type="number"
                              min="1"
                              value={s.avg_consult_minutes}
                              onChange={e => handleUpdateScheduleSlot(sIdx, 'avg_consult_minutes', e.target.value)}
                              className="w-full bg-white border border-[#d1d5dc] rounded-xs px-2 py-1 text-[#1b1c1d] text-xs font-mono focus:outline-none focus:border-[#094cb2]"
                            />
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

      </form>
    </Drawer>
  );
}
