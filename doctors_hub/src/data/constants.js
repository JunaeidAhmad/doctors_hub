// ==========================================
// BANGLADESH ADMINISTRATIVE GEOGRAPHY
// 8 Divisions, 64 Districts, 600+ Upazilas & Thanas
// ==========================================

export const DIVISIONS = [
  "Dhaka",
  "Chattogram",
  "Rajshahi",
  "Khulna",
  "Barishal",
  "Sylhet",
  "Rangpur",
  "Mymensingh"
];

// Division to District mapping (64 districts)
export const DIVISION_DISTRICTS = {
  "Dhaka": [
    "Dhaka", "Gazipur", "Narayanganj", "Tangail", "Narsingdi", 
    "Faridpur", "Manikganj", "Munshiganj", "Gopalganj", "Madaripur", 
    "Rajbari", "Shariatpur", "Kishoreganj"
  ],
  "Chattogram": [
    "Chattogram", "Cox's Bazar", "Cumilla", "Noakhali", "Feni", 
    "Brahmanbaria", "Chandpur", "Lakshmipur", "Rangamati", "Bandarban", 
    "Khagrachhari"
  ],
  "Rajshahi": [
    "Rajshahi", "Bogura", "Pabna", "Sirajganj", "Naogaon", 
    "Natore", "Chapainawabganj", "Joypurhat"
  ],
  "Khulna": [
    "Khulna", "Jashore", "Kushtia", "Jhenaidah", "Satkhira", 
    "Bagerhat", "Chuadanga", "Magura", "Meherpur", "Narail"
  ],
  "Barishal": [
    "Barishal", "Patuakhali", "Bhola", "Pirojpur", "Barguna", "Jhalakathi"
  ],
  "Sylhet": [
    "Sylhet", "Moulvibazar", "Habiganj", "Sunamganj"
  ],
  "Rangpur": [
    "Rangpur", "Dinajpur", "Kurigram", "Gaibandha", "Nilphamari", 
    "Lalmonirhat", "Panchagarh", "Thakurgaon"
  ],
  "Mymensingh": [
    "Mymensingh", "Jamalpur", "Netrokona", "Sherpur"
  ]
};

// District to Thanas & Upazilas mapping (All 64 Districts)
export const DISTRICT_THANAS = {
  // DHAKA DIVISION (13)
  "Dhaka": [
    "Dhanmondi", "Mirpur", "Uttara", "Gulshan", "Banani", "Panthapath", 
    "Motijheel", "Mohammadpur", "Badda", "Savar", "Farmgate", "Tejgaon", 
    "Malibagh", "Shyamoli", "Rampura", "Jatrabari", "Lalbagh", "Khilgaon", 
    "Keraniganj", "Dhamrai", "Dohar", "Nawabganj", "Adabor", "Bangshal", 
    "Biman Bandar", "Cantonment", "Chawkbazar", "Dakshinkhan", "Darus Salam", 
    "Demra", "Gendaria", "Hazaribagh", "Kadamtali", "Kafrul", "Kalabagan", 
    "Kamrangirchar", "Khilkhet", "Kotwali", "New Market", "Pallabi", "Paltan", 
    "Ramna", "Sabujbagh", "Shah Ali", "Shahbagh", "Sher-e-Bangla Nagar", 
    "Shyampur", "Sutrapur", "Tejgaon Industrial Area", "Turag", "Uttar Khan", 
    "Vatara", "Wari", "Basabo", "Mugdha", "Shantinagar", "Kakrail", "Moghbazar"
  ],
  "Gazipur": [
    "Gazipur Sadar", "Tongi", "Kaliakair", "Kaliganj", "Kapasia", "Sreepur", 
    "Board Bazar", "Chowrasta", "Konabari", "Joydebpur"
  ],
  "Narayanganj": [
    "Narayanganj Sadar", "Bandar", "Fatullah", "Siddhirganj", "Rupganj", 
    "Sonargaon", "Araihazar", "Chashara", "Kanchpur"
  ],
  "Tangail": [
    "Tangail Sadar", "Basail", "Bhuapur", "Delduar", "Dhanbari", "Ghatail", 
    "Gopalpur", "Kalihati", "Madhupur", "Mirzapur", "Nagarpur", "Sakhipur"
  ],
  "Narsingdi": [
    "Narsingdi Sadar", "Belabo", "Monohardi", "Palash", "Raipura", "Shibpur"
  ],
  "Faridpur": [
    "Faridpur Sadar", "Alfadanga", "Bhanga", "Boalmari", "Charbhadrasan", 
    "Madhukhali", "Nagarkanda", "Sadarpur", "Saltha"
  ],
  "Manikganj": [
    "Manikganj Sadar", "Daulatpur", "Ghior", "Harirampur", "Saturia", 
    "Shivalaya", "Singair"
  ],
  "Munshiganj": [
    "Munshiganj Sadar", "Gazaria", "Louhajang", "Sirajdikhan", "Sreenagar", 
    "Tongibari"
  ],
  "Gopalganj": [
    "Gopalganj Sadar", "Kashiani", "Kotalipara", "Muksudpur", "Tungipara"
  ],
  "Madaripur": [
    "Madaripur Sadar", "Kalkini", "Rajoir", "Shibchar", "Dasar"
  ],
  "Rajbari": [
    "Rajbari Sadar", "Baliakandi", "Goalandaghat", "Pangsha", "Kalukhali"
  ],
  "Shariatpur": [
    "Shariatpur Sadar", "Bhedarganj", "Damudya", "Gosairhat", "Naria", "Zanjira"
  ],
  "Kishoreganj": [
    "Kishoreganj Sadar", "Austagram", "Bajitpur", "Bhairab", "Hossainpur", 
    "Itna", "Karimganj", "Katiadi", "Kuliarchar", "Mithamain", "Nikli", 
    "Pakundia", "Tarail"
  ],

  // CHATTOGRAM DIVISION (11)
  "Chattogram": [
    "Agrabad", "GEC Circle", "Panchlaish", "Halishahar", "Nasirabad", 
    "Chawkbazar", "Khulshi", "Kotwali", "Patenga", "Pahartali", "Bakalia", 
    "Bayazid", "Chandgaon", "Double Mooring", "EPZ", "Karnaphuli", 
    "Sadarghat", "Akbar Shah", "Anwara", "Banshkhali", "Boalkhali", 
    "Chandanaish", "Fatikchhari", "Hathazari", "Lohagara", "Mirsharai", 
    "Patiya", "Rangunia", "Raozan", "Sandwip", "Satkania", "Sitakunda"
  ],
  "Cox's Bazar": [
    "Cox's Bazar Sadar", "Chakaria", "Maheshkhali", "Kutubdia", "Pekua", 
    "Ramu", "Teknaf", "Ukhia", "Eidgaon"
  ],
  "Cumilla": [
    "Cumilla Adarsha Sadar", "Cumilla Sadar Dakshin", "Kandirpar", "Jhawtala", 
    "Badurtala", "Tomsom Bridge", "Barura", "Brahmanpara", "Burichang", 
    "Chandina", "Chauddagram", "Daudkandi", "Debidwar", "Homna", "Laksam", 
    "Lalmai", "Meghna", "Monohargonj", "Muradnagar", "Nangalkot", "Titas"
  ],
  "Noakhali": [
    "Noakhali Sadar", "Begumganj", "Chatkhil", "Companiganj", "Hatiya", 
    "Kabirhat", "Senbagh", "Sonaimuri", "Subarnachar", "Maijdee"
  ],
  "Feni": [
    "Feni Sadar", "Chhagalnaiya", "Daganbhuiyan", "Parshuram", "Fulgazi", "Sonagazi"
  ],
  "Brahmanbaria": [
    "Brahmanbaria Sadar", "Akhaura", "Ashuganj", "Bancharampur", "Bijoynagar", 
    "Kasba", "Nabinagar", "Nasirnagar", "Sarail"
  ],
  "Chandpur": [
    "Chandpur Sadar", "Faridganj", "Haimchar", "Hajiganj", "Kachua", 
    "Matlab Dakshin", "Matlab Uttar", "Shahrasti"
  ],
  "Lakshmipur": [
    "Lakshmipur Sadar", "Raipur", "Ramganj", "Ramgati", "Kamalnagar"
  ],
  "Rangamati": [
    "Rangamati Sadar", "Baghaichhari", "Barkal", "Belaichhari", "Juraichhari", 
    "Kaptai", "Kawkhali", "Langadu", "Naniarchar", "Rajasthali"
  ],
  "Bandarban": [
    "Bandarban Sadar", "Alikadam", "Lama", "Naikhongchhari", "Rowangchhari", 
    "Ruma", "Thanchi"
  ],
  "Khagrachhari": [
    "Khagrachhari Sadar", "Dighinala", "Guimara", "Lakshmichhari", "Mahalchhari", 
    "Manikchhari", "Matiranga", "Panchhari", "Ramgarh"
  ],

  // RAJSHAHI DIVISION (8)
  "Rajshahi": [
    "Boalia", "Motihar", "Rajputra", "Shaheb Bazar", "Shah Makhdum", 
    "Laxmipur", "Kazla", "New Market", "Upashahar", "Chandrima", 
    "Kashiadanga", "Katakhali", "Airport", "Bagha", "Bagmara", "Charghat", 
    "Durgapur", "Godagari", "Mohanpur", "Paba", "Puthia", "Tanore"
  ],
  "Bogura": [
    "Bogura Sadar", "Adamdighi", "Dhunat", "Dhupchanchia", "Gabtali", 
    "Kahaloo", "Nandigram", "Sariakandi", "Shajahanpur", "Sherpur", 
    "Shibganj", "Sonatala"
  ],
  "Pabna": [
    "Pabna Sadar", "Atgharia", "Bera", "Bhangura", "Chatmohar", "Faridpur", 
    "Ishwardi", "Santhia", "Sujanagar"
  ],
  "Sirajganj": [
    "Sirajganj Sadar", "Belkuchi", "Chauhali", "Kamarkhanda", "Kazipur", 
    "Raiganj", "Shahjadpur", "Tarash", "Ullahpara"
  ],
  "Naogaon": [
    "Naogaon Sadar", "Atrai", "Badalgachhi", "Dhamoirhat", "Manda", 
    "Mohadevpur", "Niamatpur", "Patnitala", "Porsha", "Raninagar", "Sapahar"
  ],
  "Natore": [
    "Natore Sadar", "Bagatipara", "Baraigram", "Gurudaspur", "Lalpur", 
    "Naldanga", "Singra"
  ],
  "Chapainawabganj": [
    "Chapainawabganj Sadar", "Bholahat", "Gomastapur", "Nachole", "Shibganj"
  ],
  "Joypurhat": [
    "Joypurhat Sadar", "Akkelpur", "Kalai", "Khetlal", "Panchbibi"
  ],

  // KHULNA DIVISION (10)
  "Khulna": [
    "KDA Avenue", "Sonadanga", "Boyra", "Khalishpur", "Daulatpur", 
    "Rupsha", "Gollamari", "Khan Jahan Ali", "Kotwali", "Harintana", 
    "Aranghata", "Batiaghata", "Dacope", "Dumuria", "Dighalia", 
    "Koyra", "Paikgachha", "Phultala", "Terokhada"
  ],
  "Jashore": [
    "Jashore Sadar", "Abhaynagar", "Bagherpara", "Chaukgachha", "Jhikargachha", 
    "Keshabpur", "Manirampur", "Sharsha"
  ],
  "Kushtia": [
    "Kushtia Sadar", "Bheramara", "Daulatpur", "Khoksa", "Kumarkhali", "Mirpur"
  ],
  "Jhenaidah": [
    "Jhenaidah Sadar", "Harinakunda", "Kaliganj", "Kotchandpur", "Maheshpur", "Shailkupa"
  ],
  "Satkhira": [
    "Satkhira Sadar", "Assasuni", "Debhata", "Kalaroa", "Kaliganj", 
    "Shyamnagar", "Tala"
  ],
  "Bagerhat": [
    "Bagerhat Sadar", "Chitalmari", "Fakirhat", "Kachua", "Mollahat", 
    "Mongla", "Morrelganj", "Rampal", "Sarankhola"
  ],
  "Chuadanga": [
    "Chuadanga Sadar", "Alamdanga", "Damurhuda", "Jibannagar"
  ],
  "Magura": [
    "Magura Sadar", "Mohammadpur", "Shalikha", "Sreepur"
  ],
  "Meherpur": [
    "Meherpur Sadar", "Gangni", "Mujibnagar"
  ],
  "Narail": [
    "Narail Sadar", "Kalia", "Lohagara"
  ],

  // BARISHAL DIVISION (6)
  "Barishal": [
    "Sadar Road", "Rupatali", "Natun Bazar", "C&B Road", "Alekanda", 
    "Jordan Road", "Kashipur", "Kotwali", "Airport", "Kawnia", "Bandar", 
    "Agailjhara", "Babuganj", "Bakerganj", "Banaripara", "Gaurnadi", 
    "Hizla", "Mehendiganj", "Muladi", "Wazirpur"
  ],
  "Patuakhali": [
    "Patuakhali Sadar", "Bauphal", "Dashmina", "Dumki", "Galachipa", 
    "Kalapara", "Mirzaganj", "Rangabali", "Kuakata"
  ],
  "Bhola": [
    "Bhola Sadar", "Burhanuddin", "Char Fasson", "Daulatkhan", "Lalmohan", 
    "Manpura", "Tazumuddin"
  ],
  "Pirojpur": [
    "Pirojpur Sadar", "Bhandaria", "Kawkhali", "Mathbaria", "Nazirpur", 
    "Nesarabad (Swarupkati)", "Indurkani"
  ],
  "Barguna": [
    "Barguna Sadar", "Amtali", "Bamna", "Betagi", "Patharghata", "Taltali"
  ],
  "Jhalakathi": [
    "Jhalakathi Sadar", "Kathalia", "Nalchity", "Rajapur"
  ],

  // SYLHET DIVISION (4)
  "Sylhet": [
    "Zindabazar", "Nayasarak", "Amberkhana", "Chauhatta", "Subidbazar", 
    "Tilagarh", "Shibganj", "Kadamtali", "Shahjalal Uposahar", "Kotwali", 
    "Jalalabad", "Airport", "Moglabazar", "Shah Paran", "South Surma", 
    "Balaganj", "Beanibazar", "Bishwanath", "Companiganj", "Fenchuganj", 
    "Golapganj", "Gowainghat", "Jaintiapur", "Kanaighat", "Osmani Nagar", "Zakiganj"
  ],
  "Moulvibazar": [
    "Moulvibazar Sadar", "Barlekha", "Juri", "Kamalganj", "Kulaura", 
    "Rajnagar", "Sreemangal"
  ],
  "Habiganj": [
    "Habiganj Sadar", "Ajmiriganj", "Bahubal", "Baniyachong", "Chunarughat", 
    "Lakhai", "Madhabpur", "Nabiganj", "Sayestaganj"
  ],
  "Sunamganj": [
    "Sunamganj Sadar", "Bishwamvarpur", "Chhatak", "Derai", "Dharamapasha", 
    "Dowarabazar", "Jagannathpur", "Jamalganj", "Sullah", "Tahirpur", "Shantiganj"
  ],

  // RANGPUR DIVISION (8)
  "Rangpur": [
    "Park More", "Medical East Gate", "Jahaj Company More", "Dhap", 
    "Carmel Road", "Pairaband", "Kotwali", "Tazhat", "Haragach", 
    "Mahiganj", "Parshuram", "Hazirhat", "Badarganj", "Gangachhara", 
    "Kaunia", "Mithapukur", "Pirgachha", "Pirganj", "Taraganj"
  ],
  "Dinajpur": [
    "Dinajpur Sadar", "Birampur", "Birganj", "Birol", "Bochaganj", 
    "Chirirbandar", "Phulbari", "Ghoraghat", "Hakimpur", "Kaharole", 
    "Khansama", "Nawabganj", "Parbatipur"
  ],
  "Kurigram": [
    "Kurigram Sadar", "Bhurungamari", "Char Rajibpur", "Chilmari", "Phulbari", 
    "Nageshwari", "Rajarhat", "Rowmari", "Ulipur"
  ],
  "Gaibandha": [
    "Gaibandha Sadar", "Phulchhari", "Gobindaganj", "Palashbari", 
    "Sadullapur", "Sughatta", "Sundarganj"
  ],
  "Nilphamari": [
    "Nilphamari Sadar", "Dimla", "Domar", "Jaldhaka", "Kishoreganj", "Saidpur"
  ],
  "Lalmonirhat": [
    "Lalmonirhat Sadar", "Aditmari", "Hatibandha", "Kaliganj", "Patgram"
  ],
  "Panchagarh": [
    "Panchagarh Sadar", "Atwari", "Boda", "Debiganj", "Tetulia"
  ],
  "Thakurgaon": [
    "Thakurgaon Sadar", "Baliadangi", "Haripur", "Pirganj", "Ranisankail"
  ],

  // MYMENSINGH DIVISION (4)
  "Mymensingh": [
    "Charpara", "Ganginarpar", "Town Hall", "Maskanda", "Akua", 
    "Kewatkhali", "Patuakhali Road", "Kotwali", "Bhaluka", "Dhobaura", 
    "Fulbaria", "Gaffargaon", "Gauripur", "Haluaghat", "Ishwarganj", 
    "Muktagachha", "Nandail", "Phulpur", "Tara Khanda", "Trishal"
  ],
  "Jamalpur": [
    "Jamalpur Sadar", "Bakshiganj", "Dewanganj", "Islampur", "Madarganj", 
    "Melandaha", "Sarishabari"
  ],
  "Netrokona": [
    "Netrokona Sadar", "Atpara", "Barhatta", "Durgapur", "Kalmakanda", 
    "Kendua", "Madan", "Mohanganj", "Purbadhala", "Khaliajuri"
  ],
  "Sherpur": [
    "Sherpur Sadar", "Jhenaigati", "Nakla", "Nalitabari", "Sreebardi"
  ]
};

// Aliases for historical / alternate spellings
export const DISTRICT_ALIASES = {
  "Chittagong": "Chattogram",
  "Comilla": "Cumilla",
  "Bogra": "Bogura",
  "Jessore": "Jashore",
  "Barisal": "Barishal"
};

// All 64 Districts sorted alphabetically
export const ALL_DISTRICTS = Object.keys(DISTRICT_THANAS).sort();

// Backward compatibility alias for CITY_THANAS (with aliases mapped)
export const CITY_THANAS = {
  ...DISTRICT_THANAS,
  "Chittagong": DISTRICT_THANAS["Chattogram"] || [],
  "Comilla": DISTRICT_THANAS["Cumilla"] || [],
  "Bogra": DISTRICT_THANAS["Bogura"] || [],
  "Jessore": DISTRICT_THANAS["Jashore"] || [],
  "Barisal": DISTRICT_THANAS["Barishal"] || []
};

// Backward-compatible locations list for quick select
export const LOCATIONS = [
  "All Bangladesh",
  ...ALL_DISTRICTS
];

// Helper: Normalize location or district name
export function normalizeLocationName(name) {
  if (!name) return '';
  const trimmed = String(name).trim();
  return DISTRICT_ALIASES[trimmed] || trimmed;
}

// Helper: Get all districts for a given division
export function getDistrictsForDivision(division) {
  if (!division || division === 'all' || division === 'All Bangladesh') {
    return ALL_DISTRICTS;
  }
  const normDiv = normalizeLocationName(division);
  return DIVISION_DISTRICTS[normDiv] || DIVISION_DISTRICTS[division] || [];
}

// Helper: Get thanas/upazilas for a district
export function getThanasForDistrict(district) {
  if (!district || district === 'all') return [];
  const normDist = normalizeLocationName(district);
  return DISTRICT_THANAS[normDist] || DISTRICT_THANAS[district] || CITY_THANAS[district] || [];
}

// Helper: Find which division a district belongs to
export function findDivisionForDistrict(district) {
  if (!district) return '';
  const normDist = normalizeLocationName(district);
  for (const [div, dists] of Object.entries(DIVISION_DISTRICTS)) {
    if (dists.some(d => d.toLowerCase() === normDist.toLowerCase() || d.toLowerCase() === String(district).toLowerCase())) {
      return div;
    }
  }
  return '';
}

