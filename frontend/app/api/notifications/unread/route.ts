import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // For now, return mock notifications
    // In a real implementation, you would fetch from a database
    const mockNotifications = [
      { 
        id: '1', 
        title: 'New lead assigned', 
        content: 'A new lead has been assigned to you.', 
        created_at: new Date().toISOString(), 
        is_read: false 
      },
      { 
        id: '2', 
        title: 'Meeting reminder', 
        content: 'You have a meeting in 30 minutes.', 
        created_at: new Date().toISOString(), 
        is_read: true 
      },
      { 
        id: '3', 
        title: 'Task completed', 
        content: 'Your task "Follow up with client" has been marked as complete.', 
        created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        is_read: false 
      },
    ];
    
    return NextResponse.json(mockNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
} 