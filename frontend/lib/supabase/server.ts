import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key for admin operations
// This should never be used on the client side, only in API routes
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Helper function to get only the data from a Supabase response
export const getSupabaseData = <T>(
  response: { data: T | null; error: Error | null }
): T | null => {
  if (response.error) {
    console.error('Supabase error:', response.error);
    return null;
  }
  return response.data;
}; 