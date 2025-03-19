import { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth } from '@/lib/api/middleware/auth';
import apiClient from '@/lib/api/client';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Call backend API
    const response = await apiClient.post(`${process.env.NEXT_PUBLIC_API_URL}/api/low-probability-workflow/run`, {});

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
    console.error('Error in run workflow API route:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Use withAdminAuth to ensure only admins and marketers can run this workflow
export default withAdminAuth(handler); 