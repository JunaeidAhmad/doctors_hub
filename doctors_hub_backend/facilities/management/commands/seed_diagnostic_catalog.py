from django.core.management.base import BaseCommand
from django.utils.text import slugify
from tests.models import TestCategory, Test, FacilityTest
from facilities.models import Location
from decimal import Decimal

CANONICAL_CATEGORIES = [
    {
        "name": "Cardiac Tests",
        "slug": "cardiac-tests",
        "icon": "Heart",
        "description": "ECG, 2D Echo, Doppler Echo, TMT, Holter & cardiac profiling",
        "order": 1,
    },
    {
        "name": "Hematology & Blood",
        "slug": "hematology",
        "icon": "Droplet",
        "description": "CBC, ESR, Blood Grouping, PBF & routine blood pathology",
        "order": 2,
    },
    {
        "name": "Biochemistry & LFT/KFT",
        "slug": "biochemistry",
        "icon": "Activity",
        "description": "Lipid Profile, Liver Function, Kidney Function, HbA1c & Sugar",
        "order": 3,
    },
    {
        "name": "Radiology & X-Ray",
        "slug": "radiology-imaging",
        "icon": "FileText",
        "description": "Digital X-Ray, Chest X-Ray, Bone Densitometry & DEXA scans",
        "order": 4,
    },
    {
        "name": "Ultrasound / USG",
        "slug": "ultrasound-usg",
        "icon": "Sparkles",
        "description": "4D Pregnancy USG, Whole Abdomen, Pelvic & Doppler Ultrasound",
        "order": 5,
    },
    {
        "name": "CT Scan Body Imaging",
        "slug": "ct-scan",
        "icon": "Brain",
        "description": "High-speed Multi-Slice CT Brain, Chest, Abdomen & HRCT Scans",
        "order": 6,
    },
    {
        "name": "MRI Diagnostics",
        "slug": "mri",
        "icon": "Brain",
        "description": "1.5T & 3.0T High-Field Brain, Spine & Musculoskeletal MRI",
        "order": 7,
    },
    {
        "name": "Neuro Diagnostics",
        "slug": "neuro-tests",
        "icon": "Brain",
        "description": "EEG, EMG, NCS, VEP & comprehensive neurological testing",
        "order": 8,
    },
    {
        "name": "Genetic & Molecular",
        "slug": "genetic-molecular",
        "icon": "Dna",
        "description": "PCR tests, DNA sequencing, HPV & advanced molecular diagnostics",
        "order": 9,
    },
    {
        "name": "Endoscopy & Colonoscopy",
        "slug": "endoscopy-colonoscopy",
        "icon": "Stethoscope",
        "description": "Upper GI Endoscopy, Colonoscopy, Biopsy & Histopathology",
        "order": 10,
    },
    {
        "name": "Serology & Immunity",
        "slug": "serology",
        "icon": "ShieldCheck",
        "description": "Dengue NS1, Hepatitis B/C, HIV, Widal & infectious viral panels",
        "order": 11,
    },
    {
        "name": "Microbiology & Culture",
        "slug": "microbiology",
        "icon": "FlaskConical",
        "description": "Urine R/M/E, Stool R/E, Blood Culture & Antibiotic Sensitivity",
        "order": 12,
    },
    {
        "name": "Histopathology & Biopsy",
        "slug": "histopathology",
        "icon": "Microscope",
        "description": "Surgical specimen biopsy, FNAC, Pap smear & cell cytology",
        "order": 13,
    },
    {
        "name": "Hormones & Thyroid",
        "slug": "hormone-endocrinology",
        "icon": "Activity",
        "description": "Thyroid profile (TSH, FT3, FT4), Vitamin D, B12 & fertility hormones",
        "order": 14,
    },
    {
        "name": "Urine & Renal Tests",
        "slug": "urine-renal",
        "icon": "Droplet",
        "description": "Urine albumin, 24hr protein, microalbuminuria & renal clearance",
        "order": 15,
    },
    {
        "name": "Allergy & Immunology",
        "slug": "allergy-immunology",
        "icon": "ShieldCheck",
        "description": "Total IgE, food/dust allergy panels, ANA & autoimmune screening",
        "order": 16,
    },
    {
        "name": "Dental X-Ray & OPG",
        "slug": "dental-imaging",
        "icon": "FileText",
        "description": "Panoramic dental OPG, lateral cephalogram & RVG digital radiograph",
        "order": 17,
    },
    {
        "name": "Mammography & Breast",
        "slug": "mammography",
        "icon": "Sparkles",
        "description": "Digital bilateral mammography screening & breast ultrasound",
        "order": 18,
    },
    {
        "name": "Pulmonary Function (PFT)",
        "slug": "pulmonary-pft",
        "icon": "Activity",
        "description": "Spirometry, lung volume capacity & asthma bronchodilator evaluation",
        "order": 19,
    },
    {
        "name": "Bone Mineral DEXA Scan",
        "slug": "bone-dexa",
        "icon": "FileText",
        "description": "Dual-energy X-ray bone densitometry for osteoporosis detection",
        "order": 20,
    },
    {
        "name": "Infectious Disease Panels",
        "slug": "infectious-diseases",
        "icon": "FlaskConical",
        "description": "Malaria, Typhoid, Chikungunya, COVID PCR & seasonal viral panels",
        "order": 21,
    },
    {
        "name": "Eye & Retinal Imaging",
        "slug": "ophthalmology-diagnostics",
        "icon": "FileText",
        "description": "OCT retina, visual fields perimetry, fundus photo & pachymetry",
        "order": 22,
    },
    {
        "name": "Pediatric Diagnostics",
        "slug": "pediatric-diagnostics",
        "icon": "Sparkles",
        "description": "Newborn metabolic screening, pediatric blood work & pediatric USG",
        "order": 23,
    },
    {
        "name": "Health Checkup Packages",
        "slug": "health-checkup-packages",
        "icon": "Award",
        "description": "Comprehensive whole-body, executive wellness & senior citizen panels",
        "order": 24,
    },
]

STANDARD_TESTS = [
    # 1. CARDIAC
    {
        "category_slug": "cardiac-tests",
        "name": "2D Echocardiography with Color Doppler",
        "description": "Transthoracic echocardiogram assessing heart valve motion, ejection fraction & wall dynamics",
        "sample_type": "Diagnostic Ultrasound Scan",
        "preparation_instructions": "No fasting required. Wear comfortable two-piece clothing.",
        "fasting_required": False,
        "report_time_hours": 2,
        "base_price": 2500,
        "home_available": False,
    },
    {
        "category_slug": "cardiac-tests",
        "name": "12-Lead Electrocardiogram (ECG)",
        "description": "High-precision computerized resting 12-lead ECG with automated rhythm interpretation",
        "sample_type": "Electrophysiological Trace",
        "preparation_instructions": "Relax 10 minutes prior to recording. Keep upper body clothing accessible.",
        "fasting_required": False,
        "report_time_hours": 1,
        "base_price": 400,
        "home_available": True,
        "home_charge": 150,
        "home_note": "+৳150 Home ECG Visit",
    },
    {
        "category_slug": "cardiac-tests",
        "name": "Exercise Tolerance Test (ETT / TMT)",
        "description": "Motorized treadmill stress test evaluating ischemic heart response under progressive exertion",
        "sample_type": "Cardiac Stress Test",
        "preparation_instructions": "Avoid heavy meals 3 hours prior. Wear sports shoes and comfortable clothing.",
        "fasting_required": False,
        "report_time_hours": 2,
        "base_price": 3000,
        "home_available": False,
    },
    # 2. HEMATOLOGY
    {
        "category_slug": "hematology",
        "name": "Complete Blood Count (CBC) with ESR",
        "description": "Automated 5-part differential blood count and erythrocyte sedimentation rate",
        "sample_type": "Whole Blood (EDTA)",
        "preparation_instructions": "No special preparation needed. Fasting not required.",
        "fasting_required": False,
        "report_time_hours": 4,
        "base_price": 400,
        "home_available": True,
        "home_charge": 100,
        "home_note": "+৳100 Pickup",
    },
    {
        "category_slug": "hematology",
        "name": "Blood Grouping & Rh Factor (ABO & RhD)",
        "description": "Standard tube and gel card confirmation of ABO group and Rh(D) antigen status",
        "sample_type": "Whole Blood (EDTA)",
        "preparation_instructions": "No special preparation required.",
        "fasting_required": False,
        "report_time_hours": 1,
        "base_price": 150,
        "home_available": True,
        "home_charge": 100,
        "home_note": "Available with package",
    },
    # 3. BIOCHEMISTRY
    {
        "category_slug": "biochemistry",
        "name": "Lipid Profile (Cholesterol, HDL, LDL, Triglycerides)",
        "description": "Complete fasting blood lipid screening for cardiovascular disease profiling",
        "sample_type": "Blood (Serum)",
        "preparation_instructions": "10-12 Hours Fasting Required before morning sample pickup.",
        "fasting_required": True,
        "report_time_hours": 8,
        "base_price": 1100,
        "home_available": True,
        "home_charge": 0,
        "home_note": "Free with order > ৳1000",
    },
    {
        "category_slug": "biochemistry",
        "name": "Liver Function Test (LFT: SGPT, SGOT, Bilirubin, Alk Phos)",
        "description": "Comprehensive liver enzyme and bilirubin profiling evaluating hepatic cellular integrity",
        "sample_type": "Blood (Serum)",
        "preparation_instructions": "Overnight fasting recommended (8 hours minimum).",
        "fasting_required": True,
        "report_time_hours": 6,
        "base_price": 1200,
        "home_available": True,
        "home_charge": 100,
        "home_note": "+৳100 Pickup",
    },
    {
        "category_slug": "biochemistry",
        "name": "Kidney Function Test (KFT: Serum Creatinine, Urea, Uric Acid)",
        "description": "Renal clearance screening markers including serum creatinine, blood urea & uric acid",
        "sample_type": "Blood (Serum)",
        "preparation_instructions": "Drink normal amounts of water. No vigorous exercise on test morning.",
        "fasting_required": False,
        "report_time_hours": 4,
        "base_price": 950,
        "home_available": True,
        "home_charge": 100,
        "home_note": "+৳100 Pickup",
    },
    # 4. RADIOLOGY
    {
        "category_slug": "radiology-imaging",
        "name": "Digital Chest X-Ray P/A View",
        "description": "High-definition digital radiography of lungs, cardiothoracic contour, ribs and diaphragm",
        "sample_type": "Digital Radiograph",
        "preparation_instructions": "Remove jewelry, necklaces and metallic objects from upper chest.",
        "fasting_required": False,
        "report_time_hours": 2,
        "base_price": 600,
        "home_available": False,
    },
    # 5. ULTRASOUND
    {
        "category_slug": "ultrasound-usg",
        "name": "Whole Abdomen Ultrasonography (USG)",
        "description": "High-frequency abdominal ultrasound evaluation with liver, spleen, kidneys and bladder imaging",
        "sample_type": "Ultrasound Imaging",
        "preparation_instructions": "Full Bladder Required. Fasting 4-6 hours recommended.",
        "fasting_required": True,
        "report_time_hours": 1,
        "base_price": 1600,
        "home_available": False,
    },
    {
        "category_slug": "ultrasound-usg",
        "name": "4D Pregnancy Anomaly Scan (USG of Gravid Uterus)",
        "description": "Detailed fetal anomaly screen, gestational biometry, amniotic index & 4D volumetric visualization",
        "sample_type": "Fetal Ultrasound Scan",
        "preparation_instructions": "Drink 2 glasses of water 30 minutes prior. Bring previous scan reports.",
        "fasting_required": False,
        "report_time_hours": 2,
        "base_price": 3200,
        "home_available": False,
    },
    # 6. CT SCAN
    {
        "category_slug": "ct-scan",
        "name": "High-Resolution CT (HRCT) of Chest",
        "description": "Ultra-thin sub-millimeter thoracic slice scanning for interstitial lung disease & pulmonary lesions",
        "sample_type": "CT Cross-Sectional Scan",
        "preparation_instructions": "Wear loose clothing with no metallic zippers. Fasting not required for non-contrast.",
        "fasting_required": False,
        "report_time_hours": 12,
        "base_price": 6000,
        "home_available": False,
    },
    {
        "category_slug": "ct-scan",
        "name": "CT Scan of Brain (Head - Plain)",
        "description": "Rapid emergency neuro-axial computed tomography detecting acute intracranial bleeding & trauma",
        "sample_type": "Cranial CT Scan",
        "preparation_instructions": "Remove hairpins, earrings and metallic dental fittings if removable.",
        "fasting_required": False,
        "report_time_hours": 4,
        "base_price": 4500,
        "home_available": False,
    },
    # 7. MRI
    {
        "category_slug": "mri",
        "name": "MRI of Brain (Plain & Contrast - 1.5T / 3.0T)",
        "description": "High-resolution neuro-cranial magnetic resonance imaging with gadolinium contrast",
        "sample_type": "Diagnostic Scan",
        "preparation_instructions": "Remove all metallic objects. Inform staff of metallic implants.",
        "fasting_required": False,
        "report_time_hours": 24,
        "base_price": 7500,
        "home_available": False,
    },
    {
        "category_slug": "mri",
        "name": "MRI of Lumbosacral Spine (L-S Spine)",
        "description": "Multi-planar sagittal and axial spine MRI evaluating disc herniation, canal stenosis & nerve roots",
        "sample_type": "Spinal MRI Scan",
        "preparation_instructions": "Inform technician if you have pacemakers, metal implants or surgical clips.",
        "fasting_required": False,
        "report_time_hours": 24,
        "base_price": 7800,
        "home_available": False,
    },
    # 8. NEURO
    {
        "category_slug": "neuro-tests",
        "name": "Digital Electroencephalogram (EEG - 32 Channel)",
        "description": "Computerized brain electrophysiological monitoring with photic stimulation & hyperventilation",
        "sample_type": "Neuro-Electrical Recording",
        "preparation_instructions": "Wash hair thoroughly with shampoo prior. Do not apply oil, gel or sprays.",
        "fasting_required": False,
        "report_time_hours": 6,
        "base_price": 2500,
        "home_available": False,
    },
    {
        "category_slug": "neuro-tests",
        "name": "Electromyography & Nerve Conduction Study (EMG/NCS)",
        "description": "Comprehensive peripheral nerve conduction velocity and needle electromyogram diagnostic study",
        "sample_type": "Peripheral Neuromuscular Test",
        "preparation_instructions": "Avoid lotions or creams on hands and legs on test morning.",
        "fasting_required": False,
        "report_time_hours": 12,
        "base_price": 4000,
        "home_available": False,
    },
    # 9. GENETIC & MOLECULAR
    {
        "category_slug": "genetic-molecular",
        "name": "Real-Time RT-PCR Viral Panel",
        "description": "High-sensitivity quantitative real-time polymerase chain reaction targeting viral RNA",
        "sample_type": "Nasopharyngeal / Blood Specimen",
        "preparation_instructions": "Rinse mouth with water prior if oral swab is taken.",
        "fasting_required": False,
        "report_time_hours": 12,
        "base_price": 3000,
        "home_available": True,
        "home_charge": 150,
        "home_note": "+৳150 Home Swab Pickup",
    },
    # 10. ENDOSCOPY & COLONOSCOPY
    {
        "category_slug": "endoscopy-colonoscopy",
        "name": "Upper Gastrointestinal (GI) Video Endoscopy",
        "description": "High-definition video endoscopic inspection of esophagus, stomach & duodenum with biopsy option",
        "sample_type": "Endoscopic Investigation",
        "preparation_instructions": "Strict 8-hour overnight fasting required. Sedation available on request.",
        "fasting_required": True,
        "report_time_hours": 2,
        "base_price": 4200,
        "home_available": False,
    },
    {
        "category_slug": "endoscopy-colonoscopy",
        "name": "Colonoscopy with Ileoscopy",
        "description": "Full lower gastrointestinal endoscopic examination evaluating mucosal lesions, polyps & colitis",
        "sample_type": "Endoscopic Examination",
        "preparation_instructions": "Bowel preparation protocol with clear liquid diet 24h prior.",
        "fasting_required": True,
        "report_time_hours": 3,
        "base_price": 5500,
        "home_available": False,
    },
    # 11. SEROLOGY
    {
        "category_slug": "serology",
        "name": "Dengue NS1 Antigen & IgM/IgG Antibody Duo",
        "description": "Dual immunochromatographic assay for acute dengue viremia and convalescent antibody detection",
        "sample_type": "Blood (Serum)",
        "preparation_instructions": "No fasting required. Emergency stat results available in 1-2 hours.",
        "fasting_required": False,
        "report_time_hours": 2,
        "base_price": 900,
        "home_available": True,
        "home_charge": 100,
        "home_note": "+৳100 Rapid Pickup",
    },
    {
        "category_slug": "serology",
        "name": "HBsAg (Hepatitis B Surface Antigen - ELISA Confirmatory)",
        "description": "Quantitative enzyme-linked immunosorbent assay confirming Hepatitis B surface antigen",
        "sample_type": "Blood (Serum)",
        "preparation_instructions": "No special preparation required.",
        "fasting_required": False,
        "report_time_hours": 4,
        "base_price": 650,
        "home_available": True,
        "home_charge": 100,
        "home_note": "+৳100 Pickup",
    },
    # 12. MICROBIOLOGY
    {
        "category_slug": "microbiology",
        "name": "Urine Routine & Microscopic Examination (Urine R/M/E)",
        "description": "Clinical chemical strip and sediment microscopy evaluating proteinuria, pyuria & hematuria",
        "sample_type": "Clean Catch Midstream Urine",
        "preparation_instructions": "Collect first morning midstream urine in sterile container.",
        "fasting_required": False,
        "report_time_hours": 2,
        "base_price": 200,
        "home_available": True,
        "home_charge": 100,
        "home_note": "Sample pickup available",
    },
    {
        "category_slug": "microbiology",
        "name": "Blood Culture & Antibiotic Sensitivity (Automated BACTEC)",
        "description": "Continuous-monitoring automated aerobic/anaerobic blood culture identifying bacterial pathogens",
        "sample_type": "Whole Blood (Aseptic venipuncture)",
        "preparation_instructions": "Collect prior to starting antibiotics if clinically possible.",
        "fasting_required": False,
        "report_time_hours": 72,
        "base_price": 1200,
        "home_available": True,
        "home_charge": 150,
        "home_note": "Home venipuncture available",
    },
    # 13. HISTOPATHOLOGY
    {
        "category_slug": "histopathology",
        "name": "Surgical Specimen Biopsy & Histopathology (Small/Medium)",
        "description": "Formalin-fixed paraffin-embedded tissue sectioning and H&E staining with consultant reporting",
        "sample_type": "Biopsy Specimen in 10% Formalin",
        "preparation_instructions": "Transport specimen promptly in leak-proof 10% neutral buffered formalin container.",
        "fasting_required": False,
        "report_time_hours": 72,
        "base_price": 1800,
        "home_available": False,
    },
    # 14. HORMONES & THYROID
    {
        "category_slug": "hormone-endocrinology",
        "name": "Thyroid Profile (TSH, Free T3, Free T4)",
        "description": "Complete chemiluminescent immunoassay (CLIA) thyroid gland hormone screening",
        "sample_type": "Blood (Serum)",
        "preparation_instructions": "Morning blood draw recommended before taking thyroid medications.",
        "fasting_required": False,
        "report_time_hours": 6,
        "base_price": 1400,
        "home_available": True,
        "home_charge": 100,
        "home_note": "+৳100 Pickup",
    },
    {
        "category_slug": "hormone-endocrinology",
        "name": "25-Hydroxy Vitamin D (Total D2 + D3)",
        "description": "Chemiluminescent immunoassay measuring circulating serum 25-OH Vitamin D concentration",
        "sample_type": "Blood (Serum)",
        "preparation_instructions": "Overnight fasting preferred for optimal accuracy.",
        "fasting_required": True,
        "report_time_hours": 12,
        "base_price": 2200,
        "home_available": True,
        "home_charge": 100,
        "home_note": "Home sample pickup",
    },
    # 15. URINE & RENAL
    {
        "category_slug": "urine-renal",
        "name": "Urine Microalbumin / Creatinine Ratio (ACR)",
        "description": "Early diagnostic indicator of diabetic and hypertensive nephropathy renal microvascular damage",
        "sample_type": "Spot Urine Specimen",
        "preparation_instructions": "First morning spot urine preferred. Avoid strenuous exercise 24h prior.",
        "fasting_required": False,
        "report_time_hours": 4,
        "base_price": 800,
        "home_available": True,
        "home_charge": 100,
        "home_note": "Available",
    },
    # 16. ALLERGY & IMMUNOLOGY
    {
        "category_slug": "allergy-immunology",
        "name": "Serum Total Immunoglobulin E (IgE Level)",
        "description": "Quantitative marker for allergic sensitization, atopic dermatitis and parasitic immune reactions",
        "sample_type": "Blood (Serum)",
        "preparation_instructions": "No specific fasting required.",
        "fasting_required": False,
        "report_time_hours": 6,
        "base_price": 900,
        "home_available": True,
        "home_charge": 100,
        "home_note": "Home pickup available",
    },
    # 17. DENTAL
    {
        "category_slug": "dental-imaging",
        "name": "Digital Orthopantomogram (Panoramic Dental OPG)",
        "description": "Full panoramic 2D extraoral radiograph scanning maxillary and mandibular teeth, jaws & TM joints",
        "sample_type": "Digital Extraoral Radiograph",
        "preparation_instructions": "Remove dentures, earrings, spectacles and hairpins.",
        "fasting_required": False,
        "report_time_hours": 1,
        "base_price": 900,
        "home_available": False,
    },
    # 18. MAMMOGRAPHY
    {
        "category_slug": "mammography",
        "name": "Digital Bilateral Mammography with Sonography",
        "description": "Full-field digital bilateral breast mammogram with high-frequency supplementary ultrasound",
        "sample_type": "Digital Breast Radiograph & Scan",
        "preparation_instructions": "Do not apply talcum powder, deodorants or creams on chest or underarms on scan morning.",
        "fasting_required": False,
        "report_time_hours": 4,
        "base_price": 3500,
        "home_available": False,
    },
    # 19. PULMONARY PFT
    {
        "category_slug": "pulmonary-pft",
        "name": "Spirometry with Pre & Post Bronchodilator (PFT)",
        "description": "Computerized lung function spirometry measuring FEV1/FVC ratios and reversible airflow obstruction",
        "sample_type": "Respiratory Spirometry Trace",
        "preparation_instructions": "Avoid short-acting bronchodilator inhalers 4-6 hours prior as advised by doctor.",
        "fasting_required": False,
        "report_time_hours": 2,
        "base_price": 1800,
        "home_available": False,
    },
    # 20. BONE DEXA
    {
        "category_slug": "bone-dexa",
        "name": "Dual-Energy X-Ray Absorptiometry (DEXA Scan - Hip & Spine)",
        "description": "Gold-standard bone mineral density (BMD) T-score & Z-score assessment for osteoporosis risk",
        "sample_type": "DEXA Bone Density Scan",
        "preparation_instructions": "Do not ingest calcium supplements 24 hours prior to scan.",
        "fasting_required": False,
        "report_time_hours": 2,
        "base_price": 3200,
        "home_available": False,
    },
    # 21. INFECTIOUS DISEASES
    {
        "category_slug": "infectious-diseases",
        "name": "Widal Test (Typhoid Fever Agglutination Screen)",
        "description": "Tube agglutination titre determining antibodies against Salmonella Typhi (TO/TH) and Paratyphi",
        "sample_type": "Blood (Serum)",
        "preparation_instructions": "No fasting required.",
        "fasting_required": False,
        "report_time_hours": 3,
        "base_price": 350,
        "home_available": True,
        "home_charge": 100,
        "home_note": "Home sample pickup",
    },
    # 22. OPHTHALMOLOGY
    {
        "category_slug": "ophthalmology-diagnostics",
        "name": "Optical Coherence Tomography (OCT - Macula / Optic Disc)",
        "description": "Non-invasive high-definition micron-level cross-sectional retinal layer tomographic imaging",
        "sample_type": "Ophthalmic Tomographic Scan",
        "preparation_instructions": "Pupil dilation drops may be administered; avoid driving 2 hours post-procedure.",
        "fasting_required": False,
        "report_time_hours": 2,
        "base_price": 2500,
        "home_available": False,
    },
    # 23. PEDIATRIC
    {
        "category_slug": "pediatric-diagnostics",
        "name": "Pediatric Comprehensive Blood Panel (CBC, Group, Iron, Lead)",
        "description": "Specially tailored pediatric micro-sample hematological panel with capillary tube collection",
        "sample_type": "Capillary / Venous Blood",
        "preparation_instructions": "Keep child well hydrated before test.",
        "fasting_required": False,
        "report_time_hours": 6,
        "base_price": 1200,
        "home_available": True,
        "home_charge": 150,
        "home_note": "Trained pediatric phlebotomist",
    },
    # 24. HEALTH CHECKUP
    {
        "category_slug": "health-checkup-packages",
        "name": "Executive Whole-Body Health Screening Package",
        "description": "Comprehensive 60+ parameters: CBC, Lipid, LFT, KFT, HbA1c, Urine RME, ECG, Chest X-Ray & USG",
        "sample_type": "Multi-Specimen Comprehensive Screening",
        "preparation_instructions": "10-12 hours overnight fasting required. First morning urine required.",
        "fasting_required": True,
        "report_time_hours": 24,
        "base_price": 5500,
        "home_available": True,
        "home_charge": 0,
        "home_note": "Free Doorstep Sample Pickup",
    },
]

class Command(BaseCommand):
    help = "Seed standard diagnostic test categories, clinical tests, and facility offerings across diagnostic centers."

    def handle(self, *args, **options):
        self.stdout.write("--- Starting Diagnostic Catalog Seeding ---")

        # 1. Seed or Update Test Categories
        cat_map = {}
        for cat_data in CANONICAL_CATEGORIES:
            slug = cat_data["slug"]
            cat, _ = TestCategory.objects.update_or_create(
                slug=slug,
                defaults={
                    "name": cat_data["name"],
                    "icon": cat_data["icon"],
                    "description": cat_data["description"],
                    "order": cat_data["order"],
                    "is_active": True,
                }
            )
            cat_map[slug] = cat
            self.stdout.write(f"  Category: {cat.name} ({cat.slug})")

        # 2. Seed or Update Standard Clinical Tests
        test_map = {}
        for t_data in STANDARD_TESTS:
            cat_slug = t_data["category_slug"]
            cat = cat_map.get(cat_slug)
            if not cat:
                continue

            test_name = t_data["name"]
            test_slug = slugify(test_name)

            test, _ = Test.objects.update_or_create(
                slug=test_slug,
                defaults={
                    "name": test_name,
                    "category": cat,
                    "description": t_data["description"],
                    "sample_type": t_data["sample_type"],
                    "preparation_instructions": t_data["preparation_instructions"],
                    "fasting_required": t_data["fasting_required"],
                    "report_time_hours": t_data["report_time_hours"],
                    "is_active": True,
                }
            )
            test_map[test_slug] = (test, t_data)
            self.stdout.write(f"  Test: {test.name} -> {cat.name}")

        # 3. Find Diagnostic Center Locations
        locations = Location.objects.filter(location_type="diagnostic_center")
        if not locations.exists():
            self.stdout.write(self.style.WARNING("No diagnostic center locations found!"))
            return

        self.stdout.write(f"\nFound {locations.count()} diagnostic center locations:")

        facility_price_factors = {
            "popular": Decimal("1.00"),
            "ibn sina": Decimal("0.95"),
            "chevron": Decimal("1.02"),
            "praava": Decimal("1.10"),
            "lab one": Decimal("0.90"),
            "medinova": Decimal("0.96"),
            "thyrocare": Decimal("0.92"),
            "bsmmu": Decimal("0.60"),
            "dhaka medical": Decimal("0.50"),
            "victoria": Decimal("0.95"),
            "lithe": Decimal("0.90"),
            "medison": Decimal("0.92"),
        }

        # 4. Create FacilityTest Offerings
        offering_count = 0
        for loc in locations:
            loc_name_lower = (loc.name or "").lower()
            factor = Decimal("1.00")
            for key, f in facility_price_factors.items():
                if key in loc_name_lower:
                    factor = f
                    break

            for test_slug, (test, t_data) in test_map.items():
                base_p = Decimal(str(t_data["base_price"]))
                calc_price = Decimal(str(round(float(base_p * factor) / 50.0) * 50))
                if calc_price <= 0:
                    calc_price = base_p

                hours = t_data["report_time_hours"]
                report_str = f"Within {hours} hours" if hours < 24 else f"Same day ({hours} hrs)" if hours == 24 else f"Within {hours // 24} days"

                FacilityTest.objects.update_or_create(
                    location=loc,
                    test=test,
                    defaults={
                        "price": calc_price,
                        "discount_percent": Decimal("0.0"),
                        "report_time": report_str,
                        "is_available": True,
                        "home_sample_collection": t_data["home_available"],
                        "home_sample_charge": Decimal(str(t_data.get("home_charge", 0))),
                        "home_sample_note": t_data.get("home_note", ""),
                    }
                )
                offering_count += 1

        self.stdout.write(self.style.SUCCESS(f"\nSuccessfully seeded {len(cat_map)} categories, {len(test_map)} standard clinical tests, and {offering_count} facility offerings!"))
