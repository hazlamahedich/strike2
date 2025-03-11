import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward the feedback to the backend API
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/chatbot/feedback`,
      body
    );
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error in chatbot feedback API:', error);
    return NextResponse.json(
      { error: 'Failed to process feedback' },
      { status: 500 }
    );
  }
} 