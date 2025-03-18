"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LLMModel, LLMSettings } from '@/lib/types/llm';
import { getLLMSettings, getDefaultLLMModel, invalidateLLMCache } from '@/lib/services/llmService';
import { toast } from 'sonner';

interface LLMContextType {
  defaultModel: LLMModel | null;
  settings: LLMSettings | null;
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
}

const LLMContext = createContext<LLMContextType>({
  defaultModel: null,
  settings: null,
  loading: false,
  error: null,
  refreshSettings: async () => {},
});

export const useLLM = () => useContext(LLMContext);

export const LLMProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<LLMSettings | null>(null);
  const [defaultModel, setDefaultModel] = useState<LLMModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Invalidate the cache to ensure we get fresh data
      invalidateLLMCache();
      
      const settingsData = await getLLMSettings();
      setSettings(settingsData);
      setDefaultModel(settingsData.defaultModel);
      
      console.log('[LLM Context] Successfully loaded LLM settings', {
        defaultModel: settingsData.defaultModel?.model_name,
        provider: settingsData.defaultModel?.provider,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load LLM settings';
      setError(errorMsg);
      console.error('[LLM Context] Error loading LLM settings:', err);
      
      toast.error('LLM Settings Error', {
        description: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <LLMContext.Provider
      value={{
        defaultModel,
        settings,
        loading,
        error,
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </LLMContext.Provider>
  );
};

// Custom hook for getting the LLM info with loading state
export const useLLMInfo = () => {
  const { defaultModel, loading, error, refreshSettings } = useLLM();
  
  return {
    provider: defaultModel?.provider || null,
    modelName: defaultModel?.model_name || null,
    temperature: defaultModel?.temperature || 0,
    maxTokens: defaultModel?.max_tokens || null,
    loading,
    error,
    refresh: refreshSettings,
  };
}; 