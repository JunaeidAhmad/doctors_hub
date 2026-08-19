import React from 'react';
import { Search, Calendar, TestTube, CheckCircle } from 'lucide-react';
import { useAdminContext } from '../context/AdminContext';

export default function BookingsTab() {
  const { activeTab, doctorBookings, labBookings, searchTerm, setSearchTerm } = useAdminContext();
  
  const isDoctor = activeTab === 'doc-bookings';
  const title = isDoctor ? 'Doctor Serial Appointments' : 'Home Lab Sample Pickups';
  const bookings = isDoctor ? doctorBookings : labBookings;
  const HeaderIcon = isDoctor ? Calendar : TestTube;

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      if (isDoctor) {
        await api.updateDoctorBookingStatus(id, newStatus);
      } else {
        await api.updateLabBookingStatus(id, newStatus);
      }
      await loadAllData();
      if (setSuccessMsg) setSuccessMsg(`Booking status updated to ${newStatus}`);
    } catch (err) {
      if (setError) setError(`Error updating status: ${err.message}`);
    }
  };

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
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {(!bookings || bookings.length === 0) ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-500 text-xs font-semibold">
                  No {title.toLowerCase()} found.
                </td>
              </tr>
            ) : (
              (bookings || [])
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
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        b.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        b.status === 'completed' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                        b.status === 'cancelled' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        b.status === 'no_show' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                      }`}>
                        <CheckCircle className="w-3 h-3" />
                        <span className="capitalize">{b.status || 'Pending'}</span>
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <select
                        value={b.status || 'pending'}
                        onChange={(e) => handleUpdateStatus(b.id, e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 font-semibold focus:outline-none focus:border-teal-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="no_show">No Show</option>
                      </select>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
