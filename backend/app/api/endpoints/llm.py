from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query

from app.models.ai import LLMModel, LLMUsageSummary, LLMSettingsResponse
from app.services.litellm_service import LiteLLMService
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/settings", response_model=LLMSettingsResponse)
async def get_llm_settings(current_user = Depends(get_current_user)):
    """
    Get LLM settings and usage summary
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to access LLM settings")
    
    return await LiteLLMService.get_settings()

@router.get("/models", response_model=List[LLMModel])
async def get_all_models(current_user = Depends(get_current_user)):
    """
    Get all LLM models
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to access LLM models")
    
    return await LiteLLMService.get_all_models()

@router.get("/models/default", response_model=Optional[LLMModel])
async def get_default_model(current_user = Depends(get_current_user)):
    """
    Get the default LLM model
    """
    return await LiteLLMService.get_default_model()

@router.post("/models", response_model=LLMModel)
async def create_model(model: LLMModel, current_user = Depends(get_current_user)):
    """
    Create a new LLM model
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to create LLM models")
    
    return await LiteLLMService.create_model(model)

@router.put("/models/{model_id}", response_model=Optional[LLMModel])
async def update_model(model_id: int, model: LLMModel, current_user = Depends(get_current_user)):
    """
    Update an existing LLM model
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to update LLM models")
    
    updated_model = await LiteLLMService.update_model(model_id, model)
    if not updated_model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    return updated_model

@router.delete("/models/{model_id}")
async def delete_model(model_id: int, current_user = Depends(get_current_user)):
    """
    Delete an LLM model
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete LLM models")
    
    success = await LiteLLMService.delete_model(model_id)
    if not success:
        raise HTTPException(status_code=404, detail="Model not found")
    
    return {"success": True}

@router.get("/usage", response_model=LLMUsageSummary)
async def get_usage_summary(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    period: Optional[str] = Query(None, description="Predefined period: 'day', 'week', 'month', 'year'"),
    current_user = Depends(get_current_user)
):
    """
    Get a summary of LLM usage
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to access LLM usage")
    
    # Handle predefined periods
    if period:
        end_date = datetime.utcnow()
        if period == "day":
            start_date = end_date - timedelta(days=1)
        elif period == "week":
            start_date = end_date - timedelta(weeks=1)
        elif period == "month":
            start_date = end_date - timedelta(days=30)
        elif period == "year":
            start_date = end_date - timedelta(days=365)
    
    return await LiteLLMService.get_usage_summary(start_date, end_date) 