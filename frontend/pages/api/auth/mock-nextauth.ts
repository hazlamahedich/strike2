// Mock implementation of NextAuth for development
import { NextApiRequest, NextApiResponse } from 'next';
import { authOptions as baseAuthOptions } from '@/lib/auth';

export const authOptions = baseAuthOptions;

// Mock getServerSession function
export const getServerSession = async (req: NextApiRequest, res: NextApiResponse) => {
  // Check if there's a fake session in headers for testing
  const mockSession = req.headers['x-mock-session'];
  
  // Always return a mock admin session for development
  return {
    user: {
      id: '7007305b-1d08-49ae-9aa3-680eb8394a76', // Match the UUID format from lib/auth.ts
      name: 'Admin User',
      email: 'admin@example.com',
      image: null,
      role: 'admin',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}; 