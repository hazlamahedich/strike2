/**
 * Supabase Database Test Script
 * 
 * This script tests the Supabase database setup, including:
 * - Database connection
 * - Auth schema
 * - Profiles table structure
 * - Anonymous permissions
 * - Profile creation
 * 
 * Run with: node -r dotenv/config -r @babel/register lib/supabase/test-script.js
 */

// Import the createClient function
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Get Supabase URL and anon key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Ensure environment variables are properly loaded
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables. Please check your .env.local file.');
  process.exit(1);
}

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Checks if the database connection is working
 */
async function checkDatabaseConnection() {
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
  } catch (error) {
    return { 
      success: false, 
      message: `Connection error: ${error.message}` 
    };
  }
}

/**
 * Checks if the auth schema is properly set up
 */
async function checkAuthSchema() {
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
  } catch (error) {
    return { 
      success: false, 
      message: `Auth schema check error: ${error.message}` 
    };
  }
}

/**
 * Creates a user profile in the database
 */
async function createUserProfile(userId, email, name) {
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
    
    // Create the profile
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        { 
          user_id: userId,
          avatar_url: 'https://randomuser.me/api/portraits/lego/1.jpg',
          preferences: { theme: 'light', language: 'en' },
          notification_settings: { push: true, email: true },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
    
    if (error) {
      console.error('Error creating profile:', error);
      return { 
        success: false, 
        message: `Error creating profile: ${error.message}` 
      };
    }
    
    console.log('Profile created successfully for user:', userId);
    return { 
      success: true, 
      message: 'Profile created successfully' 
    };
  } catch (error) {
    console.error('Profile creation error:', error);
    return { 
      success: false, 
      message: `Profile creation error: ${error.message}` 
    };
  }
}

async function runTests() {
  console.log('🧪 Starting Supabase database tests...\n');
  
  // Test 1: Check database connection
  console.log('Test 1: Database Connection');
  const connectionResult = await checkDatabaseConnection();
  console.log(`Result: ${connectionResult.success ? '✅' : '❌'} ${connectionResult.message}\n`);
  
  // Test 2: Check auth schema
  console.log('Test 2: Auth Schema');
  const authSchemaResult = await checkAuthSchema();
  console.log(`Result: ${authSchemaResult.success ? '✅' : '❌'} ${authSchemaResult.message}\n`);
  
  // Test 3: Check profiles table structure
  console.log('Test 3: Profiles Table Structure');
  try {
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles');
    
    if (error) {
      console.log(`❌ Error checking profiles table: ${error.message}\n`);
    } else {
      console.log('Profiles table columns:');
      columns.forEach(col => {
        console.log(`- ${col.column_name} (${col.data_type})`);
      });
      
      // Check for required columns
      const hasIdColumn = columns.some(col => col.column_name === 'id');
      const hasUserIdColumn = columns.some(col => col.column_name === 'user_id');
      const hasAvatarUrlColumn = columns.some(col => col.column_name === 'avatar_url');
      
      console.log('\nRequired columns check:');
      console.log(`- id column: ${hasIdColumn ? '✅' : '❌'}`);
      console.log(`- user_id column: ${hasUserIdColumn ? '✅' : '❌'}`);
      console.log(`- avatar_url column: ${hasAvatarUrlColumn ? '✅' : '❌'}`);
      
      // Check user_id data type
      const userIdColumn = columns.find(col => col.column_name === 'user_id');
      if (userIdColumn) {
        console.log(`- user_id data type: ${userIdColumn.data_type === 'uuid' ? '✅' : '❌'} (${userIdColumn.data_type})`);
      }
      
      console.log(`\nResult: ${hasIdColumn && hasUserIdColumn && hasAvatarUrlColumn ? '✅' : '❌'} Profiles table structure check\n`);
    }
  } catch (error) {
    console.log(`❌ Error checking profiles table: ${error.message}\n`);
  }
  
  // Test 4: Test anonymous permissions
  console.log('Test 4: Anonymous Permissions');
  try {
    const { data, error } = await supabase
      .from('test')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ Error testing anonymous permissions: ${error.message}\n`);
    } else {
      console.log(`✅ Anonymous permissions test passed. Retrieved data:`);
      console.log(data);
      console.log();
    }
  } catch (error) {
    console.log(`❌ Error testing anonymous permissions: ${error.message}\n`);
  }
  
  // Test 5: Test profile creation
  console.log('Test 5: Profile Creation');
  try {
    const testUserId = uuidv4();
    const testEmail = `test-${Date.now()}@example.com`;
    const testName = 'Test User';
    
    console.log(`Creating test profile with user_id: ${testUserId}`);
    const profileResult = await createUserProfile(testUserId, testEmail, testName);
    
    console.log(`Result: ${profileResult.success ? '✅' : '❌'} ${profileResult.message}\n`);
    
    if (profileResult.success) {
      // Verify the profile was created
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', testUserId);
      
      if (error) {
        console.log(`❌ Error verifying profile creation: ${error.message}\n`);
      } else if (data && data.length > 0) {
        console.log('✅ Profile verification successful. Profile data:');
        console.log(data[0]);
        console.log();
      } else {
        console.log('❌ Profile verification failed: No profile found with the test user_id\n');
      }
    }
  } catch (error) {
    console.log(`❌ Error testing profile creation: ${error.message}\n`);
  }
  
  console.log('🏁 All tests completed!');
}

// Run the tests
runTests()
  .catch(error => {
    console.error('Error running tests:', error);
  })
  .finally(() => {
    // Close the Supabase connection
    supabase.auth.signOut();
  }); 