/**
 * Calendar Integration Service
 * 
 * Handles integration with external calendar services like Google Calendar, Microsoft, and Apple
 */

import { LeadCalendarIntegration } from '@/lib/types/lead';
import axios from 'axios';
import { format, parseISO } from 'date-fns';

// Microsoft Graph API endpoints
const MICROSOFT_GRAPH_API = 'https://graph.microsoft.com/v1.0';

/**
 * Get a lead's busy times from their connected calendar
 * 
 * @param integration - Lead's calendar integration details
 * @param startTime - Start of time range to check
 * @param endTime - End of time range to check
 * @returns Array of busy time slots
 */
export async function getLeadBusyTimes(
  integration: LeadCalendarIntegration,
  startTime: Date,
  endTime: Date
): Promise<Array<{ start: string; end: string }>> {
  try {
    // Call our backend API instead of directly using Google/Microsoft APIs
    const response = await axios.post('/api/v1/calendar/busy-times', {
      integration_id: integration.id,
      provider: integration.provider,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString()
    });
    
    if (response.data && response.data.busy_times) {
      return response.data.busy_times;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching busy times:', error);
    throw new Error('Failed to fetch calendar availability');
  }
}

/**
 * Connect a lead to their Google Calendar
 * 
 * @param leadId - Lead ID
 * @param authCode - OAuth authorization code
 * @returns The created calendar integration
 */
export async function connectLeadToGoogleCalendar(
  leadId: string,
  authCode: string
): Promise<LeadCalendarIntegration> {
  try {
    // We'll call our backend API to handle the OAuth exchange
    const response = await axios.post('/api/v1/calendar/connect/google', {
      lead_id: leadId,
      auth_code: authCode
    });
    
    return response.data;
  } catch (error) {
    console.error('Error connecting to Google Calendar:', error);
    throw new Error('Failed to connect to Google Calendar');
  }
}

/**
 * Connect a lead to their Microsoft Calendar
 */
export async function connectLeadToMicrosoftCalendar(
  leadId: string,
  authCode: string
): Promise<LeadCalendarIntegration> {
  try {
    // We'll call our backend API to handle the OAuth exchange
    const response = await axios.post('/api/v1/calendar/connect/microsoft', {
      lead_id: leadId,
      auth_code: authCode
    });
    
    return response.data;
  } catch (error) {
    console.error('Error connecting to Microsoft Calendar:', error);
    throw new Error('Failed to connect to Microsoft Calendar');
  }
}

/**
 * Connect a lead to their Apple Calendar
 * Placeholder for future implementation
 */
export async function connectLeadToAppleCalendar(
  leadId: string,
  authCode: string
): Promise<LeadCalendarIntegration> {
  try {
    // We'll call our backend API to handle the OAuth exchange
    const response = await axios.post('/api/v1/calendar/connect/apple', {
      lead_id: leadId,
      auth_code: authCode
    });
    
    return response.data;
  } catch (error) {
    console.error('Error connecting to Apple Calendar:', error);
    throw new Error('Failed to connect to Apple Calendar');
  }
}

/**
 * Get a lead's calendar integration
 */
export async function getLeadCalendarIntegration(
  leadId: string
): Promise<LeadCalendarIntegration | null> {
  try {
    const response = await axios.get(`/api/v1/leads/${leadId}/calendar-integration`);
    
    if (response.data && response.data.id) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching calendar integration:', error);
    return null;
  }
}

/**
 * Check if slots conflict with lead's busy times
 * 
 * @param slots - Potential time slots
 * @param busyTimes - Lead's busy times
 * @returns Filtered slots with no conflicts
 */
export function filterAvailableSlots(
  slots: Array<{ start_time: string; end_time: string; score?: number }>,
  busyTimes: Array<{ start: string; end: string }>
): Array<{ start_time: string; end_time: string; score?: number }> {
  return slots.filter(slot => {
    const slotStart = new Date(slot.start_time);
    const slotEnd = new Date(slot.end_time);
    
    // Check if this slot overlaps with any busy time
    const hasConflict = busyTimes.some(busy => {
      const busyStart = new Date(busy.start);
      const busyEnd = new Date(busy.end);
      
      return (
        (slotStart >= busyStart && slotStart < busyEnd) || // Slot starts during busy time
        (slotEnd > busyStart && slotEnd <= busyEnd) || // Slot ends during busy time
        (slotStart <= busyStart && slotEnd >= busyEnd) // Slot contains busy time
      );
    });
    
    return !hasConflict;
  });
} 