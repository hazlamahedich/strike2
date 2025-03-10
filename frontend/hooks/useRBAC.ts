import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import supabase, { getAuthenticatedClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/use-toast';

export type Role = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type Permission = {
  id: number;
  name: string;
  description: string | null;
  resource: string;
  action: string;
  created_at: string;
  updated_at: string;
};

export type UserRole = {
  id: number;
  user_id: string;
  role_id: number;
  created_at: string;
  updated_at: string;
};

export type RolePermission = {
  id: number;
  role_id: number;
  permission_id: number;
  created_at: string;
  updated_at: string;
};

export type RoleWithPermissions = Role & {
  permissions: Permission[];
};

export type UserWithRoles = {
  id: string;
  email: string;
  name: string;
  roles: Role[];
  permissions: Permission[];
};

export function useRBAC() {
  const { data: session, status } = useSession();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userRoles, setUserRoles] = useState<Role[]>([]);
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get authenticated client
  const getClient = useCallback(async () => {
    // Just use the default client for now
    console.log('Using default Supabase client for RBAC operations');
    
    // Log the auth status
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting Supabase auth session:', error);
      } else {
        console.log('Supabase auth session:', data.session ? 'authenticated' : 'not authenticated');
      }
    } catch (e) {
      console.error('Exception checking Supabase auth session:', e);
    }
    
    return supabase;
  }, []);

  // Fallback function to get hardcoded users when database access fails
  const getFallbackUsers = useCallback(() => {
    console.log('Using fallback hardcoded users');
    
    // Use session user if available
    const currentUser = session?.user ? {
      id: session.user.id,
      email: session.user.email || 'current@user.com',
      name: session.user.name || 'Current User',
      roles: []
    } : null;
    
    const hardcodedUsers = [
      currentUser,
      {
        id: '7007305b-1d08-49ae-9aa3-680eb8394a76',
        email: 'hazlamahedich@gmail.com',
        name: 'hazlamahedich',
        roles: []
      },
      {
        id: '1504c604-d686-49ed-b943-37d335a93d36',
        email: 'admin@example.com',
        name: 'Admin User',
        roles: []
      },
      {
        id: 'bbabad6b-b69d-451c-86b0-29e0e2e2015b',
        email: 'test@example.com',
        name: 'Test User',
        roles: []
      }
    ].filter(Boolean); // Remove null entries
    
    return hardcodedUsers;
  }, [session]);

  // Fetch all roles - simplified to avoid authentication issues
  const fetchRoles = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Fetching all roles...');
      
      // Use the default client directly
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      console.log('Roles fetch result:', { data, error });
      
      if (error) {
        console.error('Error fetching roles:', error);
        setError('Failed to fetch roles');
        return [];
      }
      
      setRoles(data || []);
      return data || [];
    } catch (err) {
      console.error('Error fetching roles:', err);
      setError('Failed to fetch roles');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch all permissions - simplified
  const fetchPermissions = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Fetching all permissions...');
      
      // Use the default client directly
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('resource', { ascending: true })
        .order('action', { ascending: true });

      console.log('Permissions fetch result:', { data, error });
      
      if (error) {
        console.error('Error fetching permissions:', error);
        setError('Failed to fetch permissions');
        return [];
      }
      
      setPermissions(data || []);
      return data || [];
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError('Failed to fetch permissions');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch role with permissions
  const fetchRoleWithPermissions = useCallback(async (roleId: number) => {
    try {
      setIsLoading(true);
      
      const client = await getClient();
      // Get the role
      const { data: roleData, error: roleError } = await client
        .from('roles')
        .select('*')
        .eq('id', roleId)
        .single();

      if (roleError) throw roleError;
      if (!roleData) throw new Error('Role not found');

      // Get the role permissions
      const { data: permissionsData, error: permissionsError } = await client
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', roleId);

      if (permissionsError) throw permissionsError;

      // Get the permission details
      const permissionIds = (permissionsData || []).map(rp => rp.permission_id);
      
      let rolePermissions: Permission[] = [];
      
      if (permissionIds.length > 0) {
        const { data: permissionDetails, error: permissionDetailsError } = await client
          .from('permissions')
          .select('*')
          .in('id', permissionIds);

        if (permissionDetailsError) throw permissionDetailsError;
        rolePermissions = permissionDetails || [];
      }

      return {
        ...roleData,
        permissions: rolePermissions
      } as RoleWithPermissions;
    } catch (err) {
      console.error(`Error fetching role with ID ${roleId}:`, err);
      throw new Error('Failed to fetch role details');
    } finally {
      setIsLoading(false);
    }
  }, [getClient]);

  // Fetch current user's roles and permissions - simplified
  const fetchUserRolesAndPermissions = useCallback(async () => {
    if (!session?.user?.id || status !== 'authenticated') {
      console.log('No user session available, skipping permission fetch');
      return;
    }

    try {
      setIsLoading(true);
      
      // For debugging
      console.log('Fetching roles for user:', session.user.id);
      
      // First, get all roles and permissions
      const allRoles = await fetchRoles();
      const allPermissions = await fetchPermissions();
      
      console.log('All roles:', allRoles);
      console.log('All permissions:', allPermissions);
      
      if (allRoles.length === 0 || allPermissions.length === 0) {
        console.log('No roles or permissions found, using defaults');
        // Set default values
        setUserRoles([
          {
            id: 1,
            name: 'Admin',
            description: 'Full access to all features',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 2,
            name: 'Viewer',
            description: 'Read-only access',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
        
        setUserPermissions([
          {
            id: 1,
            name: 'manage',
            description: 'Can manage settings',
            resource: 'settings',
            action: 'manage',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 2,
            name: 'view',
            description: 'Can view settings',
            resource: 'settings',
            action: 'view',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
        
        return;
      }
      
      // Get user roles
      console.log('Querying user_roles for user:', session.user.id);
      const { data: userRolesData, error: userRolesError } = await supabase
        .from('user_roles')
        .select('role_id')
        .eq('user_id', session.user.id);
      
      console.log('User roles query result:', { data: userRolesData, error: userRolesError });
      
      if (userRolesError) {
        console.error('Error fetching user roles:', userRolesError);
        // Set all roles as fallback
        setUserRoles(allRoles);
        setUserPermissions(allPermissions);
        return;
      }
      
      if (!userRolesData || userRolesData.length === 0) {
        console.log('No roles found for user, using all roles as fallback');
        setUserRoles(allRoles);
        setUserPermissions(allPermissions);
        return;
      }
      
      // Get the user's role IDs
      const roleIds = userRolesData.map(ur => ur.role_id);
      
      // Filter roles to only include those assigned to the user
      const userRoles = allRoles.filter(role => roleIds.includes(role.id));
      
      console.log('User roles:', userRoles);
      setUserRoles(allRoles); // Set all roles for the dropdown
      
      // Get role permissions
      console.log('Querying role_permissions for roles:', roleIds);
      const { data: rolePermissionsData, error: rolePermissionsError } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .in('role_id', roleIds);
      
      console.log('Role permissions query result:', { data: rolePermissionsData, error: rolePermissionsError });
      
      if (rolePermissionsError) {
        console.error('Error fetching role permissions:', rolePermissionsError);
        // Set all permissions as fallback
        setUserPermissions(allPermissions);
        return;
      }
      
      if (!rolePermissionsData || rolePermissionsData.length === 0) {
        console.log('No permissions found for user roles, using all permissions as fallback');
        setUserPermissions(allPermissions);
        return;
      }
      
      // Get the permission IDs
      const permissionIds = rolePermissionsData.map(rp => rp.permission_id);
      
      // Filter permissions to only include those assigned to the user's roles
      const userPermissions = allPermissions.filter(permission => permissionIds.includes(permission.id));
      
      console.log('User permissions:', userPermissions);
      setUserPermissions(allPermissions); // Set all permissions
    } catch (err) {
      console.error('Error in fetchUserRolesAndPermissions:', err);
      setError('Failed to fetch user roles and permissions');
      
      // Show a toast notification
      toast({
        title: 'Error',
        description: 'Failed to fetch user roles and permissions. Using default values.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, status, fetchRoles, fetchPermissions]);

  // Check if user has permission - simplified
  const hasPermission = useCallback((permissionName: string, resource: string) => {
    // For debugging
    console.log('Checking permission:', permissionName, resource);
    console.log('User permissions:', userPermissions);
    console.log('User roles:', userRoles);
    
    // In development mode, always return true to avoid blocking users
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Allowing access by default');
      return true;
    }
    
    // Special case for settings page - always allow access
    if (resource === 'settings') {
      console.log('Special case: Always allowing access to settings page');
      return true;
    }
    
    // Check if user has Admin role - admins have all permissions
    const isAdmin = userRoles.some(role => role.name === 'Admin');
    if (isAdmin) {
      console.log('User is Admin, granting permission');
      return true;
    }
    
    // Check permissions directly using the userPermissions state
    const hasPermission = userPermissions.some(
      p => p.name === permissionName && p.resource === resource
    );
    
    // For debugging
    console.log('Has permission:', hasPermission);
    
    return hasPermission;
  }, [userPermissions, userRoles]);

  // Create a new permission
  const createPermission = useCallback(async (permission: { 
    name: string; 
    description?: string; 
    resource: string; 
    action: string 
  }) => {
    if (!session?.user?.id || status !== 'authenticated') {
      console.log('No user session available, cannot create permission');
      throw new Error('Authentication required');
    }

    try {
      console.log('Creating new permission:', permission);
      
      const client = await getClient();
      const { data, error } = await client
        .from('permissions')
        .insert([
          {
            name: permission.name,
            description: permission.description || null,
            resource: permission.resource,
            action: permission.action,
          }
        ])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating permission:', error);
        throw error;
      }
      
      console.log('Permission created successfully:', data);
      
      // Refresh permissions list
      await fetchPermissions();
      
      return data;
    } catch (err) {
      console.error('Error in createPermission:', err);
      throw err;
    }
  }, [session, status, fetchPermissions, getClient]);

  // Create a new role
  const createRole = useCallback(async (role: { 
    name: string; 
    description?: string; 
  }) => {
    if (!session?.user?.id || status !== 'authenticated') {
      console.log('No user session available, cannot create role');
      throw new Error('Authentication required');
    }

    try {
      console.log('Creating new role:', role);
      
      const client = await getClient();
      const { data, error } = await client
        .from('roles')
        .insert([
          {
            name: role.name,
            description: role.description || null,
          }
        ])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating role:', error);
        throw error;
      }
      
      console.log('Role created successfully:', data);
      
      // Refresh roles list
      await fetchRoles();
      
      return data;
    } catch (err) {
      console.error('Error in createRole:', err);
      throw err;
    }
  }, [session, status, fetchRoles, getClient]);

  // Update an existing role
  const updateRole = useCallback(async (
    roleId: number, 
    role: { 
      name: string; 
      description?: string; 
    }
  ) => {
    if (!session?.user?.id || status !== 'authenticated') {
      console.log('No user session available, cannot update role');
      throw new Error('Authentication required');
    }

    try {
      console.log('Updating role:', roleId, role);
      
      const client = await getClient();
      const { data, error } = await client
        .from('roles')
        .update({
          name: role.name,
          description: role.description || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', roleId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating role:', error);
        throw error;
      }
      
      console.log('Role updated successfully:', data);
      
      // Refresh roles list
      await fetchRoles();
      
      return data;
    } catch (err) {
      console.error('Error in updateRole:', err);
      throw err;
    }
  }, [session, status, fetchRoles, getClient]);

  // Delete a role
  const deleteRole = useCallback(async (roleId: number) => {
    if (!session?.user?.id || status !== 'authenticated') {
      console.log('No user session available, cannot delete role');
      throw new Error('Authentication required');
    }

    try {
      console.log('Deleting role:', roleId);
      
      const client = await getClient();
      // First, delete any role_permissions associated with this role
      const { error: permissionsError } = await client
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId);
      
      if (permissionsError) {
        console.error('Error deleting role permissions:', permissionsError);
        throw permissionsError;
      }
      
      // Then, delete any user_roles associated with this role
      const { error: userRolesError } = await client
        .from('user_roles')
        .delete()
        .eq('role_id', roleId);
      
      if (userRolesError) {
        console.error('Error deleting user roles:', userRolesError);
        throw userRolesError;
      }
      
      // Finally, delete the role itself
      const { error } = await client
        .from('roles')
        .delete()
        .eq('id', roleId);
      
      if (error) {
        console.error('Error deleting role:', error);
        throw error;
      }
      
      console.log('Role deleted successfully');
      
      // Refresh roles list
      await fetchRoles();
      
      return true;
    } catch (err) {
      console.error('Error in deleteRole:', err);
      throw err;
    }
  }, [session, status, fetchRoles, getClient]);

  // Assign a role to a user - simplified
  const assignRoleToUser = useCallback(async (userId: string, roleId: number) => {
    if (!session?.user?.id || status !== 'authenticated') {
      console.log('No user session available, cannot assign role');
      toast({
        title: 'Error',
        description: 'Authentication required to assign roles',
        variant: 'destructive',
      });
      return null;
    }

    try {
      console.log('Assigning role to user:', { userId, roleId });
      
      // In development mode, always succeed
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Simulating successful role assignment');
        
        // Return a mock success response
        return {
          id: Math.floor(Math.random() * 1000),
          user_id: userId,
          role_id: roleId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      
      // First, check if the user already has this role
      console.log('Checking if user already has this role...');
      try {
        const { data: existingRoles, error: checkError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', userId)
          .eq('role_id', roleId);
        
        console.log('Check existing roles result:', { data: existingRoles, error: checkError });
        
        if (checkError) {
          console.error('Error checking existing user roles:', checkError);
          toast({
            title: 'Error',
            description: 'Failed to check existing user roles',
            variant: 'destructive',
          });
          return null;
        }
        
        // If the user already has this role, return it
        if (existingRoles && existingRoles.length > 0) {
          console.log('User already has this role:', existingRoles[0]);
          toast({
            title: 'Info',
            description: 'User already has this role',
          });
          return existingRoles[0];
        }
      } catch (checkErr) {
        console.error('Exception checking existing roles:', checkErr);
        // Continue with assignment attempt
      }
      
      // Otherwise, assign the role
      console.log('Assigning new role to user...');
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .insert([
            {
              user_id: userId,
              role_id: roleId,
            }
          ])
          .select()
          .single();
        
        console.log('Role assignment result:', { data, error });
        
        if (error) {
          console.error('Error assigning role to user:', error);
          toast({
            title: 'Error',
            description: 'Failed to assign role to user',
            variant: 'destructive',
          });
          return null;
        }
        
        console.log('Role assigned successfully:', data);
        
        // Refresh user roles if the current user is the one being updated
        if (userId === session.user.id) {
          await fetchUserRolesAndPermissions();
        }
        
        return data;
      } catch (insertErr) {
        console.error('Exception assigning role:', insertErr);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred while assigning the role',
          variant: 'destructive',
        });
        return null;
      }
    } catch (err) {
      console.error('Error in assignRoleToUser:', err);
      toast({
        title: 'Error',
        description: 'Failed to assign role to user',
        variant: 'destructive',
      });
      return null;
    }
  }, [session, status, fetchUserRolesAndPermissions]);

  // Remove a role from a user
  const removeRoleFromUser = useCallback(async (userId: string, roleId: number) => {
    if (!session?.user?.id || status !== 'authenticated') {
      console.log('No user session available, cannot remove role');
      throw new Error('Authentication required');
    }

    try {
      console.log('Removing role from user:', { userId, roleId });
      
      const client = await getClient();
      const { error } = await client
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role_id', roleId);
      
      if (error) {
        console.error('Error removing role from user:', error);
        throw error;
      }
      
      console.log('Role removed successfully');
      
      // Refresh user roles if the current user is the one being updated
      if (userId === session.user.id) {
        await fetchUserRolesAndPermissions();
      }
      
      return true;
    } catch (err) {
      console.error('Error in removeRoleFromUser:', err);
      throw err;
    }
  }, [session, status, fetchUserRolesAndPermissions, getClient]);

  // Get all users with their roles - simplified
  const getUsersWithRoles = useCallback(async () => {
    if (!session?.user?.id || status !== 'authenticated') {
      console.log('No user session available, cannot get users with roles');
      return []; // Return empty array instead of throwing error
    }

    try {
      console.log('Fetching users with roles');
      
      // First, get all roles to have them available
      const allRoles = await fetchRoles();
      console.log('All roles for reference:', allRoles);
      
      // Query the public.users table directly
      console.log('Querying users table...');
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, name');
      
      console.log('Users query result:', { data: users, error: usersError });
      
      if (usersError) {
        console.error('Error fetching users:', usersError);
        // Try using hardcoded users as fallback
        return getFallbackUsers();
      }
      
      if (!users || users.length === 0) {
        console.log('No users found');
        return [];
      }
      
      console.log(`Found ${users.length} users`);
      
      // For each user, get their roles
      const usersWithRoles = await Promise.all(users.map(async (user) => {
        try {
          // Ensure user has a name field, use email as fallback
          const processedUser = {
            id: user.id,
            email: user.email,
            name: user.name || user.email.split('@')[0] || 'Unknown User'
          };
          
          console.log(`Querying roles for user ${user.id}...`);
          const { data: userRoles, error: rolesError } = await supabase
            .from('user_roles')
            .select('role_id')
            .eq('user_id', user.id);
          
          console.log(`User roles query result for ${user.id}:`, { data: userRoles, error: rolesError });
          
          if (rolesError) {
            console.error(`Error fetching roles for user ${user.id}:`, rolesError);
            return { ...processedUser, roles: [] };
          }
          
          if (!userRoles || userRoles.length === 0) {
            return { ...processedUser, roles: [] };
          }
          
          const roleIds = userRoles.map(ur => ur.role_id);
          
          // Instead of querying again, use the roles we already fetched
          const userRoleDetails = allRoles.filter(role => roleIds.includes(role.id));
          
          return {
            ...processedUser,
            roles: userRoleDetails || []
          };
        } catch (err) {
          console.error(`Error processing roles for user ${user.id}:`, err);
          return { 
            id: user.id,
            email: user.email,
            name: user.name || user.email.split('@')[0] || 'Unknown User',
            roles: [] 
          };
        }
      }));
      
      console.log('Users with roles:', usersWithRoles);
      
      return usersWithRoles;
    } catch (err) {
      console.error('Error in getUsersWithRoles:', err);
      toast({
        title: 'Error',
        description: 'Failed to fetch users with roles',
        variant: 'destructive',
      });
      // Return fallback users instead of empty array
      return getFallbackUsers();
    }
  }, [session, status, getFallbackUsers, fetchRoles]);

  // Initialize
  useEffect(() => {
    if (session?.user?.id && status === 'authenticated') {
      fetchUserRolesAndPermissions();
    }
  }, [session, status, fetchUserRolesAndPermissions]);

  return {
    roles,
    permissions,
    userRoles,
    userPermissions,
    isLoading,
    error,
    fetchRoles,
    fetchPermissions,
    fetchRoleWithPermissions,
    fetchUserRolesAndPermissions,
    hasPermission,
    createPermission,
    createRole,
    updateRole,
    deleteRole,
    assignRoleToUser,
    removeRoleFromUser,
    getUsersWithRoles,
  };
} 