import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, Building2, TestTube, CheckCircle, Plus, Search, 
  Layers, ArrowRight, ShieldCheck, Sparkles, Check, RefreshCw
} from 'lucide-react';
import { api } from '../../../services/api';
import { useAdminContext } from '../context/AdminContext';
import { formatFacilityName } from '../../../utils/facilityUtils';

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

  const toggleCategory = (catId) => {
    const stringId = catId.toString();
    setSelectedCatIds(prev => {
      if (prev.includes(stringId)) {
        return prev.filter(id => id !== stringId);
      } else {
        return [...prev, stringId];
      }
    });
  };

  const validTestCategories = (testCategories || []).filter(c => c && c.id !== 'all');

  const handleSelectAllCats = () => {
    const allIds = validTestCategories.map(c => c.id.toString());
    setSelectedCatIds(allIds);
  };

  const handleDeselectAllCats = () => {
    setSelectedCatIds([]);
  };

  const selectedCategoriesList = validTestCategories.filter(c => 
    selectedCatIds.includes(c.id.toString())
  );

  const associatedTests = tests.filter(t => {
    const testCatId = (t.category || t.category_id || '').toString();
    return selectedCatIds.includes(testCatId);
  });

  const currentFacility = facilityType === 'diagnostic_center'
    ? diagnosticCenters.find(dc => String(dc.id || dc.location_details?.id) === String(selectedCenterId))
    : hospitals.find(h => String(h.id || h.location_details?.id) === String(selectedHospitalId));

  const handleSaveAssociations = async () => {
    if (!currentFacility) {
      alert("Please select a valid facility branch.");
      return;
    }

    const facilityId = facilityType === 'diagnostic_center' ? selectedCenterId : selectedHospitalId;
    const isHosp = facilityType === 'hospital';
    const facilityName = currentFacility.name || currentFacility.location_details?.name || 'Facility';
    const facilityBranch = currentFacility.branch || currentFacility.location_details?.branch || 'Main Branch';

    setIsSaving(true);
    try {
      const existingBranchTestIds = new Set(
        branchTests
          .filter(bt => {
            const btFacId = isHosp 
              ? (bt.hospital?.id || bt.hospital || bt.hospital_id || bt.location_id || bt.location_details?.id)
              : (bt.center?.id || bt.center || bt.center_id || bt.location_id || bt.location_details?.id);
            return String(btFacId) === String(facilityId);
          })
          .map(bt => String(bt.test?.id || bt.test))
      );

      const testsToCreatePayload = [];
      const newBranchTests = [...branchTests];
      let newAttachCount = 0;

      for (const testObj of associatedTests) {
        const testId = testObj.id;
        if (!existingBranchTestIds.has(String(testId))) {
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
            price: testObj.price || 700,
            discount_percent: '20% OFF',
            calculated_price: testObj.calculated_price || 560
          };
          newBranchTests.unshift(entry);

          testsToCreatePayload.push({
            center: !isHosp ? facilityId : null,
            hospital: isHosp ? facilityId : null,
            test: testId,
            calculated_price: testObj.calculated_price || 560,
            price: testObj.price || 700,
            discount_percent: '20% OFF',
            is_available: true
          });
        }
      }

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
        if (testsToCreatePayload.length > 0) {
          try {
            await api.createDiagnosticCenterTest(testsToCreatePayload);
          } catch (err2) {
            console.warn("Bulk attach fallback failed:", err2);
          }
        }
      }

      if (setBranchTests) {
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#d1d5dc]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-label font-bold tracking-widest text-[#094cb2] uppercase bg-[#e7ebff] px-2 py-0.5 rounded-xs">
              Catalog Provisioning
            </span>
            <span className="text-[10px] text-slate-400 font-label">• Bulk Category Mapper</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#1b1c1d] tracking-tight">
            {isSuperAdmin ? 'Add Test Categories to Diagnostics & Labs' : 'Add Diagnostic Tests to Facility'}
          </h1>
          <p className="text-xs text-slate-500 font-body mt-1 max-w-2xl">
            {isSuperAdmin 
              ? 'Assign entire pathology departments to a diagnostic center or hospital lab. All tests under selected categories will automatically be provisioned.'
              : `Assign test categories and customize offer pricing for ${currentFacility?.name || 'your facility'} (${currentFacility?.branch || 'Main'}).`}
          </p>

          {!isSuperAdmin && currentFacility && (
            <div className="mt-2.5 inline-flex items-center gap-2 px-2.5 py-1 bg-[#faf9fa] border border-[#d1d5dc] rounded-xs text-xs font-label font-semibold text-[#094cb2]">
              {facilityType === 'hospital' ? <Building2 className="w-3.5 h-3.5 text-[#094cb2]" /> : <FlaskConical className="w-3.5 h-3.5 text-cyan-700" />}
              <span>Facility: {currentFacility.name} ({currentFacility.branch || 'Main Branch'})</span>
            </div>
          )}
        </div>

        <button
          onClick={() => setActiveTab && setActiveTab('branch-tests')}
          className="px-3.5 py-2 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 font-label text-xs font-semibold rounded-sm flex items-center gap-2 shadow-sm transition shrink-0 cursor-pointer"
        >
          <TestTube className="w-3.5 h-3.5 text-[#094cb2]" />
          <span>View All Offerings</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* STEP 1: FACILITY SELECTION CARD (SUPER ADMIN ONLY) */}
      {isSuperAdmin && (
        <div className="bg-white border border-[#d1d5dc] rounded-sm p-4 md:p-5 shadow-card space-y-3.5">
          <div className="flex items-center gap-2 text-xs font-label font-bold text-slate-900 uppercase tracking-wider border-b border-[#d1d5dc] pb-2.5">
            <Building2 className="w-4 h-4 text-[#094cb2]" />
            <span>Step 1: Select Facility Type & Facility</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 font-body">
            {/* Facility Type Selector Toggle */}
            <div>
              <label className="block text-slate-700 text-xs font-label font-semibold mb-1">Facility Type</label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#faf9fa] border border-[#d1d5dc] rounded-sm">
                <button
                  type="button"
                  onClick={() => {
                    setFacilityType('diagnostic_center');
                    const firstId = diagnosticCenters[0]?.id || diagnosticCenters[0]?.location_details?.id;
                    if (firstId) setSelectedCenterId(String(firstId));
                  }}
                  className={`py-1.5 px-2 rounded-xs text-xs font-label font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                    facilityType === 'diagnostic_center'
                      ? 'bg-[#094cb2] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
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
                  className={`py-1.5 px-2 rounded-xs text-xs font-label font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                    facilityType === 'hospital'
                      ? 'bg-[#094cb2] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" /> Hospital Lab
                </button>
              </div>
            </div>

            {/* Facility Selector Dropdown */}
            <div className="md:col-span-2">
              <label className="block text-slate-700 text-xs font-label font-semibold mb-1">
                Select {facilityType === 'diagnostic_center' ? 'Diagnostic Center Branch' : 'Hospital Lab'}
              </label>
              {facilityType === 'diagnostic_center' ? (
                <select
                  value={selectedCenterId}
                  onChange={e => setSelectedCenterId(e.target.value)}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-1.5 text-xs text-[#1b1c1d] focus:outline-none focus:border-[#094cb2]"
                >
                  {diagnosticCenters.map(dc => {
                    const dcId = dc.id || dc.location_details?.id;
                    const dcName = dc.name || dc.location_details?.name || 'Diagnostic Center';
                    const dcBranch = dc.branch || dc.location_details?.branch || 'Main Branch';
                    const dcDistrict = dc.district || dc.location_details?.district || 'Dhaka';
                    return (
                      <option key={dcId} value={dcId}>
                        {formatFacilityName(dcName, dcBranch)} — {dcDistrict}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <select
                  value={selectedHospitalId}
                  onChange={e => setSelectedHospitalId(e.target.value)}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-1.5 text-xs text-[#1b1c1d] focus:outline-none focus:border-[#094cb2]"
                >
                  {hospitals.map(h => {
                    const hId = h.id || h.location_details?.id;
                    const hName = h.name || h.location_details?.name || 'Hospital';
                    const hBranch = h.branch || h.location_details?.branch || 'Main Branch';
                    const hDistrict = h.district || h.location_details?.district || 'Dhaka';
                    return (
                      <option key={hId} value={hId}>
                        {formatFacilityName(hName, hBranch)} — {hDistrict}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
          </div>

          {/* Selected Facility Status Summary Pill */}
          {currentFacility && (
            <div className="p-3 bg-[#faf9fa] border border-[#d1d5dc] rounded-sm flex items-center justify-between text-xs font-body">
              <div className="flex items-center gap-2">
                {facilityType === 'diagnostic_center' ? (
                  <div className="p-1.5 rounded-xs bg-[#e7ebff] text-[#094cb2]">
                    <FlaskConical className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <div className="p-1.5 rounded-xs bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                )}
                <div>
                  <span className="font-serif font-bold text-slate-900">{currentFacility.name}</span>
                  <span className="text-slate-500 font-label ml-1">({currentFacility.branch || 'Main'})</span>
                  <span className="text-slate-400 ml-1.5">• {currentFacility.address || currentFacility.district}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#e7ebff] text-[#094cb2] border border-[#094cb2]/20 rounded-xs font-label font-semibold text-[10px]">
                  {selectedCatIds.length} Categories Selected
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xs font-label font-semibold text-[10px]">
                  {associatedTests.length} Tests Mapped
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: CATEGORY MULTI-SELECT SECTION */}
      <div className="bg-white border border-[#d1d5dc] rounded-sm p-4 md:p-5 shadow-card space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d1d5dc] pb-2.5">
          <div className="flex items-center gap-2 text-xs font-label font-bold text-slate-900 uppercase tracking-wider">
            <Layers className="w-4 h-4 text-[#094cb2]" />
            <span>Step 2: Select Test Categories to Associate</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAllCats}
              className="px-2.5 py-1 bg-[#e7ebff] hover:bg-[#d9e2ff] text-[#094cb2] rounded-xs text-xs font-label font-semibold transition cursor-pointer"
            >
              Select All ({validTestCategories.length})
            </button>
            <button
              type="button"
              onClick={handleDeselectAllCats}
              className="px-2.5 py-1 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-600 rounded-xs text-xs font-label font-medium transition cursor-pointer"
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

            const categoryTestsCount = cat.test_count !== undefined 
              ? cat.test_count 
              : tests.filter(t => (t.category || t.category_id || '').toString() === stringId).length;

            return (
              <div
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`p-3.5 rounded-sm border cursor-pointer transition flex flex-col justify-between select-none ${
                  isSelected 
                    ? 'bg-[#e7ebff]/40 border-[#094cb2] shadow-xs' 
                    : 'bg-[#faf9fa] border-[#d1d5dc] hover:border-slate-400 text-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-xs border ${
                      isSelected 
                        ? 'bg-[#094cb2] text-white border-[#094cb2]' 
                        : 'bg-white border-[#d1d5dc] text-slate-500'
                    }`}>
                      <TestTube className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className={`text-xs font-label font-bold ${isSelected ? 'text-[#094cb2]' : 'text-slate-900'}`}>
                        {cat.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-body">
                        {categoryTestsCount} catalog tests
                      </p>
                    </div>
                  </div>

                  <div className={`w-4 h-4 rounded-xs border flex items-center justify-center transition-colors shrink-0 ${
                    isSelected 
                      ? 'bg-[#094cb2] border-[#094cb2] text-white' 
                      : 'border-[#d1d5dc] bg-white text-transparent'
                  }`}>
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>

                {cat.description && (
                  <p className="text-[10px] text-slate-500 truncate pt-1 border-t border-[#e3e5ea] mt-1 font-body">
                    {cat.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 3: LIVE PREVIEW OF AUTO-ASSOCIATED TESTS */}
      <div className="bg-white border border-[#d1d5dc] rounded-sm overflow-hidden shadow-card space-y-3.5">
        <div className="p-3.5 border-b border-[#d1d5dc] bg-[#faf9fa] flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-label font-bold text-slate-900 uppercase tracking-wider">
              <TestTube className="w-4 h-4 text-[#094cb2]" />
              <span>Step 3: Auto-Associated Tests Preview ({associatedTests.length} Tests)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-body">
              These tests belong to the selected categories and will be provisioned to {currentFacility?.name || 'this facility'}.
            </p>
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search associated tests..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-[#d1d5dc] rounded-sm pl-8 pr-3 py-1.5 text-xs text-[#1b1c1d] placeholder-slate-400 focus:outline-none focus:border-[#094cb2] font-body"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-left text-xs font-body">
            <thead className="bg-[#f7f6f7] text-slate-500 font-label text-[11px] uppercase tracking-wider border-b border-[#d1d5dc] sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Test Name</th>
                <th className="py-2.5 px-4 font-semibold">Category</th>
                <th className="py-2.5 px-4 font-semibold">Fasting Required</th>
                <th className="py-2.5 px-4 font-semibold">Est. Regular Price</th>
                <th className="py-2.5 px-4 font-semibold">Offer Price (20% OFF)</th>
                <th className="py-2.5 px-4 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3e5ea] text-slate-700">
              {associatedTests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 text-xs font-body">
                    No test categories selected yet. Select categories above to auto-associate tests.
                  </td>
                </tr>
              ) : (
                (associatedTests || [])
                  .filter(t => `${t?.name || ''} ${t?.category_name || t?.category || ''}`.toLowerCase().includes((searchTerm || '').toLowerCase()))
                  .map(t => {
                    const calculated_price = t.calculated_price || 560;
                    return (
                    <tr key={t.id} className="hover:bg-[#e7ebff]/25 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-serif font-bold text-[#1b1c1d] flex items-center gap-1.5">
                          <TestTube className="w-3.5 h-3.5 text-[#094cb2]" />
                          <span>{t.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-body">
                        {t.category_name || t.category || 'General'}
                      </td>
                      <td className="py-3 px-4">
                        {t.fasting_required ? (
                          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xs text-[10px] font-label font-bold">Yes (Fasting)</span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No</span>
                        )}
                      </td>
                      <td className="py-3 px-4 line-through text-slate-400 font-mono text-xs">
                        ৳{t.price || 700}
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          className="w-20 bg-white border border-[#d1d5dc] rounded-xs px-2 py-0.5 text-[#094cb2] font-serif font-bold text-xs focus:outline-none focus:border-[#094cb2]"
                          value={calculated_price}
                          onChange={e => {
                            t.calculated_price = e.target.value;
                          }}
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xs text-[10px] font-label font-bold">
                          <CheckCircle className="w-3 h-3 text-emerald-600" /> Auto-Associated
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
      <div className="bg-white border border-[#d1d5dc] rounded-sm p-4 shadow-elevated flex flex-wrap items-center justify-between gap-4 sticky bottom-4 z-20 backdrop-blur-md">
        <div>
          <div className="text-[#1b1c1d] font-serif font-bold text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#094cb2]" />
            <span>Ready to Associate Categories</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-body">
            Associating {selectedCatIds.length} categories ({associatedTests.length} tests) to {currentFacility?.name || 'selected facility'}.
          </p>
        </div>

        <button
          type="button"
          disabled={isSaving || !currentFacility || selectedCatIds.length === 0}
          onClick={() => setShowConfirmModal(true)}
          className="px-5 py-2.5 bg-[#094cb2] hover:bg-[#083e91] text-white font-label font-semibold text-xs rounded-sm shadow-sm transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          <span>Associate {selectedCatIds.length} Categories ({associatedTests.length} Tests) to {currentFacility?.branch || 'Facility'}</span>
        </button>
      </div>

      {/* PRE-SAVE CONFIRMATION MODAL */}
      {showConfirmModal && currentFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-[#d1d5dc] rounded-sm p-5 max-w-lg w-full shadow-elevated space-y-4">
            
            <div className="flex items-center gap-3 border-b border-[#d1d5dc] pb-3">
              <div className="w-10 h-10 rounded-sm bg-[#e7ebff] text-[#094cb2] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-[#1b1c1d]">Confirm Category Association</h3>
                <p className="text-xs text-slate-500 font-body">Please review parameters before publishing tests to catalog.</p>
              </div>
            </div>

            <div className="space-y-2 bg-[#faf9fa] p-3.5 rounded-sm border border-[#d1d5dc] text-xs font-body">
              <div className="flex items-center justify-between py-1 border-b border-[#e3e5ea]">
                <span className="text-slate-500 font-label">Target Facility:</span>
                <span className="font-serif font-bold text-slate-900">{currentFacility.name} ({currentFacility.branch || 'Main'})</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#e3e5ea]">
                <span className="text-slate-500 font-label">Facility Type:</span>
                <span className="font-label font-semibold text-[#094cb2] capitalize">{facilityType.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#e3e5ea]">
                <span className="text-slate-500 font-label">Selected Categories:</span>
                <span className="font-serif font-bold text-slate-900">{selectedCatIds.length} Categories</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 font-label">Associated Tests:</span>
                <span className="font-serif font-bold text-emerald-800">{associatedTests.length} Tests</span>
              </div>

              {/* List preview of categories */}
              <div className="pt-2 border-t border-[#e3e5ea]">
                <span className="block text-[11px] text-slate-500 font-label font-semibold mb-1">Categories to attach:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedCategoriesList.map(cat => (
                    <span key={cat.id} className="px-2 py-0.5 bg-[#e7ebff] text-[#094cb2] border border-[#094cb2]/20 rounded-xs text-[10px] font-label font-semibold">
                      {cat.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#d1d5dc]">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setShowConfirmModal(false)}
                className="px-3.5 py-1.5 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 font-label font-semibold text-xs rounded-sm transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveAssociations}
                className="px-4 py-1.5 bg-[#094cb2] hover:bg-[#083e91] text-white font-label font-semibold text-xs rounded-sm shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                <span>Confirm & Save Associations</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* POST-SAVE SUCCESS CONFIRMATION MODAL */}
      {showSuccessModal && savedSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-[#d1d5dc] rounded-sm p-6 max-w-lg w-full shadow-elevated space-y-4 text-center">
            
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
              <CheckCircle className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-serif font-bold text-[#1b1c1d]">Associations Confirmed!</h3>
              <p className="text-xs text-slate-500 mt-1 font-body">
                Successfully assigned test categories to <strong className="text-slate-900">{savedSummary.facilityName} ({savedSummary.facilityBranch})</strong>.
              </p>
            </div>

            <div className="bg-[#faf9fa] p-3.5 rounded-sm border border-[#d1d5dc] text-left space-y-2 text-xs font-body">
              <div className="flex items-center justify-between border-b border-[#e3e5ea] pb-1.5">
                <span className="text-slate-500 font-label">Total Categories:</span>
                <span className="font-serif font-bold text-slate-900">{savedSummary.categoriesCount} Categories</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#e3e5ea] pb-1.5">
                <span className="text-slate-500 font-label">Total Tests Associated:</span>
                <span className="font-serif font-bold text-emerald-800">{savedSummary.testsCount} Tests</span>
              </div>

              <div>
                <span className="block text-[11px] text-slate-500 font-label font-semibold mb-1">Associated Categories:</span>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                  {savedSummary.categoryNames.map((name, i) => (
                    <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xs text-[10px] font-label font-semibold">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2 border-t border-[#d1d5dc]">
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  if (setActiveTab) setActiveTab('branch-tests');
                }}
                className="w-full sm:w-auto px-4 py-1.5 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-[#094cb2] font-label font-semibold text-xs rounded-sm flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <TestTube className="w-3.5 h-3.5" />
                <span>View Full Test Offerings</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="w-full sm:w-auto px-5 py-1.5 bg-[#094cb2] hover:bg-[#083e91] text-white font-label font-semibold text-xs rounded-sm shadow-sm transition cursor-pointer"
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
