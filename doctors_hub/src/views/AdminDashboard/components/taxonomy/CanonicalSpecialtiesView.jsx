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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search canonical specialty by English name, Bengali name, or slug..."
            value={canonicalSearch}
            onChange={e => setCanonicalSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing {filteredCanonical.length} of {canonicalList.length} canonical specialties
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4">Specialty & Key</th>
              <th className="py-3.5 px-4">Bengali Name</th>
              <th className="py-3.5 px-4">Compound Components</th>
              <th className="py-3.5 px-4 text-center">Aliases</th>
              <th className="py-3.5 px-4 text-center">Doctors</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredCanonical.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-10 text-center text-slate-500 text-xs">
                  No canonical specialties match your search.
                </td>
              </tr>
            ) : (
              filteredCanonical.map(item => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition group">
                  {/* Name & Canonical Name */}
                  <td className="py-3.5 px-4 font-bold text-white">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                        {renderTaxonomyIcon(item.icon)}
                      </div>
                      <div>
                        <div className="text-white text-xs font-extrabold">{item.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                          <span>slug: {item.slug}</span>
                          {item.canonical_name && item.canonical_name !== item.name && (
                            <span className="text-teal-400/90 font-sans">({item.canonical_name})</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Bengali Name */}
                  <td className="py-3.5 px-4 font-bengali text-sm text-amber-300 font-medium">
                    {item.bn_name ? (
                      <span>{item.bn_name}</span>
                    ) : (
                      <span className="text-slate-600 text-[11px] italic">Not set</span>
                    )}
                  </td>

                  {/* Compound Components */}
                  <td className="py-3.5 px-4">
                    {item.components && item.components.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {item.components.map(comp => (
                          <span 
                            key={comp.id}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                          >
                            {comp.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500 text-[10px]">Simple (Self)</span>
                    )}
                  </td>

                  {/* Alias Count */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => onFilterAliasesBySpecialty(item.id)}
                      className="px-2.5 py-1 rounded-full text-[11px] font-black bg-slate-800 text-emerald-400 hover:bg-emerald-500/20 border border-slate-700/80 transition cursor-pointer"
                      title="View aliases pointing here"
                    >
                      {item.alias_count ?? 0}
                    </button>
                  </td>

                  {/* Doctor Count */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-slate-800 text-teal-300 border border-slate-700/80">
                      {item.doctor_count ?? 0}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                    <button
                      onClick={() => onOpenSpecModal(item)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
                      title="Edit Canonical Specialty"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteSpec(item.id, item.name)}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition cursor-pointer"
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
