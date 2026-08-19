import React from 'react';

export default function Toggle({ 
  checked = false, 
  onChange, 
  label, 
  description,
  disabled = false,
  color = 'teal',
  id,
  className = '' 
}) {
  const activeColor = color === 'emerald' ? 'bg-emerald-500' : color === 'cyan' ? 'bg-cyan-500' : 'bg-teal-500';

  return (
    <label 
      htmlFor={id} 
      className={`flex items-start justify-between gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {(label || description) && (
        <div className="min-w-0 flex-1">
          {label && <p className="text-xs font-semibold text-slate-200 select-none">{label}</p>}
          {description && <p className="text-[11px] text-slate-400 mt-0.5 select-none">{description}</p>}
        </div>
      )}

      <div className="relative inline-flex items-center shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={Boolean(checked)}
          onChange={(e) => !disabled && onChange && onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className={`w-11 h-6 bg-slate-800 border border-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:${activeColor} transition-colors duration-200`} />
      </div>
    </label>
  );
}
