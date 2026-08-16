import React, { useEffect, useState } from 'react';
import { 
  Building2, FlaskConical, Heart, Brain, Dna, ShieldCheck, 
  Activity, FileText, Sparkles, Landmark, Award, Stethoscope,
  Microscope, Droplet, ArrowRight
} from 'lucide-react';
import { api, ensureArray } from '../../../services/api';

const categoryIconMap = {
  Building2,
  FlaskConical,
  Heart,
  Brain,
  Dna,
  ShieldCheck,
  Activity,
  FileText,
  Sparkles,
  Landmark,
  Award,
  Stethoscope,
  Microscope,
  Droplet,
  'multi-specialty-general-diagnostic-center': Building2,
  'pathology-lab-focused': FlaskConical,
  'imaging-focused-radiology-ct-mri-': FileText,
  'cardiac-diagnostics-focused': Heart,
  'neuro-diagnostics-focused': Brain,
  'genetic-molecular-testing-focused': Dna,
  'government-diagnostic-center': Landmark,
  'private-independent-': ShieldCheck,
  'corporate-chain-multi-branch-': Building2,
  'hospital-affiliated-lab': Award,
  'clinical-pathology': FlaskConical,
  'radiology-imaging': FileText,
  'cardiology-diagnostics': Heart,
  'cardiac-tests': Heart,
  'neuro-diagnostics': Brain,
  'neuro-tests': Brain,
  'molecular-genetics': Dna,
  'genetic-molecular': Dna,
  'general-diagnostic-centers': Building2,
  'hematology': Droplet,
  'biochemistry': Activity,
  'serology': ShieldCheck,
  'microbiology': FlaskConical,
  'x-ray': FileText,
  'ultrasound-usg': Sparkles,
  'ct-scan': Brain,
  'mri': Brain,
  'endoscopy-colonoscopy': Stethoscope,
  'mammography': Sparkles,
};

// Rich Fallback Data for Test Categories (By Test Domain)
const FALLBACK_TEST_CATEGORIES = [
  { 
    id: 'cardiac-tests', 
    name: 'Cardiac Tests', 
    slug: 'cardiac-tests', 
    icon: 'Heart', 
    description: 'ECG, 2D Echo, Doppler Echo, TMT, Holter & cardiac profiling', 
    count: 9, 
    badge: 'Popular' 
  },
  { 
    id: 'hematology', 
    name: 'Hematology & Blood', 
    slug: 'hematology', 
    icon: 'Droplet', 
    description: 'CBC, ESR, Blood Grouping, PBF & routine blood pathology', 
    count: 12, 
    badge: 'Routine' 
  },
  { 
    id: 'biochemistry', 
    name: 'Biochemistry & LFT/KFT', 
    slug: 'biochemistry', 
    icon: 'Activity', 
    description: 'Lipid Profile, Liver Function, Kidney Function, HbA1c & Sugar', 
    count: 14, 
    badge: 'Essential' 
  },
  { 
    id: 'radiology-imaging', 
    name: 'Radiology & X-Ray', 
    slug: 'radiology-imaging', 
    icon: 'FileText', 
    description: 'Digital X-Ray, Chest X-Ray, Bone Densitometry & DEXA scans', 
    count: 8, 
    badge: 'Imaging' 
  },
  { 
    id: 'ultrasound-usg', 
    name: 'Ultrasound / USG', 
    slug: 'ultrasound-usg', 
    icon: 'Sparkles', 
    description: '4D Pregnancy USG, Whole Abdomen, Pelvic & Doppler Ultrasound', 
    count: 7, 
    badge: 'High Demand' 
  },
  { 
    id: 'ct-scan', 
    name: 'CT Scan Body Imaging', 
    slug: 'ct-scan', 
    icon: 'Brain', 
    description: 'High-speed Multi-Slice CT Brain, Chest, Abdomen & HRCT Scans', 
    count: 6, 
    badge: 'Advanced' 
  },
  { 
    id: 'mri', 
    name: 'MRI Diagnostics', 
    slug: 'mri', 
    icon: 'Brain', 
    description: '1.5T & 3.0T High-Field Brain, Spine & Musculoskeletal MRI', 
    count: 6, 
    badge: 'Advanced' 
  },
  { 
    id: 'neuro-tests', 
    name: 'Neuro Diagnostics', 
    slug: 'neuro-tests', 
    icon: 'Brain', 
    description: 'EEG, EMG, NCS, VEP & comprehensive neurological testing', 
    count: 7, 
    badge: 'Specialized' 
  },
  { 
    id: 'genetic-molecular', 
    name: 'Genetic & Molecular', 
    slug: 'genetic-molecular', 
    icon: 'Dna', 
    description: 'PCR tests, DNA sequencing, HPV & advanced molecular diagnostics', 
    count: 6, 
    badge: 'Specialized' 
  },
  { 
    id: 'endoscopy-colonoscopy', 
    name: 'Endoscopy & Colonoscopy', 
    slug: 'endoscopy-colonoscopy', 
    icon: 'Stethoscope', 
    description: 'Upper GI Endoscopy, Colonoscopy, Biopsy & Histopathology', 
    count: 7, 
    badge: 'Specialized' 
  },
  { 
    id: 'serology', 
    name: 'Serology & Immunity', 
    slug: 'serology', 
    icon: 'ShieldCheck', 
    description: 'Dengue NS1, Hepatitis B/C, HIV, Widal & infectious viral panels', 
    count: 9, 
    badge: 'Routine' 
  },
  { 
    id: 'microbiology', 
    name: 'Microbiology & Culture', 
    slug: 'microbiology', 
    icon: 'FlaskConical', 
    description: 'Urine R/M/E, Stool R/E, Blood Culture & Antibiotic Sensitivity', 
    count: 6, 
    badge: 'Routine' 
  },
];

// Rich Fallback Data for Diagnostic Center Specialization & Types
const FALLBACK_CENTER_CATEGORIES = [
  { id: 'multi-specialty-general-diagnostic-center', name: 'Multi-Specialty / General Lab', slug: 'multi-specialty-general-diagnostic-center', icon: 'Building2', description: 'Comprehensive diagnostic labs with multiple testing divisions & visiting specialists', count: 52 },
  { id: 'pathology-lab-focused', name: 'Pathology Lab Focused', slug: 'pathology-lab-focused', icon: 'FlaskConical', description: 'Fully automated clinical biochemistry, hematology, immunology & hormone testing', count: 45 },
  { id: 'imaging-focused-radiology-ct-mri-', name: 'Imaging Hub (X-Ray, CT, MRI)', slug: 'imaging-focused-radiology-ct-mri-', icon: 'FileText', description: 'Specialized 128-slice CT, 3.0T MRI, digital radiography & ultrasound centers', count: 38 },
  { id: 'cardiac-diagnostics-focused', name: 'Cardiac Diagnostics Focused', slug: 'cardiac-diagnostics-focused', icon: 'Heart', description: 'Dedicated centers with echocardiography, ETT, Holter & cardiac evaluations', count: 28 },
  { id: 'neuro-diagnostics-focused', name: 'Neuro Diagnostics Focused', slug: 'neuro-diagnostics-focused', icon: 'Brain', description: 'State-of-the-art EEG, EMG, NCS & comprehensive neurological testing labs', count: 20 },
  { id: 'genetic-molecular-testing-focused', name: 'Genetic & Molecular Testing', slug: 'genetic-molecular-testing-focused', icon: 'Dna', description: 'Advanced molecular PCR, chromosomal screening & DNA diagnostics facilities', count: 18 },
  { id: 'government-diagnostic-center', name: 'Government Diagnostic Centers', slug: 'government-diagnostic-center', icon: 'Landmark', description: 'Subsidized public sector diagnostic & hospital-affiliated pathology units', count: 15 },
  { id: 'private-independent-', name: 'Private & Corporate Chains', slug: 'private-independent-', icon: 'ShieldCheck', description: 'Nationwide verified private diagnostic laboratory chains with doorstep collection', count: 35 },
];

/*
const POPULAR_QUICK_TESTS = [
  { label: 'ECG & Echocardiogram', catId: 'cardiac-tests', icon: '🫀' },
  { label: 'CBC Blood Count', catId: 'hematology', icon: '🩸' },
  { label: 'Lipid & LFT Profile', catId: 'biochemistry', icon: '🧪' },
  { label: '4D Pregnancy USG', catId: 'ultrasound-usg', icon: '👶' },
  { label: 'Brain MRI Scan', catId: 'mri', icon: '🧠' },
  { label: 'Digital Chest X-Ray', catId: 'radiology-imaging', icon: '☢️' },
  { label: 'Whole Body CT Scan', catId: 'ct-scan', icon: '⚡' },
];
*/

export default function DiagnosticsSection({
  onSelectCategory,
  onSelectTestCategory,
  onSelectCenterCategory
}) {
  const [testCategories, setTestCategories] = useState([]);
  const [centerCategories, setCenterCategories] = useState([]);

  useEffect(() => {
    let isMounted = true;
    
    // Fetch Test Categories
    api.getTestCategories()
      .then((data) => {
        if (isMounted && data) {
          const list = ensureArray(data);
          const filtered = list.filter((c) => c && c.id !== 'all' && c.name !== 'All Categories' && c.name !== 'All Test Categories');
          if (filtered.length > 0) setTestCategories(filtered);
        }
      })
      .catch((err) => {
        console.warn("Failed to load test categories, using fallback", err);
      });

    // Fetch Diagnostic Center Categories
    api.getDiagnosticCenterCategories()
      .then((data) => {
        if (isMounted && data) {
          const list = ensureArray(data);
          const filtered = list.filter((c) => c && c.id !== 'all' && c.name !== 'All Categories' && c.name !== 'By Specialization' && c.name !== 'By Ownership & Type');
          if (filtered.length > 0) setCenterCategories(filtered);
        }
      })
      .catch((err) => {
        console.warn("Failed to load diagnostic center categories, using fallback", err);
      });

    return () => { isMounted = false; };
  }, []);

  const displayTestCategories = testCategories.length > 0 ? testCategories : FALLBACK_TEST_CATEGORIES;

  const handleTestCategoryClick = (cat) => {
    const idOrSlug = cat.id || cat.slug || cat.name;
    if (onSelectTestCategory) {
      onSelectTestCategory(idOrSlug, cat);
    } else if (onSelectCategory) {
      onSelectCategory(idOrSlug, 'test');
    }
  };

  return (
    <section id="diagnostics" className="py-16 px-4 sm:px-8 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
            Diagnostics Categories
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 tracking-tight">
            Diagnostics Centers
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Explore verified diagnostic Centers by specialization, ownership type, and available testing services.
          </p>
        </div>

        {/* 
        DUAL VIEW MODE SWITCHER TABS COMMENTED OUT:
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-2xl mx-auto">
          <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200/90 flex w-full sm:w-auto shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('test_categories')}
              className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-emerald-600 text-white"
            >
              By Test Category (Cardiac, Blood, Imaging)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('center_categories')}
              className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-600"
            >
              By Diagnostic Center Type
            </button>
          </div>
        </div>
        */}

        {/* 
        QUICK POPULAR TEST PILLS BAR COMMENTED OUT:
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-extrabold shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Popular Test Searches:</span>
          </div>
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2">
            {POPULAR_QUICK_TESTS.map((pill) => (
              <button
                key={pill.label}
                type="button"
                onClick={() => handleTestCategoryClick({ id: pill.catId, slug: pill.catId, name: pill.label })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-slate-700 border border-slate-200"
              >
                <span>{pill.icon}</span>
                <span>{pill.label}</span>
              </button>
            ))}
          </div>
        </div>
        */}

        {/* DIAGNOSTICS TEST CATEGORY GRID VIEW */}
        <div className="space-y-4">
          {/*
          SUBHEADER COMMENTED OUT:
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Select a Test Category to View Matching Tests & Centers ({displayTestCategories.length})
            </h3>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Click category to search
            </span>
          </div>
          */}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {displayTestCategories.map((cat) => {
              const IconComp = categoryIconMap[cat.icon] || categoryIconMap[cat.slug] || categoryIconMap[cat.id] || FlaskConical;

              return (
                <div
                  key={cat.id || cat.slug || cat.name}
                  onClick={() => handleTestCategoryClick(cat)}
                  className="p-4 rounded-xl border cursor-pointer transition-all duration-200 text-center flex flex-col items-center justify-between bg-white text-slate-800 border-slate-200 hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5 group"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white">
                    <IconComp className="w-6 h-6" />
                  </div>

                  <div>
                    <h4 className="font-bold text-sm leading-tight mb-1 text-slate-900 group-hover:text-emerald-700">
                      {cat.name}
                    </h4>
                    <p className="text-[11px] line-clamp-2 text-slate-500">
                      {cat.description || `Explore ${cat.name} diagnostic centers`}
                    </p>
                  </div>

                  {cat.count !== undefined && cat.count !== null && (
                    <div className="mt-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {cat.count} Tests
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
