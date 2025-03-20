import React, { useState } from 'react';
import { scoreLeadWithFallback } from '@/lib/services/leadScoringService';
import { Lead } from '@/lib/types/leads';
import LeadScoreDisplay from '@/components/leads/LeadScoreDisplay';
import AIFeatureGuard from '@/components/AIFeatureGuard';

export default function LeadScoringExample() {
  const [formData, setFormData] = useState<Partial<Lead>>({
    name: '',
    company: '',
    position: '',
    email: '',
    phone: '',
    source: 'website',
    notes: '',
    last_contact_date: new Date().toISOString().split('T')[0]
  });
  
  const [scoreResult, setScoreResult] = useState<{
    score: number;
    probability: number;
    reasonCodes: string[];
    aiPowered: boolean;
  } | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const score = await scoreLeadWithFallback(formData as Lead);
      setScoreResult(score);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to score lead';
      setError(errorMessage);
      console.error('Error scoring lead:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AIFeatureGuard
      featureKey="lead_scoring"
      fallback={
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="font-medium text-yellow-800">Lead Scoring Disabled</h3>
          <p className="text-sm text-yellow-700 mt-1">
            This feature has been disabled by the administrator. Please contact them if you need access.
          </p>
        </div>
      }
    >
      <div className="border rounded-md overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b">
          <h3 className="text-lg font-medium">Lead Scoring</h3>
          <p className="text-sm text-gray-500">
            Test lead scoring with AI and fallback functionality
          </p>
        </div>
        
        <div className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                  Company
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                  Position
                </label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-700">
                  Source
                </label>
                <select
                  id="source"
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="website">Website</option>
                  <option value="referral">Referral</option>
                  <option value="cold_call">Cold Call</option>
                  <option value="social_media">Social Media</option>
                  <option value="email_list">Email List</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Scoring...' : 'Score Lead'}
              </button>
            </div>
          </form>
          
          {error && (
            <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}
          
          {scoreResult && !error && (
            <div className="mt-6 p-4 border rounded-md">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium">Score Result</h4>
                <LeadScoreDisplay 
                  score={scoreResult.score} 
                  aiPowered={scoreResult.aiPowered}
                  reasonCodes={scoreResult.reasonCodes}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="font-medium mr-2">Score:</span>
                  <span>{scoreResult.score}/100</span>
                </div>
                
                <div className="flex items-center">
                  <span className="font-medium mr-2">Probability:</span>
                  <span>{(scoreResult.probability * 100).toFixed(1)}%</span>
                </div>
                
                <div className="flex items-center">
                  <span className="font-medium mr-2">Scored using:</span>
                  {scoreResult.aiPowered ? (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      AI Powered
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      Rule Based
                    </span>
                  )}
                </div>
                
                <div>
                  <span className="font-medium">Reasoning:</span>
                  <ul className="mt-1 pl-6 list-disc text-sm">
                    {scoreResult.reasonCodes.map((reason, index) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AIFeatureGuard>
  );
} 