import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Heart, 
  ShieldCheck, 
  Eye, 
  Bone, 
  Baby, 
  Sparkles, 
  Brain, 
  Droplet, 
  Smile, 
  Ear, 
  Flame, 
  Wind, 
  FlaskConical, 
  Activity, 
  Stethoscope, 
  Landmark, 
  Award, 
  ChevronDown 
} from 'lucide-react';
import { api, ensureArray } from '../../../services/api';

const hospitalIconMap = {
  'Building2': Building2,
  'Heart': Heart,
  'ShieldCheck': ShieldCheck,
  'Eye': Eye,
  'Bone': Bone,
  'Baby': Baby,
  'Sparkles': Sparkles,
  'Brain': Brain,
  'Droplet': Droplet,
  'Smile': Smile,
  'Ear': Ear,
  'Flame': Flame,
  'Wind': Wind,
  'FlaskConical': FlaskConical,
  'Activity': Activity,
  'Stethoscope': Stethoscope,
  'Landmark': Landmark,
  'Award': Award,
  'general-hospitals': Building2,
  'cardiac-hospitals': Heart,
  'cancer-oncology': ShieldCheck,
  'eye-hospitals': Eye,
  'orthopedic-trauma': Bone,
  'mother-child-maternity': Baby,
  'pediatric-hospitals': Sparkles,
  'neurological-spine': Brain,
  'kidney-nephrology': Droplet,
  'dental-hospitals': Smile,
  'ent-hospitals': Ear,
  'diabetes-endocrine': Activity,
  'burn-plastic-surgery': Flame,
  'skin-dermatology': Sparkles,
  'chest-pulmonology': Wind,
  'infectious-diseases': FlaskConical,
  'gastroenterology-liver': Activity,
  'diagnostic-daycare': Stethoscope,
  'medical-college-hospitals': Landmark,
  'corporate-tertiary': Building2,
  'government-district': Landmark,
  'rehab-physiotherapy': Award,
  'geriatric-palliative': ShieldCheck,
};

export default function DoctorMonitorGrid({ onSelectCategory }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const fetchCategories = () => {
    setLoading(true);
    setError(null);
    api.getHospitalCategories()
      .then((data) => {
        const list = ensureArray(data);
        const filtered = list.filter((c) => c && c.id !== 'all');
        setCategories(filtered);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Failed to load hospital categories", err);
        setError("Unable to load hospital categories. Please try again.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const visibleCategories = showAll ? categories : categories.slice(0, 20);

  return (
    <section id="hospitals" className="py-16 px-4 sm:px-8 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
            Hospital Categories
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 tracking-tight">
            Hospitals
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Verified hospital networks &amp; specialized hospitals across Bangladesh.
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
              onClick={fetchCategories}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* HOSPITAL CATEGORIES GRID VIEW */}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {visibleCategories.map((cat) => {
                const IconComp = hospitalIconMap[cat.icon] || hospitalIconMap[cat.slug] || hospitalIconMap[cat.id] || Building2;

                return (
                  <div
                    key={cat.id || cat.slug || cat.name}
                    onClick={() => onSelectCategory && onSelectCategory(cat.id || cat.slug || cat.name)}
                    className="p-4 rounded-xl border cursor-pointer transition-all duration-200 text-center flex flex-col items-center justify-between bg-white text-slate-800 border-slate-200 hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5 group"
                  >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white">
                      <IconComp className="w-6 h-6" />
                    </div>

                    <div>
                      <h4 className="font-bold text-sm leading-tight mb-1 text-slate-900 group-hover:text-emerald-700">
                        {cat.name}
                      </h4>
                      {cat.description && (
                        <p className="text-[11px] line-clamp-2 text-slate-500">
                          {cat.description}
                        </p>
                      )}
                    </div>

                    {cat.count !== undefined && cat.count !== null && (
                      <div className="mt-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {cat.count} Hospitals
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {categories.length > 20 && (
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => setShowAll(!showAll)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-white text-slate-800 border border-slate-300 hover:border-emerald-500 hover:text-emerald-700 hover:shadow-md transition-all duration-200 cursor-pointer active:scale-95"
                >
                  <span>{showAll ? 'Show Less' : `Show All (${categories.length})`}</span>
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
