import React, { useState, useEffect, useMemo } from 'react';
import { getAffiliationAvailability } from '../../../services/api/doctors';
import { api } from '../../../services/api';
import { formatDisplayTime } from '../../../utils/scheduleUtils';

function getAffScheduleDays(aff) {
  if (aff?.schedules && aff.schedules.length > 0) {
    const days = [...new Set(aff.schedules.map(s => s.day_of_week?.slice(0, 3)))];
    return days.join(', ');
  }
  if (aff?.visitSchedule) {
    return aff.visitSchedule.split('(')[0].trim();
  }
  return 'Regular';
}

export default function DoctorBookingWidget({ 
  doctor, 
  affiliations: affiliationsProp,
  selectedAffIndex: propSelectedAffIndex,
  onSelectAffIndex,
  onBookAppointment, 
  showToast 
}) {
  const affiliations = useMemo(() => {
    if (Array.isArray(affiliationsProp) && affiliationsProp.length > 0) {
      return affiliationsProp;
    }
    if (Array.isArray(doctor?.affiliations) && doctor.affiliations.length > 0) {
      return doctor.affiliations;
    }
    if (Array.isArray(doctor?.chambers) && doctor.chambers.length > 0) {
      return doctor.chambers;
    }
    return [];
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

  const activeAff = affiliations[selectedAffIndex] || affiliations[0] || null;

  // Availability from API
  const [availability, setAvailability] = useState(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [selectedSessionKey, setSelectedSessionKey] = useState('');

  useEffect(() => {
    let isMounted = true;
    if (!activeAff?.id) {
      setAvailability(null);
      setSelectedDateStr('');
      setSelectedSessionKey('');
      return;
    }

    setLoadingAvailability(true);
    getAffiliationAvailability(activeAff.id, { days: 7 })
      .then((data) => {
        if (!isMounted) return;
        setAvailability(data);
        const dates = data?.dates || [];
        const firstAvailDate = dates.find(d => d.status !== 'closed' && d.sessions?.some(s => s.status === 'available')) || dates[0];
        if (firstAvailDate) {
          setSelectedDateStr(firstAvailDate.date);
          const firstAvailSession = firstAvailDate.sessions?.find(s => s.status === 'available') || firstAvailDate.sessions?.[0];
          setSelectedSessionKey(firstAvailSession?.session_key || '');
        } else {
          setSelectedDateStr('');
          setSelectedSessionKey('');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load availability:', err);
        setAvailability(null);
      })
      .finally(() => {
        if (isMounted) setLoadingAvailability(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeAff?.id]);

  const dates = availability?.dates || [];
  const selectedDateObj = dates.find(d => d.date === selectedDateStr) || dates[0] || null;
  const sessions = selectedDateObj?.sessions || [];
  const selectedSession = sessions.find(s => s.session_key === selectedSessionKey) || sessions[0] || null;

  // Form Fields
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('Male');
  const [symptoms, setSymptoms] = useState('');
  const [smsConsent, setSmsConsent] = useState(true);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const feeAmount = activeAff?.fee ? parseInt(activeAff.fee, 10) : (doctor?.fee ? parseInt(doctor.fee, 10) : 0);
  const followUpFee = Math.round(feeAmount * 0.7);

  const visitingHours = useMemo(() => {
    if (activeAff?.schedules && activeAff.schedules.length > 0) {
      const s = activeAff.schedules[0];
      const start = formatDisplayTime(s.start_time) || s.start_time?.slice(0, 5) || '';
      const end = formatDisplayTime(s.end_time) || s.end_time?.slice(0, 5) || '';
      return start && end ? `${start} – ${end}` : '';
    }
    return activeAff?.visitSchedule || '';
  }, [activeAff]);

  const scheduleDays = useMemo(() => {
    return getAffScheduleDays(activeAff);
  }, [activeAff]);

  const handleSelectDate = (dateObj) => {
    setSelectedDateStr(dateObj.date);
    const firstAvailSession = dateObj.sessions?.find(s => s.status === 'available') || dateObj.sessions?.[0];
    setSelectedSessionKey(firstAvailSession?.session_key || '');
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSessionKey) {
      if (showToast) showToast('Please select an available consultation session.', 'error');
      return;
    }
    if (!patientName.trim()) {
      if (showToast) showToast('Please enter the patient name.', 'error');
      return;
    }
    if (!patientPhone.trim()) {
      if (showToast) showToast('Please enter the contact mobile number.', 'error');
      return;
    }

    if (onBookAppointment) {
      onBookAppointment({
        doctor,
        chamber: activeAff,
        date: selectedDateStr,
        sessionKey: selectedSessionKey,
        session: selectedSession,
        time: formatDisplayTime(selectedSession?.estimated_time || selectedSession?.start_time),
        patientName,
        patientPhone,
        patientAge,
        patientGender,
        symptoms
      });
      return;
    }

    // Direct booking flow if onBookAppointment not passed
    setSubmitting(true);
    try {
      const res = await api.createDoctorBooking({
        affiliation_id: activeAff.id,
        date: selectedDateStr,
        session_key: selectedSessionKey,
        patient_name: patientName.trim(),
        patient_phone: patientPhone.trim(),
        patient_age: patientAge ? parseInt(patientAge, 10) : undefined,
        gender: patientGender.toLowerCase(),
        notes: symptoms
      });

      if (!res || res.serial_number == null) {
        throw new Error('No serial number returned from server.');
      }

      setBookingSuccess(true);
      if (showToast) {
        showToast(`Serial #${res.serial_number} confirmed for ${patientName}!`, 'success');
      }
    } catch (err) {
      console.error('Booking submission error:', err);
      if (showToast) showToast(err?.message || 'Failed to complete booking.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!doctor) return null;

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
              Reserve Consultation Serial
            </h3>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-white/20 text-white rounded-full text-label-sm font-label-sm font-bold shadow-2xs">
              No Advance Fee
            </span>
          </div>
        </div>

        {/* Chamber Selector Tabs - When multiple chambers exist */}
        {affiliations.length > 1 && (
          <div className="p-4 bg-surface-container-low border-b border-outline-variant/60">
            <div className="flex items-center justify-between mb-2.5">
              <label className="block text-label-sm font-label-sm text-on-surface-variant uppercase font-bold tracking-wide text-slate-700">
                Select Chamber Facility
              </label>
              <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-md">
                {affiliations.length} Chambers
              </span>
            </div>

            <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2">
              {affiliations.map((aff, idx) => {
                const isSelected = selectedAffIndex === idx;
                const fac = aff.facility || aff.location || {};
                const name = fac.display_name || fac.name || aff.name || `Chamber ${idx + 1}`;
                const branchOrArea = fac.branch 
                  ? `${fac.branch} Branch` 
                  : (fac.area ? `${fac.area}, Dhaka` : (fac.address ? fac.address.split(',')[0] : 'Dhaka'));
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
        )}

        {/* Selected Chamber Details Summary Box */}
        {activeAff && (
          <div className="p-5 border-b border-outline-variant/50 space-y-3 bg-surface-container-lowest text-body-md font-body-md">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">
                location_on
              </span>
              <div>
                <span className="font-semibold text-on-surface text-slate-900 block">
                  {activeAff.facility?.display_name || activeAff.facility?.name || activeAff.name || 'Chamber Facility'}
                </span>
                <p className="text-body-sm font-body-sm text-on-surface-variant text-slate-500">
                  {activeAff.facility?.branch ? `${activeAff.facility.branch} Branch • ` : ''}{activeAff.facility?.address || activeAff.address || 'Consultation Wing'}
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
                  <p className="text-label-md font-label-md text-on-surface font-semibold text-slate-800">
                    {visitingHours || 'Check sessions below'}
                  </p>
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

            {(activeAff.facility?.phone || activeAff.phone) && (
              <div className="pt-2 flex items-center justify-between text-body-sm font-body-sm bg-surface-container-low/70 px-3.5 py-2 rounded-xl border border-outline-variant/40">
                <span className="flex items-center gap-1.5 text-on-surface-variant text-slate-600 font-medium">
                  <span className="material-symbols-outlined text-[16px] text-primary">support_agent</span>
                  <span>Chamber Contact:</span>
                </span>
                <a 
                  href={`tel:${activeAff.facility?.phone || activeAff.phone}`} 
                  className="font-bold text-primary hover:underline"
                >
                  {activeAff.facility?.phone || activeAff.phone}
                </a>
              </div>
            )}
          </div>
        )}

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
              Your appointment for <strong>{patientName}</strong> has been booked for <strong>{selectedDateStr}</strong>.
            </p>
            <p className="text-xs text-slate-600 bg-white/80 p-3 rounded-lg border border-teal-200">
              No advance payment is required. Please arrive 15 minutes before your estimated time and pay ৳{feeAmount} at the chamber reception desk.
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
                {selectedDateObj && (
                  <span className="text-label-sm font-label-sm text-primary font-semibold">
                    {selectedDateObj.day_of_week}, {selectedDateObj.date}
                  </span>
                )}
              </div>

              {loadingAvailability ? (
                <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                  <span>Loading schedule availability...</span>
                </div>
              ) : dates.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                  No availability dates found for this chamber.
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 text-center">
                  {dates.map((opt, idx) => {
                    const isSelected = selectedDateStr === opt.date;
                    const d = new Date(opt.date + 'T00:00:00');
                    const dayName = idx === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
                    const dateNum = d.getDate();
                    const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
                    const isClosed = opt.status === 'closed';
                    const isFull = opt.status === 'full';

                    let capacityLabel = '';
                    if (isClosed) {
                      capacityLabel = 'Closed';
                    } else if (isFull || opt.capacity_remaining <= 0) {
                      capacityLabel = 'Full';
                    } else if (opt.capacity_remaining > 0) {
                      capacityLabel = `${opt.capacity_remaining} left`;
                    } else {
                      capacityLabel = 'Open';
                    }

                    return (
                      <button
                        key={opt.date}
                        type="button"
                        disabled={isClosed}
                        onClick={() => handleSelectDate(opt)}
                        className={`p-2 rounded-xl transition-all cursor-pointer text-center flex flex-col items-center justify-between min-h-[68px] ${
                          isClosed
                            ? 'opacity-40 bg-slate-100 border border-slate-200 cursor-not-allowed'
                            : isSelected
                            ? 'border-2 border-primary bg-teal-50 text-on-surface shadow-xs'
                            : 'border border-outline-variant hover:border-primary/60 text-on-surface hover:bg-surface-container-low'
                        }`}
                      >
                        <p className={`text-[11px] font-bold ${isSelected ? 'text-primary' : 'text-slate-600'}`}>
                          {dayName}
                        </p>
                        <p className="text-xs font-black text-slate-900 mt-0.5">
                          {dateNum} {monthShort}
                        </p>
                        <span className={`text-[9px] block leading-none font-semibold mt-1 ${
                          isClosed ? 'text-rose-600' : isFull ? 'text-amber-700' : isSelected ? 'text-primary font-bold' : 'text-slate-500'
                        }`}>
                          {capacityLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 2: Consultation Session */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-label-sm font-label-sm text-on-surface font-bold uppercase tracking-wider text-slate-700">
                  2. Select Consultation Session
                </label>
                {selectedSession && (
                  <span className="text-label-sm font-label-sm text-slate-500 font-medium">
                    {formatDisplayTime(selectedSession.start_time)} – {formatDisplayTime(selectedSession.end_time)}
                  </span>
                )}
              </div>

              {sessions.length === 0 ? (
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/60 text-center text-xs text-slate-500">
                  No sessions scheduled for this date.
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.map((sess) => {
                    const isSelected = selectedSessionKey === sess.session_key;
                    const isAvail = sess.status === 'available';
                    const startTimeFormatted = formatDisplayTime(sess.start_time);
                    const endTimeFormatted = formatDisplayTime(sess.end_time);
                    const estFormatted = sess.estimated_time ? formatDisplayTime(sess.estimated_time) : startTimeFormatted;

                    return (
                      <button
                        key={sess.session_key}
                        type="button"
                        disabled={!isAvail}
                        onClick={() => setSelectedSessionKey(sess.session_key)}
                        className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          !isAvail
                            ? 'opacity-40 bg-slate-50 border-slate-200 cursor-not-allowed'
                            : isSelected
                            ? 'border-2 border-primary bg-teal-50/70 shadow-xs'
                            : 'border-outline-variant hover:border-primary/60 bg-white hover:bg-surface-container-low'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'bg-primary' : 'border-2 border-slate-300 bg-white'
                          }`}>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {startTimeFormatted} – {endTimeFormatted}
                            </p>
                            <p className="text-xs text-slate-600 mt-0.5">
                              Serial #{sess.next_serial} · approx. {estFormatted}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                            !isAvail
                              ? 'bg-rose-100 text-rose-700'
                              : isSelected
                              ? 'bg-primary text-white'
                              : 'bg-teal-100 text-teal-800'
                          }`}>
                            {isAvail ? `${sess.capacity_remaining} left` : sess.status.toUpperCase()}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 3: Patient Details Quick Form */}
            <div className="pt-3 border-t border-outline-variant/60 space-y-3.5">
              <label className="block text-label-sm font-label-sm text-on-surface font-bold uppercase tracking-wider text-slate-700">
                3. Patient Details
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
                disabled={submitting || !selectedSessionKey}
                className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-primary-container text-white font-title-md text-title-md font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {submitting ? 'hourglass_top' : 'check_circle'}
                </span>
                <span>{submitting ? 'Confirming Appointment...' : 'Proceed to Reserve Serial'}</span>
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
