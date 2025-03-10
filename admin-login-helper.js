// Admin Login Helper
// This script helps you log in as admin by using the temporary authentication mechanism
// Run this in your browser console when on the login page

(function() {
  // Admin credentials from public.users table
  const adminEmail = 'admin@example.com';
  
  // Create a temporary user entry in localStorage
  const tempUser = {
    id: '1504c604-d686-49ed-b943-37d335a93d36',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    usingTempAuth: true
  };
  
  // Store in localStorage
  localStorage.setItem('strike_app_user', JSON.stringify(tempUser));
  
  // Also add to temp users if that mechanism is being used
  const tempUsers = [
    {
      id: '1504c604-d686-49ed-b943-37d335a93d36',
      email: 'admin@example.com',
      name: 'Admin User',
      password: 'admin123', // This is just for the temp auth mechanism
      role: 'admin'
    }
  ];
  
  localStorage.setItem('strike_app_temp_users', JSON.stringify(tempUsers));
  
  console.log('Admin login helper: Temporary admin authentication set up.');
  console.log('You can now try to log in with:');
  console.log('Email: admin@example.com');
  console.log('Password: admin123');
  console.log('Or just refresh the page and you should be logged in automatically.');
  
  // Redirect to dashboard
  window.location.href = '/dashboard';
})(); 