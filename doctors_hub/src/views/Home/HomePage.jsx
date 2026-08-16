import React from 'react';
import LandingHubPortal from './components/LandingHubPortal';
import ThreeWayEngine from './components/ThreeWayEngine';
import DoctorMonitorGrid from './components/DoctorMonitorGrid';
import DiagnosticsSection from './components/DiagnosticsSection';
import SpecialtyGrid from './components/SpecialtyGrid';
import AppDownloadBanner from './components/AppDownloadBanner';


export default function HomePage({
  selectedSpecialty,
  setSelectedSpecialty,
  selectedTest,
  setSelectedTest,
  selectedHospitalCategory,
  setSelectedHospitalCategory,
  doctorKeyword,
  setDoctorKeyword,
  selectedLocation,
  setSelectedLocation,
  activeEngineTab,
  setActiveEngineTab,
  onExecuteSearch,
  onBookDoctorSlot,
  onBookLabTest,
  onSelectHospital,
  showToast
}) {
  return (
    <div>
      {/* 3. SEARCH ENGINE (THREE-WAY ENGINE SYSTEM) */}
      <ThreeWayEngine
        selectedSpecialty={selectedSpecialty}
        setSelectedSpecialty={setSelectedSpecialty}
        selectedTest={selectedTest}
        setSelectedTest={setSelectedTest}
        selectedHospitalCategory={selectedHospitalCategory}
        setSelectedHospitalCategory={setSelectedHospitalCategory}
        doctorKeyword={doctorKeyword}
        setDoctorKeyword={setDoctorKeyword}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
        onSearchExecute={onExecuteSearch}
        activeEngineTab={activeEngineTab}
        setActiveEngineTab={setActiveEngineTab}
      />

      {/* 4. QUICK STATISTICAL TRUST BAR */}
      <section className="pt-8 pb-6 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-2xl font-black text-emerald-600">500+</div>
            <div className="text-xs font-semibold text-slate-600">Chamber Clinics</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-2xl font-black text-teal-600">2,500+</div>
            <div className="text-xs font-semibold text-slate-600">Specialist Professors & Doctors</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-2xl font-black text-cyan-600">180+</div>
            <div className="text-xs font-semibold text-slate-600">DGHS Approved Diagnostic Labs</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-2xl font-black text-slate-900">24/7</div>
            <div className="text-xs font-semibold text-slate-600">Hotline Desk (16263)</div>
          </div>
        </div>
      </section>

      {/* 5. CONSULT TOP SPECIALISTS BY DEPARTMENT */}
      <SpecialtyGrid
        selectedSpecialty={selectedSpecialty}
        setSelectedSpecialty={setSelectedSpecialty}
        onSelectSpecialty={(spec) => {
          onExecuteSearch('doctor', spec);
        }}
      />

      {/* 6. LAB TEST GRID (DIAGNOSTICS SECTION) */}
      <DiagnosticsSection
        onSelectTestCategory={(catId) => {
          onExecuteSearch('diagnostics', catId);
        }}
        onSelectCenterCategory={(catId) => {
          onExecuteSearch('diagnostics_center', catId);
        }}
        onSelectCategory={(catId, type) => {
          if (type === 'center') {
            onExecuteSearch('diagnostics_center', catId);
          } else {
            onExecuteSearch('diagnostics', catId);
          }
        }}
      />

      {/* 7. [] AND DIAGNOSTICS GRID */}
      <DoctorMonitorGrid
        onSelectCategory={(specId) => {
          onExecuteSearch('hospital', specId);
        }}
      />

      {/* 8. LANDING PAGE WITH TITLE "Book Doctors & Diagnostic Tests" */}
      <LandingHubPortal />

      {/* 9. THE REST (MOBILE APP DOWNLOAD BANNER) */}
      <div id="app-download">
        <AppDownloadBanner showToast={showToast} />
      </div>
    </div>
  );
}
