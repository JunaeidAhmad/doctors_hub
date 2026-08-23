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
    <nav className="flex items-center justify-between p-4 bg-slate-950 border-t border-slate-800 flex-wrap gap-3" aria-label="Pagination">
      <div className="text-xs text-slate-400">
        Page <span className="font-bold text-white">{current}</span> of <span className="font-bold text-white">{total}</span>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => onPageChange(current - 1)}
          disabled={current <= 1}
          aria-label="Previous page"
          className="p-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-400 disabled:opacity-40 hover:border-emerald-500 hover:text-emerald-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {items.map((it) =>
          it.type === 'ellipsis' ? (
            <span key={it.key} className="px-1 text-slate-500 select-none">…</span>
          ) : (
            <button
              key={it.key}
              onClick={() => onPageChange(it.page)}
              aria-current={it.page === current ? 'page' : undefined}
              className={`min-w-9 h-9 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                it.page === current
                  ? 'bg-emerald-600 text-white border border-emerald-500 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border border-slate-700 hover:border-emerald-500 hover:text-emerald-400'
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
          className="p-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-400 disabled:opacity-40 hover:border-emerald-500 hover:text-emerald-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
}
