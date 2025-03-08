/**
 * Communication Service
 * 
 * This service handles all communication functionality including emails, SMS, and calls.
 * It uses the global USE_MOCK_DATA flag to switch between mock data and real Supabase/API data.
 */

import { USE_MOCK_DATA } from '@/lib/config';
import supabase from '@/lib/supabase/client';

// Types
export interface SendEmailParams {
  to: string;
  subject: string;
  content: string;
  from?: string;
  lead_id?: number;
}

export interface EmailResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface GenerateEmailParams {
  context: string;
  tone?: 'professional' | 'friendly' | 'formal' | 'casual';
  purpose?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  team_id?: string;
  is_global?: boolean;
}

export interface ReceivedEmail {
  id: string;
  from: string;
  to: string;
  subject: string;
  content: string;
  received_at: string;
  read: boolean;
  labels?: string[];
  attachments?: Array<{ name: string; url: string; size: number }>;
}

export interface SMSParams {
  to: string;
  body: string;
  from?: string;
  lead_id?: number;
}

export interface SMSResponse {
  success: boolean;
  message: string;
  message_id?: string;
}

export interface SMSTemplate {
  id: number;
  name: string;
  body: string;
  created_by: number;
  team_id?: number;
  is_global: boolean;
  variables: string[];
  created_at: string;
  updated_at: string;
}

export interface CallParams {
  to: string;
  from?: string;
  notes?: string;
  lead_id?: number;
  duration?: number;
}

export interface CallResponse {
  success: boolean;
  message: string;
  call_id?: string;
}

export interface CallLog {
  id: number;
  contact_id?: number;
  lead_id?: number;
  direction: 'inbound' | 'outbound';
  duration?: number;
  notes?: string;
  caller_number: string;
  recipient_number: string;
  status: 'completed' | 'missed' | 'voicemail' | 'failed';
  call_time: string;
  call_sid?: string;
  recording_url?: string;
  transcription?: string;
  contact?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  company?: string;
  contact_type: string;
  created_at: string;
  updated_at: string;
}

// Email Functions

/**
 * Send an email
 */
export async function sendEmail(params: SendEmailParams): Promise<EmailResponse> {
  if (USE_MOCK_DATA) {
    console.log('Using mock data for sendEmail:', params);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock successful response
    return {
      success: true,
      message: 'Email sent successfully',
      data: {
        to: params.to,
        subject: params.subject,
        sentAt: new Date().toISOString(),
      },
    };
  } else {
    // Real implementation using API
    try {
      const response = await fetch('/api/v1/communications/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sent_to: params.to,
          sent_from: params.from || 'noreply@example.com',
          subject: params.subject,
          body: params.content,
          lead_id: params.lead_id,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to send email');
      }
      
      // If lead_id is provided, record in lead timeline
      if (params.lead_id && !USE_MOCK_DATA) {
        try {
          // Record the email in the lead_emails table
          const { data: emailData, error: emailError } = await supabase
            .from('lead_emails')
            .insert({
              lead_id: params.lead_id,
              subject: params.subject,
              body: params.content,
              recipient: params.to,
              sent_at: new Date().toISOString(),
              sent_by: (await supabase.auth.getUser()).data.user?.id,
              status: 'sent'
            })
            .select()
            .single();
            
          if (emailError) throw emailError;
          
          // Add to timeline
          await supabase.from('lead_timeline').insert({
            lead_id: params.lead_id,
            type: 'email',
            content: `Sent email: "${params.subject}"`,
            data: { 
              email_id: emailData.id, 
              subject: params.subject, 
              body_preview: params.content.substring(0, 100) 
            },
            created_at: new Date().toISOString(),
            user_id: (await supabase.auth.getUser()).data.user?.id
          });
        } catch (error) {
          console.error('Error recording email in lead timeline:', error);
          // Don't fail the overall operation if timeline recording fails
        }
      }
      
      return {
        success: true,
        message: 'Email sent successfully',
        data: data.details,
      };
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send email',
      };
    }
  }
}

/**
 * Generate an email using AI
 */
export async function generateEmailWithAI(params: GenerateEmailParams): Promise<{ subject: string; content: string }> {
  if (USE_MOCK_DATA) {
    console.log('Using mock data for generateEmailWithAI:', params);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock AI-generated email
    const tone = params.tone || 'professional';
    const purpose = params.purpose || 'general';
    
    let subject = '';
    let content = '';
    
    switch (purpose) {
      case 'follow_up':
        subject = 'Following up on our previous conversation';
        content = `<p>I wanted to follow up on our previous conversation about ${params.context}.</p>
                  <p>I'm looking forward to hearing your thoughts on this matter.</p>
                  <p>Best regards,<br>Your Name</p>`;
        break;
      case 'introduction':
        subject = 'Introduction and potential collaboration';
        content = `<p>I hope this email finds you well. I'm reaching out because I came across ${params.context} and thought there might be an opportunity for us to collaborate.</p>
                  <p>I'd love to schedule a call to discuss this further.</p>
                  <p>Best regards,<br>Your Name</p>`;
        break;
      default:
        subject = 'Regarding our potential collaboration';
        content = `<p>I hope this email finds you well. I'm writing to you regarding ${params.context}.</p>
                  <p>I believe this could be valuable for both of us and would appreciate your thoughts.</p>
                  <p>Looking forward to your response.</p>
                  <p>Best regards,<br>Your Name</p>`;
    }
    
    return { subject, content };
  } else {
    // Real implementation using API
    try {
      const response = await fetch('/api/v1/communications/email/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: params.context,
          tone: params.tone || 'professional',
          purpose: params.purpose || 'general',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate email with AI');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error generating email with AI:', error);
      throw error;
    }
  }
}

/**
 * Get email templates
 */
export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  if (USE_MOCK_DATA) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock templates
    return [
      {
        id: '1',
        name: 'Introduction',
        subject: 'Introduction from [Your Company]',
        content: '<p>Dear [Name],</p><p>I hope this email finds you well. I am reaching out from [Your Company] to introduce our services.</p><p>Best regards,<br>[Your Name]</p>',
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Follow-up',
        subject: 'Following up on our conversation',
        content: '<p>Dear [Name],</p><p>I wanted to follow up on our previous conversation about [Topic].</p><p>Best regards,<br>[Your Name]</p>',
        created_at: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'Meeting Request',
        subject: 'Request for a meeting',
        content: '<p>Dear [Name],</p><p>I would like to schedule a meeting to discuss [Topic].</p><p>Best regards,<br>[Your Name]</p>',
        created_at: new Date().toISOString(),
      },
    ];
  } else {
    // Real implementation using API or Supabase
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data as EmailTemplate[];
    } catch (error) {
      console.error('Error fetching email templates:', error);
      throw error;
    }
  }
}

/**
 * Get received emails
 */
export async function getReceivedEmails(): Promise<ReceivedEmail[]> {
  if (USE_MOCK_DATA) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Generate a random date within the last 30 days
    const getRandomDate = () => {
      const now = new Date();
      const daysAgo = Math.floor(Math.random() * 30);
      now.setDate(now.getDate() - daysAgo);
      return now.toISOString();
    };
    
    // Mock received emails
    return [
      {
        id: '1',
        from: 'john.doe@example.com',
        to: 'user@yourdomain.com',
        subject: 'Proposal for New Project',
        content: '<p>Hello,</p><p>I would like to discuss a new project opportunity with your team. Please find attached our proposal.</p><p>Best regards,<br>John Doe</p>',
        received_at: getRandomDate(),
        read: true,
        labels: ['Work', 'Important'],
        attachments: [
          { name: 'proposal.pdf', url: '#', size: 2500000 }
        ]
      },
      {
        id: '2',
        from: 'marketing@newsletter.com',
        to: 'user@yourdomain.com',
        subject: 'Weekly Industry Updates',
        content: '<p>Hello there,</p><p>Here are this week\'s industry updates and trends you should know about.</p><p>Regards,<br>Marketing Team</p>',
        received_at: getRandomDate(),
        read: false,
        labels: ['Newsletter']
      },
      {
        id: '3',
        from: 'support@saasplatform.com',
        to: 'user@yourdomain.com',
        subject: 'Your Subscription Renewal',
        content: '<p>Dear Customer,</p><p>Your subscription is due for renewal in 7 days. Please log in to your account to manage your subscription.</p><p>Thank you,<br>Support Team</p>',
        received_at: getRandomDate(),
        read: false,
        labels: ['Important']
      },
      {
        id: '4',
        from: 'sarah.johnson@partner.org',
        to: 'user@yourdomain.com',
        subject: 'Partnership Opportunity',
        content: '<p>Hello,</p><p>I represent Partner Organization and we are interested in exploring potential partnership opportunities with your company.</p><p>Looking forward to your response,<br>Sarah Johnson</p>',
        received_at: getRandomDate(),
        read: true
      },
      {
        id: '5',
        from: 'events@conference.com',
        to: 'user@yourdomain.com',
        subject: 'Invitation: Industry Conference 2023',
        content: '<p>Dear Professional,</p><p>You\'re invited to attend the Industry Conference 2023, taking place on November 15-17.</p><p>Early bird registration is now open!</p><p>Regards,<br>Events Team</p>',
        received_at: getRandomDate(),
        read: true,
        labels: ['Events']
      },
      {
        id: '6',
        from: 'no-reply@billing.com',
        to: 'user@yourdomain.com',
        subject: 'Your Monthly Invoice',
        content: '<p>Dear Customer,</p><p>Your monthly invoice is now available. Please find it attached.</p><p>Thank you for your business,<br>Billing Department</p>',
        received_at: getRandomDate(),
        read: false,
        labels: ['Finance'],
        attachments: [
          { name: 'invoice-oct2023.pdf', url: '#', size: 1200000 }
        ]
      }
    ];
  } else {
    // Real implementation using API or Supabase
    try {
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .order('received_at', { ascending: false });
      
      if (error) throw error;
      
      return data as ReceivedEmail[];
    } catch (error) {
      console.error('Error fetching received emails:', error);
      throw error;
    }
  }
}

// SMS Functions

/**
 * Send an SMS
 */
export async function sendSMS(params: SMSParams): Promise<SMSResponse> {
  if (USE_MOCK_DATA) {
    console.log(`Using mock data for sendSMS to ${params.to}: ${params.body}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { 
      success: true, 
      message: 'SMS sent successfully',
      message_id: `SM${Math.random().toString(36).substring(2, 15)}` 
    };
  } else {
    // Real implementation using API
    try {
      const response = await fetch('/api/v1/communications/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sent_to: params.to,
          sent_from: params.from || process.env.NEXT_PUBLIC_DEFAULT_SMS_NUMBER,
          body: params.body,
          lead_id: params.lead_id,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to send SMS');
      }
      
      // If lead_id is provided, record in lead timeline
      if (params.lead_id && !USE_MOCK_DATA) {
        try {
          // Record the SMS in the lead_sms table
          const { data: smsData, error: smsError } = await supabase
            .from('lead_sms')
            .insert({
              lead_id: params.lead_id,
              body: params.body,
              recipient: params.to,
              sent_at: new Date().toISOString(),
              sent_by: (await supabase.auth.getUser()).data.user?.id,
              status: 'sent'
            })
            .select()
            .single();
            
          if (smsError) throw smsError;
          
          // Add to timeline
          await supabase.from('lead_timeline').insert({
            lead_id: params.lead_id,
            type: 'sms',
            content: `Sent SMS: "${params.body.substring(0, 50)}${params.body.length > 50 ? '...' : ''}"`,
            data: { 
              sms_id: smsData.id, 
              body: params.body
            },
            created_at: new Date().toISOString(),
            user_id: (await supabase.auth.getUser()).data.user?.id
          });
        } catch (error) {
          console.error('Error recording SMS in lead timeline:', error);
          // Don't fail the overall operation if timeline recording fails
        }
      }
      
      return {
        success: true,
        message: 'SMS sent successfully',
        message_id: data.details?.message_sid,
      };
    } catch (error) {
      console.error('Error sending SMS:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send SMS',
      };
    }
  }
}

/**
 * Generate SMS with AI
 */
export async function generateSMSWithAI(prompt: string): Promise<string> {
  if (USE_MOCK_DATA) {
    console.log(`Using mock data for generateSMSWithAI: ${prompt}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return `This is an AI-generated SMS based on your prompt: "${prompt}". We're excited to help you with your inquiry. Please let us know if you need any further assistance.`;
  } else {
    // Real implementation using API
    try {
      const response = await fetch('/api/v1/communications/sms/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate SMS with AI');
      }
      
      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error generating SMS with AI:', error);
      throw error;
    }
  }
}

/**
 * Get SMS templates
 */
export async function getSMSTemplates(): Promise<SMSTemplate[]> {
  if (USE_MOCK_DATA) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock templates
    return [
      {
        id: 1,
        name: 'Appointment Reminder',
        body: 'Hi {{name}}, this is a reminder about your appointment on {{date}} at {{time}}. Please reply YES to confirm or call us to reschedule.',
        created_by: 1,
        is_global: true,
        variables: ['name', 'date', 'time'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Follow-up',
        body: 'Hi {{name}}, thank you for your interest in our services. I wanted to follow up on our conversation. Please let me know if you have any questions.',
        created_by: 1,
        is_global: true,
        variables: ['name'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 3,
        name: 'Payment Confirmation',
        body: 'Thank you for your payment of {{amount}}. Your transaction has been processed successfully. Reference: {{reference}}',
        created_by: 1,
        is_global: true,
        variables: ['amount', 'reference'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  } else {
    // Real implementation using API or Supabase
    try {
      const { data, error } = await supabase
        .from('sms_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data as SMSTemplate[];
    } catch (error) {
      console.error('Error fetching SMS templates:', error);
      throw error;
    }
  }
}

// Call Functions

/**
 * Make a call
 */
export async function makeCall(params: CallParams): Promise<CallResponse> {
  if (USE_MOCK_DATA) {
    console.log(`Using mock data for makeCall to ${params.to}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { 
      success: true, 
      message: 'Call initiated successfully',
      call_id: `CA${Math.random().toString(36).substring(2, 15)}` 
    };
  } else {
    // Real implementation using API
    try {
      const response = await fetch('/api/v1/communications/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: params.to,
          caller: params.from || process.env.NEXT_PUBLIC_DEFAULT_CALL_NUMBER,
          notes: params.notes,
          lead_id: params.lead_id,
          duration: params.duration,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to initiate call');
      }
      
      // If lead_id is provided, record in lead timeline
      if (params.lead_id && !USE_MOCK_DATA) {
        try {
          // Record the call in the lead_calls table
          const { data: callData, error: callError } = await supabase
            .from('lead_calls')
            .insert({
              lead_id: params.lead_id,
              phone_number: params.to,
              duration: params.duration || 0,
              notes: params.notes || '',
              called_at: new Date().toISOString(),
              called_by: (await supabase.auth.getUser()).data.user?.id,
              status: params.duration ? 'completed' : 'initiated'
            })
            .select()
            .single();
            
          if (callError) throw callError;
          
          // Add to timeline
          await supabase.from('lead_timeline').insert({
            lead_id: params.lead_id,
            type: 'call',
            content: params.duration 
              ? `Made a call (${params.duration} seconds)${params.notes ? ': ' + params.notes.substring(0, 50) + (params.notes.length > 50 ? '...' : '') : ''}`
              : `Initiated call to ${params.to}`,
            data: { 
              call_id: callData.id, 
              duration: params.duration || 0,
              notes: params.notes || ''
            },
            created_at: new Date().toISOString(),
            user_id: (await supabase.auth.getUser()).data.user?.id
          });
        } catch (error) {
          console.error('Error recording call in lead timeline:', error);
          // Don't fail the overall operation if timeline recording fails
        }
      }
      
      return {
        success: true,
        message: 'Call initiated successfully',
        call_id: data.details?.call_sid,
      };
    } catch (error) {
      console.error('Error initiating call:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to initiate call',
      };
    }
  }
}

/**
 * Get call logs
 */
export async function getCallLogs(): Promise<CallLog[]> {
  if (USE_MOCK_DATA) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock call logs
    return [
      {
        id: 1,
        contact_id: 1,
        lead_id: 1,
        direction: 'outbound',
        duration: 120,
        caller_number: '+1234567890',
        recipient_number: '+0987654321',
        status: 'completed',
        call_time: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        recording_url: 'https://api.twilio.com/2010-04-01/Accounts/AC123/Recordings/RE123.mp3',
        transcription: 'Hello, this is a test call. I wanted to discuss our upcoming meeting. Please call me back when you have a chance.',
        contact: {
          id: 1,
          name: 'John Doe'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        contact_id: 2,
        lead_id: 2,
        direction: 'inbound',
        duration: 60,
        caller_number: '+0987654321',
        recipient_number: '+1234567890',
        status: 'completed',
        call_time: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        recording_url: 'https://api.twilio.com/2010-04-01/Accounts/AC123/Recordings/RE456.mp3',
        transcription: "Hi, I'm returning your call about the proposal. I think we can move forward with the project. Let's schedule a follow-up call next week.",
        contact: {
          id: 2,
          name: 'Jane Smith'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 3,
        contact_id: 3,
        lead_id: 3,
        direction: 'inbound',
        duration: 0,
        caller_number: '+1122334455',
        recipient_number: '+1234567890',
        status: 'missed',
        call_time: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        contact: {
          id: 3,
          name: 'Bob Johnson'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  } else {
    // Real implementation using API or Supabase
    try {
      const { data, error } = await supabase
        .from('call_logs')
        .select('*, contact:contacts(*)')
        .order('call_time', { ascending: false });
      
      if (error) throw error;
      
      return data as CallLog[];
    } catch (error) {
      console.error('Error fetching call logs:', error);
      throw error;
    }
  }
}

// Contact Functions

/**
 * Get contacts
 */
export async function getContacts(): Promise<Contact[]> {
  if (USE_MOCK_DATA) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Mock contacts
    return [
      {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone_number: '+1234567890',
        company: 'Acme Inc',
        contact_type: 'client',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone_number: '+0987654321',
        company: 'XYZ Corp',
        contact_type: 'prospect',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 3,
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        phone_number: '+1122334455',
        company: 'ABC Ltd',
        contact_type: 'vendor',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  } else {
    // Real implementation using API or Supabase
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      return data as Contact[];
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }
  }
}

/**
 * Create a contact
 */
export async function createContact(contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<Contact> {
  if (USE_MOCK_DATA) {
    console.log('Using mock data for createContact:', contact);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock created contact
    return {
      id: Math.floor(Math.random() * 1000) + 10,
      ...contact,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  } else {
    // Real implementation using API or Supabase
    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert(contact)
        .select()
        .single();
      
      if (error) throw error;
      
      return data as Contact;
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  }
} 