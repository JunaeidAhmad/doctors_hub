import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Stethoscope, Building2, DollarSign, Clock, 
  Plus, Trash2, AlertCircle, Save, Sparkles, User,
  Camera, Star, ShieldCheck, Users, Timer
} from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';
import { api } from '../../../../services/api';
import FacilityPicker from '../../../../components/FacilityPicker';

const DAYS_OF_WEEK = [
  'Saturday', 'Sunday', 'Monday', 'Tuesday', 
  'Wednesday', 'Thursday', 'Friday'
];

const GENDER_CHOICES = ['Male', 'Female', 'Other'];
const STATUS_CHOICES = ['Active', 'Inactive', 'On Leave', 'Retired'];
const CHAMBER_TYPES = ['Primary Chamber', 'Visiting Chamber', 'Consultation Room', 'Evening Chamber'];

const PRESET_TIMETABLES = [
  { label: 'Morning (09:00 - 13:00)', start_time: '09:00', end_time: '13:00', max_patients: 25, avg_consult_minutes: 10 },
  { label: 'Afternoon (14:00 - 17:00)', start_time: '14:00', end_time: '17:00', max_patients: 20, avg_consult_minutes: 10 },
  { label: 'Evening (17:00 - 21:00)', start_time: '17:00', end_time: '21:00', max_patients: 30, avg_consult_minutes: 10 },
  { label: 'Night (19:00 - 22:00)', start_time: '19:00', end_time: '22:00', max_patients: 20, avg_consult_minutes: 10 },
];

function calculateSlotDuration(startTime, endTime) {
  if (!startTime || !endTime) return '';
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return '';
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  const diff = endMins - startMins;
  if (diff <= 0) return 'Invalid range';
  const hrs = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m session`;
  if (hrs > 0) return `${hrs}h session`;
  return `${mins}m session`;
}

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
  const [bnName, setBnName] = useState('');
  const [gender, setGender] = useState('Male');
  const [academicTitle, setAcademicTitle] = useState('');
  const [institution, setInstitution] = useState('');
  const [bmdcNumber, setBmdcNumber] = useState('');
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('10+ Yrs Exp.');
  const [about, setAbout] = useState('');
  const [clinicalServices, setClinicalServices] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);
  const [specialtySource, setSpecialtySource] = useState('');
  const [specialtySourceBn, setSpecialtySourceBn] = useState('');
  const [primarySpecialtyId, setPrimarySpecialtyId] = useState('');
  const [specialtySearchQuery, setSpecialtySearchQuery] = useState('');
  const [isVerified, setIsVerified] = useState(true);
  const [status, setStatus] = useState('Active');
  const [rating, setRating] = useState('4.90');
  const [reviewCount, setReviewCount] = useState('120');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

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
      const locId = h.id || h.location_id;
      const label = h.display_name || (h.branch ? `${h.name} (${h.branch})` : h.name);
      if (locId && !list.some(item => String(item.id) === String(locId))) {
        list.push({ id: String(locId), name: label, type: 'Hospital' });
      }
    });
    (diagnosticCenters || []).forEach(dc => {
      const locId = dc.id || dc.location_id;
      const label = dc.display_name || (dc.branch ? `${dc.name} (${dc.branch})` : dc.name);
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
      setBnName(editingDoctor.bn_name || '');
      setGender(editingDoctor.gender || 'Male');
      setAcademicTitle(editingDoctor.academic_title || '');
      setInstitution(editingDoctor.institution || '');
      setBmdcNumber(editingDoctor.bmdc_number || '');
      setQualification(editingDoctor.qualification || '');
      setExperience(editingDoctor.experience || '10+ Yrs Exp.');
      setAbout(editingDoctor.about || editingDoctor.description || '');
      setClinicalServices(editingDoctor.clinical_services || '');
      setIsVerified(editingDoctor.is_verified ?? true);
      setStatus(editingDoctor.status || 'Active');
      setRating(editingDoctor.rating != null ? String(editingDoctor.rating) : '4.90');
      setReviewCount(editingDoctor.review_count != null ? String(editingDoctor.review_count) : '120');
      setImageFile(null);
      setImagePreview(editingDoctor.image || '');

      setSpecialtySource(editingDoctor.specialty_source || '');
      setSpecialtySourceBn(editingDoctor.specialty_source_bn || '');
      const initialPrimary = editingDoctor.primary_specialty?.id || editingDoctor.primary_specialty_id || '';

      const specIds = Array.isArray(editingDoctor.specialties) 
        ? editingDoctor.specialties.map(s => typeof s === 'object' && s !== null ? (s.id || s) : s)
        : [];
      setSelectedSpecialties(specIds);
      setPrimarySpecialtyId(initialPrimary || specIds[0] || '');

      const allLocationIds = new Set(allLocations.map(l => String(l.id)));
      const managedAffiliations = (editingDoctor.affiliations || []).filter(a => {
        const locId = a.facility?.id || a.location_id || a.location || a.hospital?.id || a.diagnostic_center?.id || '';
        return allLocationIds.has(String(locId));
      });

      const affList = managedAffiliations.length > 0
        ? managedAffiliations.map(a => {
            const locId = a.facility?.id || a.location_id || a.location || a.hospital?.id || a.diagnostic_center?.id || '';
            const schedules = Array.isArray(a.schedules) ? a.schedules.map(s => ({
              id: s.id,
              day_of_week: s.day_of_week || 'Saturday',
              start_time: s.start_time ? s.start_time.slice(0, 5) : '17:00',
              end_time: s.end_time ? s.end_time.slice(0, 5) : '21:00',
              max_patients: s.max_patients != null ? s.max_patients : 30,
              avg_consult_minutes: s.avg_consult_minutes != null ? s.avg_consult_minutes : 10
            })) : [];

            return {
              id: a.id,
              location_id: String(locId),
              chamber_type: a.chamber_type || 'Primary Chamber',
              advance_booking_days: a.advance_booking_days || 14,
              fee: a.fee != null ? String(a.fee) : '',
              schedules: schedules.length > 0 ? schedules : [
                {
                  id: `temp-sched-${Date.now()}`,
                  day_of_week: 'Saturday',
                  start_time: '17:00',
                  end_time: '21:00',
                  max_patients: 30,
                  avg_consult_minutes: 10
                }
              ]
            };
          })
        : [
            {
              id: `temp-aff-${Date.now()}`,
              location_id: '',
              chamber_type: 'Primary Chamber',
              advance_booking_days: 14,
              fee: '',
              schedules: [
                {
                  id: `temp-sched-${Date.now()}`,
                  day_of_week: 'Saturday',
                  start_time: '17:00',
                  end_time: '21:00',
                  max_patients: 30,
                  avg_consult_minutes: 10
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
      setBnName('');
      setGender('Male');
      setAcademicTitle('');
      setInstitution('');
      setBmdcNumber('');
      setQualification('MBBS, FCPS (Medicine)');
      setExperience('10+ Yrs Exp.');
      setAbout('');
      setClinicalServices('');
      setIsVerified(true);
      setStatus('Active');
      setRating('4.90');
      setReviewCount('120');
      setImageFile(null);
      setImagePreview('');
      setSpecialtySource('');
      setSelectedSpecialties([]);
      setPrimarySpecialtyId('');
      setSpecialtySearchQuery('');
      setAffiliations([
        {
          id: `temp-aff-${Date.now()}`,
          location_id: '',
          chamber_type: 'Primary Chamber',
          advance_booking_days: 14,
          fee: '',
          schedules: [
            {
              id: `temp-sched-${Date.now()}`,
              day_of_week: 'Saturday',
              start_time: '17:00',
              end_time: '21:00',
              max_patients: 30,
              avg_consult_minutes: 10
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
    setSelectedSpecialties(prev => {
      const exists = prev.includes(specId);
      const next = exists ? prev.filter(id => id !== specId) : [...prev, specId];
      if (exists && primarySpecialtyId === specId) {
        setPrimarySpecialtyId(next[0] || '');
      } else if (!exists && next.length === 1) {
        setPrimarySpecialtyId(specId);
      }
      return next;
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const handleAddChamber = () => {
    const defaultLoc = '';
    setAffiliations(prev => [
      ...prev,
      {
        id: `temp-aff-${Date.now()}-${Math.random()}`,
        location_id: defaultLoc,
        chamber_type: 'Primary Chamber',
        advance_booking_days: 14,
        fee: '',
        schedules: [
          {
            id: `temp-sched-${Date.now()}-${Math.random()}`,
            day_of_week: 'Saturday',
            start_time: '17:00',
            end_time: '21:00',
            max_patients: 30,
            avg_consult_minutes: 10
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

  const handleAddScheduleSlot = (affIndex, preset = null) => {
    setAffiliations(prev => prev.map((aff, idx) => {
      if (idx !== affIndex) return aff;
      return {
        ...aff,
        schedules: [
          ...aff.schedules,
          {
            id: `temp-sched-${Date.now()}-${Math.random()}`,
            day_of_week: 'Saturday',
            start_time: preset ? preset.start_time : '17:00',
            end_time: preset ? preset.end_time : '21:00',
            max_patients: preset ? preset.max_patients : 30,
            avg_consult_minutes: preset ? preset.avg_consult_minutes : 10
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

    // Validate chamber location and fee
    for (let i = 0; i < affiliations.length; i++) {
      const aff = affiliations[i];
      if (!aff.location_id) {
        setErrorMsg(`Chamber ${i + 1}: Please select a facility.`);
        return;
      }
      const feeVal = parseFloat(aff.fee);
      if (!feeVal || feeVal <= 0) {
        setErrorMsg(`Chamber ${i + 1}: Fee must be greater than 0.`);
        return;
      }
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
      let docPayload;
      if (imageFile) {
        const fd = new FormData();
        fd.append('name', name.trim());
        if (bnName.trim()) fd.append('bn_name', bnName.trim());
        if (bmdcNumber.trim()) fd.append('bmdc_number', bmdcNumber.trim());
        if (academicTitle.trim()) fd.append('academic_title', academicTitle.trim());
        if (institution.trim()) fd.append('institution', institution.trim());
        fd.append('qualification', qualification.trim());
        if (experience.trim()) fd.append('experience', experience.trim());
        if (about.trim()) fd.append('about', about.trim());
        if (clinicalServices.trim()) fd.append('clinical_services', clinicalServices.trim());
        fd.append('gender', gender);
        fd.append('status', status);
        fd.append('is_verified', isVerified ? 'true' : 'false');
        fd.append('rating', parseFloat(rating) || 4.90);
        fd.append('review_count', parseInt(reviewCount, 10) || 120);
        if (specialtySource.trim()) fd.append('specialty_source', specialtySource.trim());
        if (specialtySourceBn.trim()) fd.append('specialty_source_bn', specialtySourceBn.trim());
        const primaryToSave = primarySpecialtyId || (selectedSpecialties[0] || '');
        if (primaryToSave) fd.append('primary_specialty_id', primaryToSave);
        selectedSpecialties.forEach(id => fd.append('specialty_ids', id));
        fd.append('image', imageFile);
        docPayload = fd;
      } else {
        const primaryToSave = primarySpecialtyId || (selectedSpecialties[0] || null);
        docPayload = {
          name: name.trim(),
          bn_name: bnName.trim(),
          academic_title: academicTitle.trim(),
          institution: institution.trim(),
          qualification: qualification.trim(),
          experience: experience.trim(),
          about: about.trim(),
          clinical_services: clinicalServices.trim(),
          bmdc_number: bmdcNumber.trim() || undefined,
          specialty_source: specialtySource.trim(),
          specialty_source_bn: specialtySourceBn.trim(),
          primary_specialty_id: primaryToSave,
          gender,
          status,
          is_verified: isVerified,
          rating: parseFloat(rating) || 4.90,
          review_count: parseInt(reviewCount, 10) || 120,
          specialty_ids: selectedSpecialties
        };
      }

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

      // Sync all chambers atomically via PUT /api/doctors/{id}/chambers/
      const chambersPayload = affiliations
        .filter(a => {
          const locId = a.location_id;
          return locId && !String(locId).startsWith('temp-');
        })
        .map(a => {
          const chamber = {
            location_id: a.location_id,
            fee: parseFloat(a.fee),
            chamber_type: a.chamber_type || 'Primary Chamber',
            advance_booking_days: parseInt(a.advance_booking_days || 14, 10),
            schedules: (a.schedules || []).map(s => ({
              day_of_week: s.day_of_week || 'Monday',
              start_time: s.start_time?.length === 5 ? `${s.start_time}:00` : (s.start_time || '09:00:00'),
              end_time: s.end_time?.length === 5 ? `${s.end_time}:00` : (s.end_time || '13:00:00'),
              max_patients: parseInt(s.max_patients || 30, 10),
              avg_consult_minutes: parseInt(s.avg_consult_minutes || 10, 10),
            })),
          };
          if (a.id && !String(a.id).startsWith('temp-')) {
            chamber.id = a.id;
            chamber.schedules = (a.schedules || []).map(s => {
              const sched = {
                day_of_week: s.day_of_week || 'Monday',
                start_time: s.start_time?.length === 5 ? `${s.start_time}:00` : (s.start_time || '09:00:00'),
                end_time: s.end_time?.length === 5 ? `${s.end_time}:00` : (s.end_time || '13:00:00'),
                max_patients: parseInt(s.max_patients || 30, 10),
                avg_consult_minutes: parseInt(s.avg_consult_minutes || 10, 10),
              };
              if (s.id && !String(s.id).startsWith('temp-')) {
                sched.id = s.id;
              }
              return sched;
            });
          }
          return chamber;
        });

      const syncResult = await api.syncDoctorChambers(doctorId, chambersPayload);

      const deactivated = syncResult?.deactivated || [];
      const deleted = syncResult?.deleted || [];
      let msg = editingDoctor ? `Dr. ${name} updated!` : `Dr. ${name} added successfully!`;
      if (deactivated.length > 0) msg += ` ${deactivated.length} chamber(s) deactivated (has bookings).`;
      if (deleted.length > 0) msg += ` ${deleted.length} chamber(s) deleted.`;
      showNotification(msg);
      setShowDoctorModal(false);
      await loadAllData();
    } catch (err) {
      setErrorMsg(err.message || 'Error saving doctor details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-[#d1d5dc] rounded-sm p-4 sm:p-6 max-w-3xl w-full space-y-4 sm:space-y-5 my-2 sm:my-8 shadow-xl max-h-[94vh] sm:max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#e3e5ea] pb-3 sm:pb-4 flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 rounded-sm bg-[#e7ebff] border border-[#cbd5e1] text-[#094cb2] flex items-center justify-center shrink-0">
              <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-slate-900 leading-tight">
                {editingDoctor ? `Edit Doctor: Dr. ${editingDoctor.name}` : 'Add New Specialist Doctor'}
              </h3>
              <p className="text-[11px] sm:text-xs font-body text-slate-500 mt-0.5">
                {editingDoctor 
                  ? 'Update doctor credentials, consultation fees, chambers, and visiting schedules.' 
                  : 'Register a specialist doctor with chambers, consultation fees, and visiting hours.'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setShowDoctorModal(false)} 
            className="p-1 text-slate-400 hover:text-slate-700 rounded-sm transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 sm:p-3.5 rounded-sm text-xs font-semibold flex items-center gap-2 flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Scrollable Form Content */}
        <form onSubmit={handleSaveDoctor} id="doctor-modal-form" className="space-y-4 sm:space-y-6 text-xs font-body overflow-y-auto pr-1 flex-1">
          
          {/* SECTION 1: Doctor Credentials */}
          <div className="bg-[#f7f6f7] border border-[#d1d5dc] rounded-sm p-3.5 sm:p-4 space-y-4">
            <h4 className="text-xs font-serif font-bold text-slate-900 flex items-center gap-2 border-b border-[#e3e5ea] pb-2">
              <User className="w-4 h-4 text-[#094cb2]" />
              <span>Doctor Personal &amp; Professional Credentials</span>
            </h4>

            {/* Row 1: Name, Bangla Name, Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="sm:col-span-1">
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Full Name (English) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. M. A. Karim"
                  value={name}
                  disabled={!isSuperAdmin}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-[#094cb2] transition"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">
                  নাম (বাংলা) <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. মোঃ এ. করিম"
                  value={bnName}
                  disabled={!isSuperAdmin}
                  onChange={e => setBnName(e.target.value)}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-900 font-serif focus:outline-none focus:border-[#094cb2] transition"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Gender</label>
                <select
                  value={gender}
                  disabled={!isSuperAdmin}
                  onChange={e => setGender(e.target.value)}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 focus:outline-none focus:border-[#094cb2] transition cursor-pointer"
                >
                  {GENDER_CHOICES.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: BMDC & Academic Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">BMDC Registration No.</label>
                <input
                  type="text"
                  placeholder="e.g. A-12345"
                  value={bmdcNumber}
                  disabled={!isSuperAdmin}
                  onChange={e => setBmdcNumber(e.target.value)}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-[#094cb2] transition"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Academic Title / Seniority</label>
                <input
                  type="text"
                  placeholder="e.g. Professor, Associate Professor, Consultant"
                  value={academicTitle}
                  disabled={!isSuperAdmin}
                  onChange={e => setAcademicTitle(e.target.value)}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-900 focus:outline-none focus:border-[#094cb2] transition"
                />
              </div>
            </div>

            {/* Row 3: Qualifications & Experience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Qualifications &amp; Degrees *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MBBS, FCPS (Cardiology), FACC"
                  value={qualification}
                  disabled={!isSuperAdmin}
                  onChange={e => setQualification(e.target.value)}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-900 focus:outline-none focus:border-[#094cb2] transition"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Experience</label>
                <input
                  type="text"
                  placeholder="e.g. 15+ Yrs Exp."
                  value={experience}
                  disabled={!isSuperAdmin}
                  onChange={e => setExperience(e.target.value)}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-900 focus:outline-none focus:border-[#094cb2] transition"
                />
              </div>
            </div>

            {/* Row 4: Institution */}
            <div>
              <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Medical Institution / Hospital</label>
              <input
                type="text"
                placeholder="e.g. Dhaka Medical College & Hospital"
                value={institution}
                disabled={!isSuperAdmin}
                onChange={e => setInstitution(e.target.value)}
                className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-900 focus:outline-none focus:border-[#094cb2] transition"
              />
            </div>

            {/* Row 5: Profile Image Upload & Preview */}
            <div className="p-3 bg-white border border-[#d1d5dc] rounded-sm">
              <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1.5 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#094cb2]" />
                <span>Doctor Profile Photo</span>
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                {imagePreview ? (
                  <div className="relative w-16 h-16 rounded-sm overflow-hidden border border-[#d1d5dc] bg-[#f7f6f7] shrink-0">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    {isSuperAdmin && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-0.5 right-0.5 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition cursor-pointer"
                        title="Remove photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-sm border border-dashed border-[#d1d5dc] flex flex-col items-center justify-center text-slate-400 shrink-0 bg-[#f7f6f7]">
                    <Camera className="w-5 h-5 mb-0.5" />
                    <span className="text-[9px]">No image</span>
                  </div>
                )}
                <div className="flex-1 w-full">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={!isSuperAdmin}
                    onChange={handleImageChange}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-1 file:px-2.5 file:rounded-sm file:border file:border-[#cbd5e1] file:text-[#094cb2] file:bg-[#e7ebff] file:font-label file:text-[11px] file:font-semibold file:uppercase hover:file:bg-[#d9e2ff] file:cursor-pointer transition"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Supports JPG, PNG, WEBP. Professional clinical portrait recommended.</p>
                </div>
              </div>
            </div>

            {/* Row 6: Status, Verification, Rating & Reviews */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Status</label>
                <select
                  value={status}
                  disabled={!isSuperAdmin}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-2.5 py-2 text-slate-800 text-xs focus:outline-none focus:border-[#094cb2] transition cursor-pointer"
                >
                  {STATUS_CHOICES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Verification</label>
                <button
                  type="button"
                  disabled={!isSuperAdmin}
                  onClick={() => setIsVerified(!isVerified)}
                  className={`w-full py-2 px-2.5 rounded-sm border text-xs font-label uppercase font-bold tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    isVerified 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-white text-slate-500 border-[#d1d5dc] hover:border-slate-400'
                  }`}
                >
                  <ShieldCheck className={`w-3.5 h-3.5 ${isVerified ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{isVerified ? 'Verified' : 'Unverified'}</span>
                </button>
              </div>

              <div>
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1 flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-500" />
                  <span>Rating</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.05"
                  placeholder="4.90"
                  value={rating}
                  disabled={!isSuperAdmin}
                  onChange={e => setRating(e.target.value)}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-2.5 py-2 text-slate-800 focus:outline-none focus:border-[#094cb2] transition text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Review Count</label>
                <input
                  type="number"
                  min="0"
                  placeholder="120"
                  value={reviewCount}
                  disabled={!isSuperAdmin}
                  onChange={e => setReviewCount(e.target.value)}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-2.5 py-2 text-slate-800 focus:outline-none focus:border-[#094cb2] transition text-xs font-mono"
                />
              </div>
            </div>

            {/* Row 7 & 8: Biography & Clinical Services */}
            <div className="space-y-4 pt-2 border-t border-[#e3e5ea]">
              <div>
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">About Doctor (Biography)</label>
                <textarea
                  rows={3}
                  placeholder="Professional biography, clinical leadership, specializations, and patient care philosophy..."
                  value={about}
                  disabled={!isSuperAdmin}
                  onChange={e => setAbout(e.target.value)}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 focus:outline-none focus:border-[#094cb2] transition resize-y font-body"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Clinical Services Offered</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Coronary Angiography (CAG), Angioplasty (PTCA), Pacemaker Implantation, Hypertension Management, Echocardiography"
                  value={clinicalServices}
                  disabled={!isSuperAdmin}
                  onChange={e => setClinicalServices(e.target.value)}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 focus:outline-none focus:border-[#094cb2] transition resize-y font-body"
                />
                <p className="text-[11px] text-slate-400 mt-1">Separate distinct clinical procedures or services by comma or new lines.</p>
              </div>
            </div>
          </div>

          {/* SECTION 2: Specialties & Taxonomy Focus */}
          <div className="bg-[#f7f6f7] border border-[#d1d5dc] rounded-sm p-3.5 sm:p-4 space-y-4">
            <h4 className="text-xs font-serif font-bold text-slate-900 flex items-center gap-2 border-b border-[#e3e5ea] pb-2">
              <Sparkles className="w-4 h-4 text-[#094cb2]" />
              <span>Specializations &amp; Practice Focus</span>
            </h4>

            {/* 1. Verbatim Visiting Card / Prescription Text */}
            <div className="space-y-3 bg-white border border-[#d1d5dc] rounded-sm p-3">
              <div>
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">
                  Visiting Card / Brochure Specialty (Verbatim English)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Breast Health & Breast Surgery / Oncology&#10;Weight Management & Dietetics"
                  value={specialtySource}
                  disabled={!isSuperAdmin}
                  onChange={e => setSpecialtySource(e.target.value)}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 focus:outline-none focus:border-[#094cb2] transition resize-y font-body text-xs"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Exact text as printed on the doctor's visiting card, prescription pad, or brochure. Displayed prominently on doctor card.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">
                  Visiting Card Specialty (বাংলা প্রেসক্রিপশন / কার্ডের টেক্সট)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ব্রেস্ট সার্জন · ক্যান্সার বিশেষজ্ঞ · পুষ্টিবিদ"
                  value={specialtySourceBn}
                  disabled={!isSuperAdmin}
                  onChange={e => setSpecialtySourceBn(e.target.value)}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 focus:outline-none focus:border-[#094cb2] transition font-serif text-xs"
                />
              </div>
            </div>

            {/* 2. Canonical Taxonomy Selector */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px]">
                  Taxonomy Indexing Tags * ({selectedSpecialties.length} Selected)
                </label>
                <input
                  type="text"
                  value={specialtySearchQuery}
                  onChange={e => setSpecialtySearchQuery(e.target.value)}
                  placeholder="Filter specialties..."
                  className="bg-white border border-[#d1d5dc] rounded-sm px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:border-[#094cb2] w-full sm:w-52"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Select 1 to 5 canonical leaf specialties used for search matching and department categorization:
              </p>

              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-white border border-[#d1d5dc] rounded-sm">
                {doctorSpecialties
                  .filter(spec => {
                    if (!specialtySearchQuery.trim()) return true;
                    const q = specialtySearchQuery.toLowerCase();
                    return (
                      (spec.name || '').toLowerCase().includes(q) ||
                      (spec.bn_name || '').toLowerCase().includes(q) ||
                      (spec.slug || '').toLowerCase().includes(q)
                    );
                  })
                  .map(spec => {
                    const isSelected = selectedSpecialties.includes(spec.id);
                    return (
                      <button
                        key={spec.id}
                        type="button"
                        onClick={() => isSuperAdmin && toggleSpecialty(spec.id)}
                        disabled={!isSuperAdmin}
                        className={`px-2.5 py-1.5 rounded-sm border text-xs font-body transition flex items-center gap-1.5 cursor-pointer ${
                          isSelected 
                            ? 'bg-[#e7ebff] text-[#094cb2] border-[#094cb2] font-bold' 
                            : 'bg-white text-slate-600 border-[#d1d5dc] hover:border-slate-400'
                        }`}
                      >
                        <span>{spec.name}</span>
                        {spec.bn_name && <span className="text-[10px] text-slate-400">({spec.bn_name})</span>}
                        {isSelected && <span className="text-[#094cb2] font-bold">✓</span>}
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* 3. Primary Specialty Radio Selection */}
            {selectedSpecialties.length > 0 && (
              <div className="bg-[#e7ebff]/60 border border-[#094cb2]/30 rounded-sm p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-[#094cb2] font-label font-bold text-xs">
                  <Star className="w-4 h-4 fill-[#094cb2]" />
                  <span>Choose Primary Specialty Focus *</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Select which specialization controls Tier 1 (Rank #1) top placement in patient search results:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedSpecialties.map(specId => {
                    const specObj = doctorSpecialties.find(s => s.id === specId);
                    const isPrimary = primarySpecialtyId === specId;
                    return (
                      <button
                        key={specId}
                        type="button"
                        onClick={() => isSuperAdmin && setPrimarySpecialtyId(specId)}
                        disabled={!isSuperAdmin}
                        className={`px-3 py-1.5 rounded-sm border text-xs font-label transition flex items-center gap-2 cursor-pointer ${
                          isPrimary
                            ? 'bg-[#094cb2] text-white border-[#094cb2] font-bold shadow-xs'
                            : 'bg-white text-slate-700 border-[#cbd5e1] hover:border-[#094cb2]'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${isPrimary ? 'border-white bg-white' : 'border-slate-400'}`}>
                          {isPrimary && <span className="w-1.5 h-1.5 rounded-full bg-[#094cb2]" />}
                        </span>
                        <span>{specObj?.name || 'Specialty'}</span>
                        {isPrimary && <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded text-white font-mono">PRIMARY</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: Chambers, Fees & Visiting Schedules */}
          <div className="bg-[#f7f6f7] border border-[#d1d5dc] rounded-sm p-3.5 sm:p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-[#e3e5ea] pb-2.5">
              <h4 className="text-xs font-serif font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#094cb2]" />
                <span>Practice Chambers, Fees &amp; Visiting Schedules</span>
              </h4>
              <button
                type="button"
                onClick={handleAddChamber}
                className="px-2.5 py-1 bg-[#e7ebff] hover:bg-[#d9e2ff] border border-[#cbd5e1] text-[#094cb2] rounded-sm text-[11px] font-label uppercase font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Chamber</span>
              </button>
            </div>

            {affiliations.length === 0 ? (
              <div className="text-center py-6 text-slate-400 bg-white border border-[#d1d5dc] rounded-sm p-4">
                <Building2 className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                <p className="text-xs">No consultation chambers configured.</p>
                <button
                  type="button"
                  onClick={handleAddChamber}
                  className="mt-2 px-3 py-1.5 bg-[#094cb2] text-white rounded-sm text-xs font-label uppercase font-semibold cursor-pointer"
                >
                  + Add First Chamber
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {affiliations.map((aff, aIdx) => (
                  <div key={aff.id || aIdx} className="bg-white border border-[#d1d5dc] rounded-sm p-3 sm:p-4 space-y-3.5 shadow-xs">
                    
                    {/* Chamber Header */}
                    <div className="flex items-center justify-between border-b border-[#e3e5ea] pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-[#e7ebff] border border-[#cbd5e1] text-[#094cb2] font-label uppercase font-bold text-[10px] rounded-xs">
                          Chamber #{aIdx + 1}
                        </span>
                      </div>
                      {affiliations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveChamber(aIdx)}
                          className="text-rose-600 hover:text-rose-700 p-1 rounded-sm hover:bg-rose-50 transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                          title="Remove this chamber"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove Chamber</span>
                        </button>
                      )}
                    </div>

                    {/* Chamber Facility, Type, Status Label & Fee */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-slate-700 font-label font-bold uppercase text-[10px] mb-1">Facility / Hospital *</label>
                        <FacilityPicker
                          value={aff.location_id}
                          onChange={(val) => handleUpdateChamberField(aIdx, 'location_id', val)}
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-label font-bold uppercase text-[10px] mb-1">Chamber Type</label>
                        <select
                          value={aff.chamber_type || 'Primary Chamber'}
                          onChange={e => handleUpdateChamberField(aIdx, 'chamber_type', e.target.value)}
                          className="w-full bg-white border border-[#d1d5dc] rounded-sm px-2.5 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-[#094cb2] transition cursor-pointer"
                        >
                          {CHAMBER_TYPES.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-label font-bold uppercase text-[10px] mb-1">Advance Booking (Days)</label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={aff.advance_booking_days || 14}
                          onChange={e => handleUpdateChamberField(aIdx, 'advance_booking_days', e.target.value)}
                          className="w-full bg-white border border-[#d1d5dc] rounded-sm px-2.5 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-[#094cb2] transition"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-label font-bold uppercase text-[10px] mb-1 flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-[#094cb2]" />
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
                          className="w-full bg-white border border-[#d1d5dc] rounded-sm px-2.5 py-1.5 text-[#094cb2] font-serif font-bold text-xs focus:outline-none focus:border-[#094cb2] transition"
                        />
                      </div>
                    </div>

                    {/* Visiting Schedules & Slot Booking */}
                    <div className="bg-[#f7f6f7] border border-[#d1d5dc] rounded-sm p-3.5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e2e8f0] pb-2.5">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-label uppercase font-bold text-slate-800">
                            <Clock className="w-4 h-4 text-[#094cb2]" />
                            <span>Visiting Schedules &amp; Slot Booking</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Manage chamber visiting days, session timings, slot capacity, and consultation pacing.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Quick Presets Menu */}
                          <select
                            onChange={e => {
                              const p = PRESET_TIMETABLES.find(item => item.label === e.target.value);
                              if (p) handleAddScheduleSlot(aIdx, p);
                              e.target.value = '';
                            }}
                            defaultValue=""
                            className="bg-white border border-[#cbd5e1] text-[#094cb2] rounded-sm text-[10px] font-label uppercase font-bold px-2 py-1 cursor-pointer hover:bg-slate-50 transition"
                          >
                            <option value="" disabled>+ Add Preset...</option>
                            {PRESET_TIMETABLES.map(p => (
                              <option key={p.label} value={p.label}>{p.label}</option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => handleAddScheduleSlot(aIdx)}
                            className="px-2.5 py-1 bg-[#094cb2] hover:bg-[#083e91] text-white rounded-sm text-[10px] font-label uppercase font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Slot</span>
                          </button>
                        </div>
                      </div>

                      {aff.schedules.length === 0 ? (
                        <div className="text-[11px] text-slate-400 italic py-2 text-center bg-white border border-dashed border-[#d1d5dc] rounded-sm">
                          No schedule slots configured for this chamber. Click &quot;Add Slot&quot; or select a preset above.
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {aff.schedules.map((s, sIdx) => {
                            const durationText = calculateSlotDuration(s.start_time, s.end_time);

                            return (
                              <div 
                                key={s.id || sIdx} 
                                className="bg-white border border-[#d1d5dc] rounded-sm p-3 space-y-2 shadow-2xs hover:border-[#094cb2]/50 transition"
                              >
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end text-xs">
                                  
                                  {/* Day Selector */}
                                  <div className="sm:col-span-3">
                                    <label className="block text-[10px] text-slate-600 font-label font-bold uppercase mb-1">
                                      Visiting Day
                                    </label>
                                    <select
                                      value={s.day_of_week}
                                      onChange={e => handleUpdateScheduleSlot(aIdx, sIdx, 'day_of_week', e.target.value)}
                                      className="w-full bg-white border border-[#d1d5dc] rounded-sm px-2 py-1 text-slate-800 text-xs font-medium focus:outline-none focus:border-[#094cb2]"
                                    >
                                      {DAYS_OF_WEEK.map(day => (
                                        <option key={day} value={day}>{day}</option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Start Time */}
                                  <div className="sm:col-span-2">
                                    <label className="block text-[10px] text-slate-600 font-label font-bold uppercase mb-1">
                                      Start Time
                                    </label>
                                    <input
                                      type="time"
                                      required
                                      value={s.start_time}
                                      onChange={e => handleUpdateScheduleSlot(aIdx, sIdx, 'start_time', e.target.value)}
                                      className="w-full bg-white border border-[#d1d5dc] rounded-sm px-2 py-1 text-slate-800 text-xs focus:outline-none focus:border-[#094cb2]"
                                    />
                                  </div>

                                  {/* End Time */}
                                  <div className="sm:col-span-2">
                                    <label className="block text-[10px] text-slate-600 font-label font-bold uppercase mb-1">
                                      End Time
                                    </label>
                                    <input
                                      type="time"
                                      required
                                      value={s.end_time}
                                      onChange={e => handleUpdateScheduleSlot(aIdx, sIdx, 'end_time', e.target.value)}
                                      className="w-full bg-white border border-[#d1d5dc] rounded-sm px-2 py-1 text-slate-800 text-xs focus:outline-none focus:border-[#094cb2]"
                                    />
                                  </div>

                                  {/* Max Patients / Slot Capacity */}
                                  <div className="sm:col-span-2">
                                    <label className="block text-[10px] text-slate-600 font-label font-bold uppercase mb-1 flex items-center gap-1">
                                      <Users className="w-2.5 h-2.5 text-[#094cb2]" />
                                      <span>Max Slots</span>
                                    </label>
                                    <input
                                      type="number"
                                      required
                                      min="1"
                                      max="150"
                                      value={s.max_patients ?? 30}
                                      onChange={e => handleUpdateScheduleSlot(aIdx, sIdx, 'max_patients', parseInt(e.target.value, 10) || 1)}
                                      className="w-full bg-white border border-[#d1d5dc] rounded-sm px-2 py-1 text-slate-800 text-xs focus:outline-none focus:border-[#094cb2]"
                                      title="Maximum number of booking slots available for this session"
                                    />
                                  </div>

                                  {/* Avg Consult Duration */}
                                  <div className="sm:col-span-2">
                                    <label className="block text-[10px] text-slate-600 font-label font-bold uppercase mb-1 flex items-center gap-1">
                                      <Timer className="w-2.5 h-2.5 text-[#094cb2]" />
                                      <span>Avg (Min)</span>
                                    </label>
                                    <input
                                      type="number"
                                      required
                                      min="1"
                                      max="60"
                                      value={s.avg_consult_minutes ?? 10}
                                      onChange={e => handleUpdateScheduleSlot(aIdx, sIdx, 'avg_consult_minutes', parseInt(e.target.value, 10) || 1)}
                                      className="w-full bg-white border border-[#d1d5dc] rounded-sm px-2 py-1 text-slate-800 text-xs focus:outline-none focus:border-[#094cb2]"
                                      title="Average consultation duration in minutes used for serial pacing estimates"
                                    />
                                  </div>

                                  {/* Remove Action */}
                                  <div className="sm:col-span-1 flex items-center justify-end">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveScheduleSlot(aIdx, sIdx)}
                                      className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-sm transition cursor-pointer flex items-center gap-1 text-[11px]"
                                      title="Remove slot"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      <span className="sm:hidden">Delete</span>
                                    </button>
                                  </div>

                                </div>

                                {/* Slot Footer: Duration, Throughput & Presets */}
                                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100 text-[10px]">
                                  <div className="flex items-center gap-2 text-slate-600">
                                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-mono font-medium">
                                      {durationText || 'Custom Duration'}
                                    </span>
                                    <span className="text-slate-400">·</span>
                                    <span className="text-teal-700 font-medium">
                                      Capacity: <strong>{s.max_patients || 30} patients</strong> (@ {s.avg_consult_minutes || 10}m/patient)
                                    </span>
                                  </div>

                                  {/* Quick preset buttons for this row */}
                                  <div className="flex items-center gap-1">
                                    <span className="text-slate-400 uppercase font-semibold text-[9px] mr-1">Presets:</span>
                                    {PRESET_TIMETABLES.map(p => (
                                      <button
                                        key={p.label}
                                        type="button"
                                        onClick={() => {
                                          handleUpdateScheduleSlot(aIdx, sIdx, 'start_time', p.start_time);
                                          handleUpdateScheduleSlot(aIdx, sIdx, 'end_time', p.end_time);
                                          handleUpdateScheduleSlot(aIdx, sIdx, 'max_patients', p.max_patients);
                                          handleUpdateScheduleSlot(aIdx, sIdx, 'avg_consult_minutes', p.avg_consult_minutes);
                                        }}
                                        className="px-1.5 py-0.5 bg-slate-50 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded text-[9px] font-medium transition cursor-pointer"
                                      >
                                        {p.label.split(' ')[0]}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                              </div>
                            );
                          })}
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
        <div className="flex items-center justify-end gap-3 pt-3 sm:pt-4 border-t border-[#e3e5ea] flex-shrink-0">
          <button 
            type="button" 
            onClick={() => setShowDoctorModal(false)} 
            disabled={saving}
            className="px-4 py-2 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 font-label text-xs font-semibold uppercase tracking-wider rounded-sm transition cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="doctor-modal-form"
            disabled={saving}
            className="px-5 py-2 bg-[#094cb2] hover:bg-[#083e91] disabled:opacity-50 text-white font-label text-xs font-semibold uppercase tracking-wider rounded-sm shadow-sm transition flex items-center gap-2 cursor-pointer"
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
