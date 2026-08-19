import React from 'react';

export default function EditableField({
  label,
  value,
  onChange,
  type = 'text', // 'text' | 'textarea' | 'select' | 'chips'
  options = [],
  placeholder = '',
  required = false,
  disabled = false,
  rows = 3,
  helpText,
  className = '',
  inputClassName = ''
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-300">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
      )}

      {type === 'textarea' ? (
        <textarea
          rows={rows}
          value={value ?? ''}
          onChange={(e) => onChange && onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition ${
            disabled ? 'opacity-60 cursor-not-allowed' : ''
          } ${inputClassName}`}
        />
      ) : type === 'select' ? (
        <select
          value={value ?? ''}
          onChange={(e) => onChange && onChange(e.target.value)}
          disabled={disabled}
          className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-teal-500 transition ${
            disabled ? 'opacity-60 cursor-not-allowed' : ''
          } ${inputClassName}`}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => {
            const optVal = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={optVal} value={optVal}>
                {optLabel}
              </option>
            );
          })}
        </select>
      ) : (
        <input
          type={type}
          value={type === 'file' ? undefined : (value ?? '')}
          onChange={(e) => {
            if (onChange) {
              if (type === 'file') onChange(e.target.files[0] || null);
              else onChange(e.target.value);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition ${
            disabled ? 'opacity-60 cursor-not-allowed' : ''
          } ${inputClassName}`}
        />
      )}

      {helpText && (
        <p className="text-[11px] text-slate-500">{helpText}</p>
      )}
    </div>
  );
}
