import React, { useEffect, useState } from 'react';
import { 
  Building2, Heart, Sparkles, FlaskConical, Activity, Stethoscope, 
  Landmark, Award, ShieldCheck, FileText, ChevronDown, Eye, Smile, 
  Baby, Brain, Flame, Ear, Bone, Wind, Droplet
} from 'lucide-react';
import { api } from '../../../services/api';

const hospitalIconMap = {
  Building2,
  Heart,
  Sparkles,
  FlaskConical,
  Activity,
  Stethoscope,
  Landmark,
  Award,
  ShieldCheck,
  FileText,
  Eye,
  Smile,
  Baby,
  Brain,
  Flame,
  Ear,
  Bone,
  Wind,
  Droplet,
  'general-hospitals': Building2,
  'cardiac-hospitals': Heart,
  'cancer-oncology': ShieldCheck,
  'eye-hospitals': Eye,
  'orthopedic-trauma': Bone,
  'mother-child-maternity': Baby,
  'pediatric-hospitals': Sparkles,
  'neurological-spine': Brain,
  'kidney-nephrology': Droplet,
  'dental-hospitals': Smile,
  'mental-health': Brain,
  'ent-hospitals': Ear,
  'diabetes-endocrine': Activity,
  'burn-plastic-surgery': Flame,
  'skin-dermatology': Sparkles,
  'chest-pulmonology': Wind,
  'infectious-diseases': FlaskConical,
  'gastroenterology-liver': Activity,
  'diagnostic-daycare': Stethoscope,
  'medical-college-hospitals': Landmark,
  'corporate-tertiary': Building2,
  'government-district': Landmark,
  'rehab-physiotherapy': Award,
  'geriatric-palliative': ShieldCheck,
};

const FALLBACK_HOSPITAL_CATEGORIES = [
  { id: 'hosp-cat-1', name: 'General Hospitals', slug: 'general-hospitals', icon: 'Building2', description: 'Comprehensive inpatient, surgical & multi-department healthcare facilities', count: 95 },
  { id: 'hosp-cat-2', name: 'Specialized Cardiac Hospitals', slug: 'cardiac-hospitals', icon: 'Heart', description: 'Advanced CCU, cath lab, bypass surgery & emergency cardiac care', count: 35 },
  { id: 'hosp-cat-3', name: 'Cancer & Oncology Hospitals', slug: 'cancer-oncology', icon: 'ShieldCheck', description: 'Chemotherapy, radiotherapy, surgical oncology & specialized cancer therapy', count: 25 },
  { id: 'hosp-cat-4', name: 'Eye & Ophthalmology Hospitals', slug: 'eye-hospitals', icon: 'Eye', description: 'Cataract, LASIK, retina surgery & complete vision treatment units', count: 42 },
  { id: 'hosp-cat-5', name: 'Orthopedic & Trauma Hospitals', slug: 'orthopedic-trauma', icon: 'Bone', description: '24/7 trauma centers, joint replacement & musculoskeletal surgeries', count: 38 },
  { id: 'hosp-cat-6', name: 'Mother & Child / Maternity Hospitals', slug: 'mother-child-maternity', icon: 'Baby', description: 'Labor suites, high-risk pregnancy care, NICU & newborn intensive care', count: 50 },
  { id: 'hosp-cat-7', name: 'Pediatric / Children Hospitals', slug: 'pediatric-hospitals', icon: 'Sparkles', description: 'Dedicated pediatric medicine, PICU, surgery & child wellness centers', count: 30 },
  { id: 'hosp-cat-8', name: 'Neurological & Spine Hospitals', slug: 'neurological-spine', icon: 'Brain', description: 'Stroke units, brain neurosurgery & advanced spinal trauma treatment', count: 22 },
  { id: 'hosp-cat-9', name: 'Kidney & Nephrology Hospitals', slug: 'kidney-nephrology', icon: 'Droplet', description: 'Hemodialysis units, kidney transplant facilities & urology surgical centers', count: 28 },
  { id: 'hosp-cat-10', name: 'Dental Hospitals', slug: 'dental-hospitals', icon: 'Smile', description: 'Oral maxillofacial surgery, orthodontic care & tertiary dental clinics', count: 35 },
  { id: 'hosp-cat-11', name: 'Mental Health & Psychiatric Hospitals', slug: 'mental-health', icon: 'Brain', description: 'Clinical psychiatry, behavioral therapy & inpatient mental healthcare', count: 18 },
  { id: 'hosp-cat-12', name: 'ENT Hospitals', slug: 'ent-hospitals', icon: 'Ear', description: 'Head & neck surgery, cochlear implants & microsurgical ENT procedures', count: 26 },
  { id: 'hosp-cat-13', name: 'Diabetes & Endocrine Hospitals', slug: 'diabetes-endocrine', icon: 'Activity', description: 'Diabetic foot care, insulin management & clinical endocrinology centers', count: 40 },
  { id: 'hosp-cat-14', name: 'Burn & Plastic Surgery Hospitals', slug: 'burn-plastic-surgery', icon: 'Flame', description: 'Emergency burn treatment, ICU & reconstructive plastic surgery', count: 15 },
  { id: 'hosp-cat-15', name: 'Skin & Dermatology Hospitals', slug: 'skin-dermatology', icon: 'Sparkles', description: 'Laser dermatology, clinical skin disease & cosmetic treatments', count: 32 },
  { id: 'hosp-cat-16', name: 'Chest & Pulmonology Hospitals', slug: 'chest-pulmonology', icon: 'Wind', description: 'Asthma, tuberculosis, bronchoscopy & advanced respiratory therapy', count: 20 },
  { id: 'hosp-cat-17', name: 'Infectious Diseases Hospitals', slug: 'infectious-diseases', icon: 'FlaskConical', description: 'Isolation wards, viral fever & specialized communicable disease units', count: 16 },
  { id: 'hosp-cat-18', name: 'Gastroenterology & Liver Hospitals', slug: 'gastroenterology-liver', icon: 'Activity', description: 'Endoscopic retrograde cholangiopancreatography (ERCP) & hepatology', count: 24 },
  { id: 'hosp-cat-19', name: 'Diagnostic & Day Care Centers', slug: 'diagnostic-daycare', icon: 'Stethoscope', description: 'Day care surgical units, post-op monitoring & clinical observations', count: 60 },
  { id: 'hosp-cat-20', name: 'Medical College Hospitals', slug: 'medical-college-hospitals', icon: 'Landmark', description: 'Tertiary public & private teaching hospitals with extensive bed capacity', count: 48 },
  { id: 'hosp-cat-21', name: 'Corporate Tertiary Hospitals', slug: 'corporate-tertiary', icon: 'Building2', description: 'Multi-specialty accredited tertiary healthcare groups with modern tech', count: 32 },
  { id: 'hosp-cat-22', name: 'Government District / Sadar Hospitals', slug: 'government-district', icon: 'Landmark', description: 'State-subsidized primary & secondary healthcare district hospitals', count: 64 },
  { id: 'hosp-cat-23', name: 'Rehabilitation & Physio Hospitals', slug: 'rehab-physiotherapy', icon: 'Award', description: 'Occupational therapy, spinal injury rehab & physical restorative care', count: 20 },
  { id: 'hosp-cat-24', name: 'Geriatric & Palliative Care', slug: 'geriatric-palliative', icon: 'ShieldCheck', description: 'Senior citizen long-term healthcare & palliative compassionate support', count: 14 },
];

export default function DoctorMonitorGrid({ onSelectCategory }) {
  const [categories, setCategories] = useState([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api.getHospitalCategories()
      .then((data) => {
        if (isMounted && data) {
          const list = Array.isArray(data) ? data : (data.results || []);
          const filtered = list.filter((c) => c && c.id !== 'all' && c.name !== 'All Categories');
          setCategories(filtered.length > 0 ? filtered : list);
        }
      })
      .catch((err) => {
        console.warn("Failed to load hospital categories", err);
      });
    return () => { isMounted = false; };
  }, []);

  const displayList = categories.length > 0 ? categories : FALLBACK_HOSPITAL_CATEGORIES;
  const visibleCategories = showAll ? displayList : displayList.slice(0, 20);

  return (
    <section id="hospitals" className="py-16 px-4 sm:px-8 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
            Hospital Categories
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 tracking-tight">
            Hospitals
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Verified hospital networks & specialized hospitals across Bangladesh.
          </p>
        </div>

        {/* HOSPITAL CATEGORIES GRID VIEW */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {visibleCategories.map((cat) => {
            const IconComp = hospitalIconMap[cat.icon] || hospitalIconMap[cat.slug] || hospitalIconMap[cat.id] || Building2;

            return (
              <div
                key={cat.id || cat.slug || cat.name}
                onClick={() => onSelectCategory && onSelectCategory(cat.id || cat.slug || cat.name)}
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
                    {cat.description || `Explore ${cat.name} hospitals`}
                  </p>
                </div>

                {cat.count !== undefined && cat.count !== null && (
                  <div className="mt-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {cat.count} Hospitals
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {displayList.length > 20 && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-white text-slate-800 border border-slate-300 hover:border-emerald-500 hover:text-emerald-700 hover:shadow-md transition-all duration-200 cursor-pointer active:scale-95"
            >
              <span>{showAll ? 'Show Less' : `Show All (${displayList.length})`}</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showAll ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}

      </div>
    </section>
  );
}

