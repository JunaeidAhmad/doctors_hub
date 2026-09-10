import React from 'react';

export default function DoctorActiveFiltersBar({
  division,
  district,
  area,
  specialty,
  facility,
  facilityName,
  selectedDay,
  gender,
  maxFee,
  totalDoctors = 0,
  hasActiveFilters = false,
  onRemoveDivision,
  onRemoveDistrict,
  onRemoveArea,
  onRemoveSpecialty,
  onRemoveFacility,
  onRemoveDay,
  onRemoveGender,
  onRemoveFee,
  onClearAll
}) {
  return (
    <section className="bg-surface-container-low border-b border-outline-variant">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Active Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 min-h-[32px]">
            <span className="text-body-sm font-label-md text-on-surface-variant mr-1">
              Active Filters:
            </span>

            {!hasActiveFilters && (
              <span className="text-body-sm text-outline">
                None (Showing all verified specialists)
              </span>
            )}

            {/* Division Pill */}
            {division && division !== 'All Bangladesh' && (
              <span className="inline-flex items-center gap-1.5 bg-surface-container-lowest border border-outline-variant rounded-lg px-2.5 py-1 text-label-sm text-on-surface shadow-xs">
                <span className="text-outline font-normal">Division:</span> {division}
                <button
                  onClick={onRemoveDivision}
                  className="text-outline hover:text-error transition-colors leading-none cursor-pointer ml-0.5"
                  type="button"
                  title="Remove Division"
                >
                  ✕
                </button>
              </span>
            )}

            {/* District Pill */}
            {district && district !== 'All Districts' && (
              <span className="inline-flex items-center gap-1.5 bg-surface-container-lowest border border-outline-variant rounded-lg px-2.5 py-1 text-label-sm text-on-surface shadow-xs">
                <span className="text-outline font-normal">District:</span> {district}
                <button
                  onClick={onRemoveDistrict}
                  className="text-outline hover:text-error transition-colors leading-none cursor-pointer ml-0.5"
                  type="button"
                  title="Remove District"
                >
                  ✕
                </button>
              </span>
            )}

            {/* Area / Thana Pill */}
            {area && area !== 'All Areas' && (
              <span className="inline-flex items-center gap-1.5 bg-surface-container-lowest border border-outline-variant rounded-lg px-2.5 py-1 text-label-sm text-on-surface shadow-xs">
                <span className="text-outline font-normal">Area:</span> {area}
                <button
                  onClick={onRemoveArea}
                  className="text-outline hover:text-error transition-colors leading-none cursor-pointer ml-0.5"
                  type="button"
                  title="Remove Area"
                >
                  ✕
                </button>
              </span>
            )}

            {/* Specialty Pill */}
            {specialty && (
              <span className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/30 rounded-lg px-2.5 py-1 text-label-sm text-primary font-semibold shadow-xs">
                <span className="text-primary/70 font-normal">Specialty:</span> {specialty}
                <button
                  onClick={onRemoveSpecialty}
                  className="text-primary hover:text-error transition-colors leading-none cursor-pointer ml-0.5"
                  type="button"
                  title="Remove Specialty"
                >
                  ✕
                </button>
              </span>
            )}

            {/* Hospital / Facility Pill */}
            {facility && (
              <span className="inline-flex items-center gap-1.5 bg-secondary/10 border border-secondary/30 rounded-lg px-2.5 py-1 text-label-sm text-secondary font-semibold shadow-xs">
                <span className="text-secondary/70 font-normal">Facility:</span> {facilityName || facility}
                <button
                  onClick={onRemoveFacility}
                  className="text-secondary hover:text-error transition-colors leading-none cursor-pointer ml-0.5"
                  type="button"
                  title="Remove Facility"
                >
                  ✕
                </button>
              </span>
            )}

            {/* Day Pill */}
            {selectedDay && selectedDay !== 'All' && selectedDay !== 'All Days' && (
              <span className="inline-flex items-center gap-1.5 bg-surface-container-lowest border border-outline-variant rounded-lg px-2.5 py-1 text-label-sm text-on-surface shadow-xs">
                <span className="text-outline font-normal">Day:</span> {selectedDay}
                <button
                  onClick={onRemoveDay}
                  className="text-outline hover:text-error transition-colors leading-none cursor-pointer ml-0.5"
                  type="button"
                  title="Remove Day"
                >
                  ✕
                </button>
              </span>
            )}

            {/* Gender Pill */}
            {gender && gender !== 'All' && (
              <span className="inline-flex items-center gap-1.5 bg-surface-container-lowest border border-outline-variant rounded-lg px-2.5 py-1 text-label-sm text-on-surface shadow-xs">
                <span className="text-outline font-normal">Gender:</span> {gender}
                <button
                  onClick={onRemoveGender}
                  className="text-outline hover:text-error transition-colors leading-none cursor-pointer ml-0.5"
                  type="button"
                  title="Remove Gender"
                >
                  ✕
                </button>
              </span>
            )}

            {/* Fee Pill */}
            {maxFee && maxFee < 3000 && (
              <span className="inline-flex items-center gap-1.5 bg-surface-container-lowest border border-outline-variant rounded-lg px-2.5 py-1 text-label-sm text-on-surface shadow-xs">
                Fee: Under ৳{maxFee.toLocaleString()}
                <button
                  onClick={onRemoveFee}
                  className="text-outline hover:text-error transition-colors leading-none cursor-pointer ml-0.5"
                  type="button"
                  title="Remove Fee Filter"
                >
                  ✕
                </button>
              </span>
            )}

            {/* Clear All */}
            {hasActiveFilters && (
              <button
                onClick={onClearAll}
                className="text-body-sm font-label-sm text-error hover:underline ml-1 cursor-pointer transition-colors"
                type="button"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Results Counter */}
          <div className="flex items-center gap-4 ml-auto">
            <div className="text-body-sm text-on-surface font-body-sm">
              Showing <strong className="font-title-md text-primary font-bold">{totalDoctors}</strong> Verified Doctors found
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
