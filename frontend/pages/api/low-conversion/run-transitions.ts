import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase/server.mock'; // Use mock for development
import { getServerSession } from '@/pages/api/auth/mock-nextauth'; // Use mock for development
import { 
  WorkflowType, 
  PipelineStage,
  clientEvaluateTransition 
} from '@/lib/api/workflow';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get session for auth check
  const session = await getServerSession(req, res);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // For development, return mock data
    const mockTransitions = [
      {
        leadId: 1,
        leadName: 'John Doe',
        previousStage: 'Early Nurture',
        newStage: 'Education',
        reason: 'Met conditions for transition from Early Nurture to Education'
      },
      {
        leadId: 2,
        leadName: 'Jane Smith',
        previousStage: 'Education',
        newStage: 'Value Proposition',
        reason: 'Met conditions for transition from Education to Value Proposition'
      }
    ];

    return res.status(200).json({
      processedLeads: 10,
      transitionedLeads: mockTransitions.length,
      transitions: mockTransitions
    });
  } catch (error) {
    console.error('Error in run-transitions API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 