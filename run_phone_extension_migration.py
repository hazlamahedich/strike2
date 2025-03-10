#!/usr/bin/env python3
"""
Script to run the phone extension migration.
This adds phone_extension fields to the leads and contacts tables.
"""
import os
import sys
import logging
import asyncio
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Get database connection details from environment or use defaults
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'postgres')
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'postgres')

async def run_migration():
    """Run the phone extension migration SQL script"""
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
        
        # Create a cursor
        cursor = conn.cursor()
        
        # Read the migration SQL
        with open('add_phone_extension.sql', 'r') as f:
            migration_sql = f.read()
        
        # Execute the migration
        logger.info("Running phone extension migration...")
        cursor.execute(migration_sql)
        
        # Close the cursor and connection
        cursor.close()
        conn.close()
        
        logger.info("Migration completed successfully!")
        return True
    except Exception as e:
        logger.error(f"Migration failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = asyncio.run(run_migration())
    sys.exit(0 if success else 1) 