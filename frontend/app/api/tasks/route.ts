import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse query parameters
    const url = new URL(req.url);
    const leadId = url.searchParams.get('lead_id');
    const assignedTo = url.searchParams.get('assigned_to');
    const status = url.searchParams.get('status');
    
    // Start building the query
    let query = supabase.from('tasks').select('*');
    
    // Apply filters if provided
    if (leadId) {
      query = query.eq('lead_id', leadId);
    }
    
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    // Add order by created_at to get latest tasks first
    query = query.order('created_at', { ascending: false });
    
    // Execute the query
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in GET tasks:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await req.json();
    
    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' }, 
        { status: 400 }
      );
    }
    
    // Prepare task data
    const taskData = {
      title: body.title,
      description: body.description,
      due_date: body.due_date,
      priority: body.priority || 'medium',
      status: body.status || 'pending',
      assigned_to: body.assigned_to,
      lead_id: body.lead_id,
      created_by: session.user?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      attachments: body.attachments
    };
    
    // Insert task
    const { data, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating task:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Record activity
    if (data) {
      await supabase.from('activities').insert({
        user_id: session.user?.id,
        activity_type: 'task_created',
        resource_type: 'task',
        resource_id: data.id.toString(),
        lead_id: body.lead_id?.toString(),
        details: {
          task_title: body.title,
          task_priority: body.priority
        },
        created_at: new Date().toISOString()
      });
      
      // If lead_id is present, add to lead timeline
      if (body.lead_id) {
        await supabase.from('lead_timeline').insert({
          lead_id: body.lead_id,
          type: 'task_create',
          content: `Created task: "${body.title}"${body.attachments ? ' with attachments' : ''}`,
          created_at: new Date().toISOString(),
          user_id: session.user?.id
        });
      }
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST tasks:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
} 