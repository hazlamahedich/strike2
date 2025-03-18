import { useState, useCallback } from 'react';
import { useLLM } from '@/contexts/LLMContext';
import { LLMModel } from '@/lib/types/llm';

interface UseLLMGenerateProps {
  modelOverride?: LLMModel;
}

interface UseLLMGenerateReturn {
  generating: boolean;
  error: string | null;
  generateText: (prompt: string) => Promise<string>;
}

/**
 * Custom hook for generating text with LLM models
 * 
 * @param options Optional configuration options
 * @returns Object with generating state, error state, and generateText function
 */
export function useLLMGenerate(options: UseLLMGenerateProps = {}): UseLLMGenerateReturn {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get the default model from context
  const { defaultModel } = useLLM();
  
  // Use the model override if provided, otherwise use the default model
  const model = options.modelOverride || defaultModel;
  
  /**
   * Generate text using the configured LLM model
   */
  const generateText = useCallback(async (prompt: string): Promise<string> => {
    if (!prompt || prompt.trim() === '') {
      setError('Prompt cannot be empty');
      return '';
    }
    
    if (!model) {
      setError('No LLM model available');
      return '';
    }
    
    setGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/llm/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          modelId: model.id,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.text || '';
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate text';
      setError(errorMessage);
      console.error('Text generation error:', err);
      return '';
    } finally {
      setGenerating(false);
    }
  }, [model]);
  
  return {
    generating,
    error,
    generateText,
  };
} 