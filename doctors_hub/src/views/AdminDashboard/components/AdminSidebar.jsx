import React, { useMemo } from 'react';
import { useAdminContext } from '../context/AdminContext';
import { navConfig } from '../navConfig';
import { ChevronRight } from 'lucide-react';

export default function AdminSidebar() {
  const { 
    activeTab, 
    setActiveTab, 
    setSearchTerm, 
    counts, 
    role,
    isSuperAdmin, 
    isFacilityAdmin,
    isHospitalAdmin,
    isDiagnosticAdmin,
    isDoctor,
    isStaffRole,
    hospitals
  } = useAdminContext();

  const configRole = isSuperAdmin ? 'super_admin' : 
                     isHospitalAdmin ? 'hospital_admin' : 
                     isDiagnosticAdmin ? 'diagnostic_admin' : 
                     isDoctor ? 'doctor' : 
                     isStaffRole ? 'staff' : 'staff'; // fallback to staff if no specific role matched

  const has_diagnostic_center = hospitals && hospitals.length > 0 && hospitals[0].has_diagnostic_center;
  const is_hospital = hospitals && hospitals.length > 0;
  
  const rawGroups = navConfig[configRole] || [];

  const visibleGroups = useMemo(() => {
    return rawGroups.map(group => {
      const items = group.items.filter(item => {
        if (!item.requiredFlags) return true;
        return item.requiredFlags.every(flag => {
          if (flag === 'has_diagnostic_center') return has_diagnostic_center;
          if (flag === 'has_diagnostic_center_or_diag') return has_diagnostic_center || isDiagnosticAdmin;
          if (flag === 'is_hospital') return is_hospital;
          return true;
        });
      });
      return { ...group, items };
    }).filter(group => group.items.length > 0);
  }, [rawGroups, has_diagnostic_center, isDiagnosticAdmin, is_hospital]);

  const getBadgeCount = (id) => {
    if (id === 'doc-bookings') return counts.docBookings;
    if (id === 'lab-bookings') return counts.labBookings;
    if (id === 'branch-tests') return counts.branchTests;
    return null;
  };

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800/80 flex-shrink-0 min-h-[calc(100vh-80px)] p-4 flex flex-col gap-6 sticky top-20 overflow-y-auto">
      {visibleGroups.map(group => (
        <div key={group.group} className="flex flex-col gap-1">
          <h3 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 px-3">
            {group.group}
          </h3>
          {group.items.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const badgeCount = getBadgeCount(tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); if (setSearchTerm) setSearchTerm(''); }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </div>
                {badgeCount != null && badgeCount > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    isActive ? 'bg-teal-500 text-teal-950' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
