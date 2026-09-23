import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, ShieldCheck, RefreshCw, AlertCircle, 
  Building2, TestTube2, Stethoscope, MapPin, Award, Phone, Calendar
} from 'lucide-react';
import { api, ensureArray } from '../../../services/api';
import { formatFacilityName } from '../../../utils/facilityUtils';

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
      
      {/* Editorial Page Header & Refresh */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#d1d5dc]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-label font-bold tracking-widest text-[#094cb2] uppercase bg-[#e7ebff] px-2 py-0.5 rounded-xs">
              Governance & Compliance
            </span>
            <span className="text-[10px] text-slate-400 font-label">• Institutional Audit</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#1b1c1d] tracking-tight">
            Partner Verification Queue
          </h1>
          <p className="text-xs text-slate-500 font-body mt-1 max-w-2xl">
            Review and 1-click verify pending DGHS licenses and BMDC registration numbers for public visibility across the platform.
          </p>
        </div>

        <button
          type="button"
          onClick={loadQueue}
          className="border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 px-3.5 py-2 rounded-sm text-xs font-label font-semibold flex items-center gap-2 transition cursor-pointer shadow-sm shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#094cb2]' : 'text-slate-500'}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Telemetry Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white border border-[#d1d5dc] rounded-sm p-4 shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-sm bg-[#e7ebff] text-[#094cb2] font-serif font-bold text-lg flex items-center justify-center">
            {pendingFacilities.length + pendingDoctors.length}
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-label uppercase tracking-wider font-semibold">Total Pending</div>
            <div className="text-sm font-serif font-bold text-[#1b1c1d]">Awaiting Audit</div>
          </div>
        </div>

        <div className="bg-white border border-[#d1d5dc] rounded-sm p-4 shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-sm bg-cyan-50 text-cyan-800 border border-cyan-200 font-serif font-bold text-lg flex items-center justify-center">
            {pendingFacilities.length}
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-label uppercase tracking-wider font-semibold">Facilities</div>
            <div className="text-sm font-serif font-bold text-[#1b1c1d]">Hospitals & Diagnostic Labs</div>
          </div>
        </div>

        <div className="bg-white border border-[#d1d5dc] rounded-sm p-4 shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-sm bg-teal-50 text-teal-800 border border-teal-200 font-serif font-bold text-lg flex items-center justify-center">
            {pendingDoctors.length}
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-label uppercase tracking-wider font-semibold">Specialists</div>
            <div className="text-sm font-serif font-bold text-[#1b1c1d]">BMDC Doctor Profiles</div>
          </div>
        </div>
      </div>

      {/* Feedback Alerts */}
      {err && (
        <div className="p-3 rounded-sm bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-body">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{err}</span>
        </div>
      )}

      {msg && (
        <div className="p-3 rounded-sm bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-body">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Section 1: Pending Diagnostic Centers & Hospitals */}
      <div className="bg-white border border-[#d1d5dc] rounded-sm overflow-hidden shadow-card">
        <div className="p-3.5 border-b border-[#d1d5dc] bg-[#faf9fa] flex items-center justify-between">
          <h3 className="font-serif font-bold text-slate-900 text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#094cb2]" />
            <span>Pending Facilities & Diagnostic Labs ({pendingFacilities.length})</span>
          </h3>
        </div>

        {pendingFacilities.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600 mb-2 opacity-80" />
            <p className="font-serif text-sm text-slate-700">All registered facilities are verified</p>
            <p className="text-xs text-slate-400 mt-0.5">New facility registrations will appear here for 1-click audit.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-body">
              <thead className="bg-[#f7f6f7] text-slate-500 font-label text-[11px] uppercase tracking-wider border-b border-[#d1d5dc]">
                <tr>
                  <th className="py-3 px-4 w-[28%] font-semibold">Facility Name</th>
                  <th className="py-3 px-4 w-[18%] font-semibold">Type & License</th>
                  <th className="py-3 px-4 w-[24%] font-semibold">Location</th>
                  <th className="py-3 px-4 w-[16%] font-semibold">Contact</th>
                  <th className="py-3 px-4 w-[14%] text-right font-semibold">1-Click Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e5ea] text-slate-700">
                {pendingFacilities.map(fac => (
                  <tr key={fac.id} className="hover:bg-[#e7ebff]/25 transition-colors">
                    <td className="py-3.5 px-4 font-serif font-bold text-sm text-[#1b1c1d]">
                      <div className="flex items-center gap-2">
                        {fac.location_type === 'hospital' ? (
                          <Building2 className="w-4 h-4 text-[#094cb2] shrink-0" />
                        ) : (
                          <TestTube2 className="w-4 h-4 text-cyan-700 shrink-0" />
                        )}
                        <div>
                          <div>{formatFacilityName(fac.name, fac.branch)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="capitalize font-label text-slate-800 font-semibold">{fac.location_type?.replace('_', ' ')}</div>
                      <div className="font-mono text-[#094cb2] text-[11px]">{fac.badge || 'No license provided'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{fac.area || fac.district}, {fac.division}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{fac.address_line}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      <div>{fac.phone || 'N/A'}</div>
                      {fac.email && <div className="text-[11px] text-slate-400 font-sans">{fac.email}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          disabled={actionLoading === fac.id}
                          onClick={() => handleAction('facility', fac.id, 'approve', fac.name)}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1 rounded-sm text-xs font-label font-semibold shadow-xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {actionLoading === fac.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading === fac.id}
                          onClick={() => handleAction('facility', fac.id, 'reject', fac.name)}
                          className="border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-1 rounded-sm text-xs font-label font-semibold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <XCircle className="w-3 h-3" />
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
      <div className="bg-white border border-[#d1d5dc] rounded-sm overflow-hidden shadow-card">
        <div className="p-3.5 border-b border-[#d1d5dc] bg-[#faf9fa] flex items-center justify-between">
          <h3 className="font-serif font-bold text-slate-900 text-sm flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-teal-700" />
            <span>Pending Specialist Doctors ({pendingDoctors.length})</span>
          </h3>
        </div>

        {pendingDoctors.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600 mb-2 opacity-80" />
            <p className="font-serif text-sm text-slate-700">All registered doctor profiles are verified</p>
            <p className="text-xs text-slate-400 mt-0.5">New doctor registrations will appear here for 1-click BMDC audit.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-body">
              <thead className="bg-[#f7f6f7] text-slate-500 font-label text-[11px] uppercase tracking-wider border-b border-[#d1d5dc]">
                <tr>
                  <th className="py-3 px-4 w-[28%] font-semibold">Doctor Name</th>
                  <th className="py-3 px-4 w-[18%] font-semibold">BMDC Reg No.</th>
                  <th className="py-3 px-4 w-[24%] font-semibold">Specialty & Degrees</th>
                  <th className="py-3 px-4 w-[16%] font-semibold">Phone</th>
                  <th className="py-3 px-4 w-[14%] text-right font-semibold">1-Click Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e5ea] text-slate-700">
                {pendingDoctors.map(doc => (
                  <tr key={doc.id} className="hover:bg-[#e7ebff]/25 transition-colors">
                    <td className="py-3.5 px-4 font-serif font-bold text-sm text-[#1b1c1d]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-sm bg-[#e7ebff] text-[#094cb2] flex items-center justify-center font-serif font-bold text-xs">
                          {(doc.name || 'D')[0].toUpperCase()}
                        </div>
                        <div>
                          <div>Dr. {doc.name}</div>
                          <div className="text-[11px] text-slate-500 font-body font-normal">{doc.experience}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#094cb2] font-bold text-xs">
                      {doc.bmdc_number || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-label font-semibold text-slate-800">
                        {doc.specialties && doc.specialties.length > 0 ? doc.specialties.join(', ') : 'Specialist'}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{doc.qualification}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {doc.phone || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          disabled={actionLoading === doc.id}
                          onClick={() => handleAction('doctor', doc.id, 'approve', doc.name)}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1 rounded-sm text-xs font-label font-semibold shadow-xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {actionLoading === doc.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading === doc.id}
                          onClick={() => handleAction('doctor', doc.id, 'reject', doc.name)}
                          className="border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-1 rounded-sm text-xs font-label font-semibold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <XCircle className="w-3 h-3" />
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
