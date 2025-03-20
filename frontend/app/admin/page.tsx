import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Admin dashboard for the CRM platform',
};

export default function AdminDashboardPage() {
  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* AI Settings Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">AI Functionality</h3>
              <p className="mt-1 text-sm text-gray-500">
                Manage AI features across the platform. Enable or disable specific functionalities
                and configure model settings.
              </p>
              <div className="mt-4">
                <Link
                  href="/admin/ai-settings"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Manage AI Settings
                </Link>
              </div>
            </div>
          </div>
          
          {/* LLM Models Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">LLM Models</h3>
              <p className="mt-1 text-sm text-gray-500">
                Configure and manage LLM models. Add new models, set default models,
                and view usage statistics.
              </p>
              <div className="mt-4">
                <Link
                  href="/admin/llm-settings"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Manage LLM Models
                </Link>
              </div>
            </div>
          </div>
          
          {/* Usage Analytics Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">Usage Analytics</h3>
              <p className="mt-1 text-sm text-gray-500">
                View AI usage analytics and cost reports. Monitor token usage
                and track spending by feature.
              </p>
              <div className="mt-4">
                <Link
                  href="/admin/analytics"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  View Analytics
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 