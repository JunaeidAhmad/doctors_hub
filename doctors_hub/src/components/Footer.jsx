import React from 'react';
import { HeartPulse, MapPin, Phone, Mail, Clock, ShieldCheck, Heart } from 'lucide-react';
import { LOCATIONS } from '../data/constants';

export default function Footer({ onSelectLocation }) {
  return (
    <footer id="contact" className="bg-slate-950 text-slate-400 pt-16 pb-8 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-slate-800">
          
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <HeartPulse className="w-6 h-6" />
              </div>
              <span className="text-2xl font-black text-white">
                Doctors<span className="text-emerald-500">Hub</span>.com.bd
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              DoctorsHub BD is Bangladesh's leading digital healthcare aggregator connecting patients to DGHS & BMDC verified hospitals, diagnostic centers, specialist doctors, and NABL/ISO accredited laboratories.
            </p>
            <div className="flex items-center gap-3 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>DGHS & BMDC Registered Tech Portal</span>
            </div>
          </div>

          {/* Col 2: Major Divisions & Cities */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-xs mb-3">
              Divisions & Cities
            </h4>
            <ul className="space-y-2">
              {LOCATIONS.slice(1).map((loc) => (
                <li key={loc}>
                  <button
                    onClick={() => onSelectLocation(loc)}
                    className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                  >
                    <MapPin className="w-3 h-3 text-emerald-500" />
                    <span>Doctor Chambers in {loc}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Quick Links */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-xs mb-3">
              Quick Portals
            </h4>
            <ul className="space-y-2">
              <li><a href="#search-doctors" className="hover:text-emerald-400 transition-colors">Search Doctors</a></li>
              <li><a href="#diagnostics" className="hover:text-emerald-400 transition-colors">Diagnostic & Lab Tests</a></li>
              <li><a href="#about" className="hover:text-emerald-400 transition-colors">About DoctorsHub BD</a></li>
              <li><a href="#contact" className="hover:text-emerald-400 transition-colors">Patient Help & Support</a></li>
              <li><a href="#contact" className="hover:text-emerald-400 transition-colors">24/7 Hotline 16263</a></li>
            </ul>
          </div>

          {/* Col 4: Contact & Helpline */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-xs mb-3">
              Helpline & Support
            </h4>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-200 font-bold">16263 / +880 9611-677889</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>support@doctorshub.com.bd</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>24/7 Operations Desk</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Disclaimer & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © 2026 DoctorsHub.com.bd. All rights reserved. Designed for healthcare access in Bangladesh.
          </div>
          <div className="flex items-center gap-1">
            <span>Built with care for patients </span>
            <Heart className="w-3 h-3 text-red-500 fill-red-500 inline" />
          </div>
        </div>

      </div>
    </footer>
  );
}
