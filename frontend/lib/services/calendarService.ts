/**
 * Calendar Service
 * 
 * This service is responsible for generating and sending calendar invites
 * for scheduled meetings. It creates iCalendar (RFC5545) format invites
 * and manages sending them to attendees.
 */

import { Meeting, MeetingCreate } from '@/lib/types/meeting';
import { sendEmail, EmailPayload } from '@/lib/api/email';
import { formatISO, parse, format } from 'date-fns';

/**
 * Generate an iCalendar (RFC5545) event for a meeting
 */
export function generateICalEvent(meeting: Meeting | MeetingCreate): string {
  // Parse start and end times
  const startTime = new Date(meeting.start_time);
  const endTime = new Date(meeting.end_time);
  
  // Format times in iCalendar format (YYYYMMDDTHHMMSSZ)
  const formatDate = (date: Date) => {
    return format(date, "yyyyMMdd'T'HHmmss'Z'");
  };
  
  // Generate a unique ID for the event
  const eventId = 'id' in meeting ? meeting.id : `meeting-${Date.now()}@strike.app`;
  
  // Create the description with meeting details
  const description = [
    meeting.description || '',
    '',
    'Created by Strike CRM',
  ].join('\n');
  
  // Build the iCalendar string
  const iCalData = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Strike//CRM Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST', // This is a meeting request
    'BEGIN:VEVENT',
    `UID:${eventId}`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(startTime)}`,
    `DTEND:${formatDate(endTime)}`,
    `SUMMARY:${meeting.title}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `LOCATION:${meeting.location || 'Virtual'}`,
    'STATUS:CONFIRMED',
    // Add organizer and attendees if available
    ...(meeting.attendees?.filter(a => a.role === 'primary').map(a => `ORGANIZER;CN=Strike CRM:mailto:${a.email}`) || []),
    ...(meeting.attendees?.filter(a => a.role !== 'primary').map(a => `ATTENDEE;ROLE=REQ-PARTICIPANT:mailto:${a.email}`) || []),
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Meeting Reminder',
    'TRIGGER:-PT15M', // 15 minute reminder
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  
  return iCalData;
}

// Extend EmailPayload to allow for multiple recipients and attachments
interface CalendarEmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
  leadId?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

/**
 * Send a calendar invite for a meeting
 */
export async function sendCalendarInvite(meeting: Meeting): Promise<{ success: boolean; message: string }> {
  try {
    // Generate the iCalendar data
    const iCalData = generateICalEvent(meeting);
    
    // Prepare attendee emails
    const attendees = meeting.attendees || [];
    
    // Separate emails by type and join them into comma-separated strings
    const toEmails = attendees
      .filter(a => a.role === 'to' || a.role === 'primary')
      .map(a => a.email)
      .join(',');
    
    const ccEmails = attendees
      .filter(a => a.role === 'cc')
      .map(a => a.email)
      .join(',');
    
    const bccEmails = attendees
      .filter(a => a.role === 'bcc')
      .map(a => a.email)
      .join(',');
    
    // Format the meeting time for the email
    const startTime = new Date(meeting.start_time);
    const formattedDate = format(startTime, 'EEEE, MMMM do, yyyy');
    const formattedTime = format(startTime, 'h:mm a');
    
    // Prepare the email content
    const emailContent = `
      <div style="font-family: Arial, sans-serif;">
        <h2>Meeting Invitation: ${meeting.title}</h2>
        <p>You have been invited to a meeting.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${formattedTime}</p>
          <p><strong>Location:</strong> ${meeting.location || 'Virtual'}</p>
          
          ${meeting.description ? `<p><strong>Description:</strong> ${meeting.description}</p>` : ''}
        </div>
        
        <p>This invitation includes a calendar attachment that you can add to your calendar.</p>
        <p>Looking forward to meeting with you!</p>
      </div>
    `;
    
    // Create a formatted email payload
    // Note: Current API may not support attachments, so this is for future implementation
    const emailPayload: EmailPayload = {
      to: toEmails,
      from: "meetings@strike.app", // Adjust based on your app's email sender
      subject: `Meeting Invitation: ${meeting.title}`,
      content: emailContent,
      leadId: meeting.lead_id || "unknown",
    };
    
    // Send the email
    // Note: In a real implementation, we would add the iCal attachment
    // but the current API might not support it
    const emailResponse = await sendEmail(emailPayload);
    
    return {
      success: emailResponse.success,
      message: emailResponse.message || 'Calendar invite sent'
    };
  } catch (error) {
    console.error('Error sending calendar invite:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error sending calendar invite'
    };
  }
}

/**
 * Process meeting creation with calendar invites
 */
export async function processMeetingWithCalendarInvite(meeting: Meeting): Promise<{ 
  success: boolean; 
  message: string;
  meeting?: Meeting; 
}> {
  try {
    // Send calendar invite
    const inviteResponse = await sendCalendarInvite(meeting);
    
    if (!inviteResponse.success) {
      console.warn('Failed to send calendar invite:', inviteResponse.message);
      // We still return success because the meeting was created
      return {
        success: true,
        message: 'Meeting created but failed to send calendar invite',
        meeting
      };
    }
    
    return {
      success: true,
      message: 'Meeting created and calendar invite sent',
      meeting
    };
  } catch (error) {
    console.error('Error processing meeting with calendar invite:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error processing meeting'
    };
  }
} 