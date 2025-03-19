import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from '@/pages/api/auth/mock-nextauth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check auth
  const session = await getServerSession(req, res);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { type, source, lead_id, details } = req.body;
    
    if (!type || !source || !lead_id) {
      return res.status(400).json({ error: 'Missing required fields: type, source, lead_id' });
    }
    
    // In a real implementation, this would save to the database
    // For our mock, we'll just return a success response with a mock ID
    
    const mockActivity = {
      id: Math.floor(Math.random() * 10000),
      type,
      source,
      lead_id,
      user_id: source === 'user' ? session.user.id : undefined,
      details: details || {},
      created_at: new Date().toISOString()
    };
    
    return res.status(201).json(mockActivity);
  } catch (error) {
    console.error('Error creating activity:', error);
    return res.status(500).json({ error: 'Failed to create activity' });
  }
} 