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
    const { id } = req.query;
    const { 
      current_workflow, 
      current_stage, 
      days_in_stage, 
      conversion_probability,
      last_activity_date 
    } = req.body;

    if (!id || !current_workflow || !current_stage || typeof days_in_stage !== 'number' || typeof conversion_probability !== 'number') {
      return res.status(400).json({ error: 'Missing or invalid required parameters' });
    }

    // Get engagement data from the database
    const { data: engagementData, error: engagementError } = await supabaseAdmin
      .from('lead_activities')
      .select('created_at')
      .eq('lead_id', id)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .order('created_at', { ascending: false });

    if (engagementError) {
      console.error('Error fetching lead engagement data:', engagementError);
      return res.status(500).json({ error: 'Failed to fetch lead engagement data' });
    }

    // Determine if lead has shown engagement in the last 7 days
    const hasEngagement = engagementData && engagementData.length > 0;

    // Calculate days since last activity
    const daysSinceLastActivity = last_activity_date 
      ? Math.floor((Date.now() - new Date(last_activity_date).getTime()) / (1000 * 3600 * 24))
      : engagementData && engagementData.length > 0
        ? Math.floor((Date.now() - new Date(engagementData[0].created_at).getTime()) / (1000 * 3600 * 24))
        : days_in_stage; // Fallback to days_in_stage if no activity data

    // Map the workflow name to WorkflowType
    const workflowType = Object.values(WorkflowType).find(
      type => type.toLowerCase() === current_workflow.toLowerCase()
    ) || WorkflowType.EDUCATION;

    // Evaluate transition using the workflow rules
    const evaluationResult = clientEvaluateTransition(
      workflowType,
      current_stage as PipelineStage,
      days_in_stage,
      hasEngagement,
      conversion_probability,
      daysSinceLastActivity
    );

    return res.status(200).json({
      shouldTransition: evaluationResult.shouldTransition,
      recommendedStage: evaluationResult.nextStage,
      reason: evaluationResult.reason,
      analysis: {
        hasEngagement,
        daysSinceLastActivity,
        conversionProbability: conversion_probability,
        daysInStage: days_in_stage
      }
    });
  } catch (error) {
    console.error('Error in evaluate-transition API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 