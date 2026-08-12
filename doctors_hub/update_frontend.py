import os
import re

src_dir = '/home/ltl/Tomal/project_doctors_hub/doctors_hub/src'
mock_data_path = os.path.join(src_dir, 'data', 'mockData.js')
constants_path = os.path.join(src_dir, 'data', 'constants.js')

if os.path.exists(mock_data_path):
    with open(mock_data_path, 'r', encoding='utf-8') as f:
        content = f.read()

    city_thanas_match = re.search(r'export const CITY_THANAS = \{[\s\S]*?\};', content)
    locations_match = re.search(r'export const LOCATIONS = \[[\s\S]*?\];', content)

    if city_thanas_match and locations_match:
        with open(constants_path, 'w', encoding='utf-8') as f:
            f.write(city_thanas_match.group(0) + '\n\n' + locations_match.group(0) + '\n')
        print('Created constants.js')

def replace_in_file(file_path):
    if not os.path.exists(file_path):
        return
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content

    def replacer(match):
        imports = [i.strip() for i in match.group(1).split(',')]
        keep = [i for i in imports if i in ('LOCATIONS', 'CITY_THANAS')]
        if keep:
            return f"import {{ {', '.join(keep)} }} from '{match.group(2)}constants';"
        return ''

    content = re.sub(r"import\s+\{([^}]+)\}\s+from\s+'([^']*)mockData';", replacer, content)

    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print('Updated ' + file_path)

files_to_update = [
    'components/Footer.jsx',
    'components/TopUtilityStrip.jsx',
    'views/AdminDashboard/components/modals/DiagnosticModal.jsx',
    'views/AdminDashboard/components/modals/HospitalModal.jsx',
    'views/AdminDashboard/context/AdminContext.jsx',
    'views/DiagnosticsSearch/DiagnosticsSearchPage.jsx',
    'views/DoctorSearch/DoctorSearchPage.jsx',
    'views/Home/HomePage.jsx',
    'views/Home/components/DiagnosticsSection.jsx',
    'views/Home/components/DoctorMonitorGrid.jsx',
    'views/Home/components/SpecialtyGrid.jsx',
    'views/Home/components/ThreeWayEngine.jsx',
    'views/HospitalDetail/HospitalDetailPage.jsx',
    'views/Hospitals/HospitalsPage.jsx'
]

for rel_path in files_to_update:
    abs_path = os.path.join(src_dir, rel_path)
    replace_in_file(abs_path)

if os.path.exists(mock_data_path):
    os.remove(mock_data_path)
    print('Deleted mockData.js')

