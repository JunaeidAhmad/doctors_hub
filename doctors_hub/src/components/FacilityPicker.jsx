import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, X, Loader2 } from 'lucide-react';
import { searchLocations, getLocationLabel } from '../services/api/admin';

export default function FacilityPicker({ value, onChange, locationType, disabled }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [loadingLabel, setLoadingLabel] = useState(false);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  // Load label for existing value
  useEffect(() => {
    if (!value) {
      setSelectedLabel('');
      return;
    }
    setLoadingLabel(true);
    getLocationLabel(value)
      .then((data) => {
        if (data) {
          const name = data.display_name || data.name || '';
          const area = data.area || '';
          const district = data.district || '';
          const loc = [area, district].filter(Boolean).join(', ');
          setSelectedLabel(loc ? `${name} · ${loc}` : name);
        }
      })
      .catch(() => setSelectedLabel(String(value)))
      .finally(() => setLoadingLabel(false));
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const doSearch = useCallback(async (q) => {
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await searchLocations({ search: q, location_type: locationType });
      const items = data?.results || (Array.isArray(data) ? data : []);
      setResults(items);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [locationType]);

  const handleQueryChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(q), 300);
  };

  const handleSelect = (loc) => {
    const name = loc.display_name || loc.name || '';
    const area = loc.area || '';
    const district = loc.district || '';
    const locStr = [area, district].filter(Boolean).join(', ');
    setSelectedLabel(locStr ? `${name} · ${locStr}` : name);
    setOpen(false);
    setQuery('');
    setResults([]);
    if (onChange) onChange(loc.id);
  };

  const handleClear = () => {
    setSelectedLabel('');
    setQuery('');
    setResults([]);
    if (onChange) onChange('');
  };

  return (
    <div ref={wrapperRef} className="relative">
      {selectedLabel ? (
        <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-sm px-3 py-2 text-xs">
          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="flex-1 truncate text-slate-800">{loadingLabel ? 'Loading...' : selectedLabel}</span>
          {!disabled && (
            <button type="button" onClick={handleClear} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search facility by name..."
            value={query}
            onChange={handleQueryChange}
            onFocus={() => query.length >= 2 && setOpen(true)}
            disabled={disabled}
            className="w-full bg-white border border-slate-300 rounded-sm pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-500 disabled:opacity-50"
          />
          {loading && (
            <Loader2 className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
          )}
        </div>
      )}

      {open && results.length > 0 && !selectedLabel && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-sm shadow-lg max-h-60 overflow-y-auto">
          {results.map((loc) => {
            const name = loc.display_name || loc.name || '';
            const area = loc.area || '';
            const district = loc.district || '';
            const locStr = [area, district].filter(Boolean).join(', ');
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => handleSelect(loc)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 border-b border-slate-100 last:border-0"
              >
                <div className="font-semibold text-slate-800 truncate">{name}</div>
                {locStr && <div className="text-slate-500 text-[10px] truncate">{locStr}</div>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
