import React, { useMemo } from 'react';
import { useAdminContext } from '../context/AdminContext';
import { navConfig } from '../navConfig';
import { 
  ShieldCheck, Activity, Settings, History, LogOut, 
  ChevronRight, Building2, FlaskConical, Stethoscope 
} from 'lucide-react';

export default function AdminSidebar({ onTabSelect, isMobile = false }) {
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
    hospitals,
    handleLogout
  } = useAdminContext();

  const configRole = isSuperAdmin ? 'super_admin' : 
                     isHospitalAdmin ? 'hospital_admin' : 
                     isDiagnosticAdmin ? 'diagnostic_admin' : 
                     isDoctor ? 'doctor' : 
                     isStaffRole ? 'staff' : 'staff';

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
    if (id === 'specialty-aliases') return counts.unverifiedAliases;
    return null;
  };

  const handleSelectTab = (id) => {
    setActiveTab(id);
    if (setSearchTerm) setSearchTerm('');
    if (onTabSelect) onTabSelect(id);
  };

  return (
    <aside className={isMobile 
      ? "w-full bg-white flex-shrink-0 p-3 flex flex-col gap-5 overflow-y-auto admin-scrollbar" 
      : "w-64 lg:w-72 bg-white border border-[#d1d5dc] flex-shrink-0 min-h-[calc(100vh-6rem)] p-3.5 flex flex-col justify-between gap-5 sticky top-20 overflow-y-auto admin-scrollbar shadow-card rounded-sm"
    }>
      <div className="flex flex-col gap-4">
        {/* Institutional Authority Badge Card */}
        <div className="p-3 rounded-sm bg-[#f7f6f7] border border-[#d1d5dc] flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-[#094cb2]/10 text-[#094cb2] flex items-center justify-center shrink-0 border border-[#094cb2]/20">
            {isHospitalAdmin ? (
              <Building2 className="w-4 h-4" />
            ) : isDiagnosticAdmin ? (
              <FlaskConical className="w-4 h-4" />
            ) : isDoctor ? (
              <Stethoscope className="w-4 h-4" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-headline font-serif text-xs font-bold text-slate-900 truncate">
              {isSuperAdmin ? 'Admin Panel' : isHospitalAdmin ? 'Hospital Management Hub' : isDiagnosticAdmin ? 'Diagnostic Operations Hub' : 'Doctor Specialist Console'}
            </span>
            <span className="text-[10px] font-label text-slate-500 truncate tracking-wide">
              {isSuperAdmin ? '' : 'Directorate Healthcare Node'}
            </span>
          </div>
        </div>

        {/* Triage / Quick Operations Hub CTA */}
        <button 
          type="button"
          onClick={() => handleSelectTab('overview')}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-sm bg-white border border-[#094cb2]/40 hover:bg-[#e7ebff]/40 text-[#094cb2] font-label font-semibold text-xs tracking-wide transition-all shadow-subtle cursor-pointer"
        >
          <Activity className="w-4 h-4 text-[#094cb2]" />
          <span>Master Operations Hub</span>
        </button>

        {/* Master Directory Navigation Groups */}
        <nav className="flex flex-col gap-4 font-label">
          {visibleGroups.map(group => (
            <div key={group.group} className="flex flex-col gap-1">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500/80 px-2.5 pt-1">
                {group.group}
              </h3>
              {group.items.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const badgeCount = getBadgeCount(tab.id);
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleSelectTab(tab.id)}
                    className={`px-3 py-2 rounded-sm text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-[#e7ebff] text-[#094cb2] font-semibold border-l-2 border-[#094cb2] shadow-subtle' 
                        : 'text-slate-600 hover:bg-[#f7f6f7] hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#094cb2]' : 'text-slate-400'}`} />
                      <span className="truncate">{tab.label}</span>
                    </div>
                    {badgeCount != null && badgeCount > 0 && (
                      <span className={`ml-2 px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0 ${
                        isActive 
                          ? 'bg-[#094cb2] text-white' 
                          : 'bg-[#f0eeef] text-slate-700 border border-[#d1d5dc]'
                      }`}>
                        {badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Nav Utility Footer */}
      <div className="flex flex-col gap-1 border-t border-[#e3e5ea] pt-3 font-label text-xs">
        <button
          type="button"
          onClick={() => handleSelectTab('overview')}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-sm text-slate-600 hover:text-slate-900 hover:bg-[#f7f6f7] transition-colors font-medium text-left cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5 text-slate-400" />
          <span>System Settings</span>
        </button>
        <button
          type="button"
          onClick={() => handleSelectTab('overview')}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-sm text-slate-600 hover:text-slate-900 hover:bg-[#f7f6f7] transition-colors font-medium text-left cursor-pointer"
        >
          <History className="w-3.5 h-3.5 text-slate-400" />
          <span>Registry Audit Log</span>
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-sm text-rose-700 hover:bg-rose-50 transition-colors font-medium text-left cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-600" />
          <span>Sign Out System</span>
        </button>
      </div>
    </aside>
  );
}

