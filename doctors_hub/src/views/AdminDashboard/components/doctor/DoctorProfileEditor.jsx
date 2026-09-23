import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, CheckCircle, RefreshCw, Save, Sparkles, 
  User, Award, Clock, BookOpen, AlertCircle, ShieldCheck 
} from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';
import { api } from '../../../../services/api';

export default function DoctorProfileEditor() {
  const {
    doctors,
    doctorSpecialties,
    loadAllData,
    setSuccessMsg,
    setError
  } = useAdminContext();

  const doctor = doctors && doctors.length > 0 ? doctors[0] : null;

  const [name, setName] = useState('');
  const [bnName, setBnName] = useState('');
  const [academicTitle, setAcademicTitle] = useState('');
  const [institution, setInstitution] = useState('');
  const [bmdcNumber, setBmdcNumber] = useState('');
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('');
  const [selectedSpecialtyIds, setSelectedSpecialtyIds] = useState([]);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [localSuccess, setLocalSuccess] = useState('');
  const [localErr, setLocalErr] = useState('');

  useEffect(() => {
    if (doctor) {
      setName(doctor.name || '');
      setBnName(doctor.bn_name || '');
      setAcademicTitle(doctor.academic_title || '');
      setInstitution(doctor.institution || '');
      setBmdcNumber(doctor.bmdc_number || '');
      setQualification(doctor.qualification || '');
      setExperience(doctor.experience || '');
      setDescription(doctor.description || '');

      const currentSpecIds = (doctor.specialties || []).map(s => {
        if (typeof s === 'object' && s !== null) return s.id;
        const matched = doctorSpecialties.find(ds => ds.name === s || ds.id === s);
        return matched ? matched.id : s;
      }).filter(Boolean);

      setSelectedSpecialtyIds(currentSpecIds);
    }
  }, [doctor, doctorSpecialties]);

  const toggleSpecialty = (specId) => {
    setSelectedSpecialtyIds(prev => {
      if (prev.includes(specId)) {
        return prev.filter(id => id !== specId);
      } else {
        return [...prev, specId];
      }
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!doctor || !doctor.id) {
      setLocalErr('Doctor profile ID not found.');
      return;
    }

    setSaving(true);
    setLocalSuccess('');
    setLocalErr('');

    try {
      const payload = {
        name: name.trim(),
        bn_name: bnName.trim(),
        academic_title: academicTitle.trim(),
        institution: institution.trim(),
        bmdc_number: bmdcNumber.trim(),
        qualification: qualification.trim(),
        experience: experience.trim(),
        description: description.trim(),
        specialty_ids: selectedSpecialtyIds,
      };

      await api.updateDoctor(doctor.id, payload);
      setLocalSuccess('Doctor profile and specialties updated successfully!');
      if (setSuccessMsg) setSuccessMsg('Profile updated!');
      await loadAllData();
    } catch (err) {
      setLocalErr(err.message || 'Failed to update profile.');
      if (setError) setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!doctor) {
    return (
      <div className="bg-white border border-[#d1d5dc] rounded-sm p-12 text-center text-slate-400">
        <Stethoscope className="w-8 h-8 text-[#094cb2] mx-auto mb-2 animate-pulse" />
        <p className="font-body text-xs">Loading doctor clinical profile credentials...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-[#d1d5dc] rounded-sm p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-label text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm bg-[#e7ebff] text-[#094cb2] border border-[#cbd5e1] tracking-wider">
              Practitioner Registry
            </span>
            <span className="font-label text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-700 border border-emerald-200 tracking-wider">
              BMDC Verified
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
            Edit Specialist Clinical Profile
          </h2>
          <p className="text-xs font-body text-slate-500 mt-1">
            Keep your professional medical credentials, hospital appointments, degrees, and clinical specializations up to date.
          </p>
        </div>
      </div>

      {localSuccess && (
        <div className="p-4 rounded-sm bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{localSuccess}</span>
        </div>
      )}

      {localErr && (
        <div className="p-4 rounded-sm bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{localErr}</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSaveProfile} className="bg-white border border-[#d1d5dc] rounded-sm p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Full Name & Credentials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#094cb2]" />
              <span>Full Name (English) *</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Harun-Or-Rashid"
              className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#094cb2]"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#094cb2]" />
              <span>নাম (বাংলা) <span className="text-slate-400 font-normal lowercase">(optional)</span></span>
            </label>
            <input
              type="text"
              value={bnName}
              onChange={(e) => setBnName(e.target.value)}
              placeholder="হারুন-অর-রশিদ"
              className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#094cb2] font-serif"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1.5 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-[#094cb2]" />
              <span>Academic Title / Seniority</span>
            </label>
            <input
              type="text"
              value={academicTitle}
              onChange={(e) => setAcademicTitle(e.target.value)}
              placeholder="e.g. Professor, Associate Professor, Consultant"
              className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#094cb2]"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#094cb2]" />
              <span>Medical Institution / Hospital</span>
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g. Dhaka Medical College & Hospital"
              className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#094cb2]"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#094cb2]" />
              <span>BMDC Registration Number</span>
            </label>
            <input
              type="text"
              value={bmdcNumber}
              onChange={(e) => setBmdcNumber(e.target.value)}
              placeholder="A-12345"
              className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#094cb2] font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#094cb2]" />
              <span>Years of Clinical Experience</span>
            </label>
            <input
              type="text"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="e.g. 15+ Years Exp."
              className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#094cb2]"
            />
          </div>
        </div>

        {/* Qualifications */}
        <div>
          <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1.5 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-[#094cb2]" />
            <span>Degrees & Medical Qualifications *</span>
          </label>
          <input
            type="text"
            required
            value={qualification}
            onChange={(e) => setQualification(e.target.value)}
            placeholder="MBBS, FCPS (Nephrology), PhD"
            className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#094cb2]"
          />
        </div>

        {/* Multi-Select Specialties */}
        <div>
          <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-[#094cb2]" />
              <span>Select Medical Specializations</span>
            </span>
            <span className="text-[#094cb2] font-mono text-[11px] font-bold">
              {selectedSpecialtyIds.length} Selected
            </span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 p-3.5 rounded-sm bg-[#f7f6f7] border border-[#d1d5dc] max-h-56 overflow-y-auto">
            {doctorSpecialties.map((spec) => {
              const isSelected = selectedSpecialtyIds.includes(spec.id);
              return (
                <button
                  type="button"
                  key={spec.id}
                  onClick={() => toggleSpecialty(spec.id)}
                  className={`p-2.5 rounded-sm border text-left flex items-center justify-between transition cursor-pointer ${
                    isSelected 
                      ? 'bg-[#e7ebff] border-[#094cb2] text-[#094cb2] font-bold' 
                      : 'bg-white border-[#d1d5dc] text-slate-600 hover:border-slate-400'
                  }`}
                >
                  <span className="text-xs font-body">{spec.name}</span>
                  {isSelected && <CheckCircle className="w-3.5 h-3.5 text-[#094cb2] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bio / Description */}
        <div>
          <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1.5 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#094cb2]" />
            <span>Doctor Bio & Clinical Scope</span>
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of clinical practice, medical achievements, and patient consultation details..."
            className="w-full bg-white border border-[#d1d5dc] rounded-sm p-3.5 text-xs text-slate-800 focus:outline-none focus:border-[#094cb2] resize-y font-body"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t border-[#e3e5ea]">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#094cb2] hover:bg-[#083e91] text-white font-label text-xs font-semibold uppercase tracking-wider rounded-sm shadow-sm flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Doctor Profile</span>
          </button>
        </div>

      </form>

    </div>
  );
}
