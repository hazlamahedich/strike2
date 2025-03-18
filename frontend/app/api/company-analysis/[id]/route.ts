import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://elpqvskcixfsgeavjfhb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey as string);

/**
 * GET /api/company-analysis/[id]
 * 
 * Retrieve company analysis for a specific lead
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
      return NextResponse.json({
        status: 'completed',
        website_url: 'https://example.com',
        updated_at: new Date().toISOString(),
        analysis: {
          company_summary: 'Example Corp is a leading provider of innovative software solutions for businesses of all sizes.',
          industry: 'Software & Technology',
          products_services: [
            'AI-powered CRM systems',
            'Data analytics platforms',
            'Cloud infrastructure services',
            'Business intelligence tools'
          ],
          value_proposition: 'Helping businesses leverage AI and data to drive growth and improve customer relationships.',
          target_audience: 'Mid-size to enterprise businesses looking to modernize their technology stack.',
          company_size_estimate: 'Medium (50-200 employees)',
          strengths: [
            'Strong technical expertise',
            'Innovative product offerings',
            'Established market presence',
            'Comprehensive solution suite'
          ],
          opportunities: [
            'Expanding into new markets',
            'Upselling additional services',
            'Partnership opportunities',
            'Integration with existing systems'
          ],
          conversion_strategy: 'Focus on demonstrating ROI and integration capabilities.',
          key_topics: [
            'Digital transformation',
            'AI implementation',
            'Data security',
            'Operational efficiency'
          ],
          potential_pain_points: [
            'Legacy system integration',
            'Data migration challenges',
            'Staff training and adoption',
            'Budget constraints'
          ],
          lead_score_factors: [
            'Strong alignment with our solution',
            'Active growth phase',
            'Recent technology investments',
            'Engagement with marketing content'
          ]
        }
      });
    }
    
    // Get company analysis data from database
    const { data, error } = await supabase
      .from('company_analyses')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      // If no data is found, return 404
      if (error.code === 'PGRST116') {
        return NextResponse.json({ status: 'not_found' }, { status: 404 });
      }
      
      console.error('Error fetching company analysis:', error);
      return NextResponse.json(
        { error: 'Failed to fetch company analysis' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in company analysis API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/company-analysis/[id]
 * 
 * Create or update company analysis for a lead
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = params.id;
    const requestData = await request.json();
    
    const { analysis, website_url, model_info } = requestData;
    
    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis data is required' },
        { status: 400 }
      );
    }
    
    // Insert or update the company analysis
    const { data, error } = await supabase
      .from('company_analyses')
      .upsert({
        lead_id: leadId,
        website_url,
        status: 'completed',
        analysis,
        model_provider: model_info?.provider,
        model_name: model_info?.model_name,
        tokens_used: model_info?.tokens,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving company analysis:', error);
      return NextResponse.json(
        { error: 'Failed to save company analysis' },
        { status: 500 }
      );
    }
    
    // Also update the lead with the analysis insights
    try {
      await supabase
        .from('leads')
        .update({
          company_industry: analysis.industry,
          company_size: analysis.company_size_estimate,
          last_analysis_at: new Date().toISOString()
        })
        .eq('id', leadId);
    } catch (leadUpdateError) {
      console.error('Failed to update lead with analysis insights:', leadUpdateError);
      // Continue anyway, this is not a critical error
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in company analysis API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/company-analysis/[id]
 * 
 * Delete company analysis for a lead
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = params.id;
    
    const { error } = await supabase
      .from('company_analyses')
      .delete()
      .eq('lead_id', leadId);
    
    if (error) {
      console.error('Error deleting company analysis:', error);
      return NextResponse.json(
        { error: 'Failed to delete company analysis' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in company analysis API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 