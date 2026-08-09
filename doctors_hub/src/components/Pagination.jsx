import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const addPage = (p) => {
    if (p >= 1 && p <= totalPages && !pages.includes(p)) pages.push(p);
  };
  addPage(1);
  addPage(totalPages);
  for (let p = page - 2; p <= page + 2; p++) addPage(p);
  pages.sort((a, b) => a - b);

  const items = [];
  let prev = 0;
  pages.forEach((p) => {
    if (prev && p - prev > 1) items.push({ type: 'ellipsis', key: `e${prev}-${p}` });
    items.push({ type: 'page', page: p, key: `p${p}` });
    prev = p;
  });

  return (
    <nav className="flex items-center justify-center gap-1.5 mt-8 flex-wrap" aria-label="Pagination">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:border-emerald-400 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {items.map((it) =>
        it.type === 'ellipsis' ? (
          <span key={it.key} className="px-1 text-slate-400 select-none">…</span>
        ) : (
          <button
            key={it.key}
            onClick={() => onPageChange(it.page)}
            aria-current={it.page === page ? 'page' : undefined}
            className={`min-w-9 h-9 px-3 rounded-xl text-xs font-bold transition-all ${
              it.page === page
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-400'
            }`}
          >
            {it.page}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:border-emerald-400 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}
