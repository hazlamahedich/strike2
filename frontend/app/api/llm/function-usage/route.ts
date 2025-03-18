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

// Generate random function usage data for a specific function type
const generateMockFunctionData = (functionType: string, days: number = 30) => {
  const dates = generatePastDates(days);
  
  // Create daily usage data
  const dailyUsage = dates.map(date => {
    const requestCount = Math.floor(Math.random() * 15) + 5;
    const promptTokens = Math.floor(Math.random() * 10000) + 2000;
    const completionTokens = Math.floor(Math.random() * 5000) + 1000;
    const totalTokens = promptTokens + completionTokens;
    const cost = parseFloat((totalTokens * 0.00002).toFixed(4));
    
    return {
      date,
      requestCount,
      promptTokens,
      completionTokens,
      totalTokens,
      cost
    };
  });
  
  return {
    functionUsage: [
      {
        functionType,
        requestCount: dailyUsage.reduce((sum, day) => sum + day.requestCount, 0),
        promptTokens: dailyUsage.reduce((sum, day) => sum + day.promptTokens, 0),
        completionTokens: dailyUsage.reduce((sum, day) => sum + day.completionTokens, 0),
        totalTokens: dailyUsage.reduce((sum, day) => sum + day.totalTokens, 0),
        totalCost: parseFloat(dailyUsage.reduce((sum, day) => sum + day.cost, 0).toFixed(2)),
        avgCostPerRequest: parseFloat((dailyUsage.reduce((sum, day) => sum + day.cost, 0) / dailyUsage.reduce((sum, day) => sum + day.requestCount, 0)).toFixed(4)),
      }
    ],
    dailyUsage
  };
};

// Mock function usage data for all functions
const mockFunctionUsageAll = {
  functionUsage: [
    {
      functionType: 'meeting_summarization',
      requestCount: 187,
      promptTokens: 280500,
      completionTokens: 140250,
      totalTokens: 420750,
      totalCost: 8.42,
      avgCostPerRequest: 0.045
    },
    {
      functionType: 'lead_analysis',
      requestCount: 412,
      promptTokens: 618000,
      completionTokens: 309000,
      totalTokens: 927000,
      totalCost: 18.54,
      avgCostPerRequest: 0.045
    },
    {
      functionType: 'email_generation',
      requestCount: 326,
      promptTokens: 489000,
      completionTokens: 244500,
      totalTokens: 733500,
      totalCost: 14.67,
      avgCostPerRequest: 0.045
    },
    {
      functionType: 'task_automation',
      requestCount: 156,
      promptTokens: 234000,
      completionTokens: 117000,
      totalTokens: 351000,
      totalCost: 7.02,
      avgCostPerRequest: 0.045
    },
    {
      functionType: 'conversation_analysis',
      requestCount: 98,
      promptTokens: 147000,
      completionTokens: 73500,
      totalTokens: 220500,
      totalCost: 4.41,
      avgCostPerRequest: 0.045
    }
  ],
  dailyUsage: []
};

export async function GET(request: NextRequest) {
  try {
    // Check if we should use mock data
    const cookieStore = await cookies();
    const useMockData = cookieStore.get('use_mock_data')?.value === 'true';
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period');
    const functionType = searchParams.get('function_type');
    
    if (useMockData) {
      console.log('Using mock data for AI function usage');
      
      // If a specific function type is requested, generate data for that function
      if (functionType) {
        let days = 30; // default
        
        if (period) {
          if (period === 'day') days = 1;
          else if (period === 'week') days = 7;
          else if (period === 'month') days = 30;
          else if (period === 'year') days = 365;
        }
        
        return NextResponse.json(generateMockFunctionData(functionType, days));
      }
      
      // Otherwise return data for all functions
      return NextResponse.json(mockFunctionUsageAll);
    }
    
    // Get session cookie
    const sessionCookie = cookieStore.get('session');
    
    // Use environment variable with fallback
    const backendUrl = process.env.BACKEND_URL || DEFAULT_BACKEND_URL;
    console.log(`Using backend URL: ${backendUrl}`);
    
    // Construct URL with query parameters
    let url = `${backendUrl}/api/llm/function-usage`;
    const queryParams = new URLSearchParams();
    
    if (period) queryParams.append('period', period);
    if (functionType) queryParams.append('function_type', functionType);
    
    const queryString = queryParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    
    console.log(`Fetching AI function usage data from: ${url}`);
    
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
      
      console.error('Error response from AI function usage API:', response.status, errorDetail);
      
      // Fallback to mock data on error if enabled globally
      const globalMockEnabled = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
      if (globalMockEnabled) {
        console.log('Falling back to mock data for AI function usage due to API error');
        
        if (functionType) {
          let days = 30; // default
          
          if (period) {
            if (period === 'day') days = 1;
            else if (period === 'week') days = 7;
            else if (period === 'month') days = 30;
            else if (period === 'year') days = 365;
          }
          
          return NextResponse.json(generateMockFunctionData(functionType, days));
        }
        
        return NextResponse.json(mockFunctionUsageAll);
      }
      
      // For 403 errors (unauthorized), return a more specific message
      if (response.status === 403) {
        return NextResponse.json(
          { error: 'You do not have permission to access AI function usage data' },
          { status: 403 }
        );
      }
      
      // For 404 errors (not found), return a specific message
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'No function usage data found for the specified period' },
          { status: 404 }
        );
      }
      
      // For 500 errors (server error), return a specific message
      if (response.status === 500) {
        return NextResponse.json(
          { error: 'Server error occurred while fetching AI function usage data', detail: errorDetail },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch AI function usage data', detail: errorDetail },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching AI function usage data:', error);
    
    // Fallback to mock data on error if enabled globally
    const globalMockEnabled = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
    if (globalMockEnabled) {
      console.log('Falling back to mock data for AI function usage due to error');
      
      const searchParams = request.nextUrl.searchParams;
      const functionType = searchParams.get('function_type');
      
      if (functionType) {
        return NextResponse.json(generateMockFunctionData(functionType));
      }
      
      return NextResponse.json(mockFunctionUsageAll);
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