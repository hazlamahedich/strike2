#!/usr/bin/env python3
"""
Create the exec_sql function in Supabase.

This script creates a PostgreSQL function in Supabase that allows
executing arbitrary SQL statements via the REST API.

Usage:
    python setup_sql_function.py
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

def create_sql_function():
    """Create the exec_sql function in Supabase"""
    print("Creating exec_sql function in Supabase...")
    
    # SQL statement to create the function
    sql = """
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
    """
    
    # Get Supabase client
    client = get_supabase_client()
    
    try:
        # Try to direct SQL execution through PostgREST
        response = client.post('rest/v1/rpc/exec_sql', {'query': sql})
        print("Function created successfully through RPC call!")
        return True
    except Exception as e:
        print(f"Error using RPC method: {e}")
        
        # Try alternative approach - we can't create functions directly through REST API
        # We need to use SQL Editor in the Supabase dashboard
        print("\nYou need to create the exec_sql function manually in the Supabase SQL Editor.")
        print("Please go to https://app.supabase.com, select your project, and open the SQL Editor.")
        print("Then run the following SQL:")
        print(sql)
        return False

def main():
    """Main function"""
    print("=== Supabase SQL Function Setup ===")
    
    success = create_sql_function()
    
    if success:
        print("\nFunction created successfully!")
        print("You can now use exec_sql to execute SQL statements through the REST API.")
        return 0
    else:
        print("\nFunction creation failed.")
        print("Please follow the instructions above to create the function manually.")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 