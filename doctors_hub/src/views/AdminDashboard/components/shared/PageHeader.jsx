import React from 'react';

export default function PageHeader({ title, description, actionButton, filters, icon: Icon, badge, indexCode = 'BD-HQ-NODE' }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-[#d1d5dc] mb-6">
      <div className="flex flex-col gap-1.5">
        {/* Refined Scholarly Breadcrumb */}
        <nav className="flex items-center gap-2 font-label text-xs tracking-wide text-slate-500">
          <span className="hover:text-[#094cb2] transition-colors cursor-pointer">Central Operations</span>
          <span className="text-slate-300">/</span>
          <span className="hover:text-[#094cb2] transition-colors cursor-pointer">Master Directory</span>
          <span className="text-slate-300">/</span>
          <span className="text-[#094cb2] font-semibold">{title}</span>
        </nav>

        <div className="flex flex-wrap items-baseline gap-3 mt-1">
          <h1 className="font-headline font-serif text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            {Icon && <Icon className="w-6 h-6 md:w-7 md:h-7 text-[#094cb2] shrink-0" />}
            <span>{title}</span>
          </h1>
          <span className="font-label text-[11px] font-semibold text-slate-600 bg-[#f0eeef] px-2.5 py-0.5 rounded-full border border-[#d1d5dc]">
            {badge || `Index: ${indexCode}`}
          </span>
        </div>

        {description && (
          <p className="font-body text-xs md:text-sm text-slate-600 max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Header Action Controls */}
      <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-auto font-label">
        {filters}
        {actionButton}
      </div>
    </div>
  );
}

