import React, { useState, useEffect } from 'react';
import { useAdminContext } from '../../context/AdminContext';
import { api } from '../../../../services/api';

export default function CategoryModals() {
  const {
    showDoctorSpecModal, setShowDoctorSpecModal, editingDoctorSpec, setDoctorSpecialties,
    showHospitalCatModal, setShowHospitalCatModal, editingHospitalCat, setHospitalCategories,
    showDiagCatModal, setShowDiagCatModal, editingDiagCat, setDiagnosticCategories, diagCatDefaultParent,
    showHospServiceModal, setShowHospServiceModal, editingHospService, setHospitalServices,
    showDiagServiceModal, setShowDiagServiceModal, editingDiagService, setDiagnosticServices,
    showTestCatModal, setShowTestCatModal, editingTestCat, setTestCategories,
    showNotification
  } = useAdminContext();

  const [doctorSpecForm, setDoctorSpecForm] = useState({ id: '', name: '', icon: 'Stethoscope', description: '' });
  const [hospitalCatForm, setHospitalCatForm] = useState({ id: '', name: '', icon: 'Building2', description: '', count: 0 });
  const [diagCatForm, setDiagCatForm] = useState({ id: '', name: '', icon: 'Building2', description: '', parent: 'by-specialization' });
  const [hospServiceForm, setHospServiceForm] = useState({ id: '', name: '', icon: 'Activity', description: '' });
  const [diagServiceForm, setDiagServiceForm] = useState({ id: '', name: '', icon: 'FlaskConical', description: '' });
  const [testCatForm, setTestCatForm] = useState({ id: '', name: '', icon: 'FlaskConical', description: '', count: 0 });

  useEffect(() => {
    if (editingDoctorSpec) {
      setDoctorSpecForm({ id: editingDoctorSpec.id, name: editingDoctorSpec.name, icon: editingDoctorSpec.icon || 'Stethoscope', description: editingDoctorSpec.description || '' });
    } else {
      setDoctorSpecForm({ id: '', name: '', icon: 'Stethoscope', description: '' });
    }
  }, [editingDoctorSpec, showDoctorSpecModal]);

  useEffect(() => {
    if (editingHospitalCat) {
      setHospitalCatForm({ id: editingHospitalCat.id, name: editingHospitalCat.name, icon: editingHospitalCat.icon || 'Building2', description: editingHospitalCat.description || '', count: editingHospitalCat.count || 0 });
    } else {
      setHospitalCatForm({ id: '', name: '', icon: 'Building2', description: '', count: 0 });
    }
  }, [editingHospitalCat, showHospitalCatModal]);

  useEffect(() => {
    if (editingDiagCat && editingDiagCat.name) {
      const parentVal = typeof editingDiagCat.parent === 'object' 
        ? (editingDiagCat.parent?.id || editingDiagCat.parent?.name) 
        : (editingDiagCat.parent || editingDiagCat.parent_name || diagCatDefaultParent);
      setDiagCatForm({ id: editingDiagCat.id, name: editingDiagCat.name, icon: editingDiagCat.icon || 'Building2', description: editingDiagCat.description || '', parent: parentVal });
    } else {
      setDiagCatForm({ id: '', name: '', icon: 'Building2', description: '', parent: diagCatDefaultParent });
    }
  }, [editingDiagCat, showDiagCatModal, diagCatDefaultParent]);

  useEffect(() => {
    if (editingHospService) {
      setHospServiceForm({ id: editingHospService.id, name: editingHospService.name, icon: editingHospService.icon || 'Activity', description: editingHospService.description || '' });
    } else {
      setHospServiceForm({ id: '', name: '', icon: 'Activity', description: '' });
    }
  }, [editingHospService, showHospServiceModal]);

  useEffect(() => {
    if (editingDiagService) {
      setDiagServiceForm({ id: editingDiagService.id, name: editingDiagService.name, icon: editingDiagService.icon || 'FlaskConical', description: editingDiagService.description || '' });
    } else {
      setDiagServiceForm({ id: '', name: '', icon: 'FlaskConical', description: '' });
    }
  }, [editingDiagService, showDiagServiceModal]);

  useEffect(() => {
    if (editingTestCat) {
      setTestCatForm({ id: editingTestCat.id, name: editingTestCat.name, icon: editingTestCat.icon || 'FlaskConical', description: editingTestCat.description || '', count: editingTestCat.count || 0 });
    } else {
      setTestCatForm({ id: '', name: '', icon: 'FlaskConical', description: '', count: 0 });
    }
  }, [editingTestCat, showTestCatModal]);

  const handleSaveDoctorSpec = async (e) => {
    e.preventDefault();
    try {
      let resData;
      try {
        if (editingDoctorSpec) {
          resData = await api.updateSpecialty(editingDoctorSpec.id, doctorSpecForm);
        } else {
          resData = await api.createSpecialty(doctorSpecForm);
        }
      } catch (err) {
        console.warn("Backend save failed, using local update:", err);
      }
      const newSpec = {
        id: resData?.id || doctorSpecForm.id || `spec-${Date.now()}`,
        name: doctorSpecForm.name,
        icon: doctorSpecForm.icon || 'Stethoscope',
        description: doctorSpecForm.description || ''
      };
      setDoctorSpecialties(prev => {
        if (editingDoctorSpec) {
          return prev.map(s => String(s.id) === String(editingDoctorSpec.id) ? newSpec : s);
        }
        return [...prev, newSpec];
      });
      showNotification(`Specialty "${doctorSpecForm.name}" ${editingDoctorSpec ? 'updated' : 'created'}.`);
      setShowDoctorSpecModal(false);
    } catch (err) {
      alert(`Error saving specialty: ${err.message}`);
    }
  };

  const handleSaveHospitalCat = async (e) => {
    e.preventDefault();
    try {
      let resData;
      try {
        if (editingHospitalCat) {
          resData = await api.updateHospitalCategory(editingHospitalCat.id, hospitalCatForm);
        } else {
          resData = await api.createHospitalCategory(hospitalCatForm);
        }
      } catch (err) {
        console.warn("Backend save failed, using local update:", err);
      }
      const newCat = {
        id: resData?.id || hospitalCatForm.id || `hosp-cat-${Date.now()}`,
        name: hospitalCatForm.name,
        icon: hospitalCatForm.icon || 'Building2',
        description: hospitalCatForm.description || '',
        count: hospitalCatForm.count || 0
      };
      setHospitalCategories(prev => {
        if (editingHospitalCat) {
          return prev.map(c => String(c.id) === String(editingHospitalCat.id) ? newCat : c);
        }
        return [...prev, newCat];
      });
      showNotification(`Hospital Category "${hospitalCatForm.name}" ${editingHospitalCat ? 'updated' : 'created'}.`);
      setShowHospitalCatModal(false);
    } catch (err) {
      alert(`Error saving category: ${err.message}`);
    }
  };

  const handleSaveDiagCat = async (e) => {
    e.preventDefault();
    try {
      let resData;
      try {
        if (editingDiagCat) {
          resData = await api.updateDiagnosticCenterCategory(editingDiagCat.id, diagCatForm);
        } else {
          resData = await api.createDiagnosticCenterCategory(diagCatForm);
        }
      } catch (err) {
        console.warn("Backend save diag cat failed, updating local state:", err);
      }

      const newCat = {
        id: resData?.id || diagCatForm.id || `diag-cat-${Date.now()}`,
        name: diagCatForm.name,
        icon: diagCatForm.icon || 'Building2',
        description: diagCatForm.description || '',
        parent: diagCatForm.parent || 'by-specialization'
      };

      setDiagnosticCategories(prev => {
        if (editingDiagCat) {
          return prev.map(c => String(c.id) === String(editingDiagCat.id) ? newCat : c);
        }
        return [...prev, newCat];
      });

      showNotification(`Diagnostic Category "${diagCatForm.name}" ${editingDiagCat ? 'updated' : 'created'}.`);
      setShowDiagCatModal(false);
    } catch (err) {
      alert(`Error saving category: ${err.message}`);
    }
  };

  const handleSaveHospService = async (e) => {
    e.preventDefault();
    try {
      let resData;
      try {
        if (editingHospService) {
          resData = await api.updateHospitalService(editingHospService.id, hospServiceForm);
        } else {
          resData = await api.createHospitalService(hospServiceForm);
        }
      } catch (err) {
        console.warn("Backend save failed, using local update:", err);
      }
      const newSrv = {
        id: resData?.id || hospServiceForm.id || `hs-${Date.now()}`,
        name: hospServiceForm.name,
        icon: hospServiceForm.icon || 'Activity',
        description: hospServiceForm.description || ''
      };
      setHospitalServices(prev => {
        if (editingHospService) {
          return prev.map(s => String(s.id) === String(editingHospService.id) ? newSrv : s);
        }
        return [...prev, newSrv];
      });
      showNotification(`Hospital Service "${hospServiceForm.name}" ${editingHospService ? 'updated' : 'created'}.`);
      setShowHospServiceModal(false);
    } catch (err) {
      alert(`Error saving service: ${err.message}`);
    }
  };

  const handleSaveDiagService = async (e) => {
    e.preventDefault();
    try {
      let resData;
      try {
        if (editingDiagService) {
          resData = await api.updateDiagnosticService(editingDiagService.id, diagServiceForm);
        } else {
          resData = await api.createDiagnosticService(diagServiceForm);
        }
      } catch (err) {
        console.warn("Backend save failed, using local update:", err);
      }
      const newSrv = {
        id: resData?.id || diagServiceForm.id || `ds-${Date.now()}`,
        name: diagServiceForm.name,
        icon: diagServiceForm.icon || 'FlaskConical',
        description: diagServiceForm.description || ''
      };
      setDiagnosticServices(prev => {
        if (editingDiagService) {
          return prev.map(s => String(s.id) === String(editingDiagService.id) ? newSrv : s);
        }
        return [...prev, newSrv];
      });
      showNotification(`Diagnostic Service "${diagServiceForm.name}" ${editingDiagService ? 'updated' : 'created'}.`);
      setShowDiagServiceModal(false);
    } catch (err) {
      alert(`Error saving service: ${err.message}`);
    }
  };

  const handleSaveTestCat = async (e) => {
    e.preventDefault();
    try {
      let resData;
      try {
        if (editingTestCat) {
          resData = await api.updateTestCategory(editingTestCat.id, testCatForm);
        } else {
          resData = await api.createTestCategory(testCatForm);
        }
      } catch (err) {
        console.warn("Backend save failed, using local update:", err);
      }
      const newCat = {
        id: resData?.id || testCatForm.id || `tc-${Date.now()}`,
        name: testCatForm.name,
        icon: testCatForm.icon || 'FlaskConical',
        description: testCatForm.description || '',
        count: testCatForm.count || 0
      };
      setTestCategories(prev => {
        if (editingTestCat) {
          return prev.map(c => String(c.id) === String(editingTestCat.id) ? newCat : c);
        }
        return [...prev, newCat];
      });
      showNotification(`Test Category "${testCatForm.name}" ${editingTestCat ? 'updated' : 'created'}.`);
      setShowTestCatModal(false);
    } catch (err) {
      alert(`Error saving category: ${err.message}`);
    }
  };

  return (
    <>
      {/* MODAL: DOCTOR SPECIALTY */}
      {showDoctorSpecModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">{editingDoctorSpec ? 'Edit Doctor Specialty' : 'Add Doctor Specialty'}</h3>
            <form onSubmit={handleSaveDoctorSpec} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Specialty Name *</label>
                <input type="text" required value={doctorSpecForm.name} onChange={e => setDoctorSpecForm({ ...doctorSpecForm, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowDoctorSpecModal(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-teal-600 text-white font-bold rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: HOSPITAL CATEGORY */}
      {showHospitalCatModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">{editingHospitalCat ? 'Edit Hospital Category' : 'Add Hospital Category'}</h3>
            <form onSubmit={handleSaveHospitalCat} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Category Name *</label>
                <input type="text" required value={hospitalCatForm.name} onChange={e => setHospitalCatForm({ ...hospitalCatForm, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowHospitalCatModal(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DIAGNOSTIC CATEGORY */}
      {showDiagCatModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">
              {editingDiagCat ? 'Edit Diagnostic Category' : 'Add Diagnostic Category'}
            </h3>
            <form onSubmit={handleSaveDiagCat} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Category Type / Group *</label>
                <select
                  value={diagCatForm.parent || 'by-specialization'}
                  onChange={e => setDiagCatForm({ ...diagCatForm, parent: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                >
                  <option value="by-specialization">By Specialization</option>
                  <option value="by-ownership-type">By Ownership & Type</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Category Name *</label>
                <input
                  type="text"
                  required
                  value={diagCatForm.name}
                  onChange={e => setDiagCatForm({ ...diagCatForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  placeholder="e.g. Molecular Diagnostics or Corporate Chain"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Description (Optional)</label>
                <input
                  type="text"
                  value={diagCatForm.description || ''}
                  onChange={e => setDiagCatForm({ ...diagCatForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  placeholder="Brief description..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowDiagCatModal(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 font-bold rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-cyan-600 text-white font-bold rounded-xl">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: HOSPITAL SERVICE */}
      {showHospServiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">{editingHospService ? 'Edit Hospital Service' : 'Add Hospital Service'}</h3>
            <form onSubmit={handleSaveHospService} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Service Name *</label>
                <input type="text" required value={hospServiceForm.name} onChange={e => setHospServiceForm({ ...hospServiceForm, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowHospServiceModal(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-amber-600 text-white font-bold rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DIAGNOSTIC SERVICE */}
      {showDiagServiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">{editingDiagService ? 'Edit Diagnostic Service' : 'Add Diagnostic Service'}</h3>
            <form onSubmit={handleSaveDiagService} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Service Name *</label>
                <input type="text" required value={diagServiceForm.name} onChange={e => setDiagServiceForm({ ...diagServiceForm, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowDiagServiceModal(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-purple-600 text-white font-bold rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TEST CATEGORY */}
      {showTestCatModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">{editingTestCat ? 'Edit Test Category' : 'Add Test Category'}</h3>
            <form onSubmit={handleSaveTestCat} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Category Name *</label>
                <input type="text" required value={testCatForm.name} onChange={e => setTestCatForm({ ...testCatForm, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowTestCatModal(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-teal-600 text-white font-bold rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
