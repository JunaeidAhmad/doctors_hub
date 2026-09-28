import sys, os, csv, re, yaml
from pathlib import Path

# Setup Django
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
os.environ["DATABASE_URL"] = os.environ.get("WORK_DATABASE_URL", "postgresql://postgres:123@localhost:5432/doctorshub_work")

import django
django.setup()

from doctors.models import DoctorSpecialty, SpecialtyAlias
from doctors.services.specialty_resolver import normalize_text, detect_language

ARTIFACT_DIR = Path("/home/ltl/Tomal/project_doctors_hub/.agent/specialty_repair")
FIXTURE_PATH = BACKEND_DIR / "doctors" / "fixtures" / "taxonomy_v3.yaml"
VOCAB_CSV = ARTIFACT_DIR / "vocabulary_inventory.csv"

UMBRELLAS = [
    {"id": 1, "name": "Medicine & Primary Care", "bn_name": "মেডিসিন ও সাধারণ চিকিৎসা", "formal_name": "Internal Medicine & Primary Care", "slug": "medicine-primary-care", "icon": "Stethoscope", "display_order": 1},
    {"id": 2, "name": "Heart & Vascular", "bn_name": "হৃদরোগ ও রক্তনালী", "formal_name": "Cardiology & Vascular Medicine", "slug": "heart-vascular", "icon": "Heart", "display_order": 2},
    {"id": 3, "name": "Cancer Care", "bn_name": "ক্যান্সার", "formal_name": "Oncology & Cancer Care", "slug": "cancer-care", "icon": "Ribbon", "display_order": 3},
    {"id": 4, "name": "Brain, Spine & Nerves", "bn_name": "মস্তিষ্ক, মেরুদণ্ড ও স্নায়ু", "formal_name": "Neurology & Neurosurgery", "slug": "brain-spine-nerves", "icon": "Brain", "display_order": 4},
    {"id": 5, "name": "Bone & Joint", "bn_name": "হাড় ও জোড়া", "formal_name": "Orthopedics & Traumatology", "slug": "bone-joint", "icon": "Bone", "display_order": 5},
    {"id": 6, "name": "Women's Health & Pregnancy", "bn_name": "নারী স্বাস্থ্য ও প্রসূতি", "formal_name": "Obstetrics & Gynecology", "slug": "womens-health-pregnancy", "icon": "Users", "display_order": 6},
    {"id": 7, "name": "Child Health", "bn_name": "শিশু স্বাস্থ্য", "formal_name": "Pediatrics & Child Health", "slug": "child-health", "icon": "Baby", "display_order": 7},
    {"id": 8, "name": "Kidney & Urinary", "bn_name": "কিডনি ও মূত্রনালী", "formal_name": "Nephrology & Urology", "slug": "kidney-urinary", "icon": "Droplet", "display_order": 8},
    {"id": 9, "name": "Digestive & Liver", "bn_name": "পরিপাকতন্ত্র ও লিভার", "formal_name": "Gastroenterology & Hepatology", "slug": "digestive-liver", "icon": "Activity", "display_order": 9},
    {"id": 10, "name": "Diabetes & Hormones", "bn_name": "ডায়াবেটিস ও হরমোন", "formal_name": "Endocrinology & Diabetology", "slug": "diabetes-hormones", "icon": "Activity", "display_order": 10},
    {"id": 11, "name": "Chest & Lungs", "bn_name": "বক্ষব্যাধি", "formal_name": "Pulmonology & Respiratory Medicine", "slug": "chest-lungs", "icon": "Wind", "display_order": 11},
    {"id": 12, "name": "Ear, Nose & Throat", "bn_name": "নাক-কান-গলা", "formal_name": "Otolaryngology (ENT)", "slug": "ent", "icon": "Ear", "display_order": 12},
    {"id": 13, "name": "Eye Care", "bn_name": "চক্ষু", "formal_name": "Ophthalmology", "slug": "eye-care", "icon": "Eye", "display_order": 13},
    {"id": 14, "name": "Skin & Sexual Health", "bn_name": "চর্ম ও যৌন স্বাস্থ্য", "formal_name": "Dermatology & Venereology", "slug": "skin-sexual-health", "icon": "Sparkles", "display_order": 14},
    {"id": 15, "name": "Mental Health", "bn_name": "মানসিক স্বাস্থ্য", "formal_name": "Psychiatry & Behavioral Sciences", "slug": "mental-health", "icon": "Smile", "display_order": 15},
    {"id": 16, "name": "General & Laparoscopic Surgery", "bn_name": "জেনারেল ও ল্যাপারোস্কোপিক সার্জারি", "formal_name": "General & Laparoscopic Surgery", "slug": "general-laparoscopic-surgery", "icon": "Scissors", "display_order": 16},
    {"id": 17, "name": "Plastic, Burn & Cosmetic Surgery", "bn_name": "প্লাস্টিক ও বার্ন সার্জারি", "formal_name": "Plastic, Reconstructive & Aesthetic Surgery", "slug": "plastic-burn-surgery", "icon": "Scissors", "display_order": 17},
    {"id": 18, "name": "Blood Disorders", "bn_name": "রক্তরোগ", "formal_name": "Hematology", "slug": "blood-disorders", "icon": "Droplet", "display_order": 18},
    {"id": 19, "name": "Nutrition & Diet", "bn_name": "পুষ্টি ও ডায়েট", "formal_name": "Clinical Nutrition & Dietetics", "slug": "nutrition-diet", "icon": "Apple", "display_order": 19},
    {"id": 20, "name": "Physical Medicine & Rehab", "bn_name": "ফিজিক্যাল মেডিসিন ও পুনর্বাসন", "formal_name": "Physical Medicine & Rehabilitation", "slug": "physical-medicine-rehab", "icon": "Accessibility", "display_order": 20},
    {"id": 21, "name": "Pain, Anesthesia & ICU", "bn_name": "ব্যথা, অ্যানেস্থেসিয়া ও আইসিইউ", "formal_name": "Anesthesiology, Pain & Critical Care", "slug": "pain-anesthesia-icu", "icon": "Syringe", "display_order": 21},
    {"id": 22, "name": "Dental & Oral Care", "bn_name": "দন্ত ও মুখ", "formal_name": "Dental Surgery & Oral Medicine", "slug": "dental-oral", "icon": "Smile", "display_order": 22},
    {"id": 23, "name": "Diagnostics & Imaging", "bn_name": "রোগনির্ণয় ও ইমেজিং", "formal_name": "Radiology, Sonology & Pathology", "slug": "diagnostics-imaging", "icon": "Scan", "display_order": 23},
    {"id": 24, "name": "Alternative Medicine", "bn_name": "বিকল্প চিকিৎসা", "formal_name": "Homeopathy & Alternative Medicine", "slug": "alternative-medicine", "icon": "Leaf", "display_order": 24},
]

LEAVES = [
    # Medicine & Primary Care (1)
    {"name": "Medicine Specialist", "bn_name": "মেডিসিন বিশেষজ্ঞ", "formal_name": "Internal Medicine", "slug": "medicine-specialist", "parents": [1], "related": [], "provider_type": "physician", "aliases_en": ["Medicine", "Internal Medicine", "General Medicine"], "aliases_bn": ["মেডিসিন", "ইন্টারনাল মেডিসিন"]},
    {"name": "Family Physician / GP", "bn_name": "জেনারেল প্র্যাকটিশনার", "formal_name": "Family Medicine", "slug": "family-physician-gp", "parents": [1], "related": [], "provider_type": "physician", "aliases_en": ["General Physician", "Family Medicine", "GP"], "aliases_bn": ["জেনারেল ফিজিশিয়ান", "ফ্যামিলি মেডিসিন"]},
    {"name": "Infectious Disease Specialist", "bn_name": "সংক্রামক রোগ বিশেষজ্ঞ", "formal_name": "Infectious Diseases", "slug": "infectious-disease-specialist", "parents": [1], "related": [], "provider_type": "physician", "aliases_en": ["Tropical Medicine", "Infectious Diseases"], "aliases_bn": ["সংক্রামক ব্যাধি"]},

    # Heart & Vascular (2)
    {"name": "Cardiologist", "bn_name": "হৃদরোগ বিশেষজ্ঞ", "formal_name": "Cardiology", "slug": "cardiologist", "parents": [2], "related": [], "provider_type": "physician", "aliases_en": ["Cardiology", "Heart", "Cardiac"], "aliases_bn": ["কার্ডিওলজি", "হৃদরোগ"]},
    {"name": "Interventional Cardiologist", "bn_name": "ইন্টারভেনশনাল কার্ডিওলজিস্ট", "formal_name": "Interventional Cardiology", "slug": "interventional-cardiologist", "parents": [2], "related": [], "provider_type": "physician", "aliases_en": ["Interventional Cardiology"], "aliases_bn": ["ইন্টারভেনশনাল কার্ডিওলজি"]},
    {"name": "Cardiac Surgeon", "bn_name": "কার্ডিয়াক সার্জন", "formal_name": "Cardiovascular & Thoracic Surgery", "slug": "cardiac-surgeon", "parents": [2], "related": [], "provider_type": "physician", "aliases_en": ["Cardiac Surgery", "CTVS", "Cardiovascular Surgery", "Cardiac MRI"], "aliases_bn": ["কার্ডিয়াক সার্জারি", "হার্ট সার্জারি"]},
    {"name": "Vascular Surgeon", "bn_name": "ভাস্কুলার সার্জন", "formal_name": "Vascular Surgery", "slug": "vascular-surgeon", "parents": [2], "related": [16], "provider_type": "physician", "aliases_en": ["Vascular Surgery", "Endovascular Surgery"], "aliases_bn": ["ভাসকুলার সার্জারি"]},
    {"name": "Thoracic Surgeon", "bn_name": "থোরাসিক সার্জন", "formal_name": "Thoracic Surgery", "slug": "thoracic-surgeon", "parents": [11, 2], "related": [], "provider_type": "physician", "aliases_en": ["Thoracic Surgery", "Chest Surgery"], "aliases_bn": ["থোরাসিক সার্জারি"]},
    {"name": "Pediatric Cardiologist", "bn_name": "শিশু হৃদরোগ বিশেষজ্ঞ", "formal_name": "Pediatric Cardiology", "slug": "pediatric-cardiologist", "parents": [7, 2], "related": [], "provider_type": "physician", "aliases_en": ["Pediatric Cardiology", "Paediatric Cardiology"], "aliases_bn": ["শিশু কার্ডিওলজি"]},

    # Cancer Care (3)
    {"name": "Cancer Specialist", "bn_name": "ক্যান্সার বিশেষজ্ঞ", "formal_name": "Clinical Oncology", "slug": "cancer-specialist", "parents": [3], "related": [], "provider_type": "physician", "aliases_en": ["Oncology", "Oncologist", "Medical Oncology", "Clinical Oncology", "Radiation Oncology", "Radiotherapy", "Cancer", "Cancer Medicine"], "aliases_bn": ["অনকোলজি", "অনকোলজিস্ট", "ক্যান্সার", "রেডিওথেরাপি"]},
    {"name": "Cancer Surgeon", "bn_name": "ক্যান্সার সার্জন", "formal_name": "Surgical Oncology", "slug": "cancer-surgeon", "parents": [3, 16], "related": [], "provider_type": "physician", "aliases_en": ["Surgical Oncology", "Onco-surgery", "Cancer Surgery", "Oncology Surgery"], "aliases_bn": ["সার্জিক্যাল অনকোলজি", "ক্যান্সার সার্জারি"]},
    {"name": "Breast Surgeon", "bn_name": "ব্রেস্ট সার্জন", "formal_name": "Breast Surgery", "slug": "breast-surgeon", "parents": [3, 16], "related": [6], "provider_type": "physician", "aliases_en": ["Breast Surgery", "Breast Cancer Surgery"], "aliases_bn": ["ব্রেস্ট সার্জারি", "স্তন সার্জারি"]},
    {"name": "Breast Health Specialist", "bn_name": "স্তন স্বাস্থ্য বিশেষজ্ঞ", "formal_name": "Breast Health & Oncology", "slug": "breast-health-specialist", "parents": [3, 6], "related": [], "provider_type": "physician", "aliases_en": ["Breast Health", "Breast Diseases", "Breast Cancer"], "aliases_bn": ["ব্রেস্ট রোগ", "স্তন রোগ"]},
    {"name": "Gynecological Oncologist", "bn_name": "গাইনি ক্যান্সার বিশেষজ্ঞ", "formal_name": "Gynecologic Oncology", "slug": "gynecological-oncologist", "parents": [3, 6], "related": [], "provider_type": "physician", "aliases_en": ["Gynecological Oncology", "Gynae Oncology"], "aliases_bn": ["গাইনি অনকোলজি"]},
    {"name": "Pediatric Oncologist", "bn_name": "শিশু ক্যান্সার বিশেষজ্ঞ", "formal_name": "Pediatric Hematology & Oncology", "slug": "pediatric-oncologist", "parents": [3, 7, 18], "related": [], "provider_type": "physician", "aliases_en": ["Pediatric Oncology", "Pediatric Hemato-Oncology"], "aliases_bn": ["শিশু ক্যান্সার"]},

    # Brain, Spine & Nerves (4)
    {"name": "Neurologist", "bn_name": "নিউরোলজিস্ট", "formal_name": "Neurology", "slug": "neurologist", "parents": [4], "related": [], "provider_type": "physician", "aliases_en": ["Neurology", "Neuromedicine", "Neuro-Medicine"], "aliases_bn": ["নিউরোলজি", "নিউরোমেডিসিন", "স্নায়ুরোগ"]},
    {"name": "Neurosurgeon", "bn_name": "নিউরোসার্জন", "formal_name": "Neurosurgery", "slug": "neurosurgeon", "parents": [4], "related": [], "provider_type": "physician", "aliases_en": ["Neurosurgery", "Brain Surgery"], "aliases_bn": ["নিউরোসার্জারি", "মস্তিষ্ক সার্জারি"]},
    {"name": "Spine Surgeon", "bn_name": "মেরুদণ্ড সার্জন", "formal_name": "Spine Surgery", "slug": "spine-surgeon", "parents": [4, 5], "related": [], "provider_type": "physician", "aliases_en": ["Spine Surgery", "Spinal Surgery"], "aliases_bn": ["স্পাইন সার্জারি", "মেরুদণ্ড সার্জারি"]},
    {"name": "Pediatric Neurologist", "bn_name": "শিশু নিউরোলজিস্ট", "formal_name": "Pediatric Neurology", "slug": "pediatric-neurologist", "parents": [7, 4], "related": [], "provider_type": "physician", "aliases_en": ["Pediatric Neurology", "Child Neurology", "Autism"], "aliases_bn": ["শিশু নিউরোলজি", "অটিজম"]},

    # Bone & Joint (5)
    {"name": "Orthopedic Surgeon", "bn_name": "হাড় ও জোড়া বিশেষজ্ঞ", "formal_name": "Orthopedics & Traumatology", "slug": "orthopedic-surgeon", "parents": [5], "related": [], "provider_type": "physician", "aliases_en": ["Orthopedics", "Orthopaedic Surgery", "Trauma Surgery", "Arthroplasty", "Arthroscopy", "Bone And Joint", "Bone", "Joint", "Trauma", "Hand Surgery"], "aliases_bn": ["অর্থোপেডিক", "অর্থোপেডিক সার্জারি", "হাড় ও জোড়া", "ট্রমা সার্জারি"]},
    {"name": "Rheumatologist", "bn_name": "বাতরোগ বিশেষজ্ঞ", "formal_name": "Rheumatology", "slug": "rheumatologist", "parents": [5, 1], "related": [], "provider_type": "physician", "aliases_en": ["Rheumatology", "Arthritis", "Rheumatic Fever"], "aliases_bn": ["বাতরোগ", "রিউমাটোলজি"]},

    # Women's Health & Pregnancy (6)
    {"name": "Gynecologist & Obstetrician", "bn_name": "গাইনি বিশেষজ্ঞ", "formal_name": "Obstetrics & Gynecology", "slug": "gynecologist-obstetrician", "parents": [6], "related": [], "provider_type": "physician", "aliases_en": ["Gynecology", "Obstetrics", "Obs & Gynae", "Gynaecology", "Obs", "Gynae"], "aliases_bn": ["গাইনি", "গাইনী", "প্রসূতি", "স্ত্রীরোগ", "গাইনী এন্ড অবস্"]},
    {"name": "Infertility Specialist", "bn_name": "বন্ধ্যাত্ব বিশেষজ্ঞ", "formal_name": "Reproductive Medicine & Infertility", "slug": "infertility-specialist", "parents": [6], "related": [8], "provider_type": "physician", "aliases_en": ["Infertility", "Reproductive Medicine", "IVF", "Reproductive Endocrinology"], "aliases_bn": ["বন্ধ্যাত্ব", "আইভিএফ"]},

    # Child Health (7)
    {"name": "Child Specialist", "bn_name": "শিশু বিশেষজ্ঞ", "formal_name": "Pediatrics", "slug": "child-specialist", "parents": [7], "related": [], "provider_type": "physician", "aliases_en": ["Pediatrics", "Paediatrics", "Pediatrician", "Child Health", "Child"], "aliases_bn": ["শিশু রোগ", "পেডিয়াট্রিক্স"]},
    {"name": "Neonatologist", "bn_name": "নবজাতক বিশেষজ্ঞ", "formal_name": "Neonatology", "slug": "neonatologist", "parents": [7], "related": [], "provider_type": "physician", "aliases_en": ["Neonatology", "Newborn"], "aliases_bn": ["নবজাতক"]},
    {"name": "Pediatric Surgeon", "bn_name": "শিশু সার্জন", "formal_name": "Pediatric Surgery", "slug": "pediatric-surgeon", "parents": [7, 16], "related": [], "provider_type": "physician", "aliases_en": ["Pediatric Surgery", "Neonatal Surgery"], "aliases_bn": ["শিশু সার্জারি"]},

    # Kidney & Urinary (8)
    {"name": "Nephrologist", "bn_name": "কিডনি বিশেষজ্ঞ", "formal_name": "Nephrology", "slug": "nephrologist", "parents": [8], "related": [], "provider_type": "physician", "aliases_en": ["Nephrology", "Kidney Diseases", "Dialysis", "Kidney", "Kidney Transplant"], "aliases_bn": ["কিডনি রোগ", "নেফ্রোলজি"]},
    {"name": "Urologist", "bn_name": "ইউরোলজিস্ট", "formal_name": "Urology", "slug": "urologist", "parents": [8], "related": [], "provider_type": "physician", "aliases_en": ["Urology", "Female Urology"], "aliases_bn": ["ইউরোলজি"]},
    {"name": "Andrologist", "bn_name": "এন্ড্রোলজিস্ট", "formal_name": "Andrology & Sexual Medicine", "slug": "andrologist", "parents": [8, 14], "related": [], "provider_type": "physician", "aliases_en": ["Andrology", "Male Infertility"], "aliases_bn": ["এন্ড্রোলজি"]},

    # Digestive & Liver (9)
    {"name": "Gastroenterologist", "bn_name": "গ্যাস্ট্রোএন্টারোলজিস্ট", "formal_name": "Gastroenterology", "slug": "gastroenterologist", "parents": [9], "related": [], "provider_type": "physician", "aliases_en": ["Gastroenterology", "Endoscopy", "GI"], "aliases_bn": ["গ্যাস্ট্রোএন্টারোলজি", "পরিপাকতন্ত্র"]},
    {"name": "Hepatologist", "bn_name": "লিভার বিশেষজ্ঞ", "formal_name": "Hepatology", "slug": "hepatologist", "parents": [9], "related": [], "provider_type": "physician", "aliases_en": ["Hepatology", "Liver Diseases", "Liver", "Liver Transplant"], "aliases_bn": ["হেপাটোলজি", "লিভার রোগ"]},
    {"name": "Hepatobiliary Surgeon", "bn_name": "লিভার সার্জন", "formal_name": "Hepatobiliary & Pancreatic Surgery", "slug": "hepatobiliary-surgeon", "parents": [9, 16], "related": [], "provider_type": "physician", "aliases_en": ["HPB Surgery", "Hepatobiliary Surgery", "Pancreatic Surgery", "Liver Transplant Surgery"], "aliases_bn": ["হেপাটোবিলিয়ারি সার্জারি"]},
    {"name": "Colorectal Surgeon", "bn_name": "কোলোরেক্টাল সার্জন", "formal_name": "Colorectal Surgery", "slug": "colorectal-surgeon", "parents": [16, 9], "related": [], "provider_type": "physician", "aliases_en": ["Colorectal Surgery", "Proctology", "Piles"], "aliases_bn": ["কোলোরেক্টাল সার্জারি", "পাইলস"]},

    # Diabetes & Hormones (10)
    {"name": "Diabetologist", "bn_name": "ডায়াবেটিস বিশেষজ্ঞ", "formal_name": "Diabetology", "slug": "diabetologist", "parents": [10], "related": [], "provider_type": "physician", "aliases_en": ["Diabetology", "Diabetes", "Diabetic Foot"], "aliases_bn": ["ডায়াবেটিস", "ডায়াবেটোলজি"]},
    {"name": "Endocrinologist", "bn_name": "হরমোন বিশেষজ্ঞ", "formal_name": "Endocrinology", "slug": "endocrinologist", "parents": [10], "related": [], "provider_type": "physician", "aliases_en": ["Endocrinology", "Thyroid", "Hormone", "Diabetes & Endocrinology", "Metabolism"], "aliases_bn": ["এন্ডোক্রিনোলজি", "হরমোন", "থাইরয়েড"]},

    # Chest & Lungs (11)
    {"name": "Chest Specialist", "bn_name": "বক্ষব্যাধি বিশেষজ্ঞ", "formal_name": "Pulmonology & Respiratory Medicine", "slug": "chest-specialist", "parents": [11], "related": [], "provider_type": "physician", "aliases_en": ["Pulmonology", "Respiratory Medicine", "Chest Diseases", "Asthma", "TB", "Chest", "Chest Medicine"], "aliases_bn": ["বক্ষব্যাধি", "শ্বাসকষ্ট", "হাঁপানি"]},

    # Ear, Nose & Throat (12)
    {"name": "ENT Specialist", "bn_name": "নাক-কান-গলা বিশেষজ্ঞ", "formal_name": "Otolaryngology (ENT)", "slug": "ent-specialist", "parents": [12], "related": [], "provider_type": "physician", "aliases_en": ["ENT", "Otolaryngology", "ENT (Otolaryngology)", "Otorhinolaryngology"], "aliases_bn": ["ইএনটি", "নাক কান গলা"]},
    {"name": "Head & Neck Surgeon", "bn_name": "হেড এন্ড নেক সার্জন", "formal_name": "Head & Neck Surgery", "slug": "head-neck-surgeon", "parents": [12, 3], "related": [], "provider_type": "physician", "aliases_en": ["Head & Neck Surgery", "Head And Neck Surgery", "Head", "Neck Surgery"], "aliases_bn": ["হেড এন্ড নেক সার্জারি"]},

    # Eye Care (13)
    {"name": "Eye Specialist", "bn_name": "চক্ষু বিশেষজ্ঞ", "formal_name": "Ophthalmology", "slug": "eye-specialist", "parents": [13], "related": [], "provider_type": "physician", "aliases_en": ["Ophthalmology", "Ophthalmologist", "Eye"], "aliases_bn": ["চক্ষু", "চক্ষুরোগ"]},

    # Skin & Sexual Health (14)
    {"name": "Dermatologist", "bn_name": "চর্মরোগ বিশেষজ্ঞ", "formal_name": "Dermatology", "slug": "dermatologist", "parents": [14], "related": [], "provider_type": "physician", "aliases_en": ["Dermatology", "Skin", "Skin & VD", "Dermatology & Venereology"], "aliases_bn": ["চর্মরোগ", "ডার্মাটোলজি"]},
    {"name": "Sexologist", "bn_name": "যৌনরোগ বিশেষজ্ঞ", "formal_name": "Sexual Medicine & Venereology", "slug": "sexologist", "parents": [14], "related": [8], "provider_type": "physician", "aliases_en": ["Sexual Medicine", "Venereology", "Sex Specialist", "Sexual Health"], "aliases_bn": ["যৌনরোগ", "যৌন স্বাস্থ্য"]},

    # Mental Health (15)
    {"name": "Psychiatrist", "bn_name": "মানসিক রোগ বিশেষজ্ঞ", "formal_name": "Psychiatry", "slug": "psychiatrist", "parents": [15], "related": [], "provider_type": "physician", "aliases_en": ["Psychiatry", "Mental Health", "Psychotherapy"], "aliases_bn": ["মনোরোগ", "মানসিক স্বাস্থ্য"]},
    {"name": "Psychologist", "bn_name": "সাইকোলজিস্ট", "formal_name": "Clinical Psychology", "slug": "psychologist", "parents": [15], "related": [], "provider_type": "allied", "aliases_en": ["Clinical Psychology", "Counselling", "Psychology"], "aliases_bn": ["মনোবিজ্ঞান"]},

    # General & Laparoscopic Surgery (16)
    {"name": "General Surgeon", "bn_name": "জেনারেল সার্জন", "formal_name": "General Surgery", "slug": "general-surgeon", "parents": [16], "related": [], "provider_type": "physician", "aliases_en": ["General Surgery", "Surgery"], "aliases_bn": ["জেনারেল সার্জারি", "সার্জারি"]},
    {"name": "Laparoscopic Surgeon", "bn_name": "ল্যাপারোস্কোপিক সার্জন", "formal_name": "Laparoscopic Surgery", "slug": "laparoscopic-surgeon", "parents": [16], "related": [], "provider_type": "physician", "aliases_en": ["Laparoscopic Surgery", "Laser Surgery"], "aliases_bn": ["ল্যাপারোস্কোপিক সার্জারি"]},

    # Plastic, Burn & Cosmetic Surgery (17)
    {"name": "Plastic Surgeon", "bn_name": "প্লাস্টিক সার্জন", "formal_name": "Plastic & Reconstructive Surgery", "slug": "plastic-surgeon", "parents": [17], "related": [], "provider_type": "physician", "aliases_en": ["Plastic Surgery", "Burn", "Cosmetic Surgery", "Plastic", "Burn Surgery", "Reconstructive Surgery"], "aliases_bn": ["প্লাস্টিক সার্জারি", "বার্ন সার্জারি", "কসমেটিক সার্জারি"]},

    # Blood Disorders (18)
    {"name": "Hematologist", "bn_name": "রক্তরোগ বিশেষজ্ঞ", "formal_name": "Hematology", "slug": "hematologist", "parents": [18], "related": [], "provider_type": "physician", "aliases_en": ["Hematology", "Haematology", "Bone Marrow Transplant"], "aliases_bn": ["হেমাটোলজি", "রক্তরোগ"]},

    # Nutrition & Diet (19)
    {"name": "Nutritionist / Dietitian", "bn_name": "পুষ্টিবিদ", "formal_name": "Clinical Nutrition & Dietetics", "slug": "nutritionist-dietitian", "parents": [19], "related": [], "provider_type": "allied", "aliases_en": ["Dietetics", "Nutrition", "Dietician", "Clinical Nutrition", "Clinical Nutrition & Dietetics"], "aliases_bn": ["ডায়েটিশিয়ান", "পুষ্টিবিদ্যা", "ডায়েট"]},
    {"name": "Weight Management Specialist", "bn_name": "ওজন নিয়ন্ত্রণ বিশেষজ্ঞ", "formal_name": "Obesity & Weight Management", "slug": "weight-management-specialist", "parents": [19], "related": [10], "provider_type": "physician", "aliases_en": ["Weight Management", "Obesity"], "aliases_bn": ["ওজন নিয়ন্ত্রণ"]},

    # Physical Medicine & Rehab (20)
    {"name": "Physical Medicine Specialist", "bn_name": "ফিজিক্যাল মেডিসিন বিশেষজ্ঞ", "formal_name": "Physical Medicine & Rehabilitation", "slug": "physical-medicine-specialist", "parents": [20], "related": [], "provider_type": "physician", "aliases_en": ["Physical Medicine", "Rehabilitation", "Rehabilitation Medicine", "Neurology Rehabilitation"], "aliases_bn": ["ফিজিক্যাল মেডিসিন", "পুনর্বাসন"]},
    {"name": "Physiotherapist", "bn_name": "ফিজিওথেরাপিস্ট", "formal_name": "Physiotherapy", "slug": "physiotherapist", "parents": [20], "related": [], "provider_type": "allied", "aliases_en": ["Physiotherapy"], "aliases_bn": ["ফিজিওথেরাপি"]},

    # Pain, Anesthesia & ICU (21)
    {"name": "Pain Specialist", "bn_name": "ব্যথা বিশেষজ্ঞ", "formal_name": "Pain Medicine", "slug": "pain-specialist", "parents": [21], "related": [20], "provider_type": "physician", "aliases_en": ["Pain Management", "Pain Medicine"], "aliases_bn": ["পেইন মেডিসিন"]},
    {"name": "Anesthesiologist", "bn_name": "অ্যানেস্থেসিওলজিস্ট", "formal_name": "Anesthesiology", "slug": "anesthesiologist", "parents": [21], "related": [], "provider_type": "physician", "aliases_en": ["Anesthesia", "Anaesthesia", "Anesthesiology", "Anaesthesiology"], "aliases_bn": ["অ্যানেস্থেসিয়া"]},
    {"name": "Critical Care Specialist", "bn_name": "ক্রিটিক্যাল কেয়ার বিশেষজ্ঞ", "formal_name": "Critical Care Medicine", "slug": "critical-care-specialist", "parents": [21], "related": [], "provider_type": "physician", "aliases_en": ["ICU", "Critical Care", "Critical Care & ICU", "Critical Care Medicine"], "aliases_bn": ["ক্রিটিক্যাল কেয়ার", "আইসিইউ"]},

    # Dental & Oral Care (22)
    {"name": "Dentist", "bn_name": "দাঁতের ডাক্তার", "formal_name": "Dental Surgery", "slug": "dentist", "parents": [22], "related": [], "provider_type": "dental", "aliases_en": ["Dental Surgery", "Dentistry", "Dental"], "aliases_bn": ["ডেন্টাল", "দন্ত চিকিৎসা"]},
    {"name": "Maxillofacial Surgeon", "bn_name": "ম্যাক্সিলোফেসিয়াল সার্জন", "formal_name": "Oral & Maxillofacial Surgery", "slug": "maxillofacial-surgeon", "parents": [22], "related": [], "provider_type": "dental", "aliases_en": ["Oral & Maxillofacial Surgery", "Maxillofacial Surgery"], "aliases_bn": ["ম্যাক্সিলোফেসিয়াল সার্জারি"]},

    # Diagnostics & Imaging (23)
    {"name": "Radiologist", "bn_name": "রেডিওলজিস্ট", "formal_name": "Radiology & Imaging", "slug": "radiologist", "parents": [23], "related": [], "provider_type": "physician", "aliases_en": ["Radiology", "Imaging", "Radiology & Imaging"], "aliases_bn": ["রেডিওলজি"]},
    {"name": "Sonologist", "bn_name": "সনোলজিস্ট", "formal_name": "Ultrasonography", "slug": "sonologist", "parents": [23], "related": [], "provider_type": "physician", "aliases_en": ["Ultrasonography", "Sonology"], "aliases_bn": ["সনোলজি", "আল্ট্রাসনোগ্রাফি"]},
    {"name": "Pathologist", "bn_name": "প্যাথলজিস্ট", "formal_name": "Pathology & Laboratory Medicine", "slug": "pathologist", "parents": [23], "related": [], "provider_type": "physician", "aliases_en": ["Pathology", "Histopathology"], "aliases_bn": ["প্যাথলজি"]},

    # Alternative Medicine (24)
    {"name": "Homeopathic Doctor", "bn_name": "হোমিওপ্যাথি ডাক্তার", "formal_name": "Homeopathic Medicine", "slug": "homeopathic-doctor", "parents": [24], "related": [], "provider_type": "alternative", "aliases_en": ["Homeopathy"], "aliases_bn": ["হোমিওপ্যাথি"]},

    # Approved AGENT_NODEs (>= 2 doctors in inventory, §6)
    {"name": "Allergist & Immunologist", "bn_name": "এলার্জি ও ইমিউনোলজি বিশেষজ্ঞ", "formal_name": "Allergy & Clinical Immunology", "slug": "allergy-immunologist", "parents": [1, 14], "related": [], "provider_type": "physician", "aliases_en": ["Allergy", "Immunology", "Allergy & Immunology"], "aliases_bn": ["এলার্জি", "ইমিউনোলজি"]},
    {"name": "Interventional Neurologist", "bn_name": "ইন্টারভেনশনাল নিউরোলজিস্ট", "formal_name": "Interventional Neurology", "slug": "interventional-neurologist", "parents": [4], "related": [], "provider_type": "physician", "aliases_en": ["Interventional Neurology"], "aliases_bn": ["ইন্টারভেনশনাল নিউরোলজি"]},
    {"name": "Pediatric Orthopedic Surgeon", "bn_name": "শিশু অর্থোপেডিক সার্জন", "formal_name": "Pediatric Orthopedics", "slug": "pediatric-orthopedic-surgeon", "parents": [7, 5], "related": [], "provider_type": "physician", "aliases_en": ["Pediatric Orthopedics", "Pediatric Orthopaedic Surgery"], "aliases_bn": ["শিশু অর্থোপেডিক"]},
    {"name": "Pediatric Gastroenterologist", "bn_name": "শিশু গ্যাস্ট্রোএন্টারোলজিস্ট", "formal_name": "Pediatric Gastroenterology", "slug": "pediatric-gastroenterologist", "parents": [7, 9], "related": [], "provider_type": "physician", "aliases_en": ["Pediatric Gastroenterology"], "aliases_bn": ["শিশু গ্যাস্ট্রো"]},
    {"name": "Pediatric Pulmonologist", "bn_name": "শিশু বক্ষব্যাধি বিশেষজ্ঞ", "formal_name": "Pediatric Pulmonology", "slug": "pediatric-pulmonologist", "parents": [7, 11], "related": [], "provider_type": "physician", "aliases_en": ["Pediatric Pulmonology"], "aliases_bn": ["শিশু বক্ষব্যাধি"]},
    {"name": "Nuclear Medicine Specialist", "bn_name": "নিউক্লিয়ার মেডিসিন বিশেষজ্ঞ", "formal_name": "Nuclear Medicine", "slug": "nuclear-medicine-specialist", "parents": [23], "related": [], "provider_type": "physician", "aliases_en": ["Nuclear Medicine"], "aliases_bn": ["নিউক্লিয়ার মেডিসিন"]},
    {"name": "Fetomaternal Medicine Specialist", "bn_name": "ফিটোম্যাটারনাল মেডিসিন বিশেষজ্ঞ", "formal_name": "Maternal Fetal Medicine", "slug": "fetomaternal-medicine-specialist", "parents": [6], "related": [], "provider_type": "physician", "aliases_en": ["Fetomaternal Medicine", "Maternal Fetal Medicine"], "aliases_bn": ["ফিটোম্যাটারনাল মেডিসিন"]},
    {"name": "Pediatric Neurosurgeon", "bn_name": "শিশু নিউরোসার্জন", "formal_name": "Pediatric Neurosurgery", "slug": "pediatric-neurosurgeon", "parents": [7, 4], "related": [], "provider_type": "physician", "aliases_en": ["Pediatric Neurosurgery"], "aliases_bn": ["শিশু নিউরোসার্জারি"]},
    {"name": "Pediatric Urologist", "bn_name": "শিশু ইউরোলজিস্ট", "formal_name": "Pediatric Urology", "slug": "pediatric-urologist", "parents": [7, 8], "related": [], "provider_type": "physician", "aliases_en": ["Pediatric Urology"], "aliases_bn": ["শিশু ইউরোলজি"]},
    {"name": "Sports Medicine Specialist", "bn_name": "স্পোর্টস মেডিসিন বিশেষজ্ঞ", "formal_name": "Sports Medicine", "slug": "sports-medicine-specialist", "parents": [5, 20], "related": [], "provider_type": "physician", "aliases_en": ["Sports Medicine", "Exercise Medicine"], "aliases_bn": ["স্পোর্টস মেডিসিন"]},
]

POPULAR_SLUGS = [
    "medicine-specialist", "gynecologist-obstetrician", "general-surgeon",
    "cardiologist", "orthopedic-surgeon", "child-specialist",
    "neurologist", "neurosurgeon", "spine-surgeon",
    "laparoscopic-surgeon", "colorectal-surgeon", "gastroenterologist"
]

IGNORABLE = {
    'consultant', 'senior consultant', 'associate consultant', 'junior consultant',
    'professor', 'associate professor', 'assistant professor', 'head of department',
    'hod', 'chief', 'director', 'physician in-charge', 'medical officer', 'resident',
    'registrar', 'specialist', 'surgeon', 'সার্জন', 'বিশেষজ্ঞ', 'কনসালট্যান্ট',
    'অধ্যাপক', 'সহযোগী অধ্যাপক', 'সহকারী অধ্যাপক'
}

def main():
    print("--- Building Taxonomy v3 YAML & Mapping Vocabulary ---")

    # Build leaf lookup maps
    alias_to_leaf = {}
    leaf_by_slug = {}

    for idx, leaf in enumerate(LEAVES, 1):
        leaf["display_order"] = idx
        leaf["is_popular"] = (leaf["slug"] in POPULAR_SLUGS)
        leaf_by_slug[leaf["slug"]] = leaf

        # Register direct names
        alias_to_leaf[normalize_text(leaf["name"])] = leaf["slug"]
        alias_to_leaf[normalize_text(leaf["bn_name"])] = leaf["slug"]
        if leaf.get("formal_name"):
            alias_to_leaf[normalize_text(leaf["formal_name"])] = leaf["slug"]

        # Register aliases
        for a in leaf.get("aliases_en", []):
            alias_to_leaf[normalize_text(a)] = leaf["slug"]
        for a in leaf.get("aliases_bn", []):
            alias_to_leaf[normalize_text(a)] = leaf["slug"]

    # Build legacy mapping for every existing DoctorSpecialty row
    legacy_map = {}
    db_specs = list(DoctorSpecialty.objects.all())
    for s in db_specs:
        s_norm = normalize_text(s.name)
        target = alias_to_leaf.get(s_norm)
        if not target and s.canonical_name:
            target = alias_to_leaf.get(normalize_text(s.canonical_name))
        if not target and s.slug:
            target = alias_to_leaf.get(normalize_text(s.slug.replace('-', ' ')))
        
        # Fallback to general medicine if unmapped
        if not target:
            target = "medicine-specialist"
        legacy_map[s.name] = target
        legacy_map[s.slug] = target
        legacy_map[str(s.id)] = target

    # Map inventory fragments and compute coverage
    mapped_count = 0
    total_count = 0
    updated_vocab_rows = []

    with open(VOCAB_CSV, 'r', encoding='utf-8') as f:
        reader = list(csv.DictReader(f))

    for r in reader:
        fn = r['fragment_norm']
        occ = int(r['occurrence_count'])
        total_count += occ

        action = ''
        target = ''

        if fn in IGNORABLE:
            action = 'ignorable'
            mapped_count += occ
        elif fn in alias_to_leaf:
            action = 'alias'
            target = alias_to_leaf[fn]
            mapped_count += occ
        else:
            # Check partial or substring matching against leaves
            found_leaf = None
            for alias_key, leaf_slug in alias_to_leaf.items():
                if fn == alias_key:
                    found_leaf = leaf_slug
                    break
            if found_leaf:
                action = 'alias'
                target = found_leaf
                mapped_count += occ
            else:
                action = 'unclear'

        r['proposed_action'] = action
        r['proposed_target'] = target
        updated_vocab_rows.append(r)

    coverage = (mapped_count / total_count * 100) if total_count else 0
    print(f"Inventory coverage: {mapped_count}/{total_count} occurrences ({coverage:.2f}%)")

    # Save updated vocabulary_inventory.csv
    with open(VOCAB_CSV, 'w', newline='', encoding='utf-8') as f:
        fieldnames = [
            'fragment_norm', 'variants', 'language', 'doctor_count', 'occurrence_count',
            'example_claims', 'example_doctor_ids', 'co_occurs_with', 'current_db_tags',
            'proposed_action', 'proposed_target'
        ]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(updated_vocab_rows)

    # Build taxonomy YAML structure
    taxonomy_data = {
        "version": "3.0",
        "umbrellas": UMBRELLAS,
        "leaves": LEAVES,
        "legacy_map": legacy_map
    }

    with open(FIXTURE_PATH, 'w', encoding='utf-8') as f:
        yaml.dump(taxonomy_data, f, sort_keys=False, allow_unicode=True)

    print(f"Taxonomy fixture written to {FIXTURE_PATH}.")
    print("--- Build Taxonomy Completed ---")

if __name__ == '__main__':
    main()
