import React from 'react';

export default function DiagnosticsResultsHeader({
  locationLabel = 'Dhaka',
  totalCount = 0,
  sortBy = 'relevance',
  onSortChange,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 className="font-title-lg text-title-lg text-on-surface font-bold">
          Showing Verified Diagnostics in {locationLabel}
        </h2>
        <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
          Real-time lab slots and transparent fee schedules
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-on-surface-variant font-label-md font-medium">Sort by:</span>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="py-1.5 pl-2.5 pr-8 bg-surface-container-lowest border border-outline-variant rounded-lg font-label-sm text-xs text-on-surface focus:ring-primary appearance-none cursor-pointer"
          >
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
          <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant pointer-events-none">
            keyboard_arrow_down
          </span>
        </div>
      </div>
    </div>
  );
}
