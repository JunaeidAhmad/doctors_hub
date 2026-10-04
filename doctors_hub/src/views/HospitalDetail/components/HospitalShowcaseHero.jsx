import React, { useState } from 'react';
import { 
  ShieldCheck, Award, Star, MapPin, Navigation, Share2, 
  Users, AlertCircle, Bed, Stethoscope, Plane, Clock, Activity,
  CheckCircle2, Copy, Check
} from 'lucide-react';

export default function HospitalShowcaseHero({ hospital, onScrollToSection }) {
  const [copied, setCopied] = useState(false);

  const name = (hospital?.display_name || hospital?.name || "") || '';
  const address = hospital?.address_line || '';
  const rating = hospital?.rating ? Number(hospital.rating).toFixed(1) : null;
  const reviewsCount = hospital?.reviews_count ?? null;
  const bedCapacity = hospital?.bed_capacity ?? null;
  const icuAvailable = hospital?.icu_beds_available ?? null;
  const icuTotal = hospital?.icu_beds_total ?? null;
  const otSuites = hospital?.ot_suites_count ?? null;
  const dghsRegNo = hospital?.dghs_reg_no || null;
  const accreditation = hospital?.accreditation || null;
  const doctorsCount = hospital?.doctor_count ?? hospital?.specialists_count ?? hospital?.total_doctors ?? null;
  const hasHelipad = hospital?.has_helipad ?? false;

  // Generate initials for monogram
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 3)
    .map(w => w[0]?.toUpperCase())
    .filter(Boolean)
    .join('') || '?';

  // Facade image
  const facadeImage = hospital?.image || null;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: name,
          text: `Check out ${name} on DoctorsHub Bangladesh`,
          url: window.location.href,
        });
        return;
      } catch {
        // Fall back to clipboard
      }
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleGetDirections = () => {
    const query = encodeURIComponent(`${name} ${address}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank', 'noopener,noreferrer');
  };

  // Build stats bar items dynamically — only show what the data provides
  const statsItems = [];

  if (doctorsCount != null) {
    statsItems.push({
      icon: Users, iconBg: 'bg-primary/10 text-primary',
      value: String(doctorsCount), label: 'Specialist Doctors',
    });
  }

  // Always show Emergency if it exists in hospital data, but don't hardcode "24/7"
  if (hospital?.emergency_phone) {
    statsItems.push({
      icon: AlertCircle, iconBg: 'bg-error/10 text-error',
      value: '24/7', label: 'Emergency & Trauma',
      valueColor: 'text-error',
    });
  }

  if (icuTotal != null) {
    statsItems.push({
      icon: Bed, iconBg: 'bg-secondary/10 text-secondary',
      value: String(icuTotal), label: 'ICU/CCU Units',
      suffix: icuAvailable != null ? `(${icuAvailable} Available)` : null,
    });
  }

  if (otSuites != null) {
    statsItems.push({
      icon: Stethoscope, iconBg: 'bg-tertiary/10 text-tertiary',
      value: String(otSuites), label: 'Modular OT Suites',
    });
  }

  if (hasHelipad) {
    statsItems.push({
      icon: Plane, iconBg: 'bg-primary-fixed/20 text-primary',
      value: 'Active', label: 'Helipad Evacuation',
    });
  }

  return (
    <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden">
      {/* 1. Media Header Facade */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden bg-slate-900">
        {facadeImage ? (
          <img
            src={facadeImage}
            alt={`${name} exterior`}
            className="w-full h-full object-cover object-center opacity-85 hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center">
            <span className="text-6xl font-black text-primary/30">{initials}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

        {/* Floating Badges Top Row */}
        <div className="absolute top-4 sm:top-5 left-4 sm:left-6 right-4 sm:right-6 flex flex-wrap justify-between items-center gap-2.5 z-10">
          <div className="flex flex-wrap items-center gap-2">
            {accreditation && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest/95 backdrop-blur text-primary text-xs font-bold border border-primary-fixed-dim/40 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{accreditation}</span>
              </span>
            )}

            {dghsRegNo && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-inverse-surface/85 backdrop-blur text-inverse-on-surface text-xs font-medium border border-outline/30">
                <Award className="w-3.5 h-3.5 text-secondary-fixed shrink-0" />
                <span>{dghsRegNo}</span>
              </span>
            )}
          </div>

          {bedCapacity != null && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-primary-fixed border border-primary-fixed/40 text-xs font-bold backdrop-blur">
              <span className="w-2 h-2 rounded-full bg-primary-fixed animate-pulse"></span>
              <span>{bedCapacity}-Bed Active Capacity</span>
            </span>
          )}
        </div>

        {/* Facade Overlay Content (Bottom) */}
        <div className="absolute bottom-5 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 flex flex-col md:flex-row md:items-end justify-between gap-4 text-white z-10">
          <div className="flex items-center gap-3.5 sm:gap-4">
            {/* Monogram Avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-surface-container-lowest p-1.5 sm:p-2 shadow-lg border border-outline-variant flex items-center justify-center shrink-0">
              {hospital?.logo ? (
                <img src={hospital.logo} alt={name} className="w-full h-full object-contain rounded-lg" />
              ) : (
                <div className="w-full h-full rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white font-black text-xl sm:text-2xl tracking-wider">
                  {initials}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                  {name}
                </h1>
                {rating && (
                  <div className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 text-xs px-2 py-0.5 rounded font-bold shadow-xs">
                    <Star className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                    <span>{rating}</span>
                    {reviewsCount != null && (
                      <span className="text-slate-800 font-normal">({reviewsCount.toLocaleString()} reviews)</span>
                    )}
                  </div>
                )}
              </div>

              {address && (
                <p className="text-slate-200 text-xs sm:text-sm flex items-center gap-1.5 mt-1 font-medium">
                  <MapPin className="w-4 h-4 text-primary-fixed shrink-0" />
                  <span className="truncate max-w-sm sm:max-w-xl">{address}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            {address && (
              <button
                onClick={handleGetDirections}
                className="px-3.5 py-2 rounded-lg bg-surface-container-lowest/20 hover:bg-surface-container-lowest/30 backdrop-blur text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-all border border-white/20 cursor-pointer"
              >
                <Navigation className="w-4 h-4 text-white" />
                <span>Get Directions</span>
              </button>
            )}

            <button
              onClick={handleShare}
              className="px-3.5 py-2 rounded-lg bg-surface-container-lowest/20 hover:bg-surface-container-lowest/30 backdrop-blur text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-all border border-white/20 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-white" />}
              <span>{copied ? 'Copied!' : 'Share'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Quick Operational Stats Bar */}
      {statsItems.length > 0 && (
        <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-${Math.min(statsItems.length, 5)} divide-y sm:divide-y-0 sm:divide-x divide-outline-variant/60 bg-surface-container-low/40 p-4 lg:p-5 border-b border-outline-variant/60`}>
          {statsItems.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="px-3 py-2 flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${stat.iconBg} shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <p className={`text-xl sm:text-2xl font-bold ${stat.valueColor || 'text-on-surface'}`}>{stat.value}</p>
                    {stat.suffix && (
                      <span className="text-xs font-bold text-primary">{stat.suffix}</span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant font-medium">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Hero Call-To-Action Ribbon */}
      <div className="p-4 sm:p-5 lg:p-6 bg-surface-container-lowest flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="flex h-3 w-3 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
          <p className="text-xs sm:text-sm text-on-surface-variant font-medium">
            <strong className="text-on-surface font-bold">Chamber Registration Open:</strong> Walk-in & digital consultation appointments accepting bookings for today.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={() => onScrollToSection('bed-monitor-section')}
            className="px-4 py-2.5 rounded-lg border border-secondary text-secondary text-xs sm:text-sm font-bold inline-flex items-center gap-2 hover:bg-secondary/5 transition-all cursor-pointer"
          >
            <Activity className="w-4 h-4 text-secondary" />
            <span>Live ICU Tracker</span>
          </button>

          <button
            onClick={() => onScrollToSection('specialist-section')}
            className="px-5 py-2.5 rounded-lg bg-primary text-on-primary text-xs sm:text-sm font-bold inline-flex items-center gap-2 hover:bg-primary-container active:scale-[0.98] transition-all shadow-sm cursor-pointer"
          >
            <Clock className="w-4 h-4" />
            <span>Book Appointment with Specialist</span>
          </button>
        </div>
      </div>
    </section>
  );
}
