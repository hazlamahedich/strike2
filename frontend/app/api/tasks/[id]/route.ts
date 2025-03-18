import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const taskId = params.id;
    
    // Get task by ID
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();
    
    if (error) {
      console.error('Error fetching task:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in GET task:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const taskId = params.id;
    const body = await req.json();
    
    // Check if task exists
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();
    
    if (fetchError || !existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    // Prepare update data
    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    };
    
    // Update task
    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating task:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Record activity
    await supabase.from('activities').insert({
      user_id: session.user?.id,
      activity_type: 'task_updated',
      resource_type: 'task',
      resource_id: taskId,
      lead_id: data.lead_id?.toString(),
      details: {
        task_title: data.title,
        task_status: data.status,
        task_priority: data.priority
      },
      created_at: new Date().toISOString()
    });
    
    // If lead_id is present and status changed, add to lead timeline
    if (data.lead_id && existingTask.status !== data.status) {
      await supabase.from('lead_timeline').insert({
        lead_id: data.lead_id,
        type: 'task_update',
        content: `Updated task: "${data.title}" status changed to ${data.status}`,
        created_at: new Date().toISOString(),
        user_id: session.user?.id
      });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in PUT task:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const taskId = params.id;
    
    // Get task before deleting to record activity
    const { data: taskToDelete, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();
    
    if (fetchError || !taskToDelete) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    // Delete task
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
    
    if (error) {
      console.error('Error deleting task:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Record activity
    await supabase.from('activities').insert({
      user_id: session.user?.id,
      activity_type: 'task_deleted',
      resource_type: 'task',
      resource_id: taskId,
      lead_id: taskToDelete.lead_id?.toString(),
      details: {
        task_title: taskToDelete.title
      },
      created_at: new Date().toISOString()
    });
    
    // If lead_id is present, add to lead timeline
    if (taskToDelete.lead_id) {
      await supabase.from('lead_timeline').insert({
        lead_id: taskToDelete.lead_id,
        type: 'task_delete',
        content: `Deleted task: "${taskToDelete.title}"`,
        created_at: new Date().toISOString(),
        user_id: session.user?.id
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in DELETE task:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
} 