from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify
from facilities.models import Division, District, Thana


# ============================================================================
# BANGLADESH GEOGRAPHIC DATASET
# 8 Divisions, 64 Districts, 600+ Thanas & Upazilas (with English & Bengali)
# ============================================================================

DIVISIONS_DATA = [
    {"name": "Dhaka", "bn_name": "ঢাকা", "order": 1},
    {"name": "Chattogram", "bn_name": "চট্টগ্রাম", "order": 2},
    {"name": "Rajshahi", "bn_name": "রাজশাহী", "order": 3},
    {"name": "Khulna", "bn_name": "খুলনা", "order": 4},
    {"name": "Barishal", "bn_name": "বরিশাল", "order": 5},
    {"name": "Sylhet", "bn_name": "সিলেট", "order": 6},
    {"name": "Rangpur", "bn_name": "রংপুর", "order": 7},
    {"name": "Mymensingh", "bn_name": "ময়মনসিংহ", "order": 8},
]

DISTRICTS_DATA = {
    # DHAKA DIVISION (13)
    "Dhaka": [
        ("Dhaka", "ঢাকা"), ("Gazipur", "গাজীপুর"), ("Narayanganj", "নারায়ণগঞ্জ"),
        ("Tangail", "টাঙ্গাইল"), ("Narsingdi", "নরসিংদী"), ("Faridpur", "ফরিদপুর"),
        ("Manikganj", "মানিকগঞ্জ"), ("Munshiganj", "মুন্সীগঞ্জ"), ("Gopalganj", "গোপালগঞ্জ"),
        ("Madaripur", "মাদারীপুর"), ("Rajbari", "রাজবাড়ী"), ("Shariatpur", "শরীয়তপুর"),
        ("Kishoreganj", "কিশোরগঞ্জ"),
    ],
    # CHATTOGRAM DIVISION (11)
    "Chattogram": [
        ("Chattogram", "চট্টগ্রাম"), ("Cox's Bazar", "কক্সবাজার"), ("Cumilla", "কুমিল্লা"),
        ("Noakhali", "নোয়াখালী"), ("Feni", "ফেনী"), ("Brahmanbaria", "ব্রাহ্মণবাড়িয়া"),
        ("Chandpur", "চাঁদপুর"), ("Lakshmipur", "লক্ষ্মীপুর"), ("Rangamati", "রাঙ্গামাটি"),
        ("Bandarban", "বান্দরবান"), ("Khagrachhari", "খাগড়াছড়ি"),
    ],
    # RAJSHAHI DIVISION (8)
    "Rajshahi": [
        ("Rajshahi", "রাজশাহী"), ("Bogura", "বগুড়া"), ("Pabna", "পাবনা"),
        ("Sirajganj", "সিরাজগঞ্জ"), ("Naogaon", "নওগাঁ"), ("Natore", "নাটোর"),
        ("Chapainawabganj", "চাঁপাইনবাবগঞ্জ"), ("Joypurhat", "জয়পুরহাট"),
    ],
    # KHULNA DIVISION (10)
    "Khulna": [
        ("Khulna", "খুলনা"), ("Jashore", "যশোর"), ("Kushtia", "কুষ্টিয়া"),
        ("Jhenaidah", "ঝিনাইদহ"), ("Satkhira", "সাতক্ষীরা"), ("Bagerhat", "বাগেরহাট"),
        ("Chuadanga", "চুয়াডাঙ্গা"), ("Magura", "মাগুরা"), ("Meherpur", "মেহেরপুর"),
        ("Narail", "নড়াইল"),
    ],
    # BARISHAL DIVISION (6)
    "Barishal": [
        ("Barishal", "বরিশাল"), ("Patuakhali", "পটুয়াখালী"), ("Bhola", "ভোলা"),
        ("Pirojpur", "পিরোজপুর"), ("Barguna", "বরগুনা"), ("Jhalakathi", "ঝালকাঠি"),
    ],
    # SYLHET DIVISION (4)
    "Sylhet": [
        ("Sylhet", "সিলেট"), ("Moulvibazar", "মৌলভীবাজার"), ("Habiganj", "হবিগঞ্জ"),
        ("Sunamganj", "সুনামগঞ্জ"),
    ],
    # RANGPUR DIVISION (8)
    "Rangpur": [
        ("Rangpur", "রংপুর"), ("Dinajpur", "দিনাজপুর"), ("Kurigram", "কুড়িগ্রাম"),
        ("Gaibandha", "গাইবান্ধা"), ("Nilphamari", "নীলফামারী"), ("Lalmonirhat", "লালমনিরহাট"),
        ("Panchagarh", "পঞ্চগড়"), ("Thakurgaon", "ঠাকুরগাঁও"),
    ],
    # MYMENSINGH DIVISION (4)
    "Mymensingh": [
        ("Mymensingh", "ময়মনসিংহ"), ("Jamalpur", "জামালপুর"), ("Netrokona", "নেত্রকোণা"),
        ("Sherpur", "শেরপুর"),
    ],
}

# District name aliases (Historical / Alternate spellings)
DISTRICT_ALIASES = {
    "chittagong": "Chattogram",
    "comilla": "Cumilla",
    "bogra": "Bogura",
    "jessore": "Jashore",
    "barisal": "Barishal",
    "dhaka": "Dhaka",
    "ঢাকা": "Dhaka",
    "চট্টগ্রাম": "Chattogram",
    "সিলেট": "Sylhet",
}

DISTRICT_THANAS_DATA = {
    # DHAKA DIVISION
    "Dhaka": [
        ("Dhanmondi", "ধানমন্ডি"), ("Mirpur", "মিরপুর"), ("Uttara", "উত্তরা"),
        ("Gulshan", "গুলশান"), ("Banani", "বনানী"), ("Panthapath", "পান্থপথ"),
        ("Motijheel", "মতিঝিল"), ("Mohammadpur", "মোহাম্মদপুর"), ("Badda", "বাড্ডা"),
        ("Savar", "সাভার"), ("Farmgate", "ফার্মগেট"), ("Tejgaon", "তেজগাঁও"),
        ("Malibagh", "মালিবাগ"), ("Shyamoli", "শ্যামলী"), ("Rampura", "রামপুরা"),
        ("Jatrabari", "যাত্রাবাড়ী"), ("Lalbagh", "লালবাগ"), ("Khilgaon", "খিলগাঁও"),
        ("Keraniganj", "কেরানীগঞ্জ"), ("Dhamrai", "ধামরাই"), ("Dohar", "দোহার"),
        ("Nawabganj", "নবাবগঞ্জ"), ("Adabor", "আদাবর"), ("Bangshal", "বংশাল"),
        ("Biman Bandar", "বিমানবন্দর"), ("Cantonment", "ক্যান্টনমেন্ট"), ("Chawkbazar", "চকবাজার"),
        ("Dakshinkhan", "দক্ষিণখান"), ("Darus Salam", "দারুস সালাম"), ("Demra", "ডেমরা"),
        ("Gendaria", "গেন্ডারিয়া"), ("Hazaribagh", "হাজারীবাগ"), ("Kadamtali", "কদমতলী"),
        ("Kafrul", "কাফরুল"), ("Kalabagan", "কলাবাগান"), ("Kamrangirchar", "কামরাঙ্গীরচর"),
        ("Khilkhet", "খিলক্ষেত"), ("Kotwali", "কোতোয়ালী"), ("New Market", "নিউ মার্কেট"),
        ("Pallabi", "পল্লবী"), ("Paltan", "পল্টন"), ("Ramna", "রমনা"),
        ("Sabujbagh", "সবুজবাগ"), ("Shah Ali", "শাহ আলী"), ("Shahbagh", "শাহবাগ"),
        ("Sher-e-Bangla Nagar", "শেরেবাংলা নগর"), ("Shyampur", "শ্যামপুর"),
        ("Sutrapur", "সূত্রাপুর"), ("Tejgaon Industrial Area", "তেজগাঁও শিল্পাঞ্চল"),
        ("Turag", "তুরাগ"), ("Uttar Khan", "উত্তরখান"), ("Vatara", "ভাটারা"),
        ("Wari", "ওয়ারী"), ("Basabo", "বাসাবো"), ("Mugdha", "মুগদা"),
        ("Shantinagar", "শান্তিনগর"), ("Kakrail", "কাকরাইল"), ("Moghbazar", "মগবাজার"),
        ("Mohakhali", "মহাখালী"), ("Bashundhara", "বসুন্ধরা"),
    ],
    "Gazipur": [
        ("Gazipur Sadar", "গাজীপুর সদর"), ("Tongi", "টঙ্গী"), ("Kaliakair", "কালিয়াকৈর"),
        ("Kaliganj", "কালীগঞ্জ"), ("Kapasia", "কাপাসিয়া"), ("Sreepur", "শ্রীপুর"),
        ("Board Bazar", "বোর্ড বাজার"), ("Chowrasta", "চৌরাস্তা"), ("Konabari", "কোনাবাড়ী"),
        ("Joydebpur", "জয়দেবপুর"),
    ],
    "Narayanganj": [
        ("Narayanganj Sadar", "নারায়ণগঞ্জ সদর"), ("Bandar", "বন্দর"), ("Fatullah", "ফতুল্লা"),
        ("Siddhirganj", "সিদ্ধিরগঞ্জ"), ("Rupganj", "রূপগঞ্জ"), ("Sonargaon", "সোনারগাঁও"),
        ("Araihazar", "আড়াইহাজার"), ("Chashara", "চাষাড়া"), ("Kanchpur", "কাঁচপুর"),
    ],
    "Tangail": [
        ("Tangail Sadar", "টাঙ্গাইল সদর"), ("Basail", "বাসাইল"), ("Bhuapur", "ভূঞাপুর"),
        ("Delduar", "দেলদুয়ার"), ("Dhanbari", "ধনবাড়ী"), ("Ghatail", "ঘাটাইল"),
        ("Gopalpur", "গোপালপুর"), ("Kalihati", "কালিহাতী"), ("Madhupur", "মধুপুর"),
        ("Mirzapur", "মির্জাপুর"), ("Nagarpur", "নাগরপুর"), ("Sakhipur", "সখীপুর"),
    ],
    "Narsingdi": [
        ("Narsingdi Sadar", "নরসিংদী সদর"), ("Belabo", "বেলাবো"), ("Monohardi", "মনোহরদী"),
        ("Palash", "পলাশ"), ("Raipura", "রায়পুরা"), ("Shibpur", "শিবপুর"),
    ],
    "Faridpur": [
        ("Faridpur Sadar", "ফরিদপুর সদর"), ("Alfadanga", "আলফাডাঙ্গা"), ("Bhanga", "ভাঙ্গা"),
        ("Boalmari", "বোয়ালমারী"), ("Charbhadrasan", "চরভদ্রাসন"), ("Madhukhali", "মধুখালী"),
        ("Nagarkanda", "নগরকান্দা"), ("Sadarpur", "সদরপুর"), ("Saltha", "সালথা"),
    ],
    "Manikganj": [
        ("Manikganj Sadar", "মানিকগঞ্জ সদর"), ("Daulatpur", "দৌলতপুর"), ("Ghior", "ঘিওর"),
        ("Harirampur", "হরিরামপুর"), ("Saturia", "সাটুরিয়া"), ("Shivalaya", "শিবালয়"),
        ("Singair", "সিংগাইর"),
    ],
    "Munshiganj": [
        ("Munshiganj Sadar", "মুন্সীগঞ্জ সদর"), ("Gazaria", "গজারিয়া"), ("Louhajang", "লৌহজং"),
        ("Sirajdikhan", "সিরাজদিখান"), ("Sreenagar", "শ্রীনগর"), ("Tongibari", "টঙ্গীবাড়ী"),
    ],
    "Gopalganj": [
        ("Gopalganj Sadar", "গোপালগঞ্জ সদর"), ("Kashiani", "কাশিয়ানী"), ("Kotalipara", "কোটালীপাড়া"),
        ("Muksudpur", "মুকসুদপুর"), ("Tungipara", "টুঙ্গিপাড়া"),
    ],
    "Madaripur": [
        ("Madaripur Sadar", "মাদারীপুর সদর"), ("Kalkini", "কালকিনি"), ("Rajoir", "রাজৈর"),
        ("Shibchar", "শিবচর"), ("Dasar", "ডাসার"),
    ],
    "Rajbari": [
        ("Rajbari Sadar", "রাজবাড়ী সদর"), ("Baliakandi", "বালিয়াকান্দি"),
        ("Goalandaghat", "গোয়ালন্দঘাট"), ("Pangsha", "পাংশা"), ("Kalukhali", "কালুখালী"),
    ],
    "Shariatpur": [
        ("Shariatpur Sadar", "শরীয়তপুর সদর"), ("Bhedarganj", "ভেদরগঞ্জ"),
        ("Damudya", "ডামুড্যা"), ("Gosairhat", "গোসাইরহাট"), ("Naria", "নড়িয়া"),
        ("Zanjira", "জাজিরা"),
    ],
    "Kishoreganj": [
        ("Kishoreganj Sadar", "কিশোরগঞ্জ সদর"), ("Austagram", "অষ্টগ্রাম"), ("Bajitpur", "বাজিতপুর"),
        ("Bhairab", "ভৈরব"), ("Hossainpur", "হোসেনপুর"), ("Itna", "ইটনা"),
        ("Karimganj", "করিমগঞ্জ"), ("Katiadi", "কটিয়াদী"), ("Kuliarchar", "কুলিয়ারচর"),
        ("Mithamain", "মিঠামইন"), ("Nikli", "নিকলী"), ("Pakundia", "পাকুন্দিয়া"),
        ("Tarail", "তাড়াইল"),
    ],

    # CHATTOGRAM DIVISION
    "Chattogram": [
        ("Agrabad", "আগ্রাবাদ"), ("GEC Circle", "জিইসি মোড়"), ("Panchlaish", "পাঁচলাইশ"),
        ("Halishahar", "হালিশহর"), ("Nasirabad", "নাসিরাবাদ"), ("Chawkbazar", "চকবাজার"),
        ("Khulshi", "খুলশী"), ("Kotwali", "কোতোয়ালী"), ("Patenga", "পতেঙ্গা"),
        ("Pahartali", "পাহাড়তলী"), ("Bakalia", "বাকলিয়া"), ("Bayazid", "বায়োজিদ"),
        ("Chandgaon", "চাঁদগাঁও"), ("Double Mooring", "ডবল মুরিং"), ("EPZ", "ইপিজেড"),
        ("Karnaphuli", "কর্ণফুলী"), ("Sadarghat", "সদরঘাট"), ("Akbar Shah", "আকবর শাহ"),
        ("Anwara", "আনোয়ারা"), ("Banshkhali", "বাঁশখালী"), ("Boalkhali", "বোয়ালখালী"),
        ("Chandanaish", "চন্দনাইশ"), ("Fatikchhari", "ফটিকছড়ি"), ("Hathazari", "হাটহাজারী"),
        ("Lohagara", "লোহাগাড়া"), ("Mirsharai", "মীরসরাই"), ("Patiya", "পটিয়া"),
        ("Rangunia", "রাঙ্গুনিয়া"), ("Raozan", "রাউজান"), ("Sandwip", "সন্দ্বীপ"),
        ("Satkania", "সাতকানিয়া"), ("Sitakunda", "সীতাকুণ্ড"),
    ],
    "Cox's Bazar": [
        ("Cox's Bazar Sadar", "কক্সবাজার সদর"), ("Chakaria", "চকোরিয়া"),
        ("Maheshkhali", "মহেশখালী"), ("Kutubdia", "কুতুবদিয়া"), ("Pekua", "পেকুয়া"),
        ("Ramu", "রামু"), ("Teknaf", "টেকনাফ"), ("Ukhia", "উখিয়া"), ("Eidgaon", "ঈদগাঁও"),
    ],
    "Cumilla": [
        ("Cumilla Adarsha Sadar", "কুমিল্লা আদর্শ সদর"), ("Cumilla Sadar Dakshin", "কুমিল্লা সদর দক্ষিণ"),
        ("Kandirpar", "কান্দিরপাড়"), ("Jhawtala", "ঝাউতলা"), ("Badurtala", "বাদুড়তলা"),
        ("Tomsom Bridge", "টমসম ব্রিজ"), ("Barura", "বরুড়া"), ("Brahmanpara", "ব্রাহ্মণপাড়া"),
        ("Burichang", "বুড়িচং"), ("Chandina", "চান্দিনা"), ("Chauddagram", "চৌদ্দগ্রাম"),
        ("Daudkandi", "দাউদকান্দি"), ("Debidwar", "দেবিদ্বার"), ("Homna", "হোমনা"),
        ("Laksam", "লাকসাম"), ("Lalmai", "লালমাই"), ("Meghna", "মেঘনা"),
        ("Monohargonj", "মনোহরগঞ্জ"), ("Muradnagar", "মুরাদনগর"), ("Nangalkot", "নাঙ্গলকোট"),
        ("Titas", "তিতাস"),
    ],
    "Noakhali": [
        ("Noakhali Sadar", "নোয়াখালী সদর"), ("Begumganj", "বেগমগঞ্জ"), ("Chatkhil", "চাটখিল"),
        ("Companiganj", "কোম্পানীগঞ্জ"), ("Hatiya", "হাতিয়া"), ("Kabirhat", "কবিরহাট"),
        ("Senbagh", "সেনবাগ"), ("Sonaimuri", "সোনাইমুড়ী"), ("Subarnachar", "সুবর্ণচর"),
        ("Maijdee", "মাইজদী"),
    ],
    "Feni": [
        ("Feni Sadar", "ফেনী সদর"), ("Chhagalnaiya", "ছাগলনাইয়া"), ("Daganbhuiyan", "দাগনভূঞা"),
        ("Parshuram", "পরশুরাম"), ("Fulgazi", "ফুলগাজী"), ("Sonagazi", "সোনাগাজী"),
    ],
    "Brahmanbaria": [
        ("Brahmanbaria Sadar", "ব্রাহ্মণবাড়িয়া সদর"), ("Akhaura", "আখাউড়া"),
        ("Ashuganj", "আশুগঞ্জ"), ("Bancharampur", "বাঞ্ছারামপুর"), ("Bijoynagar", "বিজয়নগর"),
        ("Kasba", "কসবা"), ("Nabinagar", "নবীনগর"), ("Nasirnagar", "নাসিরনগর"),
        ("Sarail", "সরাইল"),
    ],
    "Chandpur": [
        ("Chandpur Sadar", "চাঁদপুর সদর"), ("Faridganj", "ফরিদগঞ্জ"), ("Haimchar", "হাইমচর"),
        ("Hajiganj", "হাজীগঞ্জ"), ("Kachua", "কচুয়া"), ("Matlab Dakshin", "মতলব দক্ষিণ"),
        ("Matlab Uttar", "মতলব উত্তর"), ("Shahrasti", "শাহরাস্তি"),
    ],
    "Lakshmipur": [
        ("Lakshmipur Sadar", "লক্ষ্মীপুর সদর"), ("Raipur", "রায়পুর"), ("Ramganj", "রামগঞ্জ"),
        ("Ramgati", "রামগতি"), ("Kamalnagar", "কমলনগর"),
    ],
    "Rangamati": [
        ("Rangamati Sadar", "রাঙ্গামাটি সদর"), ("Baghaichhari", "বাঘাইছড়ি"),
        ("Barkal", "বরকল"), ("Belaichhari", "বিলাইছড়ি"), ("Juraichhari", "জুরাইছড়ি"),
        ("Kaptai", "কাপ্তাই"), ("Kawkhali", "কাউখালী"), ("Langadu", "লংগদু"),
        ("Naniarchar", "নানিয়ারচর"), ("Rajasthali", "রাজস্থলী"),
    ],
    "Bandarban": [
        ("Bandarban Sadar", "বান্দরবান সদর"), ("Ali Kadam", "আলীকদম"), ("Lama", "লামা"),
        ("Naikhongchhari", "নাইক্ষ্যংছড়ি"), ("Rowangchhari", "রোয়াংছড়ি"),
        ("Ruma", "রুমা"), ("Thanchi", "থানচি"),
    ],
    "Khagrachhari": [
        ("Khagrachhari Sadar", "খাগড়াছড়ি সদর"), ("Dighinala", "দীঘিনালা"),
        ("Lakshmichhari", "লক্ষ্মীছড়ি"), ("Mahalchhari", "মহালছড়ি"),
        ("Manikchhari", "মানিকছড়ি"), ("Matiranga", "মাটিরাঙ্গা"),
        ("Panchhari", "পানছড়ি"), ("Ramgarh", "রামগড়"), ("Guimara", "গুইমারা"),
    ],

    # RAJSHAHI DIVISION
    "Rajshahi": [
        ("Rajshahi Sadar", "রাজশাহী সদর"), ("Boalia", "বোয়ালিয়া"), ("Motihar", "মতিহার"),
        ("Rajpara", "রাজপাড়া"), ("Shah Mokdum", "শাহ মখদুম"), ("Bagha", "বাঘা"),
        ("Bagmara", "বাগমারা"), ("Charghat", "চারঘাট"), ("Durgapur", "দুর্গাপুর"),
        ("Godagari", "গোদাগাড়ী"), ("Mohanpur", "মোহনপুর"), ("Paba", "পবা"),
        ("Puthia", "পুঠিয়া"), ("Tanore", "তানোর"),
    ],
    "Bogura": [
        ("Bogura Sadar", "বগুড়া সদর"), ("Adamdighi", "আদমদীঘি"), ("Dhunat", "ধুনট"),
        ("Dhupchanchia", "দুপচাঁচিয়া"), ("Gabtali", "গাবতলী"), ("Kahaloo", "কাহালু"),
        ("Nandigram", "নন্দীগ্রাম"), ("Sariakandi", "সারিয়াকান্দি"), ("Shajahanpur", "শাজাহানপুর"),
        ("Sherpur", "শেরপুর"), ("Shibganj", "শিবগঞ্জ"), ("Sonatala", "সোনাতলা"),
    ],
    "Pabna": [
        ("Pabna Sadar", "পাবনা সদর"), ("Atgharia", "আটঘরিয়া"), ("Bera", "বেড়া"),
        ("Bhangura", "ভাঙ্গুড়া"), ("Chatmohar", "চাটমোহর"), ("Faridpur", "ফরিদপুর"),
        ("Ishwardi", "ঈশ্বরদী"), ("Santhia", "সাঁথিয়া"), ("Sujanagar", "সুজানগর"),
    ],
    "Sirajganj": [
        ("Sirajganj Sadar", "সিরাজগঞ্জ সদর"), ("Belkuchi", "বেলকুচি"),
        ("Chauhali", "চৌহালী"), ("Kamarkhanda", "কামারখন্দ"), ("Kazipur", "কাজীপুর"),
        ("Raiganj", "রায়গঞ্জ"), ("Shahjadpur", "শাহজাদপুর"), ("Tarash", "তাড়াশ"),
        ("Ullapara", "উল্লাপাড়া"),
    ],
    "Naogaon": [
        ("Naogaon Sadar", "নওগাঁ সদর"), ("Atrai", "আত্রাই"), ("Badalgachhi", "বদলগাছী"),
        ("Dhamoirhat", "ধামইরহাট"), ("Manda", "মান্দা"), ("Mohadevpur", "মহাদেবপুর"),
        ("Niamatpur", "নিয়ামতপুর"), ("Patnitala", "পত্নীতলা"), ("Porsha", "পোরশা"),
        ("Raninagar", "রাণীনগর"), ("Sapahar", "সাপাহার"),
    ],
    "Natore": [
        ("Natore Sadar", "নাটোর সদর"), ("Bagatipara", "বাগাতিপাড়া"), ("Baraigram", "বড়াইগ্রাম"),
        ("Gurudaspur", "গুরুদাসপুর"), ("Lalpur", "লালপুর"), ("Singra", "সিংড়া"),
        ("Naldanga", "নলডাঙ্গা"),
    ],
    "Chapainawabganj": [
        ("Chapainawabganj Sadar", "চাঁপাইনবাবগঞ্জ সদর"), ("Bholahat", "ভোলাহাট"),
        ("Gomastapur", "গোমস্তাপুর"), ("Nachole", "নাচোল"), ("Shibganj", "শিবগঞ্জ"),
    ],
    "Joypurhat": [
        ("Joypurhat Sadar", "জয়পুরহাট সদর"), ("Akkelpur", "আক্কেলপুর"),
        ("Kalai", "কালাই"), ("Khetlal", "ক্ষেতলাল"), ("Panchbibi", "পাঁচবিবি"),
    ],

    # KHULNA DIVISION
    "Khulna": [
        ("Khulna Sadar", "খুলনা সদর"), ("Sonadanga", "সোনাডাঙ্গা"), ("Khalishpur", "খালিশপুর"),
        ("Daulatpur", "দৌলতপুর"), ("Khan Jahan Ali", "খান জাহান আলী"), ("Batiaghata", "বটিয়াঘাটা"),
        ("Dacope", "দাকোপ"), ("Dumuria", "ডুমুরিয়া"), ("Dighalia", "দিঘলিয়া"),
        ("Koyra", "কয়রা"), ("Paikgachha", "পাইকগাছা"), ("Phultala", "ফুলতলা"),
        ("Rupsha", "রূপসা"), ("Terokhada", "তেরখাদা"),
    ],
    "Jashore": [
        ("Jashore Sadar", "যশোর সদর"), ("Abhaynagar", "অভয়নগর"), ("Bagherpara", "বাঘারপাড়া"),
        ("Chaugachha", "চৌগাছা"), ("Jhikargachha", "ঝিকরগাছা"), ("Keshabpur", "কেশবপুর"),
        ("Manirampur", "মণিরামপুর"), ("Sharsha", "শার্শা"),
    ],
    "Kushtia": [
        ("Kushtia Sadar", "কুষ্টিয়া সদর"), ("Bheramara", "ভেড়ামারা"),
        ("Daulatpur", "দৌলতপুর"), ("Khoksa", "খোকসা"), ("Kumarkhali", "কুমারখালী"),
        ("Mirpur", "মিরপুর"),
    ],
    "Jhenaidah": [
        ("Jhenaidah Sadar", "ঝিনাইদহ সদর"), ("Harinakunda", "হরিণাকুণ্ডু"),
        ("Kaliganj", "কালীগঞ্জ"), ("Kotchandpur", "কোটচাঁদপুর"),
        ("Maheshpur", "মহেশপুর"), ("Shailkupa", "শৈলকুপা"),
    ],
    "Satkhira": [
        ("Satkhira Sadar", "সাতক্ষীরা সদর"), ("Assasuni", "আশাশুনি"),
        ("Debhata", "দেবহাটা"), ("Kalaroa", "কলারোয়া"), ("Kaliganj", "কালীগঞ্জ"),
        ("Shyamnagar", "শ্যামনগর"), ("Tala", "তালা"),
    ],
    "Bagerhat": [
        ("Bagerhat Sadar", "বাগেরহাট সদর"), ("Chitalmari", "চিতলমারী"),
        ("Fakirhat", "ফকিরহাট"), ("Kachua", "কচুয়া"), ("Mollahat", "মোল্লাহাট"),
        ("Mongla", "মোংলা"), ("Morrelganj", "মোড়েলগঞ্জ"), ("Rampal", "রামপাল"),
        ("Sarankhola", "শরণখোলা"),
    ],
    "Chuadanga": [
        ("Chuadanga Sadar", "চুয়াডাঙ্গা সদর"), ("Alamdanga", "আলমডাঙ্গা"),
        ("Damurhuda", "দামুড়হুদা"), ("Jibannagar", "জীবননগর"),
    ],
    "Magura": [
        ("Magura Sadar", "মাগুরা সদর"), ("Mohammadpur", "মোহাম্মদপুর"),
        ("Shalikha", "শালিখা"), ("Sreepur", "শ্রীপুর"),
    ],
    "Meherpur": [
        ("Meherpur Sadar", "মেহেরপুর সদর"), ("Gangni", "গাংনী"), ("Mujibnagar", "মুজিবনগর"),
    ],
    "Narail": [
        ("Narail Sadar", "নড়াইল সদর"), ("Kalia", "কালিয়া"), ("Lohagara", "লোহাগাড়া"),
    ],

    # BARISHAL DIVISION
    "Barishal": [
        ("Barishal Sadar", "বরিশাল সদর"), ("Agailjhara", "আগৈলঝাড়া"), ("Babuganj", "বাবুগঞ্জ"),
        ("Bakerganj", "বাকেরগঞ্জ"), ("Banaripara", "বানারীপাড়া"), ("Gaurnadi", "গৌরনদী"),
        ("Hizla", "হিজলা"), ("Mehendiganj", "মেহেন্দীগঞ্জ"), ("Muladi", "মুলাদী"),
        ("Wazirpur", "উজিরপুর"),
    ],
    "Patuakhali": [
        ("Patuakhali Sadar", "পটুয়াখালী সদর"), ("Bauphal", "বাউফল"), ("Dashmina", "দশমিনা"),
        ("Galachipa", "গলাচিপা"), ("Kalapara", "কলাপাড়া"), ("Mirzaganj", "মির্জাগঞ্জ"),
        ("Rangabali", "রাঙ্গাবালী"), ("Dumki", "দুমকি"),
    ],
    "Bhola": [
        ("Bhola Sadar", "ভোলা সদর"), ("Burhanuddin", "বোরহানউদ্দিন"), ("Char Fasson", "চরফ্যাশন"),
        ("Daulatkhan", "দৌলতখান"), ("Lalmohan", "লালমোহন"), ("Manpura", "মনপুরা"),
        ("Tazumuddin", "তজুমদ্দিন"),
    ],
    "Pirojpur": [
        ("Pirojpur Sadar", "পিরোজপুর সদর"), ("Bhandaria", "ভাণ্ডারিয়া"),
        ("Kawkhali", "কাউখালী"), ("Mathbaria", "মঠবাড়িয়া"), ("Nazirpur", "নাজিরপুর"),
        ("Nesarabad", "নেছারাবাদ"), ("Zianagar", "জিয়ানগর"),
    ],
    "Barguna": [
        ("Barguna Sadar", "বরগুনা সদর"), ("Amtali", "আমতলী"), ("Bamna", "বামনা"),
        ("Betagi", "বেতাগী"), ("Patharghata", "পাথরঘাটা"), ("Taltali", "তালতলী"),
    ],
    "Jhalakathi": [
        ("Jhalakathi Sadar", "ঝালকাঠি সদর"), ("Kathalia", "কাঠালিয়া"),
        ("Nalchhiti", "নলছিটি"), ("Rajapur", "রাজাপুর"),
    ],

    # SYLHET DIVISION
    "Sylhet": [
        ("Sylhet Sadar", "সিলেট সদর"), ("Kotwali", "কোতোয়ালী"), ("Beanibazar", "বিয়ানীবাজার"),
        ("Bishwanath", "বিশ্বনাথ"), ("Dakshin Surma", "দক্ষিণ সুরমা"), ("Fenchuganj", "ফেঞ্চুগঞ্জ"),
        ("Golapganj", "গোলাপগঞ্জ"), ("Gowainghat", "গোয়াইনঘাট"), ("Jaintiapur", "জৈন্তাপুর"),
        ("Kanaighat", "কানাইঘাট"), ("Companiganj", "কোম্পানীগঞ্জ"), ("Zakiganj", "জকিগঞ্জ"),
        ("Osmani Nagar", "ওসমানী নগর"),
    ],
    "Moulvibazar": [
        ("Moulvibazar Sadar", "মৌলভীবাজার সদর"), ("Barlekha", "বড়লেখা"),
        ("Kamalganj", "কমলগঞ্জ"), ("Kulaura", "কুলাউড়া"), ("Rajnagar", "রাজনগর"),
        ("Sreemangal", "শ্রীমঙ্গল"), ("Juri", "জুড়ী"),
    ],
    "Habiganj": [
        ("Habiganj Sadar", "হবিগঞ্জ সদর"), ("Ajmiriganj", "আজমিরীগঞ্জ"),
        ("Bahubal", "বাহুবল"), ("Baniachong", "বানিয়াচং"), ("Chunarughat", "চুনারুঘাট"),
        ("Lakhai", "লাখাই"), ("Madhabpur", "মাধবপুর"), ("Nabiganj", "নবীগঞ্জ"),
        ("Sayestaganj", "শায়েস্তাগঞ্জ"),
    ],
    "Sunamganj": [
        ("Sunamganj Sadar", "সুনামগঞ্জ সদর"), ("Bishwamvarpur", "বিশ্বম্ভরপুর"),
        ("Chhatak", "ছাতক"), ("Derai", "দেরাই"), ("Dharampasha", "ধর্মপাশা"),
        ("Dowarabazar", "দোয়ারাবাজার"), ("Jagannathpur", "জগন্নাথপুর"),
        ("Jamalganj", "জামালগঞ্জ"), ("Shantiganj", "শান্তিগঞ্জ"), ("Tahirpur", "তাহিরপুর"),
        ("Madhyanagar", "মধ্যনগর"),
    ],

    # RANGPUR DIVISION
    "Rangpur": [
        ("Rangpur Sadar", "রংপুর সদর"), ("Badarganj", "বদরগঞ্জ"), ("Gangachhara", "গঙ্গাচড়া"),
        ("Kaunia", "কাউনিয়া"), ("Mithapukur", "মিঠাপুকুর"), ("Pirgachha", "পীরগাছা"),
        ("Pirganj", "পীরগঞ্জ"), ("Taraganj", "তারাগঞ্জ"),
    ],
    "Dinajpur": [
        ("Dinajpur Sadar", "দিনাজপুর সদর"), ("Birampur", "বিরামপুর"), ("Birganj", "বীরগঞ্জ"),
        ("Biral", "বিরল"), ("Bochaganj", "বোচাগঞ্জ"), ("Chirirbandar", "চিরিরবন্দর"),
        ("Phulbari", "ফুলবাড়ী"), ("Ghoraghat", "ঘোড়াঘাট"), ("Hakimpur", "হাকিমপুর"),
        ("Kaharole", "কাহারোল"), ("Khansama", "খানসামা"), ("Nawabganj", "নবাবগঞ্জ"),
        ("Parbatipur", "পার্বতীপুর"),
    ],
    "Kurigram": [
        ("Kurigram Sadar", "কুড়িগ্রাম সদর"), ("Bhurungamari", "ভুরুঙ্গামারী"),
        ("Char Rajibpur", "চর রাজিবপুর"), ("Chilmari", "চিলমারী"), ("Phulbari", "ফুলবাড়ী"),
        ("Nageshwari", "নাগেশ্বরী"), ("Rajarhat", "রাজারহাট"), ("Raomari", "রৌমারী"),
        ("Ulipur", "উলিপুর"),
    ],
    "Gaibandha": [
        ("Gaibandha Sadar", "গাইবান্ধা সদর"), ("Fulchhari", "ফুলছড়ি"), ("Gobindaganj", "গোবিন্দগঞ্জ"),
        ("Palashbari", "পলাশবাড়ী"), ("Sadullapur", "সাদুল্লাপুর"), ("Sughatta", "সাঘাটা"),
        ("Sundarganj", "সুন্দরগঞ্জ"),
    ],
    "Nilphamari": [
        ("Nilphamari Sadar", "নীলফামারী সদর"), ("Dimla", "ডিমলা"), ("Domar", "ডোমার"),
        ("Jaldhaka", "জলঢাকা"), ("Kishoreganj", "কিশোরগঞ্জ"), ("Saidpur", "সৈয়দপুর"),
    ],
    "Lalmonirhat": [
        ("Lalmonirhat Sadar", "লালমনিরহাট সদর"), ("Aditmari", "আদিতমারী"),
        ("Hatibandha", "হাতীবান্ধা"), ("Kaliganj", "কালীগঞ্জ"), ("Patgram", "পাটগ্রাম"),
    ],
    "Panchagarh": [
        ("Panchagarh Sadar", "পঞ্চগড় সদর"), ("Atwari", "আটোয়ারী"), ("Boda", "বোদা"),
        ("Debiganj", "দেবীগঞ্জ"), ("Tetulia", "তেঁতুলিয়া"),
    ],
    "Thakurgaon": [
        ("Thakurgaon Sadar", "ঠাকুরগাঁও সদর"), ("Baliadangi", "বালিয়াডাঙ্গী"),
        ("Haripur", "হরিপুর"), ("Pirganj", "পীরগঞ্জ"), ("Ranisankail", "রাণীশংকৈল"),
    ],

    # MYMENSINGH DIVISION
    "Mymensingh": [
        ("Charpara", "চরপাড়া"), ("Ganginarpar", "গাঙ্গিনারপাড়"), ("Town Hall", "টাউন হল"),
        ("Maskanda", "মাসকান্দা"), ("Akua", "আকুয়া"), ("Kewatkhali", "কেওয়াটখালী"),
        ("Patuakhali Road", "পটুয়াখালী রোড"), ("Kotwali", "কোতোয়ালী"), ("Bhaluka", "ভালুকা"),
        ("Dhobaura", "ধোবাউড়া"), ("Fulbaria", "ফুলবাড়ীয়া"), ("Gaffargaon", "গফরগাঁও"),
        ("Gauripur", "গৌরীপুর"), ("Haluaghat", "হালুয়াঘাট"), ("Ishwarganj", "ঈশ্বরগঞ্জ"),
        ("Muktagachha", "মুক্তাগাছা"), ("Nandail", "নান্দাইল"), ("Phulpur", "ফুলপুর"),
        ("Tara Khanda", "তারাকান্দা"), ("Trishal", "ত্রিশাল"),
    ],
    "Jamalpur": [
        ("Jamalpur Sadar", "জামালপুর সদর"), ("Bakshiganj", "বকশীগঞ্জ"),
        ("Dewanganj", "দেওয়ানগঞ্জ"), ("Islampur", "ইসলামপুর"), ("Madarganj", "মাদারগঞ্জ"),
        ("Melandaha", "মেলান্দহ"), ("Sarishabari", "সরিষাবাড়ী"),
    ],
    "Netrokona": [
        ("Netrokona Sadar", "নেত্রকোণা সদর"), ("Atpara", "আটপাড়া"), ("Barhatta", "বারহাট্টা"),
        ("Durgapur", "দুর্গাপুর"), ("Kalmakanda", "কলমাকান্দা"), ("Kendua", "কেন্দুয়া"),
        ("Madan", "মদন"), ("Mohanganj", "মোহনগঞ্জ"), ("Purbadhala", "পূর্বধলা"),
        ("Khaliajuri", "খালিয়াজুরী"),
    ],
    "Sherpur": [
        ("Sherpur Sadar", "শেরপুর সদর"), ("Jhenaigati", "ঝিনাইগাতী"), ("Nakla", "নকলা"),
        ("Nalitabari", "নালিতাবাড়ী"), ("Sreebardi", "শ্রীবরদী"),
    ],
}


class Command(BaseCommand):
    help = "Seeds Bangladesh Administrative Geography (Divisions, Districts, Thanas/Upazilas) with English and Bengali."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Starting Bangladesh Geolocation seeding...")

        div_count = 0
        dist_count = 0
        thana_count = 0

        # 1. Seed Divisions
        division_objs = {}
        for div_info in DIVISIONS_DATA:
            slug = slugify(div_info["name"])
            div_obj, created = Division.objects.update_or_create(
                name=div_info["name"],
                defaults={
                    "bn_name": div_info["bn_name"],
                    "slug": slug,
                    "order": div_info["order"],
                }
            )
            division_objs[div_info["name"]] = div_obj
            if created:
                div_count += 1

        self.stdout.write(f"✓ Divisions: {Division.objects.count()} total ({div_count} newly created)")

        # 2. Seed Districts
        district_objs = {}
        for div_name, dist_list in DISTRICTS_DATA.items():
            div_obj = division_objs.get(div_name)
            if not div_obj:
                continue

            for dist_name, dist_bn in dist_list:
                slug = slugify(dist_name)
                dist_obj, created = District.objects.update_or_create(
                    division=div_obj,
                    name=dist_name,
                    defaults={
                        "bn_name": dist_bn,
                        "slug": slug,
                    }
                )
                district_objs[dist_name] = dist_obj
                if created:
                    dist_count += 1

        self.stdout.write(f"✓ Districts: {District.objects.count()} total ({dist_count} newly created)")

        # 3. Seed Thanas (Scoping by District to safely handle same-name thanas!)
        for dist_name, thana_list in DISTRICT_THANAS_DATA.items():
            dist_obj = district_objs.get(dist_name)
            if not dist_obj:
                continue

            for thana_item in thana_list:
                thana_name, thana_bn = thana_item
                # Generate unique slug scoped with district
                slug = slugify(f"{thana_name}-{dist_obj.name}")
                _, created = Thana.objects.update_or_create(
                    district=dist_obj,
                    name=thana_name,
                    defaults={
                        "bn_name": thana_bn,
                        "slug": slug,
                    }
                )
                if created:
                    thana_count += 1

        self.stdout.write(f"✓ Thanas / Upazilas: {Thana.objects.count()} total ({thana_count} newly created)")
        self.stdout.write(self.style.SUCCESS("✓ Successfully seeded all Bangladesh administrative geolocation data."))
