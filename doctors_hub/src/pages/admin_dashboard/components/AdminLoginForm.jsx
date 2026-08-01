import React, { useState } from 'react';
import { ShieldAlert, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../../../services/api';

export default function AdminLoginForm({ onAdminLoggedIn }) {
  const [adminPhone, setAdminPhone] = useState('01700000000');
  const [adminPassword, setAdminPassword] = useState('admin123456');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginErr, setLoginErr] = useState('');

  const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginErr('');
    try {
      const res = await api.login(adminPhone, adminPassword);
      if (res?.user?.is_staff || res?.user?.is_superuser) {
        if (onAdminLoggedIn) onAdminLoggedIn(res.user);
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
        <div className="text-center mb-8">
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

        {loginErr && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{loginErr}</span>
          </div>
        )}

        <form onSubmit={handleAdminLoginSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Admin Phone Number</label>
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
            <label className="block text-slate-300 font-semibold mb-1.5">Admin Password</label>
            <input
              type="password"
              required
              placeholder="admin123456"
              value={adminPassword}
              onChange={e => setAdminPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full mt-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-teal-600/30 transition flex items-center justify-center gap-2 text-sm"
          >
            {loginLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Sign In to Admin Console'}
          </button>
        </form>
      </div>
    </div>
  );
}
