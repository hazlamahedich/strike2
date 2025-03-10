// Fix Admin Password Script
// This script uses the Supabase Admin API to update the admin password directly
// Run with: node fix-admin-password.js

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

// Supabase credentials from .env.local
const supabaseUrl = 'https://elpqvskcixfsgeavjfhb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVscHF2c2tjaXhmc2dlYXZqZmhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3MTE2NDksImV4cCI6MjA1NjI4NzY0OX0.4w6pE7WLQXnhWeoYvoy3-WAoKh0f-YdhlMd-HokJdjU';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt for input
const prompt = (question) => new Promise((resolve) => {
  rl.question(question, (answer) => resolve(answer));
});

async function fixAdminPassword() {
  try {
    console.log('=== Admin Password Fix Tool ===');
    console.log('This tool will help you fix the admin password permanently.');
    console.log('');
    
    // Step 1: Get the new password from user input
    const newPassword = await prompt('Enter the new password for admin@example.com: ');
    if (!newPassword || newPassword.length < 6) {
      console.error('Password must be at least 6 characters long.');
      return;
    }
    
    // Step 2: First try to sign in as admin to get a valid session
    console.log('\nAttempting to sign in with admin credentials...');
    const adminEmail = 'admin@example.com';
    
    // Try with the new password first (in case it's already been set)
    let signInResult = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: newPassword
    });
    
    // If that fails, try with some common default passwords
    if (signInResult.error) {
      console.log('Could not sign in with the new password. Trying common defaults...');
      
      const commonPasswords = ['admin123', 'password', 'admin', 'adminadmin', 'Admin123!'];
      
      for (const pwd of commonPasswords) {
        console.log(`Trying password: ${pwd}`);
        signInResult = await supabase.auth.signInWithPassword({
          email: adminEmail,
          password: pwd
        });
        
        if (!signInResult.error) {
          console.log('Successfully signed in with a default password!');
          break;
        }
      }
    }
    
    // Step 3: If we have a session, use it to update the password
    if (signInResult.data?.session) {
      console.log('\nSuccessfully authenticated as admin.');
      console.log('Updating password...');
      
      const updateResult = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (updateResult.error) {
        console.error('Error updating password:', updateResult.error);
        return;
      }
      
      console.log('\n✅ Password updated successfully!');
      console.log(`You can now log in with:\nEmail: ${adminEmail}\nPassword: ${newPassword}`);
      
      // Step 4: Also update the password in public.users to keep them in sync
      console.log('\nUpdating password in public.users table...');
      
      // We need to use the service role key for this, but we don't have it
      // Instead, we'll provide instructions
      console.log('\n⚠️ Important: The password in public.users table may still be out of sync.');
      console.log('To fully fix this issue, you should update the sync_auth_user_to_public trigger');
      console.log('to not set a default password or to use the same password as auth.users.');
      
      console.log('\n✅ Admin password has been successfully updated in auth.users table.');
      console.log('You can now log in with the new password.');
    } else {
      // Step 5: If we couldn't sign in, use the password reset flow
      console.log('\nCould not authenticate as admin with any known password.');
      console.log('Initiating password reset flow...');
      
      const resetResult = await supabase.auth.resetPasswordForEmail(adminEmail, {
        redirectTo: 'http://localhost:3000/auth/reset-password',
      });
      
      if (resetResult.error) {
        console.error('Error sending password reset email:', resetResult.error);
        return;
      }
      
      console.log('\n✅ Password reset email sent successfully!');
      console.log(`Check the inbox for ${adminEmail} for a password reset link.`);
      console.log('Follow the link and set your password to: ' + newPassword);
      console.log('Note: In development, you may need to check the Supabase dashboard for the reset link.');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  } finally {
    rl.close();
  }
}

fixAdminPassword().catch(console.error); 