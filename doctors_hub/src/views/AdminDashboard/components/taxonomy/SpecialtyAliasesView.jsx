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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Filters toolbar */}
      <div className="p-4 border-b border-slate-800 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search raw alias, normalized form, or target specialty..."
            value={aliasSearch}
            onChange={e => setAliasSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Specialty Filter Dropdown */}
        <select
          value={aliasSpecialtyFilter}
          onChange={e => setAliasSpecialtyFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
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
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Languages</option>
          <option value="bn">Bengali (বাংলা)</option>
          <option value="en">English</option>
        </select>

        {/* Status Filter */}
        <select
          value={aliasStatusFilter}
          onChange={e => setAliasStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Statuses</option>
          <option value="verified">Verified Live</option>
          <option value="unverified">Pending Review</option>
        </select>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="px-2.5 py-2 text-xs text-slate-400 hover:text-rose-300 transition cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4">Raw Variation / Alias</th>
              <th className="py-3.5 px-4">Normalized Key</th>
              <th className="py-3.5 px-4 text-center">Lang</th>
              <th className="py-3.5 px-4">Resolves To (Canonical)</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredAliases.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-10 text-center text-slate-500 text-xs">
                  No aliases found matching your filters.
                </td>
              </tr>
            ) : (
              filteredAliases.map(alias => (
                <tr key={alias.id} className="hover:bg-slate-800/40 transition">
                  {/* Alias raw string */}
                  <td className="py-3 px-4 font-bold text-white">
                    <span className={alias.language === 'bn' ? 'font-bengali text-sm text-amber-200' : 'text-slate-100'}>
                      {alias.name}
                    </span>
                  </td>

                  {/* Normalized string */}
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                    {alias.normalized}
                  </td>

                  {/* Language chip */}
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      alias.language === 'bn' 
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' 
                        : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                    }`}>
                      {alias.language || 'en'}
                    </span>
                  </td>

                  {/* Resolves to */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <ArrowRight className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <select
                        value={alias.specialty}
                        onChange={e => onReassignAlias(alias.id, e.target.value)}
                        className="bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/50 rounded-lg px-2 py-1 text-xs text-teal-300 font-semibold focus:outline-none transition cursor-pointer max-w-[220px]"
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
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Check className="w-3 h-3" /> Live
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        <AlertTriangle className="w-3 h-3" /> Review
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                    {!alias.is_verified && (
                      <button
                        onClick={() => onVerifyAlias(alias.id, alias.name)}
                        className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg transition cursor-pointer"
                        title="Approve & Verify"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onOpenAliasModal(alias)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
                      title="Edit Alias"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteAlias(alias.id, alias.name)}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition cursor-pointer"
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
