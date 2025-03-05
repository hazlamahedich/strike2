import logging
import asyncpg
import json
from typing import Dict, List, Optional, Any, Union, Tuple, AsyncGenerator
from contextlib import asynccontextmanager

from supabase.client import create_client, Client as SupabaseClient

from ..core.config import settings
from ..core.exceptions import DatabaseException, ResourceNotFoundException

logger = logging.getLogger(__name__)

# Connection pool for asyncpg
pool = None

def get_supabase_client() -> SupabaseClient:
    """Get a Supabase client using the settings"""
    try:
        return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    except Exception as e:
        logger.error(f"Error creating Supabase client: {e}")
        raise

@asynccontextmanager
async def get_db_client() -> AsyncGenerator[SupabaseClient, None]:
    """Get a database client from Supabase"""
    client = get_supabase_client()
    try:
        yield client
    finally:
        # No explicit cleanup needed as Supabase client doesn't have a close method
        pass

async def init_db():
    """Initialize the database connection pool"""
    global pool
    if pool is None:
        try:
            pool = await asyncpg.create_pool(
                dsn=settings.DATABASE_URL,
                min_size=settings.DB_MIN_CONNECTIONS,
                max_size=settings.DB_MAX_CONNECTIONS
            )
            logger.info("Database connection pool initialized")
        except Exception as e:
            logger.error(f"Failed to initialize database connection pool: {e}")
            raise DatabaseException(f"Database initialization error: {str(e)}")

@asynccontextmanager
async def get_connection():
    """Get a connection from the pool"""
    global pool
    if pool is None:
        await init_db()
    
    try:
        async with pool.acquire() as conn:
            yield conn
    except asyncpg.PostgresError as e:
        logger.error(f"Database connection error: {e}")
        raise DatabaseException(f"Database connection error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error getting database connection: {e}")
        raise DatabaseException(f"Database connection error: {str(e)}")

async def fetch_one(
    query: str, 
    *values: Any,
    raise_if_empty: bool = False,
    error_message: str = "Record not found"
) -> Optional[Dict[str, Any]]:
    """
    Execute a query and return a single row as a dictionary
    
    Args:
        query: SQL query to execute
        values: Values for the query parameters
        raise_if_empty: Whether to raise an exception if no record is found
        error_message: Error message to use when raising an exception
        
    Returns:
        Dictionary with column names as keys, or None if no record found
        
    Raises:
        DatabaseException: If a database error occurs
        ResourceNotFoundException: If raise_if_empty is True and no record is found
    """
    try:
        async with get_connection() as conn:
            row = await conn.fetchrow(query, *values)
            
            if row is None:
                if raise_if_empty:
                    raise ResourceNotFoundException(error_message)
                return None
            
            return dict(row)
    except DatabaseException:
        raise
    except Exception as e:
        logger.error(f"Database error in fetch_one: {e}")
        raise DatabaseException(f"Failed to execute query: {str(e)}")

async def fetch_all(
    query: str, 
    *values: Any
) -> List[Dict[str, Any]]:
    """
    Execute a query and return all rows as dictionaries
    
    Args:
        query: SQL query to execute
        values: Values for the query parameters
        
    Returns:
        List of dictionaries with column names as keys
        
    Raises:
        DatabaseException: If a database error occurs
    """
    try:
        async with get_connection() as conn:
            rows = await conn.fetch(query, *values)
            return [dict(row) for row in rows]
    except Exception as e:
        logger.error(f"Database error in fetch_all: {e}")
        raise DatabaseException(f"Failed to execute query: {str(e)}")

async def execute(
    query: str, 
    *values: Any
) -> str:
    """
    Execute a query that doesn't return rows
    
    Args:
        query: SQL query to execute
        values: Values for the query parameters
        
    Returns:
        Command tag string
        
    Raises:
        DatabaseException: If a database error occurs
    """
    try:
        async with get_connection() as conn:
            return await conn.execute(query, *values)
    except Exception as e:
        logger.error(f"Database error in execute: {e}")
        raise DatabaseException(f"Failed to execute query: {str(e)}")

async def insert_row(
    table: str, 
    data: Dict[str, Any], 
    returning: str = "id"
) -> Any:
    """
    Insert a row into a table and return a value
    
    Args:
        table: Table name
        data: Dictionary of column:value pairs
        returning: Column to return from the inserted row
        
    Returns:
        Value of the returning column
        
    Raises:
        DatabaseException: If a database error occurs
    """
    columns = list(data.keys())
    values = list(data.values())
    
    placeholder_str = ', '.join(f'${i+1}' for i in range(len(values)))
    column_str = ', '.join(columns)
    
    query = f"""
        INSERT INTO {table} ({column_str})
        VALUES ({placeholder_str})
        RETURNING {returning}
    """
    
    try:
        async with get_connection() as conn:
            result = await conn.fetchval(query, *values)
            return result
    except Exception as e:
        logger.error(f"Database error in insert_row: {e}")
        raise DatabaseException(f"Failed to insert row into {table}: {str(e)}")

async def update_row(
    table: str, 
    id_value: Union[int, str], 
    data: Dict[str, Any], 
    id_column: str = "id",
    returning: str = "id"
) -> Any:
    """
    Update a row in a table and return a value
    
    Args:
        table: Table name
        id_value: Value of the ID column
        data: Dictionary of column:value pairs to update
        id_column: Name of the ID column
        returning: Column to return from the updated row
        
    Returns:
        Value of the returning column
        
    Raises:
        DatabaseException: If a database error occurs
    """
    if not data:
        raise ValueError("No data provided for update")
    
    columns = list(data.keys())
    values = list(data.values())
    
    # Add ID value to the end of values
    values.append(id_value)
    
    # Create set clause like "column1 = $1, column2 = $2"
    set_clause = ', '.join(f'{col} = ${i+1}' for i, col in enumerate(columns))
    
    query = f"""
        UPDATE {table}
        SET {set_clause}
        WHERE {id_column} = ${len(values)}
        RETURNING {returning}
    """
    
    try:
        async with get_connection() as conn:
            result = await conn.fetchval(query, *values)
            
            if result is None:
                raise ResourceNotFoundException(f"Record with {id_column}={id_value} not found")
            
            return result
    except ResourceNotFoundException:
        raise
    except Exception as e:
        logger.error(f"Database error in update_row: {e}")
        raise DatabaseException(f"Failed to update row in {table}: {str(e)}")

async def delete_row(
    table: str, 
    id_value: Union[int, str], 
    id_column: str = "id"
) -> bool:
    """
    Delete a row from a table
    
    Args:
        table: Table name
        id_value: Value of the ID column
        id_column: Name of the ID column
        
    Returns:
        True if a row was deleted, False if not
        
    Raises:
        DatabaseException: If a database error occurs
    """
    query = f"""
        DELETE FROM {table}
        WHERE {id_column} = $1
        RETURNING {id_column}
    """
    
    try:
        async with get_connection() as conn:
            result = await conn.fetchval(query, id_value)
            return result is not None
    except Exception as e:
        logger.error(f"Database error in delete_row: {e}")
        raise DatabaseException(f"Failed to delete row from {table}: {str(e)}")

async def execute_transaction(queries: List[Tuple[str, Tuple]]) -> None:
    """
    Execute multiple queries in a transaction
    
    Args:
        queries: List of (query, values) tuples
        
    Raises:
        DatabaseException: If a database error occurs
    """
    try:
        async with get_connection() as conn:
            async with conn.transaction():
                for query, values in queries:
                    await conn.execute(query, *values)
    except Exception as e:
        logger.error(f"Database error in execute_transaction: {e}")
        raise DatabaseException(f"Failed to execute transaction: {str(e)}")

async def execute_rpc(function_name: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Execute a stored procedure/function in the database"""
    client = get_supabase_client()
    response = client.rpc(function_name, params).execute()
    return response.data

async def execute_raw_sql(sql: str, params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    """Execute raw SQL query (use with caution)"""
    client = get_supabase_client()
    
    # This is a simplified approach and may not work for all SQL statements
    # For complex operations, you might need to use the Postgres connection directly
    response = client.rpc('exec_sql', {'sql': sql, 'params': params or {}}).execute()
    return response.data 