import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * Helper function to add CORS headers to a response
 * @param response NextResponse object
 * @returns NextResponse with CORS headers
 */
export function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

/**
 * Check if the current environment is development
 * @returns boolean indicating if in development mode
 */
export function isDevelopmentMode(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Create a CORS preflight response
 * @returns NextResponse with 204 status and CORS headers
 */
export function createCorsPreflightResponse(): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  return addCorsHeaders(response);
}

/**
 * Check authentication and handle development mode bypass
 * @param request NextRequest object
 * @returns Object with authentication status and session
 */
export async function checkAuthentication(request: NextRequest): Promise<{
  isAuthenticated: boolean;
  session: any;
  shouldBypass: boolean;
}> {
  // Check if we're in development mode
  const isDev = isDevelopmentMode();
  console.log('Environment:', isDev ? 'development' : 'production');
  
  // Get authentication session
  const session = await getServerSession(authOptions);
  console.log('Auth session:', session ? 'Authenticated' : 'Not authenticated');
  
  // Determine if we should bypass authentication
  const shouldBypass = isDev;
  if (shouldBypass && !session) {
    console.log('Development mode: Bypassing authentication check');
  }
  
  return {
    isAuthenticated: !!session,
    session,
    shouldBypass
  };
}

/**
 * Create an unauthorized response with CORS headers
 * @param message Optional error message
 * @returns NextResponse with 401 status and CORS headers
 */
export function createUnauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
  return addCorsHeaders(
    NextResponse.json({ error: message }, { status: 401 })
  );
}

/**
 * Create a bad request response with CORS headers
 * @param message Error message
 * @returns NextResponse with 400 status and CORS headers
 */
export function createBadRequestResponse(message: string): NextResponse {
  return addCorsHeaders(
    NextResponse.json({ error: message }, { status: 400 })
  );
}

/**
 * Create a server error response with CORS headers
 * @param message Error message
 * @returns NextResponse with 500 status and CORS headers
 */
export function createServerErrorResponse(message: string = 'Internal Server Error'): NextResponse {
  return addCorsHeaders(
    NextResponse.json({ error: message }, { status: 500 })
  );
}

/**
 * Create a success response with CORS headers
 * @param data Response data
 * @returns NextResponse with 200 status and CORS headers
 */
export function createSuccessResponse(data: any): NextResponse {
  return addCorsHeaders(NextResponse.json(data));
}

/**
 * Handle OPTIONS requests for CORS preflight
 * @param request NextRequest object
 * @returns NextResponse with CORS headers
 */
export async function handleOptionsRequest(request: NextRequest): Promise<NextResponse> {
  console.log('OPTIONS request received for CORS preflight');
  return createCorsPreflightResponse();
} 