import * as core from './core';
import * as auth from './auth';
import * as hospitals from './hospitals';
import * as diagnosticCenters from './diagnosticCenters';
import * as doctors from './doctors';
import * as tests from './tests';
import * as bookings from './bookings';
import * as admin from './admin';
import * as roles from './roles';

export const api = {
  ...auth,
  ...hospitals,
  ...diagnosticCenters,
  ...doctors,
  ...tests,
  ...bookings,
  ...admin,
  ...roles,
};

export {
  BASE_URL,
  clearSession,
  refreshAccessToken,
  ensureArray,
  isPageReload,
  getIsInitialLoad,
  setInitialLoadComplete,
  clearCache,
  flattenFacility,
  handleResponse,
  getHeaders,
  fetchWithTimeout,
  fetchWithDeduplicationAndCache,
} from './core';

export * from './auth';
export * from './hospitals';
export * from './diagnosticCenters';
export * from './doctors';
export * from './tests';
export * from './bookings';
export * from './admin';
export * from './roles';

export default api;
