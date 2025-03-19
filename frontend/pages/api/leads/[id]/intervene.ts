import { NextApiRequest, NextApiResponse } from 'next';
import { agentIntervene } from '@/lib/api/leads';
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

    const { action, message, taskDetails } = req.body;

    if (!action || !['manual_takeover', 'add_task', 'send_message'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action type' });
    }

    // Validate additional fields based on action type
    if (action === 'send_message' && !message) {
      return res.status(400).json({ error: 'Message is required for send_message action' });
    }

    if (action === 'add_task' && !taskDetails) {
      return res.status(400).json({ error: 'Task details are required for add_task action' });
    }

    // Call the API function
    const response = await agentIntervene(leadId, {
      action,
      message,
      taskDetails
    });

    if (response.error) {
      return res.status(400).json({ error: response.error });
    }

    return res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    console.error('Error in lead intervention API route:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler); 