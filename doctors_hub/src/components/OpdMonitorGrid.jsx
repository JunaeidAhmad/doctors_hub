import React, { useState } from 'react';
import { Building2, MapPin, Phone, Clock, ShieldCheck, Stethoscope, Calendar, CheckCircle, Star, ArrowRight, UserCheck, Heart, Sparkles, FlaskConical, Activity } from 'lucide-react';
import { HOSPITAL_SPECIALTIES } from '../data/mockData';

const partnerIconMap = {
  Building2: Building2,
  Heart: Heart,
  Sparkles: Sparkles,
  FlaskConical: FlaskConical,
  Activity: Activity,
  Stethoscope: Stethoscope
};

export default function OpdMonitorGrid({ onSelectCategory }) {
  return (
    <section id="partners" className="py-16 px-4 sm:px-8 bg-slate-50">
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
            Verified hospital networks, specialized institutes & diagnostic clinics across Bangladesh.
          </p>
        </div>

        {/* HOSPITAL & DIAGNOSTIC SPECIALTY GRID VIEW */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {HOSPITAL_SPECIALTIES.map((spec) => {
            const IconComp = partnerIconMap[spec.icon] || Building2;

            return (
              <div
                key={spec.id}
                onClick={() => onSelectCategory && onSelectCategory(spec.id)}
                className="p-4 rounded-xl border cursor-pointer transition-all duration-200 text-center flex flex-col items-center justify-between bg-white text-slate-800 border-slate-200 hover:border-emerald-500 hover:shadow-sm"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors bg-emerald-100 text-emerald-600">
                  <IconComp className="w-6 h-6" />
                </div>

                <div>
                  <h4 className="font-bold text-sm leading-tight mb-1 text-slate-900">
                    {spec.name}
                  </h4>
                  <p className="text-[11px] line-clamp-1 text-slate-500">
                    {spec.description}
                  </p>
                </div>

                <div className="mt-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {spec.count} Partners
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
