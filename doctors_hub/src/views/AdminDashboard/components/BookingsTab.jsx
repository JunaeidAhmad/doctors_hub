import React from 'react';
import { Search, Calendar, TestTube, CheckCircle } from 'lucide-react';
import { useAdminContext } from '../context/AdminContext';

export default function BookingsTab() {
  const { activeTab, doctorBookings, labBookings, searchTerm, setSearchTerm } = useAdminContext();
  
  const isDoctor = activeTab === 'doc-bookings';
  const title = isDoctor ? 'Doctor Serial Appointments' : 'Home Lab Sample Pickups';
  const bookings = isDoctor ? doctorBookings : labBookings;
  const HeaderIcon = isDoctor ? Calendar : TestTube;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${String(title || '').toLowerCase()} by patient or phone...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4">Patient Name</th>
              <th className="py-3.5 px-4">Contact Phone</th>
              <th className="py-3.5 px-4">{isDoctor ? 'Doctor & Facility' : 'Diagnostic Center & Tests'}</th>
              <th className="py-3.5 px-4">{isDoctor ? 'Appointment Date & Slot' : 'Pickup Date & Address'}</th>
              <th className="py-3.5 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {(bookings || [])
              .filter(b => `${b?.patient_name || ''} ${b?.patient_phone || ''}`.toLowerCase().includes((searchTerm || '').toLowerCase()))
              .map(b => (
                <tr key={b.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-4 px-4 font-bold text-white">
                    <div className="text-sm text-teal-300 flex items-center gap-1.5">
                      <HeaderIcon className="w-4 h-4 text-teal-400" />
                      <span>{b.patient_name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-mono text-slate-300">
                    +880 {b.patient_phone}
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-200">
                    {isDoctor ? (
                      <div>
                        <div>{b.doctor_name || 'Specialist Doctor'}</div>
                        <div className="text-[10px] text-slate-400">{b.facility_name || 'Hospital / Chamber'}</div>
                      </div>
                    ) : (
                      <div>
                        <div>{b.center_name || 'Diagnostic Center'}</div>
                        <div className="text-[10px] text-slate-400">{b.test_names || 'Lab Test'}</div>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 text-slate-300">
                    {isDoctor ? (
                      <div>
                        <div>{b.date}</div>
                        <div className="text-[10px] text-teal-400 font-bold">{b.slot}</div>
                      </div>
                    ) : (
                      <div>
                        <div>{b.pickup_date}</div>
                        <div className="text-[10px] text-slate-400">{b.address || 'Home Collection'}</div>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      <span>{b.status || 'Confirmed'}</span>
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
