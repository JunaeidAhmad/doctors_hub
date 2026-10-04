import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FlaskConical, Truck, Search, ArrowRight, Loader2, TestTube2
} from 'lucide-react';
import { getFacilityTests } from '../../../services/api/hospitals';

export default function HospitalDiagnosticsSection({ 
  hospital, 
  onBookLabTest 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tests, setTests] = useState([]);
  const [facets, setFacets] = useState({});
  const [totalCount, setTotalCount] = useState(0);
  const [nextPage, setNextPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  const hospitalName = (hospital?.display_name || hospital?.name || "") || '';
  const facilityId = hospital?.slug || hospital?.id;
  const facilityKind = hospital?.location_type === 'diagnostic_center' ? 'diagnostic-centers' : 'hospitals';

  const hasHomeSample = (facets?.fulfillment?.home ?? 0) > 0;

  const fetchTests = useCallback(async (page = 1, append = false) => {
    if (!facilityId) return;

    if (page === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const params = { page, page_size: 12, ordering: 'price' };
      if (searchTerm.trim()) params.q = searchTerm.trim();

      const data = await getFacilityTests(facilityKind, facilityId, params);

      const results = data?.results || [];
      const newFacets = data?.facets || {};
      const count = data?.count ?? 0;

      if (append) {
        setTests(prev => [...prev, ...results]);
      } else {
        setTests(results);
        setFacets(newFacets);
      }
      setTotalCount(count);
      setNextPage(data?.next ? page + 1 : null);
    } catch (err) {
      console.error('Failed to fetch facility tests:', err);
      setError('Failed to load diagnostic tests. Please try again.');
      if (!append) {
        setTests([]);
        setFacets({});
        setTotalCount(0);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [facilityId, facilityKind, searchTerm]);

  // Fetch on mount
  useEffect(() => {
    fetchTests(1, false);
  }, [facilityId]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchTests(1, false);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm]);

  const handleLoadMore = () => {
    if (nextPage && !loadingMore) {
      fetchTests(nextPage, true);
    }
  };

  const handleBook = (test) => {
    if (onBookLabTest) {
      onBookLabTest({
        id: test.test_id || test.id,
        name: test.test_name || test.name,
        min_price: test.min_price,
        max_price: test.max_price,
        facility_name: hospitalName,
        branch_name: hospital?.branch || '',
        branch: hospital?.branch || '',
        category: test.category_name || '',
      });
    }
  };

  // If no tests at all and not loading, don't show the section
  if (!loading && totalCount === 0 && !error && !searchTerm.trim()) {
    return null;
  }

  // Skeleton loading
  if (loading && tests.length === 0) {
    return (
      <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/70 p-5 sm:p-6 lg:p-8 space-y-6 scroll-mt-24" id="diagnostics-section">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/50 pb-5">
          <div className="space-y-2">
            <div className="h-5 w-32 bg-surface-container-high rounded-full animate-pulse" />
            <div className="h-7 w-72 bg-surface-container-high rounded animate-pulse" />
            <div className="h-4 w-48 bg-surface-container-high rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="p-4 rounded-xl border border-outline-variant animate-pulse">
              <div className="h-5 w-48 bg-surface-container-high rounded mb-2" />
              <div className="h-3 w-32 bg-surface-container-high rounded mb-3" />
              <div className="h-4 w-20 bg-surface-container-high rounded" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/70 p-5 sm:p-6 lg:p-8 space-y-6 scroll-mt-24" id="diagnostics-section">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/50 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary text-xs font-semibold mb-1.5">
            <FlaskConical className="w-3.5 h-3.5 text-secondary" />
            <span>Diagnostic Division</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
            Diagnostic & Lab Tests
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            {totalCount} diagnostic test{totalCount !== 1 ? 's' : ''} available at this facility.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasHomeSample && (
            <div className="flex items-center gap-1.5 text-xs text-primary font-semibold bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/20">
              <Truck className="w-4 h-4 text-primary" />
              <span>Home Sample Collection Available</span>
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-outline" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search tests by name or category..."
          className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary outline-none transition-all"
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-error/5 rounded-xl border border-error/20 p-6 text-center">
          <p className="text-sm font-medium text-error">{error}</p>
          <button
            onClick={() => fetchTests(1, false)}
            className="mt-2 text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Tests Grid */}
      {!error && tests.length === 0 && !loading ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/70 p-8 text-center">
          <TestTube2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-on-surface">No tests found matching your search</p>
          <p className="text-xs text-on-surface-variant mt-1">Try a different search term.</p>
        </div>
      ) : !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tests.map((test) => {
            const testName = test.test_name || test.name || 'Lab Test';
            const categoryName = test.category_name || '';
            const minPrice = test.min_price != null ? Number(test.min_price) : null;
            const maxPrice = test.max_price != null ? Number(test.max_price) : null;
            const offeringCount = test.offering_count ?? 0;

            return (
              <div
                key={test.test_id || test.id}
                className="p-4 rounded-xl border border-outline-variant/70 bg-surface-container-low/40 hover:border-primary/50 transition-all flex flex-col justify-between"
              >
                <div>
                  {categoryName && (
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
                      {categoryName}
                    </span>
                  )}
                  <h4 className="text-sm font-bold text-on-surface mt-0.5 line-clamp-2">
                    {testName}
                  </h4>

                  <div className="mt-3 pt-2.5 border-t border-outline-variant/60 flex items-center justify-between text-xs">
                    <div>
                      {minPrice != null && (
                        <span className="text-base font-bold text-on-surface">
                          ৳{minPrice.toLocaleString()}
                          {maxPrice != null && maxPrice !== minPrice && (
                            <span className="text-xs font-normal text-on-surface-variant"> – ৳{maxPrice.toLocaleString()}</span>
                          )}
                        </span>
                      )}
                    </div>
                    {offeringCount > 1 && (
                      <span className="text-[11px] text-on-surface-variant">
                        {offeringCount} offering{offeringCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleBook(test)}
                  className="mt-3 w-full py-2 rounded-lg bg-surface-container-lowest border border-primary text-primary text-xs font-semibold hover:bg-primary hover:text-white transition-all cursor-pointer shadow-2xs"
                >
                  Book Test
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Loading indicator during refetch */}
      {loading && tests.length > 0 && (
        <div className="text-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
        </div>
      )}

      {/* Load More */}
      {nextPage && !loading && (
        <div className="text-center pt-2">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg border border-secondary text-secondary text-xs sm:text-sm font-semibold hover:bg-secondary/5 transition-all cursor-pointer disabled:opacity-50"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <span>Load More Tests ({tests.length} of {totalCount})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
