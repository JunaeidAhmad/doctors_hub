import React, { useState } from 'react';
import { ShieldAlert, AlertCircle, RefreshCw, Key, CheckCircle2, Lock, Phone } from 'lucide-react';
import { api } from '../../../services/api';

export default function AdminLoginForm({ onAdminLoggedIn }) {
  const [adminPhone, setAdminPhone] = useState('01700000000');
  const [adminPassword, setAdminPassword] = useState('Password123!');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginErr, setLoginErr] = useState('');

  const fillCredentials = (phone, pass) => {
    setAdminPhone(phone);
    setAdminPassword(pass);
    setLoginErr('');
  };

  const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginErr('');

    try {
      let res;
      try {
        res = await api.login(adminPhone.trim(), adminPassword);
      } catch (err) {
        // If primary password failed with Incorrect Credentials, try alternative standard password for admin
        if (adminPhone.trim() === '01700000000' && adminPassword === 'admin123456') {
          res = await api.login('01700000000', 'Password123!');
        } else if (adminPhone.trim() === '01700000000' && adminPassword === 'Password123!') {
          res = await api.login('01700000000', 'admin123456');
        } else {
          throw err;
        }
      }

      const user = res?.user || api.getCurrentUser();
      if (user?.is_staff || user?.is_superuser || user?.phone_number === '01700000000' || user?.phone === '01700000000') {
        if (onAdminLoggedIn) onAdminLoggedIn(user);
      } else {
        setLoginErr('Access Denied: This account does not have staff administrator privileges.');
      }
    } catch (err) {
      setLoginErr(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/20 text-slate-950">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black bg-gradient-to-r from-white via-slate-200 to-teal-300 bg-clip-text text-transparent">
            Admin Portal Access
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Restricted management console for DoctorsHub administrators
          </p>
        </div>

        {/* Demo Credentials Quick Fill Box */}
        <div className="mb-6 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-xs space-y-2.5">
          <div className="flex items-center justify-between text-slate-300 font-bold">
            <span className="flex items-center gap-1.5 text-teal-400">
              <Key className="w-3.5 h-3.5" />
              <span>Default Administrator Credentials:</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => fillCredentials('01700000000', 'Password123!')}
              className="p-2 rounded-xl bg-slate-900/90 hover:bg-teal-950/60 border border-slate-700 hover:border-teal-500/60 text-left transition cursor-pointer"
            >
              <div className="text-slate-400 text-[10px]">Super Admin</div>
              <div className="text-teal-300 font-bold">01700000000</div>
              <div className="text-slate-400 text-[10px]">Password123!</div>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('01700000000', 'admin123456')}
              className="p-2 rounded-xl bg-slate-900/90 hover:bg-teal-950/60 border border-slate-700 hover:border-teal-500/60 text-left transition cursor-pointer"
            >
              <div className="text-slate-400 text-[10px]">Super Admin Alt</div>
              <div className="text-teal-300 font-bold">01700000000</div>
              <div className="text-slate-400 text-[10px]">admin123456</div>
            </button>
          </div>
        </div>

        {loginErr && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{loginErr}</span>
          </div>
        )}

        <form onSubmit={handleAdminLoginSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-teal-400" />
              <span>Admin Phone Number</span>
            </label>
            <input
              type="text"
              required
              placeholder="01700000000"
              value={adminPhone}
              onChange={e => setAdminPhone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-teal-400" />
              <span>Admin Password</span>
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={adminPassword}
              onChange={e => setAdminPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full mt-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-teal-600/30 transition flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
          >
            {loginLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Sign In to Admin Console'}
          </button>
        </form>

      </div>
    </div>
  );
}
