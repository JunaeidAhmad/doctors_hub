import React from 'react';

export default function DoctorPagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 20,
  onPageChange
}) {
  if (totalItems === 0) return null;

  const from = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const to = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers
  const pages = [];
  const maxDisplayed = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxDisplayed - 1);

  if (endPage - startPage + 1 < maxDisplayed) {
    startPage = Math.max(1, endPage - maxDisplayed + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="p-5 sm:p-6 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-xs text-outline">
        Showing <span className="font-semibold text-on-surface">{from} - {to}</span> of{' '}
        <span className="font-semibold text-on-surface">{totalItems}</span> Registered Doctors
      </div>

      <div className="flex items-center space-x-1.5">
        {/* Prev Page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="w-9 h-9 rounded-lg border border-outline-variant text-outline hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          title="Previous Page"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>

        {/* First page if needed */}
        {startPage > 1 && (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              className="w-9 h-9 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer"
            >
              1
            </button>
            {startPage > 2 && <span className="px-1 text-outline text-xs">...</span>}
          </>
        )}

        {/* Page numbers */}
        {pages.map((p) => {
          const isActive = p === currentPage;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`w-9 h-9 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                isActive
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'border border-outline-variant text-on-surface hover:bg-surface-container'
              }`}
            >
              {p}
            </button>
          );
        })}

        {/* Last page if needed */}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-1 text-outline text-xs">...</span>}
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              className="w-9 h-9 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer"
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="w-9 h-9 rounded-lg border border-outline-variant text-outline hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          title="Next Page"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
