import React from 'react';
import { Clock } from 'lucide-react';
import { parse24To12, format12To24, formatDisplayTime } from '../utils/scheduleUtils';

export default function TimePickerInput({ label, value, onChange, hasError }) {
  const { hour12, minute, period } = parse24To12(value);

  const handleHourChange = (newHour) => {
    onChange(format12To24(newHour, minute, period));
  };

  const handleMinuteChange = (newMinute) => {
    onChange(format12To24(hour12, newMinute, period));
  };

  const handlePeriodChange = (newPeriod) => {
    onChange(format12To24(hour12, minute, newPeriod));
  };

  const hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const standardMinutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
  const minuteOptions = standardMinutes.includes(minute)
    ? standardMinutes
    : [...standardMinutes, minute].sort((a, b) => Number(a) - Number(b));

  return (
    <div className={`p-3.5 rounded-2xl bg-slate-950/80 border transition-all ${
      hasError ? 'border-amber-500/50 bg-amber-500/5' : 'border-slate-800 hover:border-slate-700/90'
    }`}>
      <div className="flex items-center justify-between mb-2.5">
        <label className="text-slate-300 font-bold text-xs flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{label}</span>
        </label>
        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
          {formatDisplayTime(value)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Hour Select */}
        <div className="flex-1">
          <select
            value={hour12}
            onChange={(e) => handleHourChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-2 py-2 text-center text-white text-xs font-bold font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            aria-label={`${label} Hour`}
          >
            {hours.map((h) => (
              <option key={h} value={h} className="bg-slate-900 text-white">
                {String(h).padStart(2, '0')}
              </option>
            ))}
          </select>
          <span className="block text-[9px] text-slate-500 text-center mt-1 uppercase font-semibold tracking-wider">
            Hour
          </span>
        </div>

        <span className="text-slate-500 font-bold text-base mb-4">:</span>

        {/* Minute Select */}
        <div className="flex-1">
          <select
            value={minute}
            onChange={(e) => handleMinuteChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-2 py-2 text-center text-white text-xs font-bold font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            aria-label={`${label} Minute`}
          >
            {minuteOptions.map((m) => (
              <option key={m} value={m} className="bg-slate-900 text-white">
                {m}
              </option>
            ))}
          </select>
          <span className="block text-[9px] text-slate-500 text-center mt-1 uppercase font-semibold tracking-wider">
            Min
          </span>
        </div>

        {/* AM / PM Segmented Switch */}
        <div className="flex-1">
          <div className="flex bg-slate-900 border border-slate-700/80 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => handlePeriodChange('AM')}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                period === 'AM'
                  ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => handlePeriodChange('PM')}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                period === 'PM'
                  ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              PM
            </button>
          </div>
          <span className="block text-[9px] text-slate-500 text-center mt-1 uppercase font-semibold tracking-wider">
            AM / PM
          </span>
        </div>
      </div>
    </div>
  );
}
