import React, { useState } from 'react';

export default function DiagnosticCentersTable({ offerings = [], testDetails = {}, onBookTest }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!offerings || offerings.length === 0) {
    return (
      <div className="p-4 bg-surface-container-low/50 rounded-lg text-xs text-on-surface-variant italic">
        No active lab offerings available for this test currently.
      </div>
    );
  }

  const getInitial = (name = '') => {
    const clean = name.replace(/^(the|dr\.|prof\.)\s+/i, '').trim();
    return clean ? clean.charAt(0).toUpperCase() : 'L';
  };

  const visibleOfferings = isExpanded ? offerings : offerings.slice(0, 3);

  return (
    <div className="overflow-x-auto -mx-6 sm:mx-0">
      <table className="w-full text-left border-collapse min-w-[560px]">
        <thead>
          <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-[11px] uppercase tracking-wider border-y border-outline-variant/60">
            <th className="py-2.5 px-4 font-bold">Diagnostic Lab Center</th>
            <th className="py-2.5 px-4 font-bold">Home Sample</th>
            <th className="py-2.5 px-4 font-bold">Report Time</th>
            <th className="py-2.5 px-4 font-bold">Test Fee</th>
            <th className="py-2.5 px-4 text-right font-bold">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/40 font-body-sm text-xs">
          {visibleOfferings.map((offering, idx) => {
            const center = offering.location_details || offering.center || offering.branch || {};
            const centerName = center.name || offering.facility_name || 'Diagnostic Center';
            const branchName = center.branch || '';
            const initial = getInitial(centerName);

            const isHome = Boolean(offering.home_sample_collection);
            const homeNote = offering.home_sample_note || (isHome ? 'Available' : 'Center Visit Only');

            const reportTime = offering.report_time || (testDetails.report_time_hours ? `Same day (${testDetails.report_time_hours} hrs)` : 'Same day (4 hrs)');
            const fee = offering.calculated_price ?? offering.price ?? 0;
            const originalFee = offering.price && Number(offering.price) > Number(fee) ? offering.price : null;

            // Alternating row background tint matching Stitch reference
            const rowBg = idx % 2 === 1 ? 'bg-surface-container-low/30' : 'bg-transparent';

            return (
              <tr
                key={offering.id || `${centerName}-${idx}`}
                className={`hover:bg-surface-container-lowest transition-colors ${rowBg}`}
              >
                {/* Center name + initial */}
                <td className="py-3 px-4 font-semibold text-on-surface">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-surface-container flex items-center justify-center font-bold text-xs text-primary shrink-0">
                      {initial}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 block leading-tight">
                        {centerName}
                      </span>
                      {branchName && (
                        <span className="text-[11px] font-normal text-on-surface-variant">
                          {branchName}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Home sample badge */}
                <td className="py-3 px-4">
                  {isHome ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-primary/10 text-primary font-medium">
                      {homeNote}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-surface-container text-on-surface-variant font-medium">
                      Center Visit Only
                    </span>
                  )}
                </td>

                {/* Report time */}
                <td className="py-3 px-4 text-on-surface-variant font-normal whitespace-nowrap">
                  {reportTime}
                </td>

                {/* Fee */}
                <td className="py-3 px-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-bold text-on-surface text-base">
                      ৳{Number(fee).toLocaleString('en-US')}
                    </span>
                    {originalFee && (
                      <span className="text-[11px] text-on-surface-variant line-through">
                        ৳{Number(originalFee).toLocaleString('en-US')}
                      </span>
                    )}
                  </div>
                </td>

                {/* Book Action */}
                <td className="py-3 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => onBookTest && onBookTest(offering, center, testDetails)}
                    className="px-3.5 py-1.5 bg-primary text-on-primary font-label-md text-xs font-semibold rounded shadow-sm hover:bg-primary-container active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                  >
                    Book Now
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Expand / Collapse toggle for tests with many centers */}
      {offerings.length > 3 && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-2.5 text-xs font-semibold text-primary hover:bg-surface-container-low/40 transition-colors border-t border-outline-variant/40 flex items-center justify-center gap-1 cursor-pointer"
        >
          <span>
            {isExpanded
              ? 'Show Fewer Diagnostic Centers'
              : `+ Show ${offerings.length - 3} More Diagnostic Center${offerings.length - 3 > 1 ? 's' : ''}`}
          </span>
          <span className="material-symbols-outlined text-[16px]">
            {isExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
          </span>
        </button>
      )}
    </div>
  );
}
