/**
 * Interface for LLM model configuration
 */
export interface LLMModel {
  id: number;
  provider: string;
  model_name: string;
  api_key?: string;
  api_base?: string;
  api_version?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
  temperature?: number;
  max_tokens?: number;
  is_default?: boolean;
  cost_per_1k_tokens?: number;
}

/**
 * Interface for LLM usage data
 */
export interface LLMUsage {
  id: number;
  model_id: number;
  user_id?: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  created_at: string;
  feature_name?: string;
  status?: string;
  error_message?: string;
}

/**
 * Interface for LLM settings
 */
export interface LLMSettings {
  defaultModel: LLMModel;
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  usageByDay?: Record<string, { tokens: number; cost: number }>;
}

/**
 * Interface for LLM generation request
 */
export interface LLMGenerateRequest {
  prompt: string;
  modelId?: number;
  provider?: string;
  model_name?: string;
  temperature?: number;
  max_tokens?: number;
  feature_name?: string;
}

/**
 * Interface for LLM generation response
 */
export interface LLMGenerateResponse {
  text: string;
  model: {
    provider: string;
    model_name: string;
  };
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Type for LLM provider information
 */
export type LLMProviderInfo = {
  id: string;
  name: string;
  models: string[];
  description: string;
  apiKeyRequired: boolean;
  baseUrlConfigurable: boolean;
  defaultBaseUrl?: string;
  supports_streaming?: boolean;
};

export interface LLMUsageRecord {
  feature_name: string;
  request_count: number;
  total_tokens: number;
  cost: number;
  percentage: number;
}

export type LLMProvider = 'openai' 
  | 'anthropic' 
  | 'google' 
  | 'azure' 
  | 'local' 
  | 'cohere' 
  | 'huggingface'
  | 'deepseek';

/**
 * Interface for AI functionality settings
 */
export interface AIFunctionalitySetting {
  id: number;
  feature_key: string;
  display_name: string;
  description: string | null;
  is_enabled: boolean;
  requires_subscription: boolean;
  default_model_id: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Interface for updating AI functionality settings
 */
export interface UpdateAIFunctionalitySetting {
  is_enabled: boolean;
  default_model_id?: number | null;
} 