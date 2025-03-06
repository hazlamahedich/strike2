/**
 * Debug Utilities
 * 
 * This file contains utility functions for debugging purposes.
 * These functions should only be used during development.
 */

/**
 * Logs Supabase authentication errors with detailed information
 */
export function logSupabaseAuthError(error: any, context: string = 'auth'): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  console.group(`Supabase ${context} error`);
  console.error('Error object:', error);
  
  // Extract useful properties
  if (error) {
    if (error.message) console.error('Message:', error.message);
    if (error.status) console.error('Status:', error.status);
    if (error.code) console.error('Code:', error.code);
    if (error.details) console.error('Details:', error.details);
    if (error.hint) console.error('Hint:', error.hint);
  }
  
  console.groupEnd();
}

/**
 * Checks if the Supabase configuration is valid
 */
export function checkSupabaseConfig(): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    issues.push('NEXT_PUBLIC_SUPABASE_URL is missing');
  } else if (!supabaseUrl.startsWith('https://')) {
    issues.push('NEXT_PUBLIC_SUPABASE_URL should start with https://');
  }
  
  // Check anon key
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseAnonKey) {
    issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
  } else if (supabaseAnonKey.length < 20) {
    issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be invalid (too short)');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Logs the current authentication state for debugging
 */
export function logAuthState(): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  console.group('Auth State Debug');
  
  // Check Supabase config
  const configCheck = checkSupabaseConfig();
  console.log('Supabase config valid:', configCheck.valid);
  if (!configCheck.valid) {
    console.warn('Config issues:', configCheck.issues);
  }
  
  // Check local storage
  if (typeof window !== 'undefined') {
    const localUser = localStorage.getItem('strike_app_user');
    console.log('Local storage user:', localUser ? 'exists' : 'not found');
    
    const tempUsers = localStorage.getItem('strike_app_temp_users');
    console.log('Temp users:', tempUsers ? `found (${JSON.parse(tempUsers).length} users)` : 'not found');
    
    const supabaseAuth = localStorage.getItem('supabase.auth.token');
    console.log('Supabase auth token:', supabaseAuth ? 'exists' : 'not found');
  }
  
  console.groupEnd();
}

export default {
  logSupabaseAuthError,
  checkSupabaseConfig,
  logAuthState
}; 