import { 
  LayoutDashboard, ShieldCheck, Building2, FlaskConical, Stethoscope, 
  TestTube, Calculator, Calendar, Users, List, Activity, Settings
} from 'lucide-react';

export const navConfig = {
  super_admin: [
    {
      group: 'DASHBOARD',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard }
      ]
    },
    {
      group: 'VERIFICATION',
      items: [
        { id: 'verification-queue', label: 'Verification Queue', icon: ShieldCheck }
      ]
    },
    {
      group: 'DIRECTORY (super admin)',
      items: [
        { id: 'hospitals', label: 'Hospitals', icon: Building2 },
        { id: 'diagnostics', label: 'Diagnostic Centers', icon: FlaskConical },
        { id: 'doctors', label: 'Doctors', icon: Stethoscope }
      ]
    },
    {
      group: 'CATALOG / TAXONOMY (super admin)',
      items: [
        { id: 'doctor-specs', label: 'Doctor Specialties', icon: Stethoscope },
        { id: 'hospital-specs', label: 'Hospital Categories', icon: Building2 },
        { id: 'diag-cats', label: 'Diagnostic Categories', icon: FlaskConical },
        { id: 'hosp-services', label: 'Hospital Services', icon: Activity },
        { id: 'diag-services', label: 'Diagnostic Services', icon: Activity },
        { id: 'tests', label: 'Tests (master)', icon: TestTube },
        { id: 'test-cats', label: 'Test Categories', icon: TestTube }
      ]
    },
    {
      group: 'OFFERINGS',
      items: [
        { id: 'branch-tests', label: 'Offered Tests', icon: Calculator },
        { id: 'add-tests-to-diagnostics', label: 'Add Tests to Facility', icon: List }
      ]
    },
    {
      group: 'BOOKINGS',
      items: [
        { id: 'doc-bookings', label: 'Doctor Appointments', icon: Calendar },
        { id: 'lab-bookings', label: 'Lab Bookings', icon: Calendar }
      ]
    },
    {
      group: 'ACCESS CONTROL',
      items: [
        { id: 'platform-admins', label: 'Platform Admins', icon: Settings },
        { id: 'staff', label: 'Team & Staff', icon: Users }
      ]
    }
  ],
  hospital_admin: [
    {
      group: 'DASHBOARD',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard }
      ]
    },
    {
      group: 'MY FACILITY / MY PROFILE',
      items: [
        { id: 'hospitals', label: 'Hospital Profile', icon: Building2 }
      ]
    },
    {
      group: 'OFFERINGS',
      items: [
        { id: 'branch-tests', label: 'Offered Tests', icon: Calculator, requiredFlags: ['has_diagnostic_center'] },
        { id: 'add-tests-to-diagnostics', label: 'Add Tests to Facility', icon: List, requiredFlags: ['has_diagnostic_center'] },
        { id: 'doctors', label: 'Affiliated Doctors', icon: Stethoscope }
      ]
    },
    {
      group: 'BOOKINGS',
      items: [
        { id: 'doc-bookings', label: 'Doctor Appointments', icon: Calendar },
        { id: 'lab-bookings', label: 'Lab Bookings', icon: Calendar, requiredFlags: ['has_diagnostic_center'] }
      ]
    },
    {
      group: 'ACCESS CONTROL',
      items: [
        { id: 'staff', label: 'Team & Staff', icon: Users }
      ]
    }
  ],
  diagnostic_admin: [
    {
      group: 'DASHBOARD',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard }
      ]
    },
    {
      group: 'MY FACILITY / MY PROFILE',
      items: [
        { id: 'diagnostics', label: 'Diagnostic Center Profile', icon: FlaskConical }
      ]
    },
    {
      group: 'OFFERINGS',
      items: [
        { id: 'branch-tests', label: 'Offered Tests', icon: Calculator },
        { id: 'add-tests-to-diagnostics', label: 'Add Tests', icon: List }
      ]
    },
    {
      group: 'BOOKINGS',
      items: [
        { id: 'lab-bookings', label: 'Lab Bookings', icon: Calendar }
      ]
    },
    {
      group: 'ACCESS CONTROL',
      items: [
        { id: 'staff', label: 'Team & Staff', icon: Users }
      ]
    }
  ],
  doctor: [
    {
      group: 'DASHBOARD',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard }
      ]
    },
    {
      group: 'MY PROFILE',
      items: [
        { id: 'doctors', label: 'Doctor Profile', icon: Stethoscope },
        { id: 'doc-affiliations', label: 'Chambers & Fees', icon: Building2 },
        { id: 'doc-schedules', label: 'Visiting Schedules', icon: Calendar }
      ]
    },
    {
      group: 'BOOKINGS',
      items: [
        { id: 'doc-bookings', label: 'Appointments', icon: Calendar }
      ]
    }
  ],
  staff: [
    {
      group: 'DASHBOARD',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard }
      ]
    },
    {
      group: 'OFFERINGS',
      items: [
        { id: 'branch-tests', label: 'Offered Tests', icon: Calculator, requiredFlags: ['has_diagnostic_center_or_diag'] },
        { id: 'doctors', label: 'Affiliated Doctors', icon: Stethoscope, requiredFlags: ['is_hospital'] }
      ]
    },
    {
      group: 'BOOKINGS',
      items: [
        { id: 'doc-bookings', label: 'Doctor Appointments', icon: Calendar, requiredFlags: ['is_hospital'] },
        { id: 'lab-bookings', label: 'Lab Bookings', icon: Calendar, requiredFlags: ['has_diagnostic_center_or_diag'] }
      ]
    }
  ]
};
