'use client';

import React, { useState, useEffect } from 'react';
import { useAISettings } from '../../lib/hooks/useAISettings';
import { useLLM } from '../../contexts/LLMContext';
import { LLMModel } from '../../lib/types/llm';
import { useMockData } from '@/hooks/useMockData';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface AISettingItemProps {
  name: string;
  description: string | null;
  enabled: boolean;
  defaultModelId: number | null;
  featureKey: string;
  onToggle: (featureKey: string, enabled: boolean) => Promise<void>;
  onModelChange: (featureKey: string, modelId: number | null) => Promise<void>;
  models: LLMModel[];
}

const AISettingItem: React.FC<AISettingItemProps> = ({
  name,
  description,
  enabled,
  defaultModelId,
  featureKey,
  onToggle,
  onModelChange,
  models,
}) => {
  const [isToggling, setIsToggling] = useState(false);
  const [isChangingModel, setIsChangingModel] = useState(false);

  const handleToggle = async () => {
    try {
      setIsToggling(true);
      await onToggle(featureKey, !enabled);
    } finally {
      setIsToggling(false);
    }
  };

  const handleModelChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      setIsChangingModel(true);
      const newModelId = e.target.value ? parseInt(e.target.value, 10) : null;
      await onModelChange(featureKey, newModelId);
    } finally {
      setIsChangingModel(false);
    }
  };

  return (
    <div className="border p-4 rounded-lg mb-4 bg-white shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">{name}</h3>
        <div className="flex items-center">
          <span className="mr-2 text-sm text-gray-600">
            {enabled ? 'Enabled' : 'Disabled'}
          </span>
          <button
            className={`relative inline-flex h-6 w-11 items-center rounded-full ${
              enabled ? 'bg-green-500' : 'bg-gray-300'
            } transition-colors focus:outline-none`}
            onClick={handleToggle}
            disabled={isToggling}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
      {description && <p className="text-sm text-gray-600 mb-3">{description}</p>}
      
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Default Model
        </label>
        <select
          className="block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
          value={defaultModelId || ''}
          onChange={handleModelChange}
          disabled={isChangingModel || !enabled}
        >
          <option value="">Use default model</option>
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.provider} - {model.model_name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default function AISettingsManager() {
  const { settings, loading, error, updateSetting, refreshSettings } = useAISettings();
  const { allModels, loadingModels } = useLLM();
  const { isEnabled: isMockFeaturesEnabled, toggleMockData } = useMockData();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleToggle = async (featureKey: string, enabled: boolean) => {
    try {
      if (isMockFeaturesEnabled) {
        setGlobalError("Cannot update settings while mock data is enabled. Please disable mock data first.");
        return;
      }
      
      await updateSetting(featureKey, { is_enabled: enabled });
      setGlobalError(null);
    } catch (err) {
      setGlobalError(`Failed to update ${featureKey}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleModelChange = async (featureKey: string, modelId: number | null) => {
    try {
      if (isMockFeaturesEnabled) {
        setGlobalError("Cannot update settings while mock data is enabled. Please disable mock data first.");
        return;
      }
      
      await updateSetting(featureKey, { is_enabled: true, default_model_id: modelId });
      setGlobalError(null);
    } catch (err) {
      setGlobalError(`Failed to update model for ${featureKey}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (loading || loadingModels) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">AI Functionality Settings</h1>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">AI Functionality Settings</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error loading settings: {error}</p>
          <button
            className="mt-2 bg-red-200 hover:bg-red-300 text-red-700 py-1 px-3 rounded"
            onClick={refreshSettings}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">AI Functionality Settings</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Mock Data</span>
          <Switch 
            checked={isMockFeaturesEnabled}
            onCheckedChange={toggleMockData}
          />
        </div>
      </div>
      
      {isMockFeaturesEnabled && (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Mock Data Mode</AlertTitle>
          <AlertDescription>
            You are currently in mock data mode. All AI settings are simulated and changes will not be saved to the database.
            Disable mock data to make real changes to AI settings.
          </AlertDescription>
        </Alert>
      )}
      
      {globalError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{globalError}</p>
        </div>
      )}
      
      <div className="grid md:grid-cols-2 gap-6">
        {settings.map((setting) => (
          <AISettingItem
            key={setting.feature_key}
            name={setting.display_name}
            description={setting.description}
            enabled={setting.is_enabled}
            defaultModelId={setting.default_model_id}
            featureKey={setting.feature_key}
            onToggle={handleToggle}
            onModelChange={handleModelChange}
            models={allModels || []}
          />
        ))}
      </div>
    </div>
  );
} 