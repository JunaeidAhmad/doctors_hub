import React from 'react';

export default function DiagnosticsBreadcrumbs({ locationLabel = 'Dhaka', onNavigateHome }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <nav className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
        <button
          type="button"
          onClick={onNavigateHome}
          className="hover:text-primary transition-colors cursor-pointer"
        >
          Home
        </button>
        <span className="text-outline-variant">/</span>
        <span className="text-primary font-semibold">Diagnostics &amp; Lab Tests</span>
        <span className="text-outline-variant">/</span>
        <span className="text-on-surface font-semibold">{locationLabel}</span>
      </nav>

      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 font-label-md text-xs">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>Live Test Price &amp; Home Sample Tracker Enabled</span>
      </div>
    </div>
  );
}
