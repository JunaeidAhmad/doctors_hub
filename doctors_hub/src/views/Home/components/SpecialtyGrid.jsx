import React, { useEffect, useState } from 'react';
import {
  Heart, Brain, User, Activity, Sparkles, Baby, Stethoscope, Flame, Ear, ShieldAlert, Wind, Droplet,
  Building2, FlaskConical, Award, ShieldCheck, FileText
} from 'lucide-react';
import { api, ensureArray } from '../../../services/api';

const iconMap = {
  Heart,
  Brain,
  User,
  Activity,
  Sparkles,
  Baby,
  Stethoscope,
  Flame,
  Ear,
  ShieldAlert,
  Wind,
  Droplet,
  Building2,
  FlaskConical,
  Award,
  ShieldCheck,
  FileText
};

const FALLBACK_SPECIALTIES = [
  { id: 'spec-1', name: 'Cardiology', slug: 'cardiology', icon: 'Heart', description: 'Heart & cardiovascular care', count: 120 },
  { id: 'spec-2', name: 'Neurology', slug: 'neurology', icon: 'Brain', description: 'Brain, spine & nerve disorders', count: 85 },
  { id: 'spec-3', name: 'Gynecology & Obstetrics', slug: 'gynecology-obstetrics', icon: 'User', description: "Women's reproductive & maternity care", count: 140 },
  { id: 'spec-4', name: 'Pediatrics', slug: 'pediatrics', icon: 'Baby', description: 'Child healthcare & developmental wellness', count: 95 },
  { id: 'spec-5', name: 'Orthopedics', slug: 'orthopedics', icon: 'Activity', description: 'Bones, joints, spine & trauma surgeries', count: 110 },
  { id: 'spec-6', name: 'Dermatology', slug: 'dermatology', icon: 'Sparkles', description: 'Skin, hair, cosmetic & allergy treatment', count: 75 },
  { id: 'spec-7', name: 'Medicine & General Physician', slug: 'medicine-general-physician', icon: 'Stethoscope', description: 'Primary care, diabetes, fever & diagnostics', count: 210 },
  { id: 'spec-8', name: 'Gastroenterology', slug: 'gastroenterology', icon: 'Flame', description: 'Stomach, liver, digestive & endoscopy care', count: 60 },
  { id: 'spec-9', name: 'ENT (Ear, Nose, Throat)', slug: 'ent', icon: 'Ear', description: 'Otolaryngology & head-neck treatments', count: 80 },
  { id: 'spec-10', name: 'Urology', slug: 'urology', icon: 'ShieldAlert', description: 'Kidney, bladder & urinary tract care', count: 55 },
  { id: 'spec-11', name: 'Pulmonology / Chest', slug: 'pulmonology', icon: 'Wind', description: 'Lungs, asthma & respiratory care', count: 65 },
  { id: 'spec-12', name: 'Nephrology', slug: 'nephrology', icon: 'Droplet', description: 'Kidney care, dialysis & renal wellness', count: 50 },
];

export default function SpecialtyGrid({ selectedSpecialty, setSelectedSpecialty, onSelectSpecialty }) {
  const [specialties, setSpecialties] = useState([]);

  useEffect(() => {
    let isMounted = true;
    api.getSpecialties()
      .then((data) => {
        if (isMounted && data) {
          const list = ensureArray(data);
          const filtered = list.filter((s) => s && s.id !== 'all' && s.name !== 'All Specialties');
          if (filtered.length > 0) {
            setSpecialties(filtered);
          } else if (list.length > 0) {
            setSpecialties(list);
          }
        }
      })
      .catch((err) => {
        console.warn("Using mock specialties fallback", err);
      });
    return () => { isMounted = false; };
  }, []);

  const displayList = specialties.length > 0 ? specialties : FALLBACK_SPECIALTIES;

  return (
    <section className="py-14 px-4 sm:px-8 bg-slate-100/70 border-t border-slate-200">
      <div className="max-w-7xl mx-auto">
        
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
            Specialist Categories
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            Consult Top Specialists
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Choose a clinical discipline to filter doctors in your region.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {displayList.map((spec) => {
            const IconComponent = iconMap[spec.icon] || iconMap[spec.slug] || Stethoscope;
            const isSelected = selectedSpecialty === spec.name || selectedSpecialty === spec.slug;

            return (
              <div
                key={spec.id || spec.slug || spec.name}
                onClick={() => {
                  if (setSelectedSpecialty) {
                    setSelectedSpecialty(isSelected ? '' : spec.name);
                  }
                  if (onSelectSpecialty) {
                    onSelectSpecialty(spec.name || spec.slug);
                  }
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 text-center flex flex-col items-center justify-between group ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/30 scale-[1.03]'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'
                }`}>
                  <IconComponent className="w-6 h-6" />
                </div>

                <div>
                  <h4 className={`font-bold text-sm leading-tight mb-1 ${isSelected ? 'text-white' : 'text-slate-900 group-hover:text-emerald-700'}`}>
                    {spec.name}
                  </h4>
                  <p className={`text-[11px] line-clamp-2 ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {spec.description || `Consult top ${spec.name} doctors`}
                  </p>
                </div>

                {spec.count !== undefined && spec.count !== null && (
                  <div className={`mt-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isSelected ? 'bg-white text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {spec.count} Doctors
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
