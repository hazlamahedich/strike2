# LLM Settings Configuration

This document explains how to configure and use the LLM (Large Language Model) settings in the application.

## Overview

The LLM settings API provides access to:
- Default LLM model configuration
- LLM usage statistics
- Available LLM providers
- Function-specific usage data

## Development Mode

In development mode, you can use mock data to work on the frontend without needing the backend LLM service running.

### Using Mock Data

Mock data is enabled by default in development mode. To configure this:

1. Set the environment variable in `.env.local`:
   ```
   NEXT_PUBLIC_USE_MOCK_DATA=true
   ```

2. Alternatively, set a cookie in your browser:
   ```javascript
   document.cookie = "use_mock_data=true; path=/";
   ```

3. To disable mock data and use real API calls:
   ```
   NEXT_PUBLIC_USE_MOCK_DATA=false
   ```
   or
   ```javascript
   document.cookie = "use_mock_data=false; path=/";
   ```

## Running the Backend LLM Server

The LLM API server runs on port 8001 by default. To start it:

```bash
cd backend
node server.js
```

Or use the convenience script to start both frontend and backend:

```bash
npm run dev:all
```

## Production Deployment

In production, mock data is disabled by default. The application will use real API calls to the backend server.

To configure the production environment:

1. Ensure the `.env.production` file has:
   ```
   NEXT_PUBLIC_USE_MOCK_DATA=false
   BACKEND_URL=https://your-production-api.com
   ```

2. Make sure the backend server is properly deployed and accessible.

3. Configure your LLM API keys in your production environment:
   ```
   OPENAI_API_KEY=your-production-key
   ANTHROPIC_API_KEY=your-production-key
   DEEPSEEK_API_KEY=your-production-key
   ```

## Transitioning from Mock to Live Data

When you're ready to switch from mock data to live data:

1. Ensure your backend server is properly running with the LLM service
2. Set `NEXT_PUBLIC_USE_MOCK_DATA=false` in your environment
3. Configure the appropriate API keys for your LLM providers
4. Test the transition by monitoring the API responses in the network tab

## Troubleshooting

If you encounter API errors:

1. Check browser console for detailed error messages
2. Verify the backend server is running on the correct port
3. Ensure API keys are properly configured
4. Check the network tab for specific HTTP error codes
5. If needed, temporarily re-enable mock data while fixing the backend

## Database Initialization

The LLM settings require specific database tables. Run the migration script to set them up:

```bash
cd backend
python run_llm_migration.py
```

This will create and initialize the required tables in the database. 