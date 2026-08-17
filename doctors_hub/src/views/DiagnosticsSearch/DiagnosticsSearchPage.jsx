import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { 
  FlaskConical, Clock, ArrowLeft, Filter, Search, Building2, ShieldCheck, 
  MapPin, CheckCircle, Home, FileText, ChevronRight, ChevronDown, Tag, Stethoscope,
  Heart, Brain, Dna, Activity, Droplet, Sparkles, X, ChevronUp
} from 'lucide-react';
import { DIVISIONS, findDivisionForDistrict } from '../../data/constants';
import { api, ensureArray, isPageReload, getIsInitialLoad } from '../../services/api';
import Pagination from '../../components/Pagination';
import CascadingLocationFilter from '../../components/CascadingLocationFilter';



// Fallback Test Categories
const FALLBACK_TEST_CATEGORIES = [
  { id: 'cardiac-tests', name: 'Cardiac Tests', slug: 'cardiac-tests', icon: 'Heart', description: 'ECG, 2D Echo, Doppler Echo, TMT, Holter & cardiac profiling', count: 9 },
  { id: 'hematology', name: 'Hematology & Blood', slug: 'hematology', icon: 'Droplet', description: 'CBC, ESR, Blood Grouping, PBF & routine blood pathology', count: 12 },
  { id: 'biochemistry', name: 'Biochemistry & LFT/KFT', slug: 'biochemistry', icon: 'Activity', description: 'Lipid Profile, Liver Function, Kidney Function, HbA1c & Sugar', count: 14 },
  { id: 'radiology-imaging', name: 'Radiology & X-Ray', slug: 'radiology-imaging', icon: 'FileText', description: 'Digital X-Ray, Chest X-Ray, Bone Densitometry & DEXA scans', count: 8 },
  { id: 'ultrasound-usg', name: 'Ultrasound / USG', slug: 'ultrasound-usg', icon: 'Sparkles', description: '4D Pregnancy USG, Whole Abdomen, Pelvic & Doppler Ultrasound', count: 7 },
  { id: 'ct-scan', name: 'CT Scan Body Imaging', slug: 'ct-scan', icon: 'Brain', description: 'High-speed Multi-Slice CT Brain, Chest, Abdomen & HRCT Scans', count: 6 },
  { id: 'mri', name: 'MRI Diagnostics', slug: 'mri', icon: 'Brain', description: '1.5T & 3.0T High-Field Brain, Spine & Musculoskeletal MRI', count: 6 },
  { id: 'neuro-tests', name: 'Neuro Diagnostics', slug: 'neuro-tests', icon: 'Brain', description: 'EEG, EMG, NCS, VEP & comprehensive neurological testing', count: 7 },
  { id: 'genetic-molecular', name: 'Genetic & Molecular', slug: 'genetic-molecular', icon: 'Dna', description: 'PCR tests, DNA sequencing, HPV & advanced molecular diagnostics', count: 6 },
  { id: 'endoscopy-colonoscopy', name: 'Endoscopy & Colonoscopy', slug: 'endoscopy-colonoscopy', icon: 'Stethoscope', description: 'Upper GI Endoscopy, Colonoscopy, Biopsy & Histopathology', count: 7 },
  { id: 'serology', name: 'Serology & Immunity', slug: 'serology', icon: 'ShieldCheck', description: 'Dengue NS1, Hepatitis B/C, HIV, Widal & infectious viral panels', count: 9 },
  { id: 'microbiology', name: 'Microbiology & Culture', slug: 'microbiology', icon: 'FlaskConical', description: 'Urine R/M/E, Stool R/E, Blood Culture & Antibiotic Sensitivity', count: 6 },
];

// Fallback Diagnostic Center Categories
const FALLBACK_CENTER_CATEGORIES = [
  { id: 'multi-specialty-general-diagnostic-center', name: 'Multi-Specialty / General Lab', slug: 'multi-specialty-general-diagnostic-center', count: 52 },
  { id: 'pathology-lab-focused', name: 'Pathology Lab Focused', slug: 'pathology-lab-focused', count: 45 },
  { id: 'imaging-focused-radiology-ct-mri-', name: 'Imaging Hub (X-Ray, CT, MRI)', slug: 'imaging-focused-radiology-ct-mri-', count: 38 },
  { id: 'cardiac-diagnostics-focused', name: 'Cardiac Diagnostics Focused', slug: 'cardiac-diagnostics-focused', count: 28 },
  { id: 'neuro-diagnostics-focused', name: 'Neuro Diagnostics Focused', slug: 'neuro-diagnostics-focused', count: 20 },
  { id: 'genetic-molecular-testing-focused', name: 'Genetic & Molecular Testing', slug: 'genetic-molecular-testing-focused', count: 18 },
  { id: 'government-diagnostic-center', name: 'Government Diagnostic Center', slug: 'government-diagnostic-center', count: 15 },
  { id: 'private-independent-', name: 'Private / Independent Chain', slug: 'private-independent-', count: 35 },
];

// Fallback Verified Diagnostic Centers with Comprehensive Tests (including Cardiac Tests)
const FALLBACK_DIAGNOSTIC_CENTERS = [
  {
    id: 'center-popular-panthapath',
    name: 'Popular Diagnostic Centre',
    branch: 'Panthapath Branch',
    address: 'House 16, Road 2, Dhanmondi / Panthapath, Dhaka',
    district: 'Dhaka',
    city: 'Dhaka',
    open_timing: '07:00 AM - 11:00 PM',
    is_verified: true,
    category: { name: 'Multi-Specialty / General Diagnostic Center' },
    categories: ['Multi-Specialty', 'Cardiac Diagnostics Focused', 'Pathology Lab Focused'],
    offered_tests: [
      {
        id: 'pop-t1',
        test_details: { id: 'test-61', name: 'ECG (12-Lead Resting)', category_name: 'Cardiac Tests', category_slug: 'cardiac-tests', description: 'Complete 12-lead resting electrocardiogram with cardiologist interpretation' },
        price: 600,
        original_price: 800,
        report_time: '1 Hour',
        home_sample_collection: false,
      },
      {
        id: 'pop-t2',
        test_details: { id: 'test-62', name: '2D Echocardiography with Color Doppler', category_name: 'Cardiac Tests', category_slug: 'cardiac-tests', description: 'Advanced color Doppler ultrasound assessment of heart chambers and valves' },
        price: 3200,
        original_price: 3800,
        report_time: '2 Hours',
        home_sample_collection: false,
      },
      {
        id: 'pop-t3',
        test_details: { id: 'test-65', name: 'TMT (Treadmill Stress Test / ETT)', category_name: 'Cardiac Tests', category_slug: 'cardiac-tests', description: 'Exercise cardiac stress test for ischemic heart disease and angina diagnosis' },
        price: 3500,
        original_price: 4200,
        report_time: '3 Hours',
        home_sample_collection: false,
      },
      {
        id: 'pop-t4',
        test_details: { id: 'test-66', name: '24-Hour Holter ECG Monitoring', category_name: 'Cardiac Tests', category_slug: 'cardiac-tests', description: 'Continuous 24-hour ambulatory cardiac rhythm monitoring for arrhythmia' },
        price: 4500,
        original_price: 5200,
        report_time: '24 Hours',
        home_sample_collection: false,
      },
      {
        id: 'pop-t5',
        test_details: { id: 'test-67', name: 'Cardiac CT / Calcium Scoring', category_name: 'Cardiac Tests', category_slug: 'cardiac-tests', description: 'Non-invasive 128-slice CT coronary calcium scoring for plaque evaluation' },
        price: 8500,
        original_price: 9800,
        report_time: '6 Hours',
        home_sample_collection: false,
      },
      {
        id: 'pop-t6',
        test_details: { id: 'test-1', name: 'Complete Blood Count (CBC with ESR)', category_name: 'Hematology', category_slug: 'hematology', description: 'Automated 5-part differential blood count and hemoglobin test' },
        price: 500,
        original_price: 650,
        report_time: '4 Hours',
        home_sample_collection: true,
      },
      {
        id: 'pop-t7',
        test_details: { id: 'test-2', name: 'Lipid Profile (Cholesterol, HDL, LDL, Triglycerides)', category_name: 'Biochemistry', category_slug: 'biochemistry', description: 'Complete fasting blood lipid profile for cardiovascular risk assessment' },
        price: 1200,
        original_price: 1500,
        report_time: '5 Hours',
        home_sample_collection: true,
      },
      {
        id: 'pop-t8',
        test_details: { id: 'test-3', name: '1.5T MRI Brain with Contrast', category_name: 'MRI', category_slug: 'mri', description: 'High-resolution magnetic resonance imaging of brain parenchyma and vessels' },
        price: 7500,
        original_price: 9000,
        report_time: '12 Hours',
        home_sample_collection: false,
      },
    ]
  },
  {
    id: 'center-ibn-sina-dhanmondi',
    name: 'Ibn Sina Diagnostic & Consultation Center',
    branch: 'Dhanmondi Branch',
    address: 'House 48, Road 9/A, Dhanmondi, Dhaka',
    district: 'Dhaka',
    city: 'Dhaka',
    open_timing: '07:30 AM - 10:30 PM',
    is_verified: true,
    category: { name: 'Cardiac Diagnostics Focused' },
    categories: ['Cardiac Diagnostics Focused', 'Multi-Specialty', 'Corporate Chain'],
    offered_tests: [
      {
        id: 'ibn-t1',
        test_details: { id: 'test-61', name: 'ECG (Resting 12-Lead)', category_name: 'Cardiac Tests', category_slug: 'cardiac-tests', description: 'Standard electrocardiogram recording heart rate and electrical conduction' },
        price: 550,
        original_price: 700,
        report_time: '1 Hour',
        home_sample_collection: false,
      },
      {
        id: 'ibn-t2',
        test_details: { id: 'test-62', name: '2D Echo & Color Doppler', category_name: 'Cardiac Tests', category_slug: 'cardiac-tests', description: 'Transthoracic echocardiogram with ejection fraction assessment' },
        price: 3000,
        original_price: 3600,
        report_time: '2 Hours',
        home_sample_collection: false,
      },
      {
        id: 'ibn-t3',
        test_details: { id: 'test-64', name: 'Stress Echocardiography (Dobutamine)', category_name: 'Cardiac Tests', category_slug: 'cardiac-tests', description: 'Pharmacological stress echocardiogram for myocardial viability' },
        price: 4800,
        original_price: 5500,
        report_time: '4 Hours',
        home_sample_collection: false,
      },
      {
        id: 'ibn-t4',
        test_details: { id: 'test-68', name: 'Ambulatory Blood Pressure Monitoring (ABPM 24-hr)', category_name: 'Cardiac Tests', category_slug: 'cardiac-tests', description: '24-hour continuous automated blood pressure monitoring for hypertension' },
        price: 2800,
        original_price: 3400,
        report_time: '24 Hours',
        home_sample_collection: false,
      },
      {
        id: 'ibn-t5',
        test_details: { id: 'test-69', name: 'Serum Troponin-I (High Sensitivity)', category_name: 'Cardiac Tests', category_slug: 'cardiac-tests', description: 'Rapid quantitative cardiac biomarker for acute coronary syndrome and heart attack' },
        price: 1600,
        original_price: 2000,
        report_time: '2 Hours',
        home_sample_collection: true,
      },
      {
        id: 'ibn-t6',
        test_details: { id: 'test-4', name: 'Digital Chest X-Ray (P/A View)', category_name: 'Radiology & Imaging', category_slug: 'radiology-imaging', description: 'High-definition digital radiography of chest, lungs & heart outline' },
        price: 700,
        original_price: 900,
        report_time: '2 Hours',
        home_sample_collection: false,
      },
    ]
  },
  {
    id: 'center-labaid-diagnostic-gulshan',
    name: 'Labaid Diagnostic & Cardiac Centre',
    branch: 'Gulshan Branch',
    address: 'House 13/A, Road 35, Gulshan-2, Dhaka',
    district: 'Dhaka',
    city: 'Dhaka',
    open_timing: '24 Hours Open',
    is_verified: true,
    category: { name: 'Cardiac Diagnostics Focused' },
    categories: ['Cardiac Diagnostics Focused', 'Hospital-Affiliated Lab', 'Multi-Specialty'],
    offered_tests: [
      {
        id: 'lab-t1',
        test_details: { id: 'test-61', name: 'Digital 12-Channel ECG', category_name: 'Cardiac Tests', category_slug: 'cardiac-tests', description: 'Computerized 12-channel electrocardiography with instant digital reporting' },
        price: 650,
        original_price: 850,
        report_time: '30 Mins',
        home_sample_collection: false,
      },
      {
        id: 'lab-t2',
        test_details: { id: 'test-62', name: 'Trans-Thoracic 4D Echocardiography', category_name: 'Cardiac Tests', category_slug: 'cardiac-tests', description: 'State-of-the-art 4D ultrasound echocardiogram by consultant cardiologists' },
        price: 3600,
        original_price: 4400,
        report_time: '2 Hours',
        home_sample_collection: false,
      },
      {
        id: 'lab-t3',
        test_details: { id: 'test-65', name: 'Exercise Tolerance Test (ETT / TMT)', category_name: 'Cardiac Tests', category_slug: 'cardiac-tests', description: 'Full computer-guided treadmill exercise ECG evaluation' },
        price: 3800,
        original_price: 4500,
        report_time: '3 Hours',
        home_sample_collection: false,
      },
      {
        id: 'lab-t4',
        test_details: { id: 'test-66', name: '7-Day Extended Holter Monitor', category_name: 'Cardiac Tests', category_slug: 'cardiac-tests', description: 'Extended multi-day ambulatory ECG patch monitoring for transient arrhythmias' },
        price: 7000,
        original_price: 8500,
        report_time: '48 Hours',
        home_sample_collection: false,
      },
      {
        id: 'lab-t5',
        test_details: { id: 'test-67', name: 'CT Coronary Angiography (512-Slice)', category_name: 'Cardiac Tests', category_slug: 'cardiac-tests', description: 'Ultra high-definition non-invasive CT coronary artery angiography' },
        price: 16500,
        original_price: 19000,
        report_time: '8 Hours',
        home_sample_collection: false,
      },
      {
        id: 'lab-t6',
        test_details: { id: 'test-5', name: 'Comprehensive Lipid & Cardiac Risk Profile', category_name: 'Biochemistry', category_slug: 'biochemistry', description: 'Lipid panel, hs-CRP, Homocysteine & HbA1c combined cardiovascular profile' },
        price: 2800,
        original_price: 3500,
        report_time: '6 Hours',
        home_sample_collection: true,
      },
    ]
  },
  {
    id: 'center-medinova-medical',
    name: 'Medinova Medical Services',
    branch: 'Dhanmondi Branch',
    address: 'House 71/A, Road 5/A, Dhanmondi, Dhaka',
    district: 'Dhaka',
    city: 'Dhaka',
    open_timing: '08:00 AM - 10:00 PM',
    is_verified: true,
    category: { name: 'Pathology Lab Focused' },
    categories: ['Pathology Lab Focused', 'Multi-Specialty'],
    offered_tests: [
      {
        id: 'med-t1',
        test_details: { id: 'test-61', name: 'ECG (Electrocardiogram)', category_name: 'Cardiac Tests', category_slug: 'cardiac-tests', description: 'Routine resting ECG test with automated rhythm analysis' },
        price: 500,
        original_price: 650,
        report_time: '1 Hour',
        home_sample_collection: false,
      },
      {
        id: 'med-t2',
        test_details: { id: 'test-62', name: '2D Echocardiogram', category_name: 'Cardiac Tests', category_slug: 'cardiac-tests', description: 'Cardiac valve and chamber ultrasonography' },
        price: 2900,
        original_price: 3500,
        report_time: '2 Hours',
        home_sample_collection: false,
      },
      {
        id: 'med-t3',
        test_details: { id: 'test-6', name: 'Liver Function Test (LFT Profile)', category_name: 'Biochemistry', category_slug: 'biochemistry', description: 'SGPT, SGOT, Bilirubin, Alkaline Phosphatase & Total Protein' },
        price: 1100,
        original_price: 1400,
        report_time: '4 Hours',
        home_sample_collection: true,
      },
      {
        id: 'med-t4',
        test_details: { id: 'test-7', name: '4D Pregnancy Ultrasound with Doppler', category_name: 'Ultrasound / USG', category_slug: 'ultrasound-usg', description: 'Real-time 4D fetal growth, anomaly and placental blood flow study' },
        price: 2400,
        original_price: 3000,
        report_time: '1 Hour',
        home_sample_collection: false,
      },
    ]
  },
  {
    id: 'center-square-hospital-lab',
    name: 'Square Hospital Diagnostic & Lab Unit',
    branch: 'Panthapath',
    address: '18/F, Bir Uttam Qazi Nuruzzaman Sarak, West Panthapath, Dhaka',
    district: 'Dhaka',
    city: 'Dhaka',
    open_timing: '24 Hours Open',
    is_verified: true,
    category: { name: 'Hospital-Affiliated Lab' },
    categories: ['Hospital-Affiliated Lab', 'Cardiac Diagnostics Focused', 'Multi-Specialty'],
    offered_tests: [
      {
        id: 'sq-t1',
        test_details: { id: 'test-61', name: '12-Lead Digital ECG', category_name: 'Cardiac Tests', category_slug: 'cardiac-tests', description: 'High precision electrocardiogram with instant physician review' },
        price: 700,
        original_price: 900,
        report_time: '30 Mins',
        home_sample_collection: false,
      },
      {
        id: 'sq-t2',
        test_details: { id: 'test-62', name: 'Echocardiogram with Strain Imaging', category_name: 'Cardiac Tests', category_slug: 'cardiac-tests', description: 'Advanced myocardial speckle tracking echocardiogram' },
        price: 4200,
        original_price: 5000,
        report_time: '2 Hours',
        home_sample_collection: false,
      },
      {
        id: 'sq-t3',
        test_details: { id: 'test-65', name: 'Treadmill Stress Test (TMT)', category_name: 'Cardiac Tests', category_slug: 'cardiac-tests', description: 'Monitored cardiovascular exercise tolerance test' },
        price: 4000,
        original_price: 4800,
        report_time: '2 Hours',
        home_sample_collection: false,
      },
      {
        id: 'sq-t4',
        test_details: { id: 'test-8', name: '3.0 Tesla MRI Whole Spine', category_name: 'MRI', category_slug: 'mri', description: 'High-resolution magnetic resonance imaging of cervical, thoracic & lumbar spine' },
        price: 11000,
        original_price: 13000,
        report_time: '12 Hours',
        home_sample_collection: false,
      },
      {
        id: 'sq-t5',
        test_details: { id: 'test-9', name: 'Digital EEG (Electroencephalogram)', category_name: 'Neuro Diagnostics', category_slug: 'neuro-tests', description: '32-channel digital electroencephalography for seizure and neurological profiling' },
        price: 3200,
        original_price: 4000,
        report_time: '6 Hours',
        home_sample_collection: false,
      },
    ]
  },
];

// Helper to check if an offered test strictly matches the selected test category
const filterOfferingByCategory = (offering, selectedCat, testCats = []) => {
  if (!selectedCat || selectedCat === 'all') return true;

  const needle = String(selectedCat).toLowerCase().trim();

  // Find target category object if present in test categories list
  const catObj = (testCats || []).find(c => {
    if (!c) return false;
    const cId = String(c.id || '').toLowerCase();
    const cSlug = String(c.slug || '').toLowerCase();
    const cName = String(c.name || '').toLowerCase();
    return (
      cId === needle ||
      cSlug === needle ||
      cName === needle ||
      (needle.length >= 4 && (cId.includes(needle) || cSlug.includes(needle) || cName.includes(needle) || needle.includes(cSlug) || needle.includes(cName)))
    );
  });

  const targetId = catObj ? String(catObj.id || '').toLowerCase() : needle;
  const targetSlug = catObj ? String(catObj.slug || '').toLowerCase() : needle;
  const targetName = catObj ? String(catObj.name || '').toLowerCase() : needle;

  const testDetails = offering.test_details || offering.testDetails || offering.test || {};
  
  const offeringCatId = String(testDetails.category_id || testDetails.category || offering.category_id || offering.category || '').toLowerCase();
  const offeringCatName = String(testDetails.category_name || testDetails.category || offering.category_name || offering.category || '').toLowerCase();
  const offeringCatSlug = String(testDetails.category_slug || testDetails.categoryGroup || offering.category_slug || offering.categoryGroup || '').toLowerCase();

  // Normalization helper (lowercase alphanumeric without trailing plural 's')
  const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '').replace(/s$/, '');

  // 1. Direct ID match
  if (offeringCatId && targetId && offeringCatId === targetId) return true;

  // 2. Direct Slug match
  if (offeringCatSlug && targetSlug && norm(offeringCatSlug) === norm(targetSlug)) return true;

  // 3. Category Name match (exact or plural variation, e.g. "Cardiac Tests" vs "Cardiac Test")
  if (offeringCatName && targetName) {
    const nOff = norm(offeringCatName);
    const nTarget = norm(targetName);
    if (nOff === nTarget) return true;
    if (nOff.length >= 4 && nTarget.length >= 4 && (nOff.startsWith(nTarget) || nTarget.startsWith(nOff))) return true;
  }

  // 4. Cross match (Name vs Slug)
  if (offeringCatSlug && targetName && norm(offeringCatSlug) === norm(targetName)) return true;
  if (offeringCatName && targetSlug && norm(offeringCatName) === norm(targetSlug)) return true;

  return false;
};


export default function DiagnosticsSearchPage({
  initialTest = '',
  onBookLabTest,
  onNavigateHome
}) {
  const [diagnosticCenters, setDiagnosticCenters] = useState([]);
  const [centerCategories, setCenterCategories] = useState([]);
  const [testCategories, setTestCategories] = useState([]);
  const [expandedCenterIds, setExpandedCenterIds] = useState(new Set());

  // URL-serialized state (filters)
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [isRefresh] = useState(() => getIsInitialLoad() && isPageReload());

  const getParam = (key, fallback) => {
    const v = searchParams.get(key);
    return v === null || v === undefined ? fallback : v;
  };

  // Filter states
  const [division, setDivision] = useState(() => {
    if (isRefresh) return 'All Bangladesh';
    const urlDiv = getParam('division', '');
    if (urlDiv) return urlDiv;
    const urlLoc = getParam('loc', 'All Bangladesh');
    if (DIVISIONS.includes(urlLoc)) return urlLoc;
    const found = findDivisionForDistrict(urlLoc);
    if (found) return found;
    return 'All Bangladesh';
  });

  const [district, setDistrict] = useState(() => {
    if (isRefresh) return 'All Districts';
    const urlDist = getParam('district', '');
    if (urlDist) return urlDist;
    const urlLoc = getParam('loc', '');
    if (urlLoc && !DIVISIONS.includes(urlLoc) && urlLoc !== 'All Bangladesh') return urlLoc;
    return 'All Districts';
  });

  const [area, setArea] = useState(() => {
    if (isRefresh) return 'All Areas';
    return getParam('area', 'All Areas');
  });

  const [selectedTestCategory, setSelectedTestCategory] = useState(() => {
    if (isRefresh) return 'all';
    const urlCat = getParam('testcat', '');
    if (urlCat) return urlCat;
    if (initialTest && initialTest !== 'diagnostics' && initialTest !== 'diagnostics-search') {
      return initialTest;
    }
    return 'all';
  });

  const [selectedCenterCategory, setSelectedCenterCategory] = useState(() => {
    if (isRefresh) return 'all';
    const urlCat = getParam('cat', '') || getParam('spec', '') || getParam('owner', '');
    if (urlCat) return urlCat;
    return 'all';
  });

  const [searchKeyword, setSearchKeyword] = useState(() => {
    if (isRefresh) return '';
    const urlQ = getParam('q', '');
    if (urlQ) return urlQ;
    return '';
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [totalPages, setTotalPages] = useState(1);

  // Sync state when URL searchParams or props change
  useEffect(() => {
    if (isRefresh) return;
    const urlTestCat = searchParams.get('testcat');
    const urlCat = searchParams.get('cat') || searchParams.get('spec') || searchParams.get('owner');
    const urlDiv = searchParams.get('division');
    const urlDist = searchParams.get('district');
    const urlLoc = searchParams.get('loc');
    const urlArea = searchParams.get('area');
    const urlQ = searchParams.get('q');

    if (urlTestCat !== null) {
      setSelectedTestCategory(urlTestCat || 'all');
    } else if (initialTest && initialTest !== 'diagnostics' && initialTest !== 'diagnostics-search') {
      setSelectedTestCategory(initialTest);
    }
    
    if (urlCat !== null) {
      setSelectedCenterCategory(urlCat || 'all');
    }

    if (urlDiv) {
      setDivision(urlDiv);
    } else if (urlLoc) {
      if (DIVISIONS.includes(urlLoc)) setDivision(urlLoc);
      else {
        const found = findDivisionForDistrict(urlLoc);
        if (found) setDivision(found);
        else setDivision('All Bangladesh');
      }
    } else {
      setDivision('All Bangladesh');
    }

    if (urlDist) {
      setDistrict(urlDist);
    } else if (urlLoc && !DIVISIONS.includes(urlLoc) && urlLoc !== 'All Bangladesh') {
      setDistrict(urlLoc);
    } else {
      setDistrict('All Districts');
    }

    if (urlArea !== null) setArea(urlArea || 'All Areas');
    if (urlQ !== null) setSearchKeyword(urlQ || '');
  }, [searchParams, initialTest, isRefresh]);


  // Fetch reference metadata and real-time facets
  useEffect(() => {
    let isMounted = true;
    api.getSearchFacets({ 
      division: division !== 'All Bangladesh' ? division : undefined, 
      district: district !== 'All Districts' ? district : undefined, 
      area: area !== 'All Areas' ? area : undefined 
    })
      .then((facets) => {
        if (isMounted && facets) {
          if (facets.diagnostic_center_categories) setCenterCategories(ensureArray(facets.diagnostic_center_categories));
          if (facets.test_categories) setTestCategories(ensureArray(facets.test_categories));
        }
      })
      .catch(() => {
        api.getSearchMetadata()
          .then((meta) => {
            if (isMounted && meta) {
              if (meta.diagnostic_center_categories) setCenterCategories(ensureArray(meta.diagnostic_center_categories));
              if (meta.test_categories) setTestCategories(ensureArray(meta.test_categories));
            }
          })
          .catch(() => {
            Promise.all([
              api.getDiagnosticCenterCategories().catch(() => []),
              api.getTestCategories().catch(() => []),
            ]).then(([dccats, tcats]) => {
              if (isMounted) {
                setCenterCategories(ensureArray(dccats, []));
                setTestCategories(ensureArray(tcats, []));
              }
            });
          });
      });
    return () => { isMounted = false; };
  }, [division, district, area]);

const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());

const resolveCenterCategoryName = (val, centerCats = []) => {
  if (!val || val === 'all') return 'All Categories';
  if (typeof val === 'object' && val !== null) {
    if (val.name) return val.name;
    if (val.title) return val.title;
    val = val.id || val.slug || '';
  }
  const clean = String(val).trim();
  
  // Find in center categories list by id, slug, or name
  const found = centerCats.find(c => 
    c && (
      String(c.id).toLowerCase() === clean.toLowerCase() ||
      String(c.slug || '').toLowerCase() === clean.toLowerCase() ||
      String(c.name || '').toLowerCase() === clean.toLowerCase()
    )
  );
  if (found && found.name) return found.name;

  // If it's a UUID and not directly found in centerCats, provide friendly label
  if (isUuid(clean)) {
    return 'Diagnostic Center';
  }

  // Format slug nicely (e.g. cardiac-diagnostics-focused -> Cardiac Diagnostics Focused)
  return clean
    .split(/[-_]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const resolveTestCategoryName = (val, testCats = []) => {
  if (!val || val === 'all') return 'All Test Categories';
  if (typeof val === 'object' && val !== null) {
    if (val.name) return val.name;
    val = val.id || val.slug || '';
  }
  const clean = String(val).trim();
  const found = testCats.find(c => 
    c && (
      String(c.id).toLowerCase() === clean.toLowerCase() ||
      String(c.slug || '').toLowerCase() === clean.toLowerCase() ||
      String(c.name || '').toLowerCase() === clean.toLowerCase()
    )
  );
  return clean
    .split(/[-_]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

  const displayTestCategories = testCategories.length > 0 ? testCategories : FALLBACK_TEST_CATEGORIES;
  const displayCenterCategories = centerCategories.length > 0 ? centerCategories : FALLBACK_CENTER_CATEGORIES;

  // Normalized active test category ID for the dropdown
  const normalizedTestCatValue = useMemo(() => {
    if (!selectedTestCategory || selectedTestCategory === 'all') return 'all';
    const needle = String(selectedTestCategory).toLowerCase();
    const found = displayTestCategories.find(c => 
      c && (
        String(c.id).toLowerCase() === needle ||
        String(c.slug || '').toLowerCase() === needle ||
        String(c.name || '').toLowerCase() === needle ||
        needle.includes(String(c.slug || '').toLowerCase()) ||
        String(c.name || '').toLowerCase().includes(needle)
      )
    );
    return found ? found.id : selectedTestCategory;
  }, [selectedTestCategory, displayTestCategories]);

  // Normalized active center category ID/name for dropdown
  const normalizedCenterCatValue = useMemo(() => {
    if (!selectedCenterCategory || selectedCenterCategory === 'all') return 'all';
    const needle = String(selectedCenterCategory).toLowerCase();
    const found = displayCenterCategories.find(c => 
      c && (
        String(c.id).toLowerCase() === needle ||
        String(c.slug || '').toLowerCase() === needle ||
        String(c.name || '').toLowerCase() === needle ||
        needle.includes(String(c.slug || '').toLowerCase()) ||
        String(c.name || '').toLowerCase().includes(needle)
      )
    );
    return found ? (found.id || found.slug || found.name) : selectedCenterCategory;
  }, [selectedCenterCategory, displayCenterCategories]);

  // Active Category Display Name for Header & Badges
  const activeTestCatObj = useMemo(() => {
    if (!selectedTestCategory || selectedTestCategory === 'all') return null;
    const needle = String(selectedTestCategory).toLowerCase();
    return displayTestCategories.find(c => 
      c && (
        String(c.id).toLowerCase() === needle ||
        String(c.slug || '').toLowerCase() === needle ||
        String(c.name || '').toLowerCase() === needle ||
        needle.includes(String(c.slug || '').toLowerCase()) ||
        String(c.name || '').toLowerCase().includes(needle)
      )
    );
  }, [selectedTestCategory, displayTestCategories]);

  // Fetch filtered Diagnostic Centers from backend
  useEffect(() => {
    let isMounted = true;

    const delay = searchKeyword.trim() ? 350 : 0;
    const timer = setTimeout(() => {
      api.getDiagnosticCenters({
        division: division !== 'All Bangladesh' ? division : undefined,
        district: district !== 'All Districts' ? district : undefined,
        area: area !== 'All Areas' ? area : undefined,
        testcat: selectedTestCategory !== 'all' ? selectedTestCategory : undefined,
        category: selectedCenterCategory !== 'all' ? selectedCenterCategory : undefined,
        search: searchKeyword.trim() || undefined,
        page: currentPage,
        page_size: pageSize
      })
        .then((data) => {
          if (isMounted) {
            const list = ensureArray(data, []);
            if (list.length > 0) {
              setDiagnosticCenters(list);
              if (data && typeof data === 'object' && data.count) {
                setTotalPages(Math.ceil(data.count / pageSize));
              } else {
                setTotalPages(1);
              }
            } else {
              // If backend returned empty or is offline, use rich fallback
              setDiagnosticCenters(FALLBACK_DIAGNOSTIC_CENTERS);
              setTotalPages(1);
            }
          }
        })
        .catch(() => {
          if (isMounted) {
            setDiagnosticCenters(FALLBACK_DIAGNOSTIC_CENTERS);
            setTotalPages(1);
          }
        });
    }, delay);

    return () => { isMounted = false; clearTimeout(timer); };
  }, [division, district, area, selectedTestCategory, selectedCenterCategory, searchKeyword, currentPage]);

  const handleResetFilters = () => {
    setSelectedTestCategory('all');
    setSelectedCenterCategory('all');
    setDivision('All Bangladesh');
    setDistrict('All Districts');
    setArea('All Areas');
    setSearchKeyword('');
  };

  // Serialize filters to URL query parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (division && division !== 'All Bangladesh') params.set('division', division);
    if (district && district !== 'All Districts') params.set('district', district);
    if (area && area !== 'All Areas') params.set('area', area);
    if (selectedTestCategory && selectedTestCategory !== 'all') params.set('testcat', selectedTestCategory);
    if (selectedCenterCategory && selectedCenterCategory !== 'all') params.set('cat', selectedCenterCategory);
    if (searchKeyword.trim()) params.set('q', searchKeyword.trim());

    const next = params.toString();
    if (next !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [division, district, area, selectedTestCategory, selectedCenterCategory, searchKeyword, searchParams, setSearchParams]);

  // Filter centers and compute matching tests
  const filteredCentersWithTests = useMemo(() => {
    const baseList = diagnosticCenters.length > 0 ? diagnosticCenters : FALLBACK_DIAGNOSTIC_CENTERS;

    return baseList.map(center => {
      // Filter center by Division
      if (division && division !== 'All Bangladesh') {
        const divLow = division.toLowerCase();
        const matchesDiv = String(center.division || '').toLowerCase().includes(divLow) ||
          String(center.district || '').toLowerCase().includes(divLow) ||
          String(center.city || '').toLowerCase().includes(divLow);
        if (!matchesDiv) return null;
      }

      // Filter center by District
      if (district && district !== 'All Districts') {
        const distLow = district.toLowerCase();
        const matchesDist = String(center.district || '').toLowerCase().includes(distLow) ||
          String(center.city || '').toLowerCase().includes(distLow);
        if (!matchesDist) return null;
      }

      // Filter center by Area
      if (area && area !== 'All Areas') {
        const areaLow = area.toLowerCase();
        const matchesArea = String(center.area || '').toLowerCase().includes(areaLow) ||
          String(center.branch || '').toLowerCase().includes(areaLow);
        if (!matchesArea) return null;
      }

      const allOffered = ensureArray(center.offered_tests || center.tests, []);
      
      // Compute matching tests for the active test category
      let matchingTests = allOffered;
      let isCategoryFiltered = false;

      if (selectedTestCategory && selectedTestCategory !== 'all') {
        isCategoryFiltered = true;
        matchingTests = allOffered.filter(offering => 
          filterOfferingByCategory(offering, selectedTestCategory, displayTestCategories)
        );
      }

      if (searchKeyword.trim()) {
        const q = searchKeyword.trim().toLowerCase();
        const centerMatches = 
          String(center.name || '').toLowerCase().includes(q) ||
          String(center.address || '').toLowerCase().includes(q) ||
          String(center.branch || '').toLowerCase().includes(q);

        if (!centerMatches) {
          matchingTests = matchingTests.filter(offering => {
            const testName = offering.test_details?.name || offering.test?.name || offering.name || '';
            const testDesc = offering.test_details?.description || offering.test?.description || '';
            const testCat = offering.test_details?.category_name || offering.test?.category_name || '';
            return (
              testName.toLowerCase().includes(q) ||
              testDesc.toLowerCase().includes(q) ||
              testCat.toLowerCase().includes(q)
            );
          });
        }
      }

      // If user is explicitly filtering by a specific test category or keyword,
      // and this center offers 0 matching tests, exclude the center entirely!
      if ((isCategoryFiltered || searchKeyword.trim()) && matchingTests.length === 0) {
        return null;
      }

      // Check center category match
      let centerCategoryMatches = true;
      if (selectedCenterCategory && selectedCenterCategory !== 'all') {
        const cCat = String(selectedCenterCategory).toLowerCase();
        const cats = [
          center.category?.name,
          center.category?.slug,
          center.category?.id,
          center.category,
          ...(Array.isArray(center.categories) ? center.categories.map(c => typeof c === 'object' ? c?.name : c) : [])
        ].filter(Boolean).map(c => String(c).toLowerCase());

        centerCategoryMatches = cats.some(c => c.includes(cCat) || cCat.includes(c));
      }

      if (!centerCategoryMatches) return null;

      return {
        ...center,
        matchingTests,
        allOffered,
        isCategoryFiltered,
        isCenterMatch: true
      };
    }).filter(Boolean);
  }, [diagnosticCenters, division, district, area, selectedTestCategory, selectedCenterCategory, searchKeyword, displayTestCategories]);


  // Toggle expanded other tests for a center
  const toggleExpandCenter = (centerId) => {
    setExpandedCenterIds(prev => {
      const next = new Set(prev);
      if (next.has(centerId)) next.delete(centerId);
      else next.add(centerId);
      return next;
    });
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      
      {/* HERO HEADER */}
      <div className="bg-slate-900 text-white py-12 px-4 sm:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3 border border-emerald-500/30">
                <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
                <span>Diagnostics & Lab Tests Search Portal</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                {activeTestCatObj ? `${activeTestCatObj.name} Diagnostics` : 'Diagnostics Search'}
              </h1>
              <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-2xl">
                {activeTestCatObj 
                  ? `Showing all verified diagnostic centers offering ${activeTestCatObj.name} (${activeTestCatObj.description || 'specialized testing'}). Compare pricing, turnaround times, and book online.`
                  : 'Browse verified diagnostic centers by test category (Cardiac, Blood, Imaging & more) and center specialization. Compare pricing and book home sample collection.'
                }
              </p>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700 text-xs flex items-center gap-3 shrink-0">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
              <div>
                <div className="font-extrabold text-white">{filteredCentersWithTests.length} Diagnostic Centers</div>
                <div className="text-slate-400">
                  {selectedTestCategory !== 'all' ? 'Offering Selected Tests' : 'Verified Labs & Centers'}
                </div>
              </div>
            </div>
          </div>

          {/* SEARCH & FILTER CONTROLS BAR */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-700/60">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-400" />
                <span>Diagnostic Center & Test Search Filters</span>
              </div>
              {(selectedCenterCategory !== 'all' || selectedTestCategory !== 'all' || division !== 'All Bangladesh' || district !== 'All Districts' || area !== 'All Areas' || searchKeyword) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              
              {/* 1. Test Category Filter */}
              <div>
                <label className="block text-[11px] font-bold text-cyan-400 mb-1 flex items-center gap-1">
                  <Heart className="w-3 h-3 text-cyan-400" />
                  <span>Test Category</span>
                </label>
                <select
                  value={normalizedTestCatValue}
                  onChange={(e) => setSelectedTestCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-cyan-500/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-bold cursor-pointer"
                >
                  <option value="all">All Test Categories</option>
                  {displayTestCategories.filter(c => c && c.id !== 'all').map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* 2. Diagnostic Center Category Filter */}
              <div>
                <label className="block text-[11px] font-bold text-teal-400 mb-1 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-teal-400" />
                  <span>Center Specialization</span>
                </label>
                <select
                  value={normalizedCenterCatValue}
                  onChange={(e) => setSelectedCenterCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-teal-500/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-teal-400 font-bold cursor-pointer"
                >
                  <option value="all">All Center Specializations</option>
                  {displayCenterCategories.filter(c => c && c.id !== 'all').map(cat => (
                    <option key={cat.id || cat.slug} value={cat.id || cat.slug || cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Cascading Location Filter (Division -> District -> Thana) */}
              <div className="sm:col-span-2 lg:col-span-1 xl:col-span-1">
                <CascadingLocationFilter
                  division={division}
                  district={district}
                  area={area}
                  onChange={({ division: d, district: dist, area: a }) => {
                    setDivision(d);
                    setDistrict(dist);
                    setArea(a);
                  }}
                  theme="dark"
                  accent="teal"
                  layout="inline"
                  showLabels={true}
                />
              </div>

              {/* 4. Search Keyword Filter */}
              <div className="relative">
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Search Keyword</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search center, test (e.g. ECG)..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 font-medium"
                  />
                </div>
              </div>

            </div>

            {/* ACTIVE FILTER PILLS */}
            {(selectedTestCategory !== 'all' || selectedCenterCategory !== 'all' || division !== 'All Bangladesh' || district !== 'All Districts' || area !== 'All Areas' || searchKeyword) && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-700/60 text-xs">
                <span className="text-slate-400 font-bold">Active Filters:</span>
                
                {selectedTestCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                    <span>Test Category: {activeTestCatObj?.name || resolveTestCategoryName(selectedTestCategory, displayTestCategories)}</span>
                    <button onClick={() => setSelectedTestCategory('all')} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
                  </span>
                )}

                {selectedCenterCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold">
                    <span>Center Type: {resolveCenterCategoryName(selectedCenterCategory, displayCenterCategories)}</span>
                    <button onClick={() => setSelectedCenterCategory('all')} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
                  </span>
                )}

                {division !== 'All Bangladesh' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                    <span>Division: {division}</span>
                    <button onClick={() => { setDivision('All Bangladesh'); setDistrict('All Districts'); setArea('All Areas'); }} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
                  </span>
                )}

                {district !== 'All Districts' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                    <span>District: {district}</span>
                    <button onClick={() => { setDistrict('All Districts'); setArea('All Areas'); }} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
                  </span>
                )}

                {area !== 'All Areas' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                    <span>Area: {area}</span>
                    <button onClick={() => setArea('All Areas')} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
                  </span>
                )}

                {searchKeyword && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-700 text-slate-200 border border-slate-600 font-bold">
                    <span>Query: "{searchKeyword}"</span>
                    <button onClick={() => setSearchKeyword('')} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
                  </span>
                )}
              </div>
            )}


          </div>

        </div>
      </div>

      {/* MAIN RESULTS CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-10">
        
        {/* Active Category Information Banner */}
        {activeTestCatObj && (
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200/90 rounded-2xl p-5 mb-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-emerald-800">
                  Filtered by Category
                </div>
                <h2 className="text-lg font-black text-slate-900">
                  Showing {activeTestCatObj.name} Across {filteredCentersWithTests.length} Diagnostic Centers
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  {activeTestCatObj.description || `Explore and book verified ${activeTestCatObj.name} with real-time center pricing.`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedTestCategory('all')}
              className="px-4 py-2 bg-white text-slate-700 hover:text-emerald-700 border border-slate-300 hover:border-emerald-400 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0"
            >
              Show All Test Categories
            </button>
          </div>
        )}

        {/* DIAGNOSTIC CENTERS LIST WITH THEIR TEST MENUS */}
        <div className="space-y-8">
          {filteredCentersWithTests.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 max-w-lg mx-auto shadow-sm space-y-4">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
              <div>
                <h3 className="text-lg font-bold text-slate-800">No Diagnostic Centers Found</h3>
                <p className="text-xs text-slate-500 mt-1">
                  No diagnostic centers matched your search for <strong>{activeTestCatObj?.name || resolveTestCategoryName(selectedTestCategory, displayTestCategories) || 'the current filter'}</strong> in {selectedLocation}.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Reset All Search Filters
              </button>
            </div>
          ) : (
            filteredCentersWithTests.map((center) => {
              const matchingTests = center.matchingTests || [];
              const displayTests = matchingTests;

              return (
                <div key={center.id} className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-md hover:shadow-lg transition-all space-y-5">
                  
                  {/* CENTER HEADER */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 shadow-xs">
                        <Building2 className="w-7 h-7 text-emerald-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded uppercase tracking-wider">
                            {center.district || center.city || "Diagnostic Center"}
                          </span>
                          {(center.categories || (center.category ? [center.category] : [])).map((cat, idx) => {
                            const catName = resolveCenterCategoryName(cat, displayCenterCategories);
                            if (!catName || isUuid(catName) || catName === 'All Categories') return null;
                            return (
                              <span key={idx} className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {catName}
                              </span>
                            );
                          })}
                        </div>
                        <h2 className="text-xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                          <span>{center.name} {center.branch ? `(${center.branch})` : ''}</span>
                          {center.is_verified && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
                        </h2>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{center.address}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{center.open_timing || "08:00 AM - 10:00 PM"}</span>
                      </span>
                      {center.phone && (
                        <span className="text-xs font-semibold text-slate-600">
                          📞 {center.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* OFFERED TESTS SECTION */}
                  <div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <FlaskConical className="w-4 h-4 text-emerald-600" />
                        <span>
                          {activeTestCatObj 
                            ? `Available ${activeTestCatObj.name} at ${center.name} (${displayTests.length}):`
                            : `Available Diagnostic Tests & Pricing at ${center.name} (${displayTests.length}):`
                          }
                        </span>
                      </h4>
                    </div>


                    {displayTests.length === 0 ? (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-500 italic">
                        No matching test packages listed for this center yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {displayTests.map((offering) => {
                          const testName = offering.test_details?.name || offering.test_name || offering.name || "Diagnostic Test Profile";
                          const catName = offering.test_details?.category_name || offering.category_name || offering.test_details?.category || "Diagnostic";
                          const testDesc = offering.test_details?.description || offering.description || "Comprehensive clinical testing with verified lab reports";
                          const isHome = offering.home_sample_collection;

                          return (
                            <div key={offering.id || testName} className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/90 flex flex-col justify-between space-y-3 hover:bg-emerald-50/30 hover:border-emerald-300 transition-all shadow-2xs hover:shadow-xs">
                              <div>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded uppercase tracking-wider">
                                    {catName}
                                  </span>
                                  {isHome && (
                                    <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded flex items-center gap-0.5">
                                      <span>Home Pickup</span>
                                    </span>
                                  )}
                                </div>

                                <div className="font-extrabold text-slate-900 text-xs mt-1.5 leading-snug">
                                  {testName}
                                </div>
                                <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                                  {testDesc}
                                </p>
                                
                                <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>Report Delivery: <strong className="text-slate-700 font-bold">{offering.report_time || "Same Day"}</strong></span>
                                </div>
                              </div>

                              <div className="pt-2.5 border-t border-slate-200/70 flex items-center justify-between">
                                <div>
                                  <div className="text-sm font-black text-emerald-700">৳{offering.price}</div>
                                  {offering.original_price && (
                                    <div className="text-[10px] text-slate-400 line-through">৳{offering.original_price}</div>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => onBookLabTest && onBookLabTest({
                                    test: offering.test_details || { name: testName },
                                    branchTest: offering,
                                    branch: center
                                  })}
                                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors shadow-2xs active:scale-95 cursor-pointer"
                                >
                                  Book Test
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              );
            })
          )}

          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>

      </div>
    </div>
  );
}
