import React, { ReactNode } from 'react';
import Link from 'next/link';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
              </div>
            </div>
            <nav className="ml-6 flex items-center space-x-4">
              <Link 
                href="/admin"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 hover:bg-gray-100"
              >
                Dashboard
              </Link>
              <Link 
                href="/admin/ai-settings"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 hover:bg-gray-100"
              >
                AI Settings
              </Link>
              <Link 
                href="/examples"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 hover:bg-gray-100"
              >
                Examples
              </Link>
              <Link 
                href="/"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 hover:bg-gray-100"
              >
                Back to App
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-gray-200 rounded-lg min-h-96 bg-white">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
} 