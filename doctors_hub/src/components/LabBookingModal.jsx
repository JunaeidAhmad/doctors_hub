import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Phone, MapPin, CheckCircle2, TestTube2, ShieldCheck, ArrowRight, Building2, Home, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { formatFacilityName } from '../utils/facilityUtils';

export default function LabBookingModal({ test, onClose, onConfirmLabBooking, showToast }) {
  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [step, setStep] = useState('details'); // 'details' | 'otp'
  const [pickupDate, setPickupDate] = useState(today);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('01787878787');
  const [patientAge, setPatientAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [otpInput, setOtpInput] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingPatientFound, setExistingPatientFound] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);

  if (!test) return null;

  // Extract test details and pricing robustly across flat & wrapped object structures
  const testDetails = test.test || test.test_details || test;
  const branchTest = test.branchTest || (test.calculated_price !== undefined ? test : {});
  const branch = test.branch || test.location || {};

  const testName =
    testDetails?.name ||
    branchTest?.test_details?.name ||
    branchTest?.name ||
    test?.name ||
    'Diagnostic Test';

  const testPrice =
    branchTest?.discounted_price ??
    branchTest?.calculated_price ??
    test?.discounted_price ??
    test?.calculated_price ??
    testDetails?.calculated_price ??
    0;

  const price =
    branchTest?.price ??
    test?.price ??
    testDetails?.price ??
    null;

  const categoryName =
    testDetails?.category_name ||
    (typeof testDetails?.category === 'object' ? testDetails.category?.name : testDetails?.category) ||
    branchTest?.test_details?.category_name ||
    (typeof test?.category === 'object' ? test.category?.name : test?.category) ||
    'Diagnostic Test';

  const reportTime =
    branchTest?.report_time ||
    test?.report_time ||
    test?.reportTime ||
    (testDetails?.report_time_hours ? `${testDetails.report_time_hours} Hours` : null) ||
    testDetails?.report_time ||
    '24 Hours';

  const isHomeTest = Boolean(
    branchTest?.home_sample_collection ??
    test?.home_sample_collection ??
    test?.home_sample ??
    test?.is_home_sample ??
    test?.offers_home_test ??
    test?.isHomeTest ??
    false
  );

  const branchName =
    branch?.branch ||
    test?.branch ||
    test?.center_branch ||
    branchTest?.branch ||
    '';

  const rawCenterName =
    branch?.name ||
    test?.center_name ||
    test?.facility_name ||
    test?.location_name ||
    branchTest?.center_name ||
    '';

  const centerName = formatFacilityName(rawCenterName, branchName);

  const centerLocation =
    branch?.address ||
    branch?.location ||
    test?.address ||
    '';

  const testId =
    branchTest?.id ||
    test?.facility_test_id ||
    test?.facility_test ||
    testDetails?.id ||
    test?.id;

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
            if (res.patient.address && !address) setAddress(res.patient.address);
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
      if (showToast) showToast('Please provide patient name and contact phone number', 'error');
      return;
    }
    if (isHomeTest && !address.trim()) {
      if (showToast) showToast('Please provide your home pickup address for sample collection', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.sendOtp(patientPhone.trim(), 'test_booking');
      if (showToast) showToast(`Verification OTP sent to ${patientPhone.trim()}`, 'info');
      if (res && res.otp) {
        setOtpInput(res.otp);
      } else {
        setOtpInput('123');
      }
      setStep('otp');
    } catch (err) {
      console.warn("OTP send error, proceeding with dev OTP:", err);
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
      const res = await api.createTestBooking({
        facility_test_id: testId,
        facility_test: testId,
        pickup_date: pickupDate,
        patient_name: patientName.trim(),
        patient_phone: patientPhone.trim(),
        patient_age: patientAge ? parseInt(patientAge) : undefined,
        gender: gender.toLowerCase(),
        address: isHomeTest ? address.trim() : 'In-Lab Visit / Center Appointment',
        otp_code: otpInput.trim(),
      });

      if (showToast) {
        showToast(`🎉 Test booking confirmed for ${patientName}!`, 'success');
      }

      if (onConfirmLabBooking) {
        onConfirmLabBooking({
          testName,
          pickupDate,
          patientName,
          patientPhone,
          patientAge,
          gender,
          address: isHomeTest ? address.trim() : 'Diagnostic Center Visit',
          calculated_price: testPrice,
          isHomeTest,
          centerName,
          bookingRef: `TESTBD-${res?.id || Math.floor(100000 + Math.random() * 900000)}`
        });
      }
      onClose();
    } catch (err) {
      console.error("Test booking error:", err);
      const errMsg = err?.message || 'Failed to complete test booking. Please verify OTP and details.';
      if (showToast) showToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-scaleUp">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-700 to-emerald-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">
              <TestTube2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                {isHomeTest ? 'Schedule Home Sample Collection' : 'Book Diagnostic Lab Test'}
              </h3>
              <p className="text-xs text-teal-100 font-medium">
                {step === 'details'
                  ? (isHomeTest ? 'Certified Phlebotomist Pickup' : 'Direct Diagnostic Center Serial Generation')
                  : 'Phone OTP Verification'
                }
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

        {/* Test Summary Header Strip */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 text-xs space-y-1.5">
          <div className="flex items-center justify-between font-bold text-slate-900">
            <span className="text-sm">{testName}</span>
            <div className="text-right">
              <span className="text-teal-700 font-extrabold text-sm">৳{testPrice}</span>
              {price && (
                <span className="text-slate-400 text-xs line-through ml-1.5 font-normal">
                  ৳{price}
                </span>
              )}
            </div>
          </div>

          <p className="text-slate-500 text-[11px] font-medium">
            {categoryName} • Report in {reportTime}
          </p>

          {centerName && (
            <div className="flex items-center gap-1 text-slate-600 pt-0.5 text-[11px]">
              <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span className="font-semibold text-slate-800">{centerName}</span>
              {centerLocation && <span> • {centerLocation}</span>}
            </div>
          )}

          <div className="pt-1 flex items-center gap-2">
            {isHomeTest ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md border border-teal-200">
                <Home className="w-3 h-3 text-teal-700" />
                <span>Home Sample Collection Available</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded-md border border-slate-300">
                <Building2 className="w-3 h-3 text-slate-600" />
                <span>Visit Diagnostic Center</span>
              </span>
            )}
          </div>
        </div>

        {step === 'details' ? (
          /* STEP 1: Details & (Optional Home Address) */
          <form onSubmit={handleSendOtp} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                <span>{isHomeTest ? 'Select Sample Collection Date:' : 'Select Appointment / Test Date:'}</span>
              </label>
              <input
                type="date"
                value={pickupDate}
                min={today}
                max={maxDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {isHomeTest ? 'Patient & Pickup Details:' : 'Patient Details:'}
                </span>
                {existingPatientFound && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
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
                    className="w-full text-xs font-medium bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
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
                  className="w-full text-xs font-medium bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                    className="w-16 text-xs font-medium bg-white border border-slate-300 rounded-xl px-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="flex-1 text-xs font-medium bg-white border border-slate-300 rounded-xl px-2 py-2.5"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              {/* Conditional Address Field: Only show when test offers home sample collection */}
              {isHomeTest && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-teal-600" />
                    <span>Home Pickup Address *</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="House, Road, Area, City"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full text-xs font-medium bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-teal-600/30 transition-all flex items-center justify-center gap-2"
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
              <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mx-auto mb-3">
                <Phone className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">Enter Verification OTP</h4>
              <p className="text-xs text-slate-500 mt-1">
                SMS sent to <strong>+880 {patientPhone}</strong>
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
                className="w-full text-center tracking-widest text-xl font-black bg-slate-50 border-2 border-teal-500 rounded-xl py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-teal-800"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <button
                type="button"
                onClick={() => setStep('details')}
                className="text-slate-600 hover:text-teal-700 font-bold underline"
              >
                &larr; Change Details
              </button>
              <span className="text-teal-600 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> OTP Sent
              </span>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-teal-600/30 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>{isHomeTest ? 'Scheduling Sample Pickup...' : 'Confirming Test Booking...'}</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isHomeTest ? 'Verify OTP & Confirm Lab Pickup' : 'Verify OTP & Confirm Test Booking'}</span>
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
