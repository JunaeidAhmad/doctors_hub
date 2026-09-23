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
        <label className="block text-xs font-semibold text-slate-700 font-label">
          {label} {required && <span className="text-rose-600">*</span>}
        </label>
      )}

      {type === 'textarea' ? (
        <textarea
          rows={rows}
          value={value ?? ''}
          onChange={(e) => onChange && onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-white border border-[#d1d5dc] rounded-sm px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#094cb2] focus:ring-1 focus:ring-[#094cb2] transition shadow-subtle ${
            disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''
          } ${inputClassName}`}
        />
      ) : type === 'select' ? (
        <select
          value={value ?? ''}
          onChange={(e) => onChange && onChange(e.target.value)}
          disabled={disabled}
          className={`w-full bg-white border border-[#d1d5dc] rounded-sm px-3.5 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#094cb2] focus:ring-1 focus:ring-[#094cb2] transition shadow-subtle ${
            disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''
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
          className={`w-full bg-white border border-[#d1d5dc] rounded-sm px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#094cb2] focus:ring-1 focus:ring-[#094cb2] transition shadow-subtle ${
            disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''
          } ${inputClassName}`}
        />
      )}

      {helpText && (
        <p className="text-[11px] text-slate-500 font-label">{helpText}</p>
      )}
    </div>
  );
}
