import { supabase } from '@/lib/supabase/client';
import { LeadFeatures } from './types';
import { LeadStatus, LeadSource } from '@/lib/types/lead';

/**
 * Extract features from a lead for machine learning
 */
export async function extractFeaturesForLead(leadId: number): Promise<LeadFeatures> {
  try {
    console.log(`Extracting features for lead ID: ${leadId}`);
    
    // Get lead data
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*, owner:owner_id(*)')
      .eq('id', leadId)
      .single();
    
    if (leadError) {
      console.error('Error fetching lead for feature extraction:', leadError);
      throw new Error(`Error fetching lead: ${leadError.message}`);
    }
    
    if (!lead) {
      throw new Error(`Lead not found with ID: ${leadId}`);
    }
    
    // Get interaction data
    const { data: emails, error: emailsError } = await supabase
      .from('lead_emails')
      .select('*')
      .eq('lead_id', leadId);
      
    const { data: calls, error: callsError } = await supabase
      .from('lead_calls')
      .select('*')
      .eq('lead_id', leadId);
      
    const { data: meetings, error: meetingsError } = await supabase
      .from('meetings')
      .select('*')
      .eq('lead_id', leadId);
      
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('*')
      .eq('lead_id', leadId);
      
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('lead_id', leadId);
      
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .eq('lead_id', leadId);
    
    // Calculate days since created
    const createdAt = new Date(lead.created_at);
    const now = new Date();
    const daysSinceCreated = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    // Find last contact date from activities
    let lastContactDate = createdAt;
    if (activities && activities.length > 0) {
      const contactActivities = activities.filter(a => 
        ['email', 'call', 'meeting', 'note'].includes(a.activity_type)
      );
      
      if (contactActivities.length > 0) {
        const sortedActivities = contactActivities.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        lastContactDate = new Date(sortedActivities[0].created_at);
      }
    }
    
    const daysSinceLastContact = Math.floor((now.getTime() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate task completion rate
    const completedTasks = tasks ? tasks.filter(t => t.completed).length : 0;
    const taskCompletionRate = tasks && tasks.length > 0 ? completedTasks / tasks.length : 0;
    
    // One-hot encode status
    const statusFeatures = {
      status_new: lead.status === LeadStatus.NEW ? 1 : 0,
      status_contacted: lead.status === LeadStatus.CONTACTED ? 1 : 0,
      status_qualified: lead.status === LeadStatus.QUALIFIED ? 1 : 0,
      status_proposal: lead.status === LeadStatus.PROPOSAL ? 1 : 0,
      status_negotiation: lead.status === LeadStatus.NEGOTIATION ? 1 : 0,
    };
    
    // One-hot encode source
    const sourceFeatures = {
      source_website: lead.source === LeadSource.WEBSITE ? 1 : 0,
      source_referral: lead.source === LeadSource.REFERRAL ? 1 : 0,
      source_event: lead.source === LeadSource.EVENT ? 1 : 0,
      source_cold_call: lead.source === LeadSource.COLD_CALL ? 1 : 0,
      source_social: lead.source === LeadSource.SOCIAL ? 1 : 0,
    };
    
    // Extract BANT (Budget, Authority, Need, Timeline) from custom fields or notes
    const customFields = lead.custom_fields || {};
    const hasBANT = {
      has_budget: customFields.has_budget ? 1 : 0,
      has_authority: customFields.has_authority ? 1 : 0,
      has_need: customFields.has_need ? 1 : 0,
      has_timeline: customFields.has_timeline ? 1 : 0,
    };
    
    // Combine all features
    const features: LeadFeatures = {
      // Lead properties
      lead_score: lead.lead_score || 0,
      days_since_created: daysSinceCreated,
      days_since_last_contact: daysSinceLastContact,
      
      // Interaction counts
      email_count: emails ? emails.length : 0,
      call_count: calls ? calls.length : 0,
      meeting_count: meetings ? meetings.length : 0,
      note_count: notes ? notes.length : 0,
      task_count: tasks ? tasks.length : 0,
      task_completion_rate: taskCompletionRate,
      
      // Status features
      ...statusFeatures,
      
      // Source features
      ...sourceFeatures,
      
      // BANT features
      ...hasBANT,
      
      // Company size (if available)
      company_size: customFields.company_size || 0,
    };
    
    console.log(`Features extracted for lead ID ${leadId}:`, features);
    return features;
    
  } catch (error) {
    console.error('Error extracting features:', error);
    throw error;
  }
}

/**
 * Extract features for multiple leads
 */
export async function batchExtractFeatures(leadIds: number[]): Promise<{ id: number; features: LeadFeatures }[]> {
  const results: { id: number; features: LeadFeatures }[] = [];
  
  for (const leadId of leadIds) {
    try {
      const features = await extractFeaturesForLead(leadId);
      results.push({ id: leadId, features });
    } catch (error) {
      console.error(`Error extracting features for lead ${leadId}:`, error);
      // Continue with other leads even if one fails
    }
  }
  
  return results;
} 