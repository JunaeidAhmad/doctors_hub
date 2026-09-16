import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, ensureArray } from '../../../services/api';
import { useDebounce } from '../../../hooks/useDebounce';

// Category normalization helper
export function normalizeCategorySlug(param, categoriesList = []) {
  if (!param || param === 'all' || param.toLowerCase() === 'all' || param.toLowerCase() === 'all test types') {
    return 'all';
  }
  const cleanParam = param.trim().toLowerCase();

  if (categoriesList && categoriesList.length > 0) {
    const match = categoriesList.find((c) =>
      (c.slug && c.slug.toLowerCase() === cleanParam) ||
      (c.id && String(c.id).toLowerCase() === cleanParam) ||
      (c.name && c.name.toLowerCase() === cleanParam)
    );
    if (match) return match.slug || match.id;
  }

  return cleanParam;
}

export function useDiagnosticsSearch({
  initialTest,
  initialLocation,
  onBookLabTest
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const lastParamsRef = useRef('');

  // Read URL parameters with fallbacks
  const urlQ = searchParams.get('q') || '';
  const urlTestCat = searchParams.get('testcat') || initialTest || 'all';
  const urlDivision = searchParams.get('division') || (initialLocation?.division || 'All Bangladesh');
  const urlDistrict = searchParams.get('district') || (initialLocation?.district || 'All Districts');
  const urlArea = searchParams.get('area') || (initialLocation?.area || 'All Areas');
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
  const [division, setDivision] = useState(urlDivision);
  const [district, setDistrict] = useState(urlDistrict);
  const [area, setArea] = useState(urlArea);
  const [fulfillment, setFulfillment] = useState(urlFulfillment);
  const [ownership, setOwnership] = useState(urlOwnership);
  const [sortBy, setSortBy] = useState(urlSort);
  const [currentPage, setCurrentPage] = useState(urlPage);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Data States
  const [diagnosticCenters, setDiagnosticCenters] = useState([]);
  const [testCategories, setTestCategories] = useState([
    { id: 'all', name: 'All Test Types', slug: 'all' }
  ]);
  const [isLoading, setIsLoading] = useState(true);

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
    if (division && division !== 'All Bangladesh') params.set('division', division);
    if (district && district !== 'All Districts') params.set('district', district);
    if (area && area !== 'All Areas') params.set('area', area);
    if (fulfillment && fulfillment !== 'all') params.set('fulfillment', fulfillment);
    if (ownership && ownership !== 'all') params.set('ownership', ownership);
    if (sortBy && sortBy !== 'price_asc') params.set('sort', sortBy);
    if (currentPage > 1) params.set('page', String(currentPage));

    const next = params.toString();
    if (next !== lastParamsRef.current) {
      lastParamsRef.current = next;
      setSearchParams(params, { replace: true });
    }
  }, [searchKeyword, selectedCategory, division, district, area, fulfillment, ownership, sortBy, currentPage, setSearchParams]);

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

  // Load Diagnostic Centers & Offered Tests from API
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const cleanDiv = (division || '').replace(/\s*Division$/i, '').trim();
    const cleanDist = (district || '').replace(/\s*District$/i, '').trim();
    const cleanArea = (area || '').replace(/\s*(Thana|Area)s?$/i, '').trim();

    const isCleanDivAll = !cleanDiv || cleanDiv.toLowerCase() === 'all' || cleanDiv.toLowerCase() === 'all bangladesh';
    const isCleanDistAll = !cleanDist || cleanDist.toLowerCase() === 'all' || cleanDist.toLowerCase() === 'all districts';
    const isCleanAreaAll = !cleanArea || cleanArea.toLowerCase() === 'all' || cleanArea.toLowerCase() === 'all areas';

    let queryTestCat = undefined;
    if (selectedCategory && selectedCategory !== 'all') {
      const catObj = testCategories.find(
        (c) => c.slug === selectedCategory || c.id === selectedCategory || (c.name || '').toLowerCase() === selectedCategory.toLowerCase()
      );
      queryTestCat = catObj?.slug || selectedCategory;
    }

    api.getDiagnosticCenters({
      division: !isCleanDivAll ? cleanDiv : undefined,
      district: !isCleanDistAll ? cleanDist : undefined,
      area: !isCleanAreaAll ? cleanArea : undefined,
      testcat: queryTestCat,
      search: debouncedSearchKeyword.trim() || undefined,
      page: 1,
      page_size: 50,
    })
      .then((data) => {
        if (isMounted) {
          const list = ensureArray(data, []);
          setDiagnosticCenters(list);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Failed to load diagnostic centers:', err);
          setDiagnosticCenters([]);
          setIsLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [division, district, area, selectedCategory, debouncedSearchKeyword, testCategories]);

  // Reset all filters to default
  const handleResetAll = () => {
    setSearchKeyword('');
    setSelectedCategory('all');
    setDivision('All Bangladesh');
    setDistrict('All Districts');
    setArea('All Areas');
    setFulfillment('all');
    setOwnership('all');
    setSortBy('price_asc');
    setCurrentPage(1);
  };

  const handleClearLocation = () => {
    setDivision('All Bangladesh');
    setDistrict('All Districts');
    setArea('All Areas');
    setCurrentPage(1);
  };

  // Location label for breadcrumb and titles
  const locationLabel = useMemo(() => {
    if (district && district !== 'All Districts') {
      return district.replace(/\s*District$/i, '').trim();
    }
    if (division && division !== 'All Bangladesh') {
      return division.replace(/\s*Division$/i, '').trim();
    }
    return 'Bangladesh';
  }, [division, district]);

  // Transform Diagnostic Centers into Test-centric Grouping
  const processedTests = useMemo(() => {
    const testMap = new Map();

    if (diagnosticCenters.length > 0) {
      diagnosticCenters.forEach((center) => {
        const centerOffered = ensureArray(center.offered_tests || center.tests, []);
        const centerLoc = center.location_details || center;

        centerOffered.forEach((offering) => {
          const tDetails = offering.test_details || offering.test || {};
          const tName = (tDetails.name || offering.name || '').trim();
          if (!tName) return;

          const key = tName.toLowerCase();
          const existing = testMap.get(key);

          const offeringItem = {
            id: offering.id || `${center.id}-${tDetails.id || tName}`,
            facility_name: center.name || centerLoc.name || 'Diagnostic Center',
            location_details: {
              name: center.name || centerLoc.name,
              branch: center.branch || centerLoc.branch || '',
              district: center.district || centerLoc.district || '',
              division: center.division || centerLoc.division || '',
              ownership_type: center.ownership_type || centerLoc.ownership_type || 'private',
            },
            price: offering.price || offering.calculated_price || 500,
            calculated_price: offering.calculated_price || offering.price || 500,
            report_time: offering.report_time || (tDetails.report_time_hours ? `Within ${tDetails.report_time_hours} hrs` : 'Same Day'),
            home_sample_collection: Boolean(offering.home_sample_collection),
            home_sample_note: offering.home_sample_note || (offering.home_sample_collection ? 'Available' : 'Center Visit Only'),
          };

          if (existing) {
            if (!existing.offerings.some((o) => o.facility_name === offeringItem.facility_name)) {
              existing.offerings.push(offeringItem);
            }
          } else {
            testMap.set(key, {
              id: tDetails.id || `test-${tName.replace(/\s+/g, '-').toLowerCase()}`,
              name: tName,
              category_id: tDetails.category_id || tDetails.category?.id || '',
              category_name: tDetails.category_name || tDetails.category?.name || 'Diagnostic Test',
              category_slug: tDetails.category_slug || tDetails.category?.slug || '',
              description: tDetails.description || 'Standard laboratory investigation with verified clinical reports.',
              report_time_hours: tDetails.report_time_hours || 12,
              fasting_required: Boolean(tDetails.fasting_required),
              sample_type: tDetails.sample_type || 'Clinical Sample',
              preparation_instructions: tDetails.preparation_instructions || '',
              price: offeringItem.price,
              offerings: [offeringItem],
            });
          }
        });
      });
    }

    let list = Array.from(testMap.values());

    const cleanDiv = (division || '').replace(/\s*Division$/i, '').trim().toLowerCase();
    const cleanDist = (district || '').replace(/\s*District$/i, '').trim().toLowerCase();
    const cleanArea = (area || '').replace(/\s*(Thana|Area)s?$/i, '').trim().toLowerCase();

    const isAllDiv = !cleanDiv || cleanDiv === 'all bangladesh' || cleanDiv === 'all';
    const isAllDist = !cleanDist || cleanDist === 'all districts' || cleanDist === 'all';
    const isAllArea = !cleanArea || cleanArea === 'all areas' || cleanArea === 'all';

    // Filter 1: Search Keyword
    if (searchKeyword.trim()) {
      const q = searchKeyword.trim().toLowerCase();
      list = list.filter((t) => {
        const matchName = t.name.toLowerCase().includes(q);
        const matchCat = (t.category_name || '').toLowerCase().includes(q);
        const matchDesc = (t.description || '').toLowerCase().includes(q);
        const matchCenter = t.offerings.some((o) => o.facility_name.toLowerCase().includes(q));
        return matchName || matchCat || matchDesc || matchCenter;
      });
    }

    // Filter 2: Category
    if (selectedCategory && selectedCategory !== 'all') {
      const selCatObj = testCategories.find(
        (c) => c.slug === selectedCategory || c.id === selectedCategory || (c.name || '').toLowerCase() === selectedCategory.toLowerCase()
      );
      const catSlug = (selCatObj?.slug || selectedCategory).toLowerCase();
      const catName = (selCatObj?.name || '').toLowerCase();
      const catId = selCatObj?.id;

      list = list.filter((t) => {
        if (catId && t.category_id && t.category_id === catId) return true;
        const cName = (t.category_name || '').toLowerCase();
        const cSlug = (t.category_slug || '').toLowerCase();

        if (cSlug && (cSlug === catSlug || cSlug.includes(catSlug) || catSlug.includes(cSlug))) return true;
        if (catName && (cName.includes(catName) || catName.includes(cName))) return true;
        return false;
      });
    }

    // Filter 3: Location
    if (!isAllDiv || !isAllDist || (!isAllArea && !searchKeyword.trim())) {
      list = list.map((t) => {
        const filteredOfferings = t.offerings.filter((o) => {
          const loc = o.location_details || {};
          const oDiv = (loc.division || '').toLowerCase();
          const oDist = (loc.district || '').toLowerCase();
          const oBranch = (loc.branch || '').toLowerCase();
          const oAddress = (loc.address || '').toLowerCase();

          if (!isAllDiv) {
            const matchDiv = oDiv.includes(cleanDiv) || cleanDiv.includes(oDiv) || oDist.includes(cleanDiv);
            if (!matchDiv) return false;
          }
          if (!isAllDist) {
            const matchDist = oDist.includes(cleanDist) || cleanDist.includes(oDist);
            if (!matchDist) return false;
          }
          if (!isAllArea && !searchKeyword.trim()) {
            const matchArea = oBranch.includes(cleanArea) || oAddress.includes(cleanArea);
            if (!matchArea) return false;
          }
          return true;
        });

        if (filteredOfferings.length === 0) return null;
        return { ...t, offerings: filteredOfferings };
      }).filter(Boolean);
    }

    // Filter 4: Fulfillment
    if (fulfillment !== 'all') {
      list = list.map((t) => {
        const filteredOfferings = t.offerings.filter((o) => {
          if (fulfillment === 'home') return o.home_sample_collection === true;
          if (fulfillment === 'center') return o.home_sample_collection === false;
          return true;
        });
        if (filteredOfferings.length === 0) return null;
        return { ...t, offerings: filteredOfferings };
      }).filter(Boolean);
    }

    // Filter 5: Ownership Type
    if (ownership !== 'all') {
      const ownKey = ownership.toLowerCase();
      list = list.map((t) => {
        const filteredOfferings = t.offerings.filter((o) => {
          const oType = (o.location_details?.ownership_type || 'private').toLowerCase();
          return oType === ownKey || oType.includes(ownKey);
        });
        if (filteredOfferings.length === 0) return null;
        return { ...t, offerings: filteredOfferings };
      }).filter(Boolean);
    }

    // Sort By
    if (sortBy === 'price_desc') {
      list.sort((a, b) => {
        const pA = Math.max(...a.offerings.map((o) => Number(o.calculated_price || o.price || 0)));
        const pB = Math.max(...b.offerings.map((o) => Number(o.calculated_price || o.price || 0)));
        return pB - pA;
      });
    } else {
      list.sort((a, b) => {
        const pA = Math.min(...a.offerings.map((o) => Number(o.calculated_price || o.price || 0)));
        const pB = Math.min(...b.offerings.map((o) => Number(o.calculated_price || o.price || 0)));
        return pA - pB;
      });
    }

    return list;
  }, [diagnosticCenters, searchKeyword, selectedCategory, division, district, area, fulfillment, ownership, sortBy, testCategories]);

  // Check landing / active filters
  const cleanDiv = (division || '').replace(/\s*Division$/i, '').trim().toLowerCase();
  const cleanDist = (district || '').replace(/\s*District$/i, '').trim().toLowerCase();
  const isAllDiv = !cleanDiv || cleanDiv === 'all bangladesh' || cleanDiv === 'all';
  const isAllDist = !cleanDist || cleanDist === 'all districts' || cleanDist === 'all';
  const isDefaultLanding = !searchKeyword.trim() && selectedCategory === 'all' && isAllDiv && isAllDist;
  const hasActiveFilters = Boolean(
    (searchKeyword && searchKeyword.trim()) ||
    (selectedCategory && selectedCategory !== 'all') ||
    (fulfillment && fulfillment !== 'all') ||
    (ownership && ownership !== 'all') ||
    (!isAllDiv) ||
    (!isAllDist)
  );

  // Pagination
  const pageSize = 4;
  const totalPages = Math.max(1, Math.ceil(processedTests.length / pageSize));
  const paginatedTests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedTests.slice(start, start + pageSize);
  }, [processedTests, currentPage, pageSize]);

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
        branch: center || { name: offering.facility_name },
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
    isLoading,
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
  };
}
