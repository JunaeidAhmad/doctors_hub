import React from 'react';
import DiagnosticCentersTable from './DiagnosticCentersTable';

export default function DiagnosticTestCard({
  test = {},
  offerings = [],
  onBookTest,
}) {
  const categoryName = test.category_name || (test.category?.name) || 'Pathology';
  const testName = test.name || 'Diagnostic Investigation';

  // Compute price range across all offering centers
  const prices = offerings
    .map((o) => Number(o.calculated_price ?? o.price ?? 0))
    .filter((p) => p > 0);

  const minPrice = prices.length > 0 ? Math.min(...prices) : (test.price || 400);
  const maxPrice = prices.length > 0 ? Math.max(...prices) : (test.price || 450);

  // Accurate turnaround text with correct pluralization
  const reportHours = test.report_time_hours || 4;
  const turnaroundText =
    reportHours === 1
      ? 'Report in 1 hour'
      : reportHours === 24
      ? 'Report in 24 hours'
      : reportHours < 24
      ? `Report in ${reportHours} hours`
      : `Report in ${Math.round(reportHours / 24)} days`;

  const isFasting = Boolean(test.fasting_required);
  const prepInstructions = test.preparation_instructions || '';
  const isUsg = testName.toLowerCase().includes('ultrasonography') || testName.toLowerCase().includes('usg');
  const isLipid = testName.toLowerCase().includes('lipid') || testName.toLowerCase().includes('cholesterol');
  const isMri = testName.toLowerCase().includes('mri');

  // Category badge color theme
  const isRadiologyOrUsg = isMri || isUsg || categoryName.toLowerCase().includes('radiology') || categoryName.toLowerCase().includes('imaging');
  const categoryBadgeClass = isRadiologyOrUsg
    ? 'bg-secondary/10 text-secondary border border-secondary/20'
    : 'bg-primary/10 text-primary border border-primary/20';

  return (
    <article className="bg-surface-container-lowest rounded-2xl border border-outline-variant/70 p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Test Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4 pb-4 border-b border-outline-variant/60">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            {/* Category badge */}
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${categoryBadgeClass}`}>
              {categoryName}
            </span>

            {/* Turnaround time badge */}
            <span className="inline-flex items-center gap-1 text-xs text-secondary font-medium bg-secondary/10 px-2 py-0.5 rounded">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              <span>{turnaroundText}</span>
            </span>

            {/* Test-specific clinical badges matching Stitch reference */}
            {isUsg ? (
              <>
                <span className="inline-flex items-center gap-1 text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded">
                  <span className="material-symbols-outlined text-[14px]">female</span>
                  <span>Female &amp; Male Radiologist Available</span>
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                  <span className="material-symbols-outlined text-[14px]">water_drop</span>
                  <span>Full Bladder Required</span>
                </span>
              </>
            ) : isLipid ? (
              <>
                <span className="inline-flex items-center gap-1 text-xs text-error font-medium bg-error/10 px-2 py-0.5 rounded">
                  <span className="material-symbols-outlined text-[14px]">restaurant</span>
                  <span>12 Hours Fasting Required</span>
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded">
                  <span className="material-symbols-outlined text-[14px]">home_health</span>
                  <span>Home Blood Collection at 7:00 AM</span>
                </span>
              </>
            ) : isMri ? (
              <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                <span className="material-symbols-outlined text-[14px]">info</span>
                <span>Preparation guide included</span>
              </span>
            ) : isFasting ? (
              <span className="inline-flex items-center gap-1 text-xs text-error font-medium bg-error/10 px-2 py-0.5 rounded">
                <span className="material-symbols-outlined text-[14px]">restaurant</span>
                <span>12 Hours Fasting Required</span>
              </span>
            ) : prepInstructions && prepInstructions.toLowerCase().includes('bladder') ? (
              <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                <span className="material-symbols-outlined text-[14px]">water_drop</span>
                <span>Full Bladder Required</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                <span className="material-symbols-outlined text-[14px]">no_meals</span>
                <span>Fasting not required</span>
              </span>
            )}
          </div>

          <h3 className="font-headline-sm text-lg sm:text-xl text-on-surface font-bold">
            {testName}
          </h3>
          {test.description && (
            <p className="text-xs text-on-surface-variant line-clamp-1 mt-0.5">
              {test.description}
            </p>
          )}
        </div>

        {/* Price Range block */}
        <div className="shrink-0 text-left md:text-right">
          <span className="text-xs text-on-surface-variant block">Standard Range</span>
          <span className="font-headline-sm text-base sm:text-lg text-primary font-bold">
            ৳{Number(minPrice).toLocaleString('en-US')}
            {maxPrice > minPrice && ` - ৳${Number(maxPrice).toLocaleString('en-US')}`}
          </span>
        </div>
      </div>

      {/* Comparison Sub-Table */}
      <DiagnosticCentersTable
        offerings={offerings}
        testDetails={test}
        onBookTest={onBookTest}
      />
    </article>
  );
}
