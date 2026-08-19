import React from 'react';

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color = 'teal', 
  trend, 
  trendPositive = true, 
  subtitle,
  onClick,
  className = ''
}) {
  const colorMap = {
    teal: {
      bg: 'bg-teal-500/10',
      border: 'border-teal-500/20',
      text: 'text-teal-400',
      hover: 'hover:border-teal-500/40',
      glow: 'shadow-teal-500/10',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      hover: 'hover:border-emerald-500/40',
      glow: 'shadow-emerald-500/10',
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      text: 'text-cyan-400',
      hover: 'hover:border-cyan-500/40',
      glow: 'shadow-cyan-500/10',
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      hover: 'hover:border-amber-500/40',
      glow: 'shadow-amber-500/10',
    },
    rose: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      text: 'text-rose-400',
      hover: 'hover:border-rose-500/40',
      glow: 'shadow-rose-500/10',
    },
    indigo: {
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      text: 'text-indigo-400',
      hover: 'hover:border-indigo-500/40',
      glow: 'shadow-indigo-500/10',
    },
  };

  const scheme = colorMap[color] || colorMap.teal;

  return (
    <div 
      onClick={onClick}
      className={`relative bg-slate-900 border ${scheme.border} ${onClick ? `cursor-pointer ${scheme.hover}` : ''} rounded-2xl p-5 shadow-lg ${scheme.glow} transition-all duration-200 hover:-translate-y-0.5 animate-fadeIn ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">{title}</p>
          <h4 className="text-2xl font-black text-white mt-1">{value}</h4>
          {subtitle && (
            <p className="text-[11px] text-slate-400 mt-1 truncate">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${scheme.bg} ${scheme.text} shrink-0`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-1.5 text-xs font-semibold">
          <span className={trendPositive ? 'text-emerald-400' : 'text-rose-400'}>
            {trendPositive ? '↑' : '↓'} {trend}
          </span>
          <span className="text-slate-500 font-normal">vs last week</span>
        </div>
      )}
    </div>
  );
}
