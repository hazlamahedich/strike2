import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from '@/pages/api/auth/mock-nextauth';
import { ActivityType, ActivitySource } from '@/lib/api/activity';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check auth
  const session = await getServerSession(req, res);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Lead ID is required' });
    }
    
    // Mock activities data for development
    const leadId = parseInt(id as string);
    const now = new Date();
    
    const mockActivities = [
      {
        id: 1,
        type: ActivityType.EMAIL_SENT,
        source: ActivitySource.USER,
        user_id: 1,
        lead_id: leadId,
        campaign_id: 1,
        details: {
          subject: 'Follow-up on our conversation',
          template: 'follow_up',
          email_id: 'mock-email-id-1'
        },
        created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        type: ActivityType.CONTENT_GENERATED,
        source: ActivitySource.AUTOMATED,
        lead_id: leadId,
        campaign_id: 1,
        details: {
          prompt: 'Generate follow-up email',
          model: 'gpt-4',
          template: 'follow_up'
        },
        created_at: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 3,
        type: ActivityType.LEAD_STAGE_CHANGED,
        source: ActivitySource.AUTOMATED,
        lead_id: leadId,
        campaign_id: 1,
        details: {
          previous_stage: 'early_nurture',
          new_stage: 'education',
          reason: 'Lead has been in early nurture for over 14 days'
        },
        created_at: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 4,
        type: ActivityType.EMAIL_SCHEDULED,
        source: ActivitySource.USER,
        user_id: 1,
        lead_id: leadId,
        campaign_id: 1,
        details: {
          subject: 'New product features',
          template: 'product_update',
          scheduled_date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          email_id: 'mock-email-id-2'
        },
        created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 5,
        type: ActivityType.AGENT_INTERVENTION,
        source: ActivitySource.USER,
        user_id: 1,
        lead_id: leadId,
        campaign_id: 1,
        details: {
          reason: 'Lead showing high engagement but stuck in pipeline',
          action: 'schedule_call'
        },
        created_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 6,
        type: ActivityType.PIPELINE_ANALYZED,
        source: ActivitySource.AUTOMATED,
        lead_id: leadId,
        campaign_id: 1,
        details: {
          conversion_probability: 0.35,
          recommendation: 'Send education materials',
          next_action: 'schedule_email'
        },
        created_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    // Sort activities by created_at in descending order (newest first)
    const sortedActivities = mockActivities.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    return res.status(200).json(sortedActivities);
  } catch (error) {
    console.error('Error fetching lead activities:', error);
    return res.status(500).json({ error: 'Failed to fetch lead activities' });
  }
} 