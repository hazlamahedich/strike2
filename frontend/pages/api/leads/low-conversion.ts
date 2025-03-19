import { NextApiRequest, NextApiResponse } from 'next';
import { getLowConversionLeads } from '@/lib/api/leads';
import { withAuth } from '@/lib/api/middleware/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { limit, workflowId } = req.query;
    const options = {
      limit: limit ? parseInt(limit as string, 10) : undefined,
      workflowId: workflowId as string,
    };

    const response = await getLowConversionLeads(options);

    if (response.error) {
      return res.status(400).json({ error: response.error });
    }

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error in low-conversion API route:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler); 