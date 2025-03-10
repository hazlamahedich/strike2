// Try Admin Login Script
// This script tries to sign in with the admin account using different password combinations
// Run with: node try-admin-login.js

const { createClient } = require('@supabase/supabase-js');

// Supabase credentials from .env.local
const supabaseUrl = 'https://elpqvskcixfsgeavjfhb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVscHF2c2tjaXhmc2dlYXZqZmhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3MTE2NDksImV4cCI6MjA1NjI4NzY0OX0.4w6pE7WLQXnhWeoYvoy3-WAoKh0f-YdhlMd-HokJdjU';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function tryAdminLogin() {
  try {
    console.log('=== Admin Login Test Tool ===');
    console.log('This tool will try to sign in with the admin account using different password combinations.');
    console.log('');
    
    const adminEmail = 'admin@example.com';
    
    // List of passwords to try
    const passwords = [
      'admin123',
      'password',
      'admin',
      'adminadmin',
      'Admin123!',
      'password123',
      '123456',
      'qwerty',
      'letmein',
      'welcome',
      'welcome1',
      'changeme',
      'secret',
      'iloveyou',
      'abc123',
      'monkey',
      'dragon',
      'sunshine',
      'master',
      'football',
      'baseball',
      'superman',
      'batman',
      'trustno1',
      'whatever',
      'passw0rd',
      'hello123',
      'test123',
      'admin1',
      'admin2',
      'admin12',
      'admin123456',
      'adminpass',
      'adminpassword',
      'adminadmin123',
      'administrator',
      'root',
      'toor',
      'qazwsx',
      '123qwe',
      '1q2w3e',
      '1q2w3e4r',
      '1qaz2wsx',
      'zaq1zaq1',
      'zaq12wsx',
      'qwerty123',
      'qwertyuiop',
      'asdfghjkl',
      'zxcvbnm',
      'password1',
      'password12',
      'password123',
      'p@ssw0rd',
      'P@ssw0rd',
      'P@ssword',
      'Password',
      'Password1',
      'Password123',
      'Pa$$word',
      'Pa$$w0rd',
      'Pa$$w0rd1',
      'Pa$$w0rd123'
    ];
    
    console.log(`Trying ${passwords.length} different passwords for ${adminEmail}...`);
    
    for (const password of passwords) {
      console.log(`Trying password: ${password}`);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password
      });
      
      if (!error) {
        console.log('\n✅ SUCCESS! Found working password:');
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${password}`);
        
        // Sign out
        await supabase.auth.signOut();
        return;
      }
    }
    
    console.log('\n❌ None of the passwords worked.');
    console.log('You may need to reset the admin password using the reset-admin-password-direct.js script.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

tryAdminLogin().catch(console.error); 