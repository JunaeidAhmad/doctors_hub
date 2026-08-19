import React from 'react';
import { TableRowSkeleton } from './Skeleton';
import EmptyState from './EmptyState';

export default function DataTable({
  columns = [],
  data = [],
  isLoading = false,
  emptyIcon,
  emptyTitle = 'No data available',
  emptyDescription = 'No records match your criteria.',
  emptyActionLabel,
  onEmptyAction,
  keyExtractor = (item, idx) => item.id || idx,
  className = ''
}) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-left text-xs text-slate-300">
        <thead className="bg-slate-950/80 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800 sticky top-0 backdrop-blur-sm z-10">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                className={`py-3.5 px-4 font-bold ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <TableRowSkeleton key={idx} columns={columns.length} />
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-8">
                <EmptyState
                  icon={emptyIcon}
                  title={emptyTitle}
                  description={emptyDescription}
                  actionLabel={emptyActionLabel}
                  onAction={onEmptyAction}
                />
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr 
                key={keyExtractor(row, idx)} 
                className="hover:bg-slate-800/40 transition-colors animate-fadeIn"
                style={{ animationDelay: `${Math.min(idx * 30, 360)}ms` }}
              >
                {columns.map((col, cIdx) => (
                  <td 
                    key={col.key || cIdx} 
                    className={`py-4 px-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.cellClassName || ''}`}
                  >
                    {col.render ? col.render(row, idx) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
