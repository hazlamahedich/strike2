import { NextApiRequest, NextApiResponse } from 'next';
import { updateLeadWorkflowStage } from '@/lib/api/leads';
import { withAuth } from '@/lib/api/middleware/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const leadId = parseInt(id as string, 10);

    if (isNaN(leadId)) {
      return res.status(400).json({ error: 'Invalid lead ID' });
    }

    const { workflow_stage } = req.body;

    if (!workflow_stage) {
      return res.status(400).json({ error: 'Workflow stage is required' });
    }

    // Valid stages
    const validStages = [
      'early_nurture',
      'education',
      'value_proposition',
      're_engagement',
      'exit_decision'
    ];

    if (!validStages.includes(workflow_stage)) {
      return res.status(400).json({ error: 'Invalid workflow stage' });
    }

    // Call the API function
    const response = await updateLeadWorkflowStage(leadId, workflow_stage);

    if (response.error) {
      return res.status(400).json({ error: response.error });
    }

    return res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    console.error('Error in update workflow stage API route:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler); 