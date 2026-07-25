import React, { useState, useMemo } from 'react';
import { FlaskConical, Home, Clock, FileText, ArrowLeft, Percent, Filter, ArrowRight, X, ShieldCheck } from 'lucide-react';
import { PATHOLOGY_TESTS } from '../data/mockData';

export default function PathologySearchPage({
  initialTest = '',
  onBookLabTest,
  onNavigateHome
}) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchKeyword, setSearchKeyword] = useState(initialTest);
  const [fastingOnly, setFastingOnly] = useState('All');
  const [maxPrice, setMaxPrice] = useState(5000);

  const categories = useMemo(() => {
    return Array.from(new Set(PATHOLOGY_TESTS.map(t => t.category)));
  }, []);

  const filteredTests = useMemo(() => {
    return PATHOLOGY_TESTS.filter((test) => {
      // Category filter
      if (selectedCategory && test.category !== selectedCategory) {
        return false;
      }
      // Price filter
      if (test.price > maxPrice) {
        return false;
      }
      // Fasting filter
      if (fastingOnly === 'Yes' && !test.fastingRequired) return false;
      if (fastingOnly === 'No' && test.fastingRequired) return false;

      // Keyword filter
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        const matchesName = test.name.toLowerCase().includes(q) || test.category.toLowerCase().includes(q) || test.description.toLowerCase().includes(q);
        if (!matchesName) return false;
      }

      return true;
    });
  }, [selectedCategory, searchKeyword, fastingOnly, maxPrice]);

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
                <span>Dedicated Pathology & Diagnostics Search Page</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">
                Test Pathology & Diagnostic Packages
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Showing <strong className="text-teal-300">{filteredTests.length} diagnostic test profiles</strong> with free doorstep sample collection across Bangladesh.
              </p>
            </div>

            {/* Quick Filter Input Bar */}
            <div className="bg-slate-800/90 border border-slate-700/80 p-3 rounded-2xl flex flex-wrap sm:flex-nowrap items-center gap-2 max-w-xl w-full">
              <input
                type="text"
                placeholder="Search test name (e.g. CBC, CT Scan, USG)..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full bg-slate-900 text-white text-xs font-medium border border-slate-700 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-teal-400"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:w-auto bg-slate-900 text-white text-xs font-semibold border border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-400"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filter Chips */}
          <div className="mt-4 flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-400 font-semibold">Active Filters:</span>
            {selectedCategory && (
              <span className="bg-teal-500/20 border border-teal-400/40 text-teal-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                Category: {selectedCategory}
                <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setSelectedCategory('')} />
              </span>
            )}
            {searchKeyword && (
              <span className="bg-teal-500/20 border border-teal-400/40 text-teal-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                Keyword: "{searchKeyword}"
                <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setSearchKeyword('')} />
              </span>
            )}
            {fastingOnly !== 'All' && (
              <span className="bg-teal-500/20 border border-teal-400/40 text-teal-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                Fasting: {fastingOnly}
                <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setFastingOnly('All')} />
              </span>
            )}
            {(selectedCategory || searchKeyword || fastingOnly !== 'All') && (
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSearchKeyword('');
                  setFastingOnly('All');
                  setMaxPrice(5000);
                }}
                className="text-slate-400 hover:text-white underline ml-2"
              >
                Reset Filters
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Page Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* LEFT SIDEBAR FILTERS */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-5">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-teal-600" />
                  <span>Lab Filters</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-semibold">{filteredTests.length} Profiles</span>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Test Category:
                </label>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedCategory === '' ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selectedCategory === cat ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fasting filter */}
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Fasting Requirement:
                </label>
                <select
                  value={fastingOnly}
                  onChange={(e) => setFastingOnly(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                >
                  <option value="All">All Tests</option>
                  <option value="Yes">Fasting Needed Only</option>
                  <option value="No">No Fasting Required</option>
                </select>
              </div>

              {/* Max Price */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1">
                  <span>Max Test Price:</span>
                  <span className="text-teal-700">৳{maxPrice}</span>
                </div>
                <input
                  type="range"
                  min="400"
                  max="5000"
                  step="200"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-teal-700">
                  <Home className="w-4 h-4" />
                  <span>Free Home Collection</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Lab sample collectors arrive at your doorstep in sterile containers across all major BD cities.
                </p>
              </div>

            </div>
          </div>

          {/* RIGHT RESULTS LISTING */}
          <div className="lg:col-span-3">
            {filteredTests.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <FlaskConical className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800">No Pathology Tests Found</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Try clearing your category or price filters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTests.map((test) => (
                  <div
                    key={test.id}
                    className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-md hover:shadow-xl hover:border-teal-400 transition-all duration-300 flex flex-col justify-between"
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
                      <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                        {test.description}
                      </p>

                      <div className="space-y-2 text-xs text-slate-600 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Clock className="w-3.5 h-3.5 text-teal-600" /> Report Turnaround:
                          </span>
                          <span className="font-semibold text-slate-800">{test.reportTime}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <FileText className="w-3.5 h-3.5 text-teal-600" /> Fasting Needed:
                          </span>
                          <span className="font-semibold text-slate-800">
                            {test.fastingRequired ? 'Yes (10-12 Hours Fasting)' : 'No Fasting Required'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-400 line-through font-semibold">
                          ৳{test.originalPrice}
                        </div>
                        <div className="text-2xl font-black text-slate-900">
                          ৳{test.price}
                        </div>
                      </div>

                      <button
                        onClick={() => onBookLabTest(test)}
                        className="px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                      >
                        <span>Book Test Sample</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
