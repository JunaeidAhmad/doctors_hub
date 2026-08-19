import React, { useState, useEffect } from 'react';
import { XCircle, Calculator, Building2, FlaskConical, CheckCircle2, Circle } from 'lucide-react';
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
    original_price: '700',
    discount: '25% OFF',
    price: '525',
    is_available: true,
    home_sample_collection: false
  });

  useEffect(() => {
    if (editingBranchTest) {
      const isHosp = editingBranchTest.facility_type === 'hospital' || editingBranchTest.location_details?.location_type === 'hospital';
      setBranchTestForm({
        id: editingBranchTest.id,
        facility_type: isHosp ? 'hospital' : 'diagnostic_center',
        center: !isHosp ? editingBranchTest.location_id : '',
        hospital: isHosp ? editingBranchTest.location_id : '',
        test: editingBranchTest.test_id,
        original_price: editingBranchTest.original_price ? editingBranchTest.original_price.toString() : (editingBranchTest.price ? editingBranchTest.price.toString() : ''),
        discount: editingBranchTest.discount || '',
        price: editingBranchTest.price ? editingBranchTest.price.toString() : (editingBranchTest.discounted_price ? editingBranchTest.discounted_price.toString() : ''),
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
        original_price: '700',
        discount: '25% OFF',
        price: '525',
        is_available: true,
        home_sample_collection: false
      });
    }
  }, [editingBranchTest, showBranchTestModal, branchTestPrefill, diagnosticCenters, hospitals, tests]);

  if (!showBranchTestModal) return null;

  const isEditing = Boolean(editingBranchTest);

  const handleSaveBranchTest = async (e) => {
    e.preventDefault();
    try {
      const isHosp = branchTestForm.facility_type === 'hospital';

      const payload = {
        test: branchTestForm.test,
        center: !isHosp ? (branchTestForm.center || null) : null,
        hospital: isHosp ? (branchTestForm.hospital || null) : null,
        price: parseFloat(branchTestForm.price) || 0,
        original_price: branchTestForm.original_price ? parseFloat(branchTestForm.original_price) : null,
        discount: branchTestForm.discount,
        is_available: branchTestForm.is_available,
        home_sample_collection: branchTestForm.home_sample_collection
      };

      if (isEditing) {
        await api.updateFacilityTest(editingBranchTest.id, payload);
        showNotification(`Test price offering updated!`);
      } else {
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
          <button type="button" onClick={() => setShowBranchTestModal(false)} className="px-5 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700">Cancel</button>
          <button type="submit" form="drawer-form" className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20">Save Pricing</button>
        </>
      }
    >
      <form id="drawer-form" onSubmit={handleSaveBranchTest} className="space-y-4 text-sm">
        {/* FACILITY TYPE SELECTOR */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1">Facility Type *</label>
          {isFacilityAdmin || isEditing ? (
            <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 cursor-not-allowed">
              {branchTestForm.facility_type === 'hospital' ? 'Hospital Lab' : 'Diagnostic Center'}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setBranchTestForm({ ...branchTestForm, facility_type: 'diagnostic_center', hospital: '' })}
                className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                  branchTestForm.facility_type === 'diagnostic_center'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5" /> Diagnostic Center
              </button>
              <button
                type="button"
                onClick={() => setBranchTestForm({ ...branchTestForm, facility_type: 'hospital', center: '' })}
                className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                  branchTestForm.facility_type === 'hospital'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
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
            <label className="block text-slate-300 font-semibold mb-1">Select Standalone Diagnostic Center *</label>
            <select
              required
              disabled={isFacilityAdmin || isEditing}
              value={branchTestForm.center}
              onChange={e => setBranchTestForm({ ...branchTestForm, center: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select Diagnostic Center</option>
              {(diagnosticCenters || []).map(dc => (
                <option key={dc.id} value={dc.id}>{dc.name} ({dc.branch})</option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Select Hospital (Internal Diagnostics) *</label>
            <select
              required
              disabled={isFacilityAdmin || isEditing}
              value={branchTestForm.hospital}
              onChange={e => setBranchTestForm({ ...branchTestForm, hospital: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select Hospital Branch</option>
              {(hospitals || []).map(h => (
                <option key={h.id} value={h.id}>{h.name} ({h.branch || 'Main'})</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-slate-300 font-semibold mb-1">Select Test *</label>
          <select
            required
            disabled={isEditing}
            value={branchTestForm.test}
            onChange={e => setBranchTestForm({ ...branchTestForm, test: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Select Diagnostic Test</option>
            {(tests || []).map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Original Price (৳) *</label>
            <input
              type="number"
              required
              value={branchTestForm.original_price}
              onChange={e => {
                const newOrig = e.target.value;
                const calcPrice = calculateFinalPrice(newOrig, branchTestForm.discount);
                setBranchTestForm({ ...branchTestForm, original_price: newOrig, price: calcPrice });
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Discount Tag</label>
            <input
              type="text"
              placeholder="e.g. 25% OFF"
              value={branchTestForm.discount}
              onChange={e => {
                const newDist = e.target.value;
                const calcPrice = calculateFinalPrice(branchTestForm.original_price, newDist);
                setBranchTestForm({ ...branchTestForm, discount: newDist, price: calcPrice });
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-emerald-400 font-bold mb-1">Final Discounted Offer Price (৳) *</label>
          <input
            type="number"
            required
            value={branchTestForm.price}
            onChange={e => setBranchTestForm({ ...branchTestForm, price: e.target.value })}
            className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl px-3 py-2 text-emerald-300 font-bold font-mono"
          />
        </div>

        <div className="flex items-center gap-4 mt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={branchTestForm.is_available} 
              onChange={e => setBranchTestForm({...branchTestForm, is_available: e.target.checked})} 
              className="hidden" 
            />
            {branchTestForm.is_available ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Circle className="w-5 h-5 text-slate-500" />}
            <span className="text-slate-300 font-semibold">Available</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={branchTestForm.home_sample_collection} 
              onChange={e => setBranchTestForm({...branchTestForm, home_sample_collection: e.target.checked})} 
              className="hidden" 
            />
            {branchTestForm.home_sample_collection ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Circle className="w-5 h-5 text-slate-500" />}
            <span className="text-slate-300 font-semibold">Home Collection</span>
          </label>
        </div>
      </form>
    </Drawer>
  );
}
