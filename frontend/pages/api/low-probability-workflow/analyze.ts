import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/api/middleware/auth';
import apiClient from '@/lib/api/client';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { days } = req.body;
    
    // Call backend API
    const response = await apiClient.post(`${process.env.NEXT_PUBLIC_API_URL}/api/low-probability-workflow/analyze`, { 
      days: days || 30 
    });

    if (response.error) {
      return res.status(400).json({ error: response.error });
    }

    // Type guard to ensure we're accessing data safely
    if ('data' in response) {
      return res.status(200).json(response.data);
    } else {
      return res.status(500).json({ error: 'Invalid API response format' });
    }
  } catch (error) {
    console.error('Error in analyze workflow API route:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler); 