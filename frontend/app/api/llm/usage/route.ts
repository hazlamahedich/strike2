import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Default backend URL if environment variable is not set
const DEFAULT_BACKEND_URL = 'http://localhost:8001';

// Generate dates for the past 30 days
const generatePastDates = (days: number) => {
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};

// Generate random usage data
const generateMockUsageData = (days: number = 30) => {
  const dates = generatePastDates(days);
  const dailyUsage = dates.map(date => {
    const randomPromptTokens = Math.floor(Math.random() * 50000) + 20000;
    const randomCompletionTokens = Math.floor(Math.random() * 30000) + 15000;
    const totalTokens = randomPromptTokens + randomCompletionTokens;
    const cost = parseFloat((totalTokens * 0.00002).toFixed(4)); // Approximate cost
    
    return {
      date,
      promptTokens: randomPromptTokens,
      completionTokens: randomCompletionTokens,
      totalTokens,
      cost
    };
  });
  
  // Calculate totals
  const totalPromptTokens = dailyUsage.reduce((sum, day) => sum + day.promptTokens, 0);
  const totalCompletionTokens = dailyUsage.reduce((sum, day) => sum + day.completionTokens, 0);
  const totalTokens = totalPromptTokens + totalCompletionTokens;
  const totalCost = parseFloat((totalTokens * 0.00002).toFixed(2));
  
  // Generate function usage data
  const functionUsage = [
    {
      functionType: 'meeting_summarization',
      requestCount: Math.floor(Math.random() * 200) + 100,
      promptTokens: Math.floor(Math.random() * 200000) + 100000,
      completionTokens: Math.floor(Math.random() * 100000) + 50000,
      totalTokens: 0,
      cost: 0
    },
    {
      functionType: 'lead_analysis',
      requestCount: Math.floor(Math.random() * 300) + 150,
      promptTokens: Math.floor(Math.random() * 300000) + 150000,
      completionTokens: Math.floor(Math.random() * 150000) + 75000,
      totalTokens: 0,
      cost: 0
    },
    {
      functionType: 'email_generation',
      requestCount: Math.floor(Math.random() * 250) + 125,
      promptTokens: Math.floor(Math.random() * 250000) + 125000,
      completionTokens: Math.floor(Math.random() * 125000) + 60000,
      totalTokens: 0,
      cost: 0
    }
  ];
  
  // Calculate function totals
  functionUsage.forEach(func => {
    func.totalTokens = func.promptTokens + func.completionTokens;
    func.cost = parseFloat((func.totalTokens * 0.00002).toFixed(2));
  });
  
  return {
    totalPromptTokens,
    totalCompletionTokens,
    totalTokens,
    totalCost,
    dailyUsage,
    functionUsage
  };
};

// Mock usage data
const mockLlmUsage = generateMockUsageData();

export async function GET(request: NextRequest) {
  try {
    // Check if we should use mock data
    const cookieStore = await cookies();
    const useMockData = cookieStore.get('use_mock_data')?.value === 'true';
    
    if (useMockData) {
      console.log('Using mock data for LLM usage');
      
      // Get query parameters for period
      const searchParams = request.nextUrl.searchParams;
      const period = searchParams.get('period');
      
      // Generate different data based on period
      if (period) {
        let days = 30; // default
        
        if (period === 'day') days = 1;
        else if (period === 'week') days = 7;
        else if (period === 'month') days = 30;
        else if (period === 'year') days = 365;
        
        return NextResponse.json(generateMockUsageData(days));
      }
      
      return NextResponse.json(mockLlmUsage);
    }
    
    // Get session cookie
    const sessionCookie = cookieStore.get('session');
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const groupBy = searchParams.get('group_by');
    const period = searchParams.get('period');
    
    // Use environment variable with fallback
    const backendUrl = process.env.BACKEND_URL || DEFAULT_BACKEND_URL;
    console.log(`Using backend URL: ${backendUrl}`);
    
    // Construct URL with query parameters
    let url = `${backendUrl}/api/llm/usage`;
    const queryParams = new URLSearchParams();
    
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    if (groupBy) queryParams.append('group_by', groupBy);
    if (period) queryParams.append('period', period);
    
    const queryString = queryParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    
    console.log(`Fetching LLM usage data from: ${url}`);
    
    // Make request to backend API
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionCookie?.value || ''}`,
      },
    });

    if (!response.ok) {
      // Try to get error details from response
      let errorDetail = '';
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorData.error || `HTTP error ${response.status}`;
      } catch (e) {
        errorDetail = `HTTP error ${response.status}`;
      }
      
      console.error('Error response from LLM usage API:', response.status, errorDetail);
      
      // Fallback to mock data on error if enabled globally
      const globalMockEnabled = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
      if (globalMockEnabled) {
        console.log('Falling back to mock data for LLM usage due to API error');
        
        // Generate different data based on period
        if (period) {
          let days = 30; // default
          
          if (period === 'day') days = 1;
          else if (period === 'week') days = 7;
          else if (period === 'month') days = 30;
          else if (period === 'year') days = 365;
          
          return NextResponse.json(generateMockUsageData(days));
        }
        
        return NextResponse.json(mockLlmUsage);
      }
      
      // For 403 errors (unauthorized), return a more specific message
      if (response.status === 403) {
        return NextResponse.json(
          { error: 'You do not have permission to access LLM usage data' },
          { status: 403 }
        );
      }
      
      // For 404 errors (not found), return a specific message
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'No usage data found for the specified period' },
          { status: 404 }
        );
      }
      
      // For 500 errors (server error), return a specific message
      if (response.status === 500) {
        return NextResponse.json(
          { error: 'Server error occurred while fetching LLM usage data', detail: errorDetail },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch LLM usage data', detail: errorDetail },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching LLM usage data:', error);
    
    // Fallback to mock data on error if enabled globally
    const globalMockEnabled = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
    if (globalMockEnabled) {
      console.log('Falling back to mock data for LLM usage due to error');
      return NextResponse.json(mockLlmUsage);
    }
    
    // Return a more detailed error message
    const errorMessage = error instanceof Error 
      ? `${error.name}: ${error.message}` 
      : 'Unknown error';
      
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        detail: errorMessage,
        // For development, include the full error
        ...(process.env.NODE_ENV === 'development' ? { stack: error instanceof Error ? error.stack : undefined } : {})
      },
      { status: 500 }
    );
  }
} 