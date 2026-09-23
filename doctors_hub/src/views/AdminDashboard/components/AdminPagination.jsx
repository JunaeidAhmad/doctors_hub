import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminPagination({ page, totalPages, onPageChange }) {
  const current = Math.max(1, parseInt(page, 10) || 1);
  const total = Math.max(1, parseInt(totalPages, 10) || 1);
  if (total <= 1) return null;

  const pages = [];
  const addPage = (p) => {
    if (p >= 1 && p <= total && !pages.includes(p)) pages.push(p);
  };
  addPage(1);
  addPage(total);
  for (let p = current - 2; p <= current + 2; p++) addPage(p);
  pages.sort((a, b) => a - b);

  const items = [];
  let prev = 0;
  pages.forEach((p) => {
    if (prev && p - prev > 1) items.push({ type: 'ellipsis', key: `e${prev}-${p}` });
    items.push({ type: 'page', page: p, key: `p${p}` });
    prev = p;
  });

  return (
    <nav className="flex flex-col sm:flex-row items-center justify-between p-3.5 bg-[#f7f6f7] border-t border-[#d1d5dc] gap-3 font-label text-xs text-slate-600" aria-label="Pagination">
      <div className="flex items-center gap-1.5">
        <span>Showing Page</span>
        <strong className="text-slate-900 font-semibold">{current}</strong>
        <span>of</span>
        <strong className="text-slate-900 font-semibold">{total}</strong>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(current - 1)}
          disabled={current <= 1}
          aria-label="Previous page"
          className="p-1.5 rounded-sm border border-[#d1d5dc] bg-white text-slate-600 hover:bg-[#f0eeef] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-subtle cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        {items.map((it) =>
          it.type === 'ellipsis' ? (
            <span key={it.key} className="px-1 text-slate-400 select-none">…</span>
          ) : (
            <button
              key={it.key}
              onClick={() => onPageChange(it.page)}
              aria-current={it.page === current ? 'page' : undefined}
              className={`w-7 h-7 rounded-sm text-xs font-medium transition-all flex items-center justify-center cursor-pointer ${
                it.page === current
                  ? 'bg-[#094cb2] text-white shadow-sm font-semibold'
                  : 'bg-white text-slate-700 border border-[#d1d5dc] hover:bg-[#f0eeef] shadow-subtle'
              }`}
            >
              {it.page}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(current + 1)}
          disabled={current >= total}
          aria-label="Next page"
          className="p-1.5 rounded-sm border border-[#d1d5dc] bg-white text-slate-600 hover:bg-[#f0eeef] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-subtle cursor-pointer"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </nav>
  );
}

