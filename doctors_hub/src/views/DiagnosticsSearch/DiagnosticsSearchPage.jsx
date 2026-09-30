import React from 'react';
import Pagination from '../../components/Pagination';

// Subcomponents
import DiagnosticsBreadcrumbs from './components/DiagnosticsBreadcrumbs';
import DiagnosticsHeroSearch from './components/DiagnosticsHeroSearch';
import DiagnosticsFilterSidebar from './components/DiagnosticsFilterSidebar';
import DiagnosticsResultsHeader from './components/DiagnosticsResultsHeader';
import DiagnosticTestCard from './components/DiagnosticTestCard';
import DiagnosticsPromoBanner from './components/DiagnosticsPromoBanner';
import DiagnosticsEmptyState from './components/DiagnosticsEmptyState';

// Custom Hook
import { useDiagnosticsSearch } from './hooks/useDiagnosticsSearch';

export default function DiagnosticsSearchPage({
  initialTest,
  initialLocation,
  onBookLabTest,
  onNavigateHome,
}) {
  const {
    searchKeyword,
    setSearchKeyword,
    selectedCategory,
    setSelectedCategory,
    divisionId,
    setDivisionId,
    districtId,
    setDistrictId,
    thanaId,
    setThanaId,
    fulfillment,
    setFulfillment,
    ownership,
    setOwnership,
    sortBy,
    setSortBy,
    currentPage,
    setCurrentPage,
    isMobileFiltersOpen,
    setIsMobileFiltersOpen,
    testCategories,
    isLoading,
    error,
    results,
    totalCount,
    totalPages,
    facets,
    locationLabel,
    isDefaultLanding,
    hasActiveFilters,
    handleResetAll,
    handleClearLocation,
    handleBookTest,
    handleBookHomeCollection,
    handleViewGuidelines,
  } = useDiagnosticsSearch({
    initialTest,
    onBookLabTest,
  });

  return (
    <div className="bg-background text-on-surface font-body-md antialiased min-h-screen flex flex-col">
      {/* Main Container Canvas */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
        {/* Breadcrumb Navigation & Live Tracker Pill */}
        <DiagnosticsBreadcrumbs
          locationLabel={locationLabel}
          onNavigateHome={onNavigateHome}
        />

        {/* Hero & Integrated Search Section */}
        <DiagnosticsHeroSearch
          categories={testCategories}
          selectedCategory={selectedCategory}
          onCategoryChange={(cat) => {
            setSelectedCategory(cat);
            setCurrentPage(1);
          }}
          searchKeyword={searchKeyword}
          onSearchChange={(kw) => {
            setSearchKeyword(kw);
            setCurrentPage(1);
          }}
          onSearchSubmit={() => setCurrentPage(1)}
        />

        {/* Two-Column Diagnostic Marketplace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Mobile Filter Toggle Icon Button at the Right */}
          <div className="lg:hidden col-span-1 flex justify-end">
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen((prev) => !prev)}
              className="relative p-2.5 bg-surface-container-lowest hover:bg-surface-container-low border border-outline-variant rounded-xl text-primary shadow-xs transition-all flex items-center justify-center cursor-pointer active:scale-95"
              title={isMobileFiltersOpen ? "Hide filters" : "Open filters"}
              aria-label={isMobileFiltersOpen ? "Hide filters" : "Open filters"}
            >
              <span className="material-symbols-outlined text-[22px]">
                {isMobileFiltersOpen ? 'close' : 'tune'}
              </span>
              {!isMobileFiltersOpen && hasActiveFilters && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-surface-container-lowest" />
              )}
            </button>
          </div>

          {/* LEFT SIDEBAR: Clinical Filters */}
          <div className={`${isMobileFiltersOpen ? 'col-span-1 block' : 'hidden'} lg:block lg:col-span-3`}>
            <DiagnosticsFilterSidebar
              divisionId={divisionId}
              districtId={districtId}
              thanaId={thanaId}
              onLocationChange={({ divisionId: d, districtId: dist, thanaId: a }) => {
                setDivisionId(d);
                setDistrictId(dist);
                setThanaId(a);
                setCurrentPage(1);
              }}
              onClearLocation={handleClearLocation}
              fulfillment={fulfillment}
              onFulfillmentChange={(f) => {
                setFulfillment(f);
                setCurrentPage(1);
              }}
              ownership={ownership}
              onOwnershipChange={(o) => {
                setOwnership(o);
                setCurrentPage(1);
              }}
              ownershipCounts={facets?.ownership || {}}
              onResetAll={handleResetAll}
              onClose={() => setIsMobileFiltersOpen(false)}
              onApplyFilters={() => {
                setCurrentPage(1);
                setIsMobileFiltersOpen(false);
              }}
              className={isMobileFiltersOpen ? 'block' : 'hidden lg:block'}
            />
          </div>

          {/* RIGHT TEST CATALOG & COMPARISON CARDS */}
          <section className="col-span-1 lg:col-span-9 space-y-6">
            <DiagnosticsResultsHeader
              locationLabel={locationLabel}
              totalCount={totalCount}
              sortBy={sortBy}
              onSortChange={(s) => {
                setSortBy(s);
                setCurrentPage(1);
              }}
            />

            {/* Test Cards List */}
            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-surface-container-lowest rounded-2xl border border-outline-variant/70 p-6 shadow-sm animate-pulse space-y-4"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-4 border-b border-outline-variant/60">
                      <div className="space-y-2 w-full md:w-2/3">
                        <div className="flex gap-2">
                          <div className="h-5 bg-slate-200 rounded-full w-24" />
                          <div className="h-5 bg-slate-200 rounded w-28" />
                        </div>
                        <div className="h-6 bg-slate-200 rounded w-1/2" />
                        <div className="h-4 bg-slate-100 rounded w-3/4" />
                      </div>
                      <div className="space-y-1 w-28 shrink-0">
                        <div className="h-3 bg-slate-100 rounded w-20" />
                        <div className="h-6 bg-slate-200 rounded w-24" />
                      </div>
                    </div>
                    <div className="space-y-2 pt-2">
                      <div className="h-10 bg-slate-100 rounded-lg w-full" />
                      <div className="h-10 bg-slate-50 rounded-lg w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-8 bg-error/10 border border-error/20 rounded-2xl text-center space-y-3">
                <span className="material-symbols-outlined text-error text-[36px]">error</span>
                <h3 className="text-lg font-bold text-on-surface">Failed to load diagnostic tests</h3>
                <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                  An error occurred while loading diagnostic tests. Please check your network connection or try again.
                </p>
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="px-4 py-2 bg-primary text-on-primary rounded-xl font-medium text-xs hover:bg-primary-container cursor-pointer transition-all"
                >
                  Reset Filters &amp; Retry
                </button>
              </div>
            ) : results.length === 0 ? (
              <DiagnosticsEmptyState
                onResetAll={handleResetAll}
                searchKeyword={searchKeyword}
                locationLabel={locationLabel}
              />
            ) : (
              <div className="space-y-6">
                {results.map((test) => (
                  <DiagnosticTestCard
                    key={test.id || test.name}
                    test={test}
                    offerings={test.offerings}
                    onBookTest={handleBookTest}
                  />
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pt-4">
                    <Pagination
                      page={currentPage}
                      totalPages={totalPages}
                      onPageChange={(p) => {
                        setCurrentPage(p);
                        window.scrollTo({ top: 380, behavior: 'smooth' });
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Home Sample Collection Promotion Banner */}
        <DiagnosticsPromoBanner
          onBookHomeCollection={handleBookHomeCollection}
          onViewGuidelines={handleViewGuidelines}
        />
      </div>
    </div>
  );
}
