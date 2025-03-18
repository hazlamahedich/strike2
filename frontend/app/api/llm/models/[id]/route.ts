import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://elpqvskcixfsgeavjfhb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey as string);

/**
 * Get a specific LLM model by ID
 * 
 * GET /api/llm/models/:id
 */
export async function GET(
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
    
    const { data: model, error } = await supabase
      .from('llm_models')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching LLM model:', error);
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(model);
  } catch (error) {
    console.error('Error in GET /api/llm/models/:id:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update an existing LLM model
 * 
 * PUT /api/llm/models/:id
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
    
    // Parse the request body
    const updates = await request.json();
    
    // Add updated timestamp
    updates.updated_at = new Date().toISOString();
    
    // If this is marked as default, first update all other models
    if (updates.is_default) {
      const { error: updateError } = await supabase
        .from('llm_models')
        .update({ is_default: false })
        .neq('id', id);
      
      if (updateError) {
        console.error('Error updating existing models:', updateError);
        return NextResponse.json(
          { error: 'Failed to update existing models' },
          { status: 500 }
        );
      }
    }
    
    // Update the model
    const { data, error } = await supabase
      .from('llm_models')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating LLM model:', error);
      return NextResponse.json(
        { error: 'Failed to update model' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT /api/llm/models/:id:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Delete an LLM model
 * 
 * DELETE /api/llm/models/:id
 */
export async function DELETE(
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
    
    // Check if this is the default model
    const { data: model, error: fetchError } = await supabase
      .from('llm_models')
      .select('is_default')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Error checking model:', fetchError);
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      );
    }
    
    // If this is the default model, we should not allow deletion
    if (model.is_default) {
      return NextResponse.json(
        { error: 'Cannot delete the default model. Please set another model as default first.' },
        { status: 400 }
      );
    }
    
    // Delete the model
    const { error: deleteError } = await supabase
      .from('llm_models')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Error deleting LLM model:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete model' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/llm/models/:id:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH is a common alternative to PUT for partial updates
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return PUT(request, { params });
} 