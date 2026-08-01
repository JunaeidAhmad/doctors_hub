export const CITY_THANAS = {
  "Dhaka": [
    "Dhanmondi", "Mirpur", "Uttara", "Gulshan", "Banani", "Panthapath", 
    "Motijheel", "Mohammadpur", "Badda", "Savar", "Farmgate", "Tejgaon", 
    "Malibagh", "Shyamoli", "Rampura", "Jatrabari", "Lalbagh", "Khilgaon", 
    "Keraniganj", "Gazipur", "Narayanganj"
  ],
  "Chittagong": [
    "Panchlaish", "Agrabad", "GEC Circle", "Halishahar", "Nasirabad", 
    "Chawkbazar", "Pahartali", "Khulshi", "Kotwali", "Patenga", 
    "Sitakunda", "Hathazari"
  ],
  "Sylhet": [
    "Zindabazar", "Nayasarak", "Amberkhana", "Chauhatta", "Subidbazar", 
    "Tilagarh", "Shibganj", "Kadamtali", "Shahjalal Uposahar"
  ],
  "Rajshahi": [
    "Laxmipur", "Kazla", "Motihar", "Boalia", "Rajputra", 
    "Shaheb Bazar", "New Market", "Upashahar"
  ],
  "Khulna": [
    "KDA Avenue", "Sonadanga", "Boyra", "Khalishpur", "Daulatpur", 
    "Rupsha", "Gollamari", "Khan Jahan Ali"
  ],
  "Barisal": [
    "Sadar Road", "Rupatali", "Natun Bazar", "C&B Road", "Alekanda", 
    "Jordan Road", "Kashipur"
  ],
  "Rangpur": [
    "Park More", "Medical East Gate", "Jahaj Company More", "Dhap", 
    "Carmel Road", "Pairaband"
  ],
  "Mymensingh": [
    "Charpara", "Ganginarpar", "Town Hall", "Maskanda", "Akua", 
    "Kewatkhali", "Patuakhali Road"
  ],
  "Comilla": [
    "Kandirpar", "Jhawtala", "Badurtala", "Tomsom Bridge", "Ramghat", 
    "Bagichagaon", "Dharmpur"
  ]
};

export const LOCATIONS = [
  "All Bangladesh",
  "Dhaka",
  "Chittagong",
  "Sylhet",
  "Rajshahi",
  "Khulna",
  "Barisal",
  "Rangpur",
  "Mymensingh",
  "Comilla"
];

export const SPECIALTIES = [
  { id: "cardiology", name: "Cardiologist", icon: "Heart", description: "Heart & Vascular Care", count: 48 },
  { id: "neurology", name: "Neurologist", icon: "Brain", description: "Brain & Nervous System", count: 32 },
  { id: "gynecology", name: "Gynecologist", icon: "User", description: "Women's Health & Maternity", count: 75 },
  { id: "orthopedics", name: "Orthopedic", icon: "Activity", description: "Bones, Joints & Spine", count: 60 },
  { id: "dermatology", name: "Dermatologist", icon: "Sparkles", description: "Skin, Hair & Aesthetics", count: 45 },
  { id: "pediatrics", name: "Pediatrician", icon: "Baby", description: "Child & Infant Care", count: 52 },
  { id: "medicine", name: "General Physician", icon: "Stethoscope", description: "General Health & Fever", count: 95 },
  { id: "gastroenterology", name: "Gastroenterologist", icon: "Flame", description: "Digestive & Liver Care", count: 38 },
  { id: "ent", name: "ENT Specialist", icon: "Ear", description: "Ear, Nose & Throat", count: 40 },
  { id: "oncology", name: "Oncologist", icon: "ShieldAlert", description: "Cancer Care & Chemotherapy", count: 22 },
  { id: "pulmonology", name: "Pulmonologist", icon: "Wind", description: "Lungs & Respiratory Care", count: 29 },
  { id: "nephrology", name: "Nephrologist", icon: "Droplet", description: "Kidney Care & Dialysis", count: 20 }
];

export const HOSPITAL_CATEGORIES = [
  { id: "cardiac", name: "Cardiac Hospitals", icon: "Heart", description: "Specialized Heart Institutes", count: 4 },
  { id: "eye", name: "Eye Hospitals", icon: "Sparkles", description: "Ophthalmology & Vision Care", count: 3 },
  { id: "multispecialty", name: "Multi-Specialty", icon: "Building2", description: "General & In-Patient Hubs", count: 8 },
  { id: "orthopedic", name: "Orthopedic Centers", icon: "Activity", description: "Bone, Joint & Spine Care", count: 3 }
];

export const HOSPITAL_SPECIALTIES = HOSPITAL_CATEGORIES;

export const HOSPITAL_SERVICES = [
  { id: "hs-1", name: "24/7 ICU & In-patient", icon: "Activity", description: "Round the clock intensive care and bed admission" },
  { id: "hs-2", name: "Specialist OPD Consultation", icon: "Stethoscope", description: "Out-patient specialist doctor visit chambers" },
  { id: "hs-3", name: "Surgery & OT Suite", icon: "ShieldCheck", description: "Modern operation theater and laparoscopic surgery" },
  { id: "hs-4", name: "24/7 Emergency & Ambulance", icon: "Clock", description: "Emergency triage and rapid ambulance response" },
  { id: "hs-5", name: "Phaco Cataract Surgery", icon: "Eye", description: "Advanced stitchless cataract surgery" },
  { id: "hs-6", name: "Lasik Vision Correction", icon: "Sparkles", description: "Laser refractive eye vision correction" }
];

export const DIAGNOSTIC_SERVICES = [
  { id: "ds-1", name: "4D Ultrasonography & Color Doppler", icon: "Activity", description: "High resolution fetal & abdominal sonography" },
  { id: "ds-2", name: "Digital X-Ray & Imaging", icon: "FileText", description: "Low radiation digital radiography" },
  { id: "ds-3", name: "Automated Blood & Serology Lab", icon: "FlaskConical", description: "Fully automated clinical pathology and biochemistry" },
  { id: "ds-4", name: "128-Slice CT Scan", icon: "FileText", description: "High-speed computed tomography body scan" },
  { id: "ds-5", name: "High-Speed MRI Scan", icon: "Brain", description: "3.0 Tesla neuro and musculoskeletal MRI" },
  { id: "ds-6", name: "Home Sample Collection", icon: "Droplet", description: "Doorstep blood sample collection by certified phlebotomists" }
];

export const TEST_TREE = {
    "Blood Tests": {
        "children": {
            "Hematology": [
                ["Complete Blood Count (CBC)", "Blood", false, 6],
                ["ESR (Erythrocyte Sedimentation Rate)", "Blood", false, 6],
                ["Blood Grouping & Rh Factor", "Blood", false, 4],
                ["Coagulation Profile (PT, APTT, INR)", "Blood", false, 12],
                ["Peripheral Blood Smear", "Blood", false, 24],
                ["Reticulocyte Count", "Blood", false, 12],
            ],
            "Biochemistry": [
                ["Blood Sugar - Fasting", "Blood", true, 4],
                ["Blood Sugar - Random", "Blood", false, 4],
                ["Blood Sugar - PP (Post Prandial)", "Blood", false, 4],
                ["HbA1c", "Blood", false, 24],
                ["Lipid Profile (Cholesterol, Triglycerides, HDL, LDL)", "Blood", true, 12],
                ["Liver Function Test (LFT)", "Blood", true, 12],
                ["Kidney Function Test (KFT/RFT)", "Blood", false, 12],
                ["Thyroid Profile (T3, T4, TSH)", "Blood", false, 24],
                ["Electrolytes (Sodium, Potassium, Chloride)", "Blood", false, 6],
                ["Cardiac Enzymes (Troponin, CK-MB)", "Blood", false, 4],
                ["Vitamin Profile (D3, B12)", "Blood", false, 48],
                ["Iron Studies (Serum Iron, Ferritin, TIBC)", "Blood", true, 24],
            ],
            "Serology": [
                ["Widal Test (Typhoid)", "Blood", false, 12],
                ["Dengue NS1/IgM/IgG", "Blood", false, 6],
                ["HBsAg (Hepatitis B)", "Blood", false, 12],
                ["HCV (Hepatitis C)", "Blood", false, 12],
                ["HIV Test", "Blood", false, 24],
                ["VDRL/RPR (Syphilis)", "Blood", false, 12],
                ["CRP (C-Reactive Protein)", "Blood", false, 12],
                ["RA Factor", "Blood", false, 12],
                ["ASO Titer", "Blood", false, 12],
            ],
            "Microbiology": [
                ["Urine Culture & Sensitivity", "Urine", false, 72],
                ["Blood Culture", "Blood", false, 72],
                ["Sputum Culture", "Sputum", false, 72],
                ["Stool Routine & Culture", "Stool", false, 48],
                ["Throat Swab Culture", "Swab", false, 48],
                ["Wound Swab Culture", "Swab", false, 48],
            ],
        }
    },
    "Radiology & Imaging": {
        "children": {
            "X-ray": [
                ["Chest X-ray", "N/A", false, 2],
                ["Bone/Skeletal X-ray", "N/A", false, 2],
                ["Abdominal X-ray", "N/A", false, 2],
                ["Spine X-ray", "N/A", false, 2],
                ["Dental X-ray (OPG)", "N/A", false, 2],
            ],
            "Ultrasound/USG": [
                ["Abdominal USG (Whole Abdomen)", "N/A", true, 2],
                ["Pelvic USG", "N/A", true, 2],
                ["Pregnancy/Obstetric USG", "N/A", false, 2],
                ["Thyroid USG", "N/A", false, 2],
                ["Breast USG", "N/A", false, 2],
                ["Doppler USG (Vascular)", "N/A", false, 4],
                ["Transvaginal USG", "N/A", false, 2],
            ],
            "CT Scan": [
                ["CT Brain", "N/A", false, 4],
                ["CT Chest", "N/A", false, 4],
                ["CT Abdomen/Pelvis", "N/A", true, 4],
                ["CT Angiography", "N/A", true, 6],
                ["CT Spine", "N/A", false, 4],
                ["HRCT (High-Resolution CT)", "N/A", false, 4],
            ],
            "MRI": [
                ["MRI Brain", "N/A", false, 6],
                ["MRI Spine", "N/A", false, 6],
                ["MRI Joint (Knee, Shoulder)", "N/A", false, 6],
                ["MRI Whole Abdomen", "N/A", true, 6],
                ["MRI Angiography (MRA)", "N/A", false, 8],
                ["Functional MRI (fMRI)", "N/A", false, 24],
            ],
            "Mammography": [
                ["Screening Mammogram", "N/A", false, 4],
                ["Specialized Mammogram", "N/A", false, 4],
                ["Digital Breast Tomosynthesis", "N/A", false, 4],
            ],
        }
    },
    "Cardiac Tests": {
        "tests": [
            ["ECG (Resting)", "N/A", false, 1],
            ["2D Echo", "N/A", false, 2],
            ["Doppler Echo", "N/A", false, 2],
            ["Stress Echo", "N/A", false, 4],
            ["TMT (Treadmill Test)", "N/A", false, 2],
            ["Holter Monitor (24-hour ECG)", "N/A", false, 48],
            ["Cardiac CT/Calcium Scoring", "N/A", true, 6],
            ["Ambulatory BP Monitoring (ABPM)", "N/A", false, 48],
            ["Coronary Angiography", "N/A", true, 24],
        ]
    },
    "Neuro Tests": {
        "tests": [
            ["EEG - Routine", "N/A", false, 4],
            ["EEG - Sleep-deprived", "N/A", false, 12],
            ["EEG - Video", "N/A", false, 48],
            ["EMG (Electromyography)", "N/A", false, 4],
            ["NCV (Nerve Conduction Velocity)", "N/A", false, 4],
            ["Evoked Potential Studies (VEP, BAEP, SSEP)", "N/A", false, 6],
            ["Polysomnography (Sleep Study)", "N/A", false, 48],
        ]
    },
    "Endoscopy/Colonoscopy": {
        "tests": [
            ["Upper GI Endoscopy (Gastroscopy)", "N/A", true, 4],
            ["Colonoscopy", "N/A", true, 4],
            ["Sigmoidoscopy", "N/A", true, 4],
            ["ERCP", "N/A", true, 24],
            ["Bronchoscopy", "N/A", true, 24],
            ["Cystoscopy", "N/A", false, 4],
            ["Capsule Endoscopy", "N/A", true, 24],
        ]
    },
    "Pulmonary Function Test (PFT)": {
        "tests": [
            ["Spirometry", "N/A", false, 2],
            ["Lung Volume Test", "N/A", false, 2],
            ["Diffusion Capacity Test (DLCO)", "N/A", false, 2],
            ["Bronchial Provocation Test", "N/A", false, 4],
            ["Arterial Blood Gas (ABG) Analysis", "Blood", false, 1],
        ]
    },
    "Genetic & Molecular": {
        "tests": [
            ["PCR Test (viral/bacterial detection)", "Swab/Blood", false, 24],
            ["DNA Fingerprinting/Paternity Test", "Blood/Swab", false, 168],
            ["Karyotyping (Chromosomal Analysis)", "Blood", false, 336],
            ["NIPT (Non-Invasive Prenatal Testing)", "Blood", false, 168],
            ["BRCA Gene Testing", "Blood", false, 336],
            ["HLA Typing", "Blood", false, 168],
        ]
    },
    "Histopathology / Biopsy": {
        "tests": [
            ["Tissue Biopsy", "Tissue", false, 168],
            ["FNAC (Fine Needle Aspiration Cytology)", "Tissue", false, 72],
            ["Pap Smear", "Cervical Sample", false, 72],
            ["Bone Marrow Biopsy", "Tissue", false, 168],
            ["Frozen Section Biopsy", "Tissue", false, 1],
            ["Immunohistochemistry (IHC)", "Tissue", false, 168],
        ]
    },
    "Nuclear Medicine": {
        "tests": [
            ["PET Scan", "N/A", true, 24],
            ["PET-CT Scan", "N/A", true, 24],
            ["Bone Scan", "N/A", false, 6],
            ["Thyroid Scan", "N/A", false, 6],
            ["Renal Scan (DTPA/DMSA)", "N/A", false, 6],
            ["Cardiac Perfusion Scan (MPI)", "N/A", true, 24],
            ["Lung Ventilation-Perfusion Scan (V/Q Scan)", "N/A", false, 6],
        ]
    },
};

export const CENTER_CATEGORY_TREE = {
    "By Specialization": {
        "children": {
            "Multi-Specialty / General Diagnostic Center": [],
            "Pathology & Lab": [],
            "Imaging (Radiology/CT/MRI)": [],
            "Cardiac Diagnostics": [],
            "Neuro Diagnostics": [],
            "Genetic & Molecular": [],
        }
    },
    "By Ownership & Type": {
        "children": {
            "Government Diagnostic Center": [],
            "Private (Independent)": [],
            "Corporate Chain (Multi-branch)": [],
            "Hospital-Affiliated Lab": [],
        }
    },
};

export const DIAGNOSTIC_CENTER_CATEGORIES = [
  { id: "all", name: "All Center Categories", icon: "Building2", parent: null }
];
Object.entries(CENTER_CATEGORY_TREE).forEach(([parentName, parentData]) => {
  const parentId = parentName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  DIAGNOSTIC_CENTER_CATEGORIES.push({
    id: parentId,
    name: parentName,
    icon: "Building2",
    parent: null
  });
  if (parentData.children) {
    Object.keys(parentData.children).forEach(childName => {
      const childId = childName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      DIAGNOSTIC_CENTER_CATEGORIES.push({
        id: childId,
        name: childName,
        icon: "FlaskConical",
        parent: parentId
      });
    });
  }
});

export const TEST_CATEGORIES = [
  { id: "all", name: "All Test Categories", icon: "FlaskConical", description: "All Diagnostic Tests & Profiles", count: 0 }
];

export const TESTS = [];

let testCounter = 1;
Object.entries(TEST_TREE).forEach(([topCatName, topCatData]) => {
  const topCatId = topCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  TEST_CATEGORIES.push({
    id: topCatId,
    name: topCatName,
    icon: "FlaskConical",
    description: topCatName,
    parent: null
  });

  if (topCatData.children) {
    Object.entries(topCatData.children).forEach(([subCatName, testList]) => {
      const subCatId = subCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      TEST_CATEGORIES.push({
        id: subCatId,
        name: subCatName,
        icon: "FlaskConical",
        description: subCatName,
        parent: topCatId,
        count: testList.length
      });

      testList.forEach(([tName, sampleType, fastingReq, reportHrs]) => {
        TESTS.push({
          id: `test-${testCounter++}`,
          name: tName,
          category: subCatName,
          categoryGroup: subCatId,
          sampleType: sampleType,
          fastingRequired: fastingReq,
          reportTimeHours: reportHrs,
          price: 500 + (testCounter * 50) % 3000,
          originalPrice: 700 + (testCounter * 50) % 4000,
          discount: "20% OFF",
          reportTime: `${reportHrs} Hours`,
          description: `Diagnostic test for ${tName}.`
        });
      });
    });
  }

  if (topCatData.tests) {
    topCatData.tests.forEach(([tName, sampleType, fastingReq, reportHrs]) => {
      TESTS.push({
        id: `test-${testCounter++}`,
        name: tName,
        category: topCatName,
        categoryGroup: topCatId,
        sampleType: sampleType,
        fastingRequired: fastingReq,
        reportTimeHours: reportHrs,
        price: 500 + (testCounter * 50) % 3000,
        originalPrice: 700 + (testCounter * 50) % 4000,
        discount: "20% OFF",
        reportTime: `${reportHrs} Hours`,
        description: `Diagnostic test for ${tName}.`
      });
    });
  }
});

TEST_CATEGORIES[0].count = TESTS.length;

export const PATHOLOGY_CATEGORIES = TEST_CATEGORIES;

export const HOSPITALS = [
  {
    id: "ibn-sina",
    name: "Ibn Sina Healthcare Group",
    id: "square-hospital-dhaka",
    name: "Square Hospital Ltd.",
    branch: "Panthapath, Dhaka",
    tagline: "Premier Tertiary Care Hospital & Critical Emergency Center",
    type: "Hospital",
    badge: "Verified Hospital",
    rating: 4.9,
    reviewsCount: 380,
    is_verified: true,
    city: "Dhaka",
    district: "Dhaka",
    location: "Panthapath, West Dhanmondi",
    address: "18/F, Bir Uttam Qazi Nuruzzaman Sarak, West Panthapath, Dhaka 1205",
    openTiming: "24/7 Emergency & Pharmacy Service",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80",
    categories: [{ id: "multispecialty", name: "Multi-Specialty" }, { id: "cardiac", name: "Cardiac Hospitals" }],
    doctors: [
      { id: "d1", name: "Prof. Dr. Shamsul Alam", specialty: "Cardiology", experience: "22+ Years Exp", qualification: "MBBS, FCPS (Cardiology), MD", fee: 1500, visitDays: "Sat, Mon, Wed", visitTime: "05:00 PM - 09:00 PM" },
      { id: "d2", name: "Dr. Farhana Ahmed", specialty: "Gynecology & Obstetrics", experience: "15+ Years Exp", qualification: "MBBS, MS (Obs & Gynae)", fee: 1200, visitDays: "Everyday (Except Fri)", visitTime: "04:00 PM - 08:00 PM" }
    ],
    services: [
      "24/7 Trauma & Emergency ICU",
      "Comprehensive Cardiac Surgery",
      "Advanced Radiology & CT 128 Slice",
      "Modern Outpatient OPD Clinics"
    ]
  },
  {
    id: "evercare-hospital-dhaka",
    name: "Evercare Hospital Dhaka",
    branch: "Bashundhara R/A",
    tagline: "JCI Accredited Multi-Specialty Tertiary Hospital",
    type: "Hospital",
    badge: "Verified Hospital",
    rating: 4.8,
    reviewsCount: 420,
    is_verified: true,
    city: "Dhaka",
    district: "Dhaka",
    location: "Bashundhara Residential Area",
    address: "Plot 81, Block E, Bashundhara R/A, Dhaka 1229",
    openTiming: "24/7 Emergency Service",
    image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80",
    categories: [{ id: "multispecialty", name: "Multi-Specialty" }, { id: "cancer", name: "Cancer Institutes" }],
    doctors: [
      { id: "d3", name: "Dr. Tanvir Rahman", specialty: "Neurology", experience: "18+ Years Exp", qualification: "MBBS, MD (Neurology)", fee: 1800, visitDays: "Sat, Tue, Thu", visitTime: "06:00 PM - 09:30 PM" }
    ],
    services: [
      "JCI Quality Patient Care",
      "Bone Marrow Transplant Unit",
      "Neuro-Interventional Surgery",
      "Emergency Air Ambulance Service"
    ]
  },
  {
    id: "labaid-specialized-hospital",
    name: "Labaid Specialized Hospital",
    branch: "Dhanmondi, Dhaka",
    tagline: "Center of Excellence for Cardiac & Gastro Care",
    type: "Hospital",
    badge: "Super Hospital",
    services: [HOSPITAL_SERVICES[0], HOSPITAL_SERVICES[1], HOSPITAL_SERVICES[2]],
    is_verified: true
  },
  {
    id: "nhf",
    name: "National Heart Foundation",
    branch: "Mirpur Branch",
    description: "Premier specialized cardiac and cardiovascular hospital institute in Bangladesh.",
    city: "Dhaka",
    district: "Dhaka",
    location: "Mirpur-2, Dhaka",
    logo: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80",
    rating: 4.95,
    reviews_count: 520,
    open_timing: "24/7 Emergency & OPD",
    services: [HOSPITAL_SERVICES[3], HOSPITAL_SERVICES[1]],
    is_verified: true
  }
];

export const DIAGNOSTIC_CENTERS = [
  {
    id: "popular-panthapath",
    name: "Popular Diagnostic Centre",
    branch: "Panthapath Branch",
    address: "House 16, Road 2, Dhanmondi / Panthapath, Dhaka",
    district: "Dhaka",
    division: "Dhaka",
    city: "Dhaka",
    location: "House 16, Road 2, Dhanmondi / Panthapath, Dhaka",
    phone: "+880 9613-787801",
    rating: 4.85,
    reviews_count: 410,
    open_timing: "07:00 AM - 11:00 PM",
    tagline: "Nationwide Leading Diagnostic & Imaging Hub",
    badge: "Verified Partner",
    image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80",
    services: [DIAGNOSTIC_SERVICES[2], DIAGNOSTIC_SERVICES[3], DIAGNOSTIC_SERVICES[4], DIAGNOSTIC_SERVICES[5]],
    is_verified: true,
    categories: [
      { id: "multi-specialty-general-diagnostic-center", name: "Multi-Specialty / General Diagnostic Center" },
      { id: "pathology-lab", name: "Diagnostic & Lab" },
      { id: "corporate-chain-multi-branch-", name: "Corporate Chain (Multi-branch)" }
    ]
  },
  {
    id: "ibn-sina-mirpur",
    name: "Ibn Sina Diagnostic Center",
    branch: "Mirpur Branch",
    address: "Plot 11, Avenue 1, Block A, Mirpur 10, Dhaka",
    district: "Dhaka",
    division: "Dhaka",
    city: "Dhaka",
    location: "Plot 11, Avenue 1, Block A, Mirpur 10, Dhaka",
    phone: "+880 9610-010616",
    rating: 4.8,
    reviews_count: 180,
    open_timing: "08:00 AM - 10:00 PM",
    tagline: "Top Diagnostic Center in Mirpur",
    badge: "Verified Partner",
    image: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=600&q=80",
    services: [DIAGNOSTIC_SERVICES[0], DIAGNOSTIC_SERVICES[1], DIAGNOSTIC_SERVICES[2], DIAGNOSTIC_SERVICES[5]],
    is_verified: true,
    categories: [
      { id: "pathology-lab", name: "Diagnostic & Lab" },
      { id: "corporate-chain-multi-branch-", name: "Corporate Chain (Multi-branch)" }
    ]
  },
  {
    id: "chevron-chittagong",
    name: "Chevron Healthcare",
    branch: "Panchlaish Branch",
    address: "12/12 O.R. Nizam Road, Panchlaish, Chittagong",
    district: "Chittagong",
    division: "Chittagong",
    city: "Chittagong",
    location: "12/12 O.R. Nizam Road, Panchlaish, Chittagong",
    phone: "+880 31-652533",
    rating: 4.9,
    reviews_count: 260,
    open_timing: "24/7 OPD & Diagnostic Service",
    tagline: "Chittagong's Most Trusted Diagnostic Center",
    badge: "Top Rated",
    image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=600&q=80",
    services: [DIAGNOSTIC_SERVICES[1], DIAGNOSTIC_SERVICES[2], DIAGNOSTIC_SERVICES[5]],
    is_verified: true,
    categories: [
      { id: "imaging-radiology-ct-mri-", name: "Imaging (Radiology/CT/MRI)" },
      { id: "private-independent-", name: "Private (Independent)" }
    ]
  },
  {
    id: "labaid-rajshahi",
    name: "Labaid Diagnostics",
    branch: "Laxmipur Branch",
    address: "Laxmipur, Rajshahi",
    district: "Rajshahi",
    division: "Rajshahi",
    city: "Rajshahi",
    location: "Laxmipur, Rajshahi",
    phone: "+880 721-772211",
    rating: 4.85,
    reviews_count: 190,
    open_timing: "08:00 AM - 09:30 PM",
    tagline: "Super Specialist Diagnostic & Clinical Lab",
    badge: "Super Partner",
    image: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=600&q=80",
    services: [DIAGNOSTIC_SERVICES[0], DIAGNOSTIC_SERVICES[2]],
    is_verified: true,
    categories: [
      { id: "cardiac-diagnostics", name: "Cardiac Diagnostics" },
      { id: "corporate-chain-multi-branch-", name: "Corporate Chain (Multi-branch)" }
    ]
  },
  {
    id: "nins-agargaon",
    name: "National Institute of Neurosciences Lab",
    branch: "Agargaon Branch",
    address: "Sher-e-Bangla Nagar, Agargaon, Dhaka",
    district: "Dhaka",
    division: "Dhaka",
    city: "Dhaka",
    location: "Agargaon, Dhaka",
    phone: "+880 2-9137300",
    rating: 4.75,
    reviews_count: 310,
    open_timing: "24/7 Government Emergency & Diagnostic",
    tagline: "National Specialized Government Neuro Diagnostics Center",
    badge: "Govt Institute",
    image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80",
    services: [DIAGNOSTIC_SERVICES[1], DIAGNOSTIC_SERVICES[3], DIAGNOSTIC_SERVICES[4]],
    is_verified: true,
    categories: [
      { id: "neuro-diagnostics", name: "Neuro Diagnostics" },
      { id: "government-diagnostic-center", name: "Government Diagnostic Center" }
    ]
  },
  {
    id: "icddrb-mohakhali",
    name: "icddr,b Diagnostic Center",
    branch: "Mohakhali Branch",
    address: "68 Shaheed Tajuddin Ahmed Sarani, Mohakhali, Dhaka",
    district: "Dhaka",
    division: "Dhaka",
    city: "Dhaka",
    location: "Mohakhali, Dhaka",
    phone: "+880 2-9840521",
    rating: 4.95,
    reviews_count: 640,
    open_timing: "07:30 AM - 08:30 PM",
    tagline: "World-Class International Research & Molecular Lab",
    badge: "Top Research Lab",
    image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80",
    services: [DIAGNOSTIC_SERVICES[2], DIAGNOSTIC_SERVICES[5]],
    is_verified: true,
    categories: [
      { id: "genetic-molecular-testing", name: "Genetic & Molecular" },
      { id: "pathology-lab", name: "Diagnostic & Lab" },
      { id: "private-independent-", name: "Private" }
    ]
  },
  {
    id: "evercare-bashundhara",
    name: "Evercare Diagnostic Wing",
    branch: "Bashundhara Branch",
    address: "Plot 81, Block E, Bashundhara R/A, Dhaka",
    district: "Dhaka",
    division: "Dhaka",
    city: "Dhaka",
    location: "Bashundhara R/A, Dhaka",
    phone: "+880 9666-710678",
    rating: 4.9,
    reviews_count: 420,
    open_timing: "24/7 Diagnostic & Hospital Lab",
    tagline: "JCI Accredited Hospital-Affiliated Diagnostic Wing",
    badge: "JCI Accredited",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80",
    services: [DIAGNOSTIC_SERVICES[2], DIAGNOSTIC_SERVICES[3], DIAGNOSTIC_SERVICES[4], DIAGNOSTIC_SERVICES[5]],
    is_verified: true,
    categories: [
      { id: "hospital-affiliated-lab", name: "Hospital-Affiliated Lab" },
      { id: "imaging-radiology-ct-mri-", name: "Imaging (Radiology/CT/MRI)" },
      { id: "multi-specialty-general-diagnostic-center", name: "Multi-Specialty / General Diagnostic Center" }
    ]
  }
];

export const OPD_CHAMBERS = DIAGNOSTIC_CENTERS;

export const PATHOLOGY_TESTS = TESTS;

export const DIAGNOSTIC_CENTER_TESTS = [
  // Popular Diagnostic Centre (Multi-Specialty & Blood Lab)
  {
    id: 1,
    center_id: "popular-panthapath",
    center_name: "Popular Diagnostic Centre - Panthapath",
    test_id: "test-1",
    test_details: TESTS[0],
    price: 500,
    original_price: 650,
    discount: "23% OFF",
    report_time: "6 Hours",
    home_sample_collection: true
  },
  {
    id: 2,
    center_id: "popular-panthapath",
    center_name: "Popular Diagnostic Centre - Panthapath",
    test_id: "test-3",
    test_details: TESTS[2] || TESTS[0],
    price: 250,
    original_price: 300,
    discount: "17% OFF",
    report_time: "4 Hours",
    home_sample_collection: true
  },
  {
    id: 3,
    center_id: "popular-panthapath",
    center_name: "Popular Diagnostic Centre - Panthapath",
    test_id: "test-31",
    test_details: TESTS[30] || TESTS[0],
    price: 4800,
    original_price: 6200,
    discount: "22% OFF",
    report_time: "4 Hours",
    home_sample_collection: false
  },

  // Ibn Sina Diagnostic Center (Blood & Pathology Lab)
  {
    id: 4,
    center_id: "ibn-sina-mirpur",
    center_name: "Ibn Sina Diagnostic Center - Mirpur",
    test_id: "test-1",
    test_details: TESTS[0],
    price: 400,
    original_price: 550,
    discount: "27% OFF",
    report_time: "4 Hours",
    home_sample_collection: true
  },
  {
    id: 5,
    center_id: "ibn-sina-mirpur",
    center_name: "Ibn Sina Diagnostic Center - Mirpur",
    test_id: "test-5",
    test_details: TESTS[4] || TESTS[0],
    price: 1500,
    original_price: 2000,
    discount: "25% OFF",
    report_time: "2 Hours",
    home_sample_collection: false
  },

  // Chevron Healthcare (Imaging & Radiology Center)
  {
    id: 6,
    center_id: "chevron-chittagong",
    center_name: "Chevron Healthcare - Chittagong",
    test_id: "test-35",
    test_details: TESTS[34] || TESTS[0],
    price: 6500,
    original_price: 8500,
    discount: "24% OFF",
    report_time: "6 Hours",
    home_sample_collection: false
  },
  {
    id: 7,
    center_id: "chevron-chittagong",
    center_name: "Chevron Healthcare - Chittagong",
    test_id: "test-30",
    test_details: TESTS[29] || TESTS[0],
    price: 4500,
    original_price: 6000,
    discount: "25% OFF",
    report_time: "4 Hours",
    home_sample_collection: false
  },

  // Labaid Diagnostics (Cardiac & Vascular Diagnostics)
  {
    id: 8,
    center_id: "labaid-rajshahi",
    center_name: "Labaid Diagnostics - Rajshahi",
    test_id: "test-40",
    test_details: TESTS[39] || TESTS[0],
    price: 2200,
    original_price: 2800,
    discount: "21% OFF",
    report_time: "2 Hours",
    home_sample_collection: false
  },
  {
    id: 9,
    center_id: "labaid-rajshahi",
    center_name: "Labaid Diagnostics - Rajshahi",
    test_id: "test-42",
    test_details: TESTS[41] || TESTS[0],
    price: 2500,
    original_price: 3200,
    discount: "22% OFF",
    report_time: "2 Hours",
    home_sample_collection: false
  },

  // National Institute of Neurosciences Lab (Neuro Diagnostics)
  {
    id: 10,
    center_id: "nins-agargaon",
    center_name: "National Institute of Neurosciences Lab",
    test_id: "test-50",
    test_details: TESTS[49] || TESTS[0],
    price: 1200,
    original_price: 1600,
    discount: "25% OFF",
    report_time: "4 Hours",
    home_sample_collection: false
  },
  {
    id: 11,
    center_id: "nins-agargaon",
    center_name: "National Institute of Neurosciences Lab",
    test_id: "test-51",
    test_details: TESTS[50] || TESTS[0],
    price: 2500,
    original_price: 3200,
    discount: "22% OFF",
    report_time: "4 Hours",
    home_sample_collection: false
  },

  // icddr,b Diagnostic Center (Genetic & Molecular Testing)
  {
    id: 12,
    center_id: "icddrb-mohakhali",
    center_name: "icddr,b Diagnostic Center",
    test_id: "test-60",
    test_details: TESTS[59] || TESTS[0],
    price: 3200,
    original_price: 4000,
    discount: "20% OFF",
    report_time: "24 Hours",
    home_sample_collection: true
  },
  {
    id: 13,
    center_id: "icddrb-mohakhali",
    center_name: "icddr,b Diagnostic Center",
    test_id: "test-61",
    test_details: TESTS[60] || TESTS[0],
    price: 8500,
    original_price: 10500,
    discount: "19% OFF",
    report_time: "168 Hours",
    home_sample_collection: true
  },

  // Evercare Diagnostic Wing (Hospital-Affiliated & Multi-Specialty)
  {
    id: 14,
    center_id: "evercare-bashundhara",
    center_name: "Evercare Diagnostic Wing",
    test_id: "test-35",
    test_details: TESTS[34] || TESTS[0],
    price: 7500,
    original_price: 9500,
    discount: "21% OFF",
    report_time: "6 Hours",
    home_sample_collection: false
  },
  {
    id: 15,
    center_id: "evercare-bashundhara",
    center_name: "Evercare Diagnostic Wing",
    test_id: "test-1",
    test_details: TESTS[0],
    price: 600,
    original_price: 750,
    discount: "20% OFF",
    report_time: "4 Hours",
    home_sample_collection: true
  }
];

export const BRANCH_TESTS = DIAGNOSTIC_CENTER_TESTS;

export const TESTIMONIALS = [
  {
    id: 1,
    name: "Tanvir Hossain",
    location: "Uttara, Dhaka",
    role: "Patient",
    comment: "DoctorHub BD made finding diagnostic center tests and specialist doctors super smooth!",
    rating: 5
  }
];
