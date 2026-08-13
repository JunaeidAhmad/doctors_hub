import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from api.models import TestCategory, Test, DiagnosticCenter, DiagnosticCenterTest
from django.utils.text import slugify
import random

empty_cats = []
for c in TestCategory.objects.all():
    if Test.objects.filter(category=c).count() == 0:
        empty_cats.append(c)

test_names = {
    'Cardiac Tests': ['ECG - Resting', 'Echocardiogram (Echo)', 'Treadmill Test (TMT) / Stress Test', 'Holter Monitor', 'Cardiac MRI'],
    'Endoscopy/Colonoscopy': ['Upper GI Endoscopy', 'Flexible Sigmoidoscopy', 'Colonoscopy with Biopsy', 'Capsule Endoscopy', 'ERCP Procedure'],
    'Genetic & Molecular': ['DNA Karyotyping', 'BRCA1/BRCA2 Gene Mutation', 'Next Generation Sequencing (NGS)', 'Chromosomal Microarray', 'HLA Typing'],
    'Hematology': ['Complete Blood Count (CBC)', 'Hemoglobin A1c (HbA1c)', 'Prothrombin Time (PT/INR)', 'Erythrocyte Sedimentation Rate (ESR)', 'Peripheral Blood Smear'],
    'Histopathology / Biopsy': ['FNAC (Fine Needle Aspiration Cytology)', 'Core Needle Biopsy', 'Surgical Pathology', 'Pap Smear', 'Bone Marrow Biopsy'],
    'Mammography': ['Screening Mammogram', 'Diagnostic Mammogram', '3D Mammography (Tomosynthesis)', 'Breast Ultrasound', 'Breast MRI'],
    'Neuro Tests': ['EEG (Electroencephalogram)', 'EMG (Electromyography)', 'NCV (Nerve Conduction Velocity)', 'Brain MRI', 'CT Scan Brain'],
    'Pulmonary Function Test (PFT)': ['Spirometry', 'Lung Volumes', 'Diffusion Capacity', 'Arterial Blood Gas (ABG)', 'Peak Flow Measurement'],
    'Ultrasound/USG': ['Whole Abdomen USG', 'Pelvic USG', 'Obstetric USG', 'Doppler Ultrasound', 'Thyroid USG'],
    'X-ray': ['Chest X-ray (CXR)', 'KUB X-ray', 'Lumbosacral Spine X-ray', 'Joints X-ray', 'Dental X-ray (OPG)']
}

centers = list(DiagnosticCenter.objects.all())

for cat in empty_cats:
    names = test_names.get(cat.name, [f'{cat.name} Test {i}' for i in range(1, 6)])
    print(f"Adding tests for {cat.name}...")
    tests_created = []
    for name in names:
        test = Test.objects.create(
            name=name,
            category=cat,
            description=f'Standard {name} diagnostic procedure.',
            preparation_instructions='Fasting may be required. Please consult with your doctor.',
            report_time_hours=random.choice([12, 24, 48]),
            home_sample_collection=random.choice([True, False])
        )
        tests_created.append(test)
    
    # Assign to 2-4 random centers
    for test in tests_created:
        num_centers = random.randint(2, 5)
        chosen_centers = random.sample(centers, min(num_centers, len(centers)))
        for center in chosen_centers:
            price = random.randint(500, 3000)
            DiagnosticCenterTest.objects.create(
                center=center,
                test=test,
                price=price,
                original_price=price + 200,
                discount='10% OFF',
                report_time=f'{test.report_time_hours} Hours',
                is_available=True,
                home_sample_collection=test.home_sample_collection
            )
            
print("Done seeding empty categories.")
