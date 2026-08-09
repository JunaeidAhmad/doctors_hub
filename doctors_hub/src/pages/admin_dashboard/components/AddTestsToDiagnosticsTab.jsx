import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, Building2, TestTube, CheckCircle, Plus, Search, 
  Layers, ArrowRight, ShieldCheck, Sparkles, Check, RefreshCw
} from 'lucide-react';
import { api } from '../../../services/api';

export default function AddTestsToDiagnosticsTab({
  diagnosticCenters = [],
  setDiagnosticCenters,
  hospitals = [],
  setHospitals,
  tests = [],
  testCategories = [],
  branchTests = [],
  setBranchTests,
  showNotification,
  setActiveTab
}) {
  const [facilityType, setFacilityType] = useState('diagnostic_center'); // 'diagnostic_center' | 'hospital'
  const [selectedCenterId, setSelectedCenterId] = useState(diagnosticCenters[0]?.id || '');
  const [selectedHospitalId, setSelectedHospitalId] = useState(hospitals[0]?.id || '');
  const [selectedCatIds, setSelectedCatIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // When facility selection or type changes, pre-populate existing category associations
  useEffect(() => {
    if (facilityType === 'diagnostic_center') {
      const center = diagnosticCenters.find(dc => String(dc.id) === String(selectedCenterId));
      if (center && Array.isArray(center.test_category_ids)) {
        setSelectedCatIds(center.test_category_ids.map(id => id.toString()));
      } else {
        // Find categories of tests already in branchTests for this center
        const existingBranchTestIds = branchTests
          .filter(bt => String(bt.center?.id || bt.center) === String(selectedCenterId))
          .map(bt => bt.test?.id || bt.test);
        
        const existingCatIds = new Set();
        tests.forEach(t => {
          if (existingBranchTestIds.includes(t.id) || existingBranchTestIds.includes(t.id?.toString())) {
            const catId = t.category || t.category_id;
            if (catId) existingCatIds.add(catId.toString());
          }
        });
        setSelectedCatIds(Array.from(existingCatIds));
      }
    } else {
      const hospital = hospitals.find(h => String(h.id) === String(selectedHospitalId));
      if (hospital && Array.isArray(hospital.test_category_ids)) {
        setSelectedCatIds(hospital.test_category_ids.map(id => id.toString()));
      } else {
        const existingBranchTestIds = branchTests
          .filter(bt => String(bt.hospital?.id || bt.hospital) === String(selectedHospitalId))
          .map(bt => bt.test?.id || bt.test);
        
        const existingCatIds = new Set();
        tests.forEach(t => {
          if (existingBranchTestIds.includes(t.id) || existingBranchTestIds.includes(t.id?.toString())) {
            const catId = t.category || t.category_id;
            if (catId) existingCatIds.add(catId.toString());
          }
        });
        setSelectedCatIds(Array.from(existingCatIds));
      }
    }
  }, [facilityType, selectedCenterId, selectedHospitalId, diagnosticCenters, hospitals, branchTests, tests]);

  const currentFacility = facilityType === 'diagnostic_center'
    ? diagnosticCenters.find(dc => String(dc.id) === String(selectedCenterId))
    : hospitals.find(h => String(h.id) === String(selectedHospitalId));

  const validTestCategories = testCategories.filter(c => c.id !== 'all');

  // Toggle selection of a test category
  const toggleCategory = (catId) => {
    const stringId = catId.toString();
    setSelectedCatIds(prev => 
      prev.includes(stringId) 
        ? prev.filter(id => id !== stringId)
        : [...prev, stringId]
    );
  };

  const handleSelectAllCats = () => {
    setSelectedCatIds(validTestCategories.map(c => c.id.toString()));
  };

  const handleDeselectAllCats = () => {
    setSelectedCatIds([]);
  };

  // Tests automatically associated under the selected categories
  const associatedTests = tests.filter(t => {
    const catId = (t.category || t.category_id || '').toString();
    return selectedCatIds.includes(catId);
  });

  // Handle Bulk Saving/Associating Test Categories to Facility
  const handleSaveAssociations = async () => {
    if (!currentFacility) {
      alert("Please select a facility first.");
      return;
    }
    setIsSaving(true);
    try {
      const isHosp = facilityType === 'hospital';
      const facilityId = currentFacility.id;
      const facilityName = currentFacility.name;
      const facilityBranch = currentFacility.branch || 'Main';

      // 1. Update facility's test_category_ids state
      if (!isHosp && setDiagnosticCenters) {
        setDiagnosticCenters(prev => prev.map(dc => 
          String(dc.id) === String(facilityId) 
            ? { ...dc, test_category_ids: selectedCatIds } 
            : dc
        ));
      } else if (isHosp && setHospitals) {
        setHospitals(prev => prev.map(h => 
          String(h.id) === String(facilityId) 
            ? { ...h, test_category_ids: selectedCatIds } 
            : h
        ));
      }

      // 2. Attach associated tests into branchTests array
      const newBranchTests = [...branchTests];
      let newAttachCount = 0;

      for (const testObj of associatedTests) {
        const testId = testObj.id;
        const exists = newBranchTests.some(bt => {
          const sameTest = String(bt.test?.id || bt.test) === String(testId);
          if (isHosp) {
            return sameTest && String(bt.hospital?.id || bt.hospital) === String(facilityId);
          } else {
            return sameTest && String(bt.center?.id || bt.center) === String(facilityId);
          }
        });

        if (!exists) {
          newAttachCount++;
          const entry = {
            id: `bt-${facilityType}-${facilityId}-${testId}-${Date.now()}`,
            facility_type: facilityType,
            center: !isHosp ? facilityId : null,
            center_name: !isHosp ? facilityName : '',
            center_branch: !isHosp ? facilityBranch : '',
            hospital: isHosp ? facilityId : null,
            hospital_name: isHosp ? facilityName : '',
            hospital_branch: isHosp ? facilityBranch : '',
            test: testId,
            test_name: testObj.name,
            original_price: testObj.originalPrice || 700,
            discount: '20% OFF',
            price: testObj.price || 560
          };
          newBranchTests.unshift(entry);

          // Call API async for persistence
          try {
            await api.createDiagnosticCenterTest({
              center: !isHosp ? facilityId : null,
              hospital: isHosp ? facilityId : null,
              test: testId,
              price: testObj.price || 560,
              original_price: testObj.originalPrice || 700,
              discount: '20% OFF',
              is_available: true
            });
          } catch (e) {
            // Silence API fallback
          }
        }
      }

      if (setBranchTests) {
        setBranchTests(newBranchTests);
      }

      showNotification && showNotification(
        `Associated ${selectedCatIds.length} test categories (${associatedTests.length} tests) with ${facilityName} (${facilityBranch})!`
      );
    } catch (err) {
      alert(`Error saving test category associations: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Category-Based Test Association</span>
          </div>
          <h2 className="text-2xl font-black text-white">Add Test Categories to Diagnostics & Labs</h2>
          <p className="text-xs text-slate-400 mt-1">
            Assign entire test categories to a diagnostic center or hospital lab. All tests under selected categories will automatically be associated with that facility.
          </p>
        </div>

        <button
          onClick={() => setActiveTab && setActiveTab('branch-tests')}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-2 border border-slate-700 transition shrink-0"
        >
          <TestTube className="w-4 h-4 text-cyan-400" />
          <span>View All Test Offerings & Price List</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* STEP 1: FACILITY SELECTION CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
          <Building2 className="w-4 h-4 text-cyan-400" />
          <span>Step 1: Select Facility Type & Facility</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Facility Type Selector Toggle */}
          <div>
            <label className="block text-slate-300 text-xs font-bold mb-1.5">Facility Type</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setFacilityType('diagnostic_center');
                  if (diagnosticCenters[0]) setSelectedCenterId(diagnosticCenters[0].id);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  facilityType === 'diagnostic_center'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5" /> Diagnostic Center
              </button>
              <button
                type="button"
                onClick={() => {
                  setFacilityType('hospital');
                  if (hospitals[0]) setSelectedHospitalId(hospitals[0].id);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  facilityType === 'hospital'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" /> Hospital Lab
              </button>
            </div>
          </div>

          {/* Facility Selector Dropdown */}
          <div className="md:col-span-2">
            <label className="block text-slate-300 text-xs font-bold mb-1.5">
              Select {facilityType === 'diagnostic_center' ? 'Diagnostic Center Branch' : 'Hospital Lab'}
            </label>
            {facilityType === 'diagnostic_center' ? (
              <select
                value={selectedCenterId}
                onChange={e => setSelectedCenterId(e.target.value)}
                className="w-full bg-slate-950 border border-cyan-500/50 rounded-xl px-4 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-cyan-400"
              >
                {diagnosticCenters.map(dc => (
                  <option key={dc.id} value={dc.id}>
                    {dc.name} ({dc.branch || 'Main Branch'}) — {dc.district || 'Dhaka'}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={selectedHospitalId}
                onChange={e => setSelectedHospitalId(e.target.value)}
                className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl px-4 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-400"
              >
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.branch || 'Main Branch'}) — {h.district || 'Dhaka'}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Selected Facility Status Summary Pill */}
        {currentFacility && (
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              {facilityType === 'diagnostic_center' ? (
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <FlaskConical className="w-4 h-4" />
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Building2 className="w-4 h-4" />
                </div>
              )}
              <div>
                <span className="text-white font-black">{currentFacility.name}</span>
                <span className="text-slate-400 font-semibold ml-2">({currentFacility.branch || 'Main'})</span>
                <span className="text-slate-500 ml-2">• {currentFacility.address || currentFacility.district}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg font-bold text-[11px]">
                {selectedCatIds.length} Categories Selected
              </span>
              <span className="px-2.5 py-1 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-lg font-bold text-[11px]">
                {associatedTests.length} Tests Auto-Associated
              </span>
            </div>
          </div>
        )}
      </div>

      {/* STEP 2: CATEGORY MULTI-SELECT SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
            <Layers className="w-4 h-4 text-teal-400" />
            <span>Step 2: Select Test Categories to Associate</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAllCats}
              className="px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold transition"
            >
              Select All ({validTestCategories.length})
            </button>
            <button
              type="button"
              onClick={handleDeselectAllCats}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 rounded-xl text-xs font-semibold transition"
            >
              Clear Selection
            </button>
          </div>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {validTestCategories.map(cat => {
            const stringId = cat.id.toString();
            const isSelected = selectedCatIds.includes(stringId);

            // Count tests under this category
            const categoryTestsCount = tests.filter(t => (t.category || t.category_id || '').toString() === stringId).length;

            return (
              <div
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between select-none ${
                  isSelected 
                    ? 'bg-gradient-to-br from-teal-950/70 to-slate-900 border-teal-500/60 shadow-lg shadow-teal-500/10 scale-[1.01]' 
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40 text-slate-400'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl border ${
                      isSelected 
                        ? 'bg-teal-500/20 border-teal-500/40 text-teal-300' 
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}>
                      <TestTube className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                        {cat.name}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {categoryTestsCount} base tests under this category
                      </p>
                    </div>
                  </div>

                  <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                    isSelected 
                      ? 'bg-teal-500 border-teal-400 text-slate-950' 
                      : 'border-slate-700 bg-slate-900 text-transparent'
                  }`}>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>

                {cat.description && (
                  <p className="text-[10px] text-slate-500 truncate pt-1 border-t border-slate-800/60 mt-1">
                    {cat.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 3: LIVE PREVIEW OF AUTO-ASSOCIATED TESTS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4">
        <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
              <TestTube className="w-4 h-4 text-amber-400" />
              <span>Step 3: Auto-Associated Tests Preview ({associatedTests.length} Tests)</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              These tests belong to the selected test categories and will be associated with {currentFacility?.name || 'this facility'}.
            </p>
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search associated tests..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4">Test Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Fasting Required</th>
                <th className="py-3 px-4">Est. Original Price</th>
                <th className="py-3 px-4">Offer Price (20% OFF)</th>
                <th className="py-3 px-4 text-right">Association Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {associatedTests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500 text-xs font-semibold">
                    No test categories selected yet. Select test categories above to auto-associate tests.
                  </td>
                </tr>
              ) : (
                associatedTests
                  .filter(t => `${t.name} ${t.category_name}`.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(t => (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-bold text-white">
                        <div className="flex items-center gap-1.5">
                          <TestTube className="w-3.5 h-3.5 text-amber-400" />
                          <span>{t.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-teal-300 font-semibold">
                        {t.category_name || t.category || 'General'}
                      </td>
                      <td className="py-3 px-4">
                        {t.fasting_required ? (
                          <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-[10px] font-bold">Yes (Fasting)</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded text-[10px]">No</span>
                        )}
                      </td>
                      <td className="py-3 px-4 line-through text-slate-500 font-mono">
                        ৳{t.originalPrice || 700}
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-black font-mono text-sm">
                        ৳{t.price || 560}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold">
                          <CheckCircle className="w-3 h-3 text-emerald-400" /> Auto-Associated
                        </span>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SAVE / ASSOCIATE BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4 sticky bottom-4 z-20 backdrop-blur-xl bg-slate-900/90">
        <div>
          <div className="text-white font-bold text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Ready to Associate Categories</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Associating {selectedCatIds.length} categories ({associatedTests.length} tests) to {currentFacility?.name || 'selected facility'}.
          </p>
        </div>

        <button
          type="button"
          disabled={isSaving || !currentFacility || selectedCatIds.length === 0}
          onClick={handleSaveAssociations}
          className="px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-600/30 transition flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          <span>Associate {selectedCatIds.length} Categories ({associatedTests.length} Tests) to {currentFacility?.branch || 'Facility'}</span>
        </button>
      </div>

    </div>
  );
}
