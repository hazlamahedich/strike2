import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`API: Fetching role-based permissions for user ${params.id}`);
    
    // Initialize Supabase client with the correct pattern for Next.js 14
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // First, get the user's roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', params.id);
    
    if (rolesError) {
      console.error('API Error fetching user roles:', rolesError);
      return NextResponse.json({ error: 'Failed to fetch user roles' }, { status: 500 });
    }
    
    // If user has no roles, return empty array
    if (!userRoles || userRoles.length === 0) {
      return NextResponse.json({ permissions: [] });
    }
    
    const roleIds = userRoles.map(r => r.role_id);
    
    // Get role details to include in permission source
    const { data: roles } = await supabase
      .from('roles')
      .select('id, name')
      .in('id', roleIds);
    
    // Create a map of role IDs to role names
    const roleMap = new Map();
    if (roles) {
      roles.forEach(role => {
        roleMap.set(role.id, role.name);
      });
    }
    
    // Get permissions for these roles
    const { data: rolePermissions, error: permError } = await supabase
      .from('role_permissions')
      .select('permission_id, role_id')
      .in('role_id', roleIds);
    
    if (permError) {
      console.error('API Error fetching role permissions:', permError);
      return NextResponse.json({ error: 'Failed to fetch role permissions' }, { status: 500 });
    }
    
    // If no role permissions found, return empty array
    if (!rolePermissions || rolePermissions.length === 0) {
      return NextResponse.json({ permissions: [] });
    }
    
    // Get unique permission IDs
    const uniquePermissionIds = [...new Set(rolePermissions.map(p => p.permission_id))];
    
    // Get the full permission details
    const { data: permissions, error: detailsError } = await supabase
      .from('permissions')
      .select('*')
      .in('id', uniquePermissionIds);
    
    if (detailsError) {
      console.error('API Error fetching permission details:', detailsError);
      return NextResponse.json({ error: 'Failed to fetch permission details' }, { status: 500 });
    }
    
    // Transform permissions to match the expected format in the frontend
    // Map 'resource' to 'category' for compatibility with the UI
    const transformedPermissions = permissions?.map(permission => {
      // Find which roles grant this permission
      const sourceRoleIds = rolePermissions
        .filter(rp => rp.permission_id === permission.id)
        .map(rp => rp.role_id);
      
      // Get role names
      const sourceRoles = sourceRoleIds.map(roleId => roleMap.get(roleId) || `Role ${roleId}`);
      
      return {
        id: permission.id,
        name: permission.name,
        description: permission.description,
        category: permission.resource, // Map resource to category
        action: permission.action,
        sourceRole: sourceRoles.join(', ')
      };
    }) || [];
    
    // If no permissions table exists yet, return mock data for development
    if (permissions === null) {
      console.log('API: No permissions table found, returning mock data');
      
      // Mock data based on roles
      // For simplicity, we'll assume role 1 (Admin) has all permissions
      // Role 2 (Manager) has permissions 3, 5, 8-15
      // Role 3 (Agent) has permissions 8-11
      // Role 4 (Viewer) has permissions 1, 3, 8, 12, 16, 18
      
      let mockPermissions = [];
      
      if (roleIds.includes(1)) {
        // Admin role - all permissions
        mockPermissions = [
          { id: 1, name: 'View Dashboard', description: 'Access to view the main dashboard', category: 'Dashboard', action: 'read' },
          { id: 2, name: 'Edit Dashboard', description: 'Ability to customize dashboard widgets', category: 'Dashboard', action: 'write' },
          { id: 3, name: 'View Users', description: 'Can view user list', category: 'User Management', action: 'read' },
          { id: 4, name: 'Create Users', description: 'Can create new users', category: 'User Management', action: 'create' },
          { id: 5, name: 'Edit Users', description: 'Can edit existing users', category: 'User Management', action: 'update' },
          { id: 6, name: 'Delete Users', description: 'Can delete users', category: 'User Management', action: 'delete' },
          { id: 7, name: 'Manage Roles', description: 'Can create and edit roles', category: 'User Management', action: 'manage' },
          { id: 8, name: 'View Leads', description: 'Can view lead information', category: 'Leads', action: 'read' },
          { id: 9, name: 'Create Leads', description: 'Can create new leads', category: 'Leads', action: 'create' },
          { id: 10, name: 'Edit Leads', description: 'Can edit lead information', category: 'Leads', action: 'update' },
          { id: 11, name: 'Delete Leads', description: 'Can delete leads', category: 'Leads', action: 'delete' },
          { id: 12, name: 'View Campaigns', description: 'Can view campaign details', category: 'Campaigns', action: 'read' },
          { id: 13, name: 'Create Campaigns', description: 'Can create new campaigns', category: 'Campaigns', action: 'create' },
          { id: 14, name: 'Edit Campaigns', description: 'Can edit campaign details', category: 'Campaigns', action: 'update' },
          { id: 15, name: 'Delete Campaigns', description: 'Can delete campaigns', category: 'Campaigns', action: 'delete' },
          { id: 16, name: 'View Analytics', description: 'Can access analytics data', category: 'Analytics', action: 'read' },
          { id: 17, name: 'Export Analytics', description: 'Can export analytics reports', category: 'Analytics', action: 'export' },
          { id: 18, name: 'View Settings', description: 'Can view system settings', category: 'Settings', action: 'read' },
          { id: 19, name: 'Edit Settings', description: 'Can modify system settings', category: 'Settings', action: 'update' },
          { id: 20, name: 'Manage API Keys', description: 'Can create and revoke API keys', category: 'Settings', action: 'manage' },
        ];
      } else {
        // For other roles, build the permission list based on role IDs
        const permissionMap: Record<number, number[]> = {
          2: [3, 5, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18], // Manager
          3: [8, 9, 10, 11, 12], // Agent
          4: [1, 3, 8, 12, 16, 18], // Viewer
        };
        
        // Collect all permissions from the user's roles
        const allPermIds = roleIds.flatMap(roleId => permissionMap[roleId] || []);
        const uniquePermIds = [...new Set(allPermIds)];
        
        // Create mock permissions based on the IDs
        const allMockPerms = [
          { id: 1, name: 'View Dashboard', description: 'Access to view the main dashboard', category: 'Dashboard', action: 'read' },
          { id: 2, name: 'Edit Dashboard', description: 'Ability to customize dashboard widgets', category: 'Dashboard', action: 'write' },
          { id: 3, name: 'View Users', description: 'Can view user list', category: 'User Management', action: 'read' },
          { id: 4, name: 'Create Users', description: 'Can create new users', category: 'User Management', action: 'create' },
          { id: 5, name: 'Edit Users', description: 'Can edit existing users', category: 'User Management', action: 'update' },
          { id: 6, name: 'Delete Users', description: 'Can delete users', category: 'User Management', action: 'delete' },
          { id: 7, name: 'Manage Roles', description: 'Can create and edit roles', category: 'User Management', action: 'manage' },
          { id: 8, name: 'View Leads', description: 'Can view lead information', category: 'Leads', action: 'read' },
          { id: 9, name: 'Create Leads', description: 'Can create new leads', category: 'Leads', action: 'create' },
          { id: 10, name: 'Edit Leads', description: 'Can edit lead information', category: 'Leads', action: 'update' },
          { id: 11, name: 'Delete Leads', description: 'Can delete leads', category: 'Leads', action: 'delete' },
          { id: 12, name: 'View Campaigns', description: 'Can view campaign details', category: 'Campaigns', action: 'read' },
          { id: 13, name: 'Create Campaigns', description: 'Can create new campaigns', category: 'Campaigns', action: 'create' },
          { id: 14, name: 'Edit Campaigns', description: 'Can edit campaign details', category: 'Campaigns', action: 'update' },
          { id: 15, name: 'Delete Campaigns', description: 'Can delete campaigns', category: 'Campaigns', action: 'delete' },
          { id: 16, name: 'View Analytics', description: 'Can access analytics data', category: 'Analytics', action: 'read' },
          { id: 17, name: 'Export Analytics', description: 'Can export analytics reports', category: 'Analytics', action: 'export' },
          { id: 18, name: 'View Settings', description: 'Can view system settings', category: 'Settings', action: 'read' },
          { id: 19, name: 'Edit Settings', description: 'Can modify system settings', category: 'Settings', action: 'update' },
          { id: 20, name: 'Manage API Keys', description: 'Can create and revoke API keys', category: 'Settings', action: 'manage' },
        ];
        
        mockPermissions = allMockPerms.filter(p => uniquePermIds.includes(p.id));
      }
      
      return NextResponse.json({ permissions: mockPermissions });
    }
    
    return NextResponse.json({ permissions: transformedPermissions });
  } catch (error: any) {
    console.error('API Error in role permissions route:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 