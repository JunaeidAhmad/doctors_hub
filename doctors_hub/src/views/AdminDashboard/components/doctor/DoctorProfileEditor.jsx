import React, { useState, useEffect } from 'react';
import { Stethoscope, CheckCircle, RefreshCw, Save, Sparkles, User, Award, Clock, BookOpen, AlertCircle } from 'lucide-react';
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
      setQualification(doctor.qualification || '');
      setExperience(doctor.experience || '');
      setDescription(doctor.description || '');

      const currentSpecIds = (doctor.specialties || []).map(s => {
        if (typeof s === 'object' && s !== null) return s.id;
        // If it's a string/name, match with doctorSpecialties
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        <Stethoscope className="w-8 h-8 text-teal-400 mx-auto mb-2 animate-pulse" />
        <p>Loading your doctor profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-xl flex items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Doctor Profile Management</span>
          </div>
          <h2 className="text-2xl font-black text-white">Edit Your Specialist Profile</h2>
          <p className="text-xs text-slate-400 mt-1">Keep your professional credentials, medical qualifications, and specializations up to date.</p>
        </div>
      </div>

      {localSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{localSuccess}</span>
        </div>
      )}

      {localErr && (
        <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{localErr}</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSaveProfile} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Full Name & Title */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-slate-300 text-xs font-bold mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-teal-400" />
              <span>Full Name & Title</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Prof. Dr. Harun-Or-Rashid"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-xs font-bold mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>Years of Clinical Experience</span>
            </label>
            <input
              type="text"
              required
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="32 Years Exp."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* Qualifications */}
        <div>
          <label className="block text-slate-300 text-xs font-bold mb-2 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-teal-400" />
            <span>Degrees & Medical Qualifications</span>
          </label>
          <input
            type="text"
            required
            value={qualification}
            onChange={(e) => setQualification(e.target.value)}
            placeholder="MBBS, FCPS (Nephrology), PhD"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* Multi-Select Specialties */}
        <div>
          <label className="block text-slate-300 text-xs font-bold mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
              <span>Select Your Medical Specializations</span>
            </span>
            <span className="text-teal-400 text-[11px] font-normal">
              {selectedSpecialtyIds.length} Selected
            </span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 p-4 rounded-2xl bg-slate-950 border border-slate-800">
            {doctorSpecialties.map((spec) => {
              const isSelected = selectedSpecialtyIds.includes(spec.id);
              return (
                <button
                  type="button"
                  key={spec.id}
                  onClick={() => toggleSpecialty(spec.id)}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                    isSelected 
                      ? 'bg-teal-500/20 border-teal-500/60 text-teal-300 shadow-sm' 
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xs font-semibold">{spec.name}</span>
                  {isSelected && <CheckCircle className="w-4 h-4 text-teal-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bio / Description */}
        <div>
          <label className="block text-slate-300 text-xs font-bold mb-2 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-teal-400" />
            <span>Doctor Bio & Clinical Expertise</span>
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of clinical practice, medical achievements, and patient consultation details..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-teal-500 resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-teal-600/30 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Doctor Profile</span>
          </button>
        </div>

      </form>

    </div>
  );
}
