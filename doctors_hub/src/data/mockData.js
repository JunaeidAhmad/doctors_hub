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
    fastingRequired: false,
    description: "Complete Blood Count measuring RBC, WBC, ESR, Platelets, and Hemoglobin."
  },
  {
    id: "ct-scan",
    name: "CT Scan (Brain / Chest)",
    category: "Advanced Radiology",
    fastingRequired: true,
    description: "High-resolution computed tomography scan for detailed internal organ imaging."
  },
  {
    id: "usg",
    name: "USG (Ultrasound Abdomen)",
    category: "Sonography",
    fastingRequired: true,
    description: "Full abdominal 4D ultrasonography for liver, kidney, and pelvic examination."
  },
  {
    id: "lipid",
    name: "Lipid Profile (Cholesterol)",
    category: "Cardiac Risk",
    fastingRequired: true,
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
    id: "ibn-sina-dhanmondi",
    hospital_id: "ibn-sina",
    hospital_name: "Ibn Sina Healthcare Group",
    name: "Ibn Sina Hospital & Diagnostic - Dhanmondi",
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
        specialties: [{ id: "cardiology", name: "Cardiologist" }],
        qualification: "MBBS, FCPS (Medicine), MD (Cardiology), FACC (USA)",
        experience: "22+ Yrs Exp.",
        affiliations: [
          {
            id: 1,
            consultation_type: "OPD",
            branch_id: "ibn-sina-dhanmondi",
            branch_name: "Ibn Sina Hospital - Dhanmondi",
            city: "Dhaka",
            fee: 1200,
            schedules: [
              { id: 1, day_of_week: "Sat", start_time: "17:00", end_time: "21:00" },
              { id: 2, day_of_week: "Mon", start_time: "17:00", end_time: "21:00" },
              { id: 3, day_of_week: "Wed", start_time: "17:00", end_time: "21:00" }
            ]
          },
          {
            id: 2,
            consultation_type: "In-patient",
            branch_id: "ibn-sina-dhanmondi",
            branch_name: "Ibn Sina Hospital - Dhanmondi",
            city: "Dhaka",
            fee: 2000,
            schedules: [
              { id: 4, day_of_week: "Everyday", start_time: "09:00", end_time: "13:00" }
            ]
          }
        ]
      },
      {
        id: "doc-2",
        name: "Dr. Sharmin Sultana",
        specialties: [{ id: "gynecology", name: "Gynecologist" }, { id: "dermatology", name: "Dermatologist" }],
        qualification: "MBBS, FCPS (Obstetrics & Gynecology), MS",
        experience: "14+ Yrs Exp.",
        affiliations: [
          {
            id: 3,
            consultation_type: "OPD",
            branch_id: "ibn-sina-dhanmondi",
            branch_name: "Ibn Sina Hospital - Dhanmondi",
            city: "Dhaka",
            fee: 1000,
            schedules: [
              { id: 5, day_of_week: "Sun", start_time: "16:00", end_time: "20:00" },
              { id: 6, day_of_week: "Thu", start_time: "16:00", end_time: "20:00" }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "popular-panthapath",
    hospital_id: "popular",
    hospital_name: "Popular Diagnostic & Medical Center",
    name: "Popular Diagnostic Centre & Super Clinic",
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
        specialties: [{ id: "neurology", name: "Neurologist" }],
        qualification: "MBBS, FCPS (Medicine), MD (Neurology), FRCP",
        experience: "25+ Yrs Exp.",
        affiliations: [
          {
            id: 4,
            consultation_type: "In-patient",
            branch_id: "popular-panthapath",
            branch_name: "Popular Diagnostic - Panthapath",
            city: "Dhaka",
            fee: 1500,
            schedules: [
              { id: 7, day_of_week: "Sat", start_time: "18:00", end_time: "21:30" },
              { id: 8, day_of_week: "Mon", start_time: "18:00", end_time: "21:30" }
            ]
          }
        ]
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
