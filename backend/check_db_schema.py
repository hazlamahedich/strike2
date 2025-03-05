#!/usr/bin/env python3
"""
Supabase Database Schema Check Script

This script checks the database schema to verify that all tables and indexes exist.
It can be used to verify that the database schema is properly set up.

Usage:
    python check_db_schema.py [--local | --cloud]

Options:
    --local    Use local Supabase instance (default)
    --cloud    Use cloud Supabase instance
"""

import os
import sys
import argparse
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_postgres_connection(use_cloud=False):
    """Get a direct PostgreSQL connection"""
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
                sys.exit(1)
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
        return conn
    except Exception as e:
        print(f"Error connecting to PostgreSQL: {e}")
        sys.exit(1)

def check_tables(conn):
    """Check if all required tables exist in the database"""
    required_tables = [
        'users',
        'teams',
        'leads',
        'pipeline_stages',
        'lead_status_history',
        'tasks',
        'task_notes',
        'emails',
        'calls',
        'sms',
        'meetings',
        'notes',
        'activities',
        'integrations',
        'campaigns',
        'campaign_leads',
        'lead_scores',
        'recordings',
        'profiles'
    ]
    
    cursor = conn.cursor()
    
    try:
        # Get all tables in the public schema
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        
        existing_tables = [row[0] for row in cursor.fetchall()]
        
        # Check if all required tables exist
        missing_tables = [table for table in required_tables if table not in existing_tables]
        
        if missing_tables:
            print(f"Missing tables: {', '.join(missing_tables)}")
            return False
        else:
            print(f"All required tables exist: {', '.join(required_tables)}")
            return True
    except Exception as e:
        print(f"Error checking tables: {e}")
        return False
    finally:
        cursor.close()

def check_indexes(conn):
    """Check if all required indexes exist in the database"""
    required_indexes = [
        'idx_leads_owner',
        'idx_leads_team',
        'idx_leads_status',
        'idx_leads_email',
        'idx_tasks_assigned_to',
        'idx_tasks_lead_id',
        'idx_activities_lead_id',
        'idx_activities_user_id',
        'idx_campaign_leads_campaign_id',
        'idx_campaign_leads_lead_id',
        'idx_leads_name_trgm',
        'idx_leads_company_trgm',
        'idx_leads_email_trgm'
    ]
    
    cursor = conn.cursor()
    
    try:
        # Get all indexes in the database
        cursor.execute("""
            SELECT indexname 
            FROM pg_indexes 
            WHERE schemaname = 'public'
        """)
        
        existing_indexes = [row[0] for row in cursor.fetchall()]
        
        # Check if all required indexes exist
        missing_indexes = [index for index in required_indexes if index not in existing_indexes]
        
        if missing_indexes:
            print(f"Missing indexes: {', '.join(missing_indexes)}")
            return False
        else:
            print(f"All required indexes exist: {', '.join(required_indexes)}")
            return True
    except Exception as e:
        print(f"Error checking indexes: {e}")
        return False
    finally:
        cursor.close()

def check_triggers(conn):
    """Check if all required triggers exist in the database"""
    required_triggers = [
        'update_users_timestamp',
        'update_teams_timestamp',
        'update_leads_timestamp',
        'update_pipeline_stages_timestamp',
        'update_tasks_timestamp',
        'update_task_notes_timestamp',
        'update_notes_timestamp',
        'update_integrations_timestamp',
        'update_campaigns_timestamp',
        'update_profiles_timestamp',
        'log_lead_status_change',
        'log_email_activity',
        'log_call_activity',
        'log_sms_activity',
        'log_meeting_activity',
        'log_note_activity',
        'log_task_activity'
    ]
    
    cursor = conn.cursor()
    
    try:
        # Get all triggers in the database
        cursor.execute("""
            SELECT trigger_name 
            FROM information_schema.triggers 
            WHERE trigger_schema = 'public'
        """)
        
        existing_triggers = [row[0] for row in cursor.fetchall()]
        
        # Check if all required triggers exist
        missing_triggers = [trigger for trigger in required_triggers if trigger not in existing_triggers]
        
        if missing_triggers:
            print(f"Missing triggers: {', '.join(missing_triggers)}")
            return False
        else:
            print(f"All required triggers exist: {', '.join(required_triggers)}")
            return True
    except Exception as e:
        print(f"Error checking triggers: {e}")
        return False
    finally:
        cursor.close()

def check_row_count(conn):
    """Check the row count for each table"""
    tables = [
        'users',
        'teams',
        'leads',
        'pipeline_stages',
        'lead_status_history',
        'tasks',
        'task_notes',
        'emails',
        'calls',
        'sms',
        'meetings',
        'notes',
        'activities',
        'integrations',
        'campaigns',
        'campaign_leads',
        'lead_scores',
        'recordings',
        'profiles'
    ]
    
    cursor = conn.cursor()
    
    try:
        print("\nTable row counts:")
        print("-----------------")
        
        for table in tables:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                print(f"{table}: {count} rows")
            except Exception as e:
                print(f"{table}: Error - {e}")
        
        return True
    except Exception as e:
        print(f"Error checking row counts: {e}")
        return False
    finally:
        cursor.close()

def main():
    """Main function to parse arguments and check the database schema"""
    parser = argparse.ArgumentParser(description='Check the Supabase database schema.')
    
    # Environment options
    group = parser.add_mutually_exclusive_group()
    group.add_argument('--local', action='store_true', help='Use local Supabase instance (default)')
    group.add_argument('--cloud', action='store_true', help='Use cloud Supabase instance')
    
    args = parser.parse_args()
    
    # Determine whether to use cloud or local
    use_cloud = args.cloud
    
    print(f"Checking {'cloud' if use_cloud else 'local'} Supabase database schema...")
    
    # Get database connection
    conn = get_postgres_connection(use_cloud)
    
    try:
        # Check tables
        tables_ok = check_tables(conn)
        
        # Check indexes
        indexes_ok = check_indexes(conn)
        
        # Check triggers
        triggers_ok = check_triggers(conn)
        
        # Check row counts
        row_counts_ok = check_row_count(conn)
        
        if tables_ok and indexes_ok and triggers_ok:
            print("\nDatabase schema check passed!")
            sys.exit(0)
        else:
            print("\nDatabase schema check failed. Please check the error messages above.")
            sys.exit(1)
    finally:
        conn.close()

if __name__ == '__main__':
    main() 