import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Stethoscope } from 'lucide-react';
import { useAdminContext } from '../context/AdminContext';
import DoctorModal from './modals/DoctorModal';
import DoctorProfileEditor from './doctor/DoctorProfileEditor';
import AffiliateDoctorDrawer from './facility/AffiliateDoctorDrawer';
import AdminPagination from './AdminPagination';
import { api, ensureArray } from '../../../services/api';

export default function DoctorsTab() {
  const {
    isDoctor,
    isFacilityAdmin,
    isHospitalAdmin,
    isDiagnosticAdmin,
    isSuperAdmin,
    storedUser,
    hospitals = [],
    diagnosticCenters = [],
    doctors: contextDoctors,
    searchTerm,
    setSearchTerm,
    refreshTrigger,
    handleOpenDoctorModal,
    handleDeleteDoctor
  } = useAdminContext();

  const [showAffiliateDrawer, setShowAffiliateDrawer] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tabDoctors, setTabDoctors] = useState(contextDoctors || []);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const managedLoc = storedUser?.managed_locations?.[0];
  const myFacility = isDiagnosticAdmin 
    ? (diagnosticCenters[0] || managedLoc || hospitals[0]) 
    : (hospitals[0] || managedLoc || diagnosticCenters[0]);
  const myFacilityId = myFacility?.id || managedLoc?.id;
  const myFacilityName = myFacility?.name || managedLoc?.name;

  // Sync back to page 1 if search changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // Fetch paginated data
  useEffect(() => {
    if (isDoctor) return; // Doctor profile editor doesn't need this table list

    let isMounted = true;
    const fetchDoctors = async () => {
      setIsFetching(true);
      try {
        const data = await api.getDoctors({ search: searchTerm, page, page_size: 20 });
        if (isMounted) {
          if (data && typeof data === 'object' && 'results' in data) {
             setTabDoctors(ensureArray(data.results));
             const count = data.count || 0;
             setTotalPages(Math.max(1, Math.ceil(count / 20)));
          } else {
             const arr = ensureArray(data);
             setTabDoctors(arr);
             setTotalPages(Math.max(1, Math.ceil(arr.length / 20)));
          }
        }
      } catch (error) {
        console.error("Error fetching doctors for tab:", error);
      } finally {
        if (isMounted) {
          setIsFetching(false);
          setIsInitialLoad(false);
        }
      }
    };

    const delay = searchTerm ? 300 : 0;
    const timer = setTimeout(fetchDoctors, delay);
    return () => { isMounted = false; clearTimeout(timer); };
  }, [searchTerm, page, isDoctor, refreshTrigger]);

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
          {isFacilityAdmin ? (
            <button
              onClick={() => setShowAffiliateDrawer(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-teal-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Onboard / Affiliate Doctor
            </button>
          ) : (
            <button
              onClick={() => handleOpenDoctorModal()}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-teal-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add New Specialist Doctor
            </button>
          )}
        </div>

        <div className="overflow-x-auto relative">
          {/* Slim progress indicator for page changes */}
          {isFetching && !isInitialLoad && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-800 overflow-hidden z-10">
              <div className="h-full bg-teal-500 w-full animate-pulse"></div>
            </div>
          )}

          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 w-[25%]">Doctor Name</th>
                <th className="py-3.5 px-4 w-[20%]">Qualification & Experience</th>
                <th className="py-3.5 px-4 w-[25%]">Specialties</th>
                <th className="py-3.5 px-4 w-[20%]">Affiliations & Chambers</th>
                <th className="py-3.5 px-4 w-[10%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 relative">
              {isInitialLoad ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skel-doc-${i}`} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 bg-slate-800 rounded w-3/4"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-800 rounded w-3/4 mb-2"></div><div className="h-3 bg-slate-800 rounded w-1/2"></div></td>
                    <td className="py-4 px-4"><div className="flex gap-1"><div className="h-4 bg-slate-800 rounded w-1/3"></div><div className="h-4 bg-slate-800 rounded w-1/3"></div></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-800 rounded w-full"></div></td>
                    <td className="py-4 px-4 text-right"><div className="h-6 bg-slate-800 rounded w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : tabDoctors.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500">
                    No doctors found matching your search.
                  </td>
                </tr>
              ) : (
                tabDoctors.map(d => (
                  <tr key={d.id} className={`hover:bg-slate-800/40 transition ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
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
                        {(d.affiliations || [])
                          .filter(aff => {
                            const affLocId = String(aff.location_details?.id || aff.location_id || aff.location || aff.hospital?.id || aff.diagnostic_center?.id || '');
                            const allLocs = [...hospitals, ...diagnosticCenters];
                            const managedIds = new Set(allLocs.map(l => String(l.location_details?.id || l.location || l.id)));
                            return managedIds.size === 0 || managedIds.has(affLocId);
                          })
                          .map((aff, idx) => (
                          <div key={idx} className="truncate max-w-xs">
                            • {aff.hospital?.name || aff.diagnostic_center?.name || aff.chamber_name || 'Private Chamber'}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                      <button onClick={() => handleOpenDoctorModal(d)} className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 cursor-pointer">
                        <Edit className="w-4 h-4" />
                      </button>
                      {!isFacilityAdmin && (
                        <button onClick={async () => {
                          await handleDeleteDoctor(d.id, d.name);
                          setTabDoctors(prev => prev.filter(x => x.id !== d.id));
                        }} className="p-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isInitialLoad && (
          <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        )}
      </div>

      <DoctorModal />

      {isFacilityAdmin && (
        <AffiliateDoctorDrawer
          isOpen={showAffiliateDrawer}
          onClose={() => setShowAffiliateDrawer(false)}
          facilityId={myFacilityId}
          facilityName={myFacilityName}
        />
      )}
    </>
  );
}
