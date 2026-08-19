import React, { useState, useMemo } from 'react';
import { Search, Plus, Trash2, Calculator, Building2, FlaskConical } from 'lucide-react';
import { useAdminContext } from '../context/AdminContext';
import BranchTestModal from './modals/BranchTestModal';

export default function BranchTestsTab() {
  const {
    branchTests,
    testCategories = [],
    searchTerm,
    setSearchTerm,
    handleOpenBranchTestModal,
    handleDeleteBranchTest,
    isSuperAdmin
  } = useAdminContext();

  const [selectedCategory, setSelectedCategory] = useState('');

  // Extract valid category options (from testCategories and any categories present in branchTests)
  const categoryOptions = useMemo(() => {
    const list = (testCategories || []).filter(c => c && c.id !== 'all');
    if (list.length > 0) return list;

    // Fallback: extract distinct categories from branchTests
    const catMap = new Map();
    (branchTests || []).forEach(bt => {
      const catId = bt?.test_details?.category_id || bt?.test_details?.category?.id || bt?.test_details?.category_name;
      const catName = bt?.test_details?.category_name || bt?.test_details?.category?.name;
      if (catId && catName && !catMap.has(String(catId))) {
        catMap.set(String(catId), { id: String(catId), name: catName });
      }
    });
    return Array.from(catMap.values());
  }, [testCategories, branchTests]);

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[240px]">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search test name or sample..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-teal-500"
            >
              <option value="">All Test Categories</option>
              {categoryOptions.map(cat => (
                <option key={cat.id || cat.slug || cat.name} value={cat.id || cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => handleOpenBranchTestModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-teal-600/20"
          >
            <Plus className="w-4 h-4" /> Add Test Price Offering
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                {isSuperAdmin && <th className="py-3.5 px-4">Facility & Branch</th>}
                <th className="py-3.5 px-4">Test Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Sample Type</th>
                <th className="py-3.5 px-4">Original Price</th>
                <th className="py-3.5 px-4">Discount</th>
                <th className="py-3.5 px-4">Offer Price</th>
                <th className="py-3.5 px-4">Report Time</th>
                <th className="py-3.5 px-4">Availability</th>
                <th className="py-3.5 px-4">Home Collection</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(branchTests || [])
                .filter(bt => {
                  const facilityName = bt?.facility_name || bt?.location_details?.name || '';
                  const testName = bt?.test_details?.name || '';
                  const catName = bt?.test_details?.category_name || bt?.test_details?.category?.name || '';
                  const sampleType = bt?.test_details?.sample_type || '';
                  const matchesSearch = `${facilityName} ${testName} ${catName} ${sampleType}`.toLowerCase().includes((searchTerm || '').toLowerCase());
                  
                  if (!selectedCategory) return matchesSearch;

                  const btCatId = String(bt?.test_details?.category_id || bt?.test_details?.category?.id || bt?.test_details?.category || '');
                  const btCatName = String(bt?.test_details?.category_name || bt?.test_details?.category?.name || '').toLowerCase();
                  const btCatSlug = String(bt?.test_details?.category_slug || bt?.test_details?.category?.slug || '').toLowerCase();
                  const targetCat = String(selectedCategory).toLowerCase();

                  const matchesCategory = 
                    btCatId === String(selectedCategory) ||
                    btCatName === targetCat ||
                    btCatSlug === targetCat;

                  return matchesSearch && matchesCategory;
                })
                .map(bt => {
                  const isHospital = bt?.facility_type === 'hospital' || bt?.location_details?.location_type === 'hospital';
                  const facilityName = bt?.facility_name || bt?.location_details?.name || 'Medical Facility';
                  const branchName = bt?.location_details?.branch || 'Main Branch';
                  
                  return (
                    <tr key={bt.id} className="hover:bg-slate-800/40 transition">
                      {isSuperAdmin && (
                        <td className="py-4 px-4 font-bold">
                          <div className="flex items-center gap-2">
                            {isHospital ? (
                              <span className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" title="Hospital Diagnostics">
                                <Building2 className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400" title="Diagnostic Center">
                                <FlaskConical className="w-3.5 h-3.5" />
                              </span>
                            )}
                            <div>
                              <div className="text-white text-xs font-bold">{facilityName}</div>
                              <div className="text-[10px] text-slate-400 font-normal">
                                {branchName}
                              </div>
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="py-4 px-4 font-bold text-white">
                        <div className="flex items-center gap-1.5">
                          <Calculator className="w-3.5 h-3.5 text-amber-400" />
                          <span>{bt?.test_details?.name || 'Diagnostic Test'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 rounded-md bg-slate-800 text-[10px] text-slate-300">
                          {bt?.test_details?.category_name || 'N/A'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-400">
                        {bt?.test_details?.sample_type || 'N/A'}
                      </td>
                      <td className="py-4 px-4 line-through text-slate-500">
                        {bt.original_price != null ? `৳${bt.original_price}` : '-'}
                      </td>
                      <td className="py-4 px-4 text-rose-400 font-bold">
                        {bt.discount || '-'}
                      </td>
                      <td className="py-4 px-4 text-emerald-400 font-black text-sm">
                        ৳{bt.price || bt.discounted_price || 0}
                      </td>
                      <td className="py-4 px-4 text-slate-400">
                        {bt.report_time || (bt?.test_details?.report_time_hours ? `${bt.test_details.report_time_hours} hours` : 'N/A')}
                      </td>
                      <td className="py-4 px-4">
                        <div className={`w-3 h-3 rounded-full ${bt.is_available ? 'bg-emerald-500' : 'bg-rose-500'}`} title={bt.is_available ? 'Available' : 'Unavailable'} />
                      </td>
                      <td className="py-4 px-4">
                        {bt.home_sample_collection ? <span className="text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-1 rounded">Yes</span> : <span className="text-slate-500 text-[10px]">No</span>}
                      </td>
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleOpenBranchTestModal(bt)} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg">
                            Edit
                          </button>
                          <button onClick={() => handleDeleteBranchTest(bt.id)} className="p-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <BranchTestModal />
    </>
  );
}
