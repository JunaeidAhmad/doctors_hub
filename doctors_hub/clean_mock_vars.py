import os
import re
import glob

src_dir = '/home/ltl/Tomal/project_doctors_hub/doctors_hub/src'

# list of variables to wipe out
mock_vars = [
    'MOCK_SPECIALTIES',
    'HOSPITALS',
    'DIAGNOSTIC_CENTERS',
    'DOCTORS',
    'TESTS',
    'DIAGNOSTIC_CENTER_TESTS',
    'SPECIALTIES',
    'HOSPITAL_CATEGORIES',
    'DIAGNOSTIC_CENTER_CATEGORIES',
    'HOSPITAL_SERVICES',
    'DIAGNOSTIC_SERVICES',
    'TEST_CATEGORIES',
    'DOCTOR_CHAMBERS',
    'BRANCH_TESTS',
    'PATHOLOGY_TESTS',
    'HOSPITAL_SPECIALTIES'
]

def clean_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        original = f.read()
    
    content = original
    
    # replace useState(MOCK_VAR) -> useState([])
    for var in mock_vars:
        content = re.sub(rf'useState\({var}\)', 'useState([])', content)
        
    # replace ensureArray(..., MOCK_VAR) -> ensureArray(..., [])
    for var in mock_vars:
        content = re.sub(rf'ensureArray\(([^,]+),\s*{var}\)', r'ensureArray(\1, [])', content)
        
    # replace fetchItem(apiCall, setter, MOCK_VAR) -> fetchItem(apiCall, setter, [])
    for var in mock_vars:
        content = re.sub(rf'fetchItem\(([^,]+),\s*([^,]+),\s*{var}\)', r'fetchItem(\1, \2, [])', content)

    # replace array map/find/some/filter: MOCK_VAR.some(...) -> ([]).some(...)
    # Wait, some components literally just map over them directly! Let's handle them.
    # We can replace MOCK_VAR with empty array []
    for var in mock_vars:
        # Avoid replacing if it's already part of a string or something, but JS makes it safe to replace word boundaries.
        content = re.sub(rf'\b{var}\b', '[]', content)
        
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Cleaned {filepath}")

for root, _, files in os.walk(src_dir):
    for f in files:
        if f.endswith('.jsx') or f.endswith('.js'):
            clean_file(os.path.join(root, f))
