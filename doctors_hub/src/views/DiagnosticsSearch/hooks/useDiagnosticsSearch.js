import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, ensureArray } from '../../../services/api';
import { useDebounce } from '../../../hooks/useDebounce';
import { useDivisions, useDistricts, useThanas } from '../../../hooks/useGeo';

// Category normalization helper
export function normalizeCategorySlug(param, categoriesList = []) {
  if (!param || param === 'all' || param.toLowerCase() === 'all' || param.toLowerCase() === 'all test types') {
    return 'all';
  }
  const cleanParam = param.trim().toLowerCase();

  if (categoriesList && categoriesList.length > 0) {
    const match = categoriesList.find((c) =>
      (c.slug && c.slug.toLowerCase() === cleanParam) ||
      (c.id && String(c.id).toLowerCase() === cleanParam)
    );
    if (match) return match.slug || match.id;
  }

  return 'all';
}

export function useDiagnosticsSearch({
  initialTest,
  onBookLabTest
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const lastParamsRef = useRef('');

  // Read URL parameters with fallbacks
  const urlQ = searchParams.get('q') || '';
  const urlTestCat = searchParams.get('testcat') || initialTest || 'all';
  const urlDivisionId = searchParams.get('division_id') ? Number(searchParams.get('division_id')) : null;
  const urlDistrictId = searchParams.get('district_id') ? Number(searchParams.get('district_id')) : null;
  const urlThanaId = searchParams.get('thana_id') ? Number(searchParams.get('thana_id')) : null;
  const urlFulfillment = searchParams.get('fulfillment') || 'all';
  const urlOwnership = searchParams.get('ownership') || 'all';
  const urlSort = searchParams.get('sort') || 'price_asc';
  const urlPage = Number(searchParams.get('page')) || 1;

  // Filter States
  const [searchKeyword, setSearchKeyword] = useState(urlQ);
  const debouncedSearchKeyword = useDebounce(searchKeyword, 300);

  const [selectedCategory, setSelectedCategory] = useState(() =>
    normalizeCategorySlug(urlTestCat, [])
  );
  const [divisionId, setDivisionId] = useState(urlDivisionId);
  const [districtId, setDistrictId] = useState(urlDistrictId);
  const [thanaId, setThanaId] = useState(urlThanaId);
  const [fulfillment, setFulfillment] = useState(urlFulfillment);
  const [ownership, setOwnership] = useState(urlOwnership);
  const [sortBy, setSortBy] = useState(urlSort);
  const [currentPage, setCurrentPage] = useState(urlPage);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const { items: divisions } = useDivisions();
  const { items: districts } = useDistricts(divisionId);
  const { items: thanas } = useThanas(districtId);

  const divisionName = useMemo(() => {
    if (!divisionId) return '';
    return divisions.find(d => d.id === divisionId)?.name || '';
  }, [divisions, divisionId]);

  const districtName = useMemo(() => {
    if (!districtId) return '';
    return districts.find(d => d.id === districtId)?.name || '';
  }, [districts, districtId]);

  const thanaName = useMemo(() => {
    if (!thanaId) return '';
    return thanas.find(t => t.id === thanaId)?.name || '';
  }, [thanas, thanaId]);

  // Data States
  const [testCategories, setTestCategories] = useState([
    { id: 'all', name: 'All Test Types', slug: 'all' }
  ]);
  const [results, setResults] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [facets, setFacets] = useState({ ownership: {}, fulfillment: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reactive synchronization: sync URL testcat parameter / initialTest into selectedCategory
  useEffect(() => {
    const rawParam = searchParams.get('testcat') || initialTest || '';
    if (rawParam) {
      const normalized = normalizeCategorySlug(rawParam, testCategories);
      if (normalized && normalized !== selectedCategory) {
        setSelectedCategory(normalized);
        setCurrentPage(1);
      }
    } else if (selectedCategory !== 'all') {
      setSelectedCategory('all');
      setCurrentPage(1);
    }
  }, [searchParams, initialTest, testCategories]);

  // Sync state to URL parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchKeyword.trim()) params.set('q', searchKeyword.trim());
    if (selectedCategory && selectedCategory !== 'all') params.set('testcat', selectedCategory);
    if (divisionId) params.set('division_id', String(divisionId));
    if (districtId) params.set('district_id', String(districtId));
    if (thanaId) params.set('thana_id', String(thanaId));
    if (fulfillment && fulfillment !== 'all') params.set('fulfillment', fulfillment);
    if (ownership && ownership !== 'all') params.set('ownership', ownership);
    if (sortBy && sortBy !== 'price_asc') params.set('sort', sortBy);
    if (currentPage > 1) params.set('page', String(currentPage));

    const next = params.toString();
    if (next !== lastParamsRef.current) {
      lastParamsRef.current = next;
      setSearchParams(params, { replace: true });
    }
  }, [searchKeyword, selectedCategory, divisionId, districtId, thanaId, fulfillment, ownership, sortBy, currentPage, setSearchParams]);

  // Load Test Categories directly from API
  useEffect(() => {
    let isMounted = true;
    api.getTestCategories()
      .then((data) => {
        if (isMounted) {
          const list = ensureArray(data, []);
          if (list.length > 0) {
            const dbCategories = list
              .map((c) => ({
                id: c.id,
                name: c.name,
                slug: c.slug || (c.name ? c.name.toLowerCase().replace(/\s+/g, '-') : ''),
              }))
              .filter(
                (c) => c.slug !== 'all' && (c.name || '').toLowerCase() !== 'all test types'
              );

            setTestCategories([
              { id: 'all', name: 'All Test Types', slug: 'all' },
              ...dbCategories
            ]);
          }
        }
      })
      .catch((err) => {
        console.warn('Failed to load test categories from API:', err);
      });

    return () => { isMounted = false; };
  }, []);

  // Single fetch effect for searchFacilityTests API
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const params = {
      page: currentPage,
      page_size: 4,
      ordering: sortBy === 'price_desc' ? '-price' : 'price',
    };

    if (debouncedSearchKeyword && debouncedSearchKeyword.trim()) {
      params.q = debouncedSearchKeyword.trim();
    }

    if (selectedCategory && selectedCategory !== 'all') {
      const catObj = testCategories.find(
        (c) => c.slug === selectedCategory || c.id === selectedCategory
      );
      params.testcat = catObj?.slug || selectedCategory;
    }

    if (divisionId) params.division_id = divisionId;
    if (districtId) params.district_id = districtId;
    if (thanaId) params.thana_id = thanaId;

    if (fulfillment && fulfillment !== 'all') {
      params.fulfillment = fulfillment;
    }

    if (ownership && ownership !== 'all') {
      params.ownership = ownership;
    }

    api.searchFacilityTests(params)
      .then((data) => {
        if (isMounted) {
          setResults(data?.results || []);
          setTotalCount(data?.count || 0);
          setTotalPages(data?.total_pages || 1);
          setFacets(data?.facets || { ownership: {}, fulfillment: {} });
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to search facility tests:', err);
          setError(err);
          setResults([]);
          setTotalCount(0);
          setTotalPages(1);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [
    debouncedSearchKeyword,
    selectedCategory,
    divisionId,
    districtId,
    thanaId,
    fulfillment,
    ownership,
    sortBy,
    currentPage,
    testCategories,
  ]);

  // Reset all filters to default
  const handleResetAll = () => {
    setSearchKeyword('');
    setSelectedCategory('all');
    setDivisionId(null);
    setDistrictId(null);
    setThanaId(null);
    setFulfillment('all');
    setOwnership('all');
    setSortBy('price_asc');
    setCurrentPage(1);
  };

  const handleClearLocation = () => {
    setDivisionId(null);
    setDistrictId(null);
    setThanaId(null);
    setCurrentPage(1);
  };

  // Location label for breadcrumb and titles
  const locationLabel = useMemo(() => {
    return districtName || divisionName || 'Bangladesh';
  }, [districtName, divisionName]);

  // Check landing / active filters
  const isDefaultLanding = !searchKeyword.trim() && selectedCategory === 'all' && !divisionId && !districtId && !thanaId;
  const hasActiveFilters = Boolean(
    (searchKeyword && searchKeyword.trim()) ||
    (selectedCategory && selectedCategory !== 'all') ||
    (fulfillment && fulfillment !== 'all') ||
    (ownership && ownership !== 'all') ||
    divisionId ||
    districtId ||
    thanaId
  );

  // Book action from test card table
  const handleBookTest = (offering, center, testDetails) => {
    if (onBookLabTest) {
      onBookLabTest({
        test: {
          id: testDetails.id,
          name: testDetails.name,
          category_name: testDetails.category_name,
          description: testDetails.description,
          fasting_required: testDetails.fasting_required,
        },
        branchTest: {
          id: offering.id,
          name: testDetails.name,
          price: offering.price,
          calculated_price: offering.calculated_price,
          discounted_price: offering.calculated_price,
          report_time: offering.report_time,
          home_sample_collection: offering.home_sample_collection,
          home_sample_note: offering.home_sample_note,
        },
        branch: offering.facility || center || { name: offering.facility_name },
      });
    }
  };

  // Home collection from promo banner
  const handleBookHomeCollection = () => {
    setFulfillment('home');
    setCurrentPage(1);
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const handleViewGuidelines = () => {
    alert('Doorstep Sample Collection Guidelines:\n1. Keep relevant prescriptions ready.\n2. Observe fasting requirements (10-12 hours for Lipid Profile, Fasting Sugar).\n3. Certified phlebotomists arrive with sealed vacutainer kits.');
  };

  return {
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
    divisionName,
    districtName,
    thanaName,
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
    paginatedTests: results,
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
  };
}
