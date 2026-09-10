import React from 'react';

export default function DoctorAffiliationsTable({ doctor }) {
  if (!doctor) return null;

  const affiliations = Array.isArray(doctor.affiliations) ? doctor.affiliations : [];

  return (
    <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl overflow-hidden shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]">
      <div className="p-6 border-b border-outline-variant/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[22px]">
            apartment
          </span>
          <h2 className="text-title-lg font-title-lg text-on-surface font-bold text-slate-900">
            Hospital Affiliations &amp; Clinical Chambers
          </h2>
        </div>
        <span className="text-label-sm font-label-sm text-on-surface-variant font-medium text-slate-500">
          {affiliations.length} {affiliations.length === 1 ? 'Verified Location' : 'Verified Locations'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low/60 border-b border-outline-variant/60 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider text-slate-500">
              <th className="py-3 px-6 font-semibold">Institution Name</th>
              <th className="py-3 px-4 font-semibold">Role &amp; Capacity</th>
              <th className="py-3 px-4 font-semibold">Location</th>
              <th className="py-3 px-6 text-right font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/40 text-body-md font-body-md text-slate-700">
            {affiliations.length > 0 ? (
              affiliations.map((aff, idx) => {
                const facilityName = aff.facility_name || aff.location_details?.name || 'Medical Center';
                const branch = aff.location_details?.branch ? `${aff.location_details.branch} Branch` : '';
                const role = aff.chamber_type || (idx === 0 ? 'Primary Visiting Consultant' : 'Visiting Consultant');
                const locationAddress = aff.location_details?.address_line || 
                  (aff.area && aff.district ? `${aff.area}, ${aff.district}` : (aff.district || 'Dhaka'));
                const hasSchedules = Array.isArray(aff.schedules) && aff.schedules.length > 0;

                return (
                  <tr key={aff.id || idx} className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-semibold text-on-surface text-slate-900">{facilityName}</p>
                      {branch && <p className="text-body-sm font-body-sm text-on-surface-variant text-slate-500">{branch}</p>}
                    </td>
                    <td className="py-4 px-4 text-on-surface-variant text-slate-600">
                      {role}
                    </td>
                    <td className="py-4 px-4 text-on-surface-variant text-slate-600">
                      {locationAddress}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="inline-flex items-center gap-1.5 text-label-sm font-label-sm px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200/60 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                        <span>{hasSchedules ? 'Open for Booking' : 'Active Chamber'}</span>
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-500 text-sm">
                  {doctor.institution ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-semibold text-slate-800">{doctor.institution}</span>
                      <span>•</span>
                      <span>Regular Departmental Chambers</span>
                    </div>
                  ) : (
                    'Chamber affiliations are being updated.'
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
