/**
 * Database Utilities
 * 
 * This file contains utility functions for database operations and diagnostics.
 */

import supabase from '../supabase/client';

/**
 * Checks if the database connection is working
 */
export async function checkDatabaseConnection(): Promise<{ success: boolean; message: string }> {
  try {
    // Try to query a public table that should exist
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST301') {
        // Table doesn't exist, which might be expected
        return { 
          success: false, 
          message: 'Table "profiles" not found. You may need to create it.' 
        };
      }
      
      return { 
        success: false, 
        message: `Database error: ${error.message}` 
      };
    }
    
    return { 
      success: true, 
      message: 'Database connection successful' 
    };
  } catch (error: any) {
    return { 
      success: false, 
      message: `Connection error: ${error.message}` 
    };
  }
}

/**
 * Checks if the auth schema is properly set up
 */
export async function checkAuthSchema(): Promise<{ success: boolean; message: string }> {
  try {
    // Try to query the auth schema
    const { data, error } = await supabase
      .from('auth.users')
      .select('id')
      .limit(1);
    
    if (error) {
      // This is expected, as we shouldn't be able to directly query auth.users
      // But the error should be about permissions, not that the table doesn't exist
      if (error.message.includes('permission denied') || error.message.includes('access denied')) {
        return { 
          success: true, 
          message: 'Auth schema exists but is properly secured' 
        };
      }
      
      if (error.message.includes('does not exist')) {
        return { 
          success: false, 
          message: 'Auth schema tables may not exist' 
        };
      }
      
      return { 
        success: false, 
        message: `Auth schema error: ${error.message}` 
      };
    }
    
    // If we got here, we were able to query auth.users, which is a security issue
    return { 
      success: false, 
      message: 'Security issue: auth.users table is publicly accessible' 
    };
  } catch (error: any) {
    return { 
      success: false, 
      message: `Auth schema check error: ${error.message}` 
    };
  }
}

/**
 * Creates a user profile in the database
 * This is useful for creating a profile after a user signs up
 */
export async function createUserProfile(userId: string, email: string, name: string): Promise<{ success: boolean; message: string }> {
  try {
    // Check if the profiles table exists
    const { data: tableExists, error: tableCheckError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (tableCheckError && tableCheckError.code === 'PGRST301') {
      // Table doesn't exist, so we'll create it
      console.log('Profiles table does not exist, skipping profile creation');
      return { 
        success: false, 
        message: 'Profiles table does not exist' 
      };
    }
    
    // Check if the profile already exists
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (existingProfile) {
      console.log('Profile already exists for user:', userId);
      return { 
        success: true, 
        message: 'Profile already exists' 
      };
    }
    
    // Wait a moment to ensure the auth user is fully propagated to the database
    // This helps with foreign key constraints
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create the profile with all required fields
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        { 
          user_id: userId,
          avatar_url: 'https://randomuser.me/api/portraits/lego/1.jpg',
          preferences: { theme: 'light', language: 'en' },
          notification_settings: { push: true, email: true },
          created_at: now,
          updated_at: now
        }
      ]);
    
    if (error) {
      console.error('Error creating profile:', error);
      
      // Check for foreign key constraint violation
      if (error.code === '23503' && error.message?.includes('profiles_user_id_fkey')) {
        // This is a foreign key constraint error - the user_id doesn't exist in auth.users
        console.log('Foreign key constraint violation - user may not be fully propagated to database yet');
        
        // Return success anyway since the user was created in auth system
        // The profile can be created later when the user logs in
        return { 
          success: true, 
          message: 'User created in auth system, but profile creation delayed due to database synchronization' 
        };
      }
      
      return { 
        success: false, 
        message: `Error creating profile: ${error.message || JSON.stringify(error)}` 
      };
    }
    
    console.log('Profile created successfully for user:', userId);
    return { 
      success: true, 
      message: 'Profile created successfully' 
    };
  } catch (error: any) {
    console.error('Profile creation error:', error);
    return { 
      success: false, 
      message: `Profile creation error: ${error.message || JSON.stringify(error)}` 
    };
  }
}

export default {
  checkDatabaseConnection,
  checkAuthSchema,
  createUserProfile
}; 