import React, { useState } from 'react';
import { X, Phone, ArrowRight, ShieldCheck, Lock, User } from 'lucide-react';
import { api } from '../services/api';

export default function LoginModal({ onClose, onLoginSuccess, onOpenAdmin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone || !password) {
      setError('Please enter phone number and password');
      return;
    }
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await api.register(phone, password, firstName);
        setLoading(false);
        onLoginSuccess('patient', phone);
      } else {
        try {
          await api.login(phone, password);
          setLoading(false);
          onLoginSuccess('patient', phone);
        } catch (err) {
          setLoading(false);
          setIsRegister(true);
          setError('No user account found with these credentials. Please fill in your name and register to create an account.');
        }
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Authentication failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Patient Portal Access</span>
          </div>
          <h3 className="text-xl font-black text-white">
            {isRegister ? 'Create Patient Account' : 'Patient Sign In'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Access appointment serial history, lab reports, and manage health bookings securely.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-xl font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name:
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number:
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-xs font-bold text-slate-500">+880</span>
                <input
                  type="tel"
                  required
                  placeholder="1711234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl pl-14 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password:
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? (isRegister ? 'Registering...' : 'Signing In...') : (isRegister ? 'Register' : 'Sign In')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{isRegister ? 'Already have an account?' : "Don't have an account?"}</span>
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-emerald-600 hover:underline font-bold cursor-pointer"
            >
              {isRegister ? 'Sign In' : 'Create Account'}
            </button>
          </div>


        </div>

      </div>
    </div>
  );
}
