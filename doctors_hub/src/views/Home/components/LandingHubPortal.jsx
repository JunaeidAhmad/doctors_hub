import React from 'react';
import { UserCheck, Stethoscope, ShieldCheck, Activity, Award, Sparkles, Calendar, Clock, Search } from 'lucide-react';

export default function LandingHubPortal() {
  return (
    <section className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white pt-10 pb-16 px-4 sm:px-8 relative overflow-hidden">
      {/* Background Decorative Blur Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Patient Healthcare Portal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Book Doctors & Diagnostic Tests Across <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Bangladesh</span>
          </h1>
          <p className="mt-3 text-slate-300 text-sm sm:text-base font-normal">
            Search doctor schedules, secure instant Doctor Appointments, and request home sample collection from top diagnostic labs nationwide.
          </p>
        </div>

        {/* PATIENT HIGHLIGHT FEATURE CARDS */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          
          {/* FEATURE CARD 1: DOCTOR APPOINTMENTS */}
          <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-emerald-500/50 transition-all duration-300">
            <div className="p-3.5 rounded-xl bg-emerald-500/20 text-emerald-400 w-fit mb-4">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Instant Doctor Appointments</h3>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Find specialist professors, check live chamber visit timings, and book guaranteed serial slots online without waiting in long queues.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-700/60 flex items-center gap-2 text-xs text-emerald-400 font-semibold">
              <Clock className="w-4 h-4" />
              <span>Real-time Doctor Appointments</span>
            </div>
          </div>

          {/* FEATURE CARD 2: DIAGNOSTICS & [] */}
          <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-emerald-500/50 transition-all duration-300">
            <div className="p-3.5 rounded-xl bg-teal-500/20 text-teal-400 w-fit mb-4">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Diagnostic Tests & Sample Pickup</h3>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Compare prices for MRI, CT Scans, Blood Tests, and book convenient doorstep phlebotomist home sample collection with digital WhatsApp report delivery.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-700/60 flex items-center gap-2 text-xs text-teal-300 font-semibold">
              <Award className="w-4 h-4" />
              <span>DGHS Approved Diagnostic Labs</span>
            </div>
          </div>

          {/* FEATURE CARD 3: VERIFIED CLINICS & [] */}
          <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-emerald-500/50 transition-all duration-300">
            <div className="p-3.5 rounded-xl bg-cyan-500/20 text-cyan-400 w-fit mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Verified Medical Centers</h3>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Access comprehensive directory of top hospitals, diagnostic centers, and specialist chamber locations across Dhaka, Chittagong, Sylhet & all divisions.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-700/60 flex items-center gap-2 text-xs text-cyan-300 font-semibold">
              <UserCheck className="w-4 h-4" />
              <span>Verified Chamber Information</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
