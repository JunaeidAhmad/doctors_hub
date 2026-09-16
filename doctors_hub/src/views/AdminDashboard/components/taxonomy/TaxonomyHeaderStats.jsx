import React from 'react';
import { Stethoscope, Tag, AlertTriangle, Users, RefreshCw, Plus } from 'lucide-react';

export default function TaxonomyHeaderStats({
  counts,
  canonicalCount,
  aliasesCount,
  totalDoctorsCovered,
  loading,
  onRefresh,
  onAddCanonical,
  onAddAlias,
  onOpenReviewQueue
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl">
              <Stethoscope className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold text-white">Doctor Specialties & Taxonomy Manager</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20">
              Canonical Ring Architecture
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Strictly normalized canonical specialties, Bengali & English alias synonym rings, compound component trees, and unverified ingestion triage queue.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            title="Refresh Taxonomy"
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700/60 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={onAddCanonical}
            className="px-3.5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-teal-600/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Canonical</span>
          </button>

          <button
            onClick={onAddAlias}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Tag className="w-4 h-4" />
            <span>Add Alias</span>
          </button>
        </div>
      </div>

      {/* METRIC CARDS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800/80">
        <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-3">
          <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
            <span>Canonical Specialties</span>
          </div>
          <div className="text-xl font-black text-white mt-1">
            {counts.canonical_specialties || canonicalCount}
          </div>
          <div className="text-[10px] text-teal-400/80 mt-0.5">Strict single-source truth</div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-3">
          <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-emerald-400" />
            <span>Total Aliases Ring</span>
          </div>
          <div className="text-xl font-black text-white mt-1">
            {counts.total_aliases || aliasesCount}
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">EN & Bengali variations</div>
        </div>

        <div 
          onClick={onOpenReviewQueue} 
          className={`bg-slate-950/60 border rounded-xl p-3 cursor-pointer transition ${
            counts.unverified_aliases > 0 
              ? 'border-amber-500/40 hover:border-amber-500/70 shadow-sm shadow-amber-500/10' 
              : 'border-slate-800/60 hover:border-slate-700'
          }`}
        >
          <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className={`w-3.5 h-3.5 ${counts.unverified_aliases > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
              <span>Review Queue</span>
            </span>
            {counts.unverified_aliases > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Action
              </span>
            )}
          </div>
          <div className={`text-xl font-black mt-1 ${counts.unverified_aliases > 0 ? 'text-amber-300' : 'text-slate-300'}`}>
            {counts.unverified_aliases}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {counts.unverified_aliases > 0 ? 'Pending alias triage' : 'All aliases verified'}
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-3">
          <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>Doctor Tags</span>
          </div>
          <div className="text-xl font-black text-white mt-1">
            {totalDoctorsCovered}
          </div>
          <div className="text-[10px] text-cyan-400/80 mt-0.5">Specialist mappings</div>
        </div>
      </div>
    </div>
  );
}
