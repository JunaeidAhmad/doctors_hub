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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Unverified Specialty Ingestions Triage</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              When new doctors register or onboarding data introduces novel raw specialty variations, they stay pending until an administrator verifies them into public search dropdowns.
            </p>
          </div>

          {unverifiedAliases.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={onBatchVerify}
                disabled={selectedReviewIds.length === 0}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedReviewIds.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve Selected ({selectedReviewIds.length})</span>
              </button>

              <button
                onClick={onApproveAll}
                className="px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Approve All ({unverifiedAliases.length})</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {unverifiedAliases.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">Review Queue is Clean!</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              All doctor specialty variations are verified and properly routed into the canonical taxonomy.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedReviewIds.length === unverifiedAliases.length && unverifiedAliases.length > 0}
                      onChange={onToggleSelectAllReviews}
                      className="rounded bg-slate-900 border-slate-700 text-teal-500 focus:ring-teal-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Raw Unverified Input</th>
                  <th className="py-3.5 px-4">Normalized</th>
                  <th className="py-3.5 px-4 text-center">Lang</th>
                  <th className="py-3.5 px-4">Target Canonical Specialty</th>
                  <th className="py-3.5 px-4 text-right">Triage Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {unverifiedAliases.map(alias => (
                  <tr key={alias.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedReviewIds.includes(alias.id)}
                        onChange={() => onToggleSelectReview(alias.id)}
                        className="rounded bg-slate-900 border-slate-700 text-teal-500 focus:ring-teal-500 cursor-pointer"
                      />
                    </td>

                    <td className="py-3 px-4 font-bold text-white">
                      <span className={alias.language === 'bn' ? 'font-bengali text-sm text-amber-200' : 'text-slate-100'}>
                        {alias.name}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {alias.normalized}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        alias.language === 'bn' 
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' 
                          : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                      }`}>
                        {alias.language || 'en'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <select
                        value={alias.specialty}
                        onChange={e => onReassignAlias(alias.id, e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-teal-300 font-semibold focus:outline-none focus:border-teal-500 cursor-pointer"
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
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => onDeleteAlias(alias.id, alias.name)}
                        className="p-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition cursor-pointer"
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
