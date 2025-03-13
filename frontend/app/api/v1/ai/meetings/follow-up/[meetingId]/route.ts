import { NextRequest, NextResponse } from 'next/server';
import { 
  checkAuthentication, 
  createBadRequestResponse, 
  createServerErrorResponse, 
  createSuccessResponse,
  handleOptionsRequest
} from '@/lib/utils/apiAuthUtils';

// Mock function to generate a follow-up message
function generateFollowUpMessage(meetingId: string): {
  subject: string;
  message: string;
} {
  console.log(`Generating follow-up message for meeting ID: ${meetingId}`);
  
  return {
    subject: "Follow-up from our meeting - Next steps and additional information",
    
    message: `Dear [Client Name],

Thank you for taking the time to meet with me today. I appreciated the opportunity to discuss how our solution can address your team's needs.

As promised, I'm sharing the following resources:
1. Product documentation with detailed feature specifications
2. Case studies from clients in your industry
3. API documentation for potential integration with your existing systems

Based on our conversation, I'd like to suggest scheduling a technical demo with one of our integration specialists to address your specific questions about the implementation process. Would next Tuesday at 2:00 PM work for your team?

In the meantime, please don't hesitate to reach out if you have any questions or need additional information.

Looking forward to our continued collaboration.

Best regards,
[Your Name]
[Your Title]
[Contact Information]`
  };
}

export async function GET(
  request: NextRequest,
  context: { params: { meetingId: string } }
) {
  console.log('GET request received for follow-up message');
  console.log('Request URL:', request.url);
  console.log('Request headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    // Fix: Properly await and destructure the meetingId from params
    const { meetingId } = await Promise.resolve(context.params);
    console.log('Received follow-up message request for meeting:', meetingId);
    
    // Check authentication with our utility function
    const { isAuthenticated, shouldBypass } = await checkAuthentication(request);
    
    // If not authenticated and not in development mode, return unauthorized
    if (!isAuthenticated && !shouldBypass) {
      console.log('Unauthorized request for follow-up message');
      return createBadRequestResponse('Unauthorized');
    }
    
    if (!meetingId) {
      console.log('Missing meetingId in request');
      return createBadRequestResponse('Meeting ID is required');
    }

    // In a real implementation, you would:
    // 1. Fetch meeting details from the database
    // 2. Fetch lead information
    // 3. Use an AI service to generate a personalized follow-up message
    // 4. Store the generated message

    // For now, we'll use a mock function
    const messageData = generateFollowUpMessage(meetingId);
    console.log('Generated follow-up message:', messageData);

    // Create a success response with the message data
    return createSuccessResponse(messageData);
  } catch (error) {
    console.error('Error generating follow-up message:', error);
    
    // Create a detailed error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack
    });
    
    return createServerErrorResponse('Failed to generate follow-up message');
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleOptionsRequest(request);
} 