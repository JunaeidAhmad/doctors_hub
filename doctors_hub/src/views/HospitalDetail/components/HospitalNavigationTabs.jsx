import React from 'react';
import { 
  Building2, Users, FlaskConical, Bed, Ambulance, Info 
} from 'lucide-react';

export default function HospitalNavigationTabs({ 
  activeTab, 
  onTabChange, 
  doctorsCount = 124 
}) {
  const tabs = [
    { id: 'overview', label: 'Overview & Facilities', icon: Building2, sectionId: 'overview-section' },
    { id: 'doctors', label: `Doctors & Consultants (${doctorsCount})`, icon: Users, sectionId: 'specialist-section' },
    { id: 'diagnostics', label: 'Diagnostic & Lab Services', icon: FlaskConical, sectionId: 'diagnostics-section' },
    { id: 'beds', label: 'ICU & Bed Status', icon: Bed, sectionId: 'bed-monitor-section' },
    { id: 'emergency', label: 'Emergency & Ambulance', icon: Ambulance, sectionId: 'emergency-section' },
    { id: 'admission', label: 'Visitor & Admission Info', icon: Info, sectionId: 'admission-section' },
  ];

  return (
    <div className="border-b border-outline-variant/80 bg-surface-container-lowest rounded-xl p-1 sm:p-1.5 shadow-sm sticky top-16 sm:top-20 z-30 transition-all">
      <div 
        className="flex items-center justify-between overflow-x-auto gap-1 sm:gap-1.5 no-scrollbar scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id, tab.sectionId)}
              type="button"
              className={`px-2.5 sm:px-3 lg:px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
