import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Define the backend API URL
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Fix: Properly await params before accessing its properties
    const paramsResolved = await params;
    const path = Array.isArray(paramsResolved.path) ? paramsResolved.path.join('/') : '';
    console.log(`Received GET request for v1/ai/meetings/${path}`);
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Auth session:', session ? 'Authenticated' : 'Not authenticated');
    
    if (!session) {
      console.log('Unauthorized request for AI meetings');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For specific paths, handle them locally first before trying the backend
    if (path === 'agenda') {
      console.log('Handling agenda request locally');
      console.log('Request URL:', request.url);
      console.log('Request method:', request.method);
      console.log('Request headers:', Object.fromEntries(request.headers.entries()));
      
      try {
        // Import the agenda route module
        const agendaModule = await import('../agenda/route');
        // Use type assertion to access the handlers
        const agendaHandlers = agendaModule as unknown as {
          GET?: (req: NextRequest) => Promise<NextResponse>;
          POST?: (req: NextRequest) => Promise<NextResponse>;
          PUT?: (req: NextRequest) => Promise<NextResponse>;
          DELETE?: (req: NextRequest) => Promise<NextResponse>;
        };
        
        // Check if it has a GET handler
        if (typeof agendaHandlers.GET === 'function') {
          console.log('Successfully imported agenda GET handler');
          return agendaHandlers.GET(request);
        } else {
          console.log('No GET handler found in agenda route, continuing to backend');
        }
      } catch (importError) {
        console.error('Error importing agenda handler:', importError);
        // Continue to backend if local handler fails
      }
    }

    // Get the search params
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const endpoint = queryString 
      ? `${BACKEND_API_URL}/api/v1/ai/meetings/${path}?${queryString}` 
      : `${BACKEND_API_URL}/api/v1/ai/meetings/${path}`;

    console.log(`Forwarding GET request to backend: ${endpoint}`);

    // Forward the request to the backend API
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Forward authorization if needed
          ...(session ? { 'Authorization': `Bearer ${session.user?.email}` } : {})
        },
      });

      if (!response.ok) {
        console.error(`Backend API error: ${response.status} ${response.statusText}`);
        
        // If the backend returns a 404, check if we should handle it locally
        if (response.status === 404) {
          console.log(`Backend returned 404 for ${path}, checking if we have a local handler`);
          // For specific paths, we might want to handle them locally
          if (path === 'agenda') {
            console.log('Handling agenda request locally');
            console.log('Request URL:', request.url);
            console.log('Request method:', request.method);
            console.log('Request headers:', Object.fromEntries(request.headers.entries()));
            
            // Instead of dynamically importing, directly forward to the agenda route
            return NextResponse.rewrite(new URL('/api/v1/ai/meetings/agenda', request.url));
          }
        }
        
        return NextResponse.json(
          { error: `Backend API error: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      console.log('Backend API response with AI meetings data:', data);

      return NextResponse.json(data);
    } catch (fetchError) {
      console.error('Error fetching from backend:', fetchError);
      return NextResponse.json(
        { error: 'Failed to communicate with backend service' },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('Error in AI meetings GET handler:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Fix: Properly await params before accessing its properties
    const paramsResolved = await params;
    const path = Array.isArray(paramsResolved.path) ? paramsResolved.path.join('/') : '';
    console.log(`Received POST request for v1/ai/meetings/${path}`);
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Auth session:', session ? 'Authenticated' : 'Not authenticated');
    
    if (!session) {
      console.log('Unauthorized request for AI meetings');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const requestData = await request.json();
    console.log('AI meetings request data:', requestData);

    // For specific paths, handle them locally first before trying the backend
    if (path === 'agenda') {
      console.log('Handling agenda request locally');
      console.log('Request URL:', request.url);
      console.log('Request method:', request.method);
      console.log('Request headers:', Object.fromEntries(request.headers.entries()));
      
      try {
        // Import and use the agenda handler directly
        const agendaModule = await import('../agenda/route');
        // Use type assertion to access the handlers
        const agendaHandlers = agendaModule as unknown as {
          GET?: (req: NextRequest) => Promise<NextResponse>;
          POST?: (req: NextRequest) => Promise<NextResponse>;
          PUT?: (req: NextRequest) => Promise<NextResponse>;
          DELETE?: (req: NextRequest) => Promise<NextResponse>;
        };
        
        console.log('Successfully imported agenda handler');
        if (typeof agendaHandlers.POST === 'function') {
          // Create a new request with the same body to pass to the agenda handler
          // This ensures we're passing a fresh request object with the body
          const clonedRequest = new Request(request.url, {
            method: request.method,
            headers: request.headers,
            body: JSON.stringify(requestData)
          });
          return agendaHandlers.POST(clonedRequest as NextRequest);
        } else {
          console.log('No POST handler found in agenda route');
          return NextResponse.json(
            { error: 'Agenda handler not available' },
            { status: 500 }
          );
        }
      } catch (importError) {
        console.error('Error importing agenda handler:', importError);
        return NextResponse.json(
          { error: 'Failed to handle agenda request locally' },
          { status: 500 }
        );
      }
    }

    // Forward the request to the backend API
    try {
      const endpoint = `${BACKEND_API_URL}/api/v1/ai/meetings/${path}`;
      console.log(`Forwarding POST request to backend: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { 'Authorization': `Bearer ${session.user?.email}` } : {})
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        console.error(`Backend API error: ${response.status} ${response.statusText}`);
        
        // If the backend returns a 404, check if we should handle it locally
        if (response.status === 404) {
          console.log(`Backend returned 404 for ${path}, checking if we have a local handler`);
          // For specific paths, we might want to handle them locally
          if (path === 'agenda') {
            console.log('Handling agenda request locally');
            
            // Instead of redirecting, forward the request to the specific agenda handler
            try {
              // Import the agenda handler dynamically
              const { POST: agendaHandler } = await import('../agenda/route');
              
              // Call the agenda handler directly
              return agendaHandler(request);
            } catch (importError) {
              console.error('Error importing agenda handler:', importError);
              return NextResponse.json(
                { error: 'Failed to handle agenda request' },
                { status: 500 }
              );
            }
          }
        }
        
        return NextResponse.json(
          { error: `Backend API error: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      console.log('Backend API response with AI meetings data:', data);

      return NextResponse.json(data);
    } catch (fetchError) {
      console.error('Error fetching from backend:', fetchError);
      return NextResponse.json(
        { error: 'Failed to communicate with backend service' },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('Error in AI meetings POST handler:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Fix: Properly await params before accessing its properties
    const paramsResolved = await params;
    const path = Array.isArray(paramsResolved.path) ? paramsResolved.path.join('/') : '';
    console.log(`Received PUT request for v1/ai/meetings/${path}`);
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Auth session:', session ? 'Authenticated' : 'Not authenticated');
    
    if (!session) {
      console.log('Unauthorized request for AI meetings');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const requestData = await request.json();
    console.log('AI meetings update data:', requestData);

    // For specific paths, handle them locally first before trying the backend
    if (path === 'agenda') {
      console.log('Handling agenda request locally');
      console.log('Request URL:', request.url);
      console.log('Request method:', request.method);
      console.log('Request headers:', Object.fromEntries(request.headers.entries()));
      
      try {
        // Import the agenda route module
        const agendaModule = await import('../agenda/route');
        // Use type assertion to access the handlers
        const agendaHandlers = agendaModule as unknown as {
          GET?: (req: NextRequest) => Promise<NextResponse>;
          POST?: (req: NextRequest) => Promise<NextResponse>;
          PUT?: (req: NextRequest) => Promise<NextResponse>;
          DELETE?: (req: NextRequest) => Promise<NextResponse>;
        };
        
        // Check if it has a PUT handler
        if (typeof agendaHandlers.PUT === 'function') {
          console.log('Successfully imported agenda PUT handler');
          return agendaHandlers.PUT(request);
        } else {
          console.log('No PUT handler found in agenda route, continuing to backend');
        }
      } catch (importError) {
        console.error('Error importing agenda handler:', importError);
        // Continue to backend if local handler fails
      }
    }

    // Forward the request to the backend API
    try {
      const endpoint = `${BACKEND_API_URL}/api/v1/ai/meetings/${path}`;
      console.log(`Forwarding PUT request to backend: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { 'Authorization': `Bearer ${session.user?.email}` } : {})
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        console.error(`Backend API error: ${response.status} ${response.statusText}`);
        
        // If the backend returns a 404, check if we should handle it locally
        if (response.status === 404) {
          console.log(`Backend returned 404 for ${path}, checking if we have a local handler`);
          // For specific paths, we might want to handle them locally
          if (path === 'agenda') {
            console.log('Handling agenda request locally');
            console.log('Request URL:', request.url);
            console.log('Request method:', request.method);
            console.log('Request headers:', Object.fromEntries(request.headers.entries()));
            
            // Instead of dynamically importing, directly forward to the agenda route
            return NextResponse.rewrite(new URL('/api/v1/ai/meetings/agenda', request.url));
          }
        }
        
        return NextResponse.json(
          { error: `Backend API error: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      console.log('Backend API response with updated AI meetings data:', data);

      return NextResponse.json(data);
    } catch (fetchError) {
      console.error('Error fetching from backend:', fetchError);
      return NextResponse.json(
        { error: 'Failed to communicate with backend service' },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('Error in AI meetings PUT handler:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Fix: Properly await params before accessing its properties
    const paramsResolved = await params;
    const path = Array.isArray(paramsResolved.path) ? paramsResolved.path.join('/') : '';
    console.log(`Received DELETE request for v1/ai/meetings/${path}`);
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Auth session:', session ? 'Authenticated' : 'Not authenticated');
    
    if (!session) {
      console.log('Unauthorized request for AI meetings');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For specific paths, handle them locally first before trying the backend
    if (path === 'agenda') {
      console.log('Handling agenda request locally');
      console.log('Request URL:', request.url);
      console.log('Request method:', request.method);
      console.log('Request headers:', Object.fromEntries(request.headers.entries()));
      
      try {
        // Import the agenda route module
        const agendaModule = await import('../agenda/route');
        // Use type assertion to access the handlers
        const agendaHandlers = agendaModule as unknown as {
          GET?: (req: NextRequest) => Promise<NextResponse>;
          POST?: (req: NextRequest) => Promise<NextResponse>;
          PUT?: (req: NextRequest) => Promise<NextResponse>;
          DELETE?: (req: NextRequest) => Promise<NextResponse>;
        };
        
        // Check if it has a DELETE handler
        if (typeof agendaHandlers.DELETE === 'function') {
          console.log('Successfully imported agenda DELETE handler');
          return agendaHandlers.DELETE(request);
        } else {
          console.log('No DELETE handler found in agenda route, continuing to backend');
        }
      } catch (importError) {
        console.error('Error importing agenda handler:', importError);
        // Continue to backend if local handler fails
      }
    }

    // Forward the request to the backend API
    try {
      const endpoint = `${BACKEND_API_URL}/api/v1/ai/meetings/${path}`;
      console.log(`Forwarding DELETE request to backend: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { 'Authorization': `Bearer ${session.user?.email}` } : {})
        }
      });

      if (!response.ok) {
        console.error(`Backend API error: ${response.status} ${response.statusText}`);
        
        // If the backend returns a 404, check if we should handle it locally
        if (response.status === 404) {
          console.log(`Backend returned 404 for ${path}, checking if we have a local handler`);
          // For specific paths, we might want to handle them locally
          if (path === 'agenda') {
            console.log('Handling agenda request locally');
            console.log('Request URL:', request.url);
            console.log('Request method:', request.method);
            console.log('Request headers:', Object.fromEntries(request.headers.entries()));
            
            // Instead of dynamically importing, directly forward to the agenda route
            return NextResponse.rewrite(new URL('/api/v1/ai/meetings/agenda', request.url));
          }
        }
        
        return NextResponse.json(
          { error: `Backend API error: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      console.log('Backend API response after deleting AI meeting:', data);

      return NextResponse.json(data);
    } catch (fetchError) {
      console.error('Error fetching from backend:', fetchError);
      return NextResponse.json(
        { error: 'Failed to communicate with backend service' },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('Error in AI meetings DELETE handler:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 