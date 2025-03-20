import React from 'react';
import { Metadata } from 'next';
import SentimentAnalysis from '@/components/examples/SentimentAnalysis';
import LeadScoringExample from '@/components/examples/LeadScoringExample';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'AI Feature Examples',
  description: 'Examples of AI features that can be controlled via admin settings',
};

export default function AIExamplesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">AI Feature Examples</h1>
        <Link
          href="/admin/ai-settings"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Manage AI Settings →
        </Link>
      </div>
      
      <p className="text-gray-500 mb-8">
        These examples demonstrate how AI features can be controlled via the admin settings.
        Try enabling/disabling features in the admin panel to see how the UI adapts.
        Even when AI is disabled, features like lead scoring continue to work using rule-based fallback logic.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div>
          <SentimentAnalysis />
        </div>
        <div>
          <LeadScoringExample />
        </div>
      </div>
    </div>
  );
} 