import React from 'react';
import { Building2, MapPin, Phone, Clock, ShieldCheck, Stethoscope, Calendar, CheckCircle, Star, ArrowRight, UserCheck } from 'lucide-react';

export default function OpdMonitorGrid({
  chambers,
  onBookDoctorSlot,
  onSelectPartner,
  selectedSpecialty,
  searchKeyword,
  selectedLocation
}) {
  return (
    <section id="opd-doctors" className="py-16 px-4 sm:px-8 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Real-Time Live Monitor</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Active Medical Partners
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Verified OPD diagnostic clinics & visiting specialist doctor schedules across Bangladesh.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Live Status:</span>
            </div>
            <span>{chambers.length} Partner Chambers Active</span>
          </div>
        </div>

        {/* CHAMBER GRID */}
        {chambers.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 max-w-xl mx-auto my-8">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No OPD Chambers Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your specialty filter or keyword search query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {chambers.map((chamber) => (
              <div
                key={chamber.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-md shadow-slate-200/50 hover:shadow-xl hover:border-emerald-300 transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                {/* Top Chamber Banner & Information Header */}
                <div>
                  <div 
                    onClick={() => onSelectPartner && onSelectPartner(chamber.id)}
                    className="relative h-44 overflow-hidden bg-slate-900 cursor-pointer group"
                  >
                    <img
                      src={chamber.image}
                      alt={chamber.name}
                      className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <div className="inline-flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-emerald-500/40 text-emerald-400 text-xs font-extrabold px-3 py-1 rounded-full shadow-md">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>{chamber.badge}</span>
                      </div>
                      <div className="bg-slate-900/90 backdrop-blur-md text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-500/30 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{chamber.rating} ({chamber.reviewsCount || chamber.reviews_count || 200})</span>
                      </div>
                    </div>

                    {/* Bottom Chamber Title on Image - CLICKABLE PARTNER NAME */}
                    <div className="absolute bottom-3 left-4 right-4 text-white">
                      <h3 className="text-xl font-extrabold text-white drop-shadow-sm flex items-center gap-2 group-hover:text-emerald-300 transition-colors">
                        <span className="hover:underline underline-offset-4">{chamber.name}</span>
                        {chamber.verified && (
                          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                        )}
                      </h3>
                      <p className="text-xs text-slate-300 font-medium line-clamp-1 flex items-center justify-between">
                        <span>{chamber.tagline}</span>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30 group-hover:bg-emerald-600 group-hover:text-white transition-all ml-2 shrink-0">
                          View Partner Page &rarr;
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Chamber Details Strip */}
                  <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{chamber.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{chamber.openTiming}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{chamber.contactPhone}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                      <UserCheck className="w-4 h-4 shrink-0" />
                      <span>{chamber.doctors.length} Visiting Specialists</span>
                    </div>
                  </div>

                  {/* INTERNAL SUB-LIST OF DOCTORS */}
                  <div className="p-4 sm:p-5 space-y-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Attached Visiting Doctor Roster & Serial Timings:
                    </div>

                    {chamber.doctors.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-sm shrink-0 border border-emerald-300">
                            {doc.name.split(' ').slice(-1)[0][0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                                {doc.name}
                              </h4>
                              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                                {doc.specialty}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                              {doc.qualification}
                            </p>
                            <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                              <span className="flex items-center gap-1 text-slate-700 font-semibold">
                                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                                {doc.visitDays}
                              </span>
                              <span className="flex items-center gap-1 text-slate-600">
                                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                {doc.visitTime}
                              </span>
                              <span className="font-extrabold text-emerald-700">
                                Fee: ৳{doc.fee}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* "Book Slot" Action Trigger */}
                        <button
                          onClick={() => onBookDoctorSlot(chamber, doc)}
                          className="shrink-0 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <span>Book Serial</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Bar of Chamber */}
                <div className="p-3 bg-slate-100/70 border-t border-slate-200 text-center text-xs text-slate-500 font-medium">
                  Verified by DoctorHub Medical Operations Team • Direct Chamber Token Generation
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
