import React, { useEffect, useState } from 'react';
import { FlaskConical, Home, FileText, ArrowRight, Clock, Percent } from 'lucide-react';
import { PATHOLOGY_TESTS as MOCK_TESTS } from '../data/mockData';
import { api } from '../services/api';

export default function PathologySection({ onBookLabTest, selectedTest }) {
  const [tests, setTests] = useState(MOCK_TESTS);

  useEffect(() => {
    let isMounted = true;
    api.getTests()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          // Normalize DRF field names (snake_case -> camelCase fallback)
          const normalized = data.map(t => ({
            ...t,
            originalPrice: t.original_price || t.originalPrice,
            fastingRequired: t.fasting_required !== undefined ? t.fasting_required : t.fastingRequired,
            reportTime: t.report_time || t.reportTime
          }));
          setTests(normalized);
        }
      })
      .catch((err) => {
        console.warn("Using mock pathology tests fallback", err);
      });
    return () => { isMounted = false; };
  }, []);

  const filteredTests = selectedTest
    ? tests.filter(t => t.name.toLowerCase().includes(selectedTest.toLowerCase()))
    : tests;

  return (
    <section id="pathology" className="py-16 px-4 sm:px-8 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold uppercase tracking-wider mb-2">
              <FlaskConical className="w-3.5 h-3.5 text-teal-600" />
              <span>NABL & DGHS Approved Diagnostics</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Test Pathology & Health Checkup Packages
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Free home blood sample pickup, digital WhatsApp report delivery, and verified lab partners.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-2 rounded-xl">
            <Home className="w-4 h-4 text-teal-600" />
            <span>100% Doorstep Home Sample Pickup Available</span>
          </div>
        </div>

        {/* TEST CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test) => (
            <div
              key={test.id}
              className="bg-slate-50 rounded-2xl p-6 border border-slate-200/90 hover:border-teal-400 hover:bg-white hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-700 bg-teal-100 px-2.5 py-0.5 rounded-md">
                    {test.category}
                  </span>
                  <span className="text-xs font-extrabold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                    <Percent className="w-3 h-3" />
                    {test.discount}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  {test.name}
                </h3>
                <p className="text-xs text-slate-600 mb-4 line-clamp-2">
                  {test.description}
                </p>

                <div className="space-y-2 text-xs text-slate-600 mb-6 bg-white p-3 rounded-xl border border-slate-200/60">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-teal-600" /> Report Time:
                    </span>
                    <span className="font-semibold text-slate-800">{test.reportTime || test.report_time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <FileText className="w-3.5 h-3.5 text-teal-600" /> Fasting:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {(test.fastingRequired || test.fasting_required) ? '10-12 Hrs Fasting Needed' : 'No Fasting Required'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price & Book Button */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div>
                  {(test.originalPrice || test.original_price) && (
                    <div className="text-xs text-slate-400 line-through font-semibold">
                      ৳{test.originalPrice || test.original_price}
                    </div>
                  )}
                  <div className="text-xl font-black text-slate-900">
                    ৳{test.price}
                  </div>
                </div>

                <button
                  onClick={() => onBookLabTest(test)}
                  className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <span>Book Test</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
