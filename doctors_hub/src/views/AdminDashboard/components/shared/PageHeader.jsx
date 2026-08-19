import React from 'react';

export default function PageHeader({ title, description, actionButton, filters, icon: Icon, badge }) {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
      <div>
        {badge && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-2">
            {badge}
          </div>
        )}
        <h2 className="text-2xl font-black text-white flex items-center gap-2">
          {Icon && <Icon className="w-6 h-6 text-teal-400" />}
          <span>{title}</span>
        </h2>
        {description && (
          <p className="text-xs text-slate-400 mt-1">
            {description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 self-start md:self-auto w-full md:w-auto">
        {filters}
        {actionButton}
      </div>
    </div>
  );
}
