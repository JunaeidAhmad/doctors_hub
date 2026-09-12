import React from 'react';
import { 
  Navigation, ExternalLink, Car, Ambulance, PhoneCall, 
  ArrowRight, ShieldAlert, ParkingCircle, MapPin 
} from 'lucide-react';

export default function HospitalLocationSection({ hospital }) {
  const hospitalName = hospital?.name || hospital?.facility_name || 'Square Hospital';
  const address = hospital?.address_line || hospital?.address || '18/F, Bir Uttam Qazi Nuruzzaman Sarak, West Panthapath, Dhaka 1205';
  const parkingText = hospital?.parking_capacity || '280 Car Parking Available';
  const ambulancePhone = hospital?.ambulance_phone || '+880 1700-000000';
  const emergencyPhone = hospital?.emergency_phone || '10678';

  const mapPreviewImg = 'https://lh3.googleusercontent.com/aida-public/AB6AXuD5ZlsQNbcZvNeW-owVe0qR2PUttkwvBZ0sGWzi4U62946lbtg5xof3GoMKP3cjzaduFMdLNPGdr3Bt0gOe9-govLdd7Ia2poNCvHXVq3X0EoKRw8Pc-nPRKr_YnFEvEw6qUDfd8ew-HSGsTzy7NvEZN9zvsbNIJ_yVBOaIdtmMy2w1jtk4STaaIVfb2m4Cr6JfFNC0pSY6pSflqZ4vmCy7TGZB8a0FMJHbV5j6V3w0K4x3tM3qEqpUVg';

  const handleOpenGoogleMaps = () => {
    const query = encodeURIComponent(`${hospitalName} ${address}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/70 p-5 sm:p-6 lg:p-8 space-y-6 scroll-mt-24" id="emergency-section">
      {/* Header */}
      <div className="border-b border-outline-variant/50 pb-5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-1.5">
          <Navigation className="w-3.5 h-3.5" />
          <span>Facility Navigation & Transit</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
          Location, Campus Map & 24/7 Ambulance Fleet
        </h2>
        <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
          Central location with dual street entry, basement multilevel parking, and immediate emergency ramp access.
        </p>
      </div>

      {/* 2-Column Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Map Preview Card */}
        <div className="lg:col-span-2 rounded-2xl border border-outline-variant overflow-hidden relative min-h-[340px] bg-slate-100 flex flex-col justify-between group">
          <img
            src={mapPreviewImg}
            alt={`${hospitalName} Campus Location Map`}
            className="w-full h-full object-cover absolute inset-0 group-hover:scale-102 transition-transform duration-500"
          />

          {/* Floating Campus Badge */}
          <div className="relative z-10 m-4 bg-surface-container-lowest/95 backdrop-blur p-3.5 rounded-xl border border-outline-variant shadow-sm max-w-xs sm:max-w-sm">
            <h4 className="text-sm font-bold text-on-surface">
              {hospitalName} Campus
            </h4>
            <p className="text-xs text-outline mt-0.5">
              {address}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-primary font-semibold">
              <Car className="w-4 h-4 text-primary" />
              <span>{parkingText}</span>
            </div>
          </div>

          {/* External Map Action */}
          <div className="relative z-10 m-4 self-end">
            <button
              onClick={handleOpenGoogleMaps}
              className="px-4 py-2 rounded-lg bg-inverse-surface text-white text-xs font-bold shadow-md hover:bg-black transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Google Maps</span>
            </button>
          </div>
        </div>

        {/* Ambulance & Gate Guide (Right Column) */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* Ambulance Dispatch Box */}
          <div className="p-5 rounded-2xl border border-error/30 bg-error/5 space-y-3">
            <div className="flex items-center gap-2 text-error">
              <Ambulance className="w-6 h-6" />
              <h4 className="text-base font-bold">24/7 Ambulance Dispatch</h4>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              AC ICU Mobile Units equipped with Dräger ventilators, multipara cardiac monitors, and emergency medical officers.
            </p>

            <div className="pt-1">
              <span className="text-xs text-outline font-medium">Dedicated Dispatch Hotlines:</span>
              <p className="text-xl sm:text-2xl font-bold text-error tracking-tight mt-0.5">
                {ambulancePhone}
              </p>
              <p className="text-xs font-semibold text-on-surface mt-0.5">
                {emergencyPhone} (Ext 1)
              </p>
            </div>

            <a
              href={`tel:${ambulancePhone.replace(/[^0-9+]/g, '')}`}
              className="w-full py-2.5 rounded-lg bg-error text-white text-xs font-bold inline-flex items-center justify-center gap-2 hover:bg-error/90 transition-all shadow-sm"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Dispatch Ambulance Now</span>
            </a>
          </div>

          {/* Gate & Triage Guide */}
          <div className="p-5 rounded-2xl border border-outline-variant bg-surface-container-low/50 space-y-2.5">
            <h4 className="text-sm font-bold text-on-surface">Gate & Triage Access</h4>
            <ul className="text-xs text-on-surface-variant space-y-2 pt-1">
              <li className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong className="text-on-surface font-semibold">Gate 1 (Panthapath Main):</strong> OPD Chambers, Diagnostic Labs & General Inpatient.
                </span>
              </li>

              <li className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-error shrink-0 mt-0.5" />
                <span>
                  <strong className="text-on-surface font-semibold">Gate 2 (East Ramp):</strong> Dedicated 24/7 Emergency, Trauma Center & Ambulance Drop-off.
                </span>
              </li>

              <li className="flex items-start gap-2">
                <ParkingCircle className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                <span>
                  <strong className="text-on-surface font-semibold">Basement Entry (B1-B3):</strong> Visitor parking with automated digital slip validation.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
