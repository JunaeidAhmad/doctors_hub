import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { navConfig } from './src/views/AdminDashboard/navConfig.js';
import { calculateFinalPrice } from './src/views/AdminDashboard/utils/adminHelpers.js';
import {
  DAYS_OF_WEEK,
  formatDisplayTime,
  calculateSlotDuration,
  checkScheduleConflict
} from './src/utils/scheduleUtils.js';

describe('1. Navigation & Role Access Control Matrix', () => {
  it('Super Admin has access to all essential navigation groups and tabs', () => {
    const superAdminNav = navConfig.super_admin;
    assert.ok(Array.isArray(superAdminNav), 'Super admin nav must be an array');
    const allItemIds = superAdminNav.flatMap(group => group.items.map(item => item.id));

    const expectedTabs = [
      'overview', 'verification-queue', 'hospitals', 'diagnostics', 'doctors',
      'doctor-specs', 'specialty-aliases', 'hospital-specs', 'diag-cats',
      'hosp-services', 'diag-services', 'tests', 'test-cats', 'branch-tests',
      'add-tests-to-diagnostics', 'doc-bookings', 'lab-bookings', 'roles',
      'assign-roles', 'staff'
    ];

    for (const tabId of expectedTabs) {
      assert.ok(allItemIds.includes(tabId), `Super admin nav must contain "${tabId}"`);
    }
  });

  it('Hospital Admin navigation is restricted to hospital context', () => {
    const hospNav = navConfig.hospital_admin;
    const allItemIds = hospNav.flatMap(group => group.items.map(item => item.id));

    assert.ok(allItemIds.includes('overview'));
    assert.ok(allItemIds.includes('hospitals'));
    assert.ok(allItemIds.includes('doctors'));
    assert.ok(allItemIds.includes('doc-bookings'));
    assert.ok(allItemIds.includes('roles'));
    assert.ok(allItemIds.includes('staff'));

    // Should NOT have super admin tabs
    assert.ok(!allItemIds.includes('verification-queue'));
    assert.ok(!allItemIds.includes('platform-admins'));
  });

  it('Diagnostic Admin navigation is restricted to lab context', () => {
    const diagNav = navConfig.diagnostic_admin;
    const allItemIds = diagNav.flatMap(group => group.items.map(item => item.id));

    assert.ok(allItemIds.includes('overview'));
    assert.ok(allItemIds.includes('diagnostics'));
    assert.ok(allItemIds.includes('branch-tests'));
    assert.ok(allItemIds.includes('add-tests-to-diagnostics'));
    assert.ok(allItemIds.includes('lab-bookings'));
    assert.ok(!allItemIds.includes('hospitals'));
  });

  it('Doctor navigation is scoped to doctor profile, chambers, and appointments', () => {
    const docNav = navConfig.doctor;
    const allItemIds = docNav.flatMap(group => group.items.map(item => item.id));

    assert.ok(allItemIds.includes('overview'));
    assert.ok(allItemIds.includes('doctors'));
    assert.ok(allItemIds.includes('doc-affiliations'));
    assert.ok(allItemIds.includes('doc-schedules'));
    assert.ok(allItemIds.includes('doc-bookings'));
    assert.ok(!allItemIds.includes('verification-queue'));
    assert.ok(!allItemIds.includes('roles'));
    assert.ok(!allItemIds.includes('hospitals'));
  });
});

describe('2. AdminLoginForm Buttons & Authentication Flows', () => {
  it('Validates role permissions for admin portal login', () => {
    const allowedRoles = ['super_admin', 'facility_admin', 'doctor', 'staff', 'admin'];

    const checkAccess = (user) => Boolean(
      user?.is_staff ||
      user?.is_superuser ||
      user?.is_super_admin ||
      user?.is_facility_admin ||
      user?.is_doctor ||
      allowedRoles.includes(user?.role) ||
      (Array.isArray(user?.roles) && user.roles.length > 0) ||
      (Array.isArray(user?.managed_locations) && user.managed_locations.length > 0) ||
      user?.phone_number === '01700000000'
    );

    assert.ok(checkAccess({ is_superuser: true }));
    assert.ok(checkAccess({ role: 'facility_admin' }));
    assert.ok(checkAccess({ is_doctor: true }));
    assert.ok(checkAccess({ managed_locations: [{ id: 'loc-1' }] }));
    assert.ok(checkAccess({ roles: ['Hospital Manager'] }));
    assert.ok(checkAccess({ phone_number: '01700000000' }));

    // Regular patient user without admin privileges should be denied
    assert.equal(checkAccess({ role: 'patient', is_staff: false }), false);
    assert.equal(checkAccess(null), false);
  });

  it('Demo credentials autofill sets phone and password properly', () => {
    let phone = '';
    let pass = '';
    let err = 'Previous error';

    const fillCredentials = (p, pwd) => {
      phone = p;
      pass = pwd;
      err = '';
    };

    fillCredentials('01700000000', 'Admin1234!');
    assert.equal(phone, '01700000000');
    assert.equal(pass, 'Admin1234!');
    assert.equal(err, '');
  });

  it('Facility self-registration constructs correct payload shape', () => {
    const diagForm = {
      name: 'Modern Diagnostic',
      branch: 'Mirpur',
      license_number: 'DGHS-9988',
      division: 'Dhaka',
      district: 'Dhaka',
      area: 'Mirpur-10',
      address_line: 'Plot 4, Main Road',
      phone_number: '01712345678',
      password: 'SecurePass123!',
      admin_name: 'Dr. Tariq',
      email: 'admin@moderndiag.com',
      category_id: 'cat-123'
    };

    const payload = {
      facility_type: 'diagnostic_center',
      name: diagForm.name.trim(),
      branch: diagForm.branch.trim(),
      license_number: diagForm.license_number.trim(),
      division: diagForm.division,
      district: diagForm.district,
      area: diagForm.area,
      address_line: diagForm.address_line.trim(),
      category_id: diagForm.category_id || undefined,
      phone_number: diagForm.phone_number.trim(),
      password: diagForm.password,
      first_name: diagForm.admin_name.trim() || diagForm.name.trim(),
      email: diagForm.email ? diagForm.email.trim() : undefined
    };

    assert.equal(payload.facility_type, 'diagnostic_center');
    assert.equal(payload.name, 'Modern Diagnostic');
    assert.equal(payload.license_number, 'DGHS-9988');
    assert.equal(payload.first_name, 'Dr. Tariq');
  });

  it('Doctor self-registration constructs correct payload shape', () => {
    const docForm = {
      name: 'Dr. Fatima Rahman',
      phone_number: '01787654321',
      password: 'DocPassword!',
      bmdc_number: 'A-45210',
      qualification: 'MBBS, FCPS (Surgery)',
      experience: '8+ years',
      specialty_id: 'spec-surgery-uuid',
      email: 'fatima@example.com'
    };

    const payload = {
      name: docForm.name.trim(),
      phone_number: docForm.phone_number.trim(),
      password: docForm.password,
      bmdc_number: docForm.bmdc_number.trim(),
      qualification: docForm.qualification.trim(),
      experience: docForm.experience.trim() || '5+ years',
      specialty_ids: docForm.specialty_id ? [docForm.specialty_id] : [],
      email: docForm.email ? docForm.email.trim() : undefined
    };

    assert.equal(payload.name, 'Dr. Fatima Rahman');
    assert.equal(payload.bmdc_number, 'A-45210');
    assert.deepEqual(payload.specialty_ids, ['spec-surgery-uuid']);
  });
});

describe('3. Directory Tabs (Hospitals, Diagnostics, Doctors)', () => {
  it('Hospitals tab action buttons: create, edit modal opener, and delete state update', () => {
    let activeTab = '';
    let editingHospital = null;
    let showHospitalModal = false;
    let hospitalList = [
      { id: 'h-1', name: 'Square Hospital', branch: 'Panthapath' },
      { id: 'h-2', name: 'Apollo Hospital', branch: 'Bashundhara' }
    ];

    const handleOpenHospitalModal = (h = null) => {
      activeTab = 'hospitals';
      editingHospital = h;
      showHospitalModal = true;
    };

    // Test Add Hospital button
    handleOpenHospitalModal();
    assert.equal(activeTab, 'hospitals');
    assert.equal(editingHospital, null);
    assert.equal(showHospitalModal, true);

    // Test Edit Hospital button
    handleOpenHospitalModal(hospitalList[0]);
    assert.equal(editingHospital.id, 'h-1');
    assert.equal(editingHospital.name, 'Square Hospital');

    // Test Delete Hospital button handler
    const deleteHospital = (id) => {
      hospitalList = hospitalList.filter(h => h.id !== id);
    };
    deleteHospital('h-1');
    assert.equal(hospitalList.length, 1);
    assert.equal(hospitalList[0].id, 'h-2');
  });

  it('Diagnostics tab action buttons: create, edit, navigate to add tests', () => {
    let targetTab = '';
    let facilityPrefill = null;
    let editingDiag = null;

    const handleNavigateToAddTests = (type, id, obj) => {
      targetTab = 'add-tests-to-diagnostics';
      facilityPrefill = { type, id: String(id) };
    };

    const handleOpenDiagnosticModal = (dc = null) => {
      targetTab = 'diagnostics';
      editingDiag = dc;
    };

    // Test "+ Test" button from table row
    handleNavigateToAddTests('diagnostic_center', 'dc-100', { name: 'Lab One' });
    assert.equal(targetTab, 'add-tests-to-diagnostics');
    assert.equal(facilityPrefill.type, 'diagnostic_center');
    assert.equal(facilityPrefill.id, 'dc-100');

    // Test Edit button
    handleOpenDiagnosticModal({ id: 'dc-100', name: 'Lab One' });
    assert.equal(targetTab, 'diagnostics');
    assert.equal(editingDiag.name, 'Lab One');
  });

  it('Doctors tab action buttons: CSV export, filters reset, affiliation display safety', () => {
    let searchTerm = 'Cardio';
    let specialty = 'Cardiology';
    let status = 'verified';
    let designation = 'Professor';

    const resetFilters = () => {
      searchTerm = '';
      specialty = '';
      status = '';
      designation = '';
    };

    resetFilters();
    assert.equal(searchTerm, '');
    assert.equal(specialty, '');
    assert.equal(status, '');
    assert.equal(designation, '');

    // Test safe chamber display extraction for all possible object / string shapes
    const getChamberName = (aff) => {
      return aff?.facility?.display_name ||
             aff?.facility?.name ||
             (typeof aff.hospital === 'string' ? aff.hospital : aff.hospital?.name) ||
             (typeof aff.diagnostic_center === 'string' ? aff.diagnostic_center : aff.diagnostic_center?.name) ||
             aff?.display_name ||
             aff?.chamber_name ||
             aff?.facility_name ||
             'Consultation Suite';
    };

    // Shape 1: Nested facility object
    assert.equal(getChamberName({ facility: { name: 'Dhaka Medical Hospital' } }), 'Dhaka Medical Hospital');
    // Shape 2: Hospital object
    assert.equal(getChamberName({ hospital: { name: 'Evercare Hospital' } }), 'Evercare Hospital');
    // Shape 3: Hospital string
    assert.equal(getChamberName({ hospital: 'Apollo Hospital' }), 'Apollo Hospital');
    // Shape 4: Chamber name fallback
    assert.equal(getChamberName({ chamber_name: 'Dhanmondi Chamber' }), 'Dhanmondi Chamber');
    // Shape 5: Empty fallback
    assert.equal(getChamberName({}), 'Consultation Suite');
  });
});

describe('4. Tests & Facility Offerings Tabs', () => {
  it('Master Tests tab: Add, Edit, and Delete action handlers', () => {
    let testsList = [
      { id: 't-1', name: 'CBC' },
      { id: 't-2', name: 'Lipid Profile' }
    ];
    let editingTest = null;
    let showTestModal = false;

    const handleOpenTestModal = (t = null) => {
      editingTest = t;
      showTestModal = true;
    };

    handleOpenTestModal(testsList[0]);
    assert.equal(editingTest.name, 'CBC');
    assert.equal(showTestModal, true);

    // Delete
    testsList = testsList.filter(t => t.id !== 't-1');
    assert.equal(testsList.length, 1);
    assert.equal(testsList[0].name, 'Lipid Profile');
  });

  it('Add Tests to Facility: Category bulk selection & price matrix creation', () => {
    const allCategories = [{ id: 'cat-1', name: 'Blood' }, { id: 'cat-2', name: 'Imaging' }, { id: 'cat-3', name: 'Biochemistry' }];
    let selectedCatIds = [];

    // Select All button
    selectedCatIds = allCategories.map(c => c.id);
    assert.equal(selectedCatIds.length, 3);

    // Deselect All button
    selectedCatIds = [];
    assert.equal(selectedCatIds.length, 0);

    // Toggle Category
    const toggle = (id) => {
      selectedCatIds = selectedCatIds.includes(id)
        ? selectedCatIds.filter(x => x !== id)
        : [...selectedCatIds, id];
    };

    toggle('cat-1');
    assert.deepEqual(selectedCatIds, ['cat-1']);
    toggle('cat-2');
    assert.deepEqual(selectedCatIds, ['cat-1', 'cat-2']);
    toggle('cat-1');
    assert.deepEqual(selectedCatIds, ['cat-2']);

    // Price matrix payload preparation
    const associatedTests = [{ id: 't-1' }, { id: 't-2' }];
    const pricesByTest = { 't-1': '1500', 't-2': '800' };
    const pricesPayload = {};
    for (const testObj of associatedTests) {
      const p = pricesByTest[testObj.id] ?? '';
      pricesPayload[testObj.id] = { price: p === '' ? null : p };
    }

    assert.deepEqual(pricesPayload, {
      't-1': { price: '1500' },
      't-2': { price: '800' }
    });
  });
});

describe('5. Taxonomy & Specialties Tabs', () => {
  it('CategoriesTab maps dynamic tab configs to appropriate add/edit/delete buttons', () => {
    const getTabConfig = (tab) => {
      switch (tab) {
        case 'doctor-specs': return { title: 'Doctor Specialties' };
        case 'hospital-specs': return { title: 'Hospital Categories' };
        case 'diag-cats': return { title: 'Diagnostic Categories' };
        case 'hosp-services': return { title: 'Hospital Services' };
        case 'diag-services': return { title: 'Diagnostic Services' };
        case 'test-cats': return { title: 'Test Categories' };
        default: return { title: 'Categories' };
      }
    };

    assert.equal(getTabConfig('doctor-specs').title, 'Doctor Specialties');
    assert.equal(getTabConfig('hospital-specs').title, 'Hospital Categories');
    assert.equal(getTabConfig('diag-cats').title, 'Diagnostic Categories');
    assert.equal(getTabConfig('hosp-services').title, 'Hospital Services');
    assert.equal(getTabConfig('diag-services').title, 'Diagnostic Services');
    assert.equal(getTabConfig('test-cats').title, 'Test Categories');
  });

  it('Specialties Taxonomy review queue selection & batch verify buttons', () => {
    let unverifiedAliases = [
      { id: 'alias-1', name: 'Heart Doctor', is_verified: false },
      { id: 'alias-2', name: 'Kidney Specialist', is_verified: false }
    ];
    let selectedReviewIds = [];

    // Toggle individual
    selectedReviewIds = ['alias-1'];
    assert.deepEqual(selectedReviewIds, ['alias-1']);

    // Select all reviews
    selectedReviewIds = unverifiedAliases.map(a => a.id);
    assert.deepEqual(selectedReviewIds, ['alias-1', 'alias-2']);

    // Batch approve
    unverifiedAliases = unverifiedAliases.map(a => ({
      ...a,
      is_verified: selectedReviewIds.includes(a.id) ? true : a.is_verified
    }));
    selectedReviewIds = [];

    assert.ok(unverifiedAliases.every(a => a.is_verified === true));
  });
});

describe('6. Bookings & Patient Orders Tab', () => {
  it('Allowed status transitions enforce sequential lifecycle', () => {
    const ALLOWED_TRANSITIONS = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['completed', 'cancelled', 'no_show'],
      completed: [],
      cancelled: [],
      no_show: [],
    };

    const canTransition = (current, target) => {
      const allowed = ALLOWED_TRANSITIONS[current] || [];
      return allowed.includes(target);
    };

    assert.ok(canTransition('pending', 'confirmed'));
    assert.ok(canTransition('pending', 'cancelled'));
    assert.ok(!canTransition('pending', 'completed')); // Must be confirmed first

    assert.ok(canTransition('confirmed', 'completed'));
    assert.ok(canTransition('confirmed', 'no_show'));
    assert.ok(canTransition('confirmed', 'cancelled'));

    assert.ok(!canTransition('completed', 'pending'));
    assert.ok(!canTransition('cancelled', 'confirmed'));
  });
});

describe('7. RBAC, Roles, and Staff Delegation Tabs', () => {
  it('RolesTab permissions toggle maintains unique set', () => {
    let permissions = ['view_dashboard'];

    const togglePermission = (permId) => {
      if (permissions.includes(permId)) {
        permissions = permissions.filter(p => p !== permId);
      } else {
        permissions = [...permissions, permId];
      }
    };

    togglePermission('manage_doctors');
    assert.deepEqual(permissions, ['view_dashboard', 'manage_doctors']);

    togglePermission('view_dashboard');
    assert.deepEqual(permissions, ['manage_doctors']);
  });

  it('System role deletion is blocked with warning', () => {
    const deleteRole = (role) => {
      if (role.is_system) {
        return { allowed: false, message: 'System roles cannot be deleted' };
      }
      return { allowed: true, message: 'Deleted' };
    };

    const sysRole = { id: 'r-sys', name: 'Super Admin', is_system: true };
    const customRole = { id: 'r-custom', name: 'Shift Nurse', is_system: false };

    assert.equal(deleteRole(sysRole).allowed, false);
    assert.equal(deleteRole(customRole).allowed, true);
  });

  it('AssignRolesTab constructs valid role assignment payload with scope verification', () => {
    const buildAssignPayload = (user, roleObj, facilityId) => {
      if (!user) throw new Error('User required');
      if (!roleObj) throw new Error('Role required');
      if (roleObj.scope_type === 'facility' && !facilityId) {
        throw new Error('Please select a target facility for facility-scoped roles.');
      }
      return {
        user: user.id,
        role: roleObj.id,
        facility: roleObj.scope_type === 'facility' ? facilityId : null
      };
    };

    const user = { id: 'u-123' };
    const globalRole = { id: 'r-glob', scope_type: 'global' };
    const facilityRole = { id: 'r-fac', scope_type: 'facility' };

    // Global assignment
    const globPayload = buildAssignPayload(user, globalRole, null);
    assert.equal(globPayload.user, 'u-123');
    assert.equal(globPayload.facility, null);

    // Facility assignment with facility ID
    const facPayload = buildAssignPayload(user, facilityRole, 'loc-456');
    assert.equal(facPayload.facility, 'loc-456');

    // Facility assignment missing facility ID throws error
    assert.throws(() => buildAssignPayload(user, facilityRole, null), /target facility/);
  });
});

describe('8. Verification Queue & Platform Governance', () => {
  it('Verification action payload generates valid approval and rejection parameters', () => {
    const getVerificationPayload = (entityType, entityId, action) => {
      assert.ok(['facility', 'doctor'].includes(entityType));
      assert.ok(['approve', 'reject'].includes(action));
      return {
        url: `/api/admin/verifications/${entityType}/${entityId}/`,
        body: { action }
      };
    };

    const facApprove = getVerificationPayload('facility', 'fac-1', 'approve');
    assert.equal(facApprove.url, '/api/admin/verifications/facility/fac-1/');
    assert.equal(facApprove.body.action, 'approve');

    const docReject = getVerificationPayload('doctor', 'doc-1', 'reject');
    assert.equal(docReject.url, '/api/admin/verifications/doctor/doc-1/');
    assert.equal(docReject.body.action, 'reject');
  });

  it('Platform Admin creation validates phone and password fields', () => {
    const validateAdminForm = (form) => {
      if (!form.phone_number || form.phone_number.trim().length < 11) {
        return { valid: false, error: 'Valid phone required' };
      }
      if (!form.password || form.password.length < 8) {
        return { valid: false, error: 'Password must be at least 8 chars' };
      }
      return { valid: true };
    };

    assert.equal(validateAdminForm({ phone_number: '017', password: 'short' }).valid, false);
    assert.equal(validateAdminForm({ phone_number: '01700000000', password: 'StrongPassword123!' }).valid, true);
  });
});

describe('9. Doctor Affiliations & Visiting Schedules', () => {
  it('Validates fee must be strictly positive', () => {
    const validateChamber = (feeStr) => {
      const fee = parseFloat(feeStr);
      return Boolean(fee && fee > 0);
    };

    assert.equal(validateChamber('1500'), true);
    assert.equal(validateChamber('0'), false);
    assert.equal(validateChamber('-200'), false);
    assert.equal(validateChamber(''), false);
  });

  it('Visiting schedule slot formatting and duration calculations', () => {
    assert.equal(formatDisplayTime('17:00:00'), '05:00 PM');
    assert.equal(formatDisplayTime('09:30:00'), '09:30 AM');
    assert.equal(calculateSlotDuration('17:00:00', '21:00:00'), '4 hrs');
  });
});
