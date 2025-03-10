// Fix All Script
// This script runs all the fixes in sequence
// Run with: node fix-all.js

const { spawn } = require('child_process');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt for input
const prompt = (question) => new Promise((resolve) => {
  rl.question(question, (answer) => resolve(answer));
});

// Function to run a script and wait for it to complete
const runScript = (scriptPath) => {
  return new Promise((resolve, reject) => {
    console.log(`\nRunning ${scriptPath}...`);
    console.log('='.repeat(50));
    
    const child = spawn('node', [scriptPath], { stdio: 'inherit' });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log('='.repeat(50));
        console.log(`✅ ${scriptPath} completed successfully.`);
        resolve();
      } else {
        console.error('='.repeat(50));
        console.error(`❌ ${scriptPath} failed with code ${code}.`);
        reject(new Error(`Script ${scriptPath} failed with code ${code}`));
      }
    });
  });
};

async function fixAll() {
  try {
    console.log('=== Admin Login Fix - Complete Solution ===');
    console.log('This script will run all the fixes in sequence to solve the admin login issue.');
    console.log('');
    
    const proceed = await prompt('This will reset the admin password and update database triggers. Proceed? (y/n): ');
    
    if (proceed.toLowerCase() !== 'y') {
      console.log('Operation cancelled.');
      rl.close();
      return;
    }
    
    // Step 1: Fix the admin password
    console.log('\n📋 Step 1/2: Fixing admin password...');
    await runScript('./fix-admin-password.js');
    
    // Step 2: Fix the trigger
    console.log('\n📋 Step 2/2: Fixing database trigger...');
    await runScript('./fix-trigger.js');
    
    console.log('\n🎉 All fixes have been applied successfully!');
    console.log('You should now be able to log in with the admin account using the new password.');
    console.log('The trigger has been updated to prevent future password mismatches.');
    
    console.log('\nFor more information, please refer to the ADMIN_LOGIN_FIX.md file.');
    
  } catch (error) {
    console.error('\n❌ Error during fix process:', error.message);
    console.error('Please check the error messages above and try running the individual scripts manually.');
  } finally {
    rl.close();
  }
}

fixAll().catch(console.error); 