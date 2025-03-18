export interface SMSMessage {
  id: number | string;
  direction: 'inbound' | 'outbound';
  sender_number: string;
  recipient_number: string;
  body: string;
  status: 'delivered' | 'failed' | 'sending' | 'received';
  sent_at: string;
  created_at: string;
  updated_at: string;
} 