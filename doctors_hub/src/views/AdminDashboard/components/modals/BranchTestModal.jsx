import React, { useState, useEffect } from 'react';
import { XCircle, Calculator, Building2, FlaskConical } from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';
import { api } from '../../../../services/api';
import { calculateFinalPrice } from '../../utils/adminHelpers';

export default function BranchTestModal() {
  const {
    showBranchTestModal,
    setShowBranchTestModal,
    editingBranchTest,
    branchTestPrefill,
    diagnosticCenters,
    hospitals,
    tests,
    setBranchTests,
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
    report_delivery_date: new Date().toISOString().split('T')[0],
    report_time_slot: '05:00 PM - 09:00 PM'
  });

  useEffect(() => {
    if (editingBranchTest) {
      const isHosp = Boolean(editingBranchTest.hospital || editingBranchTest.hospital_name || editingBranchTest.facility_type === 'hospital');
      setBranchTestForm({
        id: editingBranchTest.id,
        facility_type: isHosp ? 'hospital' : 'diagnostic_center',
        center: editingBranchTest.center?.id || editingBranchTest.center || '',
        hospital: editingBranchTest.hospital?.id || editingBranchTest.hospital || '',
        test: editingBranchTest.test?.id || editingBranchTest.test || (tests[0]?.id || ''),
        original_price: editingBranchTest.original_price ? editingBranchTest.original_price.toString() : (editingBranchTest.price ? editingBranchTest.price.toString() : '700'),
        discount: editingBranchTest.discount || '25% OFF',
        price: editingBranchTest.price ? editingBranchTest.price.toString() : '525',
        report_delivery_date: new Date().toISOString().split('T')[0],
        report_time_slot: '05:00 PM - 09:00 PM'
      });
    } else {
      const isHospPrefill = branchTestPrefill?.type === 'hospital';
      const isDiagPrefill = branchTestPrefill?.type === 'diagnostic';
      setBranchTestForm({
        id: '',
        facility_type: isHospPrefill ? 'hospital' : 'diagnostic_center',
        center: isDiagPrefill ? branchTestPrefill.id : (diagnosticCenters[0]?.id || ''),
        hospital: isHospPrefill ? branchTestPrefill.id : (hospitals[0]?.id || ''),
        test: tests[0]?.id || '',
        original_price: '700',
        discount: '25% OFF',
        price: '525',
        report_delivery_date: new Date().toISOString().split('T')[0],
        report_time_slot: '05:00 PM - 09:00 PM'
      });
    }
  }, [editingBranchTest, showBranchTestModal, branchTestPrefill, diagnosticCenters, hospitals, tests]);

  if (!showBranchTestModal) return null;

  const handleSaveBranchTest = async (e) => {
    e.preventDefault();
    try {
      const isHosp = branchTestForm.facility_type === 'hospital';
      const selectedTest = tests.find(t => String(t.id) === String(branchTestForm.test));
      const selectedCenter = !isHosp ? diagnosticCenters.find(dc => String(dc.id) === String(branchTestForm.center)) : null;
      const selectedHospital = isHosp ? hospitals.find(h => String(h.id) === String(branchTestForm.hospital)) : null;

      const payload = {
        test: branchTestForm.test,
        center: !isHosp ? (branchTestForm.center || null) : null,
        hospital: isHosp ? (branchTestForm.hospital || null) : null,
        price: parseFloat(branchTestForm.price) || 0,
        original_price: branchTestForm.original_price ? parseFloat(branchTestForm.original_price) : null,
        discount: branchTestForm.discount,
        report_time: `${branchTestForm.report_delivery_date} | ${branchTestForm.report_time_slot}`
      };

      let resData;
      try {
        resData = await api.createDiagnosticCenterTest(payload);
      } catch (err) {
        console.warn("Backend save failed, updating local state:", err);
      }

      const newEntry = {
        id: resData?.id || branchTestForm.id || `bt-custom-${Date.now()}`,
        facility_type: branchTestForm.facility_type,
        center: !isHosp ? (selectedCenter?.id || branchTestForm.center) : null,
        center_name: !isHosp ? (selectedCenter?.name || '') : '',
        center_branch: !isHosp ? (selectedCenter?.branch || '') : '',
        hospital: isHosp ? (selectedHospital?.id || branchTestForm.hospital) : null,
        hospital_name: isHosp ? (selectedHospital?.name || '') : '',
        hospital_branch: isHosp ? (selectedHospital?.branch || '') : '',
        test: selectedTest?.id || branchTestForm.test,
        test_name: selectedTest?.name || 'Diagnostic Test',
        original_price: branchTestForm.original_price,
        discount: branchTestForm.discount,
        price: branchTestForm.price
      };

      setBranchTests(prev => {
        const existingIdx = prev.findIndex(b => String(b.id) === String(newEntry.id));
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = newEntry;
          return updated;
        }
        return [newEntry, ...prev];
      });

      const facilityName = selectedHospital ? selectedHospital.name : (selectedCenter ? selectedCenter.name : 'Facility');
      showNotification(`Test "${newEntry.test_name}" added to ${facilityName}!`);
      setShowBranchTestModal(false);
    } catch (err) {
      alert(`Error saving test price offering: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white">Add Diagnostic Test Price Offering</h3>
          <button onClick={() => setShowBranchTestModal(false)} className="text-slate-400 hover:text-white">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveBranchTest} className="space-y-3 text-xs">
          {/* FACILITY TYPE SELECTOR */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Facility Type *</label>
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
          </div>

          {/* TARGET SELECTION DEPENDING ON FACILITY TYPE */}
          {branchTestForm.facility_type === 'diagnostic_center' ? (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Select Standalone Diagnostic Center *</label>
              <select
                required
                value={branchTestForm.center}
                onChange={e => setBranchTestForm({ ...branchTestForm, center: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
              >
                <option value="">Select Diagnostic Center</option>
                {diagnosticCenters.map(dc => (
                  <option key={dc.id} value={dc.id}>{dc.name} ({dc.branch})</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Select Hospital (Internal Diagnostics) *</label>
              <select
                required
                value={branchTestForm.hospital}
                onChange={e => setBranchTestForm({ ...branchTestForm, hospital: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
              >
                <option value="">Select Hospital Branch</option>
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>{h.name} ({h.branch || 'Main'})</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Select Test *</label>
            <select
              required
              value={branchTestForm.test}
              onChange={e => setBranchTestForm({ ...branchTestForm, test: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
            >
              <option value="">Select Diagnostic Test</option>
              {tests.map(t => (
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
              <label className="block text-slate-300 font-semibold mb-1">Discount Tag *</label>
              <input
                type="text"
                required
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

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button type="button" onClick={() => setShowBranchTestModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20">Save Test Pricing</button>
          </div>
        </form>
      </div>
    </div>
  );
}
