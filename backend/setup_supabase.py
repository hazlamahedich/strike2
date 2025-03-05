#!/usr/bin/env python3
"""
Supabase Database Setup Script

This script helps set up the Supabase database for the AI-Powered CRM system.
It reads the SQL files and executes them against the Supabase database.

Usage:
    python setup_supabase.py [--schema-only | --seed-only] [--local | --cloud]

Options:
    --schema-only    Only create the schema (tables, indexes, etc.)
    --seed-only     Only seed the database with initial data
    --local         Use local Supabase instance (default)
    --cloud         Use cloud Supabase instance
"""

import os
import sys
import argparse
import supabase
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_supabase_client(use_cloud=False):
    """Get a Supabase client instance"""
    if use_cloud:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")
        
        if not supabase_url or not supabase_key:
            print("Error: SUPABASE_URL and SUPABASE_KEY environment variables must be set for cloud mode.")
            print("Please check your .env file or set these variables in your environment.")
            sys.exit(1)
    else:
        supabase_url = os.getenv("SUPABASE_LOCAL_URL", "http://localhost:8080")
        supabase_key = os.getenv("SUPABASE_LOCAL_KEY", "postgres")
    
    return supabase.create_client(supabase_url, supabase_key)

def get_postgres_connection(use_cloud=False):
    """Get a direct PostgreSQL connection for more complex SQL operations"""
    if use_cloud:
        # For cloud Supabase, you would need to get the connection details from your Supabase dashboard
        # This is a simplified example and may need to be adjusted based on your Supabase setup
        db_host = os.getenv("SUPABASE_DB_HOST")
        db_port = os.getenv("SUPABASE_DB_PORT", "5432")
        db_name = os.getenv("SUPABASE_DB_NAME")
        db_user = os.getenv("SUPABASE_DB_USER")
        db_password = os.getenv("SUPABASE_DB_PASSWORD")
        
        if not all([db_host, db_name, db_user, db_password]):
            print("Error: Database connection details must be set for cloud mode.")
            print("Please check your .env file or set these variables in your environment.")
            sys.exit(1)
    else:
        # For local Supabase, use the default PostgreSQL connection details
        db_host = os.getenv("SUPABASE_DB_HOST", "localhost")
        db_port = os.getenv("SUPABASE_DB_PORT", "5432")
        db_name = os.getenv("SUPABASE_DB_NAME", "postgres")
        db_user = os.getenv("SUPABASE_DB_USER", "postgres")
        db_password = os.getenv("SUPABASE_DB_PASSWORD", "postgres")
    
    try:
        conn = psycopg2.connect(
            host=db_host,
            port=db_port,
            dbname=db_name,
            user=db_user,
            password=db_password
        )
        return conn
    except Exception as e:
        print(f"Error connecting to PostgreSQL: {e}")
        sys.exit(1)

def read_sql_file(file_path):
    """Read SQL file and return its contents"""
    try:
        with open(file_path, 'r') as file:
            return file.read()
    except FileNotFoundError:
        print(f"Error: SQL file not found: {file_path}")
        sys.exit(1)

def execute_sql(sql, use_cloud=False):
    """Execute SQL statements using direct PostgreSQL connection"""
    conn = get_postgres_connection(use_cloud)
    cursor = conn.cursor()
    
    try:
        # Execute the SQL statements
        cursor.execute(sql)
        conn.commit()
        print("SQL executed successfully.")
    except Exception as e:
        conn.rollback()
        print(f"Error executing SQL: {e}")
        sys.exit(1)
    finally:
        cursor.close()
        conn.close()

def setup_database(schema_only=False, seed_only=False, use_cloud=False):
    """Set up the database by executing SQL files"""
    # Define paths to SQL files
    schema_file = os.path.join(os.path.dirname(__file__), 'supabase_schema.sql')
    seed_file = os.path.join(os.path.dirname(__file__), 'supabase_seed.sql')
    
    # Execute schema SQL if not seed_only
    if not seed_only:
        print("Creating database schema...")
        schema_sql = read_sql_file(schema_file)
        execute_sql(schema_sql, use_cloud)
        print("Database schema created successfully.")
    
    # Execute seed SQL if not schema_only
    if not schema_only:
        print("Seeding database with initial data...")
        seed_sql = read_sql_file(seed_file)
        execute_sql(seed_sql, use_cloud)
        print("Database seeded successfully.")
    
    print("Database setup completed.")

def main():
    """Main function to parse arguments and set up the database"""
    parser = argparse.ArgumentParser(description='Set up the Supabase database for the AI-Powered CRM system.')
    
    # Schema and seed options
    group1 = parser.add_mutually_exclusive_group()
    group1.add_argument('--schema-only', action='store_true', help='Only create the schema (tables, indexes, etc.)')
    group1.add_argument('--seed-only', action='store_true', help='Only seed the database with initial data')
    
    # Environment options
    group2 = parser.add_mutually_exclusive_group()
    group2.add_argument('--local', action='store_true', help='Use local Supabase instance (default)')
    group2.add_argument('--cloud', action='store_true', help='Use cloud Supabase instance')
    
    args = parser.parse_args()
    
    # Determine whether to use cloud or local
    use_cloud = args.cloud
    
    setup_database(schema_only=args.schema_only, seed_only=args.seed_only, use_cloud=use_cloud)

if __name__ == '__main__':
    main() 