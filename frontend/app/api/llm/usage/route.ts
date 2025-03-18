import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://elpqvskcixfsgeavjfhb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey as string);

// Mock data for when there's no database records yet
const EMPTY_USAGE_DATA = {
  total_requests: 0,
  total_tokens: 0,
  total_cost: 0,
  tokens_by_model: {},
  cost_by_model: {},
  requests_by_type: {},
  usage_by_day: {}
};

// Sample mock data with realistic values
const SAMPLE_USAGE_DATA = {
  total_requests: 125,
  total_tokens: 45678,
  total_cost: 0.9135,
  tokens_by_model: {
    'gpt-4': 25678,
    'gpt-3.5-turbo': 20000
  },
  cost_by_model: {
    'gpt-4': 0.7678,
    'gpt-3.5-turbo': 0.1457
  },
  requests_by_type: {
    'general': 75,
    'json': 30,
    'lead_scoring': 20
  },
  usage_by_day: {
    '2023-05-01': { tokens: 5000, cost: 0.1 },
    '2023-05-02': { tokens: 7500, cost: 0.15 },
    '2023-05-03': { tokens: 10000, cost: 0.2 },
    '2023-05-04': { tokens: 8000, cost: 0.16 },
    '2023-05-05': { tokens: 15178, cost: 0.3035 }
  }
};

/**
 * GET /api/llm/usage
 * 
 * Retrieve LLM usage statistics for a given period
 */
export async function GET(request: NextRequest) {
  // Check if we should use mock data
  const useMock = process.env.USE_LLM_MOCK_DATA === 'true';
  if (useMock) {
    return NextResponse.json(SAMPLE_USAGE_DATA);
  }
  
  try {
    // Get the period from the URL
    const urlParams = new URL(request.url).searchParams;
    const period = urlParams.get('period') || 'month';
    
    // Create a date for filtering based on the period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        // Default to last 30 days
        startDate.setMonth(now.getMonth() - 1);
    }
    
    // Convert to ISO string for Supabase query
    const startDateStr = startDate.toISOString();
    
    // Fetch all usage data for the period
    const { data, error } = await supabase
      .from('llm_usage')
      .select('*')
      .gte('created_at', startDateStr);
    
    if (error) {
      console.error('Error fetching LLM usage data:', error);
      return NextResponse.json(EMPTY_USAGE_DATA);
    }
    
    // If no data, return empty usage data
    if (!data || data.length === 0) {
      return NextResponse.json(EMPTY_USAGE_DATA);
    }
    
    // Calculate total requests, tokens, and cost
    const total_requests = data.length;
    const total_tokens = data.reduce((sum, record) => sum + (record.total_tokens || 0), 0);
    
    // Get model information to calculate costs
    const { data: models, error: modelsError } = await supabase
      .from('llm_models')
      .select('id, model_name, provider, cost_per_1k_tokens');
    
    if (modelsError) {
      console.error('Error fetching LLM models:', modelsError);
      return NextResponse.json(EMPTY_USAGE_DATA);
    }
    
    // Create a map of model ID to cost per token
    const modelCostMap = new Map();
    models?.forEach(model => {
      const costPer1k = model.cost_per_1k_tokens || 0;
      modelCostMap.set(model.id, costPer1k / 1000); // Convert to cost per token
    });
    
    // Calculate cost for each usage record
    let total_cost = 0;
    const tokens_by_model: Record<string, number> = {};
    const cost_by_model: Record<string, number> = {};
    const requests_by_type: Record<string, number> = {};
    const usage_by_day: Record<string, { tokens: number; cost: number }> = {};
    
    // Process each usage record
    data.forEach(record => {
      // Get the model name or use a default
      const model = models?.find(m => m.id === record.model_id);
      const modelName = model ? `${model.provider}-${model.model_name}` : 'unknown';
      
      // Calculate cost for this record
      const costPerToken = modelCostMap.get(record.model_id) || 0;
      const recordCost = (record.total_tokens || 0) * costPerToken;
      
      // Add to total cost
      total_cost += recordCost;
      
      // Track tokens by model
      tokens_by_model[modelName] = (tokens_by_model[modelName] || 0) + (record.total_tokens || 0);
      
      // Track cost by model
      cost_by_model[modelName] = (cost_by_model[modelName] || 0) + recordCost;
      
      // Track requests by feature/type
      const featureType = record.feature_name || 'general';
      requests_by_type[featureType] = (requests_by_type[featureType] || 0) + 1;
      
      // Track usage by day
      const day = record.created_at.split('T')[0];
      if (!usage_by_day[day]) {
        usage_by_day[day] = { tokens: 0, cost: 0 };
      }
      usage_by_day[day].tokens += record.total_tokens || 0;
      usage_by_day[day].cost += recordCost;
    });
    
    // Return the processed data
    return NextResponse.json({
      total_requests,
      total_tokens,
      total_cost,
      tokens_by_model,
      cost_by_model,
      requests_by_type,
      usage_by_day
    });
    
  } catch (error) {
    console.error('Error in LLM usage API:', error);
    return NextResponse.json(EMPTY_USAGE_DATA);
  }
} 