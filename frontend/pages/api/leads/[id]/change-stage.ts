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
    const { new_stage, current_stage, reason } = req.body;

    if (!id || !new_stage || !current_stage) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Update the lead in the database
    const { data, error } = await supabaseAdmin
      .from('leads')
      .update({
        current_stage: new_stage,
        last_stage_change: new Date().toISOString(),
        stage_change_reason: reason || null,
        updated_at: new Date().toISOString(),
        updated_by: session.user.id
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating lead stage:', error);
      return res.status(500).json({ error: 'Failed to update lead stage' });
    }

    // Create activity record for the stage change
    const { error: activityError } = await supabaseAdmin
      .from('lead_activities')
      .insert({
        lead_id: id,
        activity_type: 'lead_stage_changed',
        user_id: session.user.id,
        details: {
          previous_stage: current_stage,
          new_stage: new_stage,
          reason: reason || null
        },
        created_at: new Date().toISOString()
      });

    if (activityError) {
      console.error('Error logging stage change activity:', activityError);
      // Continue anyway, as the primary operation succeeded
    }

    return res.status(200).json({ 
      success: true, 
      data: data?.[0] || null 
    });
  } catch (error) {
    console.error('Error in change-stage API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 