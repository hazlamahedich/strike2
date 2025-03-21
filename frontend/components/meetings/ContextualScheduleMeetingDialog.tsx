'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MeetingDialogType, useMeetingDialog } from '@/contexts/MeetingDialogContext';
import { EnhancedMeetingForm } from './EnhancedMeetingForm';
import { Lead } from '@/lib/types/lead';
import { Meeting, MeetingStatus } from '@/lib/types/meeting';
import { useToast } from '@/components/ui/use-toast';
import { MeetingDialogContent } from '@/components/ui/meeting-dialog';
import supabase from '@/lib/supabase/client';
import { createMeeting } from '@/lib/api/meetings';
import { processMeetingWithCalendarInvite } from '@/lib/services/calendarService';
import { getMockDataStatus } from '@/lib/utils/mockDataUtils';

export function ContextualScheduleMeetingDialog({
  dialogId
}: {
  dialogId: string;
}) {
  const { toast } = useToast();
  const {
    getDialogData,
    closeMeetingDialog,
  } = useMeetingDialog();
  const [isScheduling, setIsScheduling] = useState(false);
  const [isLoadingLead, setIsLoadingLead] = useState(true);
  const [lead, setLead] = useState<Lead | null>(null);
  
  // Helper function to create a fallback lead
  const createFallbackLead = (id: string) => {
    console.log(`Creating fallback lead for ID: ${id}`);
    setLead({
      id: id,
      name: `Lead #${id}`,
      email: '',
      phone: '',
      company: '',
      status: 'new',
      source: 'website',
      first_name: 'Unknown',
      last_name: `#${id}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notes: ''
    } as Lead);
  };
  
  // Helper function to create a mock lead for testing
  const createMockLead = (id: string) => {
    const mockLead = {
      id: id,
      name: 'John Smith',
      email: 'john.smith@example.com',
      phone: '(555) 123-4567',
      company: 'Acme Corporation',
      position: 'Sales Manager',
      status: 'new',
      source: 'website',
      first_name: 'John',
      last_name: 'Smith',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Lead;
    console.log('Creating mock lead:', mockLead);
    setLead(mockLead);
  };
  
  // Check for mock mode using the utility function
  const isMockMode = getMockDataStatus();
  
  useEffect(() => {
    const dialogData = getDialogData(dialogId);
    console.log(`ContextualScheduleMeetingDialog - Retrieved dialog data for ${dialogId}:`, dialogData);
    
    // Extract leadId from dialog data, with proper validation
    const leadId = dialogData?.data?.leadId;
    
    if (leadId) {
      console.log(`ContextualScheduleMeetingDialog - Loading lead data for ID: ${leadId}`);
      
      // Fetch lead data from Supabase
      const fetchLeadData = async () => {
        try {
          setIsLoadingLead(true);
          
          // Check if we're in mock mode using the utility function
          if (isMockMode) {
            console.log('Using mock data - creating a mock lead');
            // Create a mock lead
            setTimeout(() => {
              createMockLead(leadId);
              setIsLoadingLead(false);
            }, 500);
            return;
          }
          
          // First try directly with Supabase
          console.log(`Fetching lead data directly from Supabase for ID: ${leadId}`);
          
          try {
            // Add timeout to prevent hanging requests
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Supabase fetch timeout')), 5000)
            );
            
            const fetchPromise = supabase
              .from('leads')
              .select('*')
              .eq('id', leadId)
              .single();
              
            // Race the fetch against a timeout
            const { data, error } = await Promise.race([
              fetchPromise,
              timeoutPromise.then(() => ({ data: null, error: new Error('Timeout') }))
            ]) as any;
            
            if (error) {
              console.warn('Supabase fetch failed:', error);
              // Check if it's a connection error or auth error
              if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
                console.error('Authentication error with Supabase:', error);
                toast({
                  variant: "destructive",
                  title: "Authentication Error",
                  description: "Your session may have expired. Please refresh the page."
                });
              }
              // Continue with API fallback
            } else if (data) {
              console.log('Found lead in Supabase:', data);
              setLead(data as Lead);
              setIsLoadingLead(false);
              return; // Success, exit early
            }
            
            // Try API endpoint as fallback
            console.log('Trying API endpoint fallback...');
            try {
              const response = await fetch(`/api/leads/${leadId}`);
              if (response.ok) {
                const data = await response.json();
                console.log('Found lead via API:', data);
                setLead(data as Lead);
              } else {
                console.warn(`API fetch failed with status ${response.status}`);
                // Create fallback lead
                createFallbackLead(leadId);
              }
            } catch (apiError) {
              console.warn('API exception caught:', apiError);
              createFallbackLead(leadId);
            }
          } catch (error: any) {
            console.error('Error fetching lead data (will use fallback):', error);
            // Show an appropriate error toast
            if (error.message?.includes('fetch')) {
              toast({
                variant: "destructive",
                title: "Connection Error",
                description: "Could not connect to the database. Check your internet connection."
              });
            } else {
              toast({
                variant: "destructive",
                title: "Data Fetch Error",
                description: "Error loading lead information. Using fallback data."
              });
            }
            
            createFallbackLead(leadId);
          }
        } catch (err) {
          console.error('Exception loading lead data (will use fallback):', err);
          createFallbackLead(leadId);
        } finally {
          setIsLoadingLead(false);
        }
      };
      
      fetchLeadData();
    } else {
      console.error('No leadId provided in dialog data');
      setIsLoadingLead(false);
      // Create an empty lead as fallback
      createFallbackLead('unknown');
    }
  }, [dialogId, getDialogData, toast, isMockMode]);
  
  // If we don't have lead data yet, show a loading state
  if (isLoadingLead) {
    console.log(`ContextualScheduleMeetingDialog - Rendering loading state for ${dialogId}`);
    return (
      <MeetingDialogContent
        dialogId={dialogId}
        dialogType={MeetingDialogType.SCHEDULE}
        title="Schedule Meeting"
        showCloseButton={true}
        draggable={true}
        onClose={() => closeMeetingDialog(dialogId)}
        className="min-w-[600px] w-auto max-w-[800px]"
      >
        <div className="w-full flex items-center justify-center pt-10 pb-10">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 dark:border-white"></div>
            <p className="text-muted-foreground">Loading lead information...</p>
          </div>
        </div>
      </MeetingDialogContent>
    );
  }
  
  const handleScheduleSuccess = (scheduledMeeting: Meeting) => {
    toast({
      title: "Success",
      description: "Meeting scheduled successfully"
    });
    closeMeetingDialog(dialogId);
  };
  
  // Handle schedule error
  const handleScheduleError = (error: Error) => {
    console.error('[ContextualScheduleMeetingDialog] Error scheduling meeting:', error);
    setIsScheduling(false);
    toast({
      variant: "destructive",
      title: "Error",
      description: error.message || "Failed to schedule meeting"
    });
  };
  
  // Ensure we have a lead object to work with
  const validLead = lead || {
    id: 'unknown',
    name: 'Unknown Lead',
    email: '',
    phone: '',
    company: '',
    status: 'new',
    source: 'website',
    first_name: 'Unknown',
    last_name: 'Lead',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  } as Lead;
  
  console.log(`ContextualScheduleMeetingDialog - Rendering full dialog for lead ${validLead.id} with dialogId ${dialogId}`);
  console.log('Lead details for form:', {
    id: validLead.id,
    name: validLead.name,
    email: validLead.email,
    phone: validLead.phone,
    company: validLead.company
  });
  
  // Prepare meeting title with lead's name
  const suggestedTitle = `Meeting with ${validLead.name}`.trim();
  
  // Prepare initial values for the form
  const initialValues = {
    lead_id: validLead.id.toString(),
    lead_email: validLead.email || '',
    lead_phone: validLead.phone || '',
    title: suggestedTitle
  };
  
  // Handle a successful meeting scheduling with calendar invite
  const handleMeetingScheduled = (meeting: Meeting) => {
    console.log('Meeting scheduled:', meeting);
    
    if (isMockMode) {
      // In mock mode, simulate a successful calendar invite
      console.log('Mock mode: Simulating calendar invite sending for meeting:', meeting.id);
      toast({
        title: "Success",
        description: "Meeting scheduled and calendar invite sent (mock)"
      });
      closeMeetingDialog(dialogId);
      return;
    }
    
    // Send calendar invite for real mode
    processMeetingWithCalendarInvite(meeting)
      .then(result => {
        if (result.success) {
          toast({
            title: "Success",
            description: result.message
          });
        } else {
          console.warn('Calendar invite issue:', result.message);
          // Even though there was a calendar issue, the meeting was still created
          toast({
            variant: "destructive",
            title: "Meeting Scheduled",
            description: "Meeting was created but " + result.message.toLowerCase()
          });
        }
        closeMeetingDialog(dialogId);
      })
      .catch(error => {
        console.error('Error sending calendar invite:', error);
        // Meeting was created but calendar invite failed
        toast({
          variant: "destructive",
          title: "Meeting Scheduled",
          description: "Meeting was created but we couldn't send the calendar invite."
        });
        closeMeetingDialog(dialogId);
      });
  };
  
  // Render the form and handle scheduling
  return (
    <MeetingDialogContent
      dialogId={dialogId}
      dialogType={MeetingDialogType.SCHEDULE}
      title={`Schedule Meeting with ${validLead.name}`.trim()}
      showCloseButton={true}
      draggable={true}
      onClose={() => closeMeetingDialog(dialogId)}
      className="min-w-[600px] w-auto max-w-[800px]"
    >
      <div className="w-full overflow-y-auto overflow-x-auto styled-scrollbar pt-6 px-4 pb-4">
        <EnhancedMeetingForm
          leadOptions={[validLead]}
          initialTimeSlot={null}
          initialValues={initialValues}
          onSuccess={(newMeeting) => {
            console.log('[ContextualScheduleMeetingDialog] Meeting scheduled successfully:', newMeeting);
            handleMeetingScheduled(newMeeting);
          }}
          onError={handleScheduleError}
          onCancel={() => closeMeetingDialog(dialogId)}
        />
        
        {isScheduling && (
          <div className="mt-4 flex items-center justify-center p-4">
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
              <p className="text-sm text-muted-foreground">Scheduling meeting and sending calendar invite...</p>
            </div>
          </div>
        )}
      </div>
    </MeetingDialogContent>
  );
} 