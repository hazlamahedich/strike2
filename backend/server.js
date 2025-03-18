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

// LLM Generate endpoint
app.post('/api/llm/generate', async (req, res) => {
  try {
    // Get request data
    const { provider, model_name, prompt, temperature = 0.7, max_tokens = 1024, stop_sequences } = req.body;
    
    // Get auth token for user tracking (optional)
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
    
    // Get the model configuration from the database if not explicitly provided
    let modelConfig;
    if (!model_name || !provider) {
      const modelResult = await pool.query(
        'SELECT * FROM llm_models WHERE is_default = TRUE LIMIT 1'
      );
      
      if (modelResult.rows.length === 0) {
        return res.status(404).json({ error: 'No default LLM model found' });
      }
      
      modelConfig = modelResult.rows[0];
    } else {
      modelConfig = { provider, model_name, temperature, max_tokens };
    }
    
    // Different providers require different API handling
    let completionText = '';
    let usageStats = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    
    // Get the user ID from the token if available - this is a placeholder function
    // In a real implementation, you would verify the JWT and extract the user ID
    const getUserIdFromToken = (token) => {
      if (!token) return null;
      try {
        // This is just a placeholder - in a real app, you'd decode and verify the JWT
        // const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // return decoded.sub || decoded.user_id;
        return null;
      } catch (err) {
        console.error('Error decoding token:', err);
        return null;
      }
    };
    
    // Calculate cost based on token usage and model pricing - this is a placeholder function
    const calculateCost = (model, usage) => {
      // In a real implementation, you would have pricing data for different models
      // and calculate the cost based on the number of tokens used
      const tokenRate = 0.00002; // $0.02 per 1000 tokens, as a simple default
      return (usage.prompt_tokens + usage.completion_tokens) * tokenRate;
    };
    
    // For demonstration purposes, we're using a mock implementation
    // In a real implementation, you would call the appropriate API based on the provider
    
    // Simple mock implementation for development
    if (process.env.NODE_ENV !== 'production') {
      // Simulate an API call with some delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate a response based on the prompt
      if (prompt.toLowerCase().includes('summarize')) {
        completionText = `Summary: ${prompt.substring(0, 100)}...`;
      } else if (prompt.toLowerCase().includes('question')) {
        completionText = `Answer: Based on the information provided, the answer is...`;
      } else {
        completionText = `Response: Here is a response to your prompt about ${prompt.substring(0, 50)}...`;
      }
      
      // Simulate token usage
      usageStats = {
        prompt_tokens: Math.ceil(prompt.length / 4),
        completion_tokens: Math.ceil(completionText.length / 4),
        total_tokens: Math.ceil(prompt.length / 4) + Math.ceil(completionText.length / 4)
      };
    } 
    // In production, use the actual provider APIs
    else {
      // This would contain the real implementation for different providers
      switch (modelConfig.provider) {
        case 'openai':
          // Implementation for OpenAI would go here
          break;
        case 'anthropic':
          // Implementation for Anthropic would go here
          break;
        case 'azure':
          // Implementation for Azure OpenAI would go here
          break;
        default:
          return res.status(400).json({ error: `Unsupported provider: ${modelConfig.provider}` });
      }
    }
    
    // Record usage in the database if we have a model ID and we're not in development mode
    // or if we're explicitly tracking usage in development
    const userId = getUserIdFromToken(token);
    const shouldRecordUsage = modelConfig.id && (process.env.NODE_ENV === 'production' || process.env.TRACK_DEV_USAGE === 'true');
    
    if (shouldRecordUsage) {
      try {
        await pool.query(
          `INSERT INTO llm_usage_records 
          (model_id, prompt_tokens, completion_tokens, total_tokens, cost, request_type, user_id)
          VALUES 
          ($1, $2, $3, $4, $5, $6, $7)`,
          [
            modelConfig.id,
            usageStats.prompt_tokens,
            usageStats.completion_tokens, 
            usageStats.total_tokens,
            calculateCost(modelConfig, usageStats),
            'text_generation',
            userId
          ]
        );
      } catch (dbError) {
        // Log the error but don't fail the request
        console.error('Error recording LLM usage:', dbError);
      }
    }
    
    // Return the completion
    res.json({
      text: completionText,
      usage: usageStats
    });
  } catch (error) {
    console.error('Error generating LLM completion:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`LLM API server running on port ${port}`);
}); 