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
  const accentBorder = color === 'emerald' ? 'border-emerald-500/20' : color === 'cyan' ? 'border-cyan-500/20' : 'border-slate-800';

  return (
    <div className={`bg-slate-900 border ${accentBorder} rounded-2xl p-6 shadow-xl space-y-5 animate-fadeIn ${className}`}>
      {(title || Icon || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-teal-400">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-white">{title}</h3>
              {description && (
                <p className="text-xs text-slate-400 mt-0.5">{description}</p>
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
