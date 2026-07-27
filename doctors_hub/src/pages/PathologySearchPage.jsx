import React, { useState, useMemo, useEffect } from 'react';
import { FlaskConical, Home, Clock, FileText, ArrowLeft, Percent, Filter, ArrowRight, X, ShieldCheck, Building2 } from 'lucide-react';
import { PATHOLOGY_TESTS, BRANCH_TESTS } from '../data/mockData';
import { api } from '../services/api';

export default function PathologySearchPage({
  initialTest = '',
  onBookLabTest,
  onNavigateHome
}) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchKeyword, setSearchKeyword] = useState(initialTest);
  const [fastingOnly, setFastingOnly] = useState('All');
  const [maxPrice, setMaxPrice] = useState(5000);
  const [branchTests, setBranchTests] = useState(BRANCH_TESTS);

  useEffect(() => {
    let isMounted = true;
    api.getBranchTests()
      .then((data) => {
        if (isMounted && data && data.length > 0) setBranchTests(data);
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const categories = useMemo(() => {
    return Array.from(new Set(PATHOLOGY_TESTS.map(t => t.category)));
  }, []);

  // Group branch tests by test ID
  const testOfferingsMap = useMemo(() => {
    const map = {};
    branchTests.forEach(bt => {
      const tId = bt.test || bt.test_id || (bt.test_details && bt.test_details.id);
      if (tId) {
        if (!map[tId]) map[tId] = [];
        map[tId].push(bt);
      }
    });
    return map;
  }, [branchTests]);

  const filteredTests = useMemo(() => {
    return PATHOLOGY_TESTS.filter((test) => {
      if (selectedCategory && test.category !== selectedCategory) {
        return false;
      }
      if (fastingOnly === 'Yes' && !test.fastingRequired) return false;
      if (fastingOnly === 'No' && test.fastingRequired) return false;

      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        const matchesName = test.name.toLowerCase().includes(q) || test.category.toLowerCase().includes(q) || test.description.toLowerCase().includes(q);
        if (!matchesName) return false;
      }

      return true;
    });
  }, [selectedCategory, searchKeyword, fastingOnly]);

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-slate-950 text-white pt-8 pb-12 px-4 sm:px-8 border-b border-teal-900/60">
        <div className="max-w-7xl mx-auto">
          
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-teal-300 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold uppercase tracking-wider mb-2">
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Diagnostic Specific Lab Test Pricing</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">
                Pathology Tests & Diagnostic Center Selection
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Choose tests and compare prices across top verified diagnostic centers.
              </p>
            </div>

            {/* Quick Search Input */}
            <div className="bg-slate-800/90 border border-slate-700/80 p-3 rounded-2xl flex flex-wrap sm:flex-nowrap items-center gap-2 max-w-xl w-full">
              <input
                type="text"
                placeholder="Search test name (e.g. CBC, CT Scan, USG)..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full bg-slate-900 text-white text-xs font-medium border border-slate-700 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-teal-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Results Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Category Filter */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-teal-600" />
                  Categories
                </h3>
                {selectedCategory && (
                  <button onClick={() => setSelectedCategory('')} className="text-[11px] font-semibold text-rose-500 hover:underline">
                    Reset
                  </button>
                )}
              </div>

              <div className="space-y-1 text-xs">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-all ${
                    selectedCategory === '' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  All Pathology Tests
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded-xl font-medium transition-all ${
                      selectedCategory === cat ? 'bg-teal-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Test Cards with Diagnostic Offerings */}
          <div className="lg:col-span-3 space-y-6">
            {filteredTests.map((test) => {
              const offerings = testOfferingsMap[test.id] || [
                {
                  id: `default-${test.id}`,
                  branch_name: "Ibn Sina Diagnostic - Dhanmondi",
                  price: test.price || 450,
                  original_price: test.originalPrice || 600,
                  discount: test.discount || "25% OFF",
                  report_time: test.reportTime || "Same Day"
                },
                {
                  id: `default2-${test.id}`,
                  branch_name: "Popular Diagnostic - Panthapath",
                  price: (test.price || 450) + 50,
                  original_price: (test.originalPrice || 600) + 50,
                  discount: "20% OFF",
                  report_time: "Same Day (4 Hours)"
                }
              ];

              return (
                <div key={test.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 hover:border-teal-300 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-extrabold text-teal-800 bg-teal-100 px-2 py-0.5 rounded uppercase">
                        {test.category}
                      </span>
                      <h2 className="text-xl font-extrabold text-slate-900 mt-1">{test.name}</h2>
                      <p className="text-xs text-slate-500 mt-1">{test.description}</p>
                    </div>

                    {test.fastingRequired && (
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 shrink-0">
                        Fasting Required
                      </span>
                    )}
                  </div>

                  {/* Available Diagnostic Centers & Prices for this Test */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>Available Diagnostic Centers & Pricing:</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {offerings.map((offering) => (
                        <div key={offering.id} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div>
                            <div className="font-extrabold text-slate-800 text-xs">{offering.branch_name || 'Partner Diagnostic'}</div>
                            <div className="text-[11px] text-slate-500">Report: {offering.report_time || 'Same Day'}</div>
                            <div className="text-sm font-black text-teal-700 mt-1">{offering.price} BDT</div>
                          </div>

                          <button
                            onClick={() => onBookLabTest && onBookLabTest({
                              test: test,
                              branchTest: offering,
                              branch: { name: offering.branch_name }
                            })}
                            className="px-3.5 py-2 bg-teal-600 text-white rounded-xl font-bold text-xs hover:bg-teal-700 transition-colors shadow-xs"
                          >
                            Select & Book
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
