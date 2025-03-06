export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface EmailTemplateCreate {
  name: string;
  subject: string;
  content: string;
}

export interface EmailTemplateUpdate {
  id: string;
  name?: string;
  subject?: string;
  content?: string;
}

export interface Email {
  id: string;
  to: string;
  from: string;
  subject: string;
  content: string;
  sent_at: string;
  lead_id: string;
  user_id: string;
  status: EmailStatus;
}

export enum EmailStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  SCHEDULED = 'scheduled',
  FAILED = 'failed'
}

export interface EmailFormValues {
  to: string;
  subject: string;
  content: string;
  lead_id: string;
}

export interface AIEmailGenerationRequest {
  lead_id: string;
  context?: string;
  tone?: string;
  purpose?: 'initial_contact' | 'follow_up' | 'proposal' | 'meeting_request' | 'thank_you' | 'other';
}

export interface AIEmailGenerationResponse {
  subject: string;
  content: string;
} 