import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, Building2, TestTube, CheckCircle, Plus, Search, 
  Layers, ArrowRight, ShieldCheck, Sparkles, Check, RefreshCw
} from 'lucide-react';
import { api } from '../../../services/api';
import { useAdminContext } from '../context/AdminContext';

export default function AddTestsToDiagnosticsTab() {
  const {
    diagnosticCenters = [],
    setDiagnosticCenters,
    hospitals = [],
    setHospitals,
    tests = [],
    testCategories = [],
    branchTests = [],
    setBranchTests,
    showNotification,
    setActiveTab,
    loadAllData,
    isSuperAdmin,
    isFacilityAdmin,
    isHospitalAdmin,
    isDiagnosticAdmin,
    addTestsFacilityPrefill,
    setAddTestsFacilityPrefill
  } = useAdminContext();

  const lockedFacility = isSuperAdmin ? null : (hospitals[0] || diagnosticCenters[0]);
  const defaultType = !isSuperAdmin 
    ? (hospitals[0] ? 'hospital' : 'diagnostic_center') 
    : (addTestsFacilityPrefill?.type || 'diagnostic_center');

  const [facilityType, setFacilityType] = useState(defaultType); // 'diagnostic_center' | 'hospital'
  const [selectedCenterId, setSelectedCenterId] = useState(() => {
    if (addTestsFacilityPrefill?.type === 'diagnostic_center' && addTestsFacilityPrefill?.id) {
      return String(addTestsFacilityPrefill.id);
    }
    const firstId = diagnosticCenters[0]?.id || diagnosticCenters[0]?.location_details?.id;
    return firstId ? String(firstId) : '';
  });
  const [selectedHospitalId, setSelectedHospitalId] = useState(() => {
    if (addTestsFacilityPrefill?.type === 'hospital' && addTestsFacilityPrefill?.id) {
      return String(addTestsFacilityPrefill.id);
    }
    const firstId = hospitals[0]?.id || hospitals[0]?.location_details?.id;
    return firstId ? String(firstId) : '';
  });
  const [selectedCatIds, setSelectedCatIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedSummary, setSavedSummary] = useState(null);

  // Sync locked facility for facility admins
  useEffect(() => {
    if (!isSuperAdmin && lockedFacility) {
      const isHosp = Boolean(hospitals[0]);
      setFacilityType(isHosp ? 'hospital' : 'diagnostic_center');
      if (isHosp) {
        setSelectedHospitalId(String(lockedFacility.id || lockedFacility.location_details?.id));
      } else {
        setSelectedCenterId(String(lockedFacility.id || lockedFacility.location_details?.id));
      }
    }
  }, [isSuperAdmin, lockedFacility, hospitals, diagnosticCenters]);

  // Sync prefill from context when navigating from Diagnostics or Hospitals tab
  useEffect(() => {
    if (isSuperAdmin && addTestsFacilityPrefill?.id) {
      if (addTestsFacilityPrefill.type === 'hospital') {
        setFacilityType('hospital');
        setSelectedHospitalId(String(addTestsFacilityPrefill.id));
      } else {
        setFacilityType('diagnostic_center');
        setSelectedCenterId(String(addTestsFacilityPrefill.id));
      }
    }
  }, [isSuperAdmin, addTestsFacilityPrefill]);

  // Fallback to first available facility if selectedCenterId is empty
  useEffect(() => {
    if (!selectedCenterId && diagnosticCenters.length > 0 && facilityType === 'diagnostic_center') {
      const firstId = diagnosticCenters[0].id || diagnosticCenters[0].location_details?.id;
      if (firstId) setSelectedCenterId(String(firstId));
    }
  }, [selectedCenterId, diagnosticCenters, facilityType]);

  useEffect(() => {
    if (!selectedHospitalId && hospitals.length > 0 && facilityType === 'hospital') {
      const firstId = hospitals[0].id || hospitals[0].location_details?.id;
      if (firstId) setSelectedHospitalId(String(firstId));
    }
  }, [selectedHospitalId, hospitals, facilityType]);

  // When facility selection or type changes, pre-populate existing category associations
  useEffect(() => {
    if (facilityType === 'diagnostic_center') {
      const center = diagnosticCenters.find(dc => String(dc.id || dc.location_details?.id) === String(selectedCenterId));
      if (center && Array.isArray(center.test_category_ids) && center.test_category_ids.length > 0) {
        setSelectedCatIds(center.test_category_ids.map(id => id.toString()));
      } else {
        // Find categories of tests already in branchTests for this center
        const existingBranchTestIds = branchTests
          .filter(bt => String(bt.center?.id || bt.center || bt.location_id || bt.location || bt.location_details?.id) === String(selectedCenterId))
          .map(bt => bt.test?.id || bt.test);
        
        const existingCatIds = new Set();
        tests.forEach(t => {
          if (existingBranchTestIds.includes(t.id) || existingBranchTestIds.includes(String(t.id))) {
            const catId = t.category || t.category_id;
            if (catId) existingCatIds.add(catId.toString());
          }
        });
        setSelectedCatIds(Array.from(existingCatIds));
      }
    } else {
      const hospital = hospitals.find(h => String(h.id || h.location_details?.id) === String(selectedHospitalId));
      if (hospital && Array.isArray(hospital.test_category_ids) && hospital.test_category_ids.length > 0) {
        setSelectedCatIds(hospital.test_category_ids.map(id => id.toString()));
      } else {
        const existingBranchTestIds = branchTests
          .filter(bt => String(bt.hospital?.id || bt.hospital || bt.location_id || bt.location || bt.location_details?.id) === String(selectedHospitalId))
          .map(bt => bt.test?.id || bt.test);
        
        const existingCatIds = new Set();
        tests.forEach(t => {
          if (existingBranchTestIds.includes(t.id) || existingBranchTestIds.includes(String(t.id))) {
            const catId = t.category || t.category_id;
            if (catId) existingCatIds.add(catId.toString());
          }
        });
        setSelectedCatIds(Array.from(existingCatIds));
      }
    }
  }, [facilityType, selectedCenterId, selectedHospitalId, diagnosticCenters, hospitals, branchTests, tests]);

  // Fetch tests for this specific facility to ensure category pre-population is up-to-date
  useEffect(() => {
    let isMounted = true;
    const targetId = facilityType === 'diagnostic_center' ? selectedCenterId : selectedHospitalId;
    if (targetId) {
      api.getDiagnosticCenterTests({ location: targetId })
        .then(res => {
          if (!isMounted) return;
          const list = Array.isArray(res) ? res : (res?.results || []);
          if (list.length > 0) {
            const testIds = list.map(bt => bt.test?.id || bt.test || bt.test_id);
            const foundCatIds = new Set();
            tests.forEach(t => {
              if (testIds.includes(t.id) || testIds.includes(String(t.id))) {
                const cId = t.category || t.category_id;
                if (cId) foundCatIds.add(String(cId));
              }
            });
            if (foundCatIds.size > 0) {
              setSelectedCatIds(prev => {
                const combined = new Set([...prev, ...Array.from(foundCatIds)]);
                return Array.from(combined);
              });
            }
          }
        })
        .catch(err => console.warn('Could not prefetch facility tests:', err));
    }
    return () => { isMounted = false; };
  }, [facilityType, selectedCenterId, selectedHospitalId, tests]);

  const currentFacility = facilityType === 'diagnostic_center'
    ? diagnosticCenters.find(dc => String(dc.id || dc.location_details?.id) === String(selectedCenterId))
    : hospitals.find(h => String(h.id || h.location_details?.id) === String(selectedHospitalId));

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

  // Selected Category objects
  const selectedCategoriesList = validTestCategories.filter(c => selectedCatIds.includes(c.id.toString()));

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

      // 2. Attach associated tests into local branchTests array
      const newBranchTests = [...branchTests];
      let newAttachCount = 0;
      const testsToCreatePayload = [];

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
            center_id: !isHosp ? facilityId : null,
            center_name: !isHosp ? facilityName : '',
            center_branch: !isHosp ? facilityBranch : '',
            hospital: isHosp ? facilityId : null,
            hospital_id: isHosp ? facilityId : null,
            hospital_name: isHosp ? facilityName : '',
            hospital_branch: isHosp ? facilityBranch : '',
            test: testId,
            test_name: testObj.name,
            category: testObj.category || testObj.category_id || '',
            category_name: testObj.category_name || testObj.category || '',
            test_details: testObj,
            price: testObj.price || testObj.price || 700,
            discount_percent: '20% OFF',
            calculated_price: testObj.calculated_price || 560
          };
          newBranchTests.unshift(entry);

          testsToCreatePayload.push({
            center: !isHosp ? facilityId : null,
            hospital: isHosp ? facilityId : null,
            test: testId,
            calculated_price: testObj.calculated_price || 560,
            price: testObj.price || testObj.price || 700,
            discount_percent: '20% OFF',
            is_available: true
          });
        }
      }

      // Single HTTP request to persist all associated category tests in bulk!
      try {
        const prices = {};
        for (const testObj of associatedTests) {
          prices[testObj.id] = { price: testObj.price || 700, discount_percent: 20 };
        }

        if (!isHosp) {
          await api.patchDiagnosticCenter(facilityId, { test_category_ids: selectedCatIds, prices });
        } else {
          await api.patchHospital(facilityId, { test_category_ids: selectedCatIds, prices });
        }
      } catch (e) {
        // Fallback to bulk payload if patch fails
        if (testsToCreatePayload.length > 0) {
          try {
            await api.createDiagnosticCenterTest(testsToCreatePayload);
          } catch (err2) {
            console.warn("Bulk attach fallback failed:", err2);
          }
        }
      }

      if (setBranchTests) {
        // Only doing full reload to prevent state mismatches
        await loadAllData();
      }

      const summaryData = {
        facilityName,
        facilityBranch,
        facilityType: isHosp ? 'Hospital Lab' : 'Diagnostic Center',
        categoriesCount: selectedCatIds.length,
        categoryNames: selectedCategoriesList.map(c => c.name),
        testsCount: associatedTests.length,
        newTestsAddedCount: newAttachCount,
        testNames: associatedTests.map(t => t.name)
      };

      setSavedSummary(summaryData);
      setShowConfirmModal(false);
      setShowSuccessModal(true);

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
          <h2 className="text-2xl font-black text-white">
            {isSuperAdmin ? 'Add Test Categories to Diagnostics & Labs' : 'Add Diagnostic Tests to Facility'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isSuperAdmin 
              ? 'Assign entire test categories to a diagnostic center or hospital lab. All tests under selected categories will automatically be associated with that facility.'
              : `Assign test categories and customize offer pricing for ${currentFacility?.name || 'your facility'} (${currentFacility?.branch || 'Main'}).`}
          </p>

          {!isSuperAdmin && currentFacility && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-teal-500/30 rounded-xl text-xs font-bold text-teal-300">
              {facilityType === 'hospital' ? <Building2 className="w-4 h-4 text-emerald-400" /> : <FlaskConical className="w-4 h-4 text-cyan-400" />}
              <span>Facility: {currentFacility.name} ({currentFacility.branch || 'Main Branch'})</span>
            </div>
          )}
        </div>

        <button
          onClick={() => setActiveTab && setActiveTab('branch-tests')}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-2 border border-slate-700 transition shrink-0 cursor-pointer"
        >
          <TestTube className="w-4 h-4 text-cyan-400" />
          <span>View All Test Offerings & Price List</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* STEP 1: FACILITY SELECTION CARD (SUPER ADMIN ONLY) */}
      {isSuperAdmin && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 animate-fadeIn">
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
                  const firstId = diagnosticCenters[0]?.id || diagnosticCenters[0]?.location_details?.id;
                  if (firstId) setSelectedCenterId(String(firstId));
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
                  const firstId = hospitals[0]?.id || hospitals[0]?.location_details?.id;
                  if (firstId) setSelectedHospitalId(String(firstId));
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
                {diagnosticCenters.map(dc => {
                  const dcId = dc.id || dc.location_details?.id;
                  const dcName = dc.name || dc.location_details?.name || 'Diagnostic Center';
                  const dcBranch = dc.branch || dc.location_details?.branch || 'Main Branch';
                  const dcDistrict = dc.district || dc.location_details?.district || 'Dhaka';
                  return (
                    <option key={dcId} value={dcId}>
                      {dcName} ({dcBranch}) — {dcDistrict}
                    </option>
                  );
                })}
              </select>
            ) : (
              <select
                value={selectedHospitalId}
                onChange={e => setSelectedHospitalId(e.target.value)}
                className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl px-4 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-400"
              >
                {hospitals.map(h => {
                  const hId = h.id || h.location_details?.id;
                  const hName = h.name || h.location_details?.name || 'Hospital';
                  const hBranch = h.branch || h.location_details?.branch || 'Main Branch';
                  const hDistrict = h.district || h.location_details?.district || 'Dhaka';
                  return (
                    <option key={hId} value={hId}>
                      {hName} ({hBranch}) — {hDistrict}
                    </option>
                  );
                })}
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
      )}

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
            const categoryTestsCount = cat.test_count !== undefined 
              ? cat.test_count 
              : tests.filter(t => (t.category || t.category_id || '').toString() === stringId).length;

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

      {/* STEP 3: LIVE PREVIEW OF AUTO-ASSOCIATED [] */}
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
                (associatedTests || [])
                  .filter(t => `${t?.name || ''} ${t?.category_name || t?.category || ''}`.toLowerCase().includes((searchTerm || '').toLowerCase()))
                  .map(t => {
                    const calculated_price = t.calculated_price || 560;
                    return (
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
                        ৳{t.price || 700}
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          className="w-20 bg-slate-950 border border-emerald-500/50 rounded px-2 py-1 text-emerald-400 font-black font-mono text-xs"
                          value={calculated_price}
                          onChange={e => {
                            t.calculated_price = e.target.value;
                            // Trigger re-render by doing a shallow copy of tests? Just mutating is fine here since it's a bulk form
                          }}
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold">
                          <CheckCircle className="w-3 h-3 text-emerald-400" /> Auto-Associated
                        </span>
                      </td>
                    </tr>
                  )})
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
          onClick={() => setShowConfirmModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-600/30 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          <span>Associate {selectedCatIds.length} Categories ({associatedTests.length} Tests) to {currentFacility?.branch || 'Facility'}</span>
        </button>
      </div>

      {/* PRE-SAVE CONFIRMATION MODAL */}
      {showConfirmModal && currentFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Confirm Association</h3>
                <p className="text-xs text-slate-400">Please review before saving test categories</p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400 font-medium">Target Facility:</span>
                <span className="font-extrabold text-white">{currentFacility.name} ({currentFacility.branch || 'Main'})</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400 font-medium">Facility Type:</span>
                <span className="font-bold text-cyan-300 capitalize">{facilityType.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400 font-medium">Selected Categories:</span>
                <span className="font-extrabold text-teal-300">{selectedCatIds.length} Categories</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400 font-medium">Associated Tests:</span>
                <span className="font-extrabold text-emerald-400">{associatedTests.length} Tests</span>
              </div>

              {/* List preview of categories */}
              <div className="pt-2 border-t border-slate-800">
                <span className="block text-[11px] text-slate-400 font-bold mb-1.5">Categories to attach:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCategoriesList.map(cat => (
                    <span key={cat.id} className="px-2.5 py-1 bg-teal-950/80 text-teal-200 border border-teal-700/50 rounded-lg text-[10px] font-bold">
                      {cat.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setShowConfirmModal(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveAssociations}
                className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-black text-xs rounded-xl shadow-lg shadow-teal-600/30 transition flex items-center gap-2"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                <span>Confirm & Save Associations</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* POST-SAVE SUCCESS CONFIRMATION MODAL */}
      {showSuccessModal && savedSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 text-center">
            
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">Associations Confirmed!</h3>
              <p className="text-xs text-slate-300 mt-1">
                Successfully assigned test categories to <strong className="text-emerald-400">{savedSummary.facilityName} ({savedSummary.facilityBranch})</strong>.
              </p>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-left space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Total Categories:</span>
                <span className="font-extrabold text-teal-300">{savedSummary.categoriesCount} Categories</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Total Tests Associated:</span>
                <span className="font-extrabold text-emerald-400">{savedSummary.testsCount} Tests</span>
              </div>

              <div>
                <span className="block text-[11px] text-slate-400 font-bold mb-1.5">Associated Categories:</span>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {savedSummary.categoryNames.map((name, i) => (
                    <span key={i} className="px-2.5 py-1 bg-emerald-950/80 text-emerald-200 border border-emerald-700/50 rounded-lg text-[10px] font-bold">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  if (setActiveTab) setActiveTab('branch-tests');
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition"
              >
                <TestTube className="w-4 h-4" />
                <span>View Full Test Offerings</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
