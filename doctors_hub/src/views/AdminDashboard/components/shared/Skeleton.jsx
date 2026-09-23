import React from 'react';

export function Skeleton({ className = '', height, width, rounded = 'rounded-sm' }) {
  const style = {};
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;

  return (
    <div 
      style={style}
      className={`skeleton-light ${rounded} ${className}`} 
    />
  );
}

export function TableRowSkeleton({ columns = 5 }) {
  return (
    <tr className="border-b border-[#e3e5ea] animate-fadeIn">
      {Array.from({ length: columns }).map((_, idx) => (
        <td key={idx} className="py-3 px-4">
          <Skeleton className="h-4 w-full max-w-[140px]" />
        </td>
      ))}
    </tr>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white border border-[#d1d5dc] rounded-sm p-4 shadow-card space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-8 w-8 rounded-sm" />
      </div>
      <Skeleton className="h-7 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export default Skeleton;

