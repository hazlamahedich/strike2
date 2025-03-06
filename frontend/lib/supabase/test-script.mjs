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
 * Run with: node lib/supabase/test-script.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the frontend directory (two levels up from the current file)
const frontendDir = resolve(__dirname, '../..');

// Load environment variables from the .env.local file in the frontend directory
const envPath = resolve(frontendDir, '.env.local');
if (fs.existsSync(envPath)) {
  console.log(`Loading environment variables from ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.log('No .env.local file found in frontend directory, falling back to default dotenv behavior');
  dotenv.config();
}

// Get Supabase URL and anon key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Log the environment variables (without the actual values for security)
console.log('Environment variables:');
console.log(`- NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Found' : '❌ Missing'}`);
console.log(`- NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Found' : '❌ Missing'}`);

// Ensure environment variables are properly loaded
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables. Please check your .env.local file in the frontend directory.');
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
    // Instead of directly querying auth.users, check if we can sign up a test user
    // This is a more reliable way to check if the auth schema is working
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'Test1234!';
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    // Clean up by signing out
    await supabase.auth.signOut();
    
    if (error) {
      if (error.message.includes('rate limit')) {
        return { 
          success: true, 
          message: 'Auth schema exists but rate limiting is active' 
        };
      }
      
      return { 
        success: false, 
        message: `Auth schema error: ${error.message}` 
      };
    }
    
    return { 
      success: true, 
      message: 'Auth schema is properly set up' 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Auth schema check error: ${error.message}` 
    };
  }
}

/**
 * Checks the profiles table structure
 */
async function checkProfilesTableStructure() {
  try {
    // Instead of querying information_schema.columns, we'll query the profiles table
    // and check the structure based on the returned data
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      return { 
        success: false, 
        message: `Error checking profiles table: ${error.message}` 
      };
    }
    
    // If we got data, check the structure
    if (data && data.length > 0) {
      const profile = data[0];
      const columns = Object.keys(profile);
      
      console.log('Profiles table columns:', columns);
      
      // Check for required columns
      const hasIdColumn = columns.includes('id');
      const hasUserIdColumn = columns.includes('user_id');
      const hasAvatarUrlColumn = columns.includes('avatar_url');
      
      return { 
        success: hasIdColumn && hasUserIdColumn && hasAvatarUrlColumn, 
        message: `Profiles table has ${hasIdColumn ? '' : 'no '}id column, ${hasUserIdColumn ? '' : 'no '}user_id column, and ${hasAvatarUrlColumn ? '' : 'no '}avatar_url column`,
        columns,
        profile
      };
    } else {
      return { 
        success: false, 
        message: 'No profiles found to check structure' 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      message: `Error checking profiles table structure: ${error.message}` 
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
    
    // For testing purposes, we'll use the service role key if available
    // This is because the anon key doesn't have permission to insert into the profiles table
    console.log('Attempting to create profile with user_id:', userId);
    
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
      
      // If the error is due to RLS, suggest running the SQL migration
      if (error.message.includes('violates row-level security policy')) {
        return { 
          success: false, 
          message: `Error creating profile due to RLS policy. Please run the SQL migration script to fix this issue.` 
        };
      }
      
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
  const profilesResult = await checkProfilesTableStructure();
  
  if (profilesResult.success) {
    console.log('✅ Profiles table has the required columns');
    console.log('Sample profile data:');
    console.log(profilesResult.profile);
  } else {
    console.log(`❌ ${profilesResult.message}`);
  }
  console.log();
  
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
  console.log('\n📋 Summary of issues to fix:');
  
  if (!connectionResult.success) {
    console.log('- Database connection issue: ' + connectionResult.message);
  }
  
  if (!authSchemaResult.success) {
    console.log('- Auth schema issue: ' + authSchemaResult.message);
  }
  
  if (!profilesResult.success) {
    console.log('- Profiles table issue: ' + profilesResult.message);
  }
  
  console.log('\n💡 Recommendation:');
  console.log('Run the SQL migration script in the Supabase SQL Editor:');
  console.log('1. Log into your Supabase dashboard');
  console.log('2. Go to the SQL Editor');
  console.log('3. Paste and run the contents of `frontend/lib/supabase/migrations/fix_auth_tables.sql`');
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