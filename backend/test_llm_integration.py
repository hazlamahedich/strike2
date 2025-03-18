import os
import asyncio
import json
import aiohttp

async def test_lead_scoring_llm_integration():
    print('Testing Lead Scoring Agent LLM Integration')
    
    # Set up the environment variable for the LLM API URL
    os.environ['LLM_API_BASE_URL'] = 'http://localhost:8001'
    
    # Create a test prompt
    prompt = 'Generate a lead score based on the following metrics: Email open rate: 60%, Call duration: 15 mins, Meeting attendance: 2 meetings'
    
    # Test the API endpoint directly
    async with aiohttp.ClientSession() as session:
        async with session.post('http://localhost:8001/api/llm/generate', json={
            'prompt': prompt,
            'temperature': 0.2,
            'feature_name': 'lead_scoring',
            'provider': 'openai',
            'model_name': 'gpt-4'
        }) as resp:
            if resp.status != 200:
                print(f'API Error: {resp.status}')
                error_data = await resp.text()
                print(f'Error details: {error_data}')
                return
            
            result = await resp.json()
            print(f'API Response: {json.dumps(result, indent=2)}')
    
    print('Test completed')

# Run the test
if __name__ == "__main__":
    asyncio.run(test_lead_scoring_llm_integration()) 