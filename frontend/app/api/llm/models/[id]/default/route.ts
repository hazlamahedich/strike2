import { NextRequest, NextResponse } from 'next/server';
import { LLMModel } from '@/lib/types/llm';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://elpqvskcixfsgeavjfhb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey as string);

/**
 * Set a model as the default model
 * 
 * PUT /api/llm/models/:id/default
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid model ID' },
        { status: 400 }
      );
    }

    // First, check if the model exists
    const { data: model, error: fetchError } = await supabase
      .from('llm_models')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !model) {
      console.error('Error fetching model:', fetchError);
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      );
    }
    
    // Run in a transaction
    // First, remove default status from all models
    const { error: updateAllError } = await supabase
      .from('llm_models')
      .update({ is_default: false })
      .neq('id', 0); // Update all rows
    
    if (updateAllError) {
      console.error('Error removing default status from models:', updateAllError);
      return NextResponse.json(
        { error: 'Failed to update models' },
        { status: 500 }
      );
    }
    
    // Set this model as default
    const { error: updateModelError } = await supabase
      .from('llm_models')
      .update({ is_default: true })
      .eq('id', id);
    
    if (updateModelError) {
      console.error('Error setting model as default:', updateModelError);
      return NextResponse.json(
        { error: 'Failed to set model as default' },
        { status: 500 }
      );
    }
    
    // Get the updated model
    const { data: updatedModel, error: fetchUpdatedError } = await supabase
      .from('llm_models')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchUpdatedError) {
      console.error('Error fetching updated model:', fetchUpdatedError);
      return NextResponse.json(
        { error: 'Model updated but failed to fetch updated data' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(updatedModel);
  } catch (error) {
    console.error('Error setting default model:', error);
    return NextResponse.json(
      { error: 'Failed to set default model' },
      { status: 500 }
    );
  }
} 