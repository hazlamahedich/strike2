import { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Meetings | CRM Suite',
  description: 'Manage your meetings and appointments',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' }
  ]
}; 