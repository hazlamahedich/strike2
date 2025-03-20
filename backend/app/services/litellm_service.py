import os
import json
import uuid
from uuid import UUID
import logging
from typing import Any, Dict, List, Optional, Union, Tuple
from datetime import datetime, timedelta

import litellm
from litellm import completion, acompletion
from litellm.utils import get_token_count
from pydantic import BaseModel

from app.core.config import settings
from app.core.database import get_db, fetch_one, fetch_all, insert_row, update_row
from app.models.ai import LLMModel, LLMProvider, LLMUsageRecord, LLMUsageSummary, LLMSettingsResponse
from app.models.database import DBLLMModel, DBLLMUsageRecord

logger = logging.getLogger(__name__)

# Configure LiteLLM
litellm.cache = settings.LITELLM_CACHE_ENABLED
litellm.cache_folder = settings.LITELLM_CACHE_FOLDER
litellm.telemetry = settings.LITELLM_TELEMETRY
litellm.set_verbose = settings.LITELLM_LOGGING_ENABLED

# Provider to model prefix mapping
PROVIDER_MODEL_PREFIXES = {
    LLMProvider.OPENAI: "gpt-",
    LLMProvider.ANTHROPIC: "claude-",
    LLMProvider.AZURE: "azure/",
    LLMProvider.GOOGLE: "gemini-",
    LLMProvider.COHERE: "command-",
    LLMProvider.HUGGINGFACE: "huggingface/",
    LLMProvider.DEEPSEEK: "deepseek/"
}

async def get_default_model() -> Optional[LLMModel]:
    """Get the default LLM model from the database"""
    db = get_db()
    query = "SELECT * FROM llm_models WHERE is_default = TRUE LIMIT 1"
    result = await fetch_one(db, query)
    
    if not result:
        # If no default model is set, create one with OpenAI
        if settings.OPENAI_API_KEY:
            model = await create_default_openai_model()
            return model
        return None
    
    return LLMModel(
        id=result["id"],
        provider=LLMProvider(result["provider"]),
        model_name=result["model_name"],
        api_key=result["api_key"],
        api_base=result["api_base"],
        api_version=result["api_version"],
        organization_id=result["organization_id"],
        is_default=result["is_default"],
        max_tokens=result["max_tokens"],
        temperature=result["temperature"],
        created_at=result["created_at"],
        updated_at=result["updated_at"]
    )

async def create_default_openai_model() -> LLMModel:
    """Create a default OpenAI model in the database"""
    db = get_db()
    model_data = {
        "provider": LLMProvider.OPENAI.value,
        "model_name": settings.DEFAULT_MODEL,
        "api_key": settings.OPENAI_API_KEY,
        "organization_id": settings.OPENAI_ORGANIZATION,
        "is_default": True,
        "temperature": 0.0
    }
    
    query = """
    INSERT INTO llm_models (provider, model_name, api_key, organization_id, is_default, temperature)
    VALUES (:provider, :model_name, :api_key, :organization_id, :is_default, :temperature)
    RETURNING *
    """
    
    result = await insert_row(db, query, model_data)
    
    return LLMModel(
        id=result["id"],
        provider=LLMProvider(result["provider"]),
        model_name=result["model_name"],
        api_key=result["api_key"],
        api_base=result["api_base"],
        api_version=result["api_version"],
        organization_id=result["organization_id"],
        is_default=result["is_default"],
        max_tokens=result["max_tokens"],
        temperature=result["temperature"],
        created_at=result["created_at"],
        updated_at=result["updated_at"]
    )

async def get_all_models() -> List[LLMModel]:
    """Get all LLM models from the database"""
    db = get_db()
    query = "SELECT * FROM llm_models ORDER BY is_default DESC, created_at DESC"
    results = await fetch_all(db, query)
    
    models = []
    for result in results:
        models.append(LLMModel(
            id=result["id"],
            provider=LLMProvider(result["provider"]),
            model_name=result["model_name"],
            api_key=result["api_key"],
            api_base=result["api_base"],
            api_version=result["api_version"],
            organization_id=result["organization_id"],
            is_default=result["is_default"],
            max_tokens=result["max_tokens"],
            temperature=result["temperature"],
            created_at=result["created_at"],
            updated_at=result["updated_at"]
        ))
    
    return models

async def create_model(model: LLMModel) -> LLMModel:
    """Create a new LLM model in the database"""
    db = get_db()
    
    # If this model is set as default, unset any existing default
    if model.is_default:
        await update_row(db, "UPDATE llm_models SET is_default = FALSE WHERE is_default = TRUE")
    
    model_data = {
        "provider": model.provider.value,
        "model_name": model.model_name,
        "api_key": model.api_key,
        "api_base": model.api_base,
        "api_version": model.api_version,
        "organization_id": model.organization_id,
        "is_default": model.is_default,
        "max_tokens": model.max_tokens,
        "temperature": model.temperature
    }
    
    query = """
    INSERT INTO llm_models (
        provider, model_name, api_key, api_base, api_version, 
        organization_id, is_default, max_tokens, temperature
    )
    VALUES (
        :provider, :model_name, :api_key, :api_base, :api_version, 
        :organization_id, :is_default, :max_tokens, :temperature
    )
    RETURNING *
    """
    
    result = await insert_row(db, query, model_data)
    
    return LLMModel(
        id=result["id"],
        provider=LLMProvider(result["provider"]),
        model_name=result["model_name"],
        api_key=result["api_key"],
        api_base=result["api_base"],
        api_version=result["api_version"],
        organization_id=result["organization_id"],
        is_default=result["is_default"],
        max_tokens=result["max_tokens"],
        temperature=result["temperature"],
        created_at=result["created_at"],
        updated_at=result["updated_at"]
    )

async def update_model(model_id: int, model: LLMModel) -> Optional[LLMModel]:
    """Update an existing LLM model in the database"""
    db = get_db()
    
    # If this model is set as default, unset any existing default
    if model.is_default:
        await update_row(db, "UPDATE llm_models SET is_default = FALSE WHERE is_default = TRUE AND id != :id", {"id": model_id})
    
    model_data = {
        "id": model_id,
        "provider": model.provider.value,
        "model_name": model.model_name,
        "api_key": model.api_key,
        "api_base": model.api_base,
        "api_version": model.api_version,
        "organization_id": model.organization_id,
        "is_default": model.is_default,
        "max_tokens": model.max_tokens,
        "temperature": model.temperature
    }
    
    query = """
    UPDATE llm_models SET
        provider = :provider,
        model_name = :model_name,
        api_key = :api_key,
        api_base = :api_base,
        api_version = :api_version,
        organization_id = :organization_id,
        is_default = :is_default,
        max_tokens = :max_tokens,
        temperature = :temperature,
        updated_at = NOW()
    WHERE id = :id
    RETURNING *
    """
    
    result = await update_row(db, query, model_data)
    
    if not result:
        return None
    
    return LLMModel(
        id=result["id"],
        provider=LLMProvider(result["provider"]),
        model_name=result["model_name"],
        api_key=result["api_key"],
        api_base=result["api_base"],
        api_version=result["api_version"],
        organization_id=result["organization_id"],
        is_default=result["is_default"],
        max_tokens=result["max_tokens"],
        temperature=result["temperature"],
        created_at=result["created_at"],
        updated_at=result["updated_at"]
    )

async def delete_model(model_id: int) -> bool:
    """Delete an LLM model from the database"""
    db = get_db()
    query = "DELETE FROM llm_models WHERE id = :id RETURNING id"
    result = await update_row(db, query, {"id": model_id})
    
    return result is not None

async def get_model_by_id(model_id: int) -> Optional[LLMModel]:
    """Get an LLM model by ID"""
    db = get_db()
    query = "SELECT * FROM llm_models WHERE id = :id"
    result = await fetch_one(db, query, {"id": model_id})
    
    if not result:
        return None
    
    return LLMModel(
        id=result["id"],
        provider=LLMProvider(result["provider"]),
        model_name=result["model_name"],
        api_key=result["api_key"],
        api_base=result["api_base"],
        api_version=result["api_version"],
        organization_id=result["organization_id"],
        is_default=result["is_default"],
        max_tokens=result["max_tokens"],
        temperature=result["temperature"],
        created_at=result["created_at"],
        updated_at=result["updated_at"]
    )

def get_litellm_model_name(model: LLMModel) -> str:
    """Convert a model to the LiteLLM format"""
    if model.provider == LLMProvider.CUSTOM:
        return model.model_name
    
    prefix = PROVIDER_MODEL_PREFIXES.get(model.provider, "")
    
    # Special case for Azure
    if model.provider == LLMProvider.AZURE:
        if model.api_base and model.api_version:
            return f"azure/{model.model_name}"
    
    # If the model name already has the prefix, return as is
    if model.model_name.startswith(prefix):
        return model.model_name
    
    # Otherwise, add the prefix
    return f"{prefix}{model.model_name}"

def get_litellm_params(model: LLMModel) -> Dict[str, Any]:
    """Get the parameters for LiteLLM based on the model"""
    params = {}
    
    # Add API key if provided
    if model.api_key:
        params["api_key"] = model.api_key
    
    # Add organization ID if provided
    if model.organization_id:
        params["organization"] = model.organization_id
    
    # Add API base if provided
    if model.api_base:
        params["api_base"] = model.api_base
    
    # Add API version if provided (for Azure)
    if model.api_version:
        params["api_version"] = model.api_version
    
    # Add max tokens if provided
    if model.max_tokens:
        params["max_tokens"] = model.max_tokens
    
    # Add temperature
    params["temperature"] = model.temperature
    
    return params

async def record_usage(
    model_id: int,
    prompt_tokens: int,
    completion_tokens: int,
    cost: float,
    request_type: str,
    user_id: Optional[UUID] = None,
    request_id: Optional[str] = None,
    success: bool = True,
    error_message: Optional[str] = None,
    metadata: Dict[str, Any] = {}
) -> LLMUsageRecord:
    """Record LLM usage in the database"""
    db = get_db()
    
    usage_data = {
        "model_id": model_id,
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "total_tokens": prompt_tokens + completion_tokens,
        "cost": cost,
        "request_type": request_type,
        "user_id": user_id,
        "request_id": request_id or str(uuid.uuid4()),
        "success": success,
        "error_message": error_message,
        "metadata": json.dumps(metadata)
    }
    
    query = """
    INSERT INTO llm_usage_records (
        model_id, prompt_tokens, completion_tokens, total_tokens,
        cost, request_type, user_id, request_id, success, error_message, metadata
    )
    VALUES (
        :model_id, :prompt_tokens, :completion_tokens, :total_tokens,
        :cost, :request_type, :user_id, :request_id, :success, :error_message, :metadata::jsonb
    )
    RETURNING *
    """
    
    result = await insert_row(db, query, usage_data)
    
    return LLMUsageRecord(
        id=result["id"],
        model_id=result["model_id"],
        prompt_tokens=result["prompt_tokens"],
        completion_tokens=result["completion_tokens"],
        total_tokens=result["total_tokens"],
        cost=result["cost"],
        request_type=result["request_type"],
        user_id=result["user_id"],
        timestamp=result["timestamp"],
        request_id=result["request_id"],
        success=result["success"],
        error_message=result["error_message"],
        metadata=result["metadata"]
    )

async def get_usage_summary(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    user_id: Optional[UUID] = None
) -> LLMUsageSummary:
    """Get a summary of LLM usage"""
    db = get_db()
    
    params = {}
    date_filter = ""
    user_filter = ""
    
    if start_date:
        date_filter += " AND timestamp >= :start_date"
        params["start_date"] = start_date
    
    if end_date:
        date_filter += " AND timestamp <= :end_date"
        params["end_date"] = end_date
    
    if user_id:
        user_filter = " AND user_id = :user_id"
        params["user_id"] = user_id
    
    # Get total requests, tokens, and cost
    summary_query = f"""
    SELECT 
        COUNT(*) as total_requests,
        SUM(total_tokens) as total_tokens,
        SUM(cost) as total_cost
    FROM llm_usage_records
    WHERE success = TRUE{date_filter}{user_filter}
    """
    
    summary_result = await fetch_one(db, summary_query, params)
    
    # Get tokens by model
    tokens_by_model_query = f"""
    SELECT 
        m.model_name,
        SUM(u.total_tokens) as tokens
    FROM llm_usage_records u
    JOIN llm_models m ON u.model_id = m.id
    WHERE u.success = TRUE{date_filter}{user_filter}
    GROUP BY m.model_name
    """
    
    tokens_by_model_results = await fetch_all(db, tokens_by_model_query, params)
    tokens_by_model = {r["model_name"]: r["tokens"] for r in tokens_by_model_results}
    
    # Get cost by model
    cost_by_model_query = f"""
    SELECT 
        m.model_name,
        SUM(u.cost) as cost
    FROM llm_usage_records u
    JOIN llm_models m ON u.model_id = m.id
    WHERE u.success = TRUE{date_filter}{user_filter}
    GROUP BY m.model_name
    """
    
    cost_by_model_results = await fetch_all(db, cost_by_model_query, params)
    cost_by_model = {r["model_name"]: r["cost"] for r in cost_by_model_results}
    
    # Get requests by type
    requests_by_type_query = f"""
    SELECT 
        request_type,
        COUNT(*) as count
    FROM llm_usage_records
    WHERE success = TRUE{date_filter}{user_filter}
    GROUP BY request_type
    """
    
    requests_by_type_results = await fetch_all(db, requests_by_type_query, params)
    requests_by_type = {r["request_type"]: r["count"] for r in requests_by_type_results}
    
    # Get usage by day
    usage_by_day_query = f"""
    SELECT 
        DATE(timestamp) as date,
        SUM(total_tokens) as tokens,
        SUM(cost) as cost
    FROM llm_usage_records
    WHERE success = TRUE{date_filter}{user_filter}
    GROUP BY DATE(timestamp)
    ORDER BY DATE(timestamp)
    """
    
    usage_by_day_results = await fetch_all(db, usage_by_day_query, params)
    usage_by_day = {
        r["date"].isoformat(): {"tokens": r["tokens"], "cost": r["cost"]}
        for r in usage_by_day_results
    }
    
    return LLMUsageSummary(
        total_requests=summary_result["total_requests"] or 0,
        total_tokens=summary_result["total_tokens"] or 0,
        total_cost=summary_result["total_cost"] or 0.0,
        tokens_by_model=tokens_by_model,
        cost_by_model=cost_by_model,
        requests_by_type=requests_by_type,
        usage_by_day=usage_by_day
    )

async def get_settings() -> LLMSettingsResponse:
    """Get LLM settings and usage summary"""
    models = await get_all_models()
    default_model = next((m for m in models if m.is_default), None)
    usage_summary = await get_usage_summary()
    
    return LLMSettingsResponse(
        models=models,
        default_model=default_model,
        usage_summary=usage_summary
    )

async def calculate_cost(
    model_name: str,
    prompt_tokens: int,
    completion_tokens: int
) -> float:
    """Calculate the cost of a request based on the model and tokens"""
    # Use LiteLLM's cost calculation
    try:
        cost = litellm.completion_cost(
            model=model_name,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens
        )
        return cost
    except Exception as e:
        logger.warning(f"Error calculating cost for {model_name}: {str(e)}")
        # Fallback to a simple estimation
        if "gpt-4" in model_name:
            prompt_cost = prompt_tokens * 0.00003
            completion_cost = completion_tokens * 0.00006
        elif "gpt-3.5" in model_name:
            prompt_cost = prompt_tokens * 0.000001
            completion_cost = completion_tokens * 0.000002
        elif "claude" in model_name:
            prompt_cost = prompt_tokens * 0.00001
            completion_cost = completion_tokens * 0.00003
        else:
            # Default fallback
            prompt_cost = prompt_tokens * 0.00001
            completion_cost = completion_tokens * 0.00002
        
        return prompt_cost + completion_cost

async def get_completion(
    prompt: str,
    model_id: Optional[int] = None,
    system_prompt: Optional[str] = None,
    temperature: Optional[float] = None,
    max_tokens: Optional[int] = None,
    request_type: str = "general",
    user_id: Optional[UUID] = None,
    metadata: Dict[str, Any] = {},
    stream: bool = False
) -> Union[str, Dict[str, Any]]:
    """Get a completion from the LLM"""
    # Get the model to use
    model = None
    if model_id:
        model = await get_model_by_id(model_id)
    
    if not model:
        model = await get_default_model()
    
    if not model:
        raise ValueError("No LLM model available")
    
    # Prepare the messages
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    
    messages.append({"role": "user", "content": prompt})
    
    # Prepare the parameters
    params = get_litellm_params(model)
    
    # Override temperature if provided
    if temperature is not None:
        params["temperature"] = temperature
    
    # Override max_tokens if provided
    if max_tokens is not None:
        params["max_tokens"] = max_tokens
    
    # Get the model name in LiteLLM format
    model_name = get_litellm_model_name(model)
    
    # Generate a request ID
    request_id = str(uuid.uuid4())
    
    try:
        # Count tokens in the prompt
        prompt_tokens = get_token_count(model_name, messages)
        
        # Make the request
        response = await acompletion(
            model=model_name,
            messages=messages,
            request_id=request_id,
            stream=stream,
            **params
        )
        
        if stream:
            # For streaming, return a generator
            return response
        
        # Get the completion text
        completion_text = response.choices[0].message.content
        
        # Count tokens in the completion
        completion_tokens = get_token_count(model_name, [{"role": "assistant", "content": completion_text}])
        
        # Calculate the cost
        cost = await calculate_cost(model_name, prompt_tokens, completion_tokens)
        
        # Record the usage
        await record_usage(
            model_id=model.id,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            cost=cost,
            request_type=request_type,
            user_id=user_id,
            request_id=request_id,
            success=True,
            metadata=metadata
        )
        
        return completion_text
    
    except Exception as e:
        logger.error(f"Error getting completion: {str(e)}")
        
        # Record the error
        await record_usage(
            model_id=model.id,
            prompt_tokens=0,
            completion_tokens=0,
            cost=0.0,
            request_type=request_type,
            user_id=user_id,
            request_id=request_id,
            success=False,
            error_message=str(e),
            metadata=metadata
        )
        
        raise

async def get_json_completion(
    prompt: str,
    model_id: Optional[int] = None,
    system_prompt: Optional[str] = None,
    temperature: Optional[float] = None,
    max_tokens: Optional[int] = None,
    request_type: str = "json",
    user_id: Optional[UUID] = None,
    metadata: Dict[str, Any] = {}
) -> Dict[str, Any]:
    """Get a JSON completion from the LLM"""
    # Enhance the system prompt to request JSON
    json_system_prompt = system_prompt or "You are a helpful assistant that responds in JSON format."
    json_system_prompt += " Respond only with valid JSON. Do not include any explanations or text outside of the JSON structure."
    
    # Get the completion
    completion = await get_completion(
        prompt=prompt,
        model_id=model_id,
        system_prompt=json_system_prompt,
        temperature=temperature,
        max_tokens=max_tokens,
        request_type=request_type,
        user_id=user_id,
        metadata=metadata
    )
    
    # Parse the JSON
    try:
        # Try to extract JSON if it's wrapped in markdown code blocks
        if "```json" in completion:
            json_str = completion.split("```json")[1].split("```")[0].strip()
        elif "```" in completion:
            json_str = completion.split("```")[1].strip()
        else:
            json_str = completion
        
        return json.loads(json_str)
    except json.JSONDecodeError:
        logger.error(f"Error parsing JSON from completion: {completion}")
        raise ValueError("The model did not return valid JSON")

class LiteLLMService:
    """Service class for LiteLLM operations"""
    
    @staticmethod
    async def get_completion(
        prompt: str,
        model_id: Optional[int] = None,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        request_type: str = "general",
        user_id: Optional[UUID] = None,
        metadata: Dict[str, Any] = {},
        stream: bool = False
    ) -> Union[str, Dict[str, Any]]:
        """Get a completion from the LLM"""
        return await get_completion(
            prompt=prompt,
            model_id=model_id,
            system_prompt=system_prompt,
            temperature=temperature,
            max_tokens=max_tokens,
            request_type=request_type,
            user_id=user_id,
            metadata=metadata,
            stream=stream
        )
    
    @staticmethod
    async def get_json_completion(
        prompt: str,
        model_id: Optional[int] = None,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        request_type: str = "json",
        user_id: Optional[UUID] = None,
        metadata: Dict[str, Any] = {}
    ) -> Dict[str, Any]:
        """Get a JSON completion from the LLM"""
        return await get_json_completion(
            prompt=prompt,
            model_id=model_id,
            system_prompt=system_prompt,
            temperature=temperature,
            max_tokens=max_tokens,
            request_type=request_type,
            user_id=user_id,
            metadata=metadata
        )
    
    @staticmethod
    async def get_settings() -> LLMSettingsResponse:
        """Get LLM settings and usage summary"""
        return await get_settings()
    
    @staticmethod
    async def get_all_models() -> List[LLMModel]:
        """Get all LLM models"""
        return await get_all_models()
    
    @staticmethod
    async def get_default_model() -> Optional[LLMModel]:
        """Get the default LLM model"""
        return await get_default_model()
    
    @staticmethod
    async def create_model(model: LLMModel) -> LLMModel:
        """Create a new LLM model"""
        return await create_model(model)
    
    @staticmethod
    async def update_model(model_id: int, model: LLMModel) -> Optional[LLMModel]:
        """Update an existing LLM model"""
        return await update_model(model_id, model)
    
    @staticmethod
    async def delete_model(model_id: int) -> bool:
        """Delete an LLM model"""
        return await delete_model(model_id)
    
    @staticmethod
    async def get_usage_summary(
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        user_id: Optional[UUID] = None
    ) -> LLMUsageSummary:
        """Get a summary of LLM usage"""
        return await get_usage_summary(start_date, end_date, user_id) 