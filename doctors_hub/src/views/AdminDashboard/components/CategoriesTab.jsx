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

  const filteredItems = (items || []).filter(item =>
    `${item?.name || ''} ${item?.description || ''}`.toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  return (
    <>
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
            <Plus className="w-4 h-4" /> Add New {title.endsWith('ies') ? title.slice(0, -3) + 'y' : title.slice(0, -1)}
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
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="3" className="py-8 text-center text-slate-500 text-xs">
                    No items found matching your search.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
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
                      <button onClick={() => onEdit(item)} className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(item.id, item.name)} className="p-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30 transition" title="Delete">
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

      <CategoryModals />
    </>
  );
}
