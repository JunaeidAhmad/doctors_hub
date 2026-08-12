import React from 'react';
import { Search, Plus, Edit, Trash2, Stethoscope, Building2, FlaskConical, Activity, TestTube } from 'lucide-react';
import { useAdminContext } from '../context/AdminContext';
import CategoryModals from './modals/CategoryModals';

export default function CategoriesTab() {
  const {
    activeTab,
    doctorSpecialties,
    hospitalCategories,
    diagnosticCategories,
    hospitalServices,
    diagnosticServices,
    testCategories,
    searchTerm,
    setSearchTerm,
    handleOpenDoctorSpecModal,
    handleDeleteDoctorSpec,
    handleOpenHospitalCatModal,
    handleDeleteHospitalCat,
    handleOpenDiagCatModal,
    handleDeleteDiagCat,
    handleOpenHospServiceModal,
    handleDeleteHospService,
    handleOpenDiagServiceModal,
    handleDeleteDiagService,
    setShowTestCatModal,
    setEditingTestCat,
    handleDeleteTestCat
  } = useAdminContext();

  const getTabConfig = () => {
    switch (activeTab) {
      case 'doctor-specs':
        return {
          title: 'Doctor Specialties',
          icon: Stethoscope,
          items: doctorSpecialties,
          onAdd: () => handleOpenDoctorSpecModal(),
          onEdit: (item) => handleOpenDoctorSpecModal(item),
          onDelete: handleDeleteDoctorSpec
        };
      case 'hospital-specs':
        return {
          title: 'Hospital Categories',
          icon: Building2,
          items: hospitalCategories,
          onAdd: () => handleOpenHospitalCatModal(),
          onEdit: (item) => handleOpenHospitalCatModal(item),
          onDelete: handleDeleteHospitalCat
        };
      case 'diag-cats':
        return {
          title: 'Diagnostic Categories',
          icon: FlaskConical,
          items: diagnosticCategories,
          onAdd: () => handleOpenDiagCatModal(),
          onEdit: (item) => handleOpenDiagCatModal(item),
          onDelete: handleDeleteDiagCat
        };
      case 'hosp-services':
        return {
          title: 'Hospital Services',
          icon: Activity,
          items: hospitalServices,
          onAdd: () => handleOpenHospServiceModal(),
          onEdit: (item) => handleOpenHospServiceModal(item),
          onDelete: handleDeleteHospService
        };
      case 'diag-services':
        return {
          title: 'Diagnostic Services',
          icon: FlaskConical,
          items: diagnosticServices,
          onAdd: () => handleOpenDiagServiceModal(),
          onEdit: (item) => handleOpenDiagServiceModal(item),
          onDelete: handleDeleteDiagService
        };
      case 'test-cats':
        return {
          title: 'Test Categories',
          icon: TestTube,
          items: testCategories,
          onAdd: () => { setEditingTestCat(null); setShowTestCatModal(true); },
          onEdit: (item) => { setEditingTestCat(item); setShowTestCatModal(true); },
          onDelete: handleDeleteTestCat || ((id) => alert("Delete category feature available on backend integration"))
        };
      default:
        return {
          title: 'Categories',
          icon: Building2,
          items: [],
          onAdd: () => {},
          onEdit: () => {},
          onDelete: () => {}
        };
    }
  };

  const { title, icon: HeaderIcon, items, onAdd, onEdit, onDelete } = getTabConfig();

  const isSpecializationDiagCat = (c) => {
    if (!c || c.id === 'all' || c.id === 'by-specialization' || c.id === 'by-ownership-type') return false;
    const pId = typeof c.parent === 'object' && c.parent ? c.parent.id : c.parent;
    const pName = (typeof c.parent === 'object' && c.parent ? c.parent.name : c.parent_name) || '';
    if (pId === 'by-specialization' || String(pName).toLowerCase().includes('specialization')) return true;
    const name = String(c.name || '').toLowerCase();
    const isOwnershipName = name.includes('government') || name.includes('private') || name.includes('corporate') || name.includes('hospital-affiliated') || name.includes('ownership');
    return !isOwnershipName;
  };

  const isOwnershipDiagCat = (c) => {
    if (!c || c.id === 'all' || c.id === 'by-specialization' || c.id === 'by-ownership-type') return false;
    const pId = typeof c.parent === 'object' && c.parent ? c.parent.id : c.parent;
    const pName = (typeof c.parent === 'object' && c.parent ? c.parent.name : c.parent_name) || '';
    if (pId === 'by-ownership-type' || String(pName).toLowerCase().includes('ownership')) return true;
    const name = String(c.name || '').toLowerCase();
    return name.includes('government') || name.includes('private') || name.includes('corporate') || name.includes('hospital-affiliated') || name.includes('ownership');
  };

  const specDiagItems = (diagnosticCategories || [])
    .filter(isSpecializationDiagCat)
    .filter(item => `${item?.name || ''} ${item?.description || ''}`.toLowerCase().includes((searchTerm || '').toLowerCase()));

  const ownDiagItems = (diagnosticCategories || [])
    .filter(isOwnershipDiagCat)
    .filter(item => `${item?.name || ''} ${item?.description || ''}`.toLowerCase().includes((searchTerm || '').toLowerCase()));

  return (
    <>
      {activeTab === 'diag-cats' ? (
        <div className="space-y-6">
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
                className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl transition shadow-md"
              >
                <Plus className="w-3.5 h-3.5" /> + Specialization Category
              </button>
              <button
                onClick={() => handleOpenDiagCatModal(null, 'by-ownership-type')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition shadow-md"
              >
                <Plus className="w-3.5 h-3.5" /> + Ownership Category
              </button>
            </div>
          </div>

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
                          {item.description || 'Medical specialization domain'}
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
                {(items || [])
                .filter(item => `${item?.name || ''} ${item?.description || ''}`.toLowerCase().includes((searchTerm || '').toLowerCase()))
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

      <CategoryModals />
    </>
  );
}
