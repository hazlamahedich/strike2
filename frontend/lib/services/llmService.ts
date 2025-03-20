import { 
  LLMModel, 
  LLMGenerateRequest, 
  LLMGenerateResponse,
  LLMSettings,
  LLMProviderInfo
} from '../types/llm';

// Cache for LLM settings
let cachedDefaultModel: LLMModel | null = null;
let cachedSettings: LLMSettings | null = null;
let cachedProviders: LLMProviderInfo[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches the current LLM settings (default model and usage stats)
 */
export async function getLLMSettings(): Promise<LLMSettings> {
  const now = Date.now();
  
  // Return cached settings if they exist and are not expired
  if (cachedSettings && (now - cacheTimestamp < CACHE_TTL)) {
    return cachedSettings;
  }
  
  try {
    const response = await fetch('/api/llm/settings');
    if (!response.ok) {
      throw new Error(`Failed to fetch LLM settings: ${response.status}`);
    }
    
    const data = await response.json();
    cachedSettings = data;
    cachedDefaultModel = data.defaultModel;
    cacheTimestamp = now;
    
    return data;
  } catch (error) {
    console.error('Error fetching LLM settings:', error);
    throw error;
  }
}

/**
 * Fetches the current default LLM model configuration
 */
export async function getDefaultLLMModel(): Promise<LLMModel> {
  const now = Date.now();
  
  // Return cached model if it exists and is not expired
  if (cachedDefaultModel && (now - cacheTimestamp < CACHE_TTL)) {
    return cachedDefaultModel;
  }
  
  // If we don't have the default model cached, fetch the settings
  const settings = await getLLMSettings();
  return settings.defaultModel;
}

/**
 * Fetches all available LLM models
 */
export async function getAllLLMModels(): Promise<LLMModel[]> {
  try {
    const response = await fetch('/api/llm/models');
    if (!response.ok) {
      throw new Error(`Failed to fetch LLM models: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching LLM models:', error);
    throw error;
  }
}

/**
 * Fetches a specific LLM model by ID
 */
export async function getLLMModelById(id: number): Promise<LLMModel> {
  try {
    const response = await fetch(`/api/llm/models/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch LLM model with ID ${id}: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching LLM model ID ${id}:`, error);
    throw error;
  }
}

/**
 * Fetches all supported LLM providers
 */
export async function getLLMProviders(): Promise<LLMProviderInfo[]> {
  const now = Date.now();
  
  // Return cached providers if they exist and are not expired
  if (cachedProviders && (now - cacheTimestamp < CACHE_TTL)) {
    return cachedProviders;
  }
  
  try {
    const response = await fetch('/api/llm/providers');
    if (!response.ok) {
      throw new Error(`Failed to fetch LLM providers: ${response.status}`);
    }
    
    const data = await response.json();
    cachedProviders = data;
    
    return data;
  } catch (error) {
    console.error('Error fetching LLM providers:', error);
    throw error;
  }
}

/**
 * Makes an LLM API call using the specified configuration
 */
export async function generateText(request: LLMGenerateRequest): Promise<LLMGenerateResponse> {
  try {
    // If provider and model_name aren't specified, use the default model
    if (!request.provider || !request.model_name) {
      const defaultModel = await getDefaultLLMModel();
      request.provider = request.provider || defaultModel.provider;
      request.model_name = request.model_name || defaultModel.model_name;
      
      // Use default temperature and max_tokens if not specified
      if (request.temperature === undefined && defaultModel.temperature !== undefined) {
        request.temperature = defaultModel.temperature;
      }
      
      if (request.max_tokens === undefined && defaultModel.max_tokens !== undefined) {
        request.max_tokens = defaultModel.max_tokens;
      }
    }

    // Make the API request
    const response = await fetch('/api/llm/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    
    // Handle errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      
      // Special handling for disabled features
      if (response.status === 403 && request.feature_name) {
        throw new Error(`AI feature '${request.feature_name}' is disabled by the administrator`);
      }
      
      throw new Error(errorData?.error || `API call failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error generating text with LLM:', error);
    throw error;
  }
}

/**
 * Function to invalidate the cache, forcing new data to be fetched
 */
export function invalidateLLMCache(): void {
  cachedDefaultModel = null;
  cachedSettings = null;
  cachedProviders = null;
  cacheTimestamp = 0;
}

/**
 * Creates a new LLM model
 */
export async function createLLMModel(model: Omit<LLMModel, 'id' | 'created_at' | 'updated_at'>): Promise<LLMModel> {
  try {
    const response = await fetch('/api/llm/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(model),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `Failed to create LLM model: ${response.status}`);
    }
    
    // Invalidate cache as we've changed the models
    invalidateLLMCache();
    
    return await response.json();
  } catch (error) {
    console.error('Error creating LLM model:', error);
    throw error;
  }
}

/**
 * Updates an existing LLM model
 */
export async function updateLLMModel(id: number, updates: Partial<LLMModel>): Promise<LLMModel> {
  try {
    const response = await fetch(`/api/llm/models/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `Failed to update LLM model: ${response.status}`);
    }
    
    // Invalidate cache as we've changed the models
    invalidateLLMCache();
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating LLM model ID ${id}:`, error);
    throw error;
  }
}

/**
 * Deletes an LLM model
 */
export async function deleteLLMModel(id: number): Promise<void> {
  try {
    const response = await fetch(`/api/llm/models/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `Failed to delete LLM model: ${response.status}`);
    }
    
    // Invalidate cache as we've changed the models
    invalidateLLMCache();
  } catch (error) {
    console.error(`Error deleting LLM model ID ${id}:`, error);
    throw error;
  }
} 