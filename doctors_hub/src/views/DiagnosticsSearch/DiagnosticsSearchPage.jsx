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
    division,
    setDivision,
    district,
    setDistrict,
    area,
    setArea,
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
    locationLabel,
    isDefaultLanding,
    hasActiveFilters,
    processedTests,
    paginatedTests,
    totalPages,
    handleResetAll,
    handleClearLocation,
    handleBookTest,
    handleBookHomeCollection,
    handleViewGuidelines,
  } = useDiagnosticsSearch({
    initialTest,
    initialLocation,
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
              division={division}
              district={district}
              area={area}
              onLocationChange={({ division: d, district: dist, area: a }) => {
                setDivision(d);
                setDistrict(dist);
                setArea(a);
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
              ownershipCounts={{
                private: 18,
                hospital_affiliated: 12,
                government: 5,
                ngo: 3,
              }}
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
              totalCount={processedTests.length}
              sortBy={sortBy}
              onSortChange={(s) => {
                setSortBy(s);
                setCurrentPage(1);
              }}
            />

            {/* Test Cards List */}
            {paginatedTests.length === 0 ? (
              <DiagnosticsEmptyState
                onResetAll={handleResetAll}
                searchKeyword={searchKeyword}
                locationLabel={locationLabel}
              />
            ) : (
              <div className="space-y-6">
                {paginatedTests.map((test) => (
                  <DiagnosticTestCard
                    key={test.id || test.name}
                    test={test}
                    offerings={test.offerings}
                    onBookTest={handleBookTest}
                  />
                ))}

                {/* Pagination (visible when user is actively searching or filtering) */}
                {!isDefaultLanding && totalPages > 1 && (
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
