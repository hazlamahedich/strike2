import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

// Create Supabase client for server-side operations
const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(supabaseUrl, supabaseKey);
};

// Define types for database entities
interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface UserRole {
  id: number;
  user_id: string;
  role_id: number;
  created_at: string;
  updated_at: string;
}

interface Profile {
  id: number;
  user_id: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

// GET handler for fetching users
export async function GET(req: NextRequest) {
  console.log('API: /api/admin/users endpoint called');
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log(`API: Authenticated user: ${session.user.email} (${session.user.id || '00000000-0000-0000-0000-000000000000'})`);
    
    // Create Supabase client
    const supabase = createServerClient();
    
    // Fetch users from the database
    console.log('API: Fetching users from users table');
    const { data: users, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      console.error('API Error fetching users:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
    
    console.log(`API: Successfully fetched ${users.length} users`);
    
    // Get user IDs for role lookup
    const userIds = users.map((user: User) => user.id).filter(Boolean);
    console.log(`API: Found ${userIds.length} valid user IDs`);
    
    // Fetch user role assignments
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('*')
      .in('user_id', userIds);
    
    if (roleError) {
      console.error('API Error fetching user roles:', roleError);
      return NextResponse.json({ error: 'Failed to fetch user roles' }, { status: 500 });
    }
    
    console.log(`API: Found ${userRoles.length} user role assignments`);
    console.log('API: User role assignments:', userRoles);
    
    // Get role IDs to fetch role details
    const roleIds = userRoles.map((ur: UserRole) => ur.role_id)
      .filter((id: number, index: number, self: number[]) => self.indexOf(id) === index);
    console.log('API: Role IDs to fetch:', roleIds);
    
    // Fetch role details
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*')
      .in('id', roleIds);
    
    if (rolesError) {
      console.error('API Error fetching roles:', rolesError);
      return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
    }
    
    console.log('API: Role details fetched:', roles);
    
    // Create a map of user IDs to their roles
    const userRolesMap: Record<string, Role[]> = {};
    
    userRoles.forEach((ur: UserRole) => {
      const role = roles.find((r: Role) => r.id === ur.role_id);
      if (role) {
        if (!userRolesMap[ur.user_id]) {
          userRolesMap[ur.user_id] = [];
        }
        userRolesMap[ur.user_id].push(role);
      }
    });
    
    console.log('API: User roles map created:', userRolesMap);
    
    // Fetch user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('user_id', userIds);
    
    if (profilesError) {
      console.error('API Error fetching profiles:', profilesError);
      // Continue without profiles
    }
    
    // Map profiles to users
    const profilesMap = profiles ? profiles.reduce((acc: Record<string, Profile>, profile: Profile) => {
      acc[profile.user_id] = profile;
      return acc;
    }, {}) : {};
    
    console.log(`API: Mapped ${profiles ? profiles.length : 0} profiles to users`);
    
    // Combine user data with roles
    const usersWithRoles = users.map((user: User) => {
      console.log(`API: Processing user ${user.id} (${user.email})`);
      const userRolesList = userRolesMap[user.id] || [];
      console.log(`API: Roles for user ${user.id}:`, userRolesList);
      
      return {
        ...user,
        roles: userRolesList,
        profile: profilesMap[user.id] || null,
        status: user.is_active === false ? 'inactive' : 'active'
      };
    });
    
    console.log(`API: Returning ${usersWithRoles.length} users`);
    return NextResponse.json(usersWithRoles);
  } catch (error) {
    console.error('API Error in /api/admin/users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST handler for creating a new user
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log(`API: Create user request from ${session.user.email}`);
    
    // Create Supabase client
    const supabase = createServerClient();
    
    // Check if user has admin role
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', session.user.id || '00000000-0000-0000-0000-000000000000');
    
    const isAdmin = userRoles?.some((ur: { role_id: number }) => ur.role_id === 1);
    
    // Parse request body
    const body = await req.json();
    const { name, email, password, roleId = 4 } = body; // Default to Viewer role (ID: 4)
    
    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }
    
    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate UUID for new user
    const userId = uuidv4();
    
    // Create user in the database
    const { error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: userId,
          email,
          password: hashedPassword,
          name,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ]);
    
    if (userError) {
      console.error('API Error creating user:', userError);
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
    
    // Create profile for the user
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          user_id: userId,
          full_name: name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ]);
    
    if (profileError) {
      console.error('API Error creating profile:', profileError);
      // Continue even if profile creation fails
    }
    
    // Assign default role (Viewer) to the user
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert([
        {
          user_id: userId,
          role_id: roleId, // Default to Viewer role
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ]);
    
    if (roleError) {
      console.error('API Error assigning role:', roleError);
      return NextResponse.json({ error: 'Failed to assign role to user' }, { status: 500 });
    }
    
    console.log(`API: User ${userId} (${email}) created successfully with role ${roleId}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'User created successfully',
      userId
    });
  } catch (error) {
    console.error('API Error in POST /api/admin/users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 