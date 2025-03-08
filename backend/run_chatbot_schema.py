"""
Script to run the chatbot schema SQL.
"""

import asyncio
from app.core.database import execute_raw_sql

async def main():
    """Run the chatbot schema SQL."""
    with open('chatbot_schema.sql', 'r') as f:
        sql = f.read()
    
    print("Running chatbot schema SQL...")
    await execute_raw_sql(sql)
    print("Chatbot schema SQL executed successfully.")

if __name__ == "__main__":
    asyncio.run(main()) 