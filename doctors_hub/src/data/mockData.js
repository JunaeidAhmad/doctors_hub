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

export const HOSPITAL_SPECIALTIES = [
  { id: "all", name: "All Partners", icon: "Building2", description: "Show All Hospitals & Labs", count: 24 },
  { id: "cardiac", name: "Cardiac Hospitals", icon: "Heart", description: "Specialized Heart Institutes", count: 6 },
  { id: "eye", name: "Eye Hospitals", icon: "Sparkles", description: "Ophthalmology & Vision Care", count: 5 },
  { id: "multispecialty", name: "Multi-Specialty", icon: "Building2", description: "General & In-Patient Hubs", count: 8 },
  { id: "diagnostic", name: "Diagnostic Centers", icon: "FlaskConical", description: "Pathology & Imaging Labs", count: 12 },
  { id: "orthopedic", name: "Orthopedic Centers", icon: "Activity", description: "Bone, Joint & Spine Care", count: 4 }
];

export const PATHOLOGY_CATEGORIES = [
  { id: "all", name: "All Packages", icon: "FlaskConical", description: "All Tests & Health Profiles", count: 18 },
  { id: "blood", name: "Blood Tests", icon: "Droplet", description: "CBC, Hemoglobin & Serology", count: 8 },
  { id: "radiology", name: "Radiology & Scans", icon: "FileText", description: "CT Scan, MRI & X-Ray", count: 5 },
  { id: "usg", name: "Ultrasonography", icon: "Activity", description: "4D Ultrasound & Doppler", count: 4 },
  { id: "cardiac_profile", name: "Cardiac Profiles", icon: "Heart", description: "Lipid, ECG & Troponin-I", count: 3 }
];

export const HOSPITALS = [
  {
    id: "ibn-sina",
    name: "Ibn Sina Healthcare Group",
    description: "Leading nationwide hospital network offering multi-branch inpatient & outpatient services.",
    logo: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "popular",
    name: "Popular Diagnostic & Medical Center",
    description: "Nationwide healthcare pioneer providing state-of-the-art diagnostic imaging and specialist doctor chambers.",
    logo: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80"
  }
];

export const PATHOLOGY_TESTS = [
  {
    id: "cbc",
    name: "Blood Test (CBC)",
    category: "Routine Blood Profiles",
    categoryGroup: "blood",
    fastingRequired: false,
    price: 450,
    originalPrice: 600,
    discount: "25% OFF",
    reportTime: "Same Day (6 Hours)",
    description: "Complete Blood Count measuring RBC, WBC, ESR, Platelets, and Hemoglobin."
  },
  {
    id: "ct-scan",
    name: "CT Scan (Brain / Chest)",
    category: "Advanced Radiology",
    categoryGroup: "radiology",
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
    category: "Sonography",
    categoryGroup: "usg",
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
    category: "Cardiac Risk",
    categoryGroup: "cardiac_profile",
    fastingRequired: true,
    price: 1200,
    originalPrice: 1600,
    discount: "25% OFF",
    reportTime: "12 Hours",
    description: "Measures Total Cholesterol, HDL, LDL, Triglycerides, and Cardiac Risk Index."
  }
];

export const BRANCH_TESTS = [
  {
    id: 1,
    branch_id: "ibn-sina-dhanmondi",
    branch_name: "Ibn Sina Hospital - Dhanmondi",
    test_id: "cbc",
    test_details: PATHOLOGY_TESTS[0],
    price: 450,
    original_price: 600,
    discount: "25% OFF",
    report_time: "Same Day (6 Hours)"
  },
  {
    id: 2,
    branch_id: "ibn-sina-mirpur",
    branch_name: "Ibn Sina Diagnostic - Mirpur",
    test_id: "cbc",
    test_details: PATHOLOGY_TESTS[0],
    price: 400,
    original_price: 550,
    discount: "27% OFF",
    report_time: "Same Day (4 Hours)"
  },
  {
    id: 3,
    branch_id: "popular-panthapath",
    branch_name: "Popular Diagnostic - Panthapath",
    test_id: "cbc",
    test_details: PATHOLOGY_TESTS[0],
    price: 500,
    original_price: 650,
    discount: "23% OFF",
    report_time: "8 Hours"
  },
  {
    id: 4,
    branch_id: "ibn-sina-dhanmondi",
    branch_name: "Ibn Sina Hospital - Dhanmondi",
    test_id: "ct-scan",
    test_details: PATHOLOGY_TESTS[1],
    price: 4500,
    original_price: 6000,
    discount: "25% OFF",
    report_time: "24 Hours"
  },
  {
    id: 5,
    branch_id: "popular-panthapath",
    branch_name: "Popular Diagnostic - Panthapath",
    test_id: "ct-scan",
    test_details: PATHOLOGY_TESTS[1],
    price: 4800,
    original_price: 6200,
    discount: "22% OFF",
    report_time: "12 Hours"
  }
];

export const OPD_CHAMBERS = [
  {
    id: "national-heart-institute",
    hospital_id: "nhf",
    hospital_name: "National Heart Foundation",
    name: "National Heart Foundation & Research Institute",
    specialtyCategory: "cardiac",
    facility_types: ["Hospital", "Cardiac Center"],
    location: "Mirpur-2, Dhaka",
    city: "Dhaka",
    verified: true,
    rating: 4.95,
    reviewsCount: 520,
    openTiming: "24/7 Emergency & OPD",
    contactPhone: "+880 2-9006970",
    tagline: "Premier Specialized Cardiac & Cardiovascular Hospital in Bangladesh",
    badge: "Cardiac Center",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80",
    description: "Specialized cardiac care hospital equipped with catheterization labs and cardiac surgery suites.",
    services: ["Coronary Angiogram", "Bypass Surgery", "Echocardiogram", "24/7 Cardiac Emergency"],
    doctors: [
      {
        id: "doc-cardiac-1",
        name: "Prof. Dr. M. A. Zaman",
        specialty: "Cardiologist",
        qualification: "MBBS, FCPS (Medicine), MD (Cardiology), FACC",
        experience: "25+ Yrs Exp.",
        visitDays: "Sat, Mon, Wed",
        visitTime: "05:00 PM - 09:00 PM",
        fee: 1500
      }
    ]
  },
  {
    id: "islamia-eye-hospital",
    hospital_id: "islamia-eye",
    hospital_name: "Ispahani Islamia Eye Institute",
    name: "Ispahani Islamia Eye Institute & Hospital",
    specialtyCategory: "eye",
    facility_types: ["Hospital", "Eye Specialty"],
    location: "Farmgate, Sher-e-Bangla Nagar, Dhaka",
    city: "Dhaka",
    verified: true,
    rating: 4.9,
    reviewsCount: 480,
    openTiming: "08:00 AM - 08:00 PM",
    contactPhone: "+880 9610-008080",
    tagline: "Largest Pioneer Ophthalmic Care & Eye Hospital in Bangladesh",
    badge: "Eye Center",
    image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80",
    description: "Premier eye hospital providing cataract, cornea, retina, and pediatric ophthalmology care.",
    services: ["Phaco Cataract Surgery", "Lasik Vision Correction", "Retina Surgery", "Glaucoma Care"],
    doctors: [
      {
        id: "doc-eye-1",
        name: "Prof. Dr. Nazrul Islam",
        specialty: "Eye Specialist",
        qualification: "MBBS, FCPS (Ophthalmology), DO",
        experience: "20+ Yrs Exp.",
        visitDays: "Sun, Tue, Thu",
        visitTime: "04:00 PM - 08:00 PM",
        fee: 1200
      }
    ]
  },
  {
    id: "ibn-sina-dhanmondi",
    hospital_id: "ibn-sina",
    hospital_name: "Ibn Sina Healthcare Group",
    name: "Ibn Sina Hospital & Diagnostic - Dhanmondi",
    specialtyCategory: "multispecialty",
    facility_types: ["Hospital", "Diagnostic Center"],
    location: "House 48, Road 9/A, Dhanmondi, Dhaka",
    city: "Dhaka",
    verified: true,
    rating: 4.9,
    reviewsCount: 320,
    openTiming: "07:30 AM - 10:30 PM",
    contactPhone: "+880 9610-010615 / +880 1711-234567",
    tagline: "Premier Multispecialty OPD & Diagnostic Center in Bangladesh",
    badge: "Super Partner",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80",
    description: "Ibn Sina Diagnostic & OPD Hub Dhanmondi is one of Bangladesh's premier healthcare and diagnostic facilities.",
    services: [
      "24/7 Specialist OPD Consultation",
      "High-Resolution 128-Slice CT Scan",
      "4D Ultrasonography & Color Doppler",
      "Automated Clinical Pathology & Biochemistry",
      "Home Blood Sample Collection"
    ],
    doctors: [
      {
        id: "doc-1",
        name: "Prof. Dr. A. K. M. Fazlul Haque",
        specialty: "Cardiologist",
        qualification: "MBBS, FCPS (Medicine), MD (Cardiology), FACC (USA)",
        experience: "22+ Yrs Exp.",
        visitDays: "Sat, Mon, Wed",
        visitTime: "05:00 PM - 09:00 PM",
        fee: 1200
      },
      {
        id: "doc-2",
        name: "Dr. Sharmin Sultana",
        specialty: "Gynecologist",
        qualification: "MBBS, FCPS (Obstetrics & Gynecology), MS",
        experience: "14+ Yrs Exp.",
        visitDays: "Sun, Thu",
        visitTime: "04:00 PM - 08:00 PM",
        fee: 1000
      }
    ]
  },
  {
    id: "popular-panthapath",
    hospital_id: "popular",
    hospital_name: "Popular Diagnostic & Medical Center",
    name: "Popular Diagnostic Centre & Super Clinic",
    specialtyCategory: "diagnostic",
    facility_types: ["Hospital", "Diagnostic Center"],
    location: "House 16, Road 2, Dhanmondi / Panthapath, Dhaka",
    city: "Dhaka",
    verified: true,
    rating: 4.85,
    reviewsCount: 410,
    openTiming: "07:00 AM - 11:00 PM",
    contactPhone: "+880 9613-787801 / +880 1819-876543",
    tagline: "Nationwide Leading Diagnostic & Specialist Doctor OPD Network",
    badge: "Verified Partner",
    image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80",
    description: "Popular Diagnostic Centre is a nationwide healthcare pioneer.",
    services: [
      "Specialist Visiting Doctor OPD",
      "Advanced MRI & High-Speed CT Scan",
      "Full Automated Pathology & Serology"
    ],
    doctors: [
      {
        id: "doc-3",
        name: "Prof. Dr. Syed Atiqul Haq",
        specialty: "Neurologist",
        qualification: "MBBS, FCPS (Medicine), MD (Neurology), FRCP",
        experience: "25+ Yrs Exp.",
        visitDays: "Sat, Mon",
        visitTime: "06:00 PM - 09:30 PM",
        fee: 1500
      }
    ]
  }
];

export const TESTIMONIALS = [
  {
    id: 1,
    name: "Tanvir Hossain",
    location: "Uttara, Dhaka",
    role: "Patient",
    comment: "DoctorHub BD made finding specialist doctor chamber visiting hours at Dhanmondi Ibn Sina super smooth!",
    rating: 5
  }
];
