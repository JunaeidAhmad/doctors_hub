import React from 'react';
import { 
  Info, Clock, CheckSquare, ShieldCheck, 
  FileText, HeartHandshake, AlertTriangle 
} from 'lucide-react';

export default function HospitalAdmissionInfoSection({ hospital }) {
  const hospitalName = hospital?.name || hospital?.facility_name || 'Square Hospital';

  return (
    <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/70 p-5 sm:p-6 lg:p-8 space-y-6 scroll-mt-24" id="admission-section">
      {/* Header */}
      <div className="border-b border-outline-variant/50 pb-5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-1.5">
          <Info className="w-3.5 h-3.5" />
          <span>Patient Guidelines</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
          Visitor Guidelines & Admission Procedure
        </h2>
        <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
          Essential protocols for planned admissions, emergency triage, and visitor regulations at {hospitalName}.
        </p>
      </div>

      {/* 3 Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Visiting Hours */}
        <div className="p-5 rounded-xl border border-outline-variant bg-surface-container-low/40 space-y-3">
          <div className="flex items-center gap-2.5 text-primary">
            <Clock className="w-5 h-5" />
            <h4 className="text-sm font-bold text-on-surface">Visiting Hours</h4>
          </div>

          <div className="space-y-2.5 text-xs text-on-surface-variant">
            <div>
              <p className="font-semibold text-on-surface">General Wards & Cabins:</p>
              <p>Morning: 11:00 AM – 12:30 PM</p>
              <p>Evening: 05:00 PM – 07:00 PM</p>
            </div>

            <div className="pt-2 border-t border-outline-variant/40">
              <p className="font-semibold text-error">ICU, CCU & NICU:</p>
              <p>Strictly 1 visitor at a time (04:30 PM – 05:30 PM)</p>
              <p className="text-[11px] text-outline mt-0.5">Protective gown & mask required.</p>
            </div>
          </div>
        </div>

        {/* Card 2: Required Documents */}
        <div className="p-5 rounded-xl border border-outline-variant bg-surface-container-low/40 space-y-3">
          <div className="flex items-center gap-2.5 text-secondary">
            <FileText className="w-5 h-5" />
            <h4 className="text-sm font-bold text-on-surface">Admission Checklist</h4>
          </div>

          <ul className="text-xs text-on-surface-variant space-y-2">
            <li className="flex items-start gap-2">
              <CheckSquare className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span>Registered Physician's admission advice prescription.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckSquare className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span>Patient's NID / Passport and 2 passport photos.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckSquare className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span>Previous investigation reports and medications.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckSquare className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span>Corporate insurance / health card if applicable.</span>
            </li>
          </ul>
        </div>

        {/* Card 3: Insurance & TPA Desk */}
        <div className="p-5 rounded-xl border border-outline-variant bg-surface-container-low/40 space-y-3">
          <div className="flex items-center gap-2.5 text-tertiary">
            <ShieldCheck className="w-5 h-5" />
            <h4 className="text-sm font-bold text-on-surface">Cashless TPA Desk</h4>
          </div>

          <p className="text-xs text-on-surface-variant leading-relaxed">
            Direct cashless billing settlements available for accredited domestic and international health insurers:
          </p>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {['MetLife', 'Green Delta', 'Delta Life', 'Pragati Life', 'Bupa Global', 'Cigna'].map((ins) => (
              <span
                key={ins}
                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-container-lowest border border-outline-variant text-slate-700"
              >
                {ins}
              </span>
            ))}
          </div>

          <p className="text-[11px] text-outline pt-1">
            Located on Ground Floor, Tower A (Desk 6).
          </p>
        </div>
      </div>
    </section>
  );
}
