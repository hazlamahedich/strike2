import React from 'react';
import LLMSettingsPanel from '@/components/LLMSettingsPanel';

export const metadata = {
  title: 'LLM Settings | Admin',
  description: 'Configure Language Models for AI functionality',
};

export default function LLMSettingsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">LLM Settings</h1>
      <p className="text-gray-500 mb-8">
        Configure language models for AI-powered features. Add API keys, adjust parameters, and select your default model.
      </p>
      
      <LLMSettingsPanel />
    </div>
  );
} 