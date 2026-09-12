import React, { useState } from 'react';
import { 
  FlaskConical, Truck, Activity, Heart, 
  TestTube2, Sparkles, Clock, ArrowRight, Search 
} from 'lucide-react';

const STITCH_FEATURED_DIAGNOSTICS = [
  {
    id: 'diag-mri-3t',
    name: '3.0 Tesla Silent MRI',
    badge: 'High Resolution',
    badgeColor: 'text-primary',
    iconBg: 'bg-primary/10 text-primary',
    icon: Activity,
    description: 'Whole body, neurovascular, cardiac and musculoskeletal high definition scanning.',
    turnaround: 'Report in 12 Hrs',
    price: 14500,
    category: 'Radiology & Imaging',
  },
  {
    id: 'diag-ct-128',
    name: '128-Slice Cardiac CT',
    badge: 'Multi-Slice Imaging',
    badgeColor: 'text-secondary',
    iconBg: 'bg-secondary/10 text-secondary',
    icon: Activity,
    description: 'Coronary angiography and ultra-fast pulmonary calcium scoring with minimal radiation.',
    turnaround: 'Report in 8 Hrs',
    price: 11000,
    category: 'Radiology & Imaging',
  },
  {
    id: 'diag-echo-cath',
    name: 'Echo & Cath Lab',
    badge: 'Interventional Suite',
    badgeColor: 'text-tertiary',
    iconBg: 'bg-tertiary/10 text-tertiary',
    icon: Heart,
    description: 'Color 4D Doppler echocardiography, transesophageal echo and diagnostic angiograms.',
    turnaround: 'Same Day Report',
    price: 4500,
    category: 'Cardiology Diagnostics',
  },
  {
    id: 'diag-health-panel',
    name: 'Executive Health Panel',
    badge: 'Automated Clinical Lab',
    badgeColor: 'text-primary',
    iconBg: 'bg-primary-fixed-dim/30 text-primary',
    icon: TestTube2,
    description: 'Complete CBC, Lipid Profile, HbA1c, LFT, Serum Creatinine and Thyroid screen.',
    turnaround: 'Report in 4 Hrs',
    price: 5800,
    category: 'Clinical Pathology',
  },
];

export default function HospitalDiagnosticsSection({ 
  hospital, 
  onBookLabTest 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllTests, setShowAllTests] = useState(false);

  const rawTests = hospital?.offered_tests || [];
  const hasOfferedTests = rawTests.length > 0;

  const handleBook = (test) => {
    if (onBookLabTest) {
      onBookLabTest({
        id: test.id,
        name: test.name || test.test_name || 'Diagnostic Procedure',
        price: test.price || test.calculated_price || 0,
        facility_name: hospital?.name || hospital?.facility_name || 'Square Hospital',
        branch_name: hospital?.branch || '',
        category: test.category || 'Diagnostic',
      });
    }
  };

  // Filtered backend tests if available
  const filteredBackendTests = rawTests.filter(t => {
    const tName = t.test_details?.name || t.name || '';
    const tCat = t.test_details?.category_name || t.category_name || '';
    return tName.toLowerCase().includes(searchTerm.toLowerCase()) || tCat.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/70 p-5 sm:p-6 lg:p-8 space-y-6 scroll-mt-24" id="diagnostics-section">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/50 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary text-xs font-semibold mb-1.5">
            <FlaskConical className="w-3.5 h-3.5 text-secondary" />
            <span>Diagnostic Division</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
            In-House Diagnostic & Precision Lab Facilities
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Automated clinical pathology, digital radiology, and molecular genomics operating 24 hours daily.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-primary font-semibold bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/20">
            <Truck className="w-4 h-4 text-primary" />
            <span>Home Sample Collection Available</span>
          </div>
        </div>
      </div>

      {/* Featured 4-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {STITCH_FEATURED_DIAGNOSTICS.map((diag) => {
          const IconComponent = diag.icon;

          return (
            <div
              key={diag.id}
              className="p-5 rounded-xl border border-outline-variant bg-surface-container-low/40 hover:border-primary hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className={`w-12 h-12 rounded-xl ${diag.iconBg} flex items-center justify-center mb-4 shadow-2xs`}>
                  <IconComponent className="w-6 h-6" />
                </div>

                <span className={`text-[11px] font-bold ${diag.badgeColor} uppercase tracking-wider`}>
                  {diag.badge}
                </span>

                <h4 className="text-base font-bold text-on-surface mt-1">
                  {diag.name}
                </h4>

                <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                  {diag.description}
                </p>

                <div className="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between text-xs">
                  <span className="text-outline flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{diag.turnaround}</span>
                  </span>
                  <span className="text-base font-bold text-on-surface">
                    ৳{diag.price.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleBook(diag)}
                className="mt-4 w-full py-2.5 rounded-lg bg-surface-container-lowest border border-primary text-primary text-xs font-semibold hover:bg-primary hover:text-white transition-all cursor-pointer shadow-2xs"
              >
                Book Diagnostic Test
              </button>
            </div>
          );
        })}
      </div>

      {/* Optional: Full Hospital Diagnostic Catalog Search & Browse */}
      {hasOfferedTests && (
        <div className="mt-6 pt-6 border-t border-outline-variant/60">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-on-surface">
                Complete Laboratory & Pathology Catalog ({rawTests.length} Tests Available)
              </h3>
              <p className="text-xs text-on-surface-variant">
                Search and instant booking for all clinical diagnostic procedures offered at this facility.
              </p>
            </div>

            <button
              onClick={() => setShowAllTests(!showAllTests)}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{showAllTests ? 'Collapse Catalog' : 'Browse All Lab Tests'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {showAllTests && (
            <div className="space-y-4 pt-2">
              <div className="relative max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-outline" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter tests by name or category..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
                {filteredBackendTests.slice(0, 30).map((t) => {
                  const testDetails = t.test_details || {};
                  const testName = testDetails.name || t.name || 'Lab Test';
                  const price = Number(t.price || 0);

                  return (
                    <div
                      key={t.id}
                      className="p-3 rounded-lg border border-outline-variant/70 bg-surface-container-lowest flex items-center justify-between gap-3 hover:border-primary/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-on-surface truncate">{testName}</p>
                        <p className="text-[11px] text-outline truncate">{testDetails.category_name || 'General Pathology'}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-primary">৳{price.toLocaleString()}</p>
                        <button
                          onClick={() => handleBook(t)}
                          className="text-[11px] font-bold text-emerald-700 hover:underline mt-0.5 cursor-pointer block"
                        >
                          Book Slot
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
