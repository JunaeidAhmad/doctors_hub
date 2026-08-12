const fs = require('fs');
const path = require('path');

const srcDir = '/home/ltl/Tomal/project_doctors_hub/doctors_hub/src';
const mockDataPath = path.join(srcDir, 'data', 'mockData.js');
const constantsPath = path.join(srcDir, 'data', 'constants.js');

if (!fs.existsSync(mockDataPath)) {
  console.log('mockData.js already removed.');
} else {
  const content = fs.readFileSync(mockDataPath, 'utf8');
  
  // Extract LOCATIONS and CITY_THANAS
  const cityThanasMatch = content.match(/export const CITY_THANAS = \{[\s\S]*?\};/);
  const locationsMatch = content.match(/export const LOCATIONS = \[[\s\S]*?\];/);
  
  if (cityThanasMatch && locationsMatch) {
    fs.writeFileSync(constantsPath, cityThanasMatch[0] + '\n\n' + locationsMatch[0] + '\n');
    console.log('Created constants.js');
  }
}

// Function to replace strings in files
function replaceInFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) return;
  let fileContent = fs.readFileSync(filePath, 'utf8');
  let original = fileContent;
  for (const { regex, replacement } of replacements) {
    fileContent = fileContent.replace(regex, replacement);
  }
  if (fileContent !== original) {
    fs.writeFileSync(filePath, fileContent);
    console.log('Updated ' + filePath);
  }
}

const filesToUpdate = [
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
];

for (const relPath of filesToUpdate) {
  const absPath = path.join(srcDir, relPath);
  replaceInFile(absPath, [
    // Replace imports from mockData
    { regex: /import \{([^}]*)\} from '([^']*)mockData';/g, replacement: (match, p1, p2) => {
      // Check if LOCATIONS or CITY_THANAS are imported
      const imports = p1.split(',').map(s => s.trim());
      const keep = imports.filter(i => i === 'LOCATIONS' || i === 'CITY_THANAS');
      if (keep.length > 0) {
        return `import { ${keep.join(', ')} } from '${p2}constants';`;
      }
      return '';
    }}
  ]);
}

// Remove mockData.js
if (fs.existsSync(mockDataPath)) {
  fs.unlinkSync(mockDataPath);
  console.log('Deleted mockData.js');
}

