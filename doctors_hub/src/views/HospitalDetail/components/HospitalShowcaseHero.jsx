import React, { useState } from 'react';
import { 
  ShieldCheck, Award, Star, MapPin, Navigation, Share2, 
  Users, AlertCircle, Bed, Stethoscope, Plane, Clock, Activity,
  CheckCircle2, Copy, Check
} from 'lucide-react';

export default function HospitalShowcaseHero({ hospital, onScrollToSection }) {
  const [copied, setCopied] = useState(false);

  // Fallback defaults from Stitch design
  const name = hospital?.name || hospital?.facility_name || 'Square Hospital, Dhaka';
  const address = hospital?.address_line && hospital.address_line.includes('West Panthapath')
    ? hospital.address_line
    : '18/F, Bir Uttam Qazi Nuruzzaman Sarak, West Panthapath, Dhaka 1205';
  const rating = hospital?.rating ? Number(hospital.rating).toFixed(1) : '4.9';
  const reviewsCount = hospital?.reviews_count && hospital.reviews_count > 500 ? hospital.reviews_count : 1840;
  const bedCapacity = hospital?.bed_capacity || 650;
  const icuAvailable = hospital?.icu_beds_available ?? 4;
  const icuTotal = hospital?.icu_beds_total || 48;
  const otSuites = hospital?.ot_suites_count || 16;
  const dghsRegNo = hospital?.dghs_reg_no || 'DGHS Reg #H-098234';
  const accreditation = hospital?.accreditation || 'JCI Accredited Facility';
  const doctorsCount = hospital?.specialists_count || hospital?.total_doctors || '120+';

  // Generate 3-letter initials for monogram (SQH for Square Hospital)
  const initials = name.toLowerCase().includes('square')
    ? 'SQH'
    : name
        .split(' ')
        .filter(Boolean)
        .slice(0, 3)
        .map(w => w[0].toUpperCase())
        .join('') || 'SQH';

  // Facade image
  const facadeImage = hospital?.image 
    || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEt7iWw8-SWeIZO4wPy3tsCf74v2VG5n2GUdzRLmz6VoV2-u22aFTswLSzCy1_zsgasKZTx4WvvfMkQ_yzPLX-Ec1lb1tZaEX23Xw9YZ-tLNyVa0XXxLAzWvKX32QW4BgOkQmsTZGZgAusePUlMU_bUMawNGkFL2paejP-5mJetxq7Y9jvAf333dgDkrNcVWn7MKgoUzZREk93WsepPdVud4vLIroDTO5poVqvdcVgOelpXimvDy2n4Q';

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

  return (
    <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden">
      {/* 1. Media Header Facade */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden bg-slate-900">
        <img
          src={facadeImage}
          alt={`${name} exterior modern facade`}
          className="w-full h-full object-cover object-center opacity-85 hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

        {/* Floating Badges Top Row */}
        <div className="absolute top-4 sm:top-5 left-4 sm:left-6 right-4 sm:right-6 flex flex-wrap justify-between items-center gap-2.5 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest/95 backdrop-blur text-primary text-xs font-bold border border-primary-fixed-dim/40 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>{accreditation}</span>
            </span>

            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-inverse-surface/85 backdrop-blur text-inverse-on-surface text-xs font-medium border border-outline/30">
              <Award className="w-3.5 h-3.5 text-secondary-fixed shrink-0" />
              <span>{dghsRegNo}</span>
            </span>

            <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full bg-inverse-surface/85 backdrop-blur text-inverse-on-surface text-xs font-medium border border-outline/30">
              Tertiary Multispecialty
            </span>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-primary-fixed border border-primary-fixed/40 text-xs font-bold backdrop-blur">
            <span className="w-2 h-2 rounded-full bg-primary-fixed animate-pulse"></span>
            <span>{bedCapacity}-Bed Active Capacity</span>
          </span>
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
                <div className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 text-xs px-2 py-0.5 rounded font-bold shadow-xs">
                  <Star className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                  <span>{rating}</span>
                  <span className="text-slate-800 font-normal">({reviewsCount.toLocaleString()} reviews)</span>
                </div>
              </div>

              <p className="text-slate-200 text-xs sm:text-sm flex items-center gap-1.5 mt-1 font-medium">
                <MapPin className="w-4 h-4 text-primary-fixed shrink-0" />
                <span className="truncate max-w-sm sm:max-w-xl">{address}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={handleGetDirections}
              className="px-3.5 py-2 rounded-lg bg-surface-container-lowest/20 hover:bg-surface-container-lowest/30 backdrop-blur text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-all border border-white/20 cursor-pointer"
            >
              <Navigation className="w-4 h-4 text-white" />
              <span>Get Directions</span>
            </button>

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

      {/* 2. Quick Operational Stats Bar (5 Columns) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-outline-variant/60 bg-surface-container-low/40 p-4 lg:p-5 border-b border-outline-variant/60">
        <div className="px-3 py-2 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-on-surface">{doctorsCount}</p>
            <p className="text-xs text-on-surface-variant font-medium">Specialist Doctors</p>
          </div>
        </div>

        <div className="px-3 py-2 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-error/10 text-error shrink-0">
            <AlertCircle className="w-6 h-6 text-error" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-error">24/7</p>
            <p className="text-xs text-on-surface-variant font-medium">Emergency & Trauma</p>
          </div>
        </div>

        <div className="px-3 py-2 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-secondary/10 text-secondary shrink-0">
            <Bed className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <p className="text-xl sm:text-2xl font-bold text-on-surface">{icuTotal}</p>
              <span className="text-xs font-bold text-primary">({icuAvailable} Available)</span>
            </div>
            <p className="text-xs text-on-surface-variant font-medium">ICU/CCU Units</p>
          </div>
        </div>

        <div className="px-3 py-2 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-tertiary/10 text-tertiary shrink-0">
            <Stethoscope className="w-6 h-6 text-tertiary" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-on-surface">{otSuites}</p>
            <p className="text-xs text-on-surface-variant font-medium">Modular OT Suites</p>
          </div>
        </div>

        <div className="px-3 py-2 flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="p-2.5 rounded-lg bg-primary-fixed/20 text-primary shrink-0">
            <Plane className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-on-surface">Active</p>
            <p className="text-xs text-on-surface-variant font-medium">Helipad Evacuation</p>
          </div>
        </div>
      </div>

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
