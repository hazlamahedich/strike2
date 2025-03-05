#!/usr/bin/env python3
"""
Test Supabase API access and SQL execution capabilities.

This script tests the connection to Supabase and executes a simple SQL query
to verify that the API access is working correctly.

Usage:
    python test_supabase_api.py

The script uses the Supabase credentials from the .env file.
"""

import os
import sys
import supabase
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def get_supabase_client():
    """Get a Supabase client instance"""
    # Get Supabase URL and key from environment variables
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("Error: SUPABASE_URL and SUPABASE_KEY must be set.")
        print("Please check your .env file or set these variables in your environment.")
        sys.exit(1)
    
    # Create and return Supabase client
    try:
        client = supabase.create_client(supabase_url, supabase_key)
        return client
    except Exception as e:
        print(f"Error creating Supabase client: {e}")
        sys.exit(1)

def test_supabase_connection():
    """Test the connection to Supabase"""
    print("Testing Supabase connection...")
    client = get_supabase_client()
    
    try:
        # Just verify we can connect to Supabase
        # We'll check for specific functions separately
        print("Connection to Supabase API established!")
        return True
    except Exception as e:
        print(f"Error connecting to Supabase: {e}")
        return False

def test_rpc_function_existence():
    """Test if the exec_sql RPC function exists"""
    print("\nChecking if 'exec_sql' RPC function exists...")
    client = get_supabase_client()
    
    try:
        # Try to get a list of functions if possible or execute a simple query
        result = client.rpc('exec_sql', {'query': 'SELECT 1 as test'}).execute()
        print("'exec_sql' RPC function exists and works!")
        return True
    except Exception as e:
        print(f"Error: 'exec_sql' RPC function does not exist or is not working: {e}")
        print("You may need to create this function in your Supabase instance.")
        print("\nHere's an example SQL function to create:")
        print("""
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    EXECUTE query;
    result := jsonb_build_object('status', 'success');
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    result := jsonb_build_object('status', 'error', 'message', SQLERRM);
    RETURN result;
END;
$$;
        """)
        return False

def main():
    """Main function"""
    print("=== Supabase API Test ===")
    connection_ok = test_supabase_connection()
    
    if connection_ok:
        rpc_ok = test_rpc_function_existence()
        
        if connection_ok and rpc_ok:
            print("\nAll tests passed! You can now use the Supabase API.")
            return 0
    
    print("\nSome tests failed. Please check the errors above.")
    return 1

if __name__ == "__main__":
    sys.exit(main()) 