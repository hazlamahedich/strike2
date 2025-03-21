'use client';

import React, { useState } from 'react';
import { generateText } from '@/lib/services/llmService';
import AIFeatureGuard from '@/components/AIFeatureGuard';

export default function SentimentAnalysis() {
  const [text, setText] = useState('');
  const [sentiment, setSentiment] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeSentiment = async () => {
    if (!text || text.trim() === '') {
      setError('Please enter some text to analyze');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const prompt = `Analyze the sentiment of the following text. Return only "positive", "negative", or "neutral" without any explanation.\n\nText: "${text}"`;
      
      const response = await generateText({
        prompt,
        feature_name: 'sentiment_analysis',
      });
      
      const sentimentResult = response.text.toLowerCase().trim();
      setSentiment(sentimentResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze sentiment';
      setError(errorMessage);
      console.error('Error analyzing sentiment:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AIFeatureGuard
      featureKey="sentiment_analysis"
      fallback={
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="font-medium text-yellow-800">Sentiment Analysis Disabled</h3>
          <p className="text-sm text-yellow-700 mt-1">
            This feature has been disabled by the administrator. Please contact them if you need access.
          </p>
        </div>
      }
    >
      <div className="p-4 border rounded-md">
        <h3 className="text-lg font-medium mb-4">Sentiment Analysis</h3>
        
        <div className="mb-4">
          <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 mb-1">
            Enter text to analyze
          </label>
          <textarea
            id="text-input"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter some text to analyze its sentiment..."
            disabled={loading}
          />
        </div>
        
        <div className="mb-4">
          <button
            onClick={analyzeSentiment}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze Sentiment'}
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}
        
        {sentiment && !error && (
          <div className="p-4 border rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Result:</h4>
            <div className={`text-lg font-semibold ${
              sentiment === 'positive' ? 'text-green-600' :
              sentiment === 'negative' ? 'text-red-600' :
              'text-yellow-600'
            }`}>
              {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
            </div>
          </div>
        )}
      </div>
    </AIFeatureGuard>
  );
} 