import React from 'react';
import { AlertTriangle, ShieldCheck, Check, Sparkles, Trash2 } from 'lucide-react';

export default function SpecialtyReviewQueueView({
  unverifiedAliases,
  selectedReviewIds,
  canonicalList,
  onBatchVerify,
  onApproveAll,
  onToggleSelectReview,
  onToggleSelectAllReviews,
  onReassignAlias,
  onVerifyAlias,
  onDeleteAlias
}) {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-[#d1d5dc] rounded-sm p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-label text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm bg-amber-50 text-amber-800 border border-amber-200 tracking-wider">
                Ingestion Governance
              </span>
            </div>
            <h3 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Unverified Specialty Ingestions Triage Queue</span>
            </h3>
            <p className="text-xs font-body text-slate-500 mt-0.5 max-w-2xl">
              When new doctors register or onboarding data introduces novel raw specialty variations, they stay pending until an administrator reviews and verifies them into public search dropdowns.
            </p>
          </div>

          {unverifiedAliases.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={onBatchVerify}
                disabled={selectedReviewIds.length === 0}
                className={`px-3.5 py-2 rounded-sm text-xs font-label uppercase font-semibold tracking-wider transition flex items-center gap-1.5 ${
                  selectedReviewIds.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                    : 'bg-[#f7f6f7] text-slate-400 border border-[#d1d5dc] cursor-not-allowed'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve Selected ({selectedReviewIds.length})</span>
              </button>

              <button
                onClick={onApproveAll}
                className="px-3.5 py-2 bg-[#094cb2] hover:bg-[#083e91] text-white font-label text-xs font-semibold uppercase tracking-wider rounded-sm transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Approve All ({unverifiedAliases.length})</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-[#d1d5dc] rounded-sm overflow-hidden shadow-sm">
        {unverifiedAliases.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-sm bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-serif font-bold text-slate-900">Review Queue is Clean!</h4>
            <p className="text-xs font-body text-slate-500 max-w-sm mx-auto">
              All doctor specialty variations are verified and mapped accurately into the canonical taxonomy.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-body text-slate-700">
              <thead className="bg-[#f7f6f7] text-slate-500 font-label text-[10px] uppercase tracking-wider border-b border-[#d1d5dc]">
                <tr>
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedReviewIds.length === unverifiedAliases.length && unverifiedAliases.length > 0}
                      onChange={onToggleSelectAllReviews}
                      className="rounded-xs border-[#d1d5dc] text-[#094cb2] focus:ring-[#094cb2] cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Raw Unverified Input</th>
                  <th className="py-3.5 px-4">Normalized Key</th>
                  <th className="py-3.5 px-4 text-center">Lang</th>
                  <th className="py-3.5 px-4">Target Canonical Specialty</th>
                  <th className="py-3.5 px-4 text-right">Triage Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e5ea]">
                {unverifiedAliases.map(alias => (
                  <tr key={alias.id} className="hover:bg-[#f7f6f7] transition">
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedReviewIds.includes(alias.id)}
                        onChange={() => onToggleSelectReview(alias.id)}
                        className="rounded-xs border-[#d1d5dc] text-[#094cb2] focus:ring-[#094cb2] cursor-pointer"
                      />
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900">
                      <span className={alias.language === 'bn' ? 'font-serif text-sm font-medium' : 'text-slate-900'}>
                        {alias.name}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {alias.normalized}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-label font-bold uppercase tracking-wider ${
                        alias.language === 'bn' 
                          ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                          : 'bg-[#e7ebff] text-[#094cb2] border border-[#cbd5e1]'
                      }`}>
                        {alias.language || 'en'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <select
                        value={alias.specialty}
                        onChange={e => onReassignAlias(alias.id, e.target.value)}
                        className="bg-white border border-[#d1d5dc] rounded-sm px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#094cb2] cursor-pointer"
                      >
                        {canonicalList.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} {s.bn_name ? `(${s.bn_name})` : ''}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => onVerifyAlias(alias.id, alias.name)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-label text-xs font-semibold uppercase tracking-wider rounded-sm transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => onDeleteAlias(alias.id, alias.name)}
                        className="p-1 border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 rounded-sm transition cursor-pointer"
                        title="Discard / Reject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
