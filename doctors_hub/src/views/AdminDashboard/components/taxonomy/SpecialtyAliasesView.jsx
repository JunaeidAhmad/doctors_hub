import React from 'react';
import { Search, ArrowRight, Check, AlertTriangle, Edit, Trash2 } from 'lucide-react';

export default function SpecialtyAliasesView({
  filteredAliases,
  canonicalList,
  aliasSearch,
  setAliasSearch,
  aliasSpecialtyFilter,
  setAliasSpecialtyFilter,
  aliasLangFilter,
  setAliasLangFilter,
  aliasStatusFilter,
  setAliasStatusFilter,
  onClearFilters,
  onReassignAlias,
  onVerifyAlias,
  onOpenAliasModal,
  onDeleteAlias
}) {
  const hasActiveFilters = Boolean(aliasSpecialtyFilter || aliasLangFilter || aliasStatusFilter || aliasSearch);

  return (
    <div className="bg-white border border-[#d1d5dc] rounded-sm overflow-hidden shadow-sm">
      {/* Filters toolbar */}
      <div className="p-4 border-b border-[#e3e5ea] flex flex-wrap items-center gap-3 bg-white">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search raw alias, normalized form, or target specialty..."
            value={aliasSearch}
            onChange={e => setAliasSearch(e.target.value)}
            className="w-full bg-white border border-[#d1d5dc] rounded-sm pl-9 pr-4 py-2 text-xs font-body text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#094cb2]"
          />
        </div>

        {/* Specialty Filter Dropdown */}
        <select
          value={aliasSpecialtyFilter}
          onChange={e => setAliasSpecialtyFilter(e.target.value)}
          className="bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-xs font-body text-slate-700 focus:outline-none focus:border-[#094cb2]"
        >
          <option value="">All Canonical Targets</option>
          {canonicalList.map(s => (
            <option key={s.id} value={s.id}>
              {s.name} {s.bn_name ? `(${s.bn_name})` : ''}
            </option>
          ))}
        </select>

        {/* Language Filter */}
        <select
          value={aliasLangFilter}
          onChange={e => setAliasLangFilter(e.target.value)}
          className="bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-xs font-body text-slate-700 focus:outline-none focus:border-[#094cb2]"
        >
          <option value="">All Languages</option>
          <option value="bn">Bengali (বাংলা)</option>
          <option value="en">English</option>
        </select>

        {/* Status Filter */}
        <select
          value={aliasStatusFilter}
          onChange={e => setAliasStatusFilter(e.target.value)}
          className="bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-xs font-body text-slate-700 focus:outline-none focus:border-[#094cb2]"
        >
          <option value="">All Statuses</option>
          <option value="verified">Verified Live</option>
          <option value="unverified">Pending Review</option>
        </select>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="px-2.5 py-2 text-xs font-label uppercase font-bold text-slate-500 hover:text-rose-600 transition cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-body text-slate-700">
          <thead className="bg-[#f7f6f7] text-slate-500 font-label text-[10px] uppercase tracking-wider border-b border-[#d1d5dc]">
            <tr>
              <th className="py-3.5 px-4">Raw Variation / Alias</th>
              <th className="py-3.5 px-4">Normalized Key</th>
              <th className="py-3.5 px-4 text-center">Lang</th>
              <th className="py-3.5 px-4">Resolves To (Canonical)</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e3e5ea]">
            {filteredAliases.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-400 text-xs font-body">
                  No aliases found matching your filters.
                </td>
              </tr>
            ) : (
              filteredAliases.map(alias => (
                <tr key={alias.id} className="hover:bg-[#f7f6f7] transition">
                  {/* Alias raw string */}
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <span className={alias.language === 'bn' ? 'font-serif text-sm text-slate-900 font-medium' : 'text-slate-900'}>
                      {alias.name}
                    </span>
                  </td>

                  {/* Normalized string */}
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                    {alias.normalized}
                  </td>

                  {/* Language chip */}
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-label font-bold uppercase tracking-wider ${
                      alias.language === 'bn' 
                        ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                        : 'bg-[#e7ebff] text-[#094cb2] border border-[#cbd5e1]'
                    }`}>
                      {alias.language || 'en'}
                    </span>
                  </td>

                  {/* Resolves to */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <ArrowRight className="w-3.5 h-3.5 text-[#094cb2] shrink-0" />
                      <select
                        value={alias.specialty}
                        onChange={e => onReassignAlias(alias.id, e.target.value)}
                        className="bg-white hover:bg-[#f7f6f7] border border-[#d1d5dc] hover:border-[#094cb2] rounded-sm px-2 py-1 text-xs text-slate-800 font-semibold focus:outline-none transition cursor-pointer max-w-[220px]"
                        title="Quick reassign to another canonical specialty"
                      >
                        {canonicalList.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>

                  {/* Verified Status */}
                  <td className="py-3 px-4 text-center">
                    {alias.is_verified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-label font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Check className="w-3 h-3 text-emerald-600" /> Live
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-label font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                        <AlertTriangle className="w-3 h-3 text-amber-600" /> Review
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                    {!alias.is_verified && (
                      <button
                        onClick={() => onVerifyAlias(alias.id, alias.name)}
                        className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm transition cursor-pointer"
                        title="Approve & Verify"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onOpenAliasModal(alias)}
                      className="p-1.5 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-600 hover:text-[#094cb2] rounded-sm transition cursor-pointer"
                      title="Edit Alias"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteAlias(alias.id, alias.name)}
                      className="p-1.5 border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 rounded-sm transition cursor-pointer"
                      title="Delete Alias"
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
