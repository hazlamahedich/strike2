import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = params.id;
    console.log(`API: Updating status for user ${userId}`);

    // Get request body
    const { status } = await request.json();
    
    if (!status || !['active', 'inactive', 'deactivated'].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value. Must be 'active', 'inactive', or 'deactivated'" },
        { status: 400 }
      );
    }

    // Initialize Supabase client with await
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Convert status to is_active boolean
    const is_active = status === 'active';
    
    // Prepare update data
    const updateData: any = { is_active };
    
    // If deactivating, add deactivation timestamp and metadata
    if (status === 'deactivated') {
      updateData.deactivated_at = new Date().toISOString();
      updateData.deactivated_by = session.user.id;
      updateData.scheduled_archive_date = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(); // 60 days from now
    } else if (status === 'active') {
      // Clear deactivation fields if reactivating
      updateData.deactivated_at = null;
      updateData.deactivated_by = null;
      updateData.scheduled_archive_date = null;
    }
    
    // Update user in the database
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select();

    if (error) {
      console.error('API Error updating user status:', error);
      return NextResponse.json(
        { error: "Failed to update user status" },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // If deactivating, remove all role assignments
    if (status === 'deactivated') {
      console.log(`API: Removing role assignments for deactivated user ${userId}`);
      
      // Get current role assignments
      const { data: roleAssignments, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);
        
      if (roleError) {
        console.error('API Error fetching user roles:', roleError);
      } else {
        console.log(`API: Found ${roleAssignments?.length || 0} role assignments to remove`);
        
        // Store removed roles in user_role_history table for potential restoration
        if (roleAssignments && roleAssignments.length > 0) {
          const historyEntries = roleAssignments.map(role => ({
            user_id: userId,
            role_id: role.role_id,
            removed_at: new Date().toISOString(),
            removed_by: session.user.id,
            removal_reason: 'user_deactivated'
          }));
          
          const { error: historyError } = await supabase
            .from('user_role_history')
            .insert(historyEntries)
            .select();
            
          if (historyError) {
            console.error('API Error creating role history entries:', historyError);
          }
        }
        
        // Delete role assignments
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);
          
        if (deleteError) {
          console.error('API Error removing user roles:', deleteError);
        } else {
          console.log(`API: Successfully removed all role assignments for user ${userId}`);
        }
      }
    }

    console.log(`API: Successfully updated status for user ${userId} to ${status} (is_active: ${is_active})`);
    
    return NextResponse.json({
      message: "User status updated successfully",
      user: {
        ...data[0],
        status  // Add the status field to the response for the frontend
      }
    });
  } catch (error) {
    console.error('API Error in status update endpoint:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 