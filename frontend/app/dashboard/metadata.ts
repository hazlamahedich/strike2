import { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | CRM Suite',
  description: 'Manage your leads, campaigns, and analytics',
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