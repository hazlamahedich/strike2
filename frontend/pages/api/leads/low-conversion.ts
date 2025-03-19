import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from '@/pages/api/auth/mock-nextauth';

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
    // Get campaign filter from query params
    const campaignId = req.query.campaign_id ? Number(req.query.campaign_id) : null;
    
    // Mock data
    const leads = [
      {
        id: 1,
        name: 'John Smith',
        email: 'john@example.com',
        company: 'Acme Corp',
        status: 'Contacted',
        conversion_probability: 0.25,
        workflow_name: 'Hibernating',
        workflow_stage: 'early_nurture',
        days_in_pipeline: 15,
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        last_activity: new Date().toISOString(),
        campaign_id: 1,
        campaign_name: 'Campaign 1',
      },
      {
        id: 2,
        name: 'Jane Doe',
        email: 'jane@example.com',
        company: 'XYZ Inc',
        status: 'New',
        conversion_probability: 0.15,
        workflow_name: 'Long-term',
        workflow_stage: 'early_nurture',
        days_in_pipeline: 5,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        last_activity: new Date().toISOString(),
        campaign_id: 1,
        campaign_name: 'Campaign 1',
      },
      {
        id: 3,
        name: 'Michael Johnson',
        email: 'michael@example.com',
        company: 'Global Tech',
        status: 'Engaged',
        conversion_probability: 0.35,
        workflow_name: 'Re-engagement',
        workflow_stage: 'education',
        days_in_pipeline: 45,
        created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        last_activity: new Date().toISOString(),
        campaign_id: 2,
        campaign_name: 'Campaign 2',
      },
      {
        id: 4,
        name: 'Sarah Wilson',
        email: 'sarah@example.com',
        company: 'Tech Solutions',
        status: 'Qualified',
        conversion_probability: 0.30,
        workflow_name: 'Re-engagement',
        workflow_stage: 'value_proposition',
        days_in_pipeline: 75,
        created_at: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
        last_activity: new Date().toISOString(),
        campaign_id: 3,
        campaign_name: 'Campaign 3',
      },
      {
        id: 5,
        name: 'Robert Brown',
        email: 'robert@example.com',
        company: 'Innovative LLC',
        status: 'Contacted',
        conversion_probability: 0.20,
        workflow_name: 'Hibernating',
        workflow_stage: 're_engagement',
        days_in_pipeline: 95,
        created_at: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000).toISOString(),
        last_activity: new Date().toISOString(),
        campaign_id: 4,
        campaign_name: 'Campaign 4',
      },
      {
        id: 6,
        name: 'Lisa Anderson',
        email: 'lisa@example.com',
        company: 'Future Corp',
        status: 'Stalled',
        conversion_probability: 0.10,
        workflow_name: 'Long-term',
        workflow_stage: 'exit_decision',
        days_in_pipeline: 120,
        created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        last_activity: new Date().toISOString(),
        campaign_id: 5,
        campaign_name: 'Campaign 5',
      },
    ];
    
    // Apply campaign filter if provided
    const filteredLeads = campaignId 
      ? leads.filter(lead => lead.campaign_id === campaignId)
      : leads;
    
    // Return filtered leads
    return res.status(200).json(filteredLeads);
  } catch (error) {
    console.error('Error fetching low conversion leads:', error);
    return res.status(500).json({ error: 'Failed to fetch low conversion leads' });
  }
} 