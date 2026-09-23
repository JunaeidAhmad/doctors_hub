import React from 'react';
import { Search, Calendar, TestTube, CheckCircle, Clock, MapPin, Phone } from 'lucide-react';
import { useAdminContext } from '../context/AdminContext';
import { api } from '../../../services/api';
import StatusBadge from './shared/StatusBadge';
import { formatFacilityName } from '../../../utils/facilityUtils';

export default function BookingsTab() {
  const { 
    activeTab, 
    doctorBookings, 
    labBookings, 
    searchTerm, 
    setSearchTerm,
    loadAllData,
    setSuccessMsg,
    setError,
    showNotification
  } = useAdminContext();
  
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

  const filteredBookings = (bookings || []).filter(b => 
    `${b?.patient_name || ''} ${b?.patient_phone || ''}`.toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Editorial Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-2 border-b border-[#d1d5dc]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-label font-bold tracking-widest text-[#094cb2] uppercase bg-[#e7ebff] px-2 py-0.5 rounded-xs">
              Patient Serials & Orders
            </span>
            <span className="text-[10px] text-slate-400 font-label">• Telemetry Dispatch</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#1b1c1d] tracking-tight">
            {title}
          </h1>
          <p className="text-xs text-slate-500 font-body mt-1">
            Real-time consultation serials, home sample pickups, patient verification, and fulfillment tracking.
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#d1d5dc] rounded-sm shadow-card overflow-hidden">
        <div className="p-3.5 border-b border-[#d1d5dc] bg-[#faf9fa] flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${String(title || '').toLowerCase()} by patient or phone...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-[#d1d5dc] rounded-sm pl-8 pr-3 py-1.5 text-xs text-[#1b1c1d] focus:outline-none focus:border-[#094cb2] font-body"
            />
          </div>
          <span className="text-[11px] font-label text-slate-500">
            Showing <span className="font-semibold text-slate-800">{filteredBookings.length}</span> serials
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-body">
            <thead className="bg-[#f7f6f7] border-b border-[#d1d5dc] text-slate-500 font-label text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-[24%] font-semibold">{isDoctor ? 'Serial / Patient' : 'Patient Name'}</th>
                <th className="py-3 px-4 w-[16%] font-semibold">Contact Phone</th>
                <th className="py-3 px-4 w-[24%] font-semibold">{isDoctor ? 'Doctor & Facility' : 'Diagnostic Center & Tests'}</th>
                <th className="py-3 px-4 w-[18%] font-semibold">{isDoctor ? 'Appointment Date & Slot' : 'Pickup Date & Address'}</th>
                <th className="py-3 px-4 w-[10%] font-semibold">Status</th>
                <th className="py-3 px-4 w-[8%] text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3e5ea] text-slate-700">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 text-xs font-body">
                    No {title.toLowerCase()} found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredBookings.map(b => (
                  <tr key={b.id} className="hover:bg-[#e7ebff]/25 transition-colors">
                    <td className="py-3.5 px-4 font-body">
                      <div className="flex items-center gap-2">
                        {isDoctor && b.serial_number && (
                          <span className="bg-[#e7ebff] text-[#094cb2] font-serif font-bold px-1.5 py-0.5 rounded-xs text-[10px] border border-[#094cb2]/20">
                            {b.serial_display || `#${b.serial_number}`}
                          </span>
                        )}
                        <div className="font-serif font-bold text-sm text-[#1b1c1d] flex items-center gap-1.5">
                          <HeaderIcon className="w-3.5 h-3.5 text-[#094cb2]" />
                          <span>{b.patient_name || (b.patient ? b.patient.name : 'Patient')}</span>
                        </div>
                      </div>
                      {b.patient && (b.patient.age || b.patient.gender) && (
                        <div className="text-[11px] text-slate-500 font-body pl-5 mt-0.5">
                          {b.patient.age ? `Age: ${b.patient.age}` : ''} {b.patient.gender ? `• ${b.patient.gender}` : ''}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#094cb2] text-xs">
                      +880 {b.patient_phone || (b.patient ? b.patient.phone : '')}
                    </td>
                    <td className="py-3.5 px-4 font-body">
                      {isDoctor ? (
                        <div>
                          <div className="font-serif font-bold text-slate-900">{b.doctor_name || 'Specialist Doctor'}</div>
                          <div className="text-[11px] text-slate-500">{formatFacilityName(b.facility_name, b.branch) || 'Hospital / Chamber'}</div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-serif font-bold text-slate-900">{formatFacilityName(b.center_name, b.branch || b.center_branch) || 'Diagnostic Center'}</div>
                          <div className="text-[11px] text-slate-500">{b.test_name || b.test_names || 'Test Booking'}</div>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-body">
                      {isDoctor ? (
                        <div>
                          <div className="font-medium">{b.date}</div>
                          <div className="text-[11px] text-[#094cb2] font-label font-semibold">{b.slot}</div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium">{b.pickup_date}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">{b.address || 'Home Collection'}</div>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <select
                        value={b.status || 'pending'}
                        onChange={(e) => handleUpdateStatus(b.id, e.target.value)}
                        className="bg-white border border-[#d1d5dc] rounded-xs px-2 py-1 text-xs text-[#1b1c1d] font-label font-semibold focus:outline-none focus:border-[#094cb2] cursor-pointer"
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
    </div>
  );
}
