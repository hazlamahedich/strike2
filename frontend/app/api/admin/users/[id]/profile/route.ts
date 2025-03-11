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

    console.log(`API: Fetching profile for user ${params.id}`);
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Query the profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', params.id)
      .single();
    
    if (error) {
      console.error('API Error fetching profile:', error);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
    
    return NextResponse.json({ profile });
  } catch (error: any) {
    console.error('API Error in profile route:', error);
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
    
    // Get request body
    const body = await request.json();
    const { profileData } = body;
    
    if (!profileData) {
      return NextResponse.json({ error: 'Profile data is required' }, { status: 400 });
    }
    
    console.log(`API: Updating profile for user ${params.id}`);
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', params.id)
      .maybeSingle();
    
    if (checkError) {
      console.error('API Error checking profile:', checkError);
      return NextResponse.json({ error: 'Failed to check profile' }, { status: 500 });
    }
    
    let result;
    
    // Update or insert profile
    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.fullName,
          display_name: profileData.displayName,
          bio: profileData.bio,
          job_title: profileData.jobTitle,
          department: profileData.department,
          location: profileData.location,
          phone_number: profileData.phoneNumber,
          timezone: profileData.timezone,
          language: profileData.language,
          avatar_url: profileData.avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', params.id)
        .select();
      
      if (error) {
        console.error('API Error updating profile:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
      }
      
      result = data;
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: params.id,
          full_name: profileData.fullName,
          display_name: profileData.displayName,
          bio: profileData.bio,
          job_title: profileData.jobTitle,
          department: profileData.department,
          location: profileData.location,
          phone_number: profileData.phoneNumber,
          timezone: profileData.timezone,
          language: profileData.language,
          avatar_url: profileData.avatarUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select();
      
      if (error) {
        console.error('API Error creating profile:', error);
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
      }
      
      result = data;
    }
    
    // Also update the user's name in the auth.users table if needed
    if (profileData.fullName) {
      const { error: userUpdateError } = await supabase.auth.admin.updateUserById(
        params.id,
        { user_metadata: { full_name: profileData.fullName } }
      );
      
      if (userUpdateError) {
        console.warn('API Warning: Could not update user metadata:', userUpdateError);
      }
    }
    
    return NextResponse.json({ success: true, profile: result });
  } catch (error: any) {
    console.error('API Error in profile route:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 