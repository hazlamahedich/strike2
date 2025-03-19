import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/api/middleware/auth';
import apiClient from '@/lib/api/client';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const leadId = parseInt(id as string, 10);
    
    if (isNaN(leadId)) {
      return res.status(400).json({ error: 'Invalid lead ID' });
    }
    
    const { template_type, cycle } = req.body;
    
    if (!template_type) {
      return res.status(400).json({ error: 'Template type is required' });
    }
    
    // Call backend API
    const response = await apiClient.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/low-probability-workflow/leads/${leadId}/generate-content`, 
      { 
        template_type,
        cycle: cycle || 0
      }
    );

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
    console.error('Error in generate content API route:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler); 