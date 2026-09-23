import React, { useState, useEffect } from 'react';
import { X, Calculator, Building2, FlaskConical, CheckCircle2, Circle, Clock, TestTube } from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';
import { api } from '../../../../services/api';
import { calculateFinalPrice } from '../../utils/adminHelpers';
import Drawer from '../shared/Drawer';

export default function BranchTestModal() {
  const {
    showBranchTestModal,
    setShowBranchTestModal,
    editingBranchTest,
    branchTestPrefill,
    diagnosticCenters,
    hospitals,
    tests,
    isSuperAdmin,
    isFacilityAdmin,
    loadAllData,
    showNotification
  } = useAdminContext();

  const [branchTestForm, setBranchTestForm] = useState({
    id: '',
    facility_type: 'diagnostic_center',
    center: '',
    hospital: '',
    test: '',
    price: '700',
    discount_percent: '25% OFF',
    calculated_price: '525',
    report_time: '',
    is_available: true,
    home_sample_collection: false
  });

  useEffect(() => {
    if (editingBranchTest) {
      const isHosp = editingBranchTest.facility_type === 'hospital' || editingBranchTest.location_details?.location_type === 'hospital';
      setBranchTestForm({
        id: editingBranchTest.id,
        facility_type: isHosp ? 'hospital' : 'diagnostic_center',
        center: !isHosp ? (editingBranchTest.location_id || editingBranchTest.location) : '',
        hospital: isHosp ? (editingBranchTest.location_id || editingBranchTest.location) : '',
        test: editingBranchTest.test_id || editingBranchTest.test || '',
        price: editingBranchTest.price ? editingBranchTest.price.toString() : (editingBranchTest.calculated_price ? editingBranchTest.calculated_price.toString() : ''),
        discount_percent: editingBranchTest.discount_percent || '',
        calculated_price: editingBranchTest.calculated_price ? editingBranchTest.calculated_price.toString() : (editingBranchTest.discounted_price ? editingBranchTest.discounted_price.toString() : ''),
        report_time: editingBranchTest.report_time || (editingBranchTest.test_details?.report_time_hours ? `${editingBranchTest.test_details.report_time_hours} hours` : ''),
        is_available: editingBranchTest.is_available ?? true,
        home_sample_collection: editingBranchTest.home_sample_collection ?? false
      });
    } else {
      const isHospPrefill = branchTestPrefill?.type === 'hospital';
      const isDiagPrefill = branchTestPrefill?.type === 'diagnostic';
      setBranchTestForm({
        id: '',
        facility_type: isHospPrefill ? 'hospital' : 'diagnostic_center',
        center: isDiagPrefill ? branchTestPrefill.id : ((diagnosticCenters || [])[0]?.id || ''),
        hospital: isHospPrefill ? branchTestPrefill.id : ((hospitals || [])[0]?.id || ''),
        test: (tests || [])[0]?.id || '',
        price: '700',
        discount_percent: '25% OFF',
        calculated_price: '525',
        report_time: '',
        is_available: true,
        home_sample_collection: false
      });
    }
  }, [editingBranchTest, showBranchTestModal, branchTestPrefill, diagnosticCenters, hospitals, tests]);

  if (!showBranchTestModal) return null;

  const isEditing = Boolean(editingBranchTest);

  const currentTest = editingBranchTest?.test_details || (tests || []).find(t => String(t.id) === String(branchTestForm.test || editingBranchTest?.test_id || editingBranchTest?.test));
  const testName = currentTest?.name || editingBranchTest?.test_name || 'Diagnostic Test';
  const categoryName = currentTest?.category_name || currentTest?.category?.name || '';
  const sampleType = currentTest?.sample_type || '';
  const facilityName = editingBranchTest?.facility_name || editingBranchTest?.location_details?.name || '';
  const branchName = editingBranchTest?.location_details?.branch || '';

  const handleSaveBranchTest = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        const payload = {
          calculated_price: parseFloat(branchTestForm.calculated_price) || 0,
          price: branchTestForm.price ? parseFloat(branchTestForm.price) : null,
          discount_percent: branchTestForm.discount_percent,
          report_time: branchTestForm.report_time,
          is_available: branchTestForm.is_available,
          home_sample_collection: branchTestForm.home_sample_collection
        };
        await api.updateFacilityTest(editingBranchTest.id, payload);
        showNotification(`Test price offering updated!`);
      } else {
        const isHosp = branchTestForm.facility_type === 'hospital';
        const payload = {
          test: branchTestForm.test,
          center: !isHosp ? (branchTestForm.center || null) : null,
          hospital: isHosp ? (branchTestForm.hospital || null) : null,
          calculated_price: parseFloat(branchTestForm.calculated_price) || 0,
          price: branchTestForm.price ? parseFloat(branchTestForm.price) : null,
          discount_percent: branchTestForm.discount_percent,
          report_time: branchTestForm.report_time,
          is_available: branchTestForm.is_available,
          home_sample_collection: branchTestForm.home_sample_collection
        };
        await api.createDiagnosticCenterTest(payload);
        showNotification(`Test added to facility!`);
      }

      await loadAllData();
      setShowBranchTestModal(false);
    } catch (err) {
      alert(`Error saving test price offering: ${err.message}`);
    }
  };

  return (
    <Drawer
      isOpen={showBranchTestModal}
      onClose={() => setShowBranchTestModal(false)}
      title={isEditing ? 'Edit Offered Test' : 'Add Offered Test'}
      footer={
        <>
          <button 
            type="button" 
            onClick={() => setShowBranchTestModal(false)} 
            className="px-4 py-2 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 font-label text-xs font-semibold uppercase tracking-wider rounded-sm transition cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="drawer-form" 
            className="px-5 py-2 bg-[#094cb2] hover:bg-[#083e91] text-white font-label text-xs font-semibold uppercase tracking-wider rounded-sm shadow-sm transition cursor-pointer"
          >
            Save Offering
          </button>
        </>
      }
    >
      <form id="drawer-form" onSubmit={handleSaveBranchTest} className="space-y-4 text-xs font-body">
        {/* EDITING TEST HEADER BANNER */}
        {isEditing && (
          <div className="p-4 bg-[#f7f6f7] border border-[#d1d5dc] rounded-sm">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-sm bg-[#e7ebff] border border-[#cbd5e1] text-[#094cb2] flex items-center justify-center shrink-0">
                <TestTube className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-label text-[10px] font-bold text-[#094cb2] uppercase tracking-wider">Offered Test Details</div>
                <h4 className="text-slate-900 font-serif font-bold text-base leading-tight mt-0.5">{testName}</h4>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {categoryName && (
                    <span className="px-2 py-0.5 rounded-sm bg-white border border-[#d1d5dc] text-[10px] font-semibold text-slate-600">
                      {categoryName}
                    </span>
                  )}
                  {sampleType && (
                    <span className="px-2 py-0.5 rounded-sm bg-white border border-[#d1d5dc] text-[10px] font-medium text-slate-500">
                      Sample: {sampleType}
                    </span>
                  )}
                  {facilityName && (
                    <span className="px-2 py-0.5 rounded-sm bg-white border border-[#d1d5dc] text-[10px] font-medium text-slate-500">
                      {facilityName} {branchName ? `(${branchName})` : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FACILITY & TEST SELECTION (ONLY WHEN ADDING NEW) */}
        {!isEditing && (
          <>
            {/* FACILITY TYPE SELECTOR */}
            <div>
              <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Facility Type *</label>
              {isFacilityAdmin ? (
                <div className="px-3 py-2 bg-[#f7f6f7] border border-[#d1d5dc] rounded-sm text-slate-600 font-semibold cursor-not-allowed">
                  {branchTestForm.facility_type === 'hospital' ? 'Hospital Lab' : 'Diagnostic Center'}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 p-1 bg-[#f7f6f7] border border-[#d1d5dc] rounded-sm">
                  <button
                    type="button"
                    onClick={() => setBranchTestForm({ ...branchTestForm, facility_type: 'diagnostic_center', hospital: '' })}
                    className={`py-2 px-3 rounded-sm font-label text-xs uppercase font-bold flex items-center justify-center gap-1.5 transition ${
                      branchTestForm.facility_type === 'diagnostic_center'
                        ? 'bg-[#094cb2] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 bg-white border border-[#d1d5dc]'
                    }`}
                  >
                    <FlaskConical className="w-3.5 h-3.5" /> Diagnostic Center
                  </button>
                  <button
                    type="button"
                    onClick={() => setBranchTestForm({ ...branchTestForm, facility_type: 'hospital', center: '' })}
                    className={`py-2 px-3 rounded-sm font-label text-xs uppercase font-bold flex items-center justify-center gap-1.5 transition ${
                      branchTestForm.facility_type === 'hospital'
                        ? 'bg-[#094cb2] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 bg-white border border-[#d1d5dc]'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" /> Hospital Lab
                  </button>
                </div>
              )}
            </div>

            {/* TARGET SELECTION DEPENDING ON FACILITY TYPE */}
            {branchTestForm.facility_type === 'diagnostic_center' ? (
              <div>
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Select Diagnostic Center *</label>
                <select
                  required
                  disabled={isFacilityAdmin}
                  value={branchTestForm.center}
                  onChange={e => setBranchTestForm({ ...branchTestForm, center: e.target.value })}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:border-[#094cb2] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select Diagnostic Center</option>
                  {(diagnosticCenters || []).map(dc => (
                    <option key={dc.id} value={dc.id}>{dc.name} ({dc.branch})</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Select Hospital (Internal Diagnostics) *</label>
                <select
                  required
                  disabled={isFacilityAdmin}
                  value={branchTestForm.hospital}
                  onChange={e => setBranchTestForm({ ...branchTestForm, hospital: e.target.value })}
                  className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:border-[#094cb2] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select Hospital Branch</option>
                  {(hospitals || []).map(h => (
                    <option key={h.id} value={h.id}>{h.name} ({h.branch || 'Main'})</option>
                  ))}
                </select>
              </div>
            )}

            {/* SELECT TEST */}
            <div>
              <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Select Diagnostic Test *</label>
              <select
                required
                value={branchTestForm.test}
                onChange={e => setBranchTestForm({ ...branchTestForm, test: e.target.value })}
                className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:border-[#094cb2]"
              >
                <option value="">Select Diagnostic Test</option>
                {(tests || []).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* PRICING FIELDS */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Original Price (৳) *</label>
            <input
              type="number"
              required
              value={branchTestForm.price}
              onChange={e => {
                const newOrig = e.target.value;
                const calcPrice = calculateFinalPrice(newOrig, branchTestForm.discount_percent);
                setBranchTestForm({ ...branchTestForm, price: newOrig, calculated_price: calcPrice });
              }}
              className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-[#094cb2]"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Discount Tag</label>
            <input
              type="text"
              placeholder="e.g. 25% OFF"
              value={branchTestForm.discount_percent}
              onChange={e => {
                const newDist = e.target.value;
                const calcPrice = calculateFinalPrice(branchTestForm.price, newDist);
                setBranchTestForm({ ...branchTestForm, discount_percent: newDist, calculated_price: calcPrice });
              }}
              className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-900 focus:outline-none focus:border-[#094cb2]"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Final Discounted Offer Price (৳) *</label>
          <input
            type="number"
            required
            value={branchTestForm.calculated_price}
            onChange={e => setBranchTestForm({ ...branchTestForm, calculated_price: e.target.value })}
            className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-[#094cb2] font-serif font-bold text-sm focus:outline-none focus:border-[#094cb2]"
          />
        </div>

        {/* REPORT DELIVERY TIME FIELD */}
        <div>
          <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Report Delivery Time</label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. Same Day (6-8 Hours), 24 Hours, 2-3 Days"
              value={branchTestForm.report_time}
              onChange={e => setBranchTestForm({ ...branchTestForm, report_time: e.target.value })}
              className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3.5 py-2 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-[#094cb2] transition pr-9"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* AVAILABILITY CHECKBOXES */}
        <div className="flex items-center gap-4 mt-2 pt-2 border-t border-[#e3e5ea]">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={branchTestForm.is_available} 
              onChange={e => setBranchTestForm({...branchTestForm, is_available: e.target.checked})} 
              className="hidden" 
            />
            {branchTestForm.is_available ? <CheckCircle2 className="w-4 h-4 text-[#094cb2]" /> : <Circle className="w-4 h-4 text-slate-300" />}
            <span className="text-slate-700 font-semibold text-xs">Available for Booking</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={branchTestForm.home_sample_collection} 
              onChange={e => setBranchTestForm({...branchTestForm, home_sample_collection: e.target.checked})} 
              className="hidden" 
            />
            {branchTestForm.home_sample_collection ? <CheckCircle2 className="w-4 h-4 text-[#094cb2]" /> : <Circle className="w-4 h-4 text-slate-300" />}
            <span className="text-slate-700 font-semibold text-xs">Home Sample Collection</span>
          </label>
        </div>
      </form>
    </Drawer>
  );
}
