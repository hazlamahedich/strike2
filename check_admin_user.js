const { createClient } = require('@supabase/supabase-js');

// Supabase credentials from .env.local
const supabaseUrl = 'https://elpqvskcixfsgeavjfhb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVscHF2c2tjaXhmc2dlYXZqZmhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3MTE2NDksImV4cCI6MjA1NjI4NzY0OX0.4w6pE7WLQXnhWeoYvoy3-WAoKh0f-YdhlMd-HokJdjU';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminUser() {
  console.log('Checking if admin user has corresponding records in public.users and public.profiles...');
  
  // 1. First, get the admin user from auth.users
  const { data: authUsers, error: authError } = await supabase.rpc('get_auth_users');
  
  if (authError) {
    console.error('Error fetching auth.users:', authError);
    return;
  }
  
  // Find admin user(s)
  const adminUsers = authUsers.filter(user => 
    user.email && (user.email.includes('admin') || user.role === 'admin' || user.is_super_admin)
  );
  
  if (adminUsers.length === 0) {
    console.log('No admin users found in auth.users');
    return;
  }
  
  console.log(`Found ${adminUsers.length} admin user(s) in auth.users:`);
  adminUsers.forEach(user => {
    console.log(`- ID: ${user.id}, Email: ${user.email}`);
  });
  
  // 2. For each admin user, check if they have a corresponding record in public.users
  for (const adminUser of adminUsers) {
    const { data: publicUser, error: publicUserError } = await supabase
      .from('users')
      .select('*')
      .eq('id', adminUser.id)
      .single();
    
    if (publicUserError && publicUserError.code !== 'PGRST116') {
      console.error(`Error checking public.users for ${adminUser.email}:`, publicUserError);
    } else {
      console.log(`\nUser record in public.users for ${adminUser.email}:`);
      console.log(publicUser ? JSON.stringify(publicUser, null, 2) : 'No matching record found');
    }
    
    // 3. Check if they have a corresponding record in public.profiles
    const { data: publicProfile, error: publicProfileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', adminUser.id)
      .single();
    
    if (publicProfileError && publicProfileError.code !== 'PGRST116') {
      console.error(`Error checking public.profiles for ${adminUser.email}:`, publicProfileError);
    } else {
      console.log(`\nProfile record in public.profiles for ${adminUser.email}:`);
      console.log(publicProfile ? JSON.stringify(publicProfile, null, 2) : 'No matching record found');
    }
  }
}

checkAdminUser().catch(console.error); 