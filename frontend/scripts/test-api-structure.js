// Test script for checking the API response structure
const fetch = require('node-fetch');

async function testAPIStructure() {
  try {
    const response = await fetch('http://localhost:3000/api/v1/ai/meetings/comprehensive-summary/101');
    const data = await response.json();
    
    console.log('API Response Structure Check:');
    console.log('----------------------------');
    console.log('Status:', response.status);
    console.log('Has summary:', !!data.summary);
    console.log('Has insights:', Array.isArray(data.insights));
    console.log('Has action_items:', Array.isArray(data.action_items));
    console.log('Has next_steps:', Array.isArray(data.next_steps));
    console.log('Has company_analysis:', !!data.company_analysis);
    
    if (data.company_analysis) {
      console.log('Company analysis has:');
      console.log('- company_summary:', !!data.company_analysis.company_summary);
      console.log('- industry:', !!data.company_analysis.industry);
      console.log('- company_size_estimate:', !!data.company_analysis.company_size_estimate);
      console.log('- strengths:', Array.isArray(data.company_analysis.strengths));
      console.log('- potential_pain_points:', Array.isArray(data.company_analysis.potential_pain_points));
    }
    
    console.log('\nOverall test result:', 
      data.summary && 
      Array.isArray(data.insights) && 
      Array.isArray(data.action_items) && 
      Array.isArray(data.next_steps) && 
      data.company_analysis ? 
      '✅ PASSED' : '❌ FAILED');
  } catch (error) {
    console.error('Error testing API structure:', error);
    console.log('Overall test result: ❌ FAILED');
  }
}

// Run the test
testAPIStructure(); 