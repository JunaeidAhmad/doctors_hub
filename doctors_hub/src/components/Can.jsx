import React, { useMemo } from 'react';
import { getCurrentPermissions, getCurrentUser } from '../services/api/auth';

/**
 * Renders its children only if the current user has the required permission or scope.
 * 
 * @param {string} requiredModule - e.g., 'doctors', 'hospitals', 'roles', 'users'
 * @param {string} requiredAction - e.g., 'view', 'create', 'edit', 'delete'
 * @param {boolean} checkScopeOnly - If true, just checks if a specific scope is in `scopes` array
 * @param {string} scope - Required scope if checkScopeOnly is true ('global', 'facility', 'self')
 * @param {React.ReactNode} fallback - What to render if permission is denied (default: null)
 */
export default function Can({
  requiredModule,
  requiredAction,
  checkScopeOnly = false,
  scope = 'global',
  fallback = null,
  children
}) {
  const isAllowed = useMemo(() => {
    try {
      const user = getCurrentUser();
      if (user?.is_superuser || user?.is_super_admin || user?.role === 'super_admin') {
        return true;
      }

      const permissionsData = getCurrentPermissions();
      if (!permissionsData) {
        // If permissions data is not yet loaded in localStorage, fallback to true if superuser
        return Boolean(user?.is_superuser || user?.is_staff);
      }

      if (permissionsData.is_super_admin) {
        return true;
      }

      const scopes = Array.isArray(permissionsData.scopes) ? permissionsData.scopes : [];
      if (checkScopeOnly) {
        return scopes.includes(scope);
      }

      if (scopes.includes('global')) {
        return true;
      }

      // Check module and action
      const permKey = `${requiredModule}.${requiredAction}`;
      const perms = permissionsData.permissions;

      if (!perms) return false;

      if (Array.isArray(perms)) {
        return perms.some(p => p.module === requiredModule && p.action === requiredAction);
      } else if (typeof perms === 'object') {
        return Boolean(perms[permKey]);
      }

      return false;
    } catch (e) {
      console.warn("Can permission evaluation warning:", e);
      return true; // fail open for UI rendering rather than crashing the page
    }
  }, [requiredModule, requiredAction, checkScopeOnly, scope]);

  if (!isAllowed) {
    return fallback;
  }

  return children;
}
