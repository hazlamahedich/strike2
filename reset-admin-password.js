// Reset Admin Password Script
// This script uses the Supabase API to reset the admin password
// Run with: node reset-admin-password.js

const { createClient } = require('@supabase/supabase-js');

// Supabase credentials from .env.local
const supabaseUrl = 'https://elpqvskcixfsgeavjfhb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVscHF2c2tjaXhmc2dlYXZqZmhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3MTE2NDksImV4cCI6MjA1NjI4NzY0OX0.4w6pE7WLQXnhWeoYvoy3-WAoKh0f-YdhlMd-HokJdjU';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function resetAdminPassword() {
  try {
    console.log('Sending password reset email to admin@example.com...');
    
    // Request password reset
    const { data, error } = await supabase.auth.resetPasswordForEmail('admin@example.com', {
      redirectTo: 'http://localhost:3000/auth/reset-password',
    });
    
    if (error) {
      console.error('Error sending password reset email:', error);
      return;
    }
    
    console.log('Password reset email sent successfully!');
    console.log('Check the admin@example.com inbox for a password reset link.');
    console.log('Note: In development, you may need to check the Supabase dashboard for the reset link.');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

resetAdminPassword().catch(console.error); 