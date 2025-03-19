import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

// Type for Next.js API handler
type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

/**
 * Authentication middleware for API routes
 * Ensures the user is authenticated before allowing access to the API route
 */
export function withAuth(handler: ApiHandler): ApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Check for auth in local development
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_AUTH === 'true') {
      return handler(req, res);
    }
    
    try {
      // Get the session from the request
      const session = await getSession({ req });
      
      // If no session, return unauthorized
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // Set user in request object for access in the handler
      (req as any).user = session.user;
      
      // Call the original handler
      return handler(req, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Admin role check middleware
 * Ensures the user has admin role before allowing access to the API route
 */
export function withAdminAuth(handler: ApiHandler): ApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // First ensure user is authenticated
    return withAuth(async (req, res) => {
      try {
        // Get the user from the request
        const user = (req as any).user;
        
        // Check if user has admin role
        if (!user || user.role !== 'admin') {
          return res.status(403).json({ error: 'Forbidden' });
        }
        
        // Call the original handler
        return handler(req, res);
      } catch (error) {
        console.error('Admin auth middleware error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    })(req, res);
  };
} 