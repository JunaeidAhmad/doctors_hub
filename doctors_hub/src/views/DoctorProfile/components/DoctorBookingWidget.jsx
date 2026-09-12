import React, { useState, useEffect, useMemo } from 'react';

function formatTime12(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

function getAffScheduleDays(aff) {
  if (aff?.schedules && aff.schedules.length > 0) {
    const days = [...new Set(aff.schedules.map(s => s.day_of_week?.slice(0, 3)))];
    return days.join(', ');
  }
  if (aff?.visitSchedule) {
    return aff.visitSchedule.split('(')[0].trim();
  }
  return 'Daily / Regular';
}

function generateSlotsForSchedule(schedule) {
  if (!schedule || !schedule.start_time || !schedule.end_time) {
    return ['5:15 PM', '5:45 PM', '6:15 PM', '6:45 PM', '7:15 PM', '7:45 PM', '8:15 PM', '8:45 PM'];
  }
  const [startH, startM] = schedule.start_time.split(':').map(Number);
  const [endH, endM] = schedule.end_time.split(':').map(Number);
  const startMin = (startH || 0) * 60 + (startM || 0);
  const endMin = (endH || 0) * 60 + (endM || 0);
  const totalMin = endMin - startMin;

  if (totalMin <= 30) {
    return [formatTime12(schedule.start_time)];
  }

  const step = totalMin >= 300 ? 45 : 30;
  const slots = [];
  for (let m = startMin; m + 20 <= endMin && slots.length < 8; m += step) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    const displayM = min < 10 ? `0${min}` : min;
    slots.push(`${displayH}:${displayM} ${ampm}`);
  }

  return slots.length > 0 ? slots : ['5:15 PM', '5:45 PM', '6:15 PM', '6:45 PM', '7:15 PM', '7:45 PM'];
}

export default function DoctorBookingWidget({ 
  doctor, 
  affiliations: affiliationsProp,
  selectedAffIndex: propSelectedAffIndex,
  onSelectAffIndex,
  onBookAppointment, 
  showToast 
}) {
  if (!doctor) return null;

  const affiliations = useMemo(() => {
    if (Array.isArray(affiliationsProp) && affiliationsProp.length > 0) {
      return affiliationsProp;
    }
    if (Array.isArray(doctor?.affiliations) && doctor.affiliations.length > 1) {
      return doctor.affiliations;
    }
    if (Array.isArray(doctor?.chambers) && doctor.chambers.length > 1) {
      return doctor.chambers;
    }
    if (Array.isArray(doctor?.affiliations) && doctor.affiliations.length > 0) {
      return doctor.affiliations;
    }
    if (Array.isArray(doctor?.chambers) && doctor.chambers.length > 0) {
      return doctor.chambers;
    }
    return [
      {
        id: 'default-aff',
        facility_name: doctor?.institution || 'Medical Center Chamber',
        location_details: {
          name: doctor?.institution || 'Specialist Consultation Center',
          address_line: 'Chamber Room #408, 4th Floor',
          branch: 'Central',
          phone: '09613787801'
        },
        fee: '1200',
        schedules: [
          { day_of_week: 'Saturday', start_time: '17:00', end_time: '21:00' },
          { day_of_week: 'Monday', start_time: '17:00', end_time: '21:00' },
          { day_of_week: 'Wednesday', start_time: '17:00', end_time: '21:00' },
        ]
      }
    ];
  }, [affiliationsProp, doctor]);

  const [localAffIndex, setLocalAffIndex] = useState(0);
  const selectedAffIndex = typeof propSelectedAffIndex === 'number' ? propSelectedAffIndex : localAffIndex;

  const handleSelectAffIndex = (idx) => {
    if (onSelectAffIndex) {
      onSelectAffIndex(idx);
    }
    setLocalAffIndex(idx);
    setBookingSuccess(false);
  };

  const activeAff = affiliations[selectedAffIndex] || affiliations[0] || {};

  // Dates calculation: Next 4 days
  const dateOptions = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 4; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayName = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateStr = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      dates.push({
        id: i,
        dayName,
        dateStr,
        fullDate: d.toISOString().split('T')[0],
        status: i === 1 ? 'Limited' : 'Available',
        slotsLeft: i === 0 ? '8 left' : (i === 1 ? '3 left' : 'Open')
      });
    }
    return dates;
  }, []);

  const [selectedDateId, setSelectedDateId] = useState(0);
  const selectedDateObj = dateOptions.find(d => d.id === selectedDateId) || dateOptions[0];

  // Time slots for shift
  const timeSlots = useMemo(() => {
    const s = activeAff.schedules?.[0];
    return generateSlotsForSchedule(s);
  }, [activeAff]);

  const [selectedTime, setSelectedTime] = useState('6:15 PM');

  // Form Fields
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('Male');
  const [symptoms, setSymptoms] = useState('');
  const [smsConsent, setSmsConsent] = useState(true);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const feeAmount = parseInt(activeAff.fee || doctor?.fee || '1200', 10);
  const followUpFee = Math.round(feeAmount * 0.7);

  // Visiting schedule string
  const visitingHours = useMemo(() => {
    if (activeAff.schedules && activeAff.schedules.length > 0) {
      const s = activeAff.schedules[0];
      const start = formatTime12(s.start_time) || s.start_time?.slice(0, 5) || '5:00 PM';
      const end = formatTime12(s.end_time) || s.end_time?.slice(0, 5) || '9:00 PM';
      return `${start} – ${end}`;
    }
    if (activeAff.visitSchedule) {
      return activeAff.visitSchedule;
    }
    return '5:00 PM – 9:00 PM';
  }, [activeAff]);

  const scheduleDays = useMemo(() => {
    return getAffScheduleDays(activeAff);
  }, [activeAff]);

  const shiftInfo = useMemo(() => {
    if (activeAff.schedules && activeAff.schedules.length > 0) {
      const s = activeAff.schedules[0];
      const startH = parseInt(s.start_time?.split(':')[0] || '17', 10);
      if (startH < 12) return { session: 'Morning Session', shift: 'Morning Shift', icon: 'wb_sunny' };
      if (startH < 16) return { session: 'Afternoon Session', shift: 'Afternoon Shift', icon: 'wb_sunny' };
      return { session: 'Evening Session', shift: 'Evening Shift', icon: 'bedtime' };
    }
    return { session: 'Evening Session', shift: 'Evening Shift', icon: 'bedtime' };
  }, [activeAff]);

  // Keep selected time valid when activeAff changes
  useEffect(() => {
    if (timeSlots && timeSlots.length > 0 && !timeSlots.includes(selectedTime)) {
      setSelectedTime(timeSlots[Math.min(2, timeSlots.length - 1)] || timeSlots[0]);
    }
  }, [timeSlots, selectedTime]);

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    if (!patientName.trim()) {
      if (showToast) showToast('Please enter the patient name.', 'error');
      return;
    }
    if (!patientPhone.trim()) {
      if (showToast) showToast('Please enter the contact mobile number.', 'error');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setBookingSuccess(true);
      if (showToast) {
        showToast(`Appointment confirmed for ${patientName} on ${selectedDateObj.dateStr} at ${selectedTime}!`);
      }
      if (onBookAppointment) {
        onBookAppointment({
          doctor,
          chamber: activeAff,
          date: selectedDateObj.fullDate,
          time: selectedTime,
          patientName,
          patientPhone,
          patientAge,
          patientGender,
          symptoms
        });
      }
    }, 600);
  };

  return (
    <aside className="sticky top-24 space-y-6">
      <div className="bg-surface-container-lowest border border-primary/30 rounded-2xl overflow-hidden shadow-[0_10px_25px_-5px_rgba(15,23,42,0.08),0_8px_10px_-6px_rgba(15,23,42,0.04)] ring-1 ring-primary/10">
        
        {/* Booking Card Header */}
        <div className="bg-primary text-on-primary p-5 flex items-center justify-between">
          <div>
            <span className="text-label-sm font-label-sm text-primary-fixed uppercase tracking-wider font-bold">
              Chamber Appointment
            </span>
            <h3 className="text-title-lg font-title-lg font-bold text-white">
              Reserve Consultation Slot
            </h3>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-white/20 text-white rounded-full text-label-sm font-label-sm font-bold shadow-2xs">
              No Advance Fee
            </span>
          </div>
        </div>

        {/* Chamber Selector Tabs - Always Displayed */}
        <div className="p-4 bg-surface-container-low border-b border-outline-variant/60">
          <div className="flex items-center justify-between mb-2.5">
            <label className="block text-label-sm font-label-sm text-on-surface-variant uppercase font-bold tracking-wide text-slate-700">
              Select Chamber Facility
            </label>
            <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-md">
              {affiliations.length} {affiliations.length === 1 ? 'Chamber' : 'Chambers'}
            </span>
          </div>

          <div className={`grid gap-2.5 ${affiliations.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {affiliations.map((aff, idx) => {
              const isSelected = selectedAffIndex === idx;
              const name = aff.facility_name || aff.location_details?.name || aff.name || `Chamber ${idx + 1}`;
              const branchOrArea = aff.location_details?.branch 
                ? `${aff.location_details.branch} Branch` 
                : (aff.area ? `${aff.area}, Dhaka` : (aff.location_details?.address_line ? aff.location_details.address_line.split(',')[0] : 'Dhaka'));
              const days = getAffScheduleDays(aff);
              const chamberFee = aff.fee ? `৳${parseInt(aff.fee, 10)}` : null;

              return (
                <button
                  key={aff.id || idx}
                  type="button"
                  onClick={() => handleSelectAffIndex(idx)}
                  className={`text-left p-3 rounded-xl transition-all relative cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-2 border-primary bg-surface-container-lowest shadow-sm ring-1 ring-primary/20'
                      : 'border border-outline-variant bg-surface-container-low/70 hover:bg-surface-container hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5 w-full">
                    <p className={`font-bold text-sm leading-snug line-clamp-2 ${
                      isSelected ? 'text-primary' : 'text-slate-800'
                    }`}>
                      {name}
                    </p>
                    <span
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isSelected ? 'bg-primary' : 'border-2 border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {branchOrArea}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-200/60 w-full">
                    <span className={`text-[11px] font-medium truncate ${
                      isSelected ? 'text-teal-700 font-semibold' : 'text-slate-500'
                    }`}>
                      {days}
                    </span>
                    {chamberFee && (
                      <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded shrink-0 ml-1">
                        {chamberFee}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Chamber Details Summary Box */}
        <div className="p-5 border-b border-outline-variant/50 space-y-3 bg-surface-container-lowest text-body-md font-body-md">
          <div className="flex items-start gap-2.5">
            <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">
              location_on
            </span>
            <div>
              <span className="font-semibold text-on-surface text-slate-900 block">
                {activeAff.location_details?.address_line || activeAff.address || activeAff.facility_name || 'Chamber Facility'}
              </span>
              <p className="text-body-sm font-body-sm text-on-surface-variant text-slate-500">
                {activeAff.location_details?.branch ? `${activeAff.location_details.branch} Branch • ` : ''}Room #408 (Consultation Wing)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">
                schedule
              </span>
              <div>
                <p className="text-label-sm font-label-sm text-outline text-slate-500">Visiting Hours</p>
                <p className="text-label-md font-label-md text-on-surface font-semibold text-slate-800">{visitingHours}</p>
                <p className="text-[11px] text-teal-700 font-medium">{scheduleDays}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
                payments
              </span>
              <div>
                <p className="text-label-sm font-label-sm text-outline text-slate-500">Consultation Fee</p>
                <p className="text-label-md font-label-md text-on-surface font-bold text-slate-900">
                  ৳{feeAmount} <span className="text-body-sm font-normal text-on-surface-variant text-slate-500">(New)</span>
                </p>
                <p className="text-body-sm font-body-sm text-primary font-medium">৳{followUpFee} (Follow-up)</p>
              </div>
            </div>
          </div>

          {(activeAff.location_details?.phone || activeAff.phone) && (
            <div className="pt-2 flex items-center justify-between text-body-sm font-body-sm bg-surface-container-low/70 px-3.5 py-2 rounded-xl border border-outline-variant/40">
              <span className="flex items-center gap-1.5 text-on-surface-variant text-slate-600 font-medium">
                <span className="material-symbols-outlined text-[16px] text-primary">support_agent</span>
                <span>Chamber Contact:</span>
              </span>
              <a 
                href={`tel:${activeAff.location_details?.phone || activeAff.phone}`} 
                className="font-bold text-primary hover:underline"
              >
                {activeAff.location_details?.phone || activeAff.phone}
              </a>
            </div>
          )}
        </div>

        {/* Interactive Booking Content */}
        {bookingSuccess ? (
          <div className="p-6 bg-teal-50/70 border-t border-teal-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            </div>
            <h4 className="text-title-lg font-bold text-teal-900">Appointment Reserved!</h4>
            <p className="text-body-sm text-teal-800">
              Your appointment for <strong>{patientName}</strong> has been booked for <strong>{selectedDateObj.dateStr} at {selectedTime}</strong>.
            </p>
            <p className="text-xs text-slate-600 bg-white/80 p-3 rounded-lg border border-teal-200">
              No advance payment is required. Please arrive 15 minutes before your slot and pay ৳{feeAmount} at the chamber reception desk.
            </p>
            <button
              type="button"
              onClick={() => setBookingSuccess(false)}
              className="mt-2 px-4 py-2 bg-teal-700 text-white rounded-lg font-semibold text-xs hover:bg-teal-800 transition cursor-pointer"
            >
              Book Another Consultation
            </button>
          </div>
        ) : (
          <form onSubmit={handleBookingSubmit} className="p-5 space-y-5 bg-surface-container-lowest">
            
            {/* Step 1: Select Chamber Date */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-label-sm font-label-sm text-on-surface font-bold uppercase tracking-wider text-slate-700">
                  1. Select Date
                </label>
                <span className="text-label-sm font-label-sm text-primary font-semibold">
                  {selectedDateObj.dateStr}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {dateOptions.map((opt) => {
                  const isSelected = selectedDateId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedDateId(opt.id)}
                      className={`p-2 rounded-xl transition-all cursor-pointer text-center ${
                        isSelected
                          ? 'border-2 border-primary bg-teal-50 text-on-surface shadow-xs'
                          : 'border border-outline-variant hover:border-primary/60 text-on-surface hover:bg-surface-container-low'
                      }`}
                    >
                      <p className={`text-label-sm font-label-sm font-bold ${isSelected ? 'text-primary' : 'text-slate-600'}`}>
                        {opt.dayName}
                      </p>
                      <p className="text-title-md font-title-md font-bold text-slate-900 mt-0.5">
                        {opt.dateStr.split(' ')[0]} {opt.dateStr.split(' ')[1]}
                      </p>
                      <span className={`text-[10px] block leading-none font-semibold mt-1 ${isSelected ? 'text-primary' : 'text-slate-500'}`}>
                        {opt.slotsLeft}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Chamber Shift */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-label-sm font-label-sm text-on-surface font-bold uppercase tracking-wider text-slate-700">
                  2. Chamber Shift
                </label>
                <span className="text-label-sm font-label-sm text-slate-500 font-medium">{shiftInfo.session}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-low/70 border border-outline-variant/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">{shiftInfo.icon}</span>
                  <span className="text-label-md font-label-md font-semibold text-on-surface text-slate-800">
                    {shiftInfo.shift} ({visitingHours})
                  </span>
                </div>
                <span className="text-label-sm font-label-sm bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-bold">
                  Active
                </span>
              </div>
            </div>

            {/* Step 3: Time Slot Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-label-sm font-label-sm text-on-surface font-bold uppercase tracking-wider text-slate-700">
                  3. Select Appointment Time
                </label>
                <span className="text-label-sm font-label-sm text-primary flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  Approx. Timing
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {timeSlots.map((slot, idx) => {
                  const isSelected = selectedTime === slot;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedTime(slot)}
                      className={`p-2 rounded-xl text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-2 border-primary bg-primary text-white shadow-xs scale-[1.02]'
                          : 'border border-outline-variant/70 bg-surface-container-lowest hover:border-primary/50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-label-sm font-label-sm font-bold ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                          Slot {idx + 1}
                        </span>
                        {isSelected ? (
                          <span className="material-symbols-outlined text-[15px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                            check_circle
                          </span>
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                        )}
                      </div>
                      <p className={`text-label-md font-label-md font-bold mt-1 ${isSelected ? 'text-white' : 'text-primary'}`}>
                        {slot}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Patient Details Quick Form */}
            <div className="pt-3 border-t border-outline-variant/60 space-y-3.5">
              <label className="block text-label-sm font-label-sm text-on-surface font-bold uppercase tracking-wider text-slate-700">
                4. Patient Details
              </label>

              <div>
                <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1 font-medium text-slate-600">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mohammad Ali"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant px-3.5 py-2 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1 font-medium text-slate-600">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="017..."
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant px-3.5 py-2 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1 font-medium text-slate-600">
                      Age
                    </label>
                    <input
                      type="number"
                      placeholder="45"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                      className="w-full rounded-xl border border-outline-variant px-3 py-2 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1 font-medium text-slate-600">
                      Gender
                    </label>
                    <select
                      value={patientGender}
                      onChange={(e) => setPatientGender(e.target.value)}
                      className="w-full rounded-xl border border-outline-variant px-2.5 py-2 text-body-md text-on-surface focus:outline-none focus:border-primary bg-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1 font-medium text-slate-600">
                  Reason for Consultation / Symptoms
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Regular health checkup, review prescription reports..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant px-3.5 py-2 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white resize-y"
                />
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  id="sms-consent"
                  type="checkbox"
                  checked={smsConsent}
                  onChange={(e) => setSmsConsent(e.target.checked)}
                  className="rounded border-outline text-primary focus:ring-primary mt-1 cursor-pointer"
                />
                <label htmlFor="sms-consent" className="text-body-sm font-body-sm text-on-surface-variant text-slate-600 cursor-pointer">
                  Send chamber appointment schedule &amp; SMS updates to the above mobile number.
                </label>
              </div>

              {/* Confirm Appointment CTA */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-primary-container text-white font-title-md text-title-md font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer disabled:opacity-75"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {submitting ? 'hourglass_top' : 'check_circle'}
                </span>
                <span>{submitting ? 'Confirming Appointment...' : `Confirm Appointment (${selectedTime})`}</span>
              </button>

              <div className="text-center pt-1">
                <p className="text-label-sm font-label-sm text-on-surface-variant flex items-center justify-center gap-1.5 text-slate-500">
                  <span className="material-symbols-outlined text-[16px] text-primary">shield</span>
                  <span>Zero advance payment. Pay ৳{feeAmount} at the chamber desk.</span>
                </p>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Emergency Protocol Banner */}
      <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/70 flex items-start gap-3 text-slate-800">
        <span className="material-symbols-outlined text-rose-600 text-[22px] shrink-0 mt-0.5">
          warning
        </span>
        <div className="text-body-sm font-body-sm">
          <span className="font-bold text-rose-700 block">Acute Emergency Notice</span>
          <p className="text-slate-600 mt-0.5 leading-relaxed">
            Do not wait for regular chamber appointment hours in critical situations. Rush to the nearest Emergency Department or specialized Intensive Care Unit immediately.
          </p>
        </div>
      </div>
    </aside>
  );
}
