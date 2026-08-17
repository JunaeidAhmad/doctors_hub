import React from 'react';
import { Search, Plus, Edit, Trash2, Stethoscope } from 'lucide-react';
import { useAdminContext } from '../context/AdminContext';
import DoctorModal from './modals/DoctorModal';
import DoctorProfileEditor from './doctor/DoctorProfileEditor';

export default function DoctorsTab() {
  const {
    isDoctor,
    isFacilityAdmin,
    doctors,
    searchTerm,
    setSearchTerm,
    handleOpenDoctorModal,
    handleDeleteDoctor
  } = useAdminContext();

  // If logged in as Doctor, show dedicated single doctor profile editor
  if (isDoctor) {
    return <DoctorProfileEditor />;
  }

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search doctor name or qualification..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>
          {!isFacilityAdmin && (
            <button
              onClick={() => handleOpenDoctorModal()}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-teal-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add New Specialist Doctor
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Doctor Name</th>
                <th className="py-3.5 px-4">Qualification & Experience</th>
                <th className="py-3.5 px-4">Specialties</th>
                <th className="py-3.5 px-4">Affiliations & Chambers</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(doctors || [])
                .filter(d => `${d?.name || ''} ${d?.qualification || ''} ${d?.experience || ''}`.toLowerCase().includes((searchTerm || '').toLowerCase()))
                .map(d => (
                  <tr key={d.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-4 font-bold text-white">
                      <div className="text-sm text-teal-400 flex items-center gap-1.5">
                        <Stethoscope className="w-4 h-4 text-teal-400" />
                        <span>{d.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-slate-200 font-semibold">{d.qualification}</div>
                      <div className="text-slate-400 text-[11px]">{d.experience}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(d.specialties || []).map((s, idx) => (
                          <span key={s.id || idx} className="px-2 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded text-[10px] font-bold">
                            {s.name || s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-slate-300 text-[11px]">
                        {(d.affiliations || []).map((aff, idx) => (
                          <div key={idx} className="truncate max-w-xs">
                            • {aff.hospital?.name || aff.diagnostic_center?.name || aff.chamber_name || 'Private Chamber'} ({aff.consultation_type || 'Doctor'})
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                      <button onClick={() => handleOpenDoctorModal(d)} className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 cursor-pointer">
                        <Edit className="w-4 h-4" />
                      </button>
                      {!isFacilityAdmin && (
                        <button onClick={() => handleDeleteDoctor(d.id, d.name)} className="p-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <DoctorModal />
    </>
  );
}
