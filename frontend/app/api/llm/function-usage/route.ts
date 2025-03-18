import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://elpqvskcixfsgeavjfhb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey as string);

// Sample mock data
const MOCK_FUNCTION_USAGE = {
  functions: [
    {
      function_name: 'email_generation',
      request_count: 158,
      total_tokens: 62400,
      cost: 1.248,
      percentage: 42
    },
    {
      function_name: 'lead_scoring',
      request_count: 89,
      total_tokens: 35600,
      cost: 0.712,
      percentage: 24
    },
    {
      function_name: 'company_analysis',
      request_count: 64,
      total_tokens: 51200,
      cost: 1.024,
      percentage: 17
    },
    {
      function_name: 'meeting_summary',
      request_count: 45,
      total_tokens: 27000,
      cost: 0.54,
      percentage: 12
    },
    {
      function_name: 'other',
      request_count: 18,
      total_tokens: 7200,
      cost: 0.144,
      percentage: 5
    }
  ],
  totalRequests: 374,
  totalTokens: 183400,
  totalCost: 3.668
};

// Empty function usage data
const EMPTY_FUNCTION_USAGE = {
  functions: [],
  totalRequests: 0,
  totalTokens: 0,
  totalCost: 0
};

/**
 * GET /api/llm/function-usage
 * 
 * Retrieve LLM function usage statistics
 */
export async function GET(request: NextRequest) {
  // Check if we should use mock data
  const useMock = process.env.USE_LLM_MOCK_DATA === 'true';
  if (useMock) {
    return NextResponse.json(MOCK_FUNCTION_USAGE);
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
      return NextResponse.json(EMPTY_FUNCTION_USAGE);
    }
    
    // If no data, return empty usage data
    if (!data || data.length === 0) {
      return NextResponse.json(EMPTY_FUNCTION_USAGE);
    }
    
    // Get model information to calculate costs
    const { data: models, error: modelsError } = await supabase
      .from('llm_models')
      .select('id, model_name, provider, cost_per_1k_tokens');
    
    if (modelsError) {
      console.error('Error fetching LLM models:', modelsError);
      return NextResponse.json(EMPTY_FUNCTION_USAGE);
    }
    
    // Create a map of model ID to cost per token
    const modelCostMap = new Map();
    models?.forEach(model => {
      const costPer1k = model.cost_per_1k_tokens || 0;
      modelCostMap.set(model.id, costPer1k / 1000); // Convert to cost per token
    });
    
    // Group usage data by feature name
    const functionUsage = new Map();
    
    // Process each usage record
    data.forEach(record => {
      const featureName = record.feature_name || 'other';
      
      if (!functionUsage.has(featureName)) {
        functionUsage.set(featureName, {
          function_name: featureName,
          request_count: 0,
          total_tokens: 0,
          cost: 0
        });
      }
      
      const functionData = functionUsage.get(featureName);
      
      // Update request count
      functionData.request_count += 1;
      
      // Update tokens
      functionData.total_tokens += record.total_tokens || 0;
      
      // Calculate and update cost
      const costPerToken = modelCostMap.get(record.model_id) || 0;
      const recordCost = (record.total_tokens || 0) * costPerToken;
      functionData.cost += recordCost;
      
      // Update the map
      functionUsage.set(featureName, functionData);
    });
    
    // Calculate totals and percentages
    const totalRequests = Array.from(functionUsage.values()).reduce((sum, func) => sum + func.request_count, 0);
    const totalTokens = Array.from(functionUsage.values()).reduce((sum, func) => sum + func.total_tokens, 0);
    const totalCost = Array.from(functionUsage.values()).reduce((sum, func) => sum + func.cost, 0);
    
    // Convert to array and add percentages
    const functions = Array.from(functionUsage.values()).map(func => ({
      ...func,
      percentage: Math.round((func.request_count / totalRequests) * 100) || 0
    }));
    
    // Sort by request count (descending)
    functions.sort((a, b) => b.request_count - a.request_count);
    
    // Return the processed data
    return NextResponse.json({
      functions,
      totalRequests,
      totalTokens,
      totalCost
    });
    
  } catch (error) {
    console.error('Error in LLM function usage API:', error);
    return NextResponse.json(EMPTY_FUNCTION_USAGE);
  }
} 