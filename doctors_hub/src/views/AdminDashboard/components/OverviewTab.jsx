import React from 'react';
import { useAdminContext } from '../context/AdminContext';
import SuperAdminOverview from './overview/SuperAdminOverview';
import FacilityAdminOverview from './overview/FacilityAdminOverview';
import DoctorOverview from './overview/DoctorOverview';

export default function OverviewTab() {
  const { isDoctor, isFacilityAdmin } = useAdminContext();

  if (isDoctor) {
    return <DoctorOverview />;
  }

  if (isFacilityAdmin) {
    return <FacilityAdminOverview />;
  }

  return <SuperAdminOverview />;
}
