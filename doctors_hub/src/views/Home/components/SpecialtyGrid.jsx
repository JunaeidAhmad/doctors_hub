import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Brain, 
  User, 
  Baby, 
  Activity, 
  Sparkles, 
  Stethoscope, 
  Flame, 
  Ear, 
  ShieldAlert, 
  Wind, 
  Droplet, 
  Eye, 
  Smile, 
  Scissors, 
  ShieldCheck, 
  Syringe, 
  ChevronDown,
  Pill,
  Bone
} from 'lucide-react';
import { api, ensureArray } from '../../../services/api';

const iconMap = {
  Heart,
  Brain,
  User,
  Baby,
  Activity,
  Sparkles,
  Stethoscope,
  Flame,
  Ear,
  ShieldAlert,
  Wind,
  Droplet,
  Eye,
  Smile,
  Scissors,
  ShieldCheck,
  Syringe,
  Pill,
  Bone,
};

export default function SpecialtyGrid({ selectedSpecialty, setSelectedSpecialty, onSelectSpecialty }) {
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const fetchSpecialties = () => {
    setLoading(true);
    setError(null);
    api.getSpecialties()
      .then((data) => {
        const list = ensureArray(data);
        const filtered = list.filter((s) => s && s.id !== 'all');
        setSpecialties(filtered);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Failed to load specialties", err);
        setError("Unable to load specialties. Please try again.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSpecialties();
  }, []);

  const visibleList = showAll ? specialties : specialties.slice(0, 20);

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

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-200 bg-white text-center flex flex-col items-center animate-pulse">
                <div className="w-12 h-12 rounded-full bg-slate-200 mb-3" />
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="text-center py-10 bg-white border border-slate-200 rounded-xl p-6">
            <p className="text-sm font-medium text-slate-600 mb-3">{error}</p>
            <button
              onClick={fetchSpecialties}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Categories Grid */}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {visibleList.map((spec) => {
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
                      {spec.description && (
                        <p className={`text-[11px] line-clamp-2 ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                          {spec.description}
                        </p>
                      )}
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

            {specialties.length > 20 && (
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => setShowAll(!showAll)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-white text-slate-800 border border-slate-300 hover:border-emerald-500 hover:text-emerald-700 hover:shadow-md transition-all duration-200 cursor-pointer active:scale-95"
                >
                  <span>{showAll ? 'Show Less' : `Show All (${specialties.length})`}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showAll ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </section>
  );
}
