import React from 'react';

export default function Tabs({
  tabs = [],
  activeTab,
  onChange,
  color = 'teal',
  className = ''
}) {
  const activeStyles = {
    teal: 'text-teal-400 border-teal-500 bg-teal-500/10',
    emerald: 'text-emerald-400 border-emerald-500 bg-emerald-500/10',
    cyan: 'text-cyan-400 border-cyan-500 bg-cyan-500/10',
  };

  const activeCls = activeStyles[color] || activeStyles.teal;

  return (
    <div className={`flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2 ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isActive
                ? `${activeCls} shadow-sm`
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {Icon && <Icon className={`w-4 h-4 ${isActive ? '' : 'text-slate-500'}`} />}
            <span>{tab.label}</span>
            {tab.badge != null && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isActive ? 'bg-slate-900 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
