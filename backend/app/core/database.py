import supabase
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Dict, List, Any, Optional

from app.core.config import settings

# Initialize Supabase client
def get_supabase_client():
    """Get a Supabase client instance based on environment configuration"""
    if settings.SUPABASE_ENV.lower() == 'local':
        # Use local Supabase instance
        return supabase.create_client(settings.SUPABASE_LOCAL_URL, settings.SUPABASE_LOCAL_KEY)
    else:
        # Use cloud Supabase instance
        return supabase.create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

@asynccontextmanager
async def get_db_client() -> AsyncGenerator[supabase.Client, None]:
    """
    Async context manager for database operations
    """
    client = get_supabase_client()
    try:
        yield client
    finally:
        # No explicit cleanup needed for Supabase REST client
        pass

# Utility functions for common database operations

async def fetch_one(
    table: str, 
    query_params: Dict[str, Any] = None, 
    select: str = "*"
) -> Optional[Dict[str, Any]]:
    """Fetch a single row from the database"""
    client = get_supabase_client()
    query = client.table(table).select(select)
    
    if query_params:
        for key, value in query_params.items():
            query = query.eq(key, value)
            
    response = query.limit(1).execute()
    
    if response.data and len(response.data) > 0:
        return response.data[0]
    return None

async def fetch_all(
    table: str, 
    query_params: Dict[str, Any] = None, 
    select: str = "*",
    order_by: Optional[Dict[str, str]] = None,
    limit: Optional[int] = None,
    offset: Optional[int] = None
) -> List[Dict[str, Any]]:
    """Fetch multiple rows from the database with optional filtering and pagination"""
    client = get_supabase_client()
    query = client.table(table).select(select)
    
    if query_params:
        for key, value in query_params.items():
            # Handle different operators (eq, gt, lt, etc.)
            if isinstance(value, dict) and "operator" in value and "value" in value:
                op = value["operator"]
                val = value["value"]
                if op == "eq":
                    query = query.eq(key, val)
                elif op == "neq":
                    query = query.neq(key, val)
                elif op == "gt":
                    query = query.gt(key, val)
                elif op == "lt":
                    query = query.lt(key, val)
                elif op == "gte":
                    query = query.gte(key, val)
                elif op == "lte":
                    query = query.lte(key, val)
                elif op == "like":
                    query = query.like(key, val)
                elif op == "ilike":
                    query = query.ilike(key, val)
                elif op == "in":
                    query = query.in_(key, val)
            else:
                query = query.eq(key, value)
    
    if order_by:
        for column, direction in order_by.items():
            if direction.lower() == "desc":
                query = query.order(column, desc=True)
            else:
                query = query.order(column)
    
    if limit is not None:
        query = query.limit(limit)
        
    if offset is not None:
        query = query.range(offset, offset + (limit or 20) - 1)
    
    response = query.execute()
    return response.data

async def insert_row(table: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Insert a row into the database"""
    client = get_supabase_client()
    response = client.table(table).insert(data).execute()
    if response.data and len(response.data) > 0:
        return response.data[0]
    return {}

async def update_row(table: str, id_value: Any, data: Dict[str, Any], id_column: str = "id") -> Dict[str, Any]:
    """Update a row in the database"""
    client = get_supabase_client()
    response = client.table(table).update(data).eq(id_column, id_value).execute()
    if response.data and len(response.data) > 0:
        return response.data[0]
    return {}

async def delete_row(table: str, id_value: Any, id_column: str = "id") -> bool:
    """Delete a row from the database"""
    client = get_supabase_client()
    response = client.table(table).delete().eq(id_column, id_value).execute()
    return len(response.data) > 0

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