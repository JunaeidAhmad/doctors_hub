import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, ShieldCheck, RefreshCw, AlertCircle, 
  Building2, TestTube2, Stethoscope, MapPin, Award, Phone, Calendar
} from 'lucide-react';
import { api, ensureArray } from '../../../services/api';

export default function VerificationQueueTab() {
  const [queue, setQueue] = useState({ pending_facilities: [], pending_doctors: [], total_pending: 0 });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // id currently acting on
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const loadQueue = async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await api.getVerificationQueue();
      setQueue(data || { pending_facilities: [], pending_doctors: [], total_pending: 0 });
    } catch (e) {
      setErr(e.message || 'Failed to load verification queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleAction = async (entityType, entityId, action, entityName) => {
    setActionLoading(entityId);
    setMsg('');
    setErr('');

    try {
      const res = await api.performVerificationAction(entityType, entityId, action);
      setMsg(res?.message || `${entityName} ${action === 'approve' ? 'verified & activated' : 'rejected'}.`);
      loadQueue();
    } catch (e) {
      setErr(e.message || `Failed to ${action} ${entityName}`);
    } finally {
      setActionLoading(null);
    }
  };

  const pendingFacilities = ensureArray(queue.pending_facilities);
  const pendingDoctors = ensureArray(queue.pending_doctors);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-white">Partner Verification Queue</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Review and 1-click verify pending DGHS licenses and BMDC registration numbers for public visibility
          </p>
        </div>

        <button
          type="button"
          onClick={loadQueue}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-lg">
            {pendingFacilities.length + pendingDoctors.length}
          </div>
          <div>
            <div className="text-[11px] text-slate-400 uppercase font-bold">Total Pending</div>
            <div className="text-sm font-black text-white">Awaiting Audit</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg">
            {pendingFacilities.length}
          </div>
          <div>
            <div className="text-[11px] text-slate-400 uppercase font-bold">Facilities</div>
            <div className="text-sm font-black text-white">Hospitals & Diagnostic Labs</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
            {pendingDoctors.length}
          </div>
          <div>
            <div className="text-[11px] text-slate-400 uppercase font-bold">Specialists</div>
            <div className="text-sm font-black text-white">BMDC Doctor Profiles</div>
          </div>
        </div>
      </div>

      {/* Feedback Alerts */}
      {err && (
        <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{err}</span>
        </div>
      )}

      {msg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Section 1: Pending Diagnostic Centers & Hospitals */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span>Pending Facilities & Diagnostic Labs ({pendingFacilities.length})</span>
          </h3>
        </div>

        {pendingFacilities.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2 opacity-80" />
            <p className="font-semibold text-slate-300">All registered facilities are verified</p>
            <p className="text-[11px] text-slate-500 mt-0.5">New facility registrations will appear here for 1-click audit.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">Facility Name</th>
                  <th className="py-3.5 px-6">Type & License</th>
                  <th className="py-3.5 px-6">Location</th>
                  <th className="py-3.5 px-6">Contact</th>
                  <th className="py-3.5 px-6 text-right">1-Click Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {pendingFacilities.map(fac => (
                  <tr key={fac.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-6 text-white font-bold">
                      <div className="flex items-center gap-2">
                        {fac.location_type === 'hospital' ? (
                          <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
                        ) : (
                          <TestTube2 className="w-4 h-4 text-teal-400 shrink-0" />
                        )}
                        <div>
                          <div>{fac.name}</div>
                          {fac.branch && <div className="text-[11px] text-slate-400 font-normal">{fac.branch}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="capitalize text-slate-300 font-semibold">{fac.location_type?.replace('_', ' ')}</div>
                      <div className="font-mono text-teal-300 text-[11px]">{fac.badge || 'No license provided'}</div>
                    </td>
                    <td className="py-3.5 px-6 text-slate-300">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{fac.area || fac.district}, {fac.division}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{fac.address_line}</div>
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-300">
                      <div>{fac.phone || 'N/A'}</div>
                      {fac.email && <div className="text-[11px] text-slate-500 font-sans">{fac.email}</div>}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={actionLoading === fac.id}
                          onClick={() => handleAction('facility', fac.id, 'approve', fac.name)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {actionLoading === fac.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading === fac.id}
                          onClick={() => handleAction('facility', fac.id, 'reject', fac.name)}
                          className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 2: Pending Doctors */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-emerald-400" />
            <span>Pending Specialist Doctors ({pendingDoctors.length})</span>
          </h3>
        </div>

        {pendingDoctors.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2 opacity-80" />
            <p className="font-semibold text-slate-300">All registered doctor profiles are verified</p>
            <p className="text-[11px] text-slate-500 mt-0.5">New doctor registrations will appear here for 1-click BMDC audit.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">Doctor Name</th>
                  <th className="py-3.5 px-6">BMDC Reg No.</th>
                  <th className="py-3.5 px-6">Specialty & Degrees</th>
                  <th className="py-3.5 px-6">Phone</th>
                  <th className="py-3.5 px-6 text-right">1-Click Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {pendingDoctors.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-6 text-white font-bold">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-black text-xs">
                          {(doc.name || 'D')[0].toUpperCase()}
                        </div>
                        <div>
                          <div>Dr. {doc.name}</div>
                          <div className="text-[11px] text-slate-400 font-normal">{doc.experience}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 font-mono text-emerald-300 font-bold">
                      {doc.bmdc_number || 'N/A'}
                    </td>
                    <td className="py-3.5 px-6 text-slate-300">
                      <div className="font-semibold text-teal-300">
                        {doc.specialties && doc.specialties.length > 0 ? doc.specialties.join(', ') : 'Specialist'}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">{doc.qualification}</div>
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-300">
                      {doc.phone || 'N/A'}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={actionLoading === doc.id}
                          onClick={() => handleAction('doctor', doc.id, 'approve', doc.name)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {actionLoading === doc.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading === doc.id}
                          onClick={() => handleAction('doctor', doc.id, 'reject', doc.name)}
                          className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
