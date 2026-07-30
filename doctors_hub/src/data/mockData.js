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
  { id: "all", name: "All Hospital Partners", icon: "Building2", description: "Show All Multi-Specialty Institutes", count: 12 },
  { id: "cardiac", name: "Cardiac Hospitals", icon: "Heart", description: "Specialized Heart Institutes", count: 4 },
  { id: "eye", name: "Eye Hospitals", icon: "Sparkles", description: "Ophthalmology & Vision Care", count: 3 },
  { id: "multispecialty", name: "Multi-Specialty", icon: "Building2", description: "General & In-Patient Hubs", count: 8 },
  { id: "orthopedic", name: "Orthopedic Centers", icon: "Activity", description: "Bone, Joint & Spine Care", count: 3 }
];

// Alias for backward compatibility
export const HOSPITAL_SPECIALTIES = HOSPITAL_CATEGORIES;

export const DIAGNOSTIC_CENTER_CATEGORIES = [
  { id: "all", name: "All Center Categories", icon: "Building2", parent: null },
  { id: "private-chain", name: "Private Diagnostic Chain", icon: "Building2", parent: null },
  { id: "gov-labs", name: "Government & Public Labs", icon: "ShieldCheck", parent: null },
  { id: "specialized-centers", name: "Specialized Diagnostic Centers", icon: "Activity", parent: null },
  { id: "pathology-biochem", name: "Pathology & Clinical Biochemistry", icon: "FlaskConical", parent: "private-chain" },
  { id: "radiology-imaging", name: "Advanced Radiology & Imaging Hubs", icon: "FileText", parent: "private-chain" },
  { id: "cardiac-diagnostics", name: "Cardiac Diagnostics & Echo Centers", icon: "Heart", parent: "specialized-centers" }
];

export const TEST_CATEGORIES = [
  { id: "all", name: "All Test Categories", icon: "FlaskConical", description: "All Pathology & Imaging Tests", count: 18 },
  { id: "routine-blood", name: "Routine Blood Profiles", icon: "Droplet", description: "CBC, Hemoglobin & ESR", count: 8 },
  { id: "hormone-profiles", name: "Hormone & Endocrine Profiles", icon: "Sparkles", description: "Thyroid T3, T4, TSH & Diabetes", count: 5 },
  { id: "ct-mri-imaging", name: "CT Scan & MRI Imaging", icon: "FileText", description: "Brain, Chest & Abdomen Scans", count: 5 },
  { id: "ultrasound", name: "Ultrasonography (USG)", icon: "Activity", description: "4D Abdomen & Pelvic Sonography", count: 4 },
  { id: "lipid-cardiac", name: "Lipid & Cardiac Profiles", icon: "Heart", description: "Cholesterol, Lipid Panel & Troponin-I", count: 3 }
];

// Backward compatibility alias
export const PATHOLOGY_CATEGORIES = TEST_CATEGORIES;

export const HOSPITALS = [
  {
    id: "ibn-sina",
    name: "Ibn Sina Healthcare Group",
    description: "Leading nationwide hospital network offering multi-branch inpatient & outpatient services.",
    city: "Dhaka",
    district: "Dhaka",
    location: "House 48, Road 9/A, Dhanmondi, Dhaka",
    logo: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80",
    rating: 4.9,
    reviews_count: 320,
    open_timing: "24/7 Inpatient & OPD",
    is_verified: true
  },
  {
    id: "nhf",
    name: "National Heart Foundation",
    description: "Premier specialized cardiac and cardiovascular hospital institute in Bangladesh.",
    city: "Dhaka",
    district: "Dhaka",
    location: "Mirpur-2, Dhaka",
    logo: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80",
    rating: 4.95,
    reviews_count: 520,
    open_timing: "24/7 Emergency & OPD",
    is_verified: true
  }
];

export const DIAGNOSTIC_CENTERS = [
  {
    id: "popular-panthapath",
    name: "Popular Diagnostic Centre - Panthapath",
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
    services: ["Specialist Visiting Doctor OPD", "Advanced MRI", "Full Automated Pathology", "128-Slice CT Scan"],
    is_verified: true,
    categories: [{ id: "pathology-biochem", name: "Pathology & Clinical Biochemistry" }]
  },
  {
    id: "ibn-sina-mirpur",
    name: "Ibn Sina Diagnostic Center - Mirpur",
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
    services: ["4D USG", "Digital X-Ray", "Blood Collection", "Visiting Specialist OPD"],
    is_verified: true,
    categories: [{ id: "pathology-biochem", name: "Pathology & Clinical Biochemistry" }]
  },
  {
    id: "chevron-chittagong",
    name: "Chevron Healthcare - Chittagong",
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
    services: ["24/7 Emergency OPD", "Digital X-Ray", "Home Sample Collection"],
    is_verified: true,
    categories: [{ id: "pathology-biochem", name: "Pathology & Clinical Biochemistry" }]
  }
];

// Alias for backward compatibility
export const OPD_CHAMBERS = DIAGNOSTIC_CENTERS;

export const TESTS = [
  {
    id: "cbc",
    name: "Blood Test (CBC)",
    category: "Routine Blood Profiles",
    categoryGroup: "routine-blood",
    fastingRequired: false,
    price: 450,
    originalPrice: 600,
    discount: "25% OFF",
    reportTime: "Same Day (6 Hours)",
    description: "Complete Blood Count measuring RBC, WBC, ESR, Platelets, and Hemoglobin."
  },
  {
    id: "thyroid",
    name: "Thyroid Profile (T3, T4, TSH)",
    category: "Hormone & Endocrine Profiles",
    categoryGroup: "hormone-profiles",
    fastingRequired: false,
    price: 1100,
    originalPrice: 1500,
    discount: "26% OFF",
    reportTime: "12 Hours",
    description: "Accurate endocrine hormone evaluation for thyroid disorders."
  },
  {
    id: "ct-scan",
    name: "CT Scan (Brain / Chest)",
    category: "CT Scan & MRI Imaging",
    categoryGroup: "ct-mri-imaging",
    fastingRequired: true,
    price: 4500,
    originalPrice: 6000,
    discount: "25% OFF",
    reportTime: "24 Hours",
    description: "High-resolution computed tomography scan for detailed internal organ imaging."
  },
  {
    id: "usg",
    name: "USG (Ultrasound Abdomen)",
    category: "Ultrasonography (USG)",
    categoryGroup: "ultrasound",
    fastingRequired: true,
    price: 1500,
    originalPrice: 2000,
    discount: "25% OFF",
    reportTime: "4 Hours",
    description: "Full abdominal 4D ultrasonography for liver, kidney, and pelvic examination."
  },
  {
    id: "lipid",
    name: "Lipid Profile (Cholesterol)",
    category: "Lipid & Cardiac Profiles",
    categoryGroup: "lipid-cardiac",
    fastingRequired: true,
    price: 1200,
    originalPrice: 1600,
    discount: "25% OFF",
    reportTime: "12 Hours",
    description: "Measures Total Cholesterol, HDL, LDL, Triglycerides, and Cardiac Risk Index."
  }
];

// Alias for backward compatibility
export const PATHOLOGY_TESTS = TESTS;

export const DIAGNOSTIC_CENTER_TESTS = [
  {
    id: 1,
    center_id: "popular-panthapath",
    center_name: "Popular Diagnostic Centre - Panthapath",
    test_id: "cbc",
    test_details: TESTS[0],
    price: 500,
    original_price: 650,
    discount: "23% OFF",
    report_time: "8 Hours",
    home_sample_collection: true
  },
  {
    id: 2,
    center_id: "ibn-sina-mirpur",
    center_name: "Ibn Sina Diagnostic Center - Mirpur",
    test_id: "cbc",
    test_details: TESTS[0],
    price: 400,
    original_price: 550,
    discount: "27% OFF",
    report_time: "Same Day (4 Hours)",
    home_sample_collection: true
  },
  {
    id: 3,
    center_id: "popular-panthapath",
    center_name: "Popular Diagnostic Centre - Panthapath",
    test_id: "ct-scan",
    test_details: TESTS[2],
    price: 4800,
    original_price: 6200,
    discount: "22% OFF",
    report_time: "12 Hours",
    home_sample_collection: false
  }
];

// Alias for backward compatibility
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
