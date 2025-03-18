import { NextRequest, NextResponse } from 'next/server';
import { LLMModel } from '@/lib/types/llm';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://elpqvskcixfsgeavjfhb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey as string);

/**
 * Get all LLM models
 * 
 * GET /api/llm/models
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { data: models, error } = await supabase
      .from('llm_models')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching LLM models:', error);
      return NextResponse.json(
        { error: 'Failed to fetch LLM models' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(models || []);
  } catch (error) {
    console.error('Error in GET /api/llm/models:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Create a new LLM model
 * 
 * POST /api/llm/models
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse the request body
    const modelData = await request.json();
    
    // Validate required fields
    if (!modelData.provider || !modelData.model_name) {
      return NextResponse.json(
        { error: 'Provider and model name are required' },
        { status: 400 }
      );
    }
    
    // Add timestamps
    const now = new Date().toISOString();
    const newModel = {
      ...modelData,
      created_at: now,
      updated_at: now,
    };
    
    // If this is marked as default, first update all other models
    if (modelData.is_default) {
      const { error: updateError } = await supabase
        .from('llm_models')
        .update({ is_default: false })
        .neq('id', 0); // Update all rows
      
      if (updateError) {
        console.error('Error updating existing models:', updateError);
        return NextResponse.json(
          { error: 'Failed to update existing models' },
          { status: 500 }
        );
      }
    }
    
    // Insert the new model
    const { data, error } = await supabase
      .from('llm_models')
      .insert([newModel])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating LLM model:', error);
      return NextResponse.json(
        { error: 'Failed to create LLM model' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/llm/models:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 