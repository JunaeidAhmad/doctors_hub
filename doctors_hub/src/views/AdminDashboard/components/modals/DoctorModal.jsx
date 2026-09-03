import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Stethoscope, Building2, DollarSign, Clock, 
  Plus, Trash2, AlertCircle, Save, Sparkles, User
} from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';
import { api } from '../../../../services/api';

const DAYS_OF_WEEK = [
  'Saturday', 'Sunday', 'Monday', 'Tuesday', 
  'Wednesday', 'Thursday', 'Friday'
];

export default function DoctorModal() {
  const {
    isSuperAdmin,
    showDoctorModal,
    setShowDoctorModal,
    editingDoctor,
    doctorSpecialties = [],
    hospitals = [],
    diagnosticCenters = [],
    showNotification,
    loadAllData
  } = useAdminContext();

  const [name, setName] = useState('');
  const [academicTitle, setAcademicTitle] = useState('');
  const [institution, setInstitution] = useState('');
  const [bmdcNumber, setBmdcNumber] = useState('');
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('10+ Yrs Exp.');
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);
  const [affiliations, setAffiliations] = useState([]);
  
  // Tracking initial IDs to detect deletions on submit
  const [initialAffiliationIds, setInitialAffiliationIds] = useState([]);
  const [initialScheduleIds, setInitialScheduleIds] = useState({});

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Combined list of all available hospitals and diagnostic centers
  const allLocations = useMemo(() => {
    const list = [];
    (hospitals || []).forEach(h => {
      const locId = h.location_details?.id || h.location || h.id;
      const locName = h.location_details?.name || h.name || 'Hospital';
      const locBranch = h.location_details?.branch || h.branch;
      const label = locBranch ? `${locName} (${locBranch})` : locName;
      if (locId && !list.some(item => String(item.id) === String(locId))) {
        list.push({ id: String(locId), name: label, type: 'Hospital' });
      }
    });
    (diagnosticCenters || []).forEach(dc => {
      const locId = dc.location_details?.id || dc.location || dc.id;
      const locName = dc.location_details?.name || dc.name || 'Diagnostic Center';
      const locBranch = dc.location_details?.branch || dc.branch;
      const label = locBranch ? `${locName} (${locBranch})` : locName;
      if (locId && !list.some(item => String(item.id) === String(locId))) {
        list.push({ id: String(locId), name: label, type: 'Diagnostic Center' });
      }
    });
    return list;
  }, [hospitals, diagnosticCenters]);

  useEffect(() => {
    if (!showDoctorModal) return;

    setErrorMsg('');
    if (editingDoctor) {
      setName(editingDoctor.name || '');
      setAcademicTitle(editingDoctor.academic_title || '');
      setInstitution(editingDoctor.institution || '');
      setBmdcNumber(editingDoctor.bmdc_number || '');
      setQualification(editingDoctor.qualification || '');
      setExperience(editingDoctor.experience || '10+ Yrs Exp.');

      const specIds = Array.isArray(editingDoctor.specialties) 
        ? editingDoctor.specialties.map(s => typeof s === 'object' && s !== null ? (s.id || s) : s)
        : [];
      setSelectedSpecialties(specIds);

      const allLocationIds = new Set(allLocations.map(l => String(l.id)));
      const managedAffiliations = (editingDoctor.affiliations || []).filter(a => {
        const locId = a.location_details?.id || a.location_id || a.location || a.hospital?.id || a.diagnostic_center?.id || '';
        return allLocationIds.has(String(locId));
      });

      const affList = managedAffiliations.length > 0
        ? managedAffiliations.map(a => {
            const locId = a.location_details?.id || a.location_id || a.location || a.hospital?.id || a.diagnostic_center?.id || '';
            const schedules = Array.isArray(a.schedules) ? a.schedules.map(s => ({
              id: s.id,
              day_of_week: s.day_of_week || 'Saturday',
              start_time: s.start_time ? s.start_time.slice(0, 5) : '17:00',
              end_time: s.end_time ? s.end_time.slice(0, 5) : '21:00'
            })) : [];

            return {
              id: a.id,
              location_id: String(locId),
              fee: String(a.fee != null ? a.fee : '1200'),
              schedules: schedules.length > 0 ? schedules : [
                {
                  id: `temp-sched-${Date.now()}`,
                  day_of_week: 'Saturday',
                  start_time: '17:00',
                  end_time: '21:00'
                }
              ]
            };
          })
        : [
            {
              id: `temp-aff-${Date.now()}`,
              location_id: allLocations[0]?.id || '',
              fee: '1200',
              schedules: [
                {
                  id: `temp-sched-${Date.now()}`,
                  day_of_week: 'Saturday',
                  start_time: '17:00',
                  end_time: '21:00'
                }
              ]
            }
          ];

      setAffiliations(affList);
      setInitialAffiliationIds(managedAffiliations.map(a => a.id));

      const origSchedMap = {};
      managedAffiliations.forEach(a => {
        if (a.id) {
          origSchedMap[a.id] = (a.schedules || []).map(s => s.id).filter(Boolean);
        }
      });
      setInitialScheduleIds(origSchedMap);
    } else {
      setName('');
      setAcademicTitle('');
      setInstitution('');
      setBmdcNumber('');
      setQualification('MBBS, FCPS (Medicine)');
      setExperience('10+ Yrs Exp.');
      setSelectedSpecialties((doctorSpecialties || [])[0] ? [doctorSpecialties[0].id] : []);
      setAffiliations([
        {
          id: `temp-aff-${Date.now()}`,
          location_id: allLocations[0]?.id || '',

          fee: '1200',
          schedules: [
            {
              id: `temp-sched-${Date.now()}`,
              day_of_week: 'Saturday',
              start_time: '17:00',
              end_time: '21:00'
            }
          ]
        }
      ]);
      setInitialAffiliationIds([]);
      setInitialScheduleIds({});
    }
  }, [editingDoctor, showDoctorModal, doctorSpecialties, allLocations]);

  if (!showDoctorModal) return null;

  const toggleSpecialty = (specId) => {
    setSelectedSpecialties(prev => 
      prev.includes(specId) 
        ? prev.filter(id => id !== specId) 
        : [...prev, specId]
    );
  };

  const handleAddChamber = () => {
    const defaultLoc = allLocations[0]?.id || '';
    setAffiliations(prev => [
      ...prev,
      {
        id: `temp-aff-${Date.now()}-${Math.random()}`,
        location_id: defaultLoc,

        fee: '1200',
        schedules: [
          {
            id: `temp-sched-${Date.now()}-${Math.random()}`,
            day_of_week: 'Saturday',
            start_time: '17:00',
            end_time: '21:00'
          }
        ]
      }
    ]);
  };

  const handleRemoveChamber = (affIndex) => {
    setAffiliations(prev => prev.filter((_, idx) => idx !== affIndex));
  };

  const handleUpdateChamberField = (affIndex, field, value) => {
    setAffiliations(prev => prev.map((aff, idx) => {
      if (idx !== affIndex) return aff;
      return { ...aff, [field]: value };
    }));
  };

  const handleAddScheduleSlot = (affIndex) => {
    setAffiliations(prev => prev.map((aff, idx) => {
      if (idx !== affIndex) return aff;
      return {
        ...aff,
        schedules: [
          ...aff.schedules,
          {
            id: `temp-sched-${Date.now()}-${Math.random()}`,
            day_of_week: 'Monday',
            start_time: '17:00',
            end_time: '21:00'
          }
        ]
      };
    }));
  };

  const handleUpdateScheduleSlot = (affIndex, schedIndex, field, value) => {
    setAffiliations(prev => prev.map((aff, aIdx) => {
      if (aIdx !== affIndex) return aff;
      const updatedSchedules = aff.schedules.map((s, sIdx) => {
        if (sIdx !== schedIndex) return s;
        return { ...s, [field]: value };
      });
      return { ...aff, schedules: updatedSchedules };
    }));
  };

  const handleRemoveScheduleSlot = (affIndex, schedIndex) => {
    setAffiliations(prev => prev.map((aff, aIdx) => {
      if (aIdx !== affIndex) return aff;
      return {
        ...aff,
        schedules: aff.schedules.filter((_, sIdx) => sIdx !== schedIndex)
      };
    }));
  };

  const handleSaveDoctor = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Doctor full name is required.');
      return;
    }
    if (!qualification.trim()) {
      setErrorMsg('Doctor qualification is required.');
      return;
    }
    if (selectedSpecialties.length === 0) {
      setErrorMsg('Please select at least one medical specialty.');
      return;
    }

    // Check schedule validity and overlaps across all chambers
    const allSchedules = [];
    for (const aff of affiliations) {
      const loc = allLocations.find(l => String(l.id) === String(aff.location_id))?.name || 'Chamber';
      for (const sched of (aff.schedules || [])) {
        const start = sched.start_time || '17:00';
        const end = sched.end_time || '21:00';
        const startMin = parseInt(start.split(':')[0] || '0', 10) * 60 + parseInt(start.split(':')[1] || '0', 10);
        const endMin = parseInt(end.split(':')[0] || '0', 10) * 60 + parseInt(end.split(':')[1] || '0', 10);

        if (startMin >= endMin) {
          setErrorMsg(`Invalid visiting hours (${start} - ${end}) at ${loc}: End time must be after start time.`);
          return;
        }

        allSchedules.push({
          day: sched.day_of_week || 'Saturday',
          startMin,
          endMin,
          startStr: start,
          endStr: end,
          loc
        });
      }
    }

    // Check for pairwise schedule conflict
    for (let i = 0; i < allSchedules.length; i++) {
      for (let j = i + 1; j < allSchedules.length; j++) {
        const s1 = allSchedules[i];
        const s2 = allSchedules[j];
        if (s1.day === s2.day) {
          if (s1.startMin < s2.endMin && s1.endMin > s2.startMin) {
            setErrorMsg(
              `Schedule conflict on ${s1.day}: Slot (${s1.startStr} - ${s1.endStr}) at ${s1.loc} overlaps with slot (${s2.startStr} - ${s2.endStr}) at ${s2.loc}.`
            );
            return;
          }
        }
      }
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const docPayload = {
        name: name.trim(),
        academic_title: academicTitle.trim(),
        institution: institution.trim(),
        qualification: qualification.trim(),
        experience: experience.trim(),
        bmdc_number: bmdcNumber.trim() || undefined,
        specialty_ids: selectedSpecialties
      };

      let doctorId = editingDoctor?.id;
      
      // ONLY SUPER ADMIN CAN EDIT THE DOCTOR PROFILE DIRECTLY
      if (isSuperAdmin) {
        if (editingDoctor) {
          await api.updateDoctor(editingDoctor.id, docPayload);
        } else {
          const createdDoc = await api.createDoctor(docPayload);
          doctorId = createdDoc?.id;
        }
      } else {
        if (!doctorId) {
          throw new Error('You do not have permission to create a new doctor profile.');
        }
      }

      if (!doctorId) {
        throw new Error('Failed to identify doctor ID.');
      }

      // 1. Delete removed affiliations
      const currentAffIds = new Set(
        affiliations
          .map(a => a.id)
          .filter(id => id && !String(id).startsWith('temp-'))
      );

      for (const initialId of initialAffiliationIds) {
        if (!currentAffIds.has(initialId)) {
          try {
            await api.deleteDoctorAffiliation(initialId);
          } catch (err) {
            console.warn('Failed to delete affiliation:', initialId, err);
          }
        }
      }

      // 2. Process each chamber / affiliation
      for (const aff of affiliations) {
        const isTempAff = !aff.id || String(aff.id).startsWith('temp-');
        const targetLocId = aff.location_id || allLocations[0]?.id;
        if (!targetLocId) continue;

        let affId = aff.id;
        if (isTempAff) {
          // Create new affiliation
          const createdAff = await api.createDoctorAffiliation({
            doctor: doctorId,
            location_id: targetLocId,

            fee: parseFloat(aff.fee) || 1200
          });
          affId = createdAff?.id;
        } else {
          // Update existing affiliation fee & type
          await api.updateDoctorAffiliation(affId, {

            fee: parseFloat(aff.fee) || 1200
          });
        }

        if (affId) {
          // Handle deleted schedule slots for this affiliation
          const origSchedIds = initialScheduleIds[aff.id] || [];
          const currentSchedIds = new Set(
            (aff.schedules || [])
              .map(s => s.id)
              .filter(id => id && !String(id).startsWith('temp-'))
          );

          for (const origSchedId of origSchedIds) {
            if (!currentSchedIds.has(origSchedId)) {
              try {
                await api.deleteAffiliationSchedule(origSchedId);
              } catch (err) {
                console.warn('Failed to delete schedule slot:', origSchedId, err);
              }
            }
          }

          // Create new schedule slots
          for (const sched of (aff.schedules || [])) {
            const isTempSched = !sched.id || String(sched.id).startsWith('temp-');
            if (isTempSched) {
              try {
                const startTimeFormatted = sched.start_time?.length === 5 
                  ? `${sched.start_time}:00` 
                  : (sched.start_time || '17:00:00');
                const endTimeFormatted = sched.end_time?.length === 5 
                  ? `${sched.end_time}:00` 
                  : (sched.end_time || '21:00:00');

                await api.createAffiliationSchedule({
                  affiliation_id: affId,
                  day_of_week: sched.day_of_week || 'Saturday',
                  start_time: startTimeFormatted,
                  end_time: endTimeFormatted
                });
              } catch (err) {
                console.warn('Failed to create schedule slot:', err);
              }
            }
          }
        }
      }

      showNotification(editingDoctor ? `Dr. ${name} updated with fees and schedules!` : `Dr. ${name} added successfully!`);
      setShowDoctorModal(false);
      await loadAllData();
    } catch (err) {
      setErrorMsg(err.message || 'Error saving doctor details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-3xl w-full space-y-5 my-8 shadow-2xl max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">
                {editingDoctor ? `Edit Doctor: Dr. ${editingDoctor.name}` : 'Add New Specialist Doctor'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {editingDoctor 
                  ? 'Update doctor credentials, consultation fees, chambers, and visiting schedules.' 
                  : 'Register a specialist doctor with chambers, consultation fees, and visiting hours.'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setShowDoctorModal(false)} 
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Scrollable Form Content */}
        <form onSubmit={handleSaveDoctor} id="doctor-modal-form" className="space-y-6 text-xs overflow-y-auto pr-1 flex-1">
          
          {/* SECTION 1: Doctor Credentials */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-4">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/60 pb-2">
              <User className="w-4 h-4 text-teal-400" />
              <span>Doctor Personal & Professional Information</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Doctor Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. Dr. M. A. Karim"
                  value={name}
                  disabled={!isSuperAdmin}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">BMDC Registration No.</label>
                <input
                  type="text"
                  placeholder="e.g. A-12345"
                  value={bmdcNumber}
                  disabled={!isSuperAdmin}
                  onChange={e => setBmdcNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Qualifications & Degrees *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MBBS, FCPS (Cardiology), FACC"
                  value={qualification}
                  disabled={!isSuperAdmin}
                  onChange={e => setQualification(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Experience</label>
                <input
                  type="text"
                  placeholder="e.g. 15+ Yrs Exp."
                  value={experience}
                  disabled={!isSuperAdmin}
                  onChange={e => setExperience(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Academic Title / Seniority</label>
                <input
                  type="text"
                  placeholder="e.g. Professor, Associate Professor, Consultant"
                  value={academicTitle}
                  disabled={!isSuperAdmin}
                  onChange={e => setAcademicTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Medical Institution / Hospital</label>
                <input
                  type="text"
                  placeholder="e.g. Dhaka Medical College & Hospital"
                  value={institution}
                  disabled={!isSuperAdmin}
                  onChange={e => setInstitution(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Specialties */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/60 pb-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Medical Specialties *</span>
            </h4>
            <p className="text-[11px] text-slate-400">Click to select all specialties that apply to this doctor:</p>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
              {doctorSpecialties.map(spec => {
                const isSelected = selectedSpecialties.includes(spec.id);
                return (
                  <button
                    key={spec.id}
                    type="button"
                    onClick={() => isSuperAdmin && toggleSpecialty(spec.id)}
                    disabled={!isSuperAdmin}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      isSelected 
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/60 shadow-sm shadow-teal-500/10' 
                        : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span>{spec.name}</span>
                    {isSelected && <span className="text-teal-400">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: Chambers, Fees & Visiting Schedules */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-2.5">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span>Chambers, Consultation Fees & Schedules</span>
              </h4>
              <button
                type="button"
                onClick={handleAddChamber}
                className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Chamber</span>
              </button>
            </div>

            {affiliations.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <Building2 className="w-6 h-6 mx-auto mb-1 text-slate-500" />
                <p>No consultation chambers configured.</p>
                <button
                  type="button"
                  onClick={handleAddChamber}
                  className="mt-2 px-3 py-1.5 bg-cyan-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  + Add First Chamber
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {affiliations.map((aff, aIdx) => (
                  <div key={aff.id || aIdx} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3.5">
                    
                    {/* Chamber Header */}
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold text-[10px] rounded-lg">
                          Chamber #{aIdx + 1}
                        </span>
                      </div>
                      {affiliations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveChamber(aIdx)}
                          className="text-rose-400 hover:text-rose-300 p-1 rounded-lg hover:bg-rose-500/10 transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                          title="Remove this chamber"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove Chamber</span>
                        </button>
                      )}
                    </div>

                    {/* Chamber Facility, Type & Fee */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Facility / Hospital *</label>
                        <select
                          value={aff.location_id}
                          onChange={e => handleUpdateChamberField(aIdx, 'location_id', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-white text-xs focus:outline-none focus:border-cyan-500 transition"
                        >
                          {allLocations.length === 0 ? (
                            <option value="">No locations available</option>
                          ) : (
                            allLocations.map(loc => (
                              <option key={loc.id} value={loc.id}>
                                [{loc.type}] {loc.name}
                              </option>
                            ))
                          )}
                        </select>
                      </div>



                      <div>
                        <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Consultation Fee (৳) *</span>
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="50"
                          placeholder="e.g. 1200"
                          value={aff.fee}
                          onChange={e => handleUpdateChamberField(aIdx, 'fee', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-300 font-bold text-xs focus:outline-none focus:border-emerald-500 transition"
                        />
                      </div>
                    </div>

                    {/* Visiting Schedule Slots */}
                    <div className="bg-slate-950/70 border border-slate-800/60 rounded-xl p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Visiting Days & Schedule Slots</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddScheduleSlot(aIdx)}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/20 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Time Slot</span>
                        </button>
                      </div>

                      {aff.schedules.length === 0 ? (
                        <div className="text-[11px] text-slate-500 italic py-1">
                          No schedule slots added yet. Click &quot;Add Time Slot&quot; above.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {aff.schedules.map((s, sIdx) => (
                            <div key={s.id || sIdx} className="bg-slate-900 border border-slate-800/80 rounded-xl p-2.5 flex flex-wrap items-center gap-2 text-xs">
                              
                              <div className="flex-1 min-w-[110px]">
                                <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Day</label>
                                <select
                                  value={s.day_of_week}
                                  onChange={e => handleUpdateScheduleSlot(aIdx, sIdx, 'day_of_week', e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white text-[11px]"
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
                                  value={s.start_time}
                                  onChange={e => handleUpdateScheduleSlot(aIdx, sIdx, 'start_time', e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white text-[11px]"
                                />
                              </div>

                              <div className="w-24">
                                <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">End Time</label>
                                <input
                                  type="time"
                                  required
                                  value={s.end_time}
                                  onChange={e => handleUpdateScheduleSlot(aIdx, sIdx, 'end_time', e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white text-[11px]"
                                />
                              </div>

                              <div className="self-end pb-1">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveScheduleSlot(aIdx, sIdx)}
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
                ))}
              </div>
            )}
          </div>

        </form>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 flex-shrink-0">
          <button 
            type="button" 
            onClick={() => setShowDoctorModal(false)} 
            disabled={saving}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="doctor-modal-form"
            disabled={saving}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20 transition flex items-center gap-2 cursor-pointer"
          >
            {saving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{editingDoctor ? 'Update Doctor & Schedules' : 'Save Doctor'}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
