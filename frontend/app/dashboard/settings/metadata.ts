import { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Settings | CRM Suite',
  description: 'Manage your account settings and preferences',
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