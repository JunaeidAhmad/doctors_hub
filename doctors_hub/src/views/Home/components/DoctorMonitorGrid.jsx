import React, { useEffect, useState } from 'react';
import { 
  Building2, Heart, Sparkles, FlaskConical, Activity, Stethoscope, 
  Landmark, Award, ShieldCheck, FileText 
} from 'lucide-react';
import { api } from '../../../services/api';

const hospitalIconMap = {
  Building2: Building2,
  Heart: Heart,
  Sparkles: Sparkles,
  FlaskConical: FlaskConical,
  Activity: Activity,
  Stethoscope: Stethoscope,
  Landmark: Landmark,
  Award: Award,
  ShieldCheck: ShieldCheck,
  FileText: FileText
};

export default function DoctorMonitorGrid({ onSelectCategory }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let isMounted = true;
    api.getHospitalCategories()
      .then((data) => {
        if (isMounted && data) {
          const list = Array.isArray(data) ? data : (data.results || []);
          const filtered = list.filter((c) => c && c.id !== 'all' && c.name !== 'All Categories');
          setCategories(filtered.length > 0 ? filtered : list);
        }
      })
      .catch((err) => {
        console.warn("Failed to load hospital categories", err);
      });
    return () => { isMounted = false; };
  }, []);

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
            Verified hospital networks & specialized hospitals across Bangladesh.
          </p>
        </div>

        {/* HOSPITAL CATEGORIES GRID VIEW */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map((cat) => {
            const IconComp = hospitalIconMap[cat.icon] || hospitalIconMap[cat.slug] || Building2;

            return (
              <div
                key={cat.id || cat.name}
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
                  <p className="text-[11px] line-clamp-2 text-slate-500">
                    {cat.description || `Explore ${cat.name} hospitals`}
                  </p>
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

      </div>
    </section>
  );
}

