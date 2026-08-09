import React from 'react';
import { Search, Plus, Edit, Trash2, Stethoscope, Building2, FlaskConical, Activity, TestTube } from 'lucide-react';
import { api } from '../../../services/api';

export default function CategoriesTab({
  activeTab,
  doctorSpecialties = [],
  setDoctorSpecialties,
  hospitalCategories = [],
  setHospitalCategories,
  diagnosticCategories = [],
  setDiagnosticCategories,
  hospitalServices = [],
  setHospitalServices,
  diagnosticServices = [],
  setDiagnosticServices,
  testCategories = [],
  setTestCategories,
  searchTerm,
  setSearchTerm,
  showDoctorSpecModal,
  setShowDoctorSpecModal,
  editingDoctorSpec,
  setEditingDoctorSpec,
  doctorSpecForm,
  setDoctorSpecForm,
  handleOpenDoctorSpecModal,
  handleSaveDoctorSpec,
  handleDeleteDoctorSpec,
  showHospitalCatModal,
  setShowHospitalCatModal,
  editingHospitalCat,
  setEditingHospitalCat,
  hospitalCatForm,
  setHospitalCatForm,
  handleOpenHospitalCatModal,
  handleSaveHospitalCat,
  handleDeleteHospitalCat,
  showDiagCatModal,
  setShowDiagCatModal,
  editingDiagCat,
  setEditingDiagCat,
  diagCatForm,
  setDiagCatForm,
  handleOpenDiagCatModal,
  handleSaveDiagCat,
  handleDeleteDiagCat,
  showHospServiceModal,
  setShowHospServiceModal,
  editingHospService,
  setEditingHospService,
  hospServiceForm,
  setHospServiceForm,
  handleOpenHospServiceModal,
  handleSaveHospService,
  handleDeleteHospService,
  showDiagServiceModal,
  setShowDiagServiceModal,
  editingDiagService,
  setEditingDiagService,
  diagServiceForm,
  setDiagServiceForm,
  handleOpenDiagServiceModal,
  handleSaveDiagService,
  handleDeleteDiagService,
  showTestCatModal,
  setShowTestCatModal,
  editingTestCat,
  setEditingTestCat,
  testCatForm,
  setTestCatForm,
  loadAllData,
  showNotification
}) {
  const handleOpenTestCatModal = (tc = null) => {
    if (tc) {
      if (setEditingTestCat) setEditingTestCat(tc);
      setTestCatForm({ id: tc.id, name: tc.name, icon: tc.icon || 'FlaskConical', description: tc.description || '', count: tc.count || 0 });
    } else {
      if (setEditingTestCat) setEditingTestCat(null);
      setTestCatForm({ id: '', name: '', icon: 'FlaskConical', description: '', count: 0 });
    }
    setShowTestCatModal(true);
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
        console.warn("Backend save test category failed, updating local state:", err);
      }

      const newCat = {
        id: resData?.id || testCatForm.id || `tc-${Date.now()}`,
        name: testCatForm.name,
        icon: testCatForm.icon || 'FlaskConical',
        description: testCatForm.description || '',
        count: testCatForm.count || 0
      };

      if (setTestCategories) {
        setTestCategories(prev => {
          if (editingTestCat) {
            return prev.map(c => String(c.id) === String(editingTestCat.id) ? newCat : c);
          }
          return [...prev, newCat];
        });
      }

      showNotification && showNotification(`Test Category "${testCatForm.name}" ${editingTestCat ? 'updated' : 'created'}.`);
      setShowTestCatModal(false);
    } catch (err) {
      alert(`Error saving category: ${err.message}`);
    }
  };

  const handleDeleteTestCat = async (id, name) => {
    if (!window.confirm(`Delete Test Category "${name}"?`)) return;
    try {
      await api.deleteTestCategory(id).catch(() => null);
      if (setTestCategories) {
        setTestCategories(prev => prev.filter(c => String(c.id) !== String(id)));
      }
      showNotification && showNotification(`Test Category "${name}" deleted.`);
    } catch (err) {
      alert(`Error deleting category: ${err.message}`);
    }
  };

  const isSpecializationDiagCat = (c) => {
    if (!c || c.id === 'all' || c.id === 'by-specialization' || c.id === 'by-ownership-type') return false;
    const pId = typeof c.parent === 'object' ? c.parent?.id : c.parent;
    const pName = typeof c.parent === 'object' ? c.parent?.name : (c.parent_name || '');
    if (pId === 'by-specialization' || pName.toLowerCase().includes('specialization')) return true;
    const name = (c.name || '').toLowerCase();
    const isOwnershipName = name.includes('government') || name.includes('private') || name.includes('corporate') || name.includes('hospital-affiliated') || name.includes('ownership');
    return !isOwnershipName;
  };

  const isOwnershipDiagCat = (c) => {
    if (!c || c.id === 'all' || c.id === 'by-specialization' || c.id === 'by-ownership-type') return false;
    const pId = typeof c.parent === 'object' ? c.parent?.id : c.parent;
    const pName = typeof c.parent === 'object' ? c.parent?.name : (c.parent_name || '');
    if (pId === 'by-ownership-type' || pName.toLowerCase().includes('ownership')) return true;
    const name = (c.name || '').toLowerCase();
    return name.includes('government') || name.includes('private') || name.includes('corporate') || name.includes('hospital-affiliated') || name.includes('ownership');
  };

  let title = '';
  let items = [];
  let onAdd = () => {};
  let onEdit = () => {};
  let onDelete = () => {};
  let icon = Stethoscope;

  if (activeTab === 'doctor-specs') {
    title = 'Doctor Specialties';
    items = doctorSpecialties;
    onAdd = () => handleOpenDoctorSpecModal();
    onEdit = (item) => handleOpenDoctorSpecModal(item);
    onDelete = (id, name) => handleDeleteDoctorSpec(id, name);
    icon = Stethoscope;
  } else if (activeTab === 'hospital-specs') {
    title = 'Hospital Categories';
    items = hospitalCategories;
    onAdd = () => handleOpenHospitalCatModal();
    onEdit = (item) => handleOpenHospitalCatModal(item);
    onDelete = (id, name) => handleDeleteHospitalCat(id, name);
    icon = Building2;
  } else if (activeTab === 'hosp-services') {
    title = 'Hospital Services';
    items = hospitalServices;
    onAdd = () => handleOpenHospServiceModal();
    onEdit = (item) => handleOpenHospServiceModal(item);
    onDelete = (id, name) => handleDeleteHospService(id, name);
    icon = Activity;
  } else if (activeTab === 'diag-services') {
    title = 'Diagnostic Services';
    items = diagnosticServices;
    onAdd = () => handleOpenDiagServiceModal();
    onEdit = (item) => handleOpenDiagServiceModal(item);
    onDelete = (id, name) => handleDeleteDiagService(id, name);
    icon = FlaskConical;
  } else if (activeTab === 'test-cats') {
    title = 'Diagnostic Test Categories';
    items = testCategories.filter(c => c.id !== 'all');
    onAdd = () => handleOpenTestCatModal();
    onEdit = (item) => handleOpenTestCatModal(item);
    onDelete = (id, name) => handleDeleteTestCat(id, name);
    icon = TestTube;
  }

  const HeaderIcon = icon;

  const specDiagItems = diagnosticCategories.filter(isSpecializationDiagCat).filter(item => `${item.name} ${item.description || ''}`.toLowerCase().includes(searchTerm.toLowerCase()));
  const ownDiagItems = diagnosticCategories.filter(isOwnershipDiagCat).filter(item => `${item.name} ${item.description || ''}`.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <>
      {activeTab === 'diag-cats' ? (
        <div className="space-y-6">
          {/* TOP BAR WITH SEARCH AND QUICK ADD */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search diagnostic categories by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenDiagCatModal(null, 'by-specialization')}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-teal-600/20"
              >
                <Plus className="w-4 h-4" /> Add Specialization Category
              </button>
              <button
                onClick={() => handleOpenDiagCatModal(null, 'by-ownership-type')}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-cyan-600/20"
              >
                <Plus className="w-4 h-4" /> Add Ownership Category
              </button>
            </div>
          </div>

          {/* SECTION 1: CATEGORIES BY SPECIALIZATION */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-teal-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Diagnostic Categories — By Specialization ({specDiagItems.length})
                </h3>
              </div>
              <button
                onClick={() => handleOpenDiagCatModal(null, 'by-specialization')}
                className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Category
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Category Name</th>
                    <th className="py-3.5 px-4">Classification</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {specDiagItems.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-6 text-center text-slate-500 text-xs">
                        No specialization categories found matching your search.
                      </td>
                    </tr>
                  ) : (
                    specDiagItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-4 px-4 font-bold text-white">
                          <div className="text-sm text-teal-300 flex items-center gap-2">
                            <FlaskConical className="w-4 h-4 text-teal-400" />
                            <span>{item.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-lg text-[10px] font-bold">
                            By Specialization
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-400 text-[11px]">
                          {item.description || 'Medical diagnostic specialization focus'}
                        </td>
                        <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                          <button onClick={() => handleOpenDiagCatModal(item, 'by-specialization')} className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteDiagCat(item.id, item.name)} className="p-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 2: CATEGORIES BY OWNERSHIP & TYPE */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Diagnostic Categories — By Ownership & Type ({ownDiagItems.length})
                </h3>
              </div>
              <button
                onClick={() => handleOpenDiagCatModal(null, 'by-ownership-type')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Category
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Category Name</th>
                    <th className="py-3.5 px-4">Classification</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {ownDiagItems.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-6 text-center text-slate-500 text-xs">
                        No ownership categories found matching your search.
                      </td>
                    </tr>
                  ) : (
                    ownDiagItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-4 px-4 font-bold text-white">
                          <div className="text-sm text-cyan-300 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-cyan-400" />
                            <span>{item.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-[10px] font-bold">
                            By Ownership & Type
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-400 text-[11px]">
                          {item.description || 'Facility ownership & management model'}
                        </td>
                        <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                          <button onClick={() => handleOpenDiagCatModal(item, 'by-ownership-type')} className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteDiagCat(item.id, item.name)} className="p-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder={`Search ${title.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>
            <button
              onClick={onAdd}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-teal-600/20"
            >
              <Plus className="w-4 h-4" /> Add New {title.slice(0, -1)}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {items
                  .filter(item => `${item.name} ${item.description || ''}`.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(item => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-4 px-4 font-bold text-white">
                        <div className="text-sm text-teal-400 flex items-center gap-2">
                          <HeaderIcon className="w-4 h-4 text-teal-400" />
                          <span>{item.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-400 text-[11px]">
                        {item.description || 'Standard category / service definition'}
                      </td>
                      <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                        <button onClick={() => onEdit(item)} className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDelete(item.id, item.name)} className="p-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
