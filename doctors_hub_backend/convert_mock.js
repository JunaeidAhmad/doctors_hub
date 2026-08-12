const fs = require('fs');

const content = fs.readFileSync('../doctors_hub/src/data/mockData.js', 'utf8');
const lines = content.split('\n');
let modified = lines.map(line => line.replace(/^export const /g, 'const ')).join('\n');

modified = "const fs = require('fs');\n" + modified;

modified += `
const allData = {
  CITY_THANAS: typeof CITY_THANAS !== 'undefined' ? CITY_THANAS : {},
  LOCATIONS: typeof LOCATIONS !== 'undefined' ? LOCATIONS : [],
  SPECIALTIES: typeof SPECIALTIES !== 'undefined' ? SPECIALTIES : [],
  HOSPITAL_CATEGORIES: typeof HOSPITAL_CATEGORIES !== 'undefined' ? HOSPITAL_CATEGORIES : [],
  HOSPITAL_SERVICES: typeof HOSPITAL_SERVICES !== 'undefined' ? HOSPITAL_SERVICES : [],
  DIAGNOSTIC_SERVICES: typeof DIAGNOSTIC_SERVICES !== 'undefined' ? DIAGNOSTIC_SERVICES : [],
  TESTS: typeof TESTS !== 'undefined' ? TESTS : [],
  DIAGNOSTIC_CENTER_CATEGORIES: typeof DIAGNOSTIC_CENTER_CATEGORIES !== 'undefined' ? DIAGNOSTIC_CENTER_CATEGORIES : [],
  TEST_CATEGORIES: typeof TEST_CATEGORIES !== 'undefined' ? TEST_CATEGORIES : [],
  PATHOLOGY_CATEGORIES: typeof PATHOLOGY_CATEGORIES !== 'undefined' ? PATHOLOGY_CATEGORIES : [],
  HOSPITALS: typeof HOSPITALS !== 'undefined' ? HOSPITALS : [],
  DIAGNOSTIC_CENTERS: typeof DIAGNOSTIC_CENTERS !== 'undefined' ? DIAGNOSTIC_CENTERS : [],
  DOCTORS: typeof DOCTORS !== 'undefined' ? DOCTORS : [],
  DOCTOR_CHAMBERS: typeof DOCTOR_CHAMBERS !== 'undefined' ? DOCTOR_CHAMBERS : [],
  BRANCH_TESTS: typeof BRANCH_TESTS !== 'undefined' ? BRANCH_TESTS : []
};
fs.writeFileSync('mockData.json', JSON.stringify(allData, null, 2));
`;

fs.writeFileSync('temp_runner.js', modified);
