import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase/server.mock'; // Use mock for development
import { getServerSession } from '@/pages/api/auth/mock-nextauth'; // Use mock for development

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
    const { id } = req.query;
    const { new_workflow, current_workflow, reason } = req.body;

    if (!id || !new_workflow || !current_workflow) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Update the lead in the database
    const { data, error } = await supabaseAdmin
      .from('leads')
      .update({
        workflow_name: new_workflow,
        last_workflow_change: new Date().toISOString(),
        workflow_change_reason: reason || null,
        updated_at: new Date().toISOString(),
        updated_by: session.user.id
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating lead workflow:', error);
      return res.status(500).json({ error: 'Failed to update lead workflow' });
    }

    // Create activity record for the workflow change
    const { error: activityError } = await supabaseAdmin
      .from('lead_activities')
      .insert({
        lead_id: id,
        activity_type: 'workflow_changed',
        user_id: session.user.id,
        details: {
          previous_workflow: current_workflow,
          new_workflow: new_workflow,
          reason: reason || null
        },
        created_at: new Date().toISOString()
      });

    if (activityError) {
      console.error('Error logging workflow change activity:', activityError);
      // Continue anyway, as the primary operation succeeded
    }

    return res.status(200).json({ 
      success: true, 
      data: data?.[0] || { id, workflow_name: new_workflow } // Provide mock data if needed
    });
  } catch (error) {
    console.error('Error in change-workflow API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 