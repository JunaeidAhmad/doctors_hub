import React from 'react';
import { Smartphone, Star, Download, CheckCircle2, QrCode } from 'lucide-react';

export default function AppDownloadBanner({ showToast }) {
  return (
    <section className="py-16 px-4 sm:px-8 bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-10">
        
        {/* Left Content */}
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile App Download Indicator</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
            Book Doctors On The Go With The <span className="text-emerald-400">DoctorsHub App</span>
          </h2>

          <p className="mt-3 text-slate-300 text-sm leading-relaxed">
            Get instant token updates, live doctor queue status in chambers, WhatsApp lab report notifications, and digital medical records on your smartphone.
          </p>

          {/* Feature Bullets */}
          <div className="mt-6 grid grid-cols-2 gap-3 text-xs font-medium text-slate-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Real-Time Doctors Queue Track</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Instant Digital Token Slip</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Diagnostic Report Vault</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Emergency Helpline Call</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={() => showToast("Downloading DoctorHub Android APK...")}
              className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Google Play App</span>
            </button>

            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold bg-slate-800/80 px-3 py-2.5 rounded-xl border border-slate-700">
              <Star className="w-4 h-4 fill-amber-400" />
              <span>4.9 / 5 Rating (25,000+ Downloads)</span>
            </div>
          </div>
        </div>

        {/* Right QR Mockup */}
        <div className="bg-slate-800/90 border border-slate-700 p-6 rounded-2xl text-center max-w-xs w-full shadow-2xl flex flex-col items-center">
          <div className="w-36 h-36 bg-white p-3 rounded-xl border-2 border-emerald-500 flex items-center justify-center shadow-md mb-3">
            <QrCode className="w-full h-full text-slate-900" />
          </div>
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Scan QR Code to Install App
          </span>
          <span className="text-[11px] text-slate-400 mt-1">
            Compatible with Android 8.0+ & iOS
          </span>
        </div>

      </div>
    </section>
  );
}
