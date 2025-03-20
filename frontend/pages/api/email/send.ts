import type { NextApiRequest, NextApiResponse } from 'next';
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
    const { to, from, subject, content, leadId, campaignId, updateLeadStatus } = req.body;

    // Validate required fields
    if (!to || !from || !subject || !content) {
      return res.status(400).json({ error: 'Missing required email fields' });
    }

    // Simulate delay for API call
    await new Promise(resolve => setTimeout(resolve, 800));

    // Log what would happen in a real implementation
    console.log('Email sent:', { to, from, subject });
    console.log('Email content:', content.substring(0, 100) + '...');
    
    if (leadId && updateLeadStatus) {
      console.log(`Lead status would be updated for lead ${leadId} to ${updateLeadStatus}`);
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      data: {
        id: 'mock-email-' + Date.now(),
        sent_at: new Date().toISOString(),
        to,
        subject,
        lead_status_updated: updateLeadStatus ? true : false
      }
    });
  } catch (error) {
    console.error('Error in send-email API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 