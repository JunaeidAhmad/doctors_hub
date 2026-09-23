import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export default function SearchSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  labelKey = 'name',
  valueKey = 'id',
  subtitleKey,
  disabled = false,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);

  const selectedOption = options.find(opt => String(opt[valueKey]) === String(value));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => {
    const label = String(opt[labelKey] || '').toLowerCase();
    const subtitle = subtitleKey ? String(opt[subtitleKey] || '').toLowerCase() : '';
    const q = query.toLowerCase();
    return label.includes(q) || subtitle.includes(q);
  });

  return (
    <div ref={containerRef} className={`relative font-body ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-xs text-left flex items-center justify-between gap-2 transition shadow-subtle ${
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:border-slate-400 cursor-pointer'
        } ${isOpen ? 'border-[#094cb2] ring-1 ring-[#094cb2]' : ''}`}
      >
        <span className={selectedOption ? 'text-slate-900 font-semibold' : 'text-slate-400'}>
          {selectedOption ? (
            <span className="flex items-center gap-2">
              <span>{selectedOption[labelKey]}</span>
              {subtitleKey && selectedOption[subtitleKey] && (
                <span className="text-[11px] text-slate-500 font-normal">({selectedOption[subtitleKey]})</span>
              )}
            </span>
          ) : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-[#d1d5dc] rounded-sm shadow-elevated overflow-hidden animate-fadeIn">
          <div className="p-2 border-b border-[#e3e5ea] bg-[#f7f6f7]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-white border border-[#d1d5dc] rounded-sm pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#094cb2]"
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto admin-scrollbar py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-center text-xs text-slate-500">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt[valueKey]) === String(value);
                return (
                  <button
                    key={opt[valueKey]}
                    type="button"
                    onClick={() => {
                      onChange(opt[valueKey], opt);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between gap-2 transition cursor-pointer ${
                      isSelected ? 'bg-[#e7ebff] text-[#094cb2] font-semibold' : 'text-slate-700 hover:bg-[#f7f6f7] hover:text-slate-900'
                    }`}
                  >
                    <div>
                      <div>{opt[labelKey]}</div>
                      {subtitleKey && opt[subtitleKey] && (
                        <div className="text-[10px] text-slate-500 font-normal">{opt[subtitleKey]}</div>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#094cb2] shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
