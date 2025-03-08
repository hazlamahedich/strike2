"""
Script to run the chatbot schema SQL using psycopg2 directly.
"""

import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def main():
    """Run the chatbot schema SQL."""
    # Get database connection details from environment variables
    db_host = os.getenv("SUPABASE_DB_HOST", "localhost")
    db_port = os.getenv("SUPABASE_DB_PORT", "5432")
    db_name = os.getenv("SUPABASE_DB_NAME", "postgres")
    db_user = os.getenv("SUPABASE_DB_USER", "postgres")
    db_password = os.getenv("SUPABASE_DB_PASSWORD", "postgres")
    
    # Connect to the database
    conn = psycopg2.connect(
        host=db_host,
        port=db_port,
        dbname=db_name,
        user=db_user,
        password=db_password
    )
    
    # Set autocommit mode
    conn.autocommit = True
    
    # Create a cursor
    cur = conn.cursor()
    
    try:
        # Read the SQL file
        with open('chatbot_schema.sql', 'r') as f:
            sql = f.read()
        
        print("Running chatbot schema SQL...")
        
        # Execute the SQL
        cur.execute(sql)
        
        print("Chatbot schema SQL executed successfully.")
    except Exception as e:
        print(f"Error executing SQL: {e}")
    finally:
        # Close the cursor and connection
        cur.close()
        conn.close()

if __name__ == "__main__":
    main() 