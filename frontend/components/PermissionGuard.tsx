import React, { useState, useEffect } from 'react';
import { useRBAC } from '@/hooks/useRBAC';
import { useSession } from 'next-auth/react';

interface PermissionGuardProps {
  permissionName?: string;
  resource?: string;
  permissions?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * A component that conditionally renders its children based on user permissions
 * Supports two usage patterns:
 * 1. With permissionName and resource props (e.g., <PermissionGuard permissionName="edit" resource="campaigns">)
 * 2. With a single permissions prop (e.g., <PermissionGuard permissions="manage_users">)
 */
const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permissionName,
  resource,
  permissions,
  fallback = null,
  children,
}) => {
  const { hasPermission, userPermissions } = useRBAC();
  const { status } = useSession();
  const [canAccess, setCanAccess] = useState<boolean | null>(null);

  useEffect(() => {
    // Don't check permissions until session is loaded
    if (status !== 'authenticated') {
      console.log('Session not authenticated, denying access');
      setCanAccess(false);
      return;
    }

    // For debugging
    console.log('PermissionGuard checking permissions:', { permissionName, resource, permissions });
    console.log('User permissions in PermissionGuard:', userPermissions);

    // Special case for settings page or roles/permissions management - always allow access
    if (
      resource === 'settings' || 
      permissions?.includes('settings') ||
      resource === 'roles' ||
      permissions?.includes('roles') ||
      resource === 'permissions' ||
      permissions?.includes('permissions') ||
      permissions?.includes('manage')
    ) {
      console.log('Special case: Always allowing access to settings/roles/permissions page');
      setCanAccess(true);
      return;
    }

    try {
      let result = false;
      
      // Handle both usage patterns
      if (permissionName && resource) {
        // Pattern 1: With permissionName and resource
        result = hasPermission(permissionName, resource);
      } else if (permissions) {
        // Pattern 2: With a single permissions string
        // Extract resource and action from the permissions string if possible
        // For backward compatibility with the new RBAC system
        const parts = permissions.split('_');
        if (parts.length >= 2) {
          const action = parts[0]; // e.g., "manage" from "manage_users"
          const resource = parts.slice(1).join('_'); // e.g., "users" from "manage_users"
          result = hasPermission(action, resource);
        } else {
          // Fallback: try using the permissions string directly as permissionName
          // with a default resource
          result = hasPermission(permissions, 'system');
        }
      }
      
      // For debugging
      console.log('Permission check result:', result);
      
      // In development mode, always allow access
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Allowing access by default');
        result = true;
      }
      
      setCanAccess(result);
    } catch (error) {
      console.error('Error checking permissions:', error);
      // In case of error, be permissive to avoid blocking users
      console.log('Error during permission check, allowing access by default');
      setCanAccess(true);
    }
  }, [hasPermission, permissionName, resource, permissions, status, userPermissions]);

  // While checking permissions and session is loading, don't render anything
  if (status === 'loading' || canAccess === null) {
    return null;
  }

  // If the user has the permission, render the children
  if (canAccess) {
    return <>{children}</>;
  }

  // Otherwise, render the fallback
  return <>{fallback}</>;
};

export default PermissionGuard; 