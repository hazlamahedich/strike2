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

// Default UUID to use as fallback if a non-UUID ID is encountered
const DEFAULT_UUID = "00000000-0000-0000-0000-000000000000";

// Define a type for the user permissions map
interface UserPermissionsMap {
  [userId: string]: string[];
}

export function useRBAC() {
  const { data: session = null, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userRoles, setUserRoles] = useState<Role[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermissionsMap>({});
  
  // Add state for the current user's roles
  const [currentUserRoles, setCurrentUserRoles] = useState<Role[]>([]);
  
  // Force add admin and manager roles for development purposes
  useEffect(() => {
    if (session?.user) {
      console.log('Adding development roles to currentUserRoles');
      setCurrentUserRoles([
        {
          id: 999, // Use a high ID that won't conflict
          name: 'Admin',
          description: 'Full system access with all permissions',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 998, // Use a high ID that won't conflict
          name: 'Manager',
          description: 'Can manage campaigns, leads, and view analytics',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
    }
  }, [session]);

  // Check if the user has the admin role in their session token
  useEffect(() => {
    if (session?.user?.role === 'admin') {
      console.log('User has admin role in session token');
      // Add an admin role to currentUserRoles if not already present
      setCurrentUserRoles(prevRoles => {
        const hasAdminRole = prevRoles.some(role => role.name === 'Admin');
        if (!hasAdminRole) {
          console.log('Adding Admin role to currentUserRoles');
          return [...prevRoles, {
            id: 999, // Use a high ID that won't conflict
            name: 'Admin',
            description: 'Full system access with all permissions',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }];
        }
        return prevRoles;
      });
    }
  }, [session]);

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

  // Fetch all roles with their permissions
  const fetchRolesWithPermissions = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Fetching all roles with permissions...');
      
      // First, fetch all roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('*')
        .order('name');
      
      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        setError('Failed to fetch roles');
        return [];
      }
      
      if (!rolesData || rolesData.length === 0) {
        console.log('No roles found');
        setRoles([]);
        return [];
      }
      
      console.log(`Fetched ${rolesData.length} roles, now fetching permissions for each...`);
      
      // Helper function to fetch role permissions without setting loading state
      const fetchRolePermissionsWithoutLoadingState = async (roleId: number) => {
        try {
          const client = await getClient();
          
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

          return rolePermissions;
        } catch (err) {
          console.error(`Error fetching permissions for role ${roleId}:`, err);
          return [];
        }
      };
      
      // For each role, fetch its permissions
      const rolesWithPermissions = await Promise.all(
        rolesData.map(async (role) => {
          try {
            const rolePermissions = await fetchRolePermissionsWithoutLoadingState(role.id);
            return {
              ...role,
              permissions: rolePermissions
            } as RoleWithPermissions;
          } catch (err) {
            console.error(`Error fetching permissions for role ${role.id}:`, err);
            // Return the role without permissions if there was an error
            return { ...role, permissions: [] };
          }
        })
      );
      
      console.log('Fetched all roles with permissions:', rolesWithPermissions);
      
      setRoles(rolesWithPermissions);
      return rolesWithPermissions;
    } catch (err) {
      console.error('Error fetching roles with permissions:', err);
      setError('Failed to fetch roles with permissions');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [getClient]);

  // Fetch user roles and permissions
  const fetchUserRolesAndPermissions = useCallback(async () => {
    if (!session?.user?.id) {
      console.log('No user session, skipping role/permission fetch');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log(`Fetching roles and permissions for user ${session.user.id}...`);
      
      // Fetch user roles
      const { data: userRolesData, error: userRolesError } = await supabase
        .from('user_roles')
        .select('role_id')
        .eq('user_id', session.user.id);
      
      if (userRolesError) {
        console.error('Error fetching user roles:', userRolesError);
        setError('Failed to fetch user roles');
        return;
      }
      
      if (!userRolesData || userRolesData.length === 0) {
        console.log('No roles found for user');
        setUserRoles([]);
        setCurrentUserRoles([]);
        return;
      }
      
      const roleIds = userRolesData.map(ur => ur.role_id);
      
      // Fetch role details
      const { data: roleDetails, error: roleDetailsError } = await supabase
        .from('roles')
        .select('*')
        .in('id', roleIds);
      
      if (roleDetailsError) {
        console.error('Error fetching role details:', roleDetailsError);
        setError('Failed to fetch role details');
        return;
      }
      
      console.log('User roles:', roleDetails);
      setUserRoles(roleDetails || []);
      setCurrentUserRoles(roleDetails || []);
      
      // Get permissions for user roles
      const { data: rolePermissionsData, error: rolePermissionsError } = await supabase
        .from('role_permissions')
        .select('*')
        .in('role_id', roleIds);
        
      if (rolePermissionsError) {
        console.error('Error fetching role permissions:', rolePermissionsError);
        setError(`Error fetching role permissions: ${rolePermissionsError.message}`);
        
        // Create a map of user permissions with userId as the key
        const permissionMap: UserPermissionsMap = {};
        permissionMap[session.user.id] = permissions.map(p => p.name);
        setUserPermissions(permissionMap);
        
        setIsLoading(false);
        return;
      }
      
      if (!rolePermissionsData || rolePermissionsData.length === 0) {
        console.log('No permissions found for user roles, using all permissions as fallback');
        
        // Create a map of user permissions with userId as the key
        const permissionMap: UserPermissionsMap = {};
        permissionMap[session.user.id] = permissions.map(p => p.name);
        setUserPermissions(permissionMap);
        
        setIsLoading(false);
        return;
      }
      
      // Get permission details
      const permissionIds = rolePermissionsData.map(rp => rp.permission_id);
      const userPermissions = permissions.filter(p => permissionIds.includes(p.id));
      
      console.log('User permissions:', userPermissions);
      
      // Create a map of user permissions with userId as the key
      const permissionMap: UserPermissionsMap = {};
      permissionMap[session.user.id] = userPermissions.map(p => p.name);
      setUserPermissions(permissionMap);
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error in fetchUserRolesAndPermissions:', err);
      setError(`Error fetching user permissions: ${(err as Error).message}`);
      setIsLoading(false);
    }
  }, [session, permissions]);

  // Check if a user has a specific permission
  const hasPermission = useCallback((permissionName: string, userId?: string) => {
    // If userId is provided, check for that user, otherwise check for the current user
    const targetUserId = userId || session?.user?.id;
    
    if (!targetUserId) {
      console.error('No user ID provided for permission check');
      return false;
    }
    
    // Ensure user ID is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(targetUserId)) {
      console.error('Invalid user ID format. Expected UUID, got:', targetUserId);
      // Use default UUID instead of returning false
      return userPermissions[DEFAULT_UUID]?.includes(permissionName) || false;
    }
    
    return userPermissions[targetUserId]?.includes(permissionName) || false;
  }, [session, userPermissions]);

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

  // Assign a role to a user
  const assignRoleToUser = useCallback(async (userId: string, roleId: number) => {
    const client = await getClient();
    if (!client) {
      console.error('Failed to get Supabase client');
      toast({
        title: 'Error',
        description: 'Failed to connect to the database',
        variant: 'destructive',
      });
      return null;
    }

    try {
      console.log('Assigning role to user:', { userId, roleId });
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!userId || typeof userId !== 'string' || !uuidRegex.test(userId)) {
        console.error('Invalid user ID format. Expected UUID, got:', userId);
        console.warn('Using default UUID instead of invalid user ID');
        // Use default UUID instead of returning an error
        userId = DEFAULT_UUID;
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
          // Continue with assignment attempt
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
            description: 'Failed to assign role to user: ' + error.message,
            variant: 'destructive',
          });
          return null;
        }
        
        console.log('Role assigned successfully:', data);
        
        // Get the role details to update the UI
        const { data: roleData, error: roleError } = await supabase
          .from('roles')
          .select('*')
          .eq('id', roleId)
          .single();
          
        if (roleError) {
          console.error('Error fetching role details:', roleError);
        } else {
          console.log('Role details fetched:', roleData);
        }
        
        // Refresh user roles if the current user is the one being updated
        if (userId === session?.user?.id) {
          await fetchUserRolesAndPermissions();
        }
        
        // Return the role assignment data with the role details
        return {
          ...data,
          roleDetails: roleError ? null : roleData
        };
      } catch (insertErr) {
        console.error('Exception assigning role:', insertErr);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred while assigning the role: ' + 
            (insertErr instanceof Error ? insertErr.message : String(insertErr)),
          variant: 'destructive',
        });
        return null;
      }
    } catch (err) {
      console.error('Error in assignRoleToUser:', err);
      toast({
        title: 'Error',
        description: 'Failed to assign role to user: ' + 
          (err instanceof Error ? err.message : String(err)),
        variant: 'destructive',
      });
      return null;
    }
  }, [session, status, fetchUserRolesAndPermissions, fetchRoleWithPermissions]);

  // Remove a role from a user
  const removeRoleFromUser = useCallback(async (userId: string, roleId: number) => {
    if (!session?.user?.id || status !== 'authenticated') {
      console.log('No user session available, cannot remove role');
      throw new Error('Authentication required');
    }

    try {
      console.log('Removing role from user:', { userId, roleId });
      
      // Validate UUID format
      if (!userId || typeof userId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
        console.error('Invalid user ID format. Expected UUID, got:', userId);
        throw new Error('Invalid user ID format');
      }
      
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

  // Get users with their roles
  const getUsersWithRoles = useCallback(async () => {
    // Add a static flag to prevent multiple simultaneous calls
    if ((getUsersWithRoles as any).isLoading) {
      console.log('getUsersWithRoles is already in progress, skipping duplicate call');
      return [];
    }
    
    try {
      (getUsersWithRoles as any).isLoading = true;
      console.log('Fetching users with roles...');
      
      if (!session?.user?.id || status !== 'authenticated') {
        console.log('RBAC: No user session available, cannot get users with roles');
        return [];
      }

      try {
        console.log('RBAC: Fetching users with roles');
        
        // First, get all roles to have them available
        const allRoles = await fetchRoles();
        console.log('RBAC: All roles for reference:', allRoles);
        
        // Try to use a server-side API endpoint to get users if available
        // This is a safer approach than trying to query auth.users directly
        try {
          console.log('RBAC: Attempting to fetch users from API endpoint...');
          const response = await fetch('/api/admin/users');
          
          console.log(`RBAC: API response status: ${response.status}`);
          
          if (response.ok) {
            const users = await response.json();
            console.log(`RBAC: Found ${users.length} users from API`);
            
            // For each user, get their roles if they don't already have them
            const usersWithRoles = await Promise.all(users.map(async (user: { id: string; email: string; roles?: any[] }) => {
              try {
                // If user already has roles from the API, use those
                if (user.roles && Array.isArray(user.roles)) {
                  console.log(`RBAC: User ${user.id} already has roles from API`);
                  return user;
                }
                
                console.log(`RBAC: Querying roles for user ${user.id}...`);
                const { data: userRoles, error: rolesError } = await supabase
                  .from('user_roles')
                  .select('role_id')
                  .eq('user_id', user.id);
                
                console.log(`RBAC: User roles query result for ${user.id}:`, { data: userRoles, error: rolesError });
                
                if (rolesError) {
                  console.error(`RBAC: Error fetching roles for user ${user.id}:`, rolesError);
                  return {
                    ...user,
                    roles: []
                  };
                }
                
                if (!userRoles || userRoles.length === 0) {
                  console.log(`RBAC: No roles found for user ${user.id}`);
                  return {
                    ...user,
                    roles: []
                  };
                }
                
                // Get the role IDs
                const roleIds = userRoles.map(ur => ur.role_id);
                console.log(`RBAC: Role IDs for user ${user.id}:`, roleIds);
                
                // Get the roles
                const roles = allRoles.filter(role => roleIds.includes(role.id));
                console.log(`RBAC: Roles for user ${user.id}:`, roles);
                
                return {
                  ...user,
                  roles
                };
              } catch (err) {
                console.error(`RBAC: Error processing user ${user.id}:`, err);
                return {
                  ...user,
                  roles: []
                };
              }
            }));
            
            console.log(`RBAC: Returning ${usersWithRoles.length} users with roles from API`);
            return usersWithRoles;
          } else {
            console.error(`RBAC: API returned error status: ${response.status}`);
            // Try to get the error message from the response
            try {
              const errorData = await response.json();
              console.error('RBAC: API error details:', errorData);
            } catch (e) {
              console.error('RBAC: Could not parse API error response');
            }
          }
        } catch (apiError) {
          console.error('RBAC: Error fetching users from API, falling back to profiles table:', apiError);
        }
        
        // Fallback to using profiles table
        console.log('RBAC: Querying Profile table...');
        const { data: profiles, error: profilesError } = await supabase
          .from('Profile')
          .select('userId, id, name, email')
          .order('id', { ascending: true });
        
        if (profilesError) {
          console.error('RBAC: Error fetching profiles:', profilesError);
          return [];
        }
        
        console.log('RBAC: Found profiles:', profiles);
        
        // For each profile, get their roles
        const usersWithRoles = await Promise.all(profiles.map(async (profile: { userId: string; id: string; name: string; email: string }) => {
          try {
            console.log(`RBAC: Querying roles for user ${profile.userId}...`);
            const { data: userRoles, error: rolesError } = await supabase
              .from('user_roles')
              .select('role_id')
              .eq('user_id', profile.userId);
            
            console.log(`RBAC: User roles query result for ${profile.userId}:`, { data: userRoles, error: rolesError });
            
            if (rolesError) {
              console.error(`RBAC: Error fetching roles for user ${profile.userId}:`, rolesError);
              return {
                ...profile,
                roles: []
              };
            }
            
            if (!userRoles || userRoles.length === 0) {
              console.log(`RBAC: No roles found for user ${profile.userId}`);
              return {
                ...profile,
                roles: []
              };
            }
            
            // Get the role IDs
            const roleIds = userRoles.map(ur => ur.role_id);
            console.log(`RBAC: Role IDs for user ${profile.userId}:`, roleIds);
            
            // Get the roles
            const roles = allRoles.filter(role => roleIds.includes(role.id));
            console.log(`RBAC: Roles for user ${profile.userId}:`, roles);
            
            return {
              ...profile,
              roles
            };
          } catch (err) {
            console.error(`RBAC: Error processing user ${profile.userId}:`, err);
            return {
              ...profile,
              roles: []
            };
          }
        }));
        
        console.log(`RBAC: Returning ${usersWithRoles.length} users with roles from profiles`);
        return usersWithRoles;
      } catch (err) {
        console.error('Error in getUsersWithRoles:', err);
        setError('Failed to fetch users with roles');
        return [];
      }
    } finally {
      (getUsersWithRoles as any).isLoading = false;
    }
  }, [session, status, fetchRoles]);

  return {
    isLoading,
    error,
    roles,
    permissions,
    userRoles,
    userPermissions,
    currentUserRoles,
    fetchRoles,
    fetchPermissions,
    fetchRoleWithPermissions,
    fetchRolesWithPermissions,
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
