import re
from django.core.management.base import BaseCommand
from django.db import models, transaction
from django.utils.text import slugify
from doctors.models import Doctor, DoctorSpecialty, SpecialtyAlias
from doctors.services.specialty_resolver import (
    normalize_text,
    detect_language,
    parse_compound_components,
    resolve_specialty,
    resolve_specialty_ids,
)

# Canonical Taxonomy Definition (~42 specialties)
CANONICAL_SPECIALTIES = [
    {
        "name": "Cardiology",
        "canonical_name": "Cardiology",
        "bn_name": "হৃদরোগ ও কার্ডিওলজি",
        "icon": "Heart",
        "aliases": [
            "Cardiology", "কার্ডিওলজি", "হৃদরোগ", "Cardiac", "Heart",
            "হৃদরোগ বিশেষজ্ঞ", "কার্ডিওলজিস্ট", "Interventional Cardiology",
            "Clinical Cardiology", "Preventive Cardiology"
        ],
    },
    {
        "name": "Cardiac Surgery",
        "canonical_name": "Cardiac Surgery",
        "bn_name": "কার্ডিয়াক সার্জারি",
        "icon": "Heart",
        "aliases": [
            "Cardiac Surgery", "Cardiovascular Surgery", "Cardiovascular & Thoracic Surgery",
            "কার্ডিওভাসকুলার সার্জারি", "কার্ডিয়াক সার্জন", "হার্ট সার্জারি"
        ],
    },
    {
        "name": "General Medicine",
        "canonical_name": "General Medicine",
        "bn_name": "মেডিসিন",
        "icon": "Stethoscope",
        "aliases": [
            "Medicine", "মেডিসিন", "Internal Medicine", "General Medicine",
            "মেডিসিন বিশেষজ্ঞ", "ইন্টারনাল মেডিসিন", "ফ্যামিলি মেডিসিন", "Family Medicine"
        ],
    },
    {
        "name": "Gynecology & Obstetrics",
        "canonical_name": "Gynecology & Obstetrics",
        "bn_name": "স্ত্রীরোগ ও প্রসূতিবিদ্যা (গাইনী)",
        "icon": "Users",
        "aliases": [
            "Gynecology", "Obstetrics", "গাইনী", "গাইনী এন্ড অবস্", "স্ত্রীরোগ",
            "প্রসূতি রোগ", "Obs & Gynae", "Gynaecology", "Maternal Fetal Medicine",
            "ফিটোম্যাট্যারনাল মেডিসিন", "মেটারনাল-ফিট্যাল মেডিসিন", "স্ত্রীরোগ বিশেষজ্ঞ"
        ],
    },
    {
        "name": "Infertility & Reproductive Medicine",
        "canonical_name": "Infertility & Reproductive Medicine",
        "bn_name": "বন্ধ্যাত্ব ও রিপ্রোডাক্টিভ মেডিসিন",
        "icon": "Users",
        "aliases": [
            "Infertility", "বন্ধ্যাত্ব", "বন্ধ্যাত্ব বিশেষজ্ঞ", "বন্ধ্যাত্ব চিকিৎসা",
            "রিপ্রোডাক্টিভ এন্ডোক্রিনোলজি", "রিপ্রোডাক্টিভ এন্ডোক্রিনোলজি ও ইনফার্টিলিটি",
            "Reproductive Medicine", "IVF", "আইভিএফ"
        ],
    },
    {
        "name": "Diabetes & Endocrinology",
        "canonical_name": "Diabetes & Endocrinology",
        "bn_name": "ডায়াবেটিস, থাইরয়েড ও হরমোন রোগ",
        "icon": "Activity",
        "aliases": [
            "Diabetes", "ডায়াবেটিস", "Endocrinology", "Diabetology", "হরমোন",
            "হরমোন ও ডায়াবেটিস", "থাইরয়েড", "Thyroid", "Hormone", "Metabolism",
            "মেটাবলিজম", "স্থূলতা ও হরমোন রোগ", "প্রজনন হরমোন"
        ],
    },
    {
        "name": "Nephrology",
        "canonical_name": "Nephrology",
        "bn_name": "কিডনি রোগ (নেফ্রোলজি)",
        "icon": "Activity",
        "aliases": [
            "Nephrology", "নেফ্রোলজি", "কিডনি রোগ", "Kidney Diseases", "Dialysis",
            "ডায়ালাইসিস", "রেনাল", "Renal Medicine", "কিডনি বিশেষজ্ঞ", "বৃক্কব্যাধি"
        ],
    },
    {
        "name": "General Surgery",
        "canonical_name": "General Surgery",
        "bn_name": "জেনারেল ও ল্যাপারোস্কোপিক সার্জারি",
        "icon": "Scissors",
        "aliases": [
            "General Surgery", "Surgery", "সার্জারি", "Laparoscopic Surgery",
            "ল্যাপারোস্কোপিক সার্জারি", "সার্জারি বিশেষজ্ঞ", "ল্যাপারোস্কোপিক সার্জন",
            "Minimal Access Surgery", "মিনিমাল এক্সেস সার্জারি", "লেজার সার্জারি"
        ],
    },
    {
        "name": "Neurology",
        "canonical_name": "Neurology",
        "bn_name": "নিউরোলজি (স্নায়ুরোগ)",
        "icon": "Brain",
        "aliases": [
            "Neurology", "নিউরোলজি", "নিউরোমেডিসিন", "Neuromedicine", "স্নায়ুরোগ",
            "Stroke", "স্ট্রোক", "Headache", "মাথাব্যথা", "নিউরো", "স্নায়ু বিশেষজ্ঞ"
        ],
    },
    {
        "name": "Neurosurgery",
        "canonical_name": "Neurosurgery",
        "bn_name": "নিউরোসার্জারি (ব্রেইন ও স্পাইন সার্জারি)",
        "icon": "Brain",
        "aliases": [
            "Neurosurgery", "নিউরোসার্জারি", "Brain Surgery", "ব্রেইন সার্জারি",
            "নিউরোভাসকুলার সার্জারি", "স্কাল বেইস সার্জারি", "নিউরোইন্টারভেনশন"
        ],
    },
    {
        "name": "Orthopedics",
        "canonical_name": "Orthopedics",
        "bn_name": "অর্থোপেডিক (হাড় ও জোড়া রোগ)",
        "icon": "Bone",
        "aliases": [
            "Orthopedics", "Orthopaedic Surgery", "অর্থোপেডিক", "অর্থোপেডিক্স",
            "অর্থোপেডিক সার্জারি", "Bone And Joint", "হাড়-জোড়া রোগ", "Joint Replacement",
            "Arthroplasty", "Arthroscopy", "বাতব্যথা", "ট্রমা", "Trauma Surgery"
        ],
    },
    {
        "name": "Spine Surgery",
        "canonical_name": "Spine Surgery",
        "bn_name": "স্পাইন সার্জারি",
        "icon": "Bone",
        "aliases": [
            "Spine Surgery", "স্পাইন সার্জন", "স্পাইন সার্জারি",
            "মিনিম্যালি ইনভেসিভ স্পাইন সার্জারি", "Spine"
        ],
    },
    {
        "name": "Hepatology",
        "canonical_name": "Hepatology",
        "bn_name": "হেপাটোলজি (লিভার রোগ)",
        "icon": "Activity",
        "aliases": [
            "Hepatology", "হেপাটোলজি", "লিভার রোগ", "Liver", "Liver Diseases",
            "লিভার বিশেষজ্ঞ"
        ],
    },
    {
        "name": "Hepatobiliary Surgery",
        "canonical_name": "Hepatobiliary Surgery",
        "bn_name": "হেপাটোবিলিয়ারি সার্জারি",
        "icon": "Scissors",
        "aliases": [
            "Hepatobiliary", "হেপাটোবিলিয়ারি ও প্যানক্রিয়াটিক সার্জারি",
            "HPB Surgery", "Liver Transplant", "প্যানক্রিয়াস সার্জারি"
        ],
    },
    {
        "name": "Respiratory Medicine",
        "canonical_name": "Respiratory Medicine",
        "bn_name": "বক্ষব্যাধি ও পালমোনোলজি",
        "icon": "Activity",
        "aliases": [
            "Respiratory Medicine", "Pulmonology", "পালমোনোলজি", "বক্ষব্যাধি",
            "Chest Diseases", "Asthma", "হাঁপানি", "অ্যাজমা", "রেসপাইরেটরী মেডিসিন",
            "বক্ষব্যাধি বিশেষজ্ঞ", "টিবি", "Tuberculosis"
        ],
    },
    {
        "name": "ENT (Otolaryngology)",
        "canonical_name": "ENT (Otolaryngology)",
        "bn_name": "নাক, কান ও গলা রোগ (ইএনটি)",
        "icon": "Headphones",
        "aliases": [
            "ENT", "Ent", "নাক, কান ও গলা", "নাক, কান ও গলা (ইএনটি)", "Otolaryngology",
            "ইএনটি", "ই এন টি", "Head & Neck Surgery", "হেড এন্ড নেক সার্জারি",
            "নাক কান গলা বিশেষজ্ঞ"
        ],
    },
    {
        "name": "Psychiatry & Mental Health",
        "canonical_name": "Psychiatry & Mental Health",
        "bn_name": "মানসিক রোগ (সাইকিয়াট্রি)",
        "icon": "Smile",
        "aliases": [
            "Psychiatry", "সাইকিয়াট্রি", "Mental Health", "মানসিক রোগ", "মনোরোগ",
            "মানসিক রোগ বিশেষজ্ঞ", "Psychology", "মনোবিজ্ঞানী", "Addiction", "মাদকাসক্তি"
        ],
    },
    {
        "name": "Pediatrics",
        "canonical_name": "Pediatrics",
        "bn_name": "শিশু রোগ (পেডিয়াট্রিক্স)",
        "icon": "Baby",
        "aliases": [
            "Pediatrics", "শিশু রোগ", "পেডিয়াট্রিক্স", "শিশু বিশেষজ্ঞ", "Child Health",
            "শিশুস্বাস্থ্য", "Neonatology", "নবজাতক", "নিওনেটোলজি", "শিশু ও নবজাতক",
            "নবজাতক ও শিশু রোগ"
        ],
    },
    {
        "name": "Pediatric Surgery",
        "canonical_name": "Pediatric Surgery",
        "bn_name": "শিশু সার্জারি",
        "icon": "Scissors",
        "aliases": [
            "Pediatric Surgery", "শিশু সার্জারি", "শিশু সার্জারি ও শিশু ইউরোলজি",
            "ল্যাপারোস্কোপিক শিশু সার্জারি"
        ],
    },
    {
        "name": "Pediatric Cardiology",
        "canonical_name": "Pediatric Cardiology",
        "bn_name": "শিশু হৃদরোগ",
        "icon": "Heart",
        "aliases": [
            "Pediatric Cardiology", "শিশু হৃদরোগ", "শিশু হৃদরোগ বিশেষজ্ঞ", "পেডিয়াট্রিক কার্ডিওলজি"
        ],
    },
    {
        "name": "Pediatric Neurology",
        "canonical_name": "Pediatric Neurology",
        "bn_name": "শিশু স্নায়ুরোগ",
        "icon": "Brain",
        "aliases": [
            "Pediatric Neurology", "শিশু স্নায়ু রোগ", "শিশু স্নায়ুরোগ বিশেষজ্ঞ",
            "শিশু নিউরোলজি", "পেডিয়াট্রিক নিউরোলজি এন্ড ডেভেলপমেন্ট",
            "শিশু এপিলেপ্সি ও ইইজি"
        ],
    },
    {
        "name": "Pediatric Nephrology",
        "canonical_name": "Pediatric Nephrology",
        "bn_name": "শিশু কিডনি রোগ",
        "icon": "Activity",
        "aliases": [
            "Pediatric Nephrology", "শিশু নেফ্রোলজি", "শিশু কিডনি বিশেষজ্ঞ"
        ],
    },
    {
        "name": "Dermatology & Venereology",
        "canonical_name": "Dermatology & Venereology",
        "bn_name": "চর্ম ও যৌন রোগ",
        "icon": "Activity",
        "aliases": [
            "Dermatology", "চর্ম রোগ", "ডার্মাটোলজি", "স্কিন ও ভিডি", "Skin & VD",
            "Venereology", "যৌন রোগ", "চর্ম ও যৌন রোগ", "Cosmetology",
            "Dermatology & Skin Care", "চর্ম বিশেষজ্ঞ"
        ],
    },
    {
        "name": "Urology",
        "canonical_name": "Urology",
        "bn_name": "ইউরোলজি (মূত্রতন্ত্র রোগ)",
        "icon": "Activity",
        "aliases": [
            "Urology", "ইউরোলজি", "মূত্ররোগ", "Andrology", "এন্ড্রোলজি",
            "Kidney Stone", "ইউরোলজিস্ট", "পুরুষ বন্ধ্যাত্ব রোগ বিশেষজ্ঞ"
        ],
    },
    {
        "name": "Gastroenterology",
        "canonical_name": "Gastroenterology",
        "bn_name": "গ্যাস্ট্রোএন্টারোলজি (পরিপাকতন্ত্র রোগ)",
        "icon": "Activity",
        "aliases": [
            "Gastroenterology", "গ্যাস্ট্রোএন্টারোলজি", "পরিপাকতন্ত্র রোগ",
            "Gastroliver", "Endoscopy", "Colonoscopy", "পরিপাকতন্ত্র ও প্যানক্রিয়াস রোগ",
            "পরিপাকতন্ত্র ও লিভার ডিজিজেস"
        ],
    },
    {
        "name": "Ophthalmology",
        "canonical_name": "Ophthalmology",
        "bn_name": "চক্ষু রোগ (আই স্পেশালিস্ট)",
        "icon": "Eye",
        "aliases": [
            "Ophthalmology", "Eye", "চক্ষু রোগ", "চোখের ডাক্তার", "Retina",
            "রেটিনা", "Glaucoma", "গ্লুকোমা", "Cataract", "চোখ বিশেষজ্ঞ"
        ],
    },
    {
        "name": "Oncology",
        "canonical_name": "Oncology",
        "bn_name": "ক্যান্সার ও অনকোলজি",
        "icon": "Activity",
        "aliases": [
            "Oncology", "Cancer", "ক্যান্সার", "অনকোলজি", "Cancer Specialist",
            "Medical Oncology", "মেডিকেল অনকোলজি", "Radiation Oncology",
            "রেডিয়েশন অনকোলজি", "রেডিওথেরাপি", "ব্রেস্ট রোগ", "Breast Cancer"
        ],
    },
    {
        "name": "Surgical Oncology",
        "canonical_name": "Surgical Oncology",
        "bn_name": "সার্জিক্যাল অনকোলজি (ক্যান্সার সার্জারি)",
        "icon": "Scissors",
        "aliases": [
            "Surgical Oncology", "সার্জিক্যাল অনকোলজি", "Cancer Surgery",
            "ব্রেস্ট সার্জারি", "Breast Surgery"
        ],
    },
    {
        "name": "Hematology",
        "canonical_name": "Hematology",
        "bn_name": "হেমাটোলজি (রক্তরোগ)",
        "icon": "Activity",
        "aliases": [
            "Hematology", "হেমাটোলজি", "রক্তরোগ", "Blood Diseases", "রক্তরোগ বিশেষজ্ঞ",
            "Bone Marrow Transplant", "Thalassemia", "থ্যালাসেমিয়া"
        ],
    },
    {
        "name": "Physical Medicine & Rehabilitation",
        "canonical_name": "Physical Medicine & Rehabilitation",
        "bn_name": "ফিজিক্যাল মেডিসিন ও রিহ্যাবিলিটেশন",
        "icon": "Activity",
        "aliases": [
            "Physical Medicine", "Rehabilitation", "ফিজিক্যাল মেডিসিন",
            "রিহ্যাবিলিটেশন", "ফিজিওথেরাপি", "Physiotherapy",
            "ফিজিক্যাল মেডিসিন এন্ড রিহ্যাবিলিটেশন বিশেষজ্ঞ"
        ],
    },
    {
        "name": "Pain Management",
        "canonical_name": "Pain Management",
        "bn_name": "পেইন ম্যানেজমেন্ট (ব্যথানাশক চিকিৎসা)",
        "icon": "Activity",
        "aliases": [
            "Pain Management", "পেইন ম্যানেজমেন্ট", "Interventional Pain Management"
        ],
    },
    {
        "name": "Dentistry",
        "canonical_name": "Dentistry",
        "bn_name": "দন্ত রোগ ও ডেন্টিস্ট্রি",
        "icon": "Smile",
        "aliases": [
            "Dentistry", "Dental", "ডেন্টাল", "দন্ত রোগ", "দাঁতের ডাক্তার",
            "Orthodontics", "Oral & Maxillofacial Surgery", "ম্যাক্সিলোফেসিয়াল"
        ],
    },
    {
        "name": "Rheumatology",
        "canonical_name": "Rheumatology",
        "bn_name": "বাত ও রিউমাটোলজি",
        "icon": "Bone",
        "aliases": [
            "Rheumatology", "রিউমাটোলজি", "Arthritis", "বাত-ব্যাধি", "বাতজ্বর",
            "বাত রোগ", "রিউমাটোলজিস্ট"
        ],
    },
    {
        "name": "Plastic & Cosmetic Surgery",
        "canonical_name": "Plastic & Cosmetic Surgery",
        "bn_name": "প্লাস্টিক ও কসমেটিক সার্জারি",
        "icon": "Scissors",
        "aliases": [
            "Plastic Surgery", "প্লাস্টিক সার্জারি", "Cosmetic Surgery", "Burn Surgery"
        ],
    },
    {
        "name": "Vascular Surgery",
        "canonical_name": "Vascular Surgery",
        "bn_name": "ভাস্কুলার সার্জারি",
        "icon": "Scissors",
        "aliases": [
            "Vascular Surgery", "ভাসকুলার সার্জারি", "ভাস্কুলার সার্জন"
        ],
    },
    {
        "name": "Colorectal Surgery",
        "canonical_name": "Colorectal Surgery",
        "bn_name": "কোলোরেক্টাল সার্জারি",
        "icon": "Scissors",
        "aliases": [
            "Colorectal Surgery", "কোলোরেক্টাল সার্জন", "Proctology",
            "Piles", "পাইলস", "ফিস্টুলা", "Fistula"
        ],
    },
    {
        "name": "Critical Care & ICU",
        "canonical_name": "Critical Care & ICU",
        "bn_name": "ক্রিটিক্যাল কেয়ার ও আইসিইউ",
        "icon": "Activity",
        "aliases": [
            "Critical Care", "ICU", "আইসিইউ", "Intensive Care"
        ],
    },
    {
        "name": "Anesthesiology",
        "canonical_name": "Anesthesiology",
        "bn_name": "অ্যানেস্থেসিওলজি",
        "icon": "Activity",
        "aliases": [
            "Anesthesiology", "Anaesthesia", "অ্যানেস্থেসিয়া", "অ্যানেস্থেসিওলজিস্ট"
        ],
    },
    {
        "name": "Nutrition & Dietetics",
        "canonical_name": "Nutrition & Dietetics",
        "bn_name": "পুষ্টি ও ডায়েট",
        "icon": "Activity",
        "aliases": [
            "Dietetics", "Nutrition", "পুষ্টি", "পুষ্টিবিদ", "ডায়েটিশিয়ান",
            "Dietitian", "পুষ্টি ও নিউট্রিশন", "শিশু পুষ্টি"
        ],
    },
    {
        "name": "Radiology & Imaging",
        "canonical_name": "Radiology & Imaging",
        "bn_name": "রেডিওলজি ও ইমেজিং",
        "icon": "Activity",
        "aliases": [
            "Radiology", "Imaging", "রেডিওলজি", "রেডিওলজি ও ইমেজিং",
            "Sonology", "সনোলজি", "সিটি ও এমআরআই", "সিটিস্ক্যান", "সিটি এনজিওগ্রাম",
            "মলিকুলার ইমেজিং"
        ],
    },
    {
        "name": "Allergy & Immunology",
        "canonical_name": "Allergy & Immunology",
        "bn_name": "এলার্জি ও ইমিউনোলজি",
        "icon": "Activity",
        "aliases": [
            "Allergy", "Immunology", "এলার্জি", "এ্যালার্জি", "Allergy Specialist"
        ],
    },
]

# Explicit mappings for common variations in the 377 rows to canonical specialties
EXPLICIT_MAPPING = {
    # Medicine & variants
    "মেডিসিন": "General Medicine",
    "মেডিসিন বিশেষজ্ঞ": "General Medicine",
    "ইন্টারনাল মেডিসিন": "General Medicine",
    "ফ্যামিলি মেডিসিন": "General Medicine",
    "Adolescent Medicine": "General Medicine",

    # Cardiology
    "হৃদরোগ": "Cardiology",
    "কার্ডিওলজি": "Cardiology",
    "হৃদরোগ বিশেষজ্ঞ": "Cardiology",
    "কার্ডিওলজিস্ট": "Cardiology",

    # Cardiac Surgery
    "কার্ডিওভাসকুলার সার্জারি": "Cardiac Surgery",
    "Cardiovascular & Thoracic Surgery": "Cardiac Surgery",
    "Cardiovascular Surgery": "Cardiac Surgery",

    # Gynecology
    "গাইনী": "Gynecology & Obstetrics",
    "গাইনী এন্ড অবস্": "Gynecology & Obstetrics",
    "স্ত্রীরোগ": "Gynecology & Obstetrics",
    "প্রসূতি রোগ": "Gynecology & Obstetrics",
    "মেটারনাল-ফিট্যাল মেডিসিন": "Gynecology & Obstetrics",
    "ফিটোম্যাট্যারনাল মেডিসিন": "Gynecology & Obstetrics",

    # Infertility
    "বন্ধ্যাত্ব": "Infertility & Reproductive Medicine",
    "বন্ধ্যাত্ব বিশেষজ্ঞ": "Infertility & Reproductive Medicine",
    "বন্ধ্যাত্ব চিকিৎসা": "Infertility & Reproductive Medicine",
    "বন্ধ্যাত্ব স্ত্রীরোগ বিশেষজ্ঞ": "Infertility & Reproductive Medicine",
    "রিপ্রোডাক্টিভ এন্ডোক্রিনোলজি": "Infertility & Reproductive Medicine",
    "রিপ্রোডাক্টিভ এন্ডোক্রিনোলজি ও ইনফার্টিলিটি": "Infertility & Reproductive Medicine",

    # Diabetes & Endocrinology
    "ডায়াবেটিস": "Diabetes & Endocrinology",
    "ডায়াবেটিস": "Diabetes & Endocrinology",
    "হরমোন": "Diabetes & Endocrinology",
    "হরমোন ও ডায়াবেটিস": "Diabetes & Endocrinology",
    "হরমোন ও মেডিসিন": "Diabetes & Endocrinology",
    "স্থূলতা ও হরমোন রোগ": "Diabetes & Endocrinology",
    "মেটাবলিজম": "Diabetes & Endocrinology",
    "প্রজনন হরমোন": "Diabetes & Endocrinology",
    "Endocrinology": "Diabetes & Endocrinology",
    "Diabetology": "Diabetes & Endocrinology",

    # Nephrology
    "নেফ্রোলজি": "Nephrology",
    "কিডনি রোগ": "Nephrology",
    "Kidney Diseases": "Nephrology",
    "Dialysis": "Nephrology",
    "বৃক্কব্যাধি": "Nephrology",

    # General Surgery
    "সার্জারি": "General Surgery",
    "সার্জারি বিশেষজ্ঞ": "General Surgery",
    "ল্যাপারোস্কোপিক সার্জারি": "General Surgery",
    "ল্যাপারোস্কোপিক সার্জন": "General Surgery",
    "মিনিমাল এক্সেস সার্জারি": "General Surgery",
    "লেজার সার্জারি": "General Surgery",
    "Trauma Surgery": "General Surgery",

    # Neurology
    "নিউরোলজি": "Neurology",
    "নিউরোমেডিসিন": "Neurology",
    "স্নায়ুরোগ": "Neurology",
    "নিউরো": "Neurology",
    "স্ট্রোক": "Neurology",

    # Neurosurgery
    "নিউরোসার্জারি": "Neurosurgery",
    "Brain Surgery": "Neurosurgery",
    "নিউরোভাসকুলার সার্জারি": "Neurosurgery",
    "স্কাল বেইস সার্জারি": "Neurosurgery",
    "নিউরোইন্টারভেনশন": "Neurosurgery",

    # Orthopedics
    "অর্থোপেডিক": "Orthopedics",
    "অর্থোপেডিক্স": "Orthopedics",
    "অর্থোপেডিক সার্জারি": "Orthopedics",
    "হাড়-জোড়া রোগ": "Orthopedics",
    "Bone And Joint": "Orthopedics",
    "Joint Replacement": "Orthopedics",
    "Arthroplasty": "Orthopedics",
    "Arthroscopy": "Orthopedics",
    "বাতব্যথা": "Orthopedics",
    "শিশু অর্থোপেডিক": "Orthopedics",
    "শিশু অর্থোপেডিক সার্জারি": "Orthopedics",
    "শিশু অর্থোপেডিক্স বিশেষজ্ঞ": "Orthopedics",

    # Spine
    "স্পাইন সার্জন": "Spine Surgery",
    "স্পাইন সার্জারি": "Spine Surgery",
    "মিনিম্যালি ইনভেসিভ স্পাইন সার্জারি": "Spine Surgery",

    # Hepatology
    "হেপাটোলজি": "Hepatology",
    "লিভার রোগ": "Hepatology",

    # Hepatobiliary
    "হেপাটোবিলিয়ারি ও প্যানক্রিয়াটিক সার্জারি": "Hepatobiliary Surgery",

    # Respiratory Medicine
    "বক্ষব্যাধি": "Respiratory Medicine",
    "পালমোনোলজি": "Respiratory Medicine",
    "রেসপাইরেটরী মেডিসিন": "Respiratory Medicine",
    "বক্ষব্যাধি ও এজমা রোগ বিশেষজ্ঞ": "Respiratory Medicine",
    "Asthma": "Respiratory Medicine",
    "Chest Diseases": "Respiratory Medicine",

    # ENT
    "নাক, কান ও গলা": "ENT (Otolaryngology)",
    "নাক, কান ও গলা (ইএনটি)": "ENT (Otolaryngology)",
    "হেড এন্ড নেক সার্জারি": "ENT (Otolaryngology)",
    "Ent": "ENT (Otolaryngology)",

    # Psychiatry
    "সাইকিয়াট্রি": "Psychiatry & Mental Health",
    "মানসিক রোগ": "Psychiatry & Mental Health",
    "মানসিক রোগ বিশেষজ্ঞ": "Psychiatry & Mental Health",
    "মনোরোগ": "Psychiatry & Mental Health",
    "মাদকাসক্তি": "Psychiatry & Mental Health",

    # Pediatrics
    "শিশু রোগ": "Pediatrics",
    "শিশু রোগ বিশেষজ্ঞ": "Pediatrics",
    "পেডিয়াট্রিক্স": "Pediatrics",
    "শিশু বিশেষজ্ঞ": "Pediatrics",
    "শিশুস্বাস্থ্য": "Pediatrics",
    "শিশু ও নবজাতক": "Pediatrics",
    "নিওনেটোলজি": "Pediatrics",
    "Child Health": "Pediatrics",
    "নবজাতক ও শিশু রোগ": "Pediatrics",
    "শিশু পুষ্টি": "Pediatrics",
    "শিশু বক্ষব্যাধি": "Pediatrics",
    "শিশু গ্যাস্ট্রোএন্টারোলজি": "Pediatrics",
    "শিশু নেফ্রোলজি": "Pediatrics",
    "শিশু রিউমাটোলজি": "Pediatrics",

    # Pediatric Surgery
    "শিশু সার্জারি": "Pediatric Surgery",
    "শিশু সার্জারি ও শিশু ইউরোলজি": "Pediatric Surgery",
    "ল্যাপারোস্কোপিক শিশু সার্জারি": "Pediatric Surgery",

    # Pediatric Subspecialties
    "শিশু হৃদরোগ": "Pediatric Cardiology",
    "শিশু হৃদরোগ বিশেষজ্ঞ": "Pediatric Cardiology",
    "পেডিয়াট্রিক কার্ডিওলজি": "Pediatric Cardiology",
    "শিশু স্নায়ু রোগ": "Pediatric Neurology",
    "শিশু স্নায়ুরোগ বিশেষজ্ঞ": "Pediatric Neurology",
    "শিশু নিউরোলজি": "Pediatric Neurology",
    "পেডিয়াট্রিক নিউরোলজি এন্ড ডেভেলপমেন্ট": "Pediatric Neurology",
    "শিশু এপিলেপ্সি ও ইইজি": "Pediatric Neurology",
    "শিশু ইউরোলজি": "Pediatric Surgery",

    # Dermatology & Venereology
    "ডার্মাটোলজি": "Dermatology & Venereology",
    "স্কিন ও ভিডি": "Dermatology & Venereology",
    "যৌন রোগ": "Dermatology & Venereology",
    "Dermatology & Skin Care": "Dermatology & Venereology",

    # Urology
    "ইউরোলজি": "Urology",
    "Andrology": "Urology",
    "পুরুষ বন্ধ্যাত্ব রোগ বিশেষজ্ঞ": "Urology",

    # Gastroenterology
    "গ্যাস্ট্রোএন্টারোলজি": "Gastroenterology",
    "পরিপাকতন্ত্র ও প্যানক্রিয়াস রোগ": "Gastroenterology",
    "পরিপাকতন্ত্র ও লিভার ডিজিজেস": "Gastroenterology",

    # Oncology
    "মেডিকেল অনকোলজি": "Oncology",
    "রেডিয়েশন অনকোলজি": "Oncology",
    "রেডিওথেরাপি": "Oncology",
    "ক্যান্সার": "Oncology",
    "Cancer Specialist": "Oncology",
    "ব্রেস্ট রোগ": "Oncology",
    "Breast Cancer": "Oncology",
    "সার্জিক্যাল অনকোলজি": "Surgical Oncology",
    "Cancer Surgery": "Surgical Oncology",
    "Breast Surgery": "Surgical Oncology",
    "ব্রেস্ট সার্জারি": "Surgical Oncology",

    # Hematology
    "হেমাটোলজি": "Hematology",
    "রক্তরোগ": "Hematology",
    "রক্তরোগ বিশেষজ্ঞ": "Hematology",
    "Bone Marrow Transplant": "Hematology",

    # Physical Medicine & Rehabilitation
    "ফিজিক্যাল মেডিসিন": "Physical Medicine & Rehabilitation",
    "ফিজিক্যাল মেডিসিন এন্ড রিহ্যাবিলিটেশন বিশেষজ্ঞ": "Physical Medicine & Rehabilitation",
    "রিহ্যাবিলিটেশন": "Physical Medicine & Rehabilitation",
    "পেইন ম্যানেজমেন্ট": "Pain Management",

    # Rheumatology
    "রিউমাটোলজি": "Rheumatology",
    "বাত-ব্যাধি": "Rheumatology",
    "বাতজ্বর": "Rheumatology",
    "Arthritis": "Rheumatology",

    # Plastic Surgery
    "প্লাস্টিক সার্জারি": "Plastic & Cosmetic Surgery",

    # Vascular Surgery
    "ভাসকুলার সার্জারি": "Vascular Surgery",

    # Colorectal Surgery
    "Colorectal Surgery": "Colorectal Surgery",

    # Nutrition & Dietetics
    "পুষ্টি": "Nutrition & Dietetics",
    "পুষ্টি ও নিউট্রিশন": "Nutrition & Dietetics",
    "Dietetics": "Nutrition & Dietetics",

    # Radiology & Imaging
    "সনোলজি": "Radiology & Imaging",
    "সিটি ও এমআরআই": "Radiology & Imaging",
    "সিটিস্ক্যান": "Radiology & Imaging",
    "সিটি এনজিওগ্রাম": "Radiology & Imaging",
    "মলিকুলার ইমেজিং": "Radiology & Imaging",
    "রেডিওলজি ও ইমেজিং": "Radiology & Imaging",

    # Critical Care
    "Critical Care": "Critical Care & ICU",
}


class Command(BaseCommand):
    help = "Consolidates specialty taxonomy into canonical rows with alias resolution and two-tier components."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simulate consolidation without committing changes to database.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        if dry_run:
            self.stdout.write(self.style.WARNING("--- RUNNING IN DRY-RUN MODE (No changes will be saved) ---"))

        with transaction.atomic():
            canonical_map = {}  # canonical_name -> DoctorSpecialty instance

            # Step 1: Seed / Update Canonical Specialties
            self.stdout.write("Step 1: Seeding canonical taxonomy...")
            for spec_def in CANONICAL_SPECIALTIES:
                c_name = spec_def["canonical_name"]
                name = spec_def["name"]
                bn_name = spec_def["bn_name"]
                icon = spec_def["icon"]

                # Check if exists by name or canonical_name
                canonical = DoctorSpecialty.objects.filter(
                    models.Q(name__iexact=name) | models.Q(canonical_name__iexact=c_name)
                ).first()

                if not canonical:
                    canonical = DoctorSpecialty.objects.create(
                        name=name,
                        canonical_name=c_name,
                        bn_name=bn_name,
                        icon=icon,
                        slug=slugify(c_name)
                    )
                else:
                    # Update fields
                    canonical.name = name
                    canonical.canonical_name = c_name
                    if bn_name and not canonical.bn_name:
                        canonical.bn_name = bn_name
                    if icon and canonical.icon == "Stethoscope":
                        canonical.icon = icon
                    canonical.slug = slugify(c_name)
                    canonical.save()

                canonical_map[c_name] = canonical
                # Self component for simple canonical specialties
                canonical.components.set([canonical])

                # Create aliases for its own names
                for alias_name in [name, c_name, bn_name]:
                    if alias_name:
                        norm = normalize_text(alias_name)
                        SpecialtyAlias.objects.get_or_create(
                            normalized=norm,
                            defaults={
                                "specialty": canonical,
                                "name": alias_name,
                                "language": detect_language(alias_name),
                                "is_verified": True
                            }
                        )

                # Predefined aliases
                for alias_str in spec_def.get("aliases", []):
                    norm = normalize_text(alias_str)
                    SpecialtyAlias.objects.get_or_create(
                        normalized=norm,
                        defaults={
                            "specialty": canonical,
                            "name": alias_str,
                            "language": detect_language(alias_str),
                            "is_verified": True
                        }
                    )

            self.stdout.write(self.style.SUCCESS(f"Seeded/Updated {len(canonical_map)} canonical specialties."))

            # Step 2: Consolidate Existing Database Specialties
            self.stdout.write("Step 2: Consolidating existing specialties and re-tagging doctors...")
            existing_specialties = list(DoctorSpecialty.objects.all())
            canonical_ids = {c.id for c in canonical_map.values()}

            consolidated_count = 0
            doctors_retagged = 0

            for old_spec in existing_specialties:
                if old_spec.id in canonical_ids or old_spec.components.count() > 1:
                    continue  # Already a primary canonical row or compound canonical row

                old_name = old_spec.name.strip()
                norm_old = normalize_text(old_name)

                # 1. Check if compound string
                components = parse_compound_components(old_name)
                if len(components) > 1:
                    old_spec.canonical_name = old_name
                    base_slug = slugify(old_name) or f"compound-{old_spec.id.hex[:8]}"
                    slug = base_slug
                    cnt = 1
                    while DoctorSpecialty.objects.filter(slug=slug).exclude(pk=old_spec.pk).exists():
                        slug = f"{base_slug}-{cnt}"
                        cnt += 1
                    old_spec.slug = slug
                    old_spec.save()
                    old_spec.components.set(components)
                    canonical_ids.add(old_spec.id)

                    SpecialtyAlias.objects.get_or_create(
                        normalized=norm_old,
                        defaults={
                            "specialty": old_spec,
                            "name": old_name,
                            "language": detect_language(old_name),
                            "is_verified": True
                        }
                    )
                    continue

                # 2. Explicit map
                target_canonical = None
                if old_name in EXPLICIT_MAPPING:
                    target_canonical = canonical_map.get(EXPLICIT_MAPPING[old_name])

                # 3. Existing alias lookup
                if not target_canonical:
                    alias = SpecialtyAlias.objects.filter(normalized=norm_old).select_related('specialty').first()
                    if alias:
                        target_canonical = alias.specialty

                # 4. Fallback: resolve_specialty (must be in canonical_ids and not old_spec)
                if not target_canonical or target_canonical.id == old_spec.id or target_canonical.id not in canonical_ids:
                    ids = resolve_specialty_ids(old_name)
                    for rid in ids:
                        if rid in canonical_ids and rid != old_spec.id:
                            target_canonical = DoctorSpecialty.objects.filter(id=rid).first()
                            break

                # 5. Last resort: Default to General Medicine with unverified alias for admin review
                is_verified_alias = True
                if not target_canonical or target_canonical.id == old_spec.id or target_canonical.id not in canonical_ids:
                    target_canonical = canonical_map.get("General Medicine")
                    is_verified_alias = False
                    self.stdout.write(self.style.WARNING(f"Unmapped specialty: '{old_name}' -> mapped to General Medicine (unverified)."))

                # Re-tag doctors associated with old_spec
                associated_doctors = list(old_spec.doctors.all())
                for doc in associated_doctors:
                    doc.specialties.add(target_canonical)
                    doctors_retagged += 1

                # Save alias for old_name
                SpecialtyAlias.objects.get_or_create(
                    normalized=norm_old,
                    defaults={
                        "specialty": target_canonical,
                        "name": old_name,
                        "language": detect_language(old_name),
                        "is_verified": is_verified_alias
                    }
                )

                # Clear old M2M and delete duplicate row
                old_spec.doctors.clear()
                old_spec.delete()
                consolidated_count += 1

            # Summary
            final_canonical_count = DoctorSpecialty.objects.count()
            total_aliases_count = SpecialtyAlias.objects.count()
            total_doc_links = Doctor.specialties.through.objects.count()

            self.stdout.write(self.style.SUCCESS("\n--- Consolidation Complete ---"))
            self.stdout.write(f"Remaining Canonical Specialties: {final_canonical_count}")
            self.stdout.write(f"Total Preserved Aliases: {total_aliases_count}")
            self.stdout.write(f"Duplicate Specialties Consolidated & Deleted: {consolidated_count}")
            self.stdout.write(f"Doctor-Specialty Re-links Performed: {doctors_retagged}")
            self.stdout.write(f"Current Total Active Doctor-Specialty Links: {total_doc_links}")

            if dry_run:
                self.stdout.write(self.style.WARNING("DRY RUN: Rolling back transaction. No changes saved."))
                transaction.set_rollback(True)
