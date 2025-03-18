import supabase from '@/lib/supabase/client';

export interface Task {
  id: number;
  title: string;
  description?: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to?: string;
  lead_id?: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to?: string;
  lead_id?: number;
  created_by?: string;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to?: string;
}

// Get all tasks
export const getTasks = async () => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*');
    
  return { data, error };
};

// Get tasks by lead ID
export const getTasksByLeadId = async (leadId: number) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('lead_id', leadId);
    
  return { data, error };
};

// Get a specific task by ID
export const getTask = async (id: number) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();
    
  return { data, error };
};

// Create a new task
export const createTask = async (taskData: TaskCreate) => {
  const newTask = {
    ...taskData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  // Start a transaction
  const { data, error } = await supabase
    .from('tasks')
    .insert(newTask)
    .select()
    .single();
    
  if (data && !error) {
    // Record activity in the activities table
    await supabase.from('activities').insert({
      user_id: taskData.created_by,
      activity_type: 'task_created',
      resource_type: 'task',
      resource_id: data.id.toString(),
      lead_id: taskData.lead_id?.toString(),
      details: {
        task_title: taskData.title,
        task_priority: taskData.priority
      },
      created_at: new Date().toISOString()
    });
  }
    
  return { data, error };
};

// Update an existing task
export const updateTask = async (id: number, taskData: TaskUpdate) => {
  const updatedTask = {
    ...taskData,
    updated_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('tasks')
    .update(updatedTask)
    .eq('id', id)
    .select()
    .single();
    
  return { data, error };
};

// Delete a task
export const deleteTask = async (id: number) => {
  const { data, error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);
    
  return { data, error };
};

// Mark a task as completed
export const completeTask = async (id: number) => {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
    
  return { data, error };
};

// Get tasks by assigned user
export const getTasksByAssignedUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('assigned_to', userId);
    
  return { data, error };
};

// Get tasks by status
export const getTasksByStatus = async (status: string) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('status', status);
    
  return { data, error };
};

// Get task notes
export const getTaskNotes = async (taskId: number) => {
  const { data, error } = await supabase
    .from('task_notes')
    .select('*')
    .eq('task_id', taskId);
    
  return { data, error };
};

// Add task note
export const addTaskNote = async (taskId: number, note: string) => {
  const { data, error } = await supabase
    .from('task_notes')
    .insert({
      task_id: taskId,
      content: note,
      created_at: new Date().toISOString()
    })
    .select()
    .single();
    
  return { data, error };
}; 