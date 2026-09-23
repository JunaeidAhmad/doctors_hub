import React from 'react';
import { Search, Edit, Trash2 } from 'lucide-react';
import { renderTaxonomyIcon } from './taxonomyIcons';

export default function CanonicalSpecialtiesView({
  filteredCanonical,
  canonicalList,
  canonicalSearch,
  setCanonicalSearch,
  onOpenSpecModal,
  onDeleteSpec,
  onFilterAliasesBySpecialty
}) {
  return (
    <div className="bg-white border border-[#d1d5dc] rounded-sm overflow-hidden shadow-sm">
      {/* Search and Telemetry Toolbar */}
      <div className="p-4 border-b border-[#e3e5ea] flex flex-wrap items-center justify-between gap-3 bg-white">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search canonical specialty by English name, Bengali name, or slug..."
            value={canonicalSearch}
            onChange={e => setCanonicalSearch(e.target.value)}
            className="w-full bg-white border border-[#d1d5dc] rounded-sm pl-9 pr-4 py-2 text-xs font-body text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#094cb2]"
          />
        </div>

        <div className="text-xs font-label uppercase text-slate-500 font-semibold tracking-wider">
          Showing {filteredCanonical.length} of {canonicalList.length} canonical specialties
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-body text-slate-700">
          <thead className="bg-[#f7f6f7] text-slate-500 font-label text-[10px] uppercase tracking-wider border-b border-[#d1d5dc]">
            <tr>
              <th className="py-3.5 px-4">Specialty &amp; Slug Key</th>
              <th className="py-3.5 px-4">Bengali Name</th>
              <th className="py-3.5 px-4">Compound Components</th>
              <th className="py-3.5 px-4 text-center">Synonym Ring</th>
              <th className="py-3.5 px-4 text-center">Doctors</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e3e5ea]">
            {filteredCanonical.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-400 text-xs font-body">
                  No canonical specialties match your search filter.
                </td>
              </tr>
            ) : (
              filteredCanonical.map(item => (
                <tr key={item.id} className="hover:bg-[#f7f6f7] transition group">
                  {/* Name & Canonical Name */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-sm bg-[#e7ebff] text-[#094cb2] border border-[#cbd5e1] flex items-center justify-center shrink-0">
                        {renderTaxonomyIcon(item.icon)}
                      </div>
                      <div>
                        <div className="font-serif font-bold text-slate-900 text-sm">{item.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                          <span>slug: {item.slug}</span>
                          {item.canonical_name && item.canonical_name !== item.name && (
                            <span className="text-[#094cb2] font-sans">({item.canonical_name})</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Bengali Name */}
                  <td className="py-3.5 px-4 font-serif text-sm text-slate-800">
                    {item.bn_name ? (
                      <span className="font-medium">{item.bn_name}</span>
                    ) : (
                      <span className="text-slate-400 text-xs italic font-body">Not set</span>
                    )}
                  </td>

                  {/* Compound Components */}
                  <td className="py-3.5 px-4">
                    {item.components && item.components.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {item.components.map(comp => (
                          <span 
                            key={comp.id}
                            className="px-2 py-0.5 rounded-sm text-[10px] font-label font-semibold bg-[#e7ebff] text-[#094cb2] border border-[#cbd5e1]"
                          >
                            {comp.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Simple (Atomic)</span>
                    )}
                  </td>

                  {/* Alias Count */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => onFilterAliasesBySpecialty(item.id)}
                      className="px-2.5 py-0.5 rounded-sm text-xs font-mono font-bold bg-[#f7f6f7] hover:bg-[#e7ebff] text-[#094cb2] border border-[#d1d5dc] hover:border-[#094cb2] transition cursor-pointer"
                      title="View aliases pointing here"
                    >
                      {item.alias_count ?? 0}
                    </button>
                  </td>

                  {/* Doctor Count */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2.5 py-0.5 rounded-sm text-xs font-mono font-bold bg-white text-slate-700 border border-[#d1d5dc]">
                      {item.doctor_count ?? 0}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                    <button
                      onClick={() => onOpenSpecModal(item)}
                      className="p-1.5 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-600 hover:text-[#094cb2] rounded-sm transition cursor-pointer"
                      title="Edit Canonical Specialty"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteSpec(item.id, item.name)}
                      className="p-1.5 border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 rounded-sm transition cursor-pointer"
                      title="Delete Canonical Specialty"
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
  );
}
