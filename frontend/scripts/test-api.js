// Test script for the comprehensive summary API endpoint
const fetch = require('node-fetch');

async function testComprehensiveSummaryAPI() {
  console.log('Testing comprehensive summary API endpoint...');
  
  try {
    // Test the frontend API endpoint
    const frontendUrl = 'http://localhost:3000/api/v1/ai/meetings/comprehensive-summary/101';
    console.log(`Fetching from frontend API: ${frontendUrl}`);
    
    const frontendResponse = await fetch(frontendUrl);
    console.log(`Frontend API status: ${frontendResponse.status}`);
    
    if (frontendResponse.ok) {
      const data = await frontendResponse.json();
      console.log('Frontend API response data:');
      console.log(JSON.stringify(data, null, 2).substring(0, 500) + '...');
      
      if (data.summary) {
        console.log('✅ Frontend API test PASSED - received summary data');
      } else {
        console.log('❌ Frontend API test FAILED - no summary data received');
      }
    } else {
      const errorText = await frontendResponse.text();
      console.log(`❌ Frontend API test FAILED with status ${frontendResponse.status}`);
      console.log(`Error: ${errorText}`);
    }
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

// Run the test
testComprehensiveSummaryAPI(); 