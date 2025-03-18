const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const port = 8001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
// Use the direct Supabase connection string that works with the MCP query tool
const pool = new Pool({
  connectionString: 'postgresql://postgres.elpqvskcixfsgeavjfhb:dKgxwBpcmTKT9tk2@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres'
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// LLM Settings endpoint
app.get('/api/llm/settings', async (req, res) => {
  try {
    // Get default model
    const modelResult = await pool.query(
      'SELECT * FROM llm_models WHERE is_default = TRUE LIMIT 1'
    );
    
    const defaultModel = modelResult.rows.length > 0 ? modelResult.rows[0] : null;
    
    // Get usage summary (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const usageResult = await pool.query(
      'SELECT SUM(prompt_tokens) as total_prompt_tokens, SUM(completion_tokens) as total_completion_tokens, SUM(total_tokens) as total_tokens, SUM(cost) as total_cost FROM llm_usage_records WHERE timestamp > $1',
      [thirtyDaysAgo.toISOString()]
    );
    
    const usage = usageResult.rows[0] || {
      total_prompt_tokens: 0,
      total_completion_tokens: 0,
      total_tokens: 0,
      total_cost: 0
    };
    
    res.json({
      defaultModel,
      usage: {
        totalPromptTokens: parseInt(usage.total_prompt_tokens) || 0,
        totalCompletionTokens: parseInt(usage.total_completion_tokens) || 0,
        totalTokens: parseInt(usage.total_tokens) || 0,
        totalCost: parseFloat(usage.total_cost) || 0,
      }
    });
  } catch (error) {
    console.error('Error fetching LLM settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// LLM Models endpoint
app.get('/api/llm/models', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM llm_models ORDER BY is_default DESC, created_at DESC'
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching LLM models:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// LLM Usage endpoint
app.get('/api/llm/usage', async (req, res) => {
  try {
    const { period } = req.query;
    
    let startDate = new Date();
    let endDate = new Date();
    
    // Handle predefined periods
    if (period) {
      if (period === 'day') {
        startDate.setDate(startDate.getDate() - 1);
      } else if (period === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === 'month') {
        startDate.setDate(startDate.getDate() - 30);
      } else if (period === 'year') {
        startDate.setDate(startDate.getDate() - 365);
      }
    } else {
      // Default to last 30 days
      startDate.setDate(startDate.getDate() - 30);
    }
    
    const usageResult = await pool.query(
      'SELECT SUM(prompt_tokens) as total_prompt_tokens, SUM(completion_tokens) as total_completion_tokens, SUM(total_tokens) as total_tokens, SUM(cost) as total_cost FROM llm_usage_records WHERE timestamp BETWEEN $1 AND $2',
      [startDate.toISOString(), endDate.toISOString()]
    );
    
    const usage = usageResult.rows[0] || {
      total_prompt_tokens: 0,
      total_completion_tokens: 0,
      total_tokens: 0,
      total_cost: 0
    };
    
    // Get daily usage
    const dailyUsageResult = await pool.query(
      `SELECT 
        DATE(timestamp) as date,
        SUM(prompt_tokens) as prompt_tokens,
        SUM(completion_tokens) as completion_tokens,
        SUM(total_tokens) as total_tokens,
        SUM(cost) as cost
      FROM llm_usage_records 
      WHERE timestamp BETWEEN $1 AND $2
      GROUP BY DATE(timestamp)
      ORDER BY date`,
      [startDate.toISOString(), endDate.toISOString()]
    );
    
    // Get function usage data
    const functionUsageResult = await pool.query(
      `SELECT 
        request_type,
        COUNT(*) as request_count,
        SUM(prompt_tokens) as prompt_tokens,
        SUM(completion_tokens) as completion_tokens,
        SUM(total_tokens) as total_tokens,
        SUM(cost) as cost
      FROM llm_usage_records 
      WHERE timestamp BETWEEN $1 AND $2 AND request_type IS NOT NULL
      GROUP BY request_type
      ORDER BY request_count DESC`,
      [startDate.toISOString(), endDate.toISOString()]
    );
    
    res.json({
      totalPromptTokens: parseInt(usage.total_prompt_tokens) || 0,
      totalCompletionTokens: parseInt(usage.total_completion_tokens) || 0,
      totalTokens: parseInt(usage.total_tokens) || 0,
      totalCost: parseFloat(usage.total_cost) || 0,
      dailyUsage: dailyUsageResult.rows.map(row => ({
        date: row.date,
        promptTokens: parseInt(row.prompt_tokens) || 0,
        completionTokens: parseInt(row.completion_tokens) || 0,
        totalTokens: parseInt(row.total_tokens) || 0,
        cost: parseFloat(row.cost) || 0,
      })),
      functionUsage: functionUsageResult.rows.map(row => ({
        functionType: row.request_type,
        requestCount: parseInt(row.request_count) || 0,
        promptTokens: parseInt(row.prompt_tokens) || 0,
        completionTokens: parseInt(row.completion_tokens) || 0,
        totalTokens: parseInt(row.total_tokens) || 0,
        cost: parseFloat(row.cost) || 0,
      }))
    });
  } catch (error) {
    console.error('Error fetching LLM usage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// AI Function Usage endpoint (for detailed function-specific analytics)
app.get('/api/llm/function-usage', async (req, res) => {
  try {
    const { period, function_type } = req.query;
    
    let startDate = new Date();
    let endDate = new Date();
    
    // Handle predefined periods
    if (period) {
      if (period === 'day') {
        startDate.setDate(startDate.getDate() - 1);
      } else if (period === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === 'month') {
        startDate.setDate(startDate.getDate() - 30);
      } else if (period === 'year') {
        startDate.setDate(startDate.getDate() - 365);
      }
    } else {
      // Default to last 30 days
      startDate.setDate(startDate.getDate() - 30);
    }
    
    let query = `
      SELECT 
        request_type,
        COUNT(*) as request_count,
        SUM(prompt_tokens) as prompt_tokens,
        SUM(completion_tokens) as completion_tokens,
        SUM(total_tokens) as total_tokens,
        SUM(cost) as cost,
        AVG(cost) as avg_cost_per_request
      FROM llm_usage_records 
      WHERE timestamp BETWEEN $1 AND $2
    `;
    
    const queryParams = [startDate.toISOString(), endDate.toISOString()];
    
    // Add function type filter if provided
    if (function_type) {
      query += ` AND request_type = $3`;
      queryParams.push(function_type);
    } else {
      query += ` AND request_type IS NOT NULL`;
    }
    
    query += ` GROUP BY request_type ORDER BY request_count DESC`;
    
    const functionUsageResult = await pool.query(query, queryParams);
    
    // Get daily usage for the function type if specified
    let dailyUsage = [];
    if (function_type) {
      const dailyUsageResult = await pool.query(
        `SELECT 
          DATE(timestamp) as date,
          COUNT(*) as request_count,
          SUM(prompt_tokens) as prompt_tokens,
          SUM(completion_tokens) as completion_tokens,
          SUM(total_tokens) as total_tokens,
          SUM(cost) as cost
        FROM llm_usage_records 
        WHERE timestamp BETWEEN $1 AND $2 AND request_type = $3
        GROUP BY DATE(timestamp)
        ORDER BY date`,
        [startDate.toISOString(), endDate.toISOString(), function_type]
      );
      
      dailyUsage = dailyUsageResult.rows.map(row => ({
        date: row.date,
        requestCount: parseInt(row.request_count) || 0,
        promptTokens: parseInt(row.prompt_tokens) || 0,
        completionTokens: parseInt(row.completion_tokens) || 0,
        totalTokens: parseInt(row.total_tokens) || 0,
        cost: parseFloat(row.cost) || 0,
      }));
    }
    
    res.json({
      functionUsage: functionUsageResult.rows.map(row => ({
        functionType: row.request_type,
        requestCount: parseInt(row.request_count) || 0,
        promptTokens: parseInt(row.prompt_tokens) || 0,
        completionTokens: parseInt(row.completion_tokens) || 0,
        totalTokens: parseInt(row.total_tokens) || 0,
        totalCost: parseFloat(row.cost) || 0,
        avgCostPerRequest: parseFloat(row.avg_cost_per_request) || 0,
      })),
      dailyUsage: dailyUsage
    });
  } catch (error) {
    console.error('Error fetching AI function usage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// LLM Providers endpoint
app.get('/api/llm/providers', async (req, res) => {
  try {
    // Return a list of supported LLM providers
    res.json([
      { id: 'openai', name: 'OpenAI' },
      { id: 'anthropic', name: 'Anthropic' },
      { id: 'azure', name: 'Azure OpenAI' },
      { id: 'google', name: 'Google AI' },
      { id: 'cohere', name: 'Cohere' },
      { id: 'huggingface', name: 'Hugging Face' }
    ]);
  } catch (error) {
    console.error('Error fetching LLM providers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`LLM API server running on port ${port}`);
}); 