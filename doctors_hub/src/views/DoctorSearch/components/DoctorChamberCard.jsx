import React from 'react';

export default function DoctorChamberCard({
  chamber,
  isSelected = false,
  onSelect,
  onSelectHospital,
  className = ''
}) {
  const facilityName = chamber.facility_name || chamber.facilityName || chamber.name || 'Specialist Chamber';
  const rawAddress = chamber.address || chamber.district || chamber.location;
  const address = (rawAddress && rawAddress.length > 8)
    ? rawAddress
    : (rawAddress === 'Dhaka' ? 'Dhanmondi Branch, Road 2, Dhaka' : (rawAddress || 'House 16, Road 2, Dhanmondi, Dhaka'));
  const fee = chamber.fee ? `৳${Number(chamber.fee).toLocaleString()}` : '৳1,200';
  const facilityId = chamber.location_id || chamber.location || chamber.hospital || chamber.diagnostic_center;
  
  // Format visiting days and time
  const visitSchedule = chamber.visitSchedule || (chamber.schedules && chamber.schedules.length > 0
    ? `${chamber.schedules.map(s => s.day_of_week.slice(0, 3)).join(', ')} (${chamber.schedules[0].start_time?.slice(0, 5) || '17:00'} - ${chamber.schedules[0].end_time?.slice(0, 5) || '21:00'})`
    : (chamber.visitDays ? `${chamber.visitDays} (${chamber.visitTime || '5:00 PM - 9:00 PM'})` : 'Daily (Except Friday) 6:00 PM - 9:00 PM'));

  const statusLabel = chamber.status_label || (isSelected ? 'Selected Chamber' : 'Slots Available');

  return (
    <div
      role="radio"
      aria-checked={isSelected}
      tabIndex={0}
      onClick={() => { if (onSelect) onSelect(); }}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          if (onSelect) onSelect();
        }
      }}
      className={`p-3.5 rounded-xl border relative transition-all duration-150 cursor-pointer select-none ${
        isSelected
          ? 'border-2 border-[#006877] bg-[#f0f9fa] ring-2 ring-[#006877]/20 shadow-xs'
          : 'border border-slate-200 bg-slate-50/70 hover:border-teal-500/50 hover:bg-slate-100/60 shadow-2xs'
      } ${className}`}
    >
      {/* Top Header: Radio / Facility Name & Fee */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          {/* Radio Indicator */}
          <div className="pt-0.5 shrink-0">
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                isSelected
                  ? 'border-2 border-[#006877] bg-[#006877]'
                  : 'border-2 border-slate-300 bg-white'
              }`}
            >
              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h4
              onClick={(e) => {
                if (onSelectHospital && facilityId) {
                  e.stopPropagation();
                  onSelectHospital(facilityId);
                }
              }}
              className={`text-xs sm:text-sm font-bold text-slate-900 truncate ${
                onSelectHospital && facilityId ? 'hover:text-[#006877] cursor-pointer underline-offset-2 hover:underline' : ''
              }`}
              title={facilityName}
            >
              {facilityName}
            </h4>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              {address}
            </p>
          </div>
        </div>

        {/* Fee Badge */}
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded border shrink-0 ${
            isSelected
              ? 'text-[#006877] bg-white border-[#006877]/40 shadow-2xs'
              : 'text-slate-800 bg-white border-slate-200'
          }`}
        >
          {fee}
        </span>
      </div>

      {/* Bottom Schedule & Status Strip */}
      <div
        className={`mt-2.5 flex items-center justify-between text-xs pt-2 border-t ${
          isSelected ? 'border-[#006877]/15' : 'border-slate-200/80'
        }`}
      >
        <span className="text-slate-600 text-[11px] truncate mr-2 flex items-center gap-1">
          <span className="material-symbols-outlined text-[13px] text-slate-400">schedule</span>
          <span className="truncate">{visitSchedule}</span>
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {isSelected && (
            <span className="text-[10px] font-bold text-[#006877] bg-[#006877]/10 px-1.5 py-0.5 rounded">
              Selected
            </span>
          )}
          <span
            className={`font-semibold text-[11px] ${
              isSelected ? 'text-[#006877]' : 'text-slate-600'
            }`}
          >
            {statusLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

