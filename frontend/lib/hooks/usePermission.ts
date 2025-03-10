import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import rbacClient from '../api/rbacClient';
import { Permission } from '../api/rbacClient';

/**
 * Hook for checking user permissions
 */
export const usePermission = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch permissions on mount
  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await rbacClient.getCurrentUserPermissions();
        
        if (response.error) {
          throw response.error;
        }
        
        setPermissions(response.data?.permissions || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching permissions:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch permissions'));
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user]);

  /**
   * Check if the user has a specific permission
   */
  const hasPermission = useCallback(
    (permissionName: string, resource: string): boolean => {
      // Admin users have all permissions
      if (user?.role === 'admin') {
        return true;
      }

      // Check if the user has the specific permission
      return permissions.some(
        (p) => p.name === permissionName && p.resource === resource
      );
    },
    [permissions, user]
  );

  /**
   * Check if the user has any of the specified permissions
   */
  const hasAnyPermission = useCallback(
    (permissionChecks: Array<{ name: string; resource: string }>): boolean => {
      // Admin users have all permissions
      if (user?.role === 'admin') {
        return true;
      }

      // Check if the user has any of the specified permissions
      return permissionChecks.some(({ name, resource }) =>
        hasPermission(name, resource)
      );
    },
    [hasPermission, user]
  );

  /**
   * Check if the user has all of the specified permissions
   */
  const hasAllPermissions = useCallback(
    (permissionChecks: Array<{ name: string; resource: string }>): boolean => {
      // Admin users have all permissions
      if (user?.role === 'admin') {
        return true;
      }

      // Check if the user has all of the specified permissions
      return permissionChecks.every(({ name, resource }) =>
        hasPermission(name, resource)
      );
    },
    [hasPermission, user]
  );

  return {
    permissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
};

export default usePermission; 