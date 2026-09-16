import React from 'react';
import { Stethoscope, Tag, AlertTriangle } from 'lucide-react';
import { useSpecialtiesTaxonomy } from '../hooks/useSpecialtiesTaxonomy';

import TaxonomyHeaderStats from './taxonomy/TaxonomyHeaderStats';
import CanonicalSpecialtiesView from './taxonomy/CanonicalSpecialtiesView';
import SpecialtyAliasesView from './taxonomy/SpecialtyAliasesView';
import SpecialtyReviewQueueView from './taxonomy/SpecialtyReviewQueueView';
import CanonicalSpecialtyModal from './taxonomy/CanonicalSpecialtyModal';
import SpecialtyAliasModal from './taxonomy/SpecialtyAliasModal';

export default function SpecialtiesTaxonomyTab({ initialTab = 'canonical' }) {
  const {
    subTab,
    setSubTab,
    loading,
    canonicalList,
    aliasesList,
    counts,
    canonicalSearch,
    setCanonicalSearch,
    aliasSearch,
    setAliasSearch,
    aliasSpecialtyFilter,
    setAliasSpecialtyFilter,
    aliasLangFilter,
    setAliasLangFilter,
    aliasStatusFilter,
    setAliasStatusFilter,
    clearAliasFilters,
    selectedReviewIds,
    totalDoctorsCovered,
    filteredCanonical,
    filteredAliases,
    unverifiedAliases,
    showSpecModal,
    setShowSpecModal,
    editingSpec,
    specForm,
    setSpecForm,
    showAliasModal,
    setShowAliasModal,
    editingAlias,
    aliasForm,
    setAliasForm,
    fetchData,
    handleOpenSpecModal,
    handleOpenAliasModal,
    handleSaveSpec,
    handleDeleteSpec,
    handleSaveAlias,
    handleReassignAlias,
    handleVerifyAlias,
    handleDeleteAlias,
    handleBatchVerify,
    handleApproveAll,
    toggleSelectReview,
    toggleSelectAllReviews
  } = useSpecialtiesTaxonomy(initialTab);

  return (
    <div className="space-y-6">
      {/* HEADER & METRIC STATS */}
      <TaxonomyHeaderStats
        counts={counts}
        canonicalCount={canonicalList.length}
        aliasesCount={aliasesList.length}
        totalDoctorsCovered={totalDoctorsCovered}
        loading={loading}
        onRefresh={fetchData}
        onAddCanonical={() => handleOpenSpecModal()}
        onAddAlias={() => handleOpenAliasModal()}
        onOpenReviewQueue={() => setSubTab('review-queue')}
      />

      {/* SUB-TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setSubTab('canonical')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            subTab === 'canonical'
              ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Canonical Specialties ({canonicalList.length})</span>
        </button>

        <button
          onClick={() => setSubTab('aliases')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            subTab === 'aliases'
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Specialty Aliases Ring ({aliasesList.length})</span>
        </button>

        <button
          onClick={() => setSubTab('review-queue')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            subTab === 'review-queue'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <AlertTriangle className={`w-4 h-4 ${unverifiedAliases.length > 0 ? 'text-amber-400' : ''}`} />
          <span>Review Queue</span>
          {unverifiedAliases.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
              {unverifiedAliases.length}
            </span>
          )}
        </button>
      </div>

      {/* SUB-TAB 1: CANONICAL SPECIALTIES */}
      {subTab === 'canonical' && (
        <CanonicalSpecialtiesView
          filteredCanonical={filteredCanonical}
          canonicalList={canonicalList}
          canonicalSearch={canonicalSearch}
          setCanonicalSearch={setCanonicalSearch}
          onOpenSpecModal={handleOpenSpecModal}
          onDeleteSpec={handleDeleteSpec}
          onFilterAliasesBySpecialty={(specId) => {
            setAliasSpecialtyFilter(specId);
            setSubTab('aliases');
          }}
        />
      )}

      {/* SUB-TAB 2: SPECIALTY ALIASES RING */}
      {subTab === 'aliases' && (
        <SpecialtyAliasesView
          filteredAliases={filteredAliases}
          canonicalList={canonicalList}
          aliasSearch={aliasSearch}
          setAliasSearch={setAliasSearch}
          aliasSpecialtyFilter={aliasSpecialtyFilter}
          setAliasSpecialtyFilter={setAliasSpecialtyFilter}
          aliasLangFilter={aliasLangFilter}
          setAliasLangFilter={setAliasLangFilter}
          aliasStatusFilter={aliasStatusFilter}
          setAliasStatusFilter={setAliasStatusFilter}
          onClearFilters={clearAliasFilters}
          onReassignAlias={handleReassignAlias}
          onVerifyAlias={handleVerifyAlias}
          onOpenAliasModal={handleOpenAliasModal}
          onDeleteAlias={handleDeleteAlias}
        />
      )}

      {/* SUB-TAB 3: UNVERIFIED REVIEW QUEUE */}
      {subTab === 'review-queue' && (
        <SpecialtyReviewQueueView
          unverifiedAliases={unverifiedAliases}
          selectedReviewIds={selectedReviewIds}
          canonicalList={canonicalList}
          onBatchVerify={handleBatchVerify}
          onApproveAll={handleApproveAll}
          onToggleSelectReview={toggleSelectReview}
          onToggleSelectAllReviews={toggleSelectAllReviews}
          onReassignAlias={handleReassignAlias}
          onVerifyAlias={handleVerifyAlias}
          onDeleteAlias={handleDeleteAlias}
        />
      )}

      {/* MODAL 1: ADD / EDIT CANONICAL SPECIALTY */}
      <CanonicalSpecialtyModal
        isOpen={showSpecModal}
        onClose={() => setShowSpecModal(false)}
        editingSpec={editingSpec}
        specForm={specForm}
        setSpecForm={setSpecForm}
        canonicalList={canonicalList}
        onSave={handleSaveSpec}
      />

      {/* MODAL 2: ADD / EDIT SPECIALTY ALIAS */}
      <SpecialtyAliasModal
        isOpen={showAliasModal}
        onClose={() => setShowAliasModal(false)}
        editingAlias={editingAlias}
        aliasForm={aliasForm}
        setAliasForm={setAliasForm}
        canonicalList={canonicalList}
        onSave={handleSaveAlias}
      />
    </div>
  );
}
