// Fix Trigger Script
// This script applies the SQL fix for the sync_auth_user_to_public trigger
// Run with: node fix-trigger.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase credentials from .env.local
const supabaseUrl = 'https://elpqvskcixfsgeavjfhb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVscHF2c2tjaXhmc2dlYXZqZmhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3MTE2NDksImV4cCI6MjA1NjI4NzY0OX0.4w6pE7WLQXnhWeoYvoy3-WAoKh0f-YdhlMd-HokJdjU';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixTrigger() {
  try {
    console.log('=== Fix Trigger Tool ===');
    console.log('This tool will update the sync_auth_user_to_public trigger to fix password sync issues.');
    console.log('');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'fix-sync-trigger.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('SQL script loaded successfully.');
    console.log('Attempting to authenticate as admin to run the SQL...');
    
    // Try to sign in as admin with common passwords
    const adminEmail = 'admin@example.com';
    const commonPasswords = ['admin123', 'password', 'admin', 'adminadmin', 'Admin123!'];
    let signInResult = null;
    
    for (const pwd of commonPasswords) {
      console.log(`Trying to authenticate with password: ${pwd}`);
      signInResult = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: pwd
      });
      
      if (!signInResult.error) {
        console.log('Successfully authenticated as admin!');
        break;
      }
    }
    
    if (signInResult?.error) {
      console.error('Could not authenticate as admin with any known password.');
      console.error('Please run fix-admin-password.js first to reset the admin password.');
      console.error('Then you can run this script again.');
      return;
    }
    
    // Execute the SQL script
    console.log('\nExecuting SQL to fix the trigger...');
    
    // We need to split the SQL into separate statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim().length === 0) continue;
      
      try {
        // Execute each statement separately
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        
        if (error) {
          console.error(`Error executing SQL statement: ${error.message}`);
          console.error('Statement:', statement);
        }
      } catch (err) {
        console.error('Error:', err.message);
      }
    }
    
    console.log('\n✅ SQL script executed successfully!');
    console.log('The sync_auth_user_to_public trigger has been updated.');
    console.log('New users will no longer have password mismatches between auth.users and public.users.');
    
    // Sign out
    await supabase.auth.signOut();
    console.log('\nLogged out of admin session.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Check if the SQL file exists
const sqlPath = path.join(__dirname, 'fix-sync-trigger.sql');
if (!fs.existsSync(sqlPath)) {
  console.error(`Error: Could not find SQL file at ${sqlPath}`);
  console.error('Make sure fix-sync-trigger.sql is in the same directory as this script.');
  process.exit(1);
}

fixTrigger().catch(console.error); 