import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role key to bypass RLS
const createServerSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(supabaseUrl, supabaseServiceKey);
};

// POST handler for creating a new activity
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('Unauthorized activity logging attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const activityData = await request.json();

    // Validate required fields
    if (!activityData.lead_id || !activityData.activity_type) {
      console.log('Invalid activity data, missing required fields:', activityData);
      return NextResponse.json({ 
        error: 'Invalid activity data: lead_id and activity_type are required' 
      }, { status: 400 });
    }

    // Log debugging information
    console.log('Logging activity server-side:', {
      user: session.user.email,
      activityType: activityData.activity_type,
      leadId: activityData.lead_id,
      metadata: activityData.metadata
    });

    // Create server-side Supabase client with service role key
    const supabase = createServerSupabase();

    // Insert activity data using service role (bypasses RLS)
    const { data, error } = await supabase
      .from('activities')
      .insert({
        ...activityData,
        // Ensure user_id is set to authenticated user
        user_id: session.user.id || activityData.user_id
      })
      .select();

    if (error) {
      console.error('Server-side activity logging error:', error);
      return NextResponse.json({ 
        error: `Error inserting activity: ${error.message || JSON.stringify(error)}` 
      }, { status: 500 });
    }

    console.log('Activity logged successfully:', data);
    return NextResponse.json({ 
      success: true,
      data 
    }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in activity logging endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: `Unexpected error: ${errorMessage}` 
    }, { status: 500 });
  }
} 