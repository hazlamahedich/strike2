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
 * Run with: npx ts-node -r tsconfig-paths/register lib/supabase/test-script.ts
 */

import supabase from './client';
import { checkDatabaseConnection, checkAuthSchema, createUserProfile } from '../utils/databaseUtils';
import { v4 as uuidv4 } from 'uuid';

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
  } catch (error: any) {
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
  } catch (error: any) {
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
  } catch (error: any) {
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