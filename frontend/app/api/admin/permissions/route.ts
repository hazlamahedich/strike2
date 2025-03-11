import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('API: Fetching all permissions');
    
    // Initialize Supabase client with the correct pattern for Next.js 14
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Query the permissions table
    const { data: permissions, error } = await supabase
      .from('permissions')
      .select('*')
      .order('resource', { ascending: true })
      .order('name', { ascending: true });
    
    if (error) {
      console.error('API Error fetching permissions:', error);
      return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
    }
    
    // Transform the data to match the expected format in the frontend
    // Map 'resource' to 'category' for compatibility with the UI
    const transformedPermissions = permissions?.map(permission => ({
      id: permission.id,
      name: permission.name,
      description: permission.description,
      category: permission.resource, // Map resource to category
      action: permission.action,     // Keep action for additional context
      created_at: permission.created_at,
      updated_at: permission.updated_at
    })) || [];
    
    // If no permissions exist yet, return mock data for development
    if (!permissions || permissions.length === 0) {
      console.log('API: No permissions found, returning mock data');
      
      const mockPermissions = [
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
      
      return NextResponse.json({ permissions: mockPermissions });
    }
    
    return NextResponse.json({ permissions: transformedPermissions });
  } catch (error: any) {
    console.error('API Error in permissions route:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const body = await request.json();
    const { name, description, category, action } = body;
    
    // Validate required fields
    if (!name || !category) {
      return NextResponse.json({ 
        error: 'Name and category are required fields' 
      }, { status: 400 });
    }
    
    console.log('API: Creating new permission', { name, category, action });
    
    // Initialize Supabase client with the correct pattern for Next.js 14
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Insert new permission - map category to resource
    const { data, error } = await supabase
      .from('permissions')
      .insert({
        name,
        description,
        resource: category, // Map category to resource
        action: action || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('API Error creating permission:', error);
      return NextResponse.json({ error: 'Failed to create permission' }, { status: 500 });
    }
    
    // Transform the response to match the expected format
    const transformedPermission = {
      id: data.id,
      name: data.name,
      description: data.description,
      category: data.resource, // Map resource to category
      action: data.action,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
    
    return NextResponse.json({ 
      success: true, 
      message: 'Permission created successfully',
      permission: transformedPermission
    });
  } catch (error: any) {
    console.error('API Error in permissions route:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const body = await request.json();
    const { id, name, description, category, action } = body;
    
    // Validate required fields
    if (!id || !name || !category) {
      return NextResponse.json({ 
        error: 'ID, name, and category are required fields' 
      }, { status: 400 });
    }
    
    console.log('API: Updating permission', { id, name, category, action });
    
    // Initialize Supabase client with the correct pattern for Next.js 14
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Update permission - map category to resource
    const { data, error } = await supabase
      .from('permissions')
      .update({
        name,
        description,
        resource: category, // Map category to resource
        action: action || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('API Error updating permission:', error);
      return NextResponse.json({ error: 'Failed to update permission' }, { status: 500 });
    }
    
    // Transform the response to match the expected format
    const transformedPermission = {
      id: data.id,
      name: data.name,
      description: data.description,
      category: data.resource, // Map resource to category
      action: data.action,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
    
    return NextResponse.json({ 
      success: true, 
      message: 'Permission updated successfully',
      permission: transformedPermission
    });
  } catch (error: any) {
    console.error('API Error in permissions route:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get permission ID from URL
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Permission ID is required' }, { status: 400 });
    }
    
    console.log('API: Deleting permission', { id });
    
    // Initialize Supabase client with the correct pattern for Next.js 14
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check if permission is used in any role_permissions
    const { data: rolePermissions, error: checkError } = await supabase
      .from('role_permissions')
      .select('role_id')
      .eq('permission_id', id);
    
    if (checkError) {
      console.error('API Error checking role permissions:', checkError);
      return NextResponse.json({ error: 'Failed to check role permissions' }, { status: 500 });
    }
    
    // If permission is used, return error
    if (rolePermissions && rolePermissions.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete permission that is assigned to roles',
        roleCount: rolePermissions.length
      }, { status: 400 });
    }
    
    // Delete permission
    const { error } = await supabase
      .from('permissions')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('API Error deleting permission:', error);
      return NextResponse.json({ error: 'Failed to delete permission' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Permission deleted successfully'
    });
  } catch (error: any) {
    console.error('API Error in permissions route:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 