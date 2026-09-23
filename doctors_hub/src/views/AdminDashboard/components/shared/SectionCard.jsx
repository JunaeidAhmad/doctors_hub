import React from 'react';

export default function SectionCard({
  title,
  description,
  icon: Icon,
  actions,
  children,
  className = '',
  color = 'teal'
}) {
  return (
    <div className={`bg-white border border-[#d1d5dc] rounded-sm sm:rounded-md p-4 sm:p-6 shadow-card space-y-4 animate-fadeIn ${className}`}>
      {(title || Icon || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e3e5ea] pb-3.5">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 rounded-sm bg-[#e7ebff] border border-[#094cb2]/20 text-[#094cb2]">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            )}
            <div>
              <h3 className="font-serif text-base font-bold text-slate-900">{title}</h3>
              {description && (
                <p className="font-body text-xs text-slate-500 mt-0.5">{description}</p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
      <div>
        {children}
      </div>
    </div>
  );
}

