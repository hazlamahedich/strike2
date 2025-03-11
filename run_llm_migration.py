#!/usr/bin/env python3
import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection parameters
DB_HOST = os.getenv("SUPABASE_DB_HOST", "localhost")
DB_PORT = os.getenv("SUPABASE_DB_PORT", "5432")
DB_NAME = os.getenv("SUPABASE_DB_NAME", "postgres")
DB_USER = os.getenv("SUPABASE_DB_USER", "postgres")
DB_PASSWORD = os.getenv("SUPABASE_DB_PASSWORD", "postgres")

# OpenAI API key for default model
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

def run_migration():
    """Run the LLM tables migration"""
    print("Running LLM tables migration...")
    
    try:
        # Connect to the database
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Read the migration SQL
        with open('add_llm_tables.sql', 'r') as f:
            sql = f.read()
        
        # Set the OpenAI API key as a session variable
        cursor.execute(f"SET app.openai_api_key = '{OPENAI_API_KEY}'")
        
        # Execute the migration
        cursor.execute(sql)
        
        # Close the connection
        cursor.close()
        conn.close()
        
        print("LLM tables migration completed successfully!")
        return True
    except Exception as e:
        print(f"Error running LLM tables migration: {e}")
        return False

if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1) 