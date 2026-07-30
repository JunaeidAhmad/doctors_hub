import React, { useEffect, useState } from 'react';
import {
  Heart, Brain, User, Activity, Sparkles, Baby, Stethoscope, Flame, Ear, ShieldAlert, Wind, Droplet
} from 'lucide-react';
import { SPECIALTIES as MOCK_SPECIALTIES } from '../data/mockData';
import { api } from '../services/api';

const iconMap = {
  Heart: Heart,
  Brain: Brain,
  User: User,
  Activity: Activity,
  Sparkles: Sparkles,
  Baby: Baby,
  Stethoscope: Stethoscope,
  Flame: Flame,
  Ear: Ear,
  ShieldAlert: ShieldAlert,
  Wind: Wind,
  Droplet: Droplet
};

export default function SpecialtyGrid({ selectedSpecialty, setSelectedSpecialty, onSelectSpecialty }) {
  const [specialties, setSpecialties] = useState(MOCK_SPECIALTIES);

  useEffect(() => {
    let isMounted = true;
    api.getSpecialties()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setSpecialties(data);
        }
      })
      .catch((err) => {
        console.warn("Using mock specialties fallback", err);
      });
    return () => { isMounted = false; };
  }, []);

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
            Choose a clinical discipline to filter visiting doctors in your region.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {specialties.map((spec) => {
            const IconComponent = iconMap[spec.icon] || Stethoscope;
            const isSelected = selectedSpecialty === spec.name;

            return (
              <div
                key={spec.id}
                onClick={() => {
                  setSelectedSpecialty(isSelected ? '' : spec.name);
                  onSelectSpecialty(spec.name);
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 text-center flex flex-col items-center justify-between ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/30 scale-[1.03]'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-400 hover:shadow-md'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  <IconComponent className="w-6 h-6" />
                </div>

                <div>
                  <h4 className="font-bold text-sm leading-tight mb-1">
                    {spec.name}
                  </h4>
                  <p className={`text-[11px] ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {spec.description}
                  </p>
                </div>

                <div className={`mt-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isSelected ? 'bg-white text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {spec.count || 'Active'} Doctors
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
