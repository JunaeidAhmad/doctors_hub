import React, { useState } from 'react';
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
    <div className="bg-white border border-[#d1d5dc] rounded-sm p-6 shadow-sm space-y-6">
      
      {/* Top Bar with Title & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-label text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm bg-[#e7ebff] text-[#094cb2] border border-[#cbd5e1] tracking-wider">
              Clinical Taxonomy Architecture
            </span>
            <span className="font-label text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm bg-[#f7f6f7] text-slate-600 border border-[#d1d5dc] tracking-wider">
              Synonym Rings
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-[#094cb2]" />
            <span>Doctor Specialties & Taxonomy Manager</span>
          </h2>
          <p className="text-xs font-body text-slate-500 mt-1 max-w-2xl">
            Normalized canonical specialties, Bengali &amp; English synonym rings, compound component hierarchies, and unverified ingestion triage queue.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onRefresh}
            title="Refresh Taxonomy"
            className="p-2 sm:px-3 sm:py-2 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 rounded-sm font-label text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          <button
            onClick={onAddCanonical}
            className="px-3.5 py-2 bg-[#094cb2] hover:bg-[#083e91] text-white font-label text-xs font-semibold uppercase tracking-wider rounded-sm transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Canonical</span>
          </button>

          <button
            onClick={onAddAlias}
            className="px-3.5 py-2 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 font-label text-xs font-semibold uppercase tracking-wider rounded-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Tag className="w-4 h-4 text-[#094cb2]" />
            <span>Add Alias</span>
          </button>
        </div>
      </div>

      {/* METRIC CARDS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-[#e3e5ea]">
        
        {/* Canonical Specialties */}
        <div className="bg-[#f7f6f7] border border-[#d1d5dc] rounded-sm p-4">
          <div className="font-label text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-[#094cb2]" />
            <span>Canonical Specialties</span>
          </div>
          <div className="text-2xl font-serif font-bold text-slate-900 mt-1.5">
            {counts.canonical_specialties || canonicalCount}
          </div>
          <div className="text-[10px] font-body text-slate-500 mt-1">Single-source clinical truth</div>
        </div>

        {/* Total Aliases */}
        <div className="bg-[#f7f6f7] border border-[#d1d5dc] rounded-sm p-4">
          <div className="font-label text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-emerald-600" />
            <span>Synonym Rings</span>
          </div>
          <div className="text-2xl font-serif font-bold text-slate-900 mt-1.5">
            {counts.total_aliases || aliasesCount}
          </div>
          <div className="text-[10px] font-body text-slate-500 mt-1">EN &amp; Bengali aliases</div>
        </div>

        {/* Review Queue */}
        <div 
          onClick={onOpenReviewQueue} 
          className={`border rounded-sm p-4 cursor-pointer transition ${
            counts.unverified_aliases > 0 
              ? 'bg-amber-50/70 border-amber-300 hover:border-amber-400' 
              : 'bg-[#f7f6f7] border-[#d1d5dc] hover:border-slate-400'
          }`}
        >
          <div className="font-label text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className={`w-3.5 h-3.5 ${counts.unverified_aliases > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
              <span>Review Queue</span>
            </span>
            {counts.unverified_aliases > 0 && (
              <span className="px-1.5 py-0.2 rounded-xs text-[9px] font-label font-bold bg-amber-200 text-amber-900">
                Action
              </span>
            )}
          </div>
          <div className={`text-2xl font-serif font-bold mt-1.5 ${counts.unverified_aliases > 0 ? 'text-amber-900' : 'text-slate-900'}`}>
            {counts.unverified_aliases}
          </div>
          <div className="text-[10px] font-body text-slate-500 mt-1">
            {counts.unverified_aliases > 0 ? 'Pending alias triage' : 'All aliases verified live'}
          </div>
        </div>

        {/* Doctor Tags */}
        <div className="bg-[#f7f6f7] border border-[#d1d5dc] rounded-sm p-4">
          <div className="font-label text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#094cb2]" />
            <span>Doctor Mappings</span>
          </div>
          <div className="text-2xl font-serif font-bold text-slate-900 mt-1.5">
            {totalDoctorsCovered}
          </div>
          <div className="text-[10px] font-body text-slate-500 mt-1">Specialist allocations</div>
        </div>

      </div>
    </div>
  );
}
