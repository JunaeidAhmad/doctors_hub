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
    <div className="space-y-6">
      {/* Editorial Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-2 border-b border-[#d1d5dc]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-label font-bold tracking-widest text-[#094cb2] uppercase bg-[#e7ebff] px-2 py-0.5 rounded-xs">
              Platform Taxonomy
            </span>
            <span className="text-[10px] text-slate-400 font-label">• Classification Registry</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#1b1c1d] tracking-tight">
            {title}
          </h1>
          <p className="text-xs text-slate-500 font-body mt-1">
            Institutional directory schemas for classification, clinical search tags, and patient filters.
          </p>
        </div>

        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#094cb2] hover:bg-[#083e91] text-white font-label text-xs font-semibold rounded-sm transition shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> 
          <span>Add New {title.endsWith('ies') ? title.slice(0, -3) + 'y' : title.slice(0, -1)}</span>
        </button>
      </div>

      <div className="bg-white border border-[#d1d5dc] rounded-sm shadow-card overflow-hidden">
        <div className="p-3.5 border-b border-[#d1d5dc] bg-[#faf9fa] flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${title.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-[#d1d5dc] rounded-sm pl-8 pr-3 py-1.5 text-xs text-[#1b1c1d] focus:outline-none focus:border-[#094cb2] font-body"
            />
          </div>
          <span className="text-[11px] font-label text-slate-500">
            Showing <span className="font-semibold text-slate-800">{filteredItems.length}</span> records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-body">
            <thead className="bg-[#f7f6f7] border-b border-[#d1d5dc] text-slate-500 font-label text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-[35%] font-semibold">Name & Identity</th>
                <th className="py-3 px-4 w-[50%] font-semibold">Description</th>
                <th className="py-3 px-4 w-[15%] text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3e5ea] text-slate-700">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="3" className="py-12 text-center text-slate-400 text-xs font-body">
                    No taxonomy items found matching your search.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-[#e7ebff]/25 transition-colors">
                    <td className="py-3.5 px-4 font-serif font-bold text-sm text-[#1b1c1d]">
                      <div className="flex items-center gap-2">
                        <HeaderIcon className="w-4 h-4 text-[#094cb2]" />
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs font-body">
                      {item.description || 'Standard category / service definition'}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button 
                        onClick={() => onEdit(item)} 
                        className="p-1.5 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 rounded-sm transition cursor-pointer" 
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => onDelete(item.id, item.name)} 
                        className="p-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-sm transition cursor-pointer" 
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
    </div>
  );
}
