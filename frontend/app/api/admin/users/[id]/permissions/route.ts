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

    // In Next.js App Router, params is not a Promise, but we need to use it in an async context
    const userId = params.id;
    console.log(`API: Fetching permissions for user ${userId}`);
    
    // Initialize Supabase client with the correct pattern for Next.js 14
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', userId);
    
    if (rolesError) {
      console.error('API Error fetching user roles:', rolesError);
      return NextResponse.json({ error: 'Failed to fetch user roles' }, { status: 500 });
    }
    
    // If user has no roles, return empty array
    if (!userRoles || userRoles.length === 0) {
      console.log(`API: User ${userId} has no roles`);
      return NextResponse.json({ permissions: [] });
    }
    
    // Get role IDs
    const roleIds = userRoles.map(r => r.role_id);
    console.log(`API: User ${userId} has roles:`, roleIds);
    
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
    
    // Get permissions for these roles from role_permissions
    const { data: rolePermissions, error: permError } = await supabase
      .from('role_permissions')
      .select('permission_id, role_id')
      .in('role_id', roleIds);
    
    if (permError) {
      console.error('API Error fetching role permissions:', permError);
      return NextResponse.json({ error: 'Failed to fetch role permissions' }, { status: 500 });
    }
    
    // If no permissions found, return empty array
    if (!rolePermissions || rolePermissions.length === 0) {
      console.log(`API: No permissions found for roles ${roleIds.join(', ')}`);
      return NextResponse.json({ permissions: [] });
    }
    
    // Get unique permission IDs
    const permissionIds = [...new Set(rolePermissions.map(rp => rp.permission_id))];
    console.log(`API: Found ${permissionIds.length} unique permissions`);
    
    // Get permission details
    const { data: permissions, error: permDetailsError } = await supabase
      .from('permissions')
      .select('*')
      .in('id', permissionIds);
    
    if (permDetailsError) {
      console.error('API Error fetching permission details:', permDetailsError);
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
    
    return NextResponse.json({ permissions: transformedPermissions });
  } catch (error: any) {
    console.error('API Error in user permissions route:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = params.id;
    
    // Get request body
    const body = await request.json();
    const { permissions } = body;
    
    if (!Array.isArray(permissions)) {
      return NextResponse.json({ error: 'Permissions must be an array of IDs' }, { status: 400 });
    }
    
    console.log(`API: Updating permissions for user ${userId}`, permissions);
    
    // Initialize Supabase client with the correct pattern for Next.js 14
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Since we don't have a user_permissions table, we can't directly assign permissions to users
    // Instead, we would need to create a special role for this user and assign permissions to that role
    // For now, return a message explaining this
    return NextResponse.json({ 
      success: false, 
      message: 'Direct permission assignment is not supported. Permissions are assigned through roles.',
      permissions: permissions 
    }, { status: 400 });
  } catch (error: any) {
    console.error('API Error in user permissions route:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 