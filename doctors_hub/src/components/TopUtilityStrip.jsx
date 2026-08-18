import React from 'react';
import { Phone, Mail, Clock, ShieldCheck, LayoutDashboard } from 'lucide-react';
import { LOCATIONS } from '../data/constants';

export default function TopUtilityStrip({ selectedLocation, setSelectedLocation, onNavigateAdmin }) {
  return (
    <div className="bg-slate-900 text-slate-200 text-xs py-2 px-4 sm:px-8 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
        {/* Left side: Status badge & Info */}
        <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
          {/* Green Status Element */}
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-emerald-400 font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <Clock className="w-3 h-3" />
            <span>24/7 Open</span>
          </div>

          {/* Phone Number */}
          <a
            href="tel:16263"
            className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium">Hotline: 16263 / +880 1711-234567</span>
          </a>

          {/* Support Email */}
          <a
            href="mailto:support@doctorshub.com.bd"
            className="hidden md:flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-emerald-400" />
            <span>support@doctorshub.com.bd</span>
          </a>
        </div>

        {/* Right side: Verified Portal Tag & Partner Portal Link */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-1 text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>DGHS & BMDC Reg. Platform</span>
          </div>


        </div>
      </div>
    </div>
  );
}
