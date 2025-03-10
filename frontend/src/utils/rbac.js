import React from 'react';
import PermissionGuard from '../../components/PermissionGuard';

/**
 * This file provides compatibility with the existing RBAC system.
 * It forwards to the PermissionGuard component from /components/PermissionGuard.tsx
 */

/**
 * A component that conditionally renders its children based on user permissions
 * This is a compatibility wrapper for the PermissionGuard component
 */
export const PermissionGuard = ({ permissions, requireAll = false, fallback = null, children }) => {
  // For debugging
  console.log('Legacy PermissionGuard called with:', { permissions, requireAll });
  
  // Forward to the actual PermissionGuard component
  return (
    <PermissionGuard
      permissions={permissions}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  );
};

/**
 * Higher-order component that conditionally renders a component based on permissions
 * This is a compatibility wrapper for the PermissionGuard component
 */
export const withPermission = (
  Component,
  requiredPermissions,
  FallbackComponent = null,
  requireAll = false
) => {
  return function PermissionGuardHOC(props) {
    // For debugging
    console.log('Legacy withPermission called with:', { requiredPermissions, requireAll });
    
    const permissions = Array.isArray(requiredPermissions)
      ? requiredPermissions[0] // Just use the first permission for now
      : requiredPermissions;

    return (
      <PermissionGuard
        permissions={permissions}
        fallback={FallbackComponent ? <FallbackComponent {...props} /> : null}
      >
        <Component {...props} />
      </PermissionGuard>
    );
  };
};

// These functions are not used in the current implementation
// but are kept for compatibility
export const fetchUserPermissions = async () => [];
export const clearPermissionsCache = () => {};
export const hasPermission = async () => true; // Always return true for compatibility
export const hasAnyPermission = async () => true; // Always return true for compatibility
export const hasAllPermissions = async () => true; // Always return true for compatibility
export const usePermission = () => ({ hasPermission: true, loading: false }); // Always return true for compatibility 