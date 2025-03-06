'use client';

import { useState, useEffect } from 'react';
import supabase from '@/lib/supabase/client';
import { checkDatabaseConnection, checkAuthSchema } from '@/lib/utils/databaseUtils';

/**
 * This is a diagnostic page for testing Supabase authentication.
 * It should only be used during development to troubleshoot auth issues.
 */
export default function AuthTestPage() {
  const [results, setResults] = useState<Array<{ name: string; status: 'pending' | 'success' | 'error'; message: string }>>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (name: string, status: 'pending' | 'success' | 'error', message: string) => {
    setResults(prev => {
      const existingIndex = prev.findIndex(r => r.name === name);
      if (existingIndex >= 0) {
        const newResults = [...prev];
        newResults[existingIndex] = { name, status, message };
        return newResults;
      } else {
        return [...prev, { name, status, message }];
      }
    });
  };

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);

    // Test 1: Check if Supabase client is initialized
    addResult('Supabase Client', 'pending', 'Checking if Supabase client is initialized...');
    try {
      if (supabase) {
        addResult('Supabase Client', 'success', 'Supabase client is initialized');
      } else {
        addResult('Supabase Client', 'error', 'Supabase client is not initialized');
      }
    } catch (error: any) {
      addResult('Supabase Client', 'error', `Error checking Supabase client: ${error.message}`);
    }

    // Test 2: Check connection to Supabase
    addResult('Supabase Connection', 'pending', 'Checking connection to Supabase...');
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      if (error) {
        addResult('Supabase Connection', 'error', `Error connecting to Supabase: ${error.message}`);
      } else {
        addResult('Supabase Connection', 'success', 'Successfully connected to Supabase');
      }
    } catch (error: any) {
      addResult('Supabase Connection', 'error', `Error connecting to Supabase: ${error.message}`);
    }

    // Test 3: Check database connection
    addResult('Database Connection', 'pending', 'Checking database connection...');
    try {
      const result = await checkDatabaseConnection();
      if (result.success) {
        addResult('Database Connection', 'success', 'Database connection successful');
      } else {
        addResult('Database Connection', 'error', `Database connection failed: ${result.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      addResult('Database Connection', 'error', `Error checking database connection: ${error.message}`);
    }

    // Test 4: Check auth schema
    addResult('Auth Schema', 'pending', 'Checking auth schema...');
    try {
      const result = await checkAuthSchema();
      if (result.success) {
        addResult('Auth Schema', 'success', 'Auth schema exists and is properly configured');
      } else {
        addResult('Auth Schema', 'error', `Auth schema check failed: ${result.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      addResult('Auth Schema', 'error', `Error checking auth schema: ${error.message}`);
    }

    // Test 5: Check profiles table structure
    addResult('Profiles Table', 'pending', 'Checking profiles table structure...');
    try {
      // Check if profiles table exists and has the expected columns
      const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_schema', 'public')
        .eq('table_name', 'profiles');

      if (error) {
        addResult('Profiles Table', 'error', `Error checking profiles table: ${error.message}`);
      } else if (!data || data.length === 0) {
        addResult('Profiles Table', 'error', 'Profiles table does not exist or has no columns');
      } else {
        // Check for required columns
        const columns = data.map((col: any) => col.column_name);
        const requiredColumns = ['id', 'user_id', 'avatar_url'];
        const missingColumns = requiredColumns.filter(col => !columns.includes(col));
        
        if (missingColumns.length > 0) {
          addResult('Profiles Table', 'error', `Profiles table is missing columns: ${missingColumns.join(', ')}`);
        } else {
          // Check column types
          const userIdColumn = data.find((col: any) => col.column_name === 'user_id');
          if (userIdColumn && userIdColumn.data_type !== 'uuid') {
            addResult('Profiles Table', 'error', `user_id column should be of type UUID, but is ${userIdColumn.data_type}`);
          } else {
            addResult('Profiles Table', 'success', 'Profiles table exists with all required columns and correct types');
          }
        }
      }
    } catch (error: any) {
      addResult('Profiles Table', 'error', `Error checking profiles table: ${error.message}`);
    }

    // Test 6: Check anonymous permissions
    addResult('Anonymous Permissions', 'pending', 'Checking anonymous permissions...');
    try {
      const { data, error } = await supabase.from('test').select('*').limit(1);
      if (error) {
        addResult('Anonymous Permissions', 'error', `Error checking anonymous permissions: ${error.message}`);
      } else {
        addResult('Anonymous Permissions', 'success', 'Anonymous permissions are working correctly');
      }
    } catch (error: any) {
      addResult('Anonymous Permissions', 'error', `Error checking anonymous permissions: ${error.message}`);
    }

    setIsRunning(false);
  };

  useEffect(() => {
    // Auto-run tests when the page loads
    runTests();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>
      <button
        onClick={runTests}
        disabled={isRunning}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        {isRunning ? 'Running Tests...' : 'Run Tests'}
      </button>

      <div className="space-y-4">
        {results.map((result, index) => (
          <div
            key={index}
            className={`p-4 rounded ${
              result.status === 'success'
                ? 'bg-green-100 border-green-500'
                : result.status === 'error'
                ? 'bg-red-100 border-red-500'
                : 'bg-yellow-100 border-yellow-500'
            } border`}
          >
            <h3 className="font-bold">{result.name}: {result.status.toUpperCase()}</h3>
            <p>{result.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
} 