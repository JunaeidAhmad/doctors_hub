import React, { useState } from 'react';
import { X, Calendar, User, Phone, MapPin, CheckCircle2, TestTube2, ShieldCheck, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export default function LabBookingModal({ test, onClose, onConfirmLabBooking }) {
  const [step, setStep] = useState('details'); // 'details' | 'otp'
  const [pickupDate, setPickupDate] = useState('2026-07-26');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('01787878787');
  const [otpInput, setOtpInput] = useState('123');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!test) return null;

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!patientName || !patientPhone || !address) {
      setError('Please provide patient name, phone number, and address');
      return;
    }
    setError('');
    setStep('otp');
  };

  const handleVerifyOtpAndBook = async (e) => {
    e.preventDefault();
    if (otpInput.trim() !== '123' && otpInput.trim() !== '') {
      setError('Invalid OTP code. Please enter 123 for testing.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let user = api.getCurrentUser();
      if (!user) {
        const authRes = await api.register(patientPhone, 'patient123', patientName);
        user = authRes.user;
      }

      const res = await api.createLabBooking({
        test: test.id,
        pickup_date: pickupDate,
        patient_name: patientName,
        patient_phone: patientPhone,
        address: address,
      });

      onConfirmLabBooking({
        testName: test.name,
        pickupDate,
        patientName,
        patientPhone,
        address,
        price: test.price,
        bookingRef: `LABBD-${res.id || Math.floor(100000 + Math.random() * 900000)}`
      });
    } catch (err) {
      console.warn("Backend lab booking warning, proceeding with client confirmation", err);
      onConfirmLabBooking({
        testName: test.name,
        pickupDate,
        patientName,
        patientPhone,
        address,
        price: test.price,
        bookingRef: `LABBD-${Math.floor(100000 + Math.random() * 900000)}`
      });
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
                Schedule Home Sample Collection
              </h3>
              <p className="text-xs text-teal-100 font-medium">
                {step === 'details' ? 'Certified Phlebotomist Pickup' : 'Phone OTP Verification'}
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
        <div className="bg-slate-50 p-4 border-b border-slate-200 text-xs space-y-1">
          <div className="flex items-center justify-between font-bold text-slate-900">
            <span>{test.name}</span>
            <span className="text-teal-700 font-extrabold text-sm">৳{test.price}</span>
          </div>
          <p className="text-slate-500 text-[11px] font-medium">{test.category} • Report in {test.reportTime || test.report_time || '24 Hours'}</p>
        </div>

        {/* Mock Demo Banner */}
        <div className="bg-teal-50 px-4 py-2 border-b border-teal-100 flex items-center justify-between text-[11px] font-semibold text-teal-800">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Mock Credentials:</span>
          </span>
          <span>Phone: <strong>01787878787</strong> | OTP: <strong>123</strong></span>
        </div>

        {step === 'details' ? (
          /* STEP 1: Details & Address */
          <form onSubmit={handleSendOtp} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                <span>Select Sample Collection Date:</span>
              </label>
              <input
                type="date"
                value={pickupDate}
                min="2026-07-21"
                max="2026-08-10"
                onChange={(e) => setPickupDate(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Patient & Address Details:
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Patient Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full text-xs font-medium bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="01787878787"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full text-xs font-medium bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Home Pickup Address *
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
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-teal-600/30 transition-all flex items-center justify-center gap-2"
              >
                <span>Proceed to OTP Verification</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </form>
        ) : (
          /* STEP 2: OTP Verification */
          <form onSubmit={handleVerifyOtpAndBook} className="p-6 space-y-4">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl font-medium">
                {error}
              </div>
            )}

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
                3-Digit OTP (Mock OTP: 123):
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                placeholder="123"
                className="w-full text-center tracking-widest text-lg font-black bg-slate-50 border-2 border-teal-500 rounded-xl py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-teal-800"
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
                <ShieldCheck className="w-3.5 h-3.5" /> OTP Auto-sent
              </span>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-teal-600/30 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Scheduling Sample Pickup...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify OTP & Confirm Lab Pickup</span>
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
