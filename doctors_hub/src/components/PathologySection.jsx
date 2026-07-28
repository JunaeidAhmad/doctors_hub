import React, { useEffect, useState } from 'react';
import { FlaskConical, Home, FileText, ArrowRight, Clock, Percent, Droplet, Heart, Activity } from 'lucide-react';
import { PATHOLOGY_TESTS as MOCK_TESTS, PATHOLOGY_CATEGORIES } from '../data/mockData';
import { api } from '../services/api';

const testCategoryIconMap = {
  FlaskConical: FlaskConical,
  Droplet: Droplet,
  FileText: FileText,
  Activity: Activity,
  Heart: Heart
};

export default function PathologySection({ onSelectCategory }) {
  return (
    <section id="pathology" className="py-16 px-4 sm:px-8 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
            NABL & DGHS Approved Diagnostics
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 tracking-tight">
            Tests and Health Checkup packages
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Free home blood sample pickup, digital WhatsApp report delivery, and verified lab partners.
          </p>
        </div>

        {/* TEST CATEGORY GRID VIEW */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {PATHOLOGY_CATEGORIES.map((cat) => {
            const IconComp = testCategoryIconMap[cat.icon] || FlaskConical;

            return (
              <div
                key={cat.id}
                onClick={() => onSelectCategory && onSelectCategory(cat.id)}
                className="p-4 rounded-xl border cursor-pointer transition-all duration-200 text-center flex flex-col items-center justify-between bg-white text-slate-800 border-slate-200 hover:border-emerald-500 hover:shadow-sm"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors bg-emerald-100 text-emerald-600">
                  <IconComp className="w-6 h-6" />
                </div>

                <div>
                  <h4 className="font-bold text-sm leading-tight mb-1 text-slate-900">
                    {cat.name}
                  </h4>
                  <p className="text-[11px] line-clamp-1 text-slate-500">
                    {cat.description}
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
