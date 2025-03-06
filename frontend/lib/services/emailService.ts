/**
 * Email Service
 * 
 * This service handles sending emails using SendGrid.
 * Currently, it's a mock implementation that will be replaced with actual SendGrid integration.
 */

interface SendEmailParams {
  to: string;
  subject: string;
  content: string;
  from?: string;
}

interface EmailResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Send an email using SendGrid (mock implementation)
 */
export async function sendEmail(params: SendEmailParams): Promise<EmailResponse> {
  console.log('Sending email with params:', params);
  
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
}

/**
 * Generate an email using AI (mock implementation)
 */
export async function generateEmailWithAI(params: {
  context: string;
  tone?: 'professional' | 'friendly' | 'formal' | 'casual';
  purpose?: string;
}): Promise<{ subject: string; content: string }> {
  console.log('Generating email with AI:', params);
  
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
}

/**
 * Get email templates (mock implementation)
 */
export async function getEmailTemplates(): Promise<any[]> {
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
}

/**
 * Interface for received emails
 */
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

/**
 * Get received emails (mock implementation)
 */
export async function getReceivedEmails(): Promise<ReceivedEmail[]> {
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
} 