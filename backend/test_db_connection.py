#!/usr/bin/env python3
"""
Supabase Database Connection Test Script

This script tests the connection to the Supabase database.
It can be used to verify that the database is properly configured.

Usage:
    python test_db_connection.py [--local | --cloud]

Options:
    --local    Use local Supabase instance (default)
    --cloud    Use cloud Supabase instance
"""

import os
import sys
import argparse
import supabase
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_supabase_connection(use_cloud=False):
    """Test the Supabase REST API connection"""
    try:
        if use_cloud:
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_KEY")
            
            if not supabase_url or not supabase_key:
                print("Error: SUPABASE_URL and SUPABASE_KEY environment variables must be set for cloud mode.")
                print("Please check your .env file or set these variables in your environment.")
                return False
        else:
            supabase_url = os.getenv("SUPABASE_LOCAL_URL", "http://localhost:8080")
            supabase_key = os.getenv("SUPABASE_LOCAL_KEY", "postgres")
        
        client = supabase.create_client(supabase_url, supabase_key)
        
        # Try to fetch a simple query to test the connection
        response = client.table('users').select('id').limit(1).execute()
        
        print("Supabase REST API connection successful!")
        return True
    except Exception as e:
        print(f"Error connecting to Supabase REST API: {e}")
        return False

def test_postgres_connection(use_cloud=False):
    """Test the direct PostgreSQL connection"""
    try:
        if use_cloud:
            # For cloud Supabase, you would need to get the connection details from your Supabase dashboard
            db_host = os.getenv("SUPABASE_DB_HOST")
            db_port = os.getenv("SUPABASE_DB_PORT", "5432")
            db_name = os.getenv("SUPABASE_DB_NAME")
            db_user = os.getenv("SUPABASE_DB_USER")
            db_password = os.getenv("SUPABASE_DB_PASSWORD")
            
            if not all([db_host, db_name, db_user, db_password]):
                print("Error: Database connection details must be set for cloud mode.")
                print("Please check your .env file or set these variables in your environment.")
                return False
        else:
            # For local Supabase, use the default PostgreSQL connection details
            db_host = os.getenv("SUPABASE_DB_HOST", "localhost")
            db_port = os.getenv("SUPABASE_DB_PORT", "5432")
            db_name = os.getenv("SUPABASE_DB_NAME", "postgres")
            db_user = os.getenv("SUPABASE_DB_USER", "postgres")
            db_password = os.getenv("SUPABASE_DB_PASSWORD", "postgres")
        
        conn = psycopg2.connect(
            host=db_host,
            port=db_port,
            dbname=db_name,
            user=db_user,
            password=db_password
        )
        
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        db_version = cursor.fetchone()
        
        print(f"PostgreSQL connection successful!")
        print(f"PostgreSQL version: {db_version[0]}")
        
        cursor.close()
        conn.close()
        
        return True
    except Exception as e:
        print(f"Error connecting to PostgreSQL: {e}")
        return False

def main():
    """Main function to parse arguments and test the database connection"""
    parser = argparse.ArgumentParser(description='Test the Supabase database connection.')
    
    # Environment options
    group = parser.add_mutually_exclusive_group()
    group.add_argument('--local', action='store_true', help='Use local Supabase instance (default)')
    group.add_argument('--cloud', action='store_true', help='Use cloud Supabase instance')
    
    args = parser.parse_args()
    
    # Determine whether to use cloud or local
    use_cloud = args.cloud
    
    print(f"Testing {'cloud' if use_cloud else 'local'} Supabase connection...")
    
    # Test Supabase REST API connection
    supabase_success = test_supabase_connection(use_cloud)
    
    # Test PostgreSQL connection
    postgres_success = test_postgres_connection(use_cloud)
    
    if supabase_success and postgres_success:
        print("\nAll database connections successful!")
        sys.exit(0)
    else:
        print("\nSome database connections failed. Please check the error messages above.")
        sys.exit(1)

if __name__ == '__main__':
    main() 