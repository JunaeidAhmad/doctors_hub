import test from 'node:test';
import assert from 'node:assert/strict';
import { formatFacilityName } from './facilityUtils.js';

test('formatFacilityName - basic formatting and blanks', () => {
  assert.equal(formatFacilityName('Square Hospital', 'Dhanmondi'), 'Square Hospital (Dhanmondi)');
  assert.equal(formatFacilityName('Square Hospital', ''), 'Square Hospital');
  assert.equal(formatFacilityName('Square Hospital', '   '), 'Square Hospital');
  assert.equal(formatFacilityName('Square Hospital', null), 'Square Hospital');
  assert.equal(formatFacilityName('Square Hospital', undefined), 'Square Hospital');
  assert.equal(formatFacilityName('', 'Dhanmondi'), '(Dhanmondi)');
  assert.equal(formatFacilityName('', ''), '');
  assert.equal(formatFacilityName(null), '');
  assert.equal(formatFacilityName(undefined), '');
});

test('formatFacilityName - object field precedence', () => {
  // Test 1: display_name wins
  const obj1 = {
    display_name: 'Primary Facility (Mirpur)',
    name: 'Secondary Facility',
    branch: 'Mirpur'
  };
  assert.equal(formatFacilityName(obj1), 'Primary Facility (Mirpur)');

  // Test 2: name with branch
  const obj2 = {
    name: 'Secondary Facility',
    branch: 'Uttara'
  };
  assert.equal(formatFacilityName(obj2), 'Secondary Facility (Uttara)');

  // Test 3: nested facility summary
  const obj3 = {
    facility: { display_name: 'Lab Diagnostic (Banani)' }
  };
  assert.equal(formatFacilityName(obj3), 'Lab Diagnostic (Banani)');

  // Test 4: chamber_name fallback
  const obj4 = {
    chamber_name: 'Private Chamber',
    branch: 'Dhanmondi'
  };
  assert.equal(formatFacilityName(obj4), 'Private Chamber (Dhanmondi)');

  // Test 5: nested facility object fallback
  const obj5 = {
    facility: { name: 'Apollo Clinic', branch: 'Gulshan' }
  };
  assert.equal(formatFacilityName(obj5), 'Apollo Clinic (Gulshan)');

  // Test 6: nested location fallback
  const obj6 = {
    location: { name: 'Square Clinic', branch: 'Panthapath' }
  };
  assert.equal(formatFacilityName(obj6), 'Square Clinic (Panthapath)');

  // Test 7: explicitBranch parameter overrides object branch
  assert.equal(formatFacilityName({ name: 'Square Hospital', branch: 'Old' }, 'New Branch'), 'Square Hospital (New Branch)');
});

test('formatFacilityName - suffix normalization to (Branch)', () => {
  // Dash suffix
  assert.equal(formatFacilityName('Square Hospital - Dhanmondi', 'Dhanmondi'), 'Square Hospital (Dhanmondi)');

  // Comma suffix
  assert.equal(formatFacilityName('Square Hospital, Dhanmondi', 'Dhanmondi'), 'Square Hospital (Dhanmondi)');

  // Bare suffix
  assert.equal(formatFacilityName('Square Hospital Dhanmondi', 'Dhanmondi'), 'Square Hospital (Dhanmondi)');

  // Already formatted in parentheses
  assert.equal(formatFacilityName('Square Hospital (Dhanmondi)', 'Dhanmondi'), 'Square Hospital (Dhanmondi)');

  // Case-insensitive parentheses match
  assert.equal(formatFacilityName('Square Hospital (dhanmondi)', 'Dhanmondi'), 'Square Hospital (dhanmondi)');
});

test('formatFacilityName - name is identical to branch (no mangling)', () => {
  assert.equal(formatFacilityName('Dhanmondi', 'Dhanmondi'), 'Dhanmondi');
  assert.equal(formatFacilityName('dhanmondi', 'Dhanmondi'), 'dhanmondi');
  assert.equal(formatFacilityName('Mirpur', 'mirpur'), 'Mirpur');
});

test('formatFacilityName - leading and trailing whitespace trimming', () => {
  assert.equal(formatFacilityName('  Square Hospital  ', '  Dhanmondi  '), 'Square Hospital (Dhanmondi)');
  assert.equal(formatFacilityName({ name: '  Square Hospital  ', branch: '  Dhanmondi  ' }), 'Square Hospital (Dhanmondi)');
});

test('formatFacilityName - unicode Bengali script support', () => {
  assert.equal(formatFacilityName('স্কয়ার হাসপাতাল', 'ধানমন্ডি'), 'স্কয়ার হাসপাতাল (ধানমন্ডি)');
  assert.equal(formatFacilityName('স্কয়ার হাসপাতাল - ধানমন্ডি', 'ধানমন্ডি'), 'স্কয়ার হাসপাতাল (ধানমন্ডি)');
  assert.equal(formatFacilityName('স্কয়ার হাসপাতাল (ধানমন্ডি)', 'ধানমন্ডি'), 'স্কয়ার হাসপাতাল (ধানমন্ডি)');
  assert.equal(formatFacilityName('ধানমন্ডি', 'ধানমন্ডি'), 'ধানমন্ডি');
});
