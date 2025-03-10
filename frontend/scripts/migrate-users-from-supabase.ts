import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Prisma client
const prisma = new PrismaClient();

async function migrateUsers() {
  try {
    console.log('Starting user migration from Supabase to NextAuth.js...');

    // Fetch all users from Supabase
    const { data: supabaseUsers, error } = await supabase.auth.admin.listUsers();

    if (error) {
      throw new Error(`Error fetching users from Supabase: ${error.message}`);
    }

    console.log(`Found ${supabaseUsers.users.length} users in Supabase`);

    // Migrate each user
    for (const supabaseUser of supabaseUsers.users) {
      console.log(`Migrating user: ${supabaseUser.email}`);

      // Check if user already exists in NextAuth.js database
      const existingUser = await prisma.user.findUnique({
        where: { email: supabaseUser.email || '' },
      });

      if (existingUser) {
        console.log(`User ${supabaseUser.email} already exists in NextAuth.js database, skipping...`);
        continue;
      }

      // Generate a temporary password (users will need to reset their password)
      // In a real migration, you might want to implement a more secure approach
      const tempPassword = await hash('TemporaryPassword123!', 10);

      // Create user in NextAuth.js database
      const newUser = await prisma.user.create({
        data: {
          email: supabaseUser.email || '',
          name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || '',
          password: tempPassword,
          emailVerified: supabaseUser.email_confirmed_at ? new Date(supabaseUser.email_confirmed_at) : null,
          role: supabaseUser.user_metadata?.role || 'user',
          createdAt: supabaseUser.created_at ? new Date(supabaseUser.created_at) : new Date(),
        },
      });

      // Create profile for the user
      await prisma.profile.create({
        data: {
          userId: newUser.id,
          bio: supabaseUser.user_metadata?.bio || null,
          phone: supabaseUser.user_metadata?.phone || null,
        },
      });

      console.log(`Successfully migrated user: ${supabaseUser.email}`);
    }

    console.log('User migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateUsers(); 