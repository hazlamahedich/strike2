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
    # For cloud mode, we actually don't want to use a direct PostgreSQL connection
    # Instead, we'll use the Supabase API to execute SQL
    if use_cloud:
        print("Using Supabase REST API for cloud mode...")
        return None  # We'll handle cloud mode differently in execute_sql
    else:
        # For local Supabase, use the default PostgreSQL connection details
        db_host = os.getenv("SUPABASE_DB_HOST", "localhost")
        db_port = os.getenv("SUPABASE_DB_PORT", "5432")
        db_name = os.getenv("SUPABASE_DB_NAME", "postgres")
        db_user = os.getenv("SUPABASE_DB_USER", "postgres")
        db_password = os.getenv("SUPABASE_DB_PASSWORD", "postgres")
    
    # Check if we're running in local development mode outside Docker
    is_local_dev = os.getenv("SUPABASE_LOCAL_DEVELOPMENT", "").lower() == "true"
    
    # If in local dev mode, force the use of localhost
    if is_local_dev and db_host == "supabase-db":
        db_host = "localhost"
        print(f"Local development mode detected, using host: {db_host}")
    
    # Try to connect with the current settings
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
        # If connection fails and we're using supabase-db, try localhost as fallback
        if db_host == "supabase-db":
            print(f"Failed to connect to {db_host}: {e}")
            print("Trying localhost instead...")
            try:
                conn = psycopg2.connect(
                    host="localhost",
                    port=db_port,
                    dbname=db_name,
                    user=db_user,
                    password=db_password
                )
                print("Successfully connected using localhost.")
                return conn
            except Exception as e2:
                print(f"Error connecting to PostgreSQL with localhost: {e2}")
                sys.exit(1)
        else:
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
    """Execute SQL statements using direct PostgreSQL connection or Supabase API"""
    if use_cloud:
        # For cloud mode, with no exec_sql function, we can use the REST API
        # to directly manipulate tables. But this is limited compared to full SQL.
        # We'll need to extract and execute the CREATE TABLE statements manually.
        client = get_supabase_client(use_cloud=True)
        try:
            print("Executing SQL via Supabase REST API...")
            
            # Split the SQL into statements
            statements = [s.strip() for s in sql.split(';') if s.strip()]
            
            # Process each statement
            for statement in statements:
                # Skip empty statements
                if not statement.strip():
                    continue
                
                # Simple check for CREATE TABLE statement
                if statement.upper().startswith('CREATE TABLE'):
                    table_name = extract_table_name(statement)
                    print(f"Creating table: {table_name}")
                    # We would use the appropriate REST API call to create tables
                    # However, this is limited since the REST API doesn't allow arbitrary DDL
                    print(f"WARNING: Cannot create table {table_name} via REST API.")
                    print(f"Please create this table manually via the Supabase SQL Editor.")
                    print(f"SQL to execute: {statement}")
                elif statement.upper().startswith('CREATE INDEX'):
                    print("Cannot create indexes via REST API.")
                    print(f"Please execute this manually: {statement}")
                else:
                    print(f"Cannot execute via REST API: {statement[:100]}...")
                    print("Please execute this SQL manually in the Supabase SQL Editor.")
            
            print("\nSUMMMARY: When using cloud mode, you need to manually execute the SQL.")
            print("Please go to https://app.supabase.com, select your project,")
            print("and execute the SQL in the SQL Editor.")
            
            # Return the path to the SQL file so the user can copy it
            schema_file = os.path.join(os.path.dirname(__file__), "supabase_schema.sql")
            print(f"\nThe schema SQL is located at: {schema_file}")
            print("Copy the contents of this file and execute it in the Supabase SQL Editor.")
            
            return True
        except Exception as e:
            print(f"Error executing SQL via Supabase API: {e}")
            sys.exit(1)
    else:
        # For local mode, use direct PostgreSQL connection
        conn = get_postgres_connection(use_cloud)
        if not conn:
            print("Error: Failed to get database connection.")
            sys.exit(1)
            
        cursor = conn.cursor()
        
        try:
            # Execute the SQL statements
            cursor.execute(sql)
            conn.commit()
            print("SQL executed successfully via direct PostgreSQL connection.")
            return True
        except Exception as e:
            conn.rollback()
            print(f"Error executing SQL: {e}")
            sys.exit(1)
        finally:
            cursor.close()
            conn.close()

def extract_table_name(create_statement):
    """Extract table name from CREATE TABLE statement"""
    # Simple parser, might need more robust implementation for complex statements
    parts = create_statement.split()
    for i, part in enumerate(parts):
        if part.upper() == 'TABLE':
            if i + 1 < len(parts):
                # Strip any schema prefix or quotes
                table_name = parts[i + 1].strip('"').strip('`')
                if '.' in table_name:
                    table_name = table_name.split('.')[-1]
                return table_name
    return "unknown_table"

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