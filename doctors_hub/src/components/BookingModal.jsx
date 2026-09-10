import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Phone, CheckCircle2, Building2, Stethoscope, ShieldCheck, ArrowRight, Sparkles, Award } from 'lucide-react';
import { api } from '../services/api';

export default function BookingModal({ chamber, doctor, onClose, onConfirmBooking, showToast }) {
  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [step, setStep] = useState('details'); // 'details' | 'otp'
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedSlot, setSelectedSlot] = useState(doctor?.slots?.[0] || '05:15 PM');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('01787878787');
  const [otpInput, setOtpInput] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingPatientFound, setExistingPatientFound] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Auto-fetch patient details when 11-digit phone number is entered
  useEffect(() => {
    const cleanPhone = patientPhone.trim();
    if (cleanPhone.length >= 11) {
      let isMounted = true;
      setIsLookingUp(true);
      const timer = setTimeout(async () => {
        try {
          const res = await api.lookupPatient(cleanPhone);
          if (isMounted && res && res.found && res.patient) {
            setExistingPatientFound(true);
            if (res.patient.name && !patientName) setPatientName(res.patient.name);
            if (res.patient.age && !patientAge) setPatientAge(String(res.patient.age));
            if (res.patient.gender) {
              const g = res.patient.gender.toLowerCase();
              setGender(g === 'female' ? 'Female' : (g === 'other' ? 'Other' : 'Male'));
            }
            if (showToast) showToast(`Found existing profile for ${res.patient.name}`, 'info');
          } else if (isMounted) {
            setExistingPatientFound(false);
          }
        } catch (e) {
          console.error("Patient lookup error:", e);
        } finally {
          if (isMounted) setIsLookingUp(false);
        }
      }, 400);

      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    } else {
      setExistingPatientFound(false);
    }
  }, [patientPhone]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim()) {
      if (showToast) showToast('Please provide patient name and phone number', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.sendOtp(patientPhone.trim(), 'doctor_booking');
      if (showToast) showToast(`Verification OTP sent to ${patientPhone.trim()}`, 'info');
      if (res && res.otp) {
        setOtpInput(res.otp);
      } else {
        setOtpInput('123');
      }
      setStep('otp');
    } catch (err) {
      console.warn("OTP send warning, continuing with dev OTP:", err);
      setOtpInput('123');
      setStep('otp');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtpAndBook = async (e) => {
    e.preventDefault();
    if (!otpInput.trim()) {
      if (showToast) showToast('Please enter the OTP verification code.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const affiliationId = chamber.affiliation_id || chamber.id || doctor.affiliation_id || doctor.id;
      const bookingRes = await api.createDoctorBooking({
        affiliation_id: affiliationId,
        affiliation: affiliationId,
        date: selectedDate,
        slot: selectedSlot,
        patient_name: patientName.trim(),
        patient_phone: patientPhone.trim(),
        patient_age: patientAge ? parseInt(patientAge) : undefined,
        gender: gender.toLowerCase(),
        otp_code: otpInput.trim(),
      });

      const serialNum = bookingRes?.serial_number || 1;
      const serialDisplay = bookingRes?.serial_display || `SL-${String(serialNum).padStart(3, '0')}`;

      if (showToast) {
        showToast(`🎉 Serial #${serialNum} booked for ${patientName} with Dr. ${doctor.name}!`, 'success');
      }

      if (onConfirmBooking) {
        onConfirmBooking({
          doctorName: doctor.name,
          specialty: typeof doctor.specialty === 'object' ? doctor.specialty?.name : doctor.specialty,
          chamberName: chamber.facility_name || chamber.facilityName || chamber.name || doctor.hospital_name || 'Specialist Chamber',
          location: chamber.address || chamber.district || chamber.location || 'Dhaka, Bangladesh',
          date: selectedDate,
          slot: selectedSlot,
          patientName,
          patientPhone,
          fee: chamber.fee || doctor.fee || 1200,
          serialNumber: serialNum,
          tokenId: serialDisplay
        });
      }
      onClose();
    } catch (err) {
      console.error("Doctor booking error:", err);
      const errMsg = err?.message || 'Failed to complete booking. Please verify OTP and details.';
      if (showToast) showToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!chamber || !doctor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-scaleUp">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                Book Doctor Serial Ticket
              </h3>
              <p className="text-xs text-emerald-100 font-medium">
                {step === 'details' ? 'Direct Chamber Serial Generation' : 'Phone OTP Verification'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Doctor & Selected Chamber Summary Header Strip */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 text-xs space-y-2">
          {/* 1. Designation & Fee */}
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary inline-flex items-center gap-1">
              <Award className="w-3 h-3" />
              <span>{doctor.academic_title || doctor.designation || 'Specialist Doctor'}</span>
            </span>
            <span className="text-primary font-extrabold text-sm">
              Fee: ৳{Number(chamber?.fee || doctor?.fee || 1200).toLocaleString()}
            </span>
          </div>

          {/* 2. Doctor Name & Qualification */}
          <div>
            <h4 className="font-bold text-slate-900 text-sm">
              {doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`}
              <span className="text-slate-500 font-normal ml-1.5 text-xs">
                ({typeof doctor.specialty === 'object' ? doctor.specialty?.name : (doctor.specialty || 'General Practitioner')})
              </span>
            </h4>
            <p className="text-slate-500 text-[11px] font-medium mt-0.5">{doctor.qualification || 'MBBS, FCPS, MD'}</p>
          </div>

          {/* 3. Selected Chamber Information Card */}
          <div className="mt-2 p-2.5 rounded-xl bg-surface-container-lowest border border-primary/20 shadow-2xs">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-1.5 min-w-0">
                <Building2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 text-xs truncate">
                    {chamber.facility_name || chamber.facilityName || chamber.name || doctor.hospital_name || 'Specialist Chamber'}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    {chamber.address || chamber.district || chamber.location || 'Dhaka, Bangladesh'}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
                Selected Chamber
              </span>
            </div>
            {(chamber.visitSchedule || (chamber.schedules && chamber.schedules.length > 0)) && (
              <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center gap-1 text-[11px] text-slate-600">
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">
                  {chamber.visitSchedule || `${chamber.schedules.map(s => s.day_of_week.slice(0, 3)).join(', ')} (${chamber.schedules[0].start_time?.slice(0, 5)} - ${chamber.schedules[0].end_time?.slice(0, 5)})`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Mock Demo Banner 
        <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-100 flex items-center justify-between text-[11px] font-semibold text-emerald-800">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mock Credentials:</span>
          </span>
          <span>Phone: <strong>01787878787</strong> | OTP: <strong>123</strong></span>
        </div> */}

        {step === 'details' ? (
          /* STEP 1: Details & Serial Date */
          <form onSubmit={handleSendOtp} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Date Picker & Time Slot Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Select Serial Date:</span>
              </label>
              <input
                type="date"
                value={selectedDate}
                min={today}
                max={maxDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {doctor.slots && doctor.slots.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Available Chamber Time Slots:</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {doctor.slots.map((slot) => (
                    <button
                      type="button"
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                        selectedSlot === slot
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-400'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Patient Info Fields */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Patient Details:
                </span>
                {existingPatientFound && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <Sparkles className="w-3 h-3" /> Existing Patient
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="01787878787"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full text-xs font-medium bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  {isLookingUp && (
                    <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 animate-pulse">Checking profile...</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mohammad Tanvir Hossain"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full text-xs font-medium bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    placeholder="Age"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className="w-full text-xs font-medium bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full text-xs font-medium bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Next CTA */}
            <div className="pt-4 border-t border-slate-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Sending OTP...</span>
                ) : (
                  <>
                    <span>Proceed to OTP Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </form>
        ) : (
          /* STEP 2: OTP Verification */
          <form onSubmit={handleVerifyOtpAndBook} className="p-6 space-y-4">
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Phone className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">Enter Verification OTP</h4>
              <p className="text-xs text-slate-500 mt-1">
                Verification code sent to <strong>+880 {patientPhone}</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 text-center">
                6-Digit Verification OTP:
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                placeholder="123456"
                className="w-full text-center tracking-widest text-xl font-black bg-slate-50 border-2 border-emerald-500 rounded-xl py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-emerald-800"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <button
                type="button"
                onClick={() => setStep('details')}
                className="text-slate-600 hover:text-emerald-700 font-bold underline"
              >
                &larr; Change Details
              </button>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> OTP Sent
              </span>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Generating Serial Ticket...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify OTP & Confirm Booking</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
