import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://elpqvskcixfsgeavjfhb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey as string);

/**
 * GET /api/company-analysis/status/[id]
 * 
 * Get the status of a company analysis for a specific lead
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = params.id;
    
    // Check if we should use mock data
    const useMock = process.env.USE_MOCK_DATA === 'true';
    if (useMock) {
      // For mock data, we'll randomly decide if the analysis is in progress or completed
      // This is just for demonstration purposes
      const statuses = ['pending', 'in_progress', 'completed'];
      const randomIndex = Math.floor(Math.random() * statuses.length);
      const status = statuses[randomIndex];
      
      return NextResponse.json({
        status,
        progress: status === 'pending' ? 10 : status === 'in_progress' ? 50 : 100,
        lead_id: leadId,
        updated_at: new Date().toISOString()
      });
    }
    
    // Check if there's an analysis in progress
    const { data: inProgress, error: inProgressError } = await supabase
      .from('company_analyses_status')
      .select('*')
      .eq('lead_id', leadId)
      .eq('status', 'in_progress')
      .single();
    
    if (inProgress) {
      return NextResponse.json({
        status: 'in_progress',
        progress: inProgress.progress || 50,
        lead_id: leadId,
        updated_at: inProgress.updated_at
      });
    }
    
    // Check if there's a pending analysis
    const { data: pending, error: pendingError } = await supabase
      .from('company_analyses_status')
      .select('*')
      .eq('lead_id', leadId)
      .eq('status', 'pending')
      .single();
    
    if (pending) {
      return NextResponse.json({
        status: 'pending',
        progress: pending.progress || 10,
        lead_id: leadId,
        updated_at: pending.updated_at
      });
    }
    
    // Check if there's a completed analysis
    const { data: completed, error: completedError } = await supabase
      .from('company_analyses')
      .select('status, updated_at')
      .eq('lead_id', leadId)
      .eq('status', 'completed')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
    
    if (completed) {
      return NextResponse.json({
        status: 'completed',
        progress: 100,
        lead_id: leadId,
        updated_at: completed.updated_at
      });
    }
    
    // If no analysis found at all, return not found
    return NextResponse.json({ 
      status: 'not_found',
      progress: 0,
      lead_id: leadId,
      message: 'No analysis found for this lead'
    });
    
  } catch (error) {
    console.error('Error in company analysis status API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        status: 'error',
        progress: 0,
        lead_id: params.id
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/company-analysis/status/[id]
 * 
 * Update the status of a company analysis for a specific lead
 * This is used by background workers to update the progress
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = params.id;
    const requestData = await request.json();
    
    const { status, progress, message } = requestData;
    
    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }
    
    // Update the status
    const { data, error } = await supabase
      .from('company_analyses_status')
      .upsert({
        lead_id: leadId,
        status,
        progress: progress || 0,
        message,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error updating company analysis status:', error);
      return NextResponse.json(
        { error: 'Failed to update status' },
        { status: 500 }
      );
    }
    
    // If status is 'completed', we should also update the main analysis record
    if (status === 'completed') {
      try {
        await supabase
          .from('company_analyses')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('lead_id', leadId);
      } catch (updateError) {
        console.error('Failed to update company analysis status:', updateError);
        // Continue anyway, this is not a critical error
      }
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in company analysis status API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 