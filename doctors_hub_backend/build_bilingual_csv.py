import csv
import re
from pathlib import Path

# Complete Bangladeshi Name Mappings: BN -> EN
BN_TO_EN_DICT = {
    # Initials & honorific contractions
    'এ': 'A.', 'এ.': 'A.', 'বি': 'B.', 'বি.': 'B.', 'সি': 'C.', 'সি.': 'C.',
    'ডি': 'D.', 'ডি.': 'D.', 'ই': 'E.', 'ই.': 'E.', 'এফ': 'F.', 'এফ.': 'F.',
    'জি': 'G.', 'জি.': 'G.', 'এইচ': 'H.', 'এইচ.': 'H.', 'আই': 'I.', 'আই.': 'I.',
    'জে': 'J.', 'জে.': 'J.', 'কে': 'K.', 'কে.': 'K.', 'এল': 'L.', 'এল.': 'L.',
    'এম': 'M.', 'এম.': 'M.', 'এন': 'N.', 'এন.': 'N.', 'ও': 'O.', 'ও.': 'O.',
    'পি': 'P.', 'পি.': 'P.', 'কিউ': 'Q.', 'কিউ.': 'Q.', 'আর': 'R.', 'আর.': 'R.',
    'এস': 'S.', 'এস.': 'S.', 'টি': 'T.', 'টি.': 'T.', 'ইউ': 'U.', 'ইউ.': 'U.',
    'ভি': 'V.', 'ভি.': 'V.', 'ডব্লিউ': 'W.', 'এক্স': 'X.', 'ওয়াই': 'Y.', 'জেড': 'Z.',
    'এএইচএম': 'A.H.M.', 'এবিএম': 'A.B.M.',
    'মোঃ': 'Md.', 'মো:': 'Md.', 'মো.': 'Md.', 'মো': 'Md.', 'মোং': 'Md.',
    'মুহাঃ': 'Muhammed', 'মুহা:': 'Muhammed', 'মুহা': 'Muhammed',
    'মোহা': 'Md.', 'মোহা:': 'Md.', 'মোহাঃ': 'Md.',
    'মোসা:': 'Mst.', 'মোসাঃ': 'Mst.', 'মোছা': 'Mst.', 'মোছাঃ': 'Mst.', 'মোসাম্মাৎ': 'Mosammat',
    'মোহাম্মদ': 'Mohammad', 'মোহাম্মাদ': 'Mohammad', 'মুহাম্মদ': 'Muhammad',

    # Connectors
    'অর': 'Or', 'বিন': 'Bin', 'ইবনে': 'Ibn', 'আল': 'Al', 'আল-': 'Al-', 'উদ': 'Ud',

    # Names: Vowels
    'অমর': 'Amar', 'অমল': 'Amal', 'অমিতাভ': 'Amitabh', 'অরুণাভ': 'Arunabha',
    'অলিউল': 'Oliul', 'অসমা': 'Asma', 'অহিদুলুজ্জামান': 'Ohiduzzaman',
    'অনিয়া': 'Ania', 'অপু': 'Opu', 'অভি': 'Abhi', 'অভীক': 'Avik',
    'আমজাদ': 'Amjad', 'আমীর': 'Amir', 'আরমানুল': 'Armanul', 'আরা': 'Ara',
    'আরাফাত': 'Arafat', 'আরিফুজ্জামান': 'Arifuzzaman', 'আরিফুর': 'Arifur',
    'আরেফিন': 'Arefin', 'আলগমীর': 'Alamgir', 'আলাউদ্দীন': 'Alauddin', 'আলো': 'Alo',
    'আশফাক': 'Ashfaq', 'আশফী': 'Ashfi', 'আশিকুর': 'Ashiqur', 'আশিকুল': 'Ashiqul',
    'আসাদ': 'Asad', 'আসাদুজ্জামান': 'Asaduzzaman', 'আসিফ': 'Asif', 'আহছান': 'Ahsan',
    'আহমাদ': 'Ahmad', 'ইউসুফ': 'Yousuf', 'ইখতেয়ার': 'Ikhtiar', 'ইন্তিসার': 'Intisar',
    'ইন্দ্রজিৎ': 'Indrajit', 'ইপনিতা': 'Ipnita', 'ইফতাবুল': 'Iftabul', 'ইফতেখার': 'Iftekhar',
    'ইফফাত': 'Iffat', 'ইমতিসার': 'Imtisar', 'ইমন': 'Emon', 'ইমমুল': 'Immul',
    'ইমরুল': 'Imrul', 'ইমাম': 'Imam', 'ইমুনুল': 'Imunul', 'ইলিয়াচ': 'Ilias',
    'ইলোরা': 'Elora', 'ইশতিয়াক': 'Ishtiaque', 'ইশতেখার': 'Ishtekhar', 'ইশা': 'Isha',
    'ইসমত': 'Ismat', 'ইসমে': 'Isme', 'ইয়াছমিন': 'Yasmin', 'ইয়ামিন': 'Yamin',
    'ইয়াসমিন': 'Yasmin', 'উজ': 'Uz', 'উজ্জল': 'Uzzal', 'উপমা': 'Upama',
    'উম্মে': 'Umme', 'উল': 'Ul', 'এহসানুল': 'Ehsanul',
    'আকবর': 'Akbar', 'আক্তার': 'Akter', 'আক্তারুজ্জামান': 'Akteruzzaman',
    'আক্রাম': 'Akram', 'আখতার': 'Akhter', 'আখতারুন': 'Akhterun', 'আখলাক': 'Akhlaque',
    'আজফার': 'Azfar', 'আজম': 'Azam', 'আজাদ': 'Azad', 'আজিজ': 'Aziz',
    'আজিজি': 'Azizi', 'আজিজুল': 'Azizul', 'আঞ্জুমান': 'Anjuman', 'আতিকুর': 'Atiqur',
    'আতিকুল': 'Atiqul', 'আনজিরুন': 'Anjirun', 'আনজুমান': 'Anjuman', 'আনহারুর': 'Anharur',
    'আনিকা': 'Anika', 'আনিসুল': 'Anisul', 'আনোয়ার': 'Anwar', 'আনোয়ার': 'Anwar',
    'আনোয়ারুল': 'Anwarul', 'আফজাল': 'Afzal', 'আফরিন': 'Afrin', 'আফরীন': 'Afrin',
    'আফরোজ': 'Afroz', 'আফরোজা': 'Afroza', 'আফসার': 'Afsar', 'আবদুল্লাহ': 'Abdullah',
    'আবিদা': 'Abida', 'আবু': 'Abu', 'আবুল': 'Abul', 'আব্দুল': 'Abdul',
    'আব্দুল্লাহ': 'Abdullah', 'আব্দুর': 'Abdur', 'আমান': 'Aman', 'আমানত': 'Amanat',
    'আমানুল্লাহ': 'Amanullah', 'আমির': 'Amir', 'আমিরুল': 'Amirul', 'আমিরুজ্জামান': 'Amiruzzaman',
    'আমিন': 'Amin', 'আমিনুল': 'Aminul', 'আমিনুর': 'Aminur', 'আয়েশা': 'Ayesha',
    'আরিফ': 'Arif', 'আরিফা': 'Arifa', 'আরিফুল': 'Ariful', 'আলম': 'Alam',
    'আলমগীর': 'Alamgir', 'আলী': 'Ali', 'আলাউদ্দিন': 'Alauddin', 'আলিম': 'Alim',
    'আশরাফ': 'Ashraf', 'আশরাফুল': 'Ashraful', 'আসমাত': 'Asmat', 'আসমা': 'Asma',
    'আহমদ': 'Ahmad', 'আহমেদ': 'Ahmed', 'আহসান': 'Ahsan', 'আহাদ': 'Ahad',
    'ইব্রাহিম': 'Ibrahim', 'ইশরাত': 'Ishrat', 'ইসমাইল': 'Ismail', 'ইসলাম': 'Islam',
    'উজ্জামান': 'Uzzaman', 'উদ্দিন': 'Uddin', 'উদ্দীন': 'Uddin', 'উদয়': 'Uday',
    'উমা': 'Uma', 'উম্মি': 'Ummi', 'উর্মি': 'Urmi', 'উল্বী': 'Ulwi',
    'উল্লাহ': 'Ullah', 'উল্লাহ্': 'Ullah', 'উৎপলা': 'Utpala',
    'একরামুল': 'Ekramul', 'একরামুল্লাহ': 'Ekramullah', 'এলাহী': 'Elahi',
    'এহতেশামুল': 'Ehteshamul', 'এহেতেশামুল': 'Eheteshamul',
    'ওয়াহিদুজ্জামান': 'Wahiduzzaman', 'ওহাব': 'Wahab',

    # K, Kh, G, Gh
    'কবীর': 'Kabir', 'কবির': 'Kabir', 'কমল': 'Kamal', 'করিম': 'Karim',
    'কল্লোল': 'Kallol', 'কাকন': 'Kakon', 'কাজী': 'Kazi', 'কাদের': 'Kader',
    'কাদির': 'Kader', 'কামাল': 'Kamal', 'কামরুল': 'Kamrul', 'কামরুজ্জামান': 'Kamruzzaman',
    'কাশেম': 'Kashem', 'কাসেম': 'Kashem', 'কাওসার': 'Kawsar', 'কাউসার': 'Kawsar',
    'কিরণ': 'Kiran', 'কিশোর': 'Kishore', 'কুদরত': 'Kudrat', 'কুদ্দুস': 'Quddus',
    'কুমার': 'Kumar', 'কুন্ডু': 'Kundu', 'কেশব': 'Keshab', 'কায়সার': 'Kaysar',
    'কায়েস': 'Kayes', 'কনোজ': 'Kanoj', 'কর': 'Kar', 'কর্মকার': 'Karmakar',
    'কাইয়ুম': 'Kaiyum', 'কাজল': 'Kajal', 'কানিজ': 'Kaniz', 'কামিল': 'Kamil',
    'কালাম': 'Kalam', 'কিবরিয়া': 'Kibria', 'কুরাইশি': 'Quraishi', 'কৃষ্ণ': 'Krishna',
    'কেনান': 'Kenan', 'কোহিনুর': 'Kohinoor',
    'খালেক': 'Khalek', 'খালেদ': 'Khaled', 'খালিদ': 'Khalid',
    'খলিল': 'Khalil', 'খান': 'Khan', 'খন্দকার': 'Khandaker', 'খোন্দকার': 'Khondokar',
    'খায়রুল': 'Khairul', 'খায়ের': 'Khair', 'খায়েরুজ্জামান': 'Khairuzzaman', 'খায়েরুল': 'Khairul',
    'খোকন': 'Khokon', 'খোরশেদ': 'Khorshed', 'খোরশেদুল': 'Khorshedul',
    'খবির': 'Khabir', 'খবিরউদ্দিন': 'Khabiruddin', 'খাতুন': 'Khatun', 'খানম': 'Khanom',
    'খালেদুন্': 'Khaledun', 'খালেদুন্নেছা': 'Khaledunnesa', 'খায়রুন': 'Khairun', 'খোদা': 'Khoda',
    'গনি': 'Gani', 'গণি': 'Gani', 'গফর': 'Gaffar', 'গাজী': 'Gazi', 'গিয়াসউদ্দিন': 'Giasuddin',
    'গোবিন্দ': 'Gobinda', 'গোলাম': 'Golam', 'গৌরাঙ্গ': 'Gouranga', 'গৌতম': 'Goutam',
    'ঘোষ': 'Ghosh',

    # Ch, J, Jh
    'চৌধুরী': 'Chowdhury', 'চন্দ্র': 'Chandra', 'চক্রবর্তী': 'Chakraborty',
    'চয়ন': 'Chayan', 'চঞ্চল': 'Chanchal', 'ছগির': 'Chhagir', 'ছবি': 'Chhabi',
    'ছাদেকুল': 'Sadequl', 'জয়শ্রী': 'Jayashree', 'জয়সীরদার': 'Joysarder',
    'জহিরুল': 'Zahirul', 'জহির': 'Zahir', 'জাকিরুল': 'Zakirul', 'জাকেরীয়া': 'Zakaria',
    'জাকারিয়া': 'Zakaria', 'জাকির': 'Zakir', 'জব্বার': 'Jabbar',
    'জায়েদুল': 'Zayedul', 'জাহাংগীর': 'Jahangir', 'জাহাঙ্গীর': 'Jahangir',
    'জাহানার': 'Jahanara', 'জাহানারা': 'Jahanara', 'জাহান': 'Jahan', 'জাহিদ': 'Zahid', 'জাহিদুর': 'Zahidur',
    'জিকো': 'Jiko', 'জিনাত': 'Zinat', 'জিলুর': 'Zillur', 'জিল্লুর': 'Zillur',
    'জুয়েল': 'Jewel', 'জু্লিয়েট': 'Juliet', 'জুয়েল': 'Jewel', 'জেরিন': 'Jerin',
    'জেসমিন': 'Jesmin', 'জোয়ার্দার': 'Joarder', 'জয়নব': 'Zaynab', 'জয়শ্রী': 'Jayashree',
    'ঝুনু': 'Jhunu', 'জীবন': 'Jiban', 'জুনায়েদ': 'Junaid', 'জুলফিকার': 'Zulfikar',
    'জ্যোতি': 'Jyoti', 'জসীম': 'Jasim', 'জহুরুল': 'Zahurul', 'জায়েদ': 'Zayed',
    'জায়েদ': 'Zayed', 'জামাল': 'Jamal', 'জামিল': 'Jamil', 'জামান': 'Zaman',
    'জালাল': 'Jalal', 'জাফর': 'Zafar', 'জিয়া': 'Zia', 'জিয়াউল': 'Ziaul', 'জিসান': 'Zisan',

    # T, Th, D, Dh
    'টাইয়েব': 'Taiyeb', 'টিটু': 'Titu', 'টিটো': 'Tito', 'টুন': 'Tun',
    'তরফদার': 'Tarafder', 'তানজিনা': 'Tanjina', 'তানজিলা': 'Tanjila', 'তানিয়া': 'Tania',
    'তাপস': 'Tapas', 'তাবাসসুম': 'Tabassum', 'তামান্না': 'Tamanna', 'তাসনীম': 'Tasnim',
    'তাসমিন': 'Tasmin', 'তাসমিনা': 'Tasmina', 'তুলি': 'Tuli', 'তুষার': 'Tushar',
    'তৈমুর': 'Taimur', 'তৈয়বা': 'Taiyeba', 'তৌহিদুল': 'Tohidul', 'দিপু': 'Dipu',
    'দীবা': 'Diba', 'দে': 'Dey', 'দেবী': 'Debi', 'দেবেশ': 'Debesh',
    'দেলোয়ার': 'Delwar', 'দোজা': 'Doza', 'দোজাহ': 'Doza', 'দিলীপ': 'Dilip',
    'ডেইজী': 'Daisy',
    'দিলারা': 'Dilara', 'দিলরুবা': 'Dilruba', 'দেওয়ান': 'Dewan', 'দেওয়ান': 'Dewan',
    'দেবনাথ': 'Debnath', 'দেব': 'Deb', 'দেবাশীষ': 'Debashis', 'দেবাশিষ': 'Debashis',
    'দেবরঞ্জন': 'Debaranjan', 'দেবাশিস': 'Debashis', 'দাস': 'Das', 'দীপক': 'Dipak',
    'দাউদ': 'Daud', 'তপন': 'Tapan', 'তন্বী': 'Tonmoy', 'তন্ময়': 'Tonmoy',
    'তানভীর': 'Tanvir', 'তাহমিনা': 'Tahmina', 'তাহসিন': 'Tahsin', 'তারিক': 'Tariq',
    'তারেক': 'Tarek', 'তারিকুল': 'Tariqul', 'তৌফিক': 'Taufiq', 'তৌহিদ': 'Towhid',
    'তোফায়েল': 'Tofael', 'ত্রিদিব': 'Tridib', 'তালুকদার': 'Talukder',

    # N
    'নওশীন': 'Nowshin', 'নওসাবাহ': 'Nawsabah', 'নজীব': 'Nazib', 'নন্দিতা': 'Nandita',
    'নবী': 'Nabi', 'নাঈমা': 'Nayeema', 'নাগ': 'Nag', 'নাচির': 'Nasir',
    'নাজমা': 'Nazma', 'নাজিম': 'Nazim', 'নাজিয়া': 'Nazia', 'নাথ': 'Nath',
    'নাবিদ': 'Nabid', 'নার্গিস': 'Nargis', 'নাসরীন': 'Nasreen', 'নাহিদ': 'Nahid',
    'নাহিদা': 'Nahida', 'নিঘাত': 'Nighat', 'নিজামুল': 'Nizamul', 'নিলুফার': 'Nilufar',
    'নিশাত': 'Nishat', 'নিশি': 'Nishi', 'নীলিমা': 'Nilima', 'নুপুর': 'Nupur',
    'নুরে': 'Nure', 'নুশরাত': 'Nusrat', 'নুসরাত': 'Nusrat', 'নৃপেন': 'Nripen',
    'নেছা': 'Nessa', 'ন্যান্সি': 'Nancy', 'নজির': 'Nazir', 'নজরুল': 'Nazrul',
    'নওশের': 'Nawsher', 'নাসির': 'Nasir', 'নাছির': 'Nasir', 'নাদিরা': 'Nadira',
    'নাদিম': 'Nadim', 'নাজমুল': 'Nazmul', 'নাজনীন': 'Nazneen', 'নাসরিন': 'Nasreen',
    'নাসিম': 'Nasim', 'নাঈম': 'Nayeem', 'নাহার': 'Nahar', 'নিখিল': 'Nikhil',
    'নিগার': 'Nigar', 'নীহার': 'Nihar', 'নির্মল': 'Nirmal', 'নিপা': 'Nipa',
    'নূর': 'Nur', 'নূরুল': 'Nurul', 'নুর': 'Nur', 'নুরুল': 'Nurul', 'নুরুন্নাহার': 'Nurunnahar',

    # P, F
    'পরভীন': 'Parveen', 'পাল': 'Paul', 'প্রভাস': 'Pravas', 'প্রশান্ত': 'Prashanta',
    'প্রসাদ': 'Prasad', 'প্রিয়ম': 'Priyam', 'ফওজিয়া': 'Fowzia', 'ফখরুল': 'Fakhrul',
    'ফখরুল্দীন': 'Fakhruddin', 'ফজলে': 'Fazle', 'ফয়সাল': 'Faisal', 'ফরহাত': 'Farhat',
    'ফরহাদ': 'Farhad', 'ফাইম': 'Fahim', 'ফারহান': 'Farhan', 'ফারাহ': 'Farah',
    'ফারিয়া': 'Faria', 'ফারুকী': 'Faruqui', 'ফাহিম': 'Fahim', 'ফেরদৌসি': 'Ferdousi',
    'ফেরদৌসী': 'Ferdousi', 'ফ্লোরা': 'Flora', 'পলাশ': 'Polash', 'পল্লব': 'Pallab', 'পার্থ': 'Partha',
    'পান্না': 'Panna', 'পারভেজ': 'Parvez', 'পারভীন': 'Parveen', 'পীযূষ': 'Pijush',
    'প্রণব': 'Pranab', 'প্রদীপ': 'Pradip', 'প্রবীর': 'Prabir', 'পল': 'Paul',
    'এনাম': 'Enam', 'এনামুল': 'Enamul', 'এহতেশাম': 'Ehtesham', 'এহসান': 'Ehsan',
    'ফজল': 'Fazal', 'ফজলুল': 'Fazlul', 'ফয়সাল': 'Faisal', 'ফয়জুল': 'Faizul',
    'ফয়েজ': 'Faiz', 'ফকির': 'Fakir', 'ফরিদা': 'Farida', 'ফরিদ': 'Farid',
    'ফারুক': 'Faruque', 'ফারুকা': 'Faruqua', 'ফারজানা': 'Farzana', 'ফারহানা': 'Farhana',
    'ফাহমিদা': 'Fahmida', 'ফাতেমা': 'Fatema', 'ফিরোজ': 'Firoz', 'ফেরদৌস': 'Ferdous',

    # B, Bh
    'বখতিয়ার': 'Bakhtiar', 'বখশ': 'Bakhsh', 'বজুলল': 'Bazlul', 'বনিক': 'Banik',
    'বর্ধন': 'Bardhan', 'বর্মন': 'Barman', 'বশীর': 'Bashir', 'বানু': 'Banu',
    'বান্না': 'Banna', 'বাবরুল': 'Babrul', 'বারি': 'Bari', 'বারিকদার': 'Barikdar',
    'বাহাদুর': 'Bahadur', 'বাহার': 'Bahar', 'বিকাশ': 'Bikash', 'বিনতে': 'Binte',
    'বিনয়': 'Binoy', 'বিপুল': 'Bipul', 'বেনজীর': 'Benazir', 'বেলায়ত': 'Belayet',
    'বোরহান': 'Borhan', 'ব্যানার্জী': 'Banerjee', 'ভূঁইয়া': 'Bhuiyan', 'ভূঁইয়া': 'Bhuiyan',
    'ভূঁঞা': 'Bhuiyan', 'বদরুল': 'Badrul', 'বরকত': 'Barkat', 'বরুণ': 'Barun',
    'বসাক': 'Basak', 'বজলুল': 'Bazlul', 'বশিরউদ্দিন': 'Bashiruddin', 'বাচ্চু': 'Bacchu',
    'বাপ্পী': 'Bappi', 'বাবর': 'Babar', 'বাবুল': 'Babul', 'বারী': 'Bari',
    'বারিক': 'Barik', 'বালক': 'Balak', 'বাসুদেব': 'Basudeb', 'বাহাউদ্দিন': 'Bahauddin',
    'বিক্রম': 'Bikram', 'বিজলি': 'Bijli', 'বিজয়': 'Bijoy', 'বিজয়': 'Bijoy',
    'বিপ্লব': 'Biplob', 'বিমল': 'Bimal', 'বিমলেন্দু': 'Bimalendu', 'বিলাল': 'Bilal',
    'বিশ্বনাথ': 'Biswanath', 'বিশ্বাস': 'Biswas', 'বিল্লাল': 'Billal', 'বুলবুল': 'Bulbul',
    'বেগম': 'Begum', 'বেলাল': 'Belal', 'বড়ুয়া': 'Barua', 'বন্যা': 'Bonya',

    # M
    'মইনউদ্দীন': 'Moinuddin', 'মইনুল': 'Moinul', 'মঈদ': 'Moid', 'মঞ্জুমান': 'Manjuman',
    'মতিন': 'Matin', 'মধুসূদন': 'Madhusudan', 'মনজুর': 'Manzur', 'মনজুরুল': 'Manzurul',
    'মনি': 'Moni', 'মনির': 'Monir', 'মনিরুজ্জামান': 'Moniruzzaman', 'মনীষা': 'Manisha',
    'মনোজ': 'Manoj', 'মনোওয়ারুল': 'Monowarul', 'মনোয়ারুল': 'Monowarul', 'ময়ুখ': 'Mayukh', 'মশহুর': 'Mashhur',
    'মশিউর': 'Mashiur', 'মহুয়া': 'Mohua', 'মাওলা': 'Mawla', 'মাকসুদা': 'Maksuda',
    'মাজহারুল': 'Mazharul', 'মাজিদুল': 'Majidul', 'মানবেন্দ্র': 'Manabendra',
    'মাফরুহা': 'Mafruha', 'মারওয়া': 'Marwa', 'মারুফ': 'Maruf', 'মারুফা': 'Marufa',
    'মার্ক': 'Mark', 'মালেকা': 'Maleka', 'মাসুদা': 'Masuda', 'মাহফুজুর': 'Mahfuzur',
    'মাহবুবুর': 'Mahbubur', 'মাহমুদুজ্জামান': 'Mahmuduzzaman', 'মাহমুদুল': 'Mahmudul',
    'মাহেনাজ': 'Mahenaz', 'মিজবাউল': 'Mizbaul', 'মিঞু': 'Miah', 'মিতু': 'Mitu',
    'মিরাজুল': 'Mirajul', 'মিল্লা': 'Milla', 'মিশু': 'Mishu', 'মিয়া': 'Miah',
    'মীনা': 'Meena', 'মীর': 'Mir', 'মুজিবুল': 'Mujibul', 'মুন': 'Moon',
    'মুনতাহা': 'Muntaha', 'মুনা': 'Muna', 'মুনীর': 'Munir', 'মুর্শিদুল': 'Murshidul',
    'মুশফিকুর': 'Mushfiqur', 'মুসররাত': 'Musarrat', 'মুস্তাফিজুর': 'Mustafizur',
    'মুস্তারি': 'Mustari', 'মৃধা': 'Mridha', 'মেখলা': 'Mekhla', 'মেঘলা': 'Meghla',
    'মেজবাউল': 'Mezbaul', 'মেজবাহ': 'Mezbah', 'মেজবাহুল': 'Mezbahul', 'মেনোকা': 'Menoka',
    'মেরিনা': 'Marina', 'মেসবাহুল': 'Mesbahul', 'মেহবুব': 'Mehbub', 'মেহরাজ': 'Mehraj',
    'মেহেরুন্নেসা': 'Meherunnesa', 'মোকাদ্দির': 'Mokaddir', 'মোখলেছুর': 'Mokhlesur',
    'মোগণী': 'Mogni', 'মোগনী': 'Mogni', 'মোছলেহ': 'Mosleh', 'মোমতাজুল': 'Momtazul',
    'মোয়াজ্জেম': 'Moazzem', 'মোরছালীন': 'Morchalin', 'মোর্তজা': 'Mortaza',
    'মোর্শেদ': 'Morshed', 'মোর্শেদুল': 'Morshedul', 'মোল্লাহ্': 'Mollah',
    'মোশাররফ': 'Mosharraf', 'মোস্তাফিজুর': 'Mustafizur', 'মোয়াজ্জেম': 'Moazzem',
    'মোয়ায্জেম': 'Moazzem', 'মজিবুর': 'Mojibur', 'মঞ্জুর': 'Monjur', 'মফিজুল': 'Mofizul',
    'মমতাজ': 'Momtaz', 'মহসিন': 'Mohsin', 'মহিউদ্দিন': 'Mohiuddin', 'মহিবুর': 'Mohibur',
    'মাজেদ': 'Mazed', 'মাকসুদ': 'Maksud', 'মাখন': 'Makhon', 'মান্নান': 'Mannan',
    'মামুন': 'Mamun', 'মাসুদ': 'Masud', 'মাসুম': 'Masum', 'মাহতাব': 'Mahtab',
    'মাহমুদ': 'Mahmud', 'মাহমুদা': 'Mahmuda', 'মাহবুব': 'Mahbub', 'মাহবুবুল': 'Mahbubul',
    'মাহফুজ': 'Mahfuz', 'মাহফুজা': 'Mahfuza', 'মিজান': 'Mizan', 'মিজানুর': 'Mizanur',
    'মিতালী': 'Mitali', 'মিনহাজ': 'Minhaz', 'মির্জা': 'Mirza', 'মিলন': 'Milon',
    'মুকুল': 'Mukul', 'মুন্না': 'Munna', 'মুনতাসির': 'Muntasir', 'মুরাদ': 'Murad',
    'মুস্তাফিজ': 'Mustafiz', 'মুস্তফা': 'Mustafa', 'মুশফিক': 'Mushfiq',
    'মুস্তাক': 'Mustaque', 'মেহেদী': 'Mehedi', 'মোস্তাক': 'Mostaque', 'মোস্তফা': 'Mostafa',
    'মোতাহার': 'Motahar', 'মতিউর': 'Motiur', 'মোজাম্মেল': 'Mozammel', 'মোল্লা': 'Mollah',
    'মোল্যা': 'Mollah', 'মৌসুমী': 'Moushumi', 'মজুমদার': 'Majumder', 'মল্লিক': 'Mallick',

    # R
    'রওশন': 'Rowshon', 'রতন': 'Ratan', 'রনজু': 'Ronju', 'রনদা': 'Ranada',
    'রনি': 'Rony', 'রবিুল': 'Rabiul', 'রাজী': 'Razi', 'রাজ্জাক': 'Razzak',
    'রানা': 'Rana', 'রাফাত': 'Rafat', 'রাফিউল': 'Rafiul', 'রাব্বী': 'Rabbi',
    'রায়': 'Roy', 'রায়': 'Roy', 'রাশিদা': 'Rashida', 'রাশিদুল': 'Rashidul', 'রাশেদুল': 'Rashedul',
    'রাসেল': 'Rasel', 'রায়হান': 'Raihan', 'রিনকি': 'Rinki', 'রিফাত': 'Rifat',
    'রিমু': 'Rimu', 'রিশাদ': 'Rishad', 'রুচিতা': 'Ruchita', 'রুণা': 'Runa',
    'রুনা': 'Runa', 'রুনি': 'Runi', 'রুবেল': 'Rubel', 'রুমানা': 'Rumana',
    'রুমি': 'Rumi', 'রুম্পা': 'Rumpa', 'রুশাইদা': 'Rushaida', 'রুস্তম': 'Rustom',
    'রুহী': 'Ruhi', 'রূপা': 'Rupa', 'রেজওয়ানুন্নর': 'Rezwanunnoor', 'রেজয়ানা': 'Rezwana',
    'রেজয়ানুর': 'Rezwanur', 'রেমি': 'Remi', 'রেহনুমা': 'Rehnuma', 'রেহান': 'Rehan',
    'রোজী': 'Rozy', 'রোসানা': 'Roxana', 'রোোকসানা': 'Roksana', 'লাকি': 'Lucky',
    'লাখি': 'Lakhi', 'লায়লা': 'Laila', 'লায়লা': 'Laila', 'লিটন': 'Liton',
    'লিপি': 'Lipi', 'লুৎফা': 'Lutfa', 'রহিম': 'Rahim', 'রহমান': 'Rahman',
    'রফিক': 'Rafiq', 'রফিকুল': 'Rafiqul', 'রকিবুল': 'Rakibul', 'রকিব': 'Rakib',
    'রশিদ': 'Rashid', 'রশীদ': 'Rashid', 'রনজিত': 'Ranjit', 'রঞ্জন': 'Ranjan',
    'রবিউল': 'Rabiul', 'রবি': 'Robi', 'রব': 'Rob', 'রমেশ': 'Ramesh',
    'রাকিব': 'Rakib', 'রাশেদ': 'Rashed', 'রাশেদা': 'Rasheda', 'রাহাত': 'Rahat',
    'রাজিব': 'Rajib', 'রাজীব': 'Rajib', 'রাজিবুল': 'Rajibul', 'রাফি': 'Rafi',
    'রিপন': 'Ripon', 'রিয়াজ': 'Riaz', 'রিয়াজ': 'Riaz', 'রিতু': 'Ritu',
    'রীতা': 'Rita', 'রুহুল': 'Ruhul', 'রুবিনা': 'Rubina', 'রেজা': 'Reza',
    'রেজাউল': 'Rezaul', 'রেজওয়ান': 'Rezwan', 'রোকেয়া': 'Rokeya',
    'লতিফ': 'Latif', 'লিয়াকত': 'Liaquat', 'লুৎফর': 'Lutfor', 'লুৎফুন': 'Lutfun',

    # Sh, S
    'শংকর': 'Shankar', 'শওকত': 'Shawkat', 'শম্পা': 'Shampa', 'শরীফুজ্জামান': 'Sharifuzzaman',
    'শর্বরী': 'Sharbari', 'শর্মিষ্ঠা': 'Sharmistha', 'শহিদুল': 'Shahidul',
    'শহীদ': 'Shahid', 'শহীদুল': 'Shahidul', 'শহীদুল্লাহ': 'Shahidullah', 'শাওন': 'Shaon',
    'শাওলী': 'Shaoli', 'শাকিরা': 'Shakira', 'শাকিল': 'Shakil', 'শাখাওয়াত': 'Shakhawat',
    'শান্তনু': 'Shantanu', 'শান্তা': 'Shanta', 'শাপুর': 'Shapur', 'শাফিয়া': 'Shafia',
    'শামছুননাহার': 'Shamsunnahar', 'শামছুন্নাহার': 'Shamsunnahar', 'শামসাদ': 'Shamsad',
    'শামসি': 'Shamsi', 'শামসুন': 'Shamsun', 'শামস্': 'Shams', 'শারমিন': 'Sharmin',
    'শারমিনা': 'Sharmina', 'শারমীন': 'Sharmin', 'শাহনাজ': 'Shahnaz',
    'শাহনেওয়াজ': 'Shahnewaz', 'শাহরিন': 'Shahrin', 'শাহরিয়ার': 'Shahriar', 'শাহরিয়ার': 'Shahriar',
    'শাহাবুল': 'Shahabul', 'শাহিদা': 'Shahida', 'শাহিদুর': 'Shahidur', 'শায়লা': 'Shayla',
    'শিউলী': 'Sheuli', 'শিবলি': 'Shibli', 'শিরিন': 'Shirin', 'শুভ': 'Shuva',
    'শেবাল': 'Shebal', 'শেহনীলা': 'Shehnila', 'সনজিত': 'Sanjit', 'সনি': 'Sony',
    'সন্তু': 'Santu', 'সফিকুল': 'Safiqul', 'সম্প্রীতি': 'Sampriti', 'সাইদুল': 'Saidul',
    'সাইয়ান': 'Saiyan', 'সাঈদা': 'Saida', 'সাঈদুজ্জামান': 'Saiduzzaman', 'সাকি': 'Saki',
    'সাকি্বব': 'Sakib', 'সাকিৰ': 'Sakib', 'সাখাওয়াত': 'Sakhawat', 'সাখাওয়াত': 'Sakhawat',
    'সাজ্জাদ': 'Sajjad', 'সাদিকা': 'Sadika', 'সাদী': 'Sadi', 'সানিয়া': 'Sania',
    'সাফায়েত': 'Safayet', 'সাবরিনা': 'Sabrina', 'সাবেকা': 'Sabeka', 'সামছুল': 'Samsul',
    'সামসুল': 'Shamsul', 'সামিনা': 'Samina', 'সায়মা': 'Sayma', 'সায়মা': 'Sayma',
    'সায়েবা': 'Sayeba',
    'সারওয়ার': 'Sarwar', 'সারোয়ার': 'Sarwar', 'সালাম': 'Salam', 'সালাহ': 'Salah',
    'সাহা': 'Saha', 'সাহারা': 'Sahara', 'সােদেকা': 'Sadeka', 'সায়েম': 'Sayem',
    'সিকদার': 'Sikder', 'সিক্ত': 'Sikta', 'সিদ্দিক': 'Siddiqui', 'সিদ্দিকী': 'Siddiquee',
    'সিরাজুল': 'Sirajul', 'সুকৃতি': 'Sukriti', 'সুখ': 'Sukh', 'সুজিত': 'Sujit',
    'সুধ': 'Sudha', 'সুধাংশু': 'Sudhangshu', 'সুমন': 'Sumon', 'সুমন্ত': 'Sumanta',
    'সুমাইয়া': 'Sumaiya', 'সুমি': 'Sumi', 'সুরাইয়া': 'Suraiya', 'সুলতানা': 'Sultana',
    'সুস্মিতা': 'Sushmita', 'সুহাস': 'Suhas', 'সেতারা': 'Setara', 'সেতু': 'Setu',
    'সেলিনা': 'Selina', 'সেলিম': 'Selim', 'সেলিমুজ্জামান': 'Selimuzzaman',
    'সেহেলী': 'Seheli', 'সৈয়দ': 'Syed', 'সৈয়দ': 'Syed', 'সৈয়দা': 'Syeda', 'সৈয়দা': 'Syeda',
    'সোবহান': 'Sobhan', 'সোমা': 'Soma', 'সোরায়েল': 'Sorael', 'সোহেলী': 'Soheli',
    'সৌমিত্র': 'Soumitra', 'সৌরভ': 'Sourav', 'সজল': 'Sajal', 'সজীব': 'Sajib',
    'সঞ্জয়': 'Sanjay', 'সঞ্জীব': 'Sanjib', 'সত্য': 'Satya', 'সৈকত': 'Saikat',
    'স্বপন': 'Swapan', 'সবুর': 'Sabur', 'সমীর': 'Samir', 'সাদিয়া': 'Sadia',
    'সাদিক': 'Sadik', 'সাকিব': 'Sakib', 'সাগর': 'Sagar', 'সালাউদ্দিন': 'Salauddin',
    'সালাহউদ্দিন': 'Salahuddin', 'সালেহ': 'Saleh', 'সালেহীন': 'Saleheen',
    'সাজেদ': 'Sajed', 'সাজেদুর': 'Sajedur', 'সালমা': 'Salma', 'সাইফুল': 'Saiful',
    'সাইফ': 'Saif', 'সাইয়েদ': 'Syed', 'সোহাগ': 'Sohag', 'সোহেল': 'Sohel',
    'সরকার': 'Sarker', 'সরদার': 'Sarder', 'শিকদার': 'Shikder', 'শাহ': 'Shah',
    'শাহী': 'Shahi', 'শাহীন': 'Shahin', 'শাহিনুর': 'Shahinur', 'শাহেদ': 'Shahed',
    'শাহাদাত': 'Shahadat', 'শাহজাহান': 'Shahjahan', 'শামিম': 'Shamim',
    'শামীম': 'Shamim', 'শামসুদ্দিন': 'Shamsuddin', 'শামসুল': 'Shamsul',
    'শফিক': 'Shafiq', 'শফিকুল': 'Shafiqul', 'শরীফ': 'Sharif', 'শরীফুল': 'Shariful',
    'শেখ': 'Sheikh', 'শিবলী': 'Shibli', 'শিশির': 'Shishir', 'শুভা': 'Shuva',
    'শোভন': 'Shovon', 'শ্যামল': 'Shyamal',

    # H
    'হক': 'Haque', 'হাকিম': 'Hakim', 'হাচান': 'Hasan', 'হানিফ': 'Hanif',
    'হাফিজুল': 'Hafizul', 'হাবিব': 'Habib', 'হাবিবুর': 'Habibur', 'হাবীব': 'Habib',
    'হামিদ': 'Hamid', 'হারুন': 'Harun', 'হাসান': 'Hasan', 'হাসানুর': 'Hasanur',
    'হাসিবা': 'Hasiba', 'হিরন': 'Hiron', 'হীরা': 'Hira', 'হুদা': 'Huda',
    'হুসাইন': 'Hussain', 'হেলাল': 'Helal', 'হোমায়রা': 'Humaira', 'হোসেন': 'Hossain',
    'হ্যাপি': 'Happy',
}

# Complete Bangladeshi Name Mappings: EN -> BN
EN_TO_BN_DICT = {
    # Initials
    'A.': 'এ.', 'B.': 'বি.', 'C.': 'সি.', 'D.': 'ডি.', 'E.': 'ই.', 'F.': 'এফ.',
    'G.': 'জি.', 'H.': 'এইচ.', 'I.': 'আই.', 'J.': 'জে.', 'K.': 'কে.', 'L.': 'এল.',
    'M.': 'এম.', 'N.': 'এন.', 'O.': 'ও.', 'P.': 'পি.', 'Q.': 'কিউ.', 'R.': 'আর.',
    'S.': 'এস.', 'T.': 'টি.', 'U.': 'ইউ.', 'V.': 'ভি.', 'W.': 'ডব্লিউ.', 'X.': 'এক্স.',
    'Y.': 'ওয়াই.', 'Z.': 'জেড.',
    'A': 'এ.', 'B': 'বি.', 'C': 'সি.', 'D': 'ডি.', 'E': 'ই.', 'F': 'এফ.',
    'G': 'জি.', 'H': 'এইচ.', 'I': 'আই.', 'J': 'জে.', 'K': 'কে.', 'L': 'এল.',
    'M': 'এম.', 'N': 'এন.', 'O': 'ও.', 'P': 'পি.', 'Q': 'কিউ.', 'R': 'আর.',
    'S': 'এস.', 'T': 'টি.', 'U': 'ইউ.', 'V': 'ভি.', 'W': 'ডব্লিউ.', 'X': 'এক্স.',
    'Y': 'ওয়াই.', 'Z': 'জেড.',
    'AKM': 'এ. কে. এম.',

    # Standard Titles & Connectors
    'Md.': 'মোঃ', 'Md': 'মোঃ', 'Mohammad': 'মোহাম্মদ', 'Mohammed': 'মোহাম্মদ',
    'Muhammad': 'মুহাম্মদ', 'Muhammed': 'মুহাম্মদ', 'Mosammat': 'মোসাম্মাৎ',
    'Ahmed': 'আহমেদ', 'Ahmad': 'আহমদ', 'Rahman': 'রহমান', 'Hossain': 'হোসেন',
    'Hosain': 'হোসেন', 'Hosein': 'হোসেন', 'Hussain': 'হুসাইন', 'Chowdhury': 'চৌধুরী',
    'Khan': 'খান', 'Islam': 'ইসলাম', 'Ali': 'আলী', 'Hasan': 'হাসান', 'Hassan': 'হাসান',
    'Mahmud': 'মাহমুদ', 'Mahmood': 'মাহমুদ', 'Alam': 'আলম', 'Karim': 'করিম',
    'Rahim': 'রহিম', 'Haque': 'হক', 'Hoque': 'হক', 'Haq': 'হক', 'Rashid': 'রশিদ',
    'Rashed': 'রাশেদ', 'Akter': 'আক্তার', 'Akhtar': 'আখতার', 'Begum': 'বেগম',
    'Khatun': 'খাতুন', 'Sarker': 'সরকার', 'Sarkar': 'সরকার', 'Sarder': 'সরদার',
    'Sardar': 'সরদার', 'Shikder': 'শিকদার', 'Shikdar': 'শিকদার', 'Talukder': 'তালুকদার',
    'Talukdar': 'তালুকদার', 'Majumder': 'মজুমদার', 'Mazumder': 'মজুমদার',
    'Barua': 'বড়ুয়া', 'Mandal': 'মন্ডল', 'Biswas': 'বিশ্বাস', 'Ghosh': 'ঘোষ',
    'Paul': 'পাল', 'Das': 'দাস', 'Roy': 'রায়', 'Chakraborty': 'চক্রবর্তী',
    'Uddin': 'উদ্দিন', 'Bhuiyan': 'ভুঁইয়া', 'Bhuia': 'ভুঁইয়া', 'Kazi': 'কাজী',
    'Qazi': 'কাজী', 'Gazi': 'গাজী', 'Dewan': 'দেওয়ান', 'Mir': 'মির', 'Mirza': 'মির্জা',
    'Mollah': 'মোল্লা', 'Malla': 'মোল্লা', 'Munshi': 'মুন্সী', 'Pramanik': 'প্রামাণিক',
    'Bari': 'বারী', 'Farhana': 'ফারহানা', 'Faria': 'ফারিয়া', 'Fariha': 'ফারিহা',
    'Sadia': 'সাদিয়া', 'Sabrina': 'সাবরিনা', 'Sultana': 'সুলতানা', 'Salma': 'সালমা',
    'Nasreen': 'নাসরিন', 'Nasrin': 'নাসরিন', 'Nazneen': 'নাজনীন', 'Farzana': 'ফারজানা',
    'Tania': 'তানিয়া', 'Sharmin': 'শারমিন', 'Nusrat': 'নুসরাত', 'Jahan': 'জাহান',
    'Tahmina': 'তাহমিনা', 'Afsana': 'আফসানা', 'Afroz': 'আফরোজ', 'Tanvir': 'তানভীর',
    'Ashik': 'আশিক', 'Shakil': 'শাকিল', 'Jahid': 'জাহিদ', 'Zahid': 'জাহিদ',
    'Sayed': 'সায়েদ', 'Syed': 'সৈয়দ', 'Syeda': 'সৈয়দা', 'Sheikh': 'শেখ',
    'Shah': 'শাহ', 'Abdullahel': 'আব্দুল্লাহেল', 'Anam': 'এনাম', 'Anisur': 'আনিসুর',
    'Apel': 'আপেল', 'Arefin': 'আরেফিন', 'Arjumand': 'আরজুমান্দ', 'Armanul': 'আরমানুল',
    'Armin': 'আরমিন', 'Azhar': 'আজহার', 'Babrul': 'বাবরুল', 'Banu': 'বানু',
    'Binoy': 'বিনয়', 'Binte': 'বিনতে', 'Bithi': 'বীথি', 'Dastagir': 'দস্তগীর',
    'Delwar': 'দেলোয়ার', 'Diu': 'দিউ', 'Ehsanul': 'এহসানুল', 'Fakrul': 'ফখরুল',
    'Fazle': 'ফজলে', 'Foyezi': 'ফয়েজী', 'Foyzul': 'ফয়জুল', 'Gani': 'গনি',
    'Goni': 'গনি', 'Hashim': 'হাশিম', 'Ikhteyar': 'ইখতিয়ার', 'Indrajit': 'ইন্দ্রজিৎ',
    'Irfan': 'ইরফান', 'Jahidul': 'জাহিদুল', 'Joni': 'জনি', 'Juliet': 'জুলিয়েট',
    'Kafi': 'কাফী', 'Kalam': 'কালাম', 'Kanak': 'কনক', 'Kaniz': 'কানিজ',
    'Kanti': 'কান্তি', 'Kar': 'কর', 'Karmaker': 'কর্মকার', 'Khondokar': 'খন্দকার',
    'Khondoker': 'খন্দকার', 'Kibria': 'কিবরিয়া', 'Krishna': 'কৃষ্ণ', 'Kundu': 'কুন্ডু',
    'Laila': 'লায়লা', 'Liton': 'লিটন', 'Mafruha': 'মাফরুহা', 'Mahfuzer': 'মাহফুজুর',
    'Manabendra': 'মানবেন্দ্র', 'Mansur': 'মনসুর', 'Manzur': 'মঞ্জুর', 'Mark': 'মার্ক',
    'Maruf': 'মারুফ', 'Mashiur': 'মশিউর', 'Mawla': 'মওলা', 'Meghla': 'মেঘলা',
    'Miah': 'মিঞা', 'Millat': 'মিল্লাত', 'Mogni': 'মগনি', 'Mohit': 'মোহিত',
    'Mohsinul': 'মহসিনুল', 'Moinuddin': 'মঈনউদ্দিন', 'Mojibor': 'মজিবর',
    'Mokhlesur': 'মোখলেসুর', 'Monirul': 'মনিরুল', 'Monzur': 'মনজুর',
    'Morchalin': 'মরছালিন', 'Mosharraf': 'মোশাররফ', 'Mujibur': 'মুজিবুর',
    'Nabi': 'নবী', 'Nag': 'নাগ', 'Naresh': 'নরেশ', 'Nath': 'নাথ',
    'Naushad': 'নওশাদ', 'Nilima': 'নীলিমা', 'Nripen': 'নৃপেন', 'Nupur': 'নূপুর',
    'Osmani': 'ওসমানী', 'Ovi': 'অভি', 'Parwin': 'পারভীন', 'Patwary': 'পাটওয়ারী',
    'Rabbi': 'রাব্বি', 'Raisa': 'রাইসা', 'Rajashis': 'রাজশীষ', 'Rajibur': 'রাজিবুর',
    'Rajiur': 'রাজিউর', 'Rashedul': 'রাশেদুল', 'Razzak': 'রাজ্জাক',
    'Rezwanur': 'রেজওয়ানুর', 'Riyad': 'রিয়াদ', 'Rojibul': 'রজিবুল', 'Romel': 'রমেল',
    'Rowshon': 'রওশন', 'Rubel': 'রুবেল', 'Rumana': 'রুমানা', 'Sader': 'সাদের',
    'Safi': 'সাফী', 'Safiuddin': 'সাফিউদ্দিন', 'Saha': 'সাহা', 'Saidul': 'সাইদুল',
    'Sajjad': 'সাজ্জাদ', 'Saki': 'সাকী', 'Salah': 'সালাহ', 'Salam': 'সালাম',
    'Sampriti': 'সম্প্রীতি', 'Sarwar': 'সারোয়ার', 'Sayeed': 'সাঈদ', 'Sayem': 'সায়েম',
    'Shafiqur': 'শফিকুর', 'Shahiduzzaman': 'শহীদুজ্জামান', 'Shahnaz': 'শাহনাজ',
    'Shahnewaz': 'শাহনেওয়াজ', 'Shapur': 'শাহপুর', 'Sharifuzzaman': 'শরিফুজ্জামান',
    'Sirajul': 'সিরাজুল', 'Sium': 'সিয়াম', 'Sobhan': 'সোবহান', 'Sudhangshu': 'সুধাংশু',
    'Sumanta': 'সুমন্ত', 'Sumon': 'সুমন', 'Suraiya': 'সুরাইয়া', 'Sushmita': 'সুস্মিতা',
    'Tahnia': 'তাহনিয়া', 'Tahseen': 'তাহসিন', 'Taiyeb': 'তৈয়ব', 'Tanbeen': 'তানবীন',
    'Tarafder': 'তরফদার', 'Tarikul': 'তারিকুল', 'Taslim': 'তাসলিম',
    'Taufique': 'তৌফিক', 'Tito': 'টিটো', 'Tohidul': 'তৌহিদুল', 'Tushar': 'তুষার',
    'Ullah': 'উল্লাহ', 'Un': 'উন', 'Uzzaman': 'উজ্জামান', 'Zakirul': 'জাকিরুল',
    'Zillur': 'জিল্লুর', 'Abdul': 'আব্দুল', 'Abdullah': 'আব্দুল্লাহ', 'Abdur': 'আব্দুর',
    'Abu': 'আবু', 'Abul': 'আবুল', 'Ahsan': 'আহসান', 'Al': 'আল', 'Alamgir': 'আলমগীর',
    'Alim': 'আলিম', 'Aminur': 'আমিনুর', 'Amir': 'আমির', 'Amiruzzaman': 'আমিরুজ্জামান',
    'Anisul': 'আনিসুল', 'Anwarul': 'আনোয়ারুল', 'Ashraful': 'আশরাফুল', 'Azad': 'আজাদ',
    'Azam': 'আজম', 'Aziz': 'আজিজ', 'Azizul': 'আজিজুল', 'Bazlul': 'বজলুল',
    'Faisal': 'ফয়সাল', 'Farid': 'ফরিদ', 'Faruque': 'ফারুক', 'Firoz': 'ফিরোজ',
    'Golam': 'গোলাম', 'Habibur': 'হাবিবুর', 'Hafiz': 'হাফিজ', 'Happy': 'হ্যাপি',
    'Harun': 'হারুন', 'Hasina': 'হাসিনা', 'Ibn': 'ইবনে', 'Ibrahim': 'ইব্রাহিম',
    'Idris': 'ইদ্রিস', 'Iqbal': 'ইকবাল', 'Ishrat': 'ইশরাত', 'Jabbar': 'জব্বার',
    'Jahangir': 'জাহাঙ্গীর', 'Jiban': 'জীবন', 'Junaid': 'জুনায়েদ', 'Kader': 'কাদের',
    'Kamal': 'কামাল', 'Kamrul': 'কামরুল', 'Kamruzzaman': 'কামরুজ্জামান',
    'Khaled': 'খালেদ', 'Khalil': 'খলিল', 'Kumar': 'কুমার', 'Mamun': 'মামুন',
    'Masum': 'মাসুম', 'Mizanur': 'মিজানুর', 'Mohibur': 'মহিবুর', 'Mohiuddin': 'মহিউদ্দিন',
    'Mohsin': 'মহসিন', 'Munna': 'মুন্না', 'Muntasir': 'মুনতাসির', 'Nazmul': 'নাজমুল',
    'Nazrul': 'নজরুল', 'Nur': 'নুর', 'Parveen': 'পারভীন', 'Quddus': 'কুদ্দুস',
    'Rabiul': 'রবিউল', 'Rafiqul': 'রফিকুল', 'Raihan': 'রায়হান', 'Reza': 'রেজা',
    'Rezaul': 'রেজাউল', 'Ripon': 'রিপন', 'Ruhul': 'রুহুল', 'Saif': 'সাইফ',
    'Saiful': 'সাইফুল', 'Saleh': 'সালেহ', 'Sanjib': 'সঞ্জীব', 'Shafiqul': 'শফিকুল',
    'Shahadat': 'শাহাদাত', 'Shahin': 'শাহীন', 'Shamim': 'শামীম',
    'Chandra': 'চন্দ্র', 'Debnath': 'দেবনাথ', 'Dipu': 'দিপু', 'Enamul': 'এনামুল',
    'Humaira': 'হুমায়রা', 'Khairul': 'খায়রুল', 'Khandaker': 'খন্দকার',
    'Khorshed': 'খোরশেদ', 'Mahbubul': 'মাহবুবুল', 'Momtaz': 'মমতাজ',
    'Motiur': 'মতিউর', 'Or': 'অর', 'Pranab': 'প্রণব', 'Tahsin': 'তাহসিন',
    'Tarek': 'তারেক', 'Towhid': 'তৌহিদ', 'Wasim': 'ওয়াসিম', 'Zahir': 'জহির',
    'Zakaria': 'জাকারিয়া', 'Zaman': 'জামান',
}

PREFIX_PATTERNS = [
    r'^\s*Prof\.?\s*\(\s*Dr\.?\s*\)\s*',
    r'^\s*Prof\.?\s*Dr\.?\s*',
    r'^\s*Professor\s*Dr\.?\s*',
    r'^\s*Professor\s*',
    r'^\s*Prof\.?\s*',
    r'^\s*Dr\.?\s*',
    r'^\s*এক্স\s*অধ্যাপক\s*\(?ডা[.:ঃ]?\)?\s*',
    r'^\s*সহযোগী\s*অধ্যাপক\s*\(?ডা[.:ঃ]?\)?\s*',
    r'^\s*সহকারী\s*অধ্যাপক\s*\(?ডা[.:ঃ]?\)?\s*',
    r'^\s*অধ্যাপক\s*\(অব[.:ঃ]?\)\s*\(?ডা[.:ঃ]?\)?\s*',
    r'^\s*অধ্যাপক\s*\(ডা[.:ঃ]?\)\s*',
    r'^\s*অধ্যাপক\s*ডা[.:ঃ]+\s*',
    r'^\s*অধ্যাপক\s*ডাচ্\s*',
    r'^\s*অধ্যাপক\s*ডা\s+',
    r'^\s*অধ্যাপক\s*(?:কর্নেল|কর্ণেল)\s*\(?ডা[.:ঃ]?\)?\s*',
    r'^\s*অধ্যাপক\s*(?:ব্রিগেডিয়ার|ব্রিগেডিয়ার)\s*জেনারেল\s*\(?ডা[.:ঃ]?\)?\s*',
    r'^\s*অধ্যাপক\s*লেফটেন্যান্ট\s*(?:কর্নেল|কর্ণেল)\s*\(?ডা[.:ঃ]?\)?\s*',
    r'^\s*অধ্যাপক\s*মেজর\s*\(অব[.:ঃ]?\)\s*\(?ডা[.:ঃ]?\)?\s*',
    r'^\s*অধ্যাপক\s*',
    r'^\s*প্রফেসর\s*\(?ডা[.:ঃ]?\)?\s*',
    r'^\s*প্রফেসর\s*',
    r'^\s*(?:কর্নেল|কর্ণেল)\s*অধ্যাপক\s*\(?ডা[.:ঃ]?\)?\s*',
    r'^\s*(?:ব্রিগেডিয়ার|ব্রিগেডিয়ার)\s*জেনারেল\s*অধ্যাপক\s*\(?ডা[.:ঃ]?\)?\s*',
    r'^\s*(?:ব্রিগেডিয়ার|ব্রিগেডিয়ার)\s*জেনারেল\s*\(?ডা[.:ঃ]?\)?\s*',
    r'^\s*ব্রি[:.]?\s*জেনালে?র\s*\(?ডা[.:ঃ]?\)?\s*',
    r'^\s*মেজর\s*জেনারেল\s*\(অব[.:ঃ]?\)\s*ডা[.:ঃ]?\s*',
    r'^\s*মেজর\s*জেনারেল\s*\(?ডা[.:ঃ]?\)?\s*',
    r'^\s*মেজর\s*\(অব[.:ঃ]?\)\s*\(?ডা[.:ঃ]?\)?\s*',
    r'^\s*মেজর\s*\(?ডা[.:ঃ]?\)?\s*',
    r'^\s*(?:কর্নেল|কর্ণেল)\s*\(?ডা[.:ঃ]?\)?\s*',
    r'^\s*লেফটেন্যান্ট\s*(?:কর্নেল|কর্ণেল)\s*\(?ডা[.:ঃ]?\)?\s*',
    r'^\s*ডাক্তার\s*',
    r'^\s*\(ডা[.:ঃ]?\)\s*',
    r'^\s*ডাচ্\s*',
    r'^\s*ডা[.:ঃ]+\s*',
    r'^\s*ডা\s+',
]

SUFFIX_PATTERNS = [
    r'\s*\(অব[.:ঃ]?\)\s*$',
    r'\s*\(Retd[.:]?\)\s*$',
]

def clean_raw_name(s):
    s = str(s).strip()
    # Normalize rogue Indic unicode characters
    s = s.replace('\u0ccb\u0c9c\u09be', 'োজা')
    s = s.replace('\u0bbf\u0ba9\u0bbe', 'িনা')
    changed = True
    while changed:
        changed = False
        for p in PREFIX_PATTERNS:
            m = re.sub(p, '', s, flags=re.IGNORECASE).strip()
            if m != s:
                s = m
                changed = True
        for p in SUFFIX_PATTERNS:
            m = re.sub(p, '', s, flags=re.IGNORECASE).strip()
            if m != s:
                s = m
                changed = True
    return s

def transliterate_bn_to_en(name_bn):
    clean = clean_raw_name(name_bn)
    # Split preserving delimiters
    tokens = re.split(r'(\s+|[().,-]+)', clean)
    out_tokens = []
    unresolved = []

    for t in tokens:
        if not t or re.match(r'^\s+$', t) or re.match(r'^[().,-]+$', t):
            out_tokens.append(t)
            continue
        # Strip trailing punctuation for lookup
        t_clean = t.rstrip(':।.,')
        if t_clean in BN_TO_EN_DICT:
            out_tokens.append(BN_TO_EN_DICT[t_clean])
        elif t in BN_TO_EN_DICT:
            out_tokens.append(BN_TO_EN_DICT[t])
        else:
            out_tokens.append(t)
            unresolved.append(t)

    result = "".join(out_tokens).strip()
    result = re.sub(r'\s+', ' ', result)
    return result, unresolved

def transliterate_en_to_bn(name_en):
    clean = clean_raw_name(name_en)
    tokens = re.split(r'(\s+|[().,-]+)', clean)
    out_tokens = []
    unresolved = []

    for t in tokens:
        if not t or re.match(r'^\s+$', t) or re.match(r'^[().,-]+$', t):
            # Clean up accidental duplicate dots
            if t == '.' and out_tokens and out_tokens[-1].endswith('.'):
                continue
            out_tokens.append(t)
            continue
        t_clean = t.rstrip('.')
        if t_clean in EN_TO_BN_DICT:
            out_tokens.append(EN_TO_BN_DICT[t_clean])
        elif t in EN_TO_BN_DICT:
            out_tokens.append(EN_TO_BN_DICT[t])
        elif t.capitalize() in EN_TO_BN_DICT:
            out_tokens.append(EN_TO_BN_DICT[t.capitalize()])
        else:
            out_tokens.append(t)
            unresolved.append(t)

    result = "".join(out_tokens).strip()
    result = re.sub(r'([ঃ:])\.', r'\1', result)
    result = re.sub(r'\s+', ' ', result)
    return result, unresolved

def main():
    input_file = "doctor_names_export.csv"
    output_file = "doctor_names_reviewed.csv"

    with open(input_file, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"Processing {len(rows)} doctor records...")

    fieldnames = [
        "id",
        "current_name",
        "detected_language",
        "name_en",
        "name_bn",
        "current_slug",
        "bmdc_number",
        "needs_review",
    ]

    all_unresolved = set()
    reviewed_rows = []

    for r in rows:
        lang = r["detected_language"]
        current_name = r["current_name"]
        slug = r["current_slug"]
        bmdc = r["bmdc_number"]
        doc_id = r["id"]

        is_suspicious_slug = not slug or slug.startswith("-") or slug.startswith("doctor-")

        if lang == "bn":
            clean_bn = clean_raw_name(current_name)
            name_en, unres = transliterate_bn_to_en(clean_bn)
            name_bn = clean_bn
            if unres:
                all_unresolved.update(unres)
            needs_rev = "yes" if (unres or is_suspicious_slug) else ""
        else:
            clean_en = clean_raw_name(current_name)
            name_bn, unres = transliterate_en_to_bn(clean_en)
            name_en = clean_en
            if unres:
                all_unresolved.update(unres)
            needs_rev = "yes" if (unres or is_suspicious_slug) else ""

        reviewed_rows.append({
            "id": doc_id,
            "current_name": current_name,
            "detected_language": lang,
            "name_en": name_en,
            "name_bn": name_bn,
            "current_slug": slug,
            "bmdc_number": bmdc,
            "needs_review": needs_rev,
        })

    with open(output_file, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(reviewed_rows)

    print(f"Generated {output_file} with {len(reviewed_rows)} rows.")
    if all_unresolved:
        print(f"Unresolved words ({len(all_unresolved)}): {sorted(list(all_unresolved))}")
    else:
        print("100% of words were successfully resolved from dictionary!")

if __name__ == "__main__":
    main()
