import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, ensureArray, isPageReload, getIsInitialLoad } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import Pagination from '../../components/Pagination';

// Subcomponents
import DiagnosticsBreadcrumbs from './components/DiagnosticsBreadcrumbs';
import DiagnosticsHeroSearch from './components/DiagnosticsHeroSearch';
import DiagnosticsFilterSidebar from './components/DiagnosticsFilterSidebar';
import DiagnosticsResultsHeader from './components/DiagnosticsResultsHeader';
import DiagnosticTestCard from './components/DiagnosticTestCard';
import DiagnosticsPromoBanner from './components/DiagnosticsPromoBanner';
import DiagnosticsEmptyState from './components/DiagnosticsEmptyState';

// Standard fallback categories matching Stitch design
const STITCH_TEST_CATEGORIES = [
  { id: 'all', name: 'All Test Types', slug: 'all' },
  { id: 'pathology-blood', name: 'Pathology & Blood', slug: 'pathology-blood' },
  { id: 'radiology-mri', name: 'Radiology & MRI', slug: 'radiology-mri' },
  { id: 'cardiology-ecg', name: 'Cardiology / ECG', slug: 'cardiology-ecg' },
  { id: 'biochemistry', name: 'Biochemistry', slug: 'biochemistry' },
  { id: 'ultrasonography', name: 'Ultrasonography', slug: 'ultrasonography' },
  { id: 'histopathology', name: 'Histopathology', slug: 'histopathology' },
];

// Curated Stitch Featured Tests with multi-center offerings
const STITCH_FEATURED_TESTS = [
  {
    id: 'test-cbc-esr',
    name: 'Complete Blood Count (CBC) with ESR',
    category_name: 'Pathology',
    category_slug: 'pathology-blood',
    description: 'Automated 5-part differential blood count and erythrocyte sedimentation rate',
    report_time_hours: 4,
    fasting_required: false,
    sample_type: 'Whole Blood (EDTA)',
    preparation_instructions: 'No special preparation needed. Fasting not required.',
    price: 400,
    offerings: [
      {
        id: 'cbc-pop',
        facility_name: 'Popular Diagnostic Centre',
        location_details: { name: 'Popular Diagnostic Centre', branch: 'Dhanmondi Main', district: 'Dhaka', division: 'Dhaka', ownership_type: 'private' },
        price: 400,
        calculated_price: 400,
        report_time: 'Same day (4 hrs)',
        home_sample_collection: true,
        home_sample_note: '+৳100 Pickup',
      },
      {
        id: 'cbc-ibn',
        facility_name: 'Ibn Sina Diagnostic',
        location_details: { name: 'Ibn Sina Diagnostic', branch: 'Dhanmondi Branch', district: 'Dhaka', division: 'Dhaka', ownership_type: 'private' },
        price: 380,
        calculated_price: 380,
        report_time: 'Same day (4 hrs)',
        home_sample_collection: true,
        home_sample_note: 'Available',
      },
      {
        id: 'cbc-lab',
        facility_name: 'LabAid Diagnostic',
        location_details: { name: 'LabAid Diagnostic', branch: 'Gulshan Branch', district: 'Dhaka', division: 'Dhaka', ownership_type: 'hospital_affiliated' },
        price: 450,
        calculated_price: 450,
        report_time: '5-6 hours',
        home_sample_collection: true,
        home_sample_note: '+৳120 Pickup',
      },
    ],
  },
  {
    id: 'test-mri-brain',
    name: 'MRI of Brain (Plain & Contrast - 1.5T / 3.0T)',
    category_name: 'Radiology & Imaging',
    category_slug: 'radiology-mri',
    description: 'High-resolution neuro-cranial magnetic resonance imaging with gadolinium contrast',
    report_time_hours: 24,
    fasting_required: false,
    sample_type: 'Diagnostic Scan',
    preparation_instructions: 'Remove all metallic objects. Preparation guide included.',
    price: 7500,
    offerings: [
      {
        id: 'mri-sq',
        facility_name: 'Square Hospital Lab',
        location_details: { name: 'Square Hospital Lab', branch: 'Panthapath Central', district: 'Dhaka', division: 'Dhaka', ownership_type: 'hospital_affiliated' },
        price: 8500,
        calculated_price: 8500,
        report_time: 'Tomorrow, 10:30 AM',
        home_sample_collection: false,
        home_sample_note: 'Center Visit Only',
      },
      {
        id: 'mri-pop',
        facility_name: 'Popular Diagnostic (Dhanmondi)',
        location_details: { name: 'Popular Diagnostic (Dhanmondi)', branch: 'Dhanmondi', district: 'Dhaka', division: 'Dhaka', ownership_type: 'private' },
        price: 7500,
        calculated_price: 7500,
        report_time: 'Today, 06:00 PM',
        home_sample_collection: false,
        home_sample_note: 'Center Visit Only',
      },
      {
        id: 'mri-ibn',
        facility_name: 'Ibn Sina Diagnostic Centre',
        location_details: { name: 'Ibn Sina Diagnostic Centre', branch: 'Kalyanpur', district: 'Dhaka', division: 'Dhaka', ownership_type: 'private' },
        price: 7200,
        calculated_price: 7200,
        report_time: 'Today, 08:15 PM',
        home_sample_collection: false,
        home_sample_note: 'Center Visit Only',
      },
    ],
  },
  {
    id: 'test-lipid-profile',
    name: 'Lipid Profile (Cholesterol, HDL, LDL, Triglycerides)',
    category_name: 'Biochemistry',
    category_slug: 'biochemistry',
    description: 'Complete fasting blood lipid screening for cardiovascular disease profiling',
    report_time_hours: 8,
    fasting_required: true,
    sample_type: 'Blood (Serum)',
    preparation_instructions: '12 Hours Fasting Required before morning sample pickup.',
    price: 1100,
    offerings: [
      {
        id: 'lp-ibn',
        facility_name: 'Ibn Sina Diagnostic',
        location_details: { name: 'Ibn Sina Diagnostic', branch: 'Dhanmondi', district: 'Dhaka', division: 'Dhaka', ownership_type: 'private' },
        price: 1100,
        calculated_price: 1100,
        report_time: 'Same day by 5:00 PM',
        home_sample_collection: true,
        home_sample_note: 'Free with order > ৳1000',
      },
      {
        id: 'lp-med',
        facility_name: 'Medinova Medical Diagnostic',
        location_details: { name: 'Medinova Medical Diagnostic', branch: 'Dhanmondi Main', district: 'Dhaka', division: 'Dhaka', ownership_type: 'private' },
        price: 1150,
        calculated_price: 1150,
        report_time: 'Within 6 Hours',
        home_sample_collection: true,
        home_sample_note: '+৳80 Pickup charge',
      },
      {
        id: 'lp-pop',
        facility_name: 'Popular Diagnostic Centre',
        location_details: { name: 'Popular Diagnostic Centre', branch: 'Panthapath', district: 'Dhaka', division: 'Dhaka', ownership_type: 'private' },
        price: 1200,
        calculated_price: 1200,
        report_time: 'Same day by 4:00 PM',
        home_sample_collection: true,
        home_sample_note: 'Available',
      },
    ],
  },
  {
    id: 'test-usg-abdomen',
    name: 'Whole Abdomen Ultrasonography (USG)',
    category_name: 'Ultrasonography',
    category_slug: 'ultrasonography',
    description: 'High-frequency abdominal ultrasound evaluation with liver, spleen, kidneys and bladder imaging',
    report_time_hours: 1,
    fasting_required: false,
    sample_type: 'Ultrasound Imaging',
    preparation_instructions: 'Full Bladder Required. Female & Male Radiologists Available.',
    price: 1600,
    offerings: [
      {
        id: 'usg-green',
        facility_name: 'Green Life Hospital Diagnostic',
        location_details: { name: 'Green Life Hospital Diagnostic', branch: 'Green Road', district: 'Dhaka', division: 'Dhaka', ownership_type: 'hospital_affiliated' },
        price: 1600,
        calculated_price: 1600,
        report_time: 'Immediate (30 mins)',
        home_sample_collection: false,
        home_sample_note: 'Center Visit Only',
      },
      {
        id: 'usg-ibn',
        facility_name: 'Ibn Sina Diagnostic',
        location_details: { name: 'Ibn Sina Diagnostic', branch: 'Dhanmondi', district: 'Dhaka', division: 'Dhaka', ownership_type: 'private' },
        price: 1750,
        calculated_price: 1750,
        report_time: 'Within 1 hour',
        home_sample_collection: false,
        home_sample_note: 'Center Visit Only',
      },
      {
        id: 'usg-pop',
        facility_name: 'Popular Diagnostic Centre',
        location_details: { name: 'Popular Diagnostic Centre', branch: 'Dhanmondi Main', district: 'Dhaka', division: 'Dhaka', ownership_type: 'private' },
        price: 1800,
        calculated_price: 1800,
        report_time: 'Immediate (45 mins)',
        home_sample_collection: false,
        home_sample_note: 'Center Visit Only',
      },
    ],
  },
];

export default function DiagnosticsSearchPage({
  initialTest,
  initialLocation,
  onBookLabTest,
  onNavigateHome,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const lastParamsRef = useRef('');

  // Read URL parameters with fallbacks
  const urlQ = searchParams.get('q') || '';
  const urlTestCat = searchParams.get('testcat') || 'all';
  const urlDivision = searchParams.get('division') || (initialLocation?.division || 'Dhaka Division');
  const urlDistrict = searchParams.get('district') || (initialLocation?.district || 'Dhaka District');
  const urlArea = searchParams.get('area') || 'All Areas';
  const urlFulfillment = searchParams.get('fulfillment') || 'all';
  const urlOwnership = searchParams.get('ownership') || 'all';
  const urlSort = searchParams.get('sort') || 'price_asc';
  const urlPage = Number(searchParams.get('page')) || 1;

  // Filter States
  const [searchKeyword, setSearchKeyword] = useState(urlQ);
  const debouncedSearchKeyword = useDebounce(searchKeyword, 300);

  const [selectedCategory, setSelectedCategory] = useState(urlTestCat);
  const [division, setDivision] = useState(urlDivision);
  const [district, setDistrict] = useState(urlDistrict);
  const [area, setArea] = useState(urlArea);
  const [fulfillment, setFulfillment] = useState(urlFulfillment);
  const [ownership, setOwnership] = useState(urlOwnership);
  const [sortBy, setSortBy] = useState(urlSort);
  const [currentPage, setCurrentPage] = useState(urlPage);

  // Data States
  const [diagnosticCenters, setDiagnosticCenters] = useState([]);
  const [testCategories, setTestCategories] = useState(STITCH_TEST_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);

  // Sync URL parameters
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

  // Load Test Categories from API
  useEffect(() => {
    let isMounted = true;
    api.getTestCategories()
      .then((data) => {
        if (isMounted) {
          const list = ensureArray(data, []);
          if (list.length > 0) {
            // Deduplicate and merge: keep Stitch curated standard categories, plus DB categories
            const dbCategories = list.map((c) => ({
              id: c.id,
              name: c.name,
              slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
            }));

            // Filter out any "all" from DB list
            const cleanDbCats = dbCategories.filter(
              (c) => c.slug !== 'all' && (c.name || '').toLowerCase() !== 'all test types'
            );

            // Stitch primary categories
            const stitchCats = STITCH_TEST_CATEGORIES.filter((c) => c.slug !== 'all');

            // Unique categories: Stitch first, then other DB categories
            const combined = [{ id: 'all', name: 'All Test Types', slug: 'all' }, ...stitchCats];
            cleanDbCats.forEach((dc) => {
              const alreadyExists = combined.some(
                (existing) =>
                  existing.slug === dc.slug ||
                  existing.name.toLowerCase() === dc.name.toLowerCase()
              );
              if (!alreadyExists) {
                combined.push(dc);
              }
            });

            setTestCategories(combined);
          }
        }
      })
      .catch(() => {});
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

    // Determine query category param for backend
    let queryTestCat = undefined;
    if (selectedCategory && selectedCategory !== 'all') {
      const catObj = testCategories.find(
        (c) => c.slug === selectedCategory || c.id === selectedCategory || c.name.toLowerCase() === selectedCategory.toLowerCase()
      );
      if (catObj) {
        if (catObj.slug === 'radiology-mri') queryTestCat = 'radiology,mri,ct-scan,imaging';
        else if (catObj.slug === 'cardiology-ecg') queryTestCat = 'cardiac,ecg';
        else if (catObj.slug === 'pathology-blood') queryTestCat = 'pathology,haematology,blood';
        else if (catObj.slug === 'ultrasonography') queryTestCat = 'usg,ultrasonography';
        else queryTestCat = catObj.slug || catObj.name;
      } else {
        queryTestCat = selectedCategory;
      }
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
      .catch(() => {
        if (isMounted) {
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
    setDivision('Dhaka Division');
    setDistrict('Dhaka District');
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
    // Collect all tests from backend centers or fallback catalog
    const testMap = new Map();

    // 1. Seed with curated Stitch featured tests
    STITCH_FEATURED_TESTS.forEach((t) => {
      testMap.set(t.name.toLowerCase(), {
        ...t,
        offerings: [...t.offerings],
      });
    });

    // 2. Ingest real database tests from fetched centers
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
            // Avoid duplicate center offering
            if (!existing.offerings.some((o) => o.facility_name === offeringItem.facility_name)) {
              existing.offerings.push(offeringItem);
            }
          } else {
            testMap.set(key, {
              id: tDetails.id || `test-${tName.replace(/\s+/g, '-').toLowerCase()}`,
              name: tName,
              category_id: tDetails.category_id || tDetails.category?.id || '',
              category_name: tDetails.category_name || tDetails.category?.name || 'Pathology & Lab',
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

    // Canonical Stitch featured tests
    const stitchKeys = [
      'complete blood count (cbc) with esr',
      'mri of brain (plain & contrast - 1.5t / 3.0t)',
      'lipid profile (cholesterol, hdl, ldl, triglycerides)',
      'whole abdomen ultrasonography (usg)',
    ];

    // Determine if we're on the default landing state (Dhaka / all tests showcase)
    const isDefaultView = !searchKeyword.trim() && selectedCategory === 'all' && (cleanDist === 'dhaka' || isAllDist) && fulfillment === 'all' && ownership === 'all' && sortBy === 'price_asc';

    if (isDefaultView) {
      // In default showcase view matching Stitch, return the 4 featured tests with all offerings intact, followed by any additional tests
      const top4 = STITCH_FEATURED_TESTS.map((t) => ({
        ...t,
        offerings: [...t.offerings],
      }));

      // Filter out duplicate occurrences of top 4 from remaining tests
      const otherTests = list.filter((t) => {
        const key = t.name.toLowerCase();
        return !stitchKeys.some((sk) => key === sk || (key.includes('cbc') && sk.includes('cbc')));
      });

      return [...top4, ...otherTests];
    }

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

    // Filter 2: Category (Test Types)
    if (selectedCategory && selectedCategory !== 'all') {
      const selCatObj = testCategories.find(
        (c) => c.slug === selectedCategory || c.id === selectedCategory || (c.name || '').toLowerCase() === selectedCategory.toLowerCase()
      );
      const catSlug = (selCatObj?.slug || selectedCategory).toLowerCase();
      const catName = (selCatObj?.name || '').toLowerCase();
      const catId = selCatObj?.id;

      // Extract search tokens for the category
      const keywords = new Set();
      if (catSlug) {
        catSlug.split(/[-_\s]+/).forEach((k) => k.length > 2 && keywords.add(k));
      }
      if (catName) {
        catName.split(/[-_\s&/()]+/).forEach((k) => k.length > 2 && keywords.add(k));
      }
      // Add domain synonyms and related keywords
      if (catSlug.includes('radiology') || catSlug.includes('mri')) {
        keywords.add('radiology');
        keywords.add('mri');
        keywords.add('imaging');
        keywords.add('ct');
        keywords.add('scan');
      }
      if (catSlug.includes('ultrasound') || catSlug.includes('usg') || catSlug.includes('ultrasonography')) {
        keywords.add('usg');
        keywords.add('ultrasound');
        keywords.add('ultrasonography');
        keywords.add('abdomen');
      }
      if (catSlug.includes('biochemistry')) {
        keywords.add('biochemistry');
        keywords.add('lipid');
        keywords.add('cholesterol');
        keywords.add('creatinine');
        keywords.add('glucose');
      }
      if (catSlug.includes('pathology') || catSlug.includes('blood') || catSlug.includes('haematology')) {
        keywords.add('pathology');
        keywords.add('blood');
        keywords.add('haematology');
        keywords.add('cbc');
        keywords.add('esr');
      }
      if (catSlug.includes('cardio') || catSlug.includes('ecg')) {
        keywords.add('cardio');
        keywords.add('ecg');
        keywords.add('cardiac');
        keywords.add('heart');
      }

      list = list.filter((t) => {
        if (catId && t.category_id && t.category_id === catId) return true;
        const cName = (t.category_name || '').toLowerCase();
        const cSlug = (t.category_slug || '').toLowerCase();
        const tName = (t.name || '').toLowerCase();

        // Exact slug or name match
        if (cSlug && (cSlug === catSlug || cSlug.includes(catSlug) || catSlug.includes(cSlug))) return true;
        if (catName && (cName.includes(catName) || catName.includes(cName))) return true;

        // Keyword overlap
        for (const kw of keywords) {
          if (cName.includes(kw) || cSlug.includes(kw) || tName.includes(kw)) {
            return true;
          }
        }
        return false;
      });
    }

    // Filter 3: Location (Division, District, Area)
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

    // Filter 4: Fulfillment (Home Pickup vs Center Visit Only)
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

    // Sort By: strictly price_asc (Low to High) or price_desc (High to Low)
    if (sortBy === 'price_desc') {
      list.sort((a, b) => {
        const pA = Math.max(...a.offerings.map((o) => Number(o.calculated_price || o.price || 0)));
        const pB = Math.max(...b.offerings.map((o) => Number(o.calculated_price || o.price || 0)));
        return pB - pA;
      });
    } else {
      // Default: price_asc
      list.sort((a, b) => {
        const pA = Math.min(...a.offerings.map((o) => Number(o.calculated_price || o.price || 0)));
        const pB = Math.min(...b.offerings.map((o) => Number(o.calculated_price || o.price || 0)));
        return pA - pB;
      });
    }

    return list;
  }, [diagnosticCenters, searchKeyword, selectedCategory, division, district, area, fulfillment, ownership, sortBy, testCategories]);

  // Check if current view is the default Stitch landing showcase
  const cleanDist = (district || '').replace(/\s*District$/i, '').trim().toLowerCase();
  const isAllDist = !cleanDist || cleanDist === 'all districts' || cleanDist === 'all';
  const isDefaultLanding = !searchKeyword.trim() && selectedCategory === 'all' && (cleanDist === 'dhaka' || isAllDist);

  // Pagination calculations - 4 cards per page matching Stitch layout
  const pageSize = 4;
  const totalPages = Math.max(1, Math.ceil(processedTests.length / pageSize));
  const paginatedTests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedTests.slice(start, start + pageSize);
  }, [processedTests, currentPage, pageSize]);

  // Handle Book Action from Test Card Table
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

  // Handle Book Home Collection from Promo Banner
  const handleBookHomeCollection = () => {
    // Select home sample pickup fulfillment filter
    setFulfillment('home');
    setCurrentPage(1);
    // Smooth scroll down to test list
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const handleViewGuidelines = () => {
    alert('Doorstep Sample Collection Guidelines:\n1. Keep relevant prescriptions ready.\n2. Observe fasting requirements (10-12 hours for Lipid Profile, Fasting Sugar).\n3. Certified phlebotomists arrive with sealed vacutainer kits.');
  };

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
          {/* LEFT SIDEBAR: Clinical Filters */}
          <div className="lg:col-span-3">
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
            />
          </div>

          {/* RIGHT TEST CATALOG & COMPARISON CARDS */}
          <section className="lg:col-span-9 space-y-6">
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
