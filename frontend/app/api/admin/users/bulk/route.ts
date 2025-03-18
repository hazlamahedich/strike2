import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { parse } from 'csv-parse/sync';

// Create Supabase client for server-side operations
const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(supabaseUrl, supabaseKey);
};

// Define types for CSV data
interface UserCSVData {
  name: string;
  email: string;
  password: string;
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log(`API: Bulk user upload request from ${session.user.email}`);
    
    // Create Supabase client
    const supabase = createServerClient();
    
    // Check if user has admin role
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', session.user.id || '00000000-0000-0000-0000-000000000000');
    
    const isAdmin = userRoles?.some((ur: { role_id: number }) => ur.role_id === 1);
    
    // Only allow admins to bulk upload users
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only administrators can bulk upload users' }, { status: 403 });
    }
    
    // Get the form data with the CSV file
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Check file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 });
    }
    
    // Read the file content
    const fileContent = await file.text();
    
    // Parse CSV data
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    
    // Validate CSV structure
    if (records.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }
    
    // Check if the CSV has the required columns
    const requiredColumns = ['name', 'email', 'password'];
    const firstRecord = records[0];
    const missingColumns = requiredColumns.filter(col => !(col in firstRecord));
    
    if (missingColumns.length > 0) {
      return NextResponse.json({ 
        error: `CSV is missing required columns: ${missingColumns.join(', ')}` 
      }, { status: 400 });
    }
    
    // Process each user
    const results = {
      created: 0,
      failed: 0,
      errors: [] as string[],
    };
    
    // Get existing emails to check for duplicates
    const { data: existingUsers } = await supabase
      .from('User')
      .select('email');
    
    const existingEmails = new Set(existingUsers?.map((user: { email: string }) => user.email.toLowerCase()));
    
    // Process users in batches
    const userBatch = [];
    const profileBatch = [];
    const roleBatch = [];
    
    for (const record of records) {
      try {
        const userData = record as UserCSVData;
        
        // Validate required fields
        if (!userData.name || !userData.email || !userData.password) {
          results.failed++;
          results.errors.push(`Missing required fields for user ${userData.email || 'unknown'}`);
          continue;
        }
        
        // Check for duplicate email
        if (existingEmails.has(userData.email.toLowerCase())) {
          results.failed++;
          results.errors.push(`Email already exists: ${userData.email}`);
          continue;
        }
        
        // Add email to set to prevent duplicates within the batch
        existingEmails.add(userData.email.toLowerCase());
        
        // Generate UUID for new user
        const userId = uuidv4();
        
        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        // Add user to batch
        userBatch.push({
          id: userId,
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        
        // Add profile to batch
        profileBatch.push({
          user_id: userId,
          full_name: userData.name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        
        // Add role assignment to batch (default to Viewer role)
        roleBatch.push({
          user_id: userId,
          role_id: 4, // Viewer role
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        
        results.created++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Error processing user: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Insert users in batch
    if (userBatch.length > 0) {
      const { error: userError } = await supabase
        .from('User')
        .insert(userBatch);
      
      if (userError) {
        console.error('API Error creating users:', userError);
        return NextResponse.json({ error: 'Failed to create users' }, { status: 500 });
      }
      
      // Insert profiles in batch
      const { error: profileError } = await supabase
        .from('Profile')
        .insert(profileBatch);
      
      if (profileError) {
        console.error('API Error creating profiles:', profileError);
        // Continue even if profile creation fails
      }
      
      // Insert role assignments in batch
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert(roleBatch);
      
      if (roleError) {
        console.error('API Error assigning roles:', roleError);
        return NextResponse.json({ error: 'Failed to assign roles to users' }, { status: 500 });
      }
    }
    
    console.log(`API: Bulk user upload completed. Created: ${results.created}, Failed: ${results.failed}`);
    
    return NextResponse.json({
      success: true,
      created: results.created,
      failed: results.failed,
      errors: results.errors.slice(0, 10), // Return only first 10 errors to avoid response size issues
    });
  } catch (error) {
    console.error('API Error in bulk user upload:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 