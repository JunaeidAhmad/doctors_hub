import React from 'react';

export default function DiagnosticsEmptyState({ onResetAll, searchKeyword, locationLabel }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-12 text-center border border-outline-variant/60 max-w-lg mx-auto shadow-sm space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-surface-container-low text-on-surface-variant flex items-center justify-center mx-auto">
        <span className="material-symbols-outlined text-[32px]">science</span>
      </div>
      <div>
        <h3 className="text-lg font-bold text-on-surface">No Diagnostic Tests Found</h3>
        <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
          {searchKeyword
            ? `No tests matching "${searchKeyword}" were found in ${locationLabel}. Try adjusting your search or filters.`
            : `No diagnostic tests match your selected criteria in ${locationLabel}.`}
        </p>
      </div>
      <button
        type="button"
        onClick={onResetAll}
        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
      >
        Reset All Filters
      </button>
    </div>
  );
}
