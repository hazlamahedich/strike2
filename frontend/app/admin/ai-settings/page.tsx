import React from 'react';
import { Metadata } from 'next';
import AISettingsManager from '@/components/admin/AISettingsManager';
import AdminLayout from '@/components/admin/AdminLayout';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'AI Functionality Settings | Admin Dashboard',
  description: 'Manage AI functionality settings for the CRM platform',
};

export default function AISettingsPage() {
  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">AI Functionality Settings</h1>
          <p className="text-gray-600">
            Control which AI functionalities are enabled across the platform and which models they use.
          </p>
        </div>

        <div className="mb-8 bg-blue-50 p-4 border border-blue-200 rounded-md">
          <h2 className="text-lg font-medium text-blue-800 mb-2">How to use these settings</h2>
          <ul className="list-disc pl-5 text-blue-700 space-y-1">
            <li>
              <strong>Enable/Disable Features:</strong> Toggle the switch to enable or disable specific AI functionalities.
            </li>
            <li>
              <strong>Set Default Models:</strong> Each feature can use a specific LLM model, different from the system default.
            </li>
            <li>
              <strong>Mock Data Mode:</strong> Toggle mock data mode to test UI without making actual API calls. Changes in mock mode won't be saved.
            </li>
            <li>
              <strong>Test Your Changes:</strong>{' '}
              <Link href="/examples" className="text-blue-800 underline">
                Visit the examples page
              </Link>{' '}
              to see how your changes affect the user experience.
            </li>
          </ul>
        </div>
        
        <AISettingsManager />
      </div>
    </AdminLayout>
  );
} 