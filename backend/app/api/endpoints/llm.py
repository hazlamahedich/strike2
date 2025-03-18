from typing import List, Optional, Dict, Any, Union
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, Body

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

@router.post("/generate")
async def generate_text(
    prompt: str = Body(..., description="The prompt for text generation"),
    system_prompt: Optional[str] = Body(None, description="Optional system prompt for chat models"),
    temperature: Optional[float] = Body(None, description="The temperature to use for generation (0.0 to 1.0)"),
    max_tokens: Optional[int] = Body(None, description="Maximum tokens to generate"),
    model_name: Optional[str] = Body(None, description="Specific model name to use (overrides model_id)"),
    model_id: Optional[int] = Body(None, description="ID of the model to use"),
    feature_name: Optional[str] = Body("api", description="Feature name for usage tracking"),
    response_format: Optional[Dict[str, Any]] = Body(None, description="Response format specification"),
    current_user = Depends(get_current_user)
):
    """
    Generate text using the configured LLM model
    """
    try:
        # If response_format is JSON, use the JSON completion endpoint
        if response_format and response_format.get("type") == "json_object":
            result = await LiteLLMService.get_json_completion(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=temperature,
                max_tokens=max_tokens,
                model_id=model_id,
                request_type=feature_name,
                user_id=current_user.id if current_user else None,
                metadata={
                    "feature": feature_name,
                    "model_name": model_name,
                    "response_format": response_format
                }
            )
            
            # Maintain compatibility with frontend expected format
            return {
                "text": json.dumps(result),
                "usage": {
                    "prompt_tokens": result.get("_usage", {}).get("prompt_tokens", 0),
                    "completion_tokens": result.get("_usage", {}).get("completion_tokens", 0),
                    "total_tokens": result.get("_usage", {}).get("total_tokens", 0)
                },
                "model": result.get("_model", "")
            }
        else:
            # Regular text completion
            result = await LiteLLMService.get_completion(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=temperature,
                max_tokens=max_tokens,
                model_id=model_id,
                request_type=feature_name,
                user_id=current_user.id if current_user else None,
                metadata={
                    "feature": feature_name,
                    "model_name": model_name,
                    "response_format": response_format
                }
            )
            
            # If result is a string, convert to expected format
            if isinstance(result, str):
                return {
                    "text": result,
                    "usage": {
                        "prompt_tokens": 0,
                        "completion_tokens": 0,
                        "total_tokens": 0
                    },
                    "model": ""
                }
            else:
                # Already in the expected format
                return result
    except Exception as e:
        # Log the error
        import logging
        logging.getLogger(__name__).error(f"Error generating text: {str(e)}")
        
        # Raise HTTP exception
        raise HTTPException(status_code=500, detail=f"Error generating text: {str(e)}")

import json
@router.post("/generate/audio")
async def transcribe_audio(
    audio_file: Optional[str] = Body(None, description="Base64 encoded audio file"),
    audio_url: Optional[str] = Body(None, description="URL to audio file"),
    feature_name: Optional[str] = Body("transcription", description="Feature name for usage tracking"),
    current_user = Depends(get_current_user)
):
    """
    Transcribe audio to text using the configured LLM model's audio capabilities
    """
    # This is a placeholder - requires integrating with audio transcription capabilities
    try:
        if not audio_file and not audio_url:
            raise HTTPException(status_code=400, detail="Either audio_file or audio_url must be provided")
        
        # TODO: Implement audio transcription using LiteLLM or a specialized service
        # This could use OpenAI's Whisper via the LiteLLM service
        
        raise HTTPException(status_code=501, detail="Audio transcription not yet implemented")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error transcribing audio: {str(e)}") 