import React from 'react';

export default function DiagnosticsPromoBanner({ onBookHomeCollection, onViewGuidelines }) {
  return (
    <section className="mt-12">
      <div className="bg-gradient-to-r from-primary to-primary-container rounded-2xl p-8 lg:p-10 text-on-primary shadow-md relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 bg-on-primary/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            <span className="material-symbols-outlined text-sm">home_health</span>
            <span>DoctorsHub Mobile Phlebotomy Service</span>
          </div>

          <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Safe, Hygienic Blood Sample Pickup from your Doorstep
          </h2>
          <p className="font-body-lg text-sm sm:text-base text-white/90 mt-2 leading-relaxed">
            Certified Phlebotomists, Barcoded Vials, Temperature-controlled Vacutainers, and Digital Reports on WhatsApp within 6 hours. Zero clinic queues for seniors and children.
          </p>

          <div className="mt-6 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-white font-medium">
              <span className="material-symbols-outlined text-primary-fixed text-[18px]">
                check_circle
              </span>
              <span>100% Sterile Disposable Needles</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-white font-medium">
              <span className="material-symbols-outlined text-primary-fixed text-[18px]">
                check_circle
              </span>
              <span>Real-time Phlebotomist GPS Tracking</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-white font-medium">
              <span className="material-symbols-outlined text-primary-fixed text-[18px]">
                check_circle
              </span>
              <span>WhatsApp Delivery</span>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex flex-col sm:flex-row gap-3 relative z-10 w-full lg:w-auto">
          <button
            type="button"
            onClick={onBookHomeCollection}
            className="px-6 py-3.5 bg-white text-primary font-semibold text-sm rounded-xl shadow-md hover:bg-slate-100 transition-all text-center cursor-pointer active:scale-[0.98]"
          >
            Book Home Collection
          </button>
          <button
            type="button"
            onClick={onViewGuidelines}
            className="px-6 py-3.5 bg-transparent border border-white/40 text-white font-semibold text-sm rounded-xl hover:bg-white/10 transition-all text-center cursor-pointer active:scale-[0.98]"
          >
            View Sample Guidelines
          </button>
        </div>

        {/* Decorative background circles */}
        <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute right-64 -top-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
      </div>
    </section>
  );
}
