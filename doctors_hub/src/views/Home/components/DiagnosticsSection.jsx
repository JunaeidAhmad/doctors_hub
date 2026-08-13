import React, { useEffect, useState } from 'react';
import { 
  Building2, FlaskConical, Heart, Brain, Dna, ShieldCheck, 
  Activity, FileText, Sparkles, Landmark, Award
} from 'lucide-react';

import { api } from '../../../services/api';

const categoryIconMap = {
  'multi-specialty-general-diagnostic-center': Building2,
  'pathology-lab-focused': FlaskConical,
  'imaging-focused-radiology-ct-mri-': FileText,
  'cardiac-diagnostics-focused': Heart,
  'neuro-diagnostics-focused': Brain,
  'genetic-molecular-testing-focused': Dna,
  'government-diagnostic-center': Landmark,
  'private-independent-': ShieldCheck,
  'corporate-chain-multi-branch-': Building2,
  'hospital-affiliated-lab': Award
};

export default function DiagnosticsSection({ onSelectCategory }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let isMounted = true;
    api.getDiagnosticCenterCategories()
      .then(res => {
        if (isMounted && res && res.length > 0) {
          // Filter out top container nodes if needed, keep leaf/specific categories
          const filtered = res.filter(c => c.id !== 'all' && c.name !== 'By Specialization' && c.name !== 'By Ownership & Type');
          setCategories(filtered.length > 0 ? filtered : res);
        }
      })
      .catch(() => {
        if (isMounted) {
          const filtered = [].filter(c => c.id !== 'all' && c.name !== 'By Specialization' && c.name !== 'By Ownership & Type');
          setCategories(filtered);
        }
      });
    return () => { isMounted = false; };
  }, []);

  const displayCategories = categories.length > 0 ? categories : [].filter(c => c.id !== 'all' && c.name !== 'By Specialization' && c.name !== 'By Ownership & Type');

  return (
    <section id="diagnostics" className="py-16 px-4 sm:px-8 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
            Diagnostics Categories
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 tracking-tight">
            Diagnostics Centers
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Explore verified diagnostic Centers by specialization, ownership type, and available testing services.
          </p>
        </div>

        {/* DIAGNOSTICS CATEGORY GRID VIEW */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {displayCategories.map((cat) => {
            const IconComp = categoryIconMap[cat.id] || categoryIconMap[cat.slug] || Building2;

            return (
              <div
                key={cat.id}
                onClick={() => onSelectCategory && onSelectCategory(cat.id || cat.slug)}
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
                    {cat.description || `Browse ${cat.name} labs`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
