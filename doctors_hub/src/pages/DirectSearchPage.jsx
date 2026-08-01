import React, { useState, useMemo } from 'react';
import { Search, ArrowLeft, Stethoscope, Building2, FlaskConical, MapPin, Calendar, Clock, ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';
import { OPD_CHAMBERS, PATHOLOGY_TESTS } from '../data/mockData';

export default function DirectSearchPage({
  initialKeyword = '',
  onBookDoctorSlot,
  onBookLabTest,
  onNavigateHome
}) {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [activeTab, setActiveTab] = useState('doctors'); // 'doctors' | 'chambers' | 'pathology'

  // Extract all doctors matching keyword
  const matchingDoctorsList = useMemo(() => {
    if (!keyword.trim()) {
      // Return all doctors if keyword empty
      return OPD_CHAMBERS.flatMap(c => c.doctors.map(d => ({ ...d, chamber: c })));
    }
    const q = keyword.toLowerCase();
    const list = [];
    OPD_CHAMBERS.forEach((chamber) => {
      chamber.doctors.forEach((doc) => {
        if (
          doc.name.toLowerCase().includes(q) ||
          doc.specialty.toLowerCase().includes(q) ||
          doc.qualification.toLowerCase().includes(q) ||
          chamber.name.toLowerCase().includes(q) ||
          chamber.location.toLowerCase().includes(q)
        ) {
          list.push({ ...doc, chamber });
        }
      });
    });
    return list;
  }, [keyword]);

  // Extract matching chambers
  const matchingChambersList = useMemo(() => {
    if (!keyword.trim()) return OPD_CHAMBERS;
    const q = keyword.toLowerCase();
    return OPD_CHAMBERS.filter((c) => {
      const matchesChamber = c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q) || c.city.toLowerCase().includes(q);
      const matchesDocs = c.doctors.some(d => d.name.toLowerCase().includes(q) || d.specialty.toLowerCase().includes(q));
      return matchesChamber || matchesDocs;
    });
  }, [keyword]);

  // Extract matching pathology tests
  const matchingPathologyList = useMemo(() => {
    if (!keyword.trim()) return PATHOLOGY_TESTS;
    const q = keyword.toLowerCase();
    return PATHOLOGY_TESTS.filter(t => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
  }, [keyword]);

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      
      {/* Search Header Banner */}
      <div className="bg-slate-900 text-white pt-8 pb-12 px-4 sm:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto">
          
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
                <Search className="w-3.5 h-3.5" />
                <span>Global Direct Keyword Search Engine</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">
                {keyword ? `Search Results for "${keyword}"` : 'Direct Search Engine'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Found <strong className="text-emerald-400">{matchingDoctorsList.length} Doctors</strong>, <strong className="text-teal-300">{matchingChambersList.length} Chambers</strong>, and <strong className="text-cyan-300">{matchingPathologyList.length} Diagnostic Tests</strong>.
              </p>
            </div>

            {/* Keyword Search Input */}
            <div className="bg-slate-800/90 border border-slate-700/80 p-3 rounded-2xl max-w-md w-full">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type doctor name, specialty, or clinic..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full bg-slate-900 text-white text-xs font-medium border border-slate-700 rounded-xl pl-3.5 pr-10 py-3 focus:outline-none focus:border-emerald-500"
                />
                <Search className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Result Categories Tabs */}
          <div className="mt-8 flex border-b border-slate-800 gap-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('doctors')}
              className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'doctors'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Matching Doctors ({matchingDoctorsList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('chambers')}
              className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'chambers'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Matching OPD Chambers ({matchingChambersList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('pathology')}
              className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'pathology'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              <span>Matching Diagnostic Tests ({matchingPathologyList.length})</span>
            </button>
          </div>

        </div>
      </div>

      {/* Results Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
        
        {/* TAB 1: MATCHING DOCTORS */}
        {activeTab === 'doctors' && (
          <div>
            {matchingDoctorsList.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 max-w-lg mx-auto">
                <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800">No Doctors Found</h3>
                <p className="text-xs text-slate-500 mt-1">
                  No visiting doctors matched "{keyword}". Try searching for another name or specialty.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {matchingDoctorsList.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-md hover:shadow-xl hover:border-emerald-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center text-lg shrink-0">
                            {item.name.split(' ').slice(-1)[0][0]}
                          </div>
                          <div>
                            <h3 className="font-extrabold text-slate-900 text-base">
                              {item.name}
                            </h3>
                            <p className="text-xs font-semibold text-emerald-700">
                              {item.specialty} • {item.experience}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md shrink-0">
                          ৳{item.fee}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 font-medium mt-2">
                        {item.qualification}
                      </p>

                      {/* Chamber Details */}
                      <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs space-y-1">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{item.chamber.name}</span>
                        </div>
                        <div className="text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{item.chamber.location}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-600 pt-1">
                          <span><Calendar className="w-3 h-3 text-emerald-600 inline mr-1" />{item.visitDays}</span>
                          <span><Clock className="w-3 h-3 text-emerald-600 inline mr-1" />{item.visitTime}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 mt-4 flex justify-end">
                      <button
                        onClick={() => onBookDoctorSlot(item.chamber, item)}
                        className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                      >
                        <span>Book Serial Ticket</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MATCHING CHAMBERS */}
        {activeTab === 'chambers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matchingChambersList.map((chamber) => (
              <div
                key={chamber.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-md hover:shadow-xl transition-all overflow-hidden p-5 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">{chamber.name}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">{chamber.tagline}</p>
                    <p className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {chamber.location}
                    </p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
                    {chamber.city}
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                  <div className="font-bold text-slate-700">Visiting Doctors ({chamber.doctors.length}):</div>
                  {chamber.doctors.map(d => (
                    <div key={d.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                      <div>
                        <span className="font-bold text-slate-900">{d.name}</span>
                        <span className="text-[11px] text-slate-500 block">{d.specialty}</span>
                      </div>
                      <button
                        onClick={() => onBookDoctorSlot(chamber, d)}
                        className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px]"
                      >
                        Book Serial
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: MATCHING PATHOLOGY PACKAGES */}
        {activeTab === 'pathology' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {matchingPathologyList.map((test) => (
              <div
                key={test.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-100 px-2 py-0.5 rounded">
                    {test.category}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base mt-2">{test.name}</h3>
                  <p className="text-xs text-slate-600 mt-1">{test.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                  <div className="text-lg font-black text-slate-900">৳{test.price}</div>
                  <button
                    onClick={() => onBookLabTest(test)}
                    className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs"
                  >
                    Book Test
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}
