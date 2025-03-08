#!/usr/bin/env node

/**
 * Script to deploy analytics tables to Supabase
 * 
 * This script reads the analytics_tables.sql file and executes it against
 * your Supabase database using the Supabase CLI.
 * 
 * Prerequisites:
 * - Supabase CLI installed (https://supabase.com/docs/guides/cli)
 * - Supabase project linked
 * 
 * Usage:
 * node deploy-analytics-tables.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Path to the SQL migration file
const sqlFilePath = path.resolve(__dirname, '../lib/migrations/analytics_tables.sql');

// Check if the SQL file exists
if (!fs.existsSync(sqlFilePath)) {
  console.error(`Error: SQL file not found at ${sqlFilePath}`);
  process.exit(1);
}

// Read the SQL file
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Create a temporary file with the SQL content
const tempFilePath = path.resolve(__dirname, 'temp_analytics_migration.sql');
fs.writeFileSync(tempFilePath, sqlContent);

try {
  console.log('Deploying analytics tables to Supabase...');
  
  // Execute the SQL file using Supabase CLI
  // Note: This assumes you have the Supabase CLI installed and configured
  execSync(`supabase db execute --file ${tempFilePath}`, { stdio: 'inherit' });
  
  console.log('Analytics tables deployed successfully!');
  
  // Alternative approach using direct connection (if Supabase CLI is not available)
  // This would require additional dependencies like 'pg'
  /*
  const { Client } = require('pg');
  
  const client = new Client({
    connectionString: process.env.SUPABASE_POSTGRES_URL,
  });
  
  await client.connect();
  await client.query(sqlContent);
  await client.end();
  */
  
} catch (error) {
  console.error('Error deploying analytics tables:', error.message);
  process.exit(1);
} finally {
  // Clean up the temporary file
  if (fs.existsSync(tempFilePath)) {
    fs.unlinkSync(tempFilePath);
  }
}

// Instructions for manual deployment
console.log('\nIf the automatic deployment failed, you can manually deploy the tables:');
console.log('1. Go to your Supabase project dashboard');
console.log('2. Navigate to the SQL Editor');
console.log('3. Copy the contents of lib/migrations/analytics_tables.sql');
console.log('4. Paste into the SQL Editor and execute');
console.log('\nAfter deployment, you can set USE_MOCK_DATA to false in your application to use real data.'); 