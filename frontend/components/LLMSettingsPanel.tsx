"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLLM } from '@/contexts/LLMContext';
import { LLMModel } from '@/lib/types/llm';
import { Trash, Check, Plus, Pencil } from 'lucide-react';

// Create a simple slider component
const Slider = ({ id, min, max, step, value, onValueChange, disabled }: {
  id: string;
  min: number;
  max: number;
  step: number;
  value: number[];
  onValueChange: (value: number[]) => void;
  disabled?: boolean;
}) => {
  return (
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value[0]}
      onChange={(e) => onValueChange([Number(e.target.value)])}
      disabled={disabled}
      className="w-full"
    />
  );
};

export default function LLMSettingsPanel() {
  const { settings, defaultModel, loading, error, refreshSettings } = useLLM();
  const [models, setModels] = useState<LLMModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [selectedModel, setSelectedModel] = useState<LLMModel | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    provider: '',
    model_name: '',
    api_key: '',
    api_base: '',
    api_version: '',
    organization_id: '',
    temperature: 0.7,
    max_tokens: 2048,
  });

  // Fetch models on component mount
  useEffect(() => {
    fetchModels();
  }, []);

  // Update selected model when default model changes
  useEffect(() => {
    if (defaultModel && !selectedModel) {
      setSelectedModel(defaultModel);
      populateFormData(defaultModel);
    }
  }, [defaultModel]);

  // Reset form when switching models
  useEffect(() => {
    if (selectedModel) {
      populateFormData(selectedModel);
    }
  }, [selectedModel]);

  // Fetch models from API
  const fetchModels = async () => {
    setLoadingModels(true);
    try {
      const response = await fetch('/api/llm/models');
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setModels(data);
      
      // If there's a default model selected, update the form
      if (defaultModel) {
        setSelectedModel(defaultModel);
        populateFormData(defaultModel);
      } else if (data.length > 0) {
        // Otherwise select the first model
        setSelectedModel(data[0]);
        populateFormData(data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
      toast.error('Failed to load models', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoadingModels(false);
    }
  };

  // Populate form with model data
  const populateFormData = (model: LLMModel) => {
    setFormData({
      provider: model.provider || '',
      model_name: model.model_name || '',
      api_key: model.api_key || '',
      api_base: model.api_base || '',
      api_version: model.api_version || '',
      organization_id: model.organization_id || '',
      temperature: model.temperature || 0.7,
      max_tokens: model.max_tokens || 2048,
    });
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle slider changes
  const handleSliderChange = (name: string, value: number[]) => {
    setFormData(prev => ({
      ...prev,
      [name]: value[0]
    }));
  };

  // Save new model
  const handleSaveNew = async () => {
    try {
      const response = await fetch('/api/llm/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          is_default: models.length === 0, // Set as default if it's the first model
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      const newModel = await response.json();
      toast.success('Model added successfully');
      await fetchModels();
      await refreshSettings();
      setSelectedModel(newModel);
      setIsEditMode(false);
    } catch (error) {
      console.error('Failed to save model:', error);
      toast.error('Failed to save model', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Update existing model
  const handleUpdateModel = async () => {
    if (!selectedModel || selectedModel.id === undefined) return;

    try {
      const response = await fetch(`/api/llm/models/${selectedModel.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      toast.success('Model updated successfully');
      await fetchModels();
      await refreshSettings();
      setIsEditMode(false);
    } catch (error) {
      console.error('Failed to update model:', error);
      toast.error('Failed to update model', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Delete model
  const handleDeleteModel = async () => {
    if (!selectedModel || selectedModel.id === undefined) return;
    
    if (!confirm(`Are you sure you want to delete the model "${selectedModel.model_name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/llm/models/${selectedModel.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      toast.success('Model deleted successfully');
      await fetchModels();
      await refreshSettings();
      
      // Reset selection
      if (models.length > 1) {
        const newSelectedModel = models.find(m => m.id !== selectedModel.id) || null;
        setSelectedModel(newSelectedModel);
        if (newSelectedModel) {
          populateFormData(newSelectedModel);
        }
      } else {
        setSelectedModel(null);
        setFormData({
          provider: '',
          model_name: '',
          api_key: '',
          api_base: '',
          api_version: '',
          organization_id: '',
          temperature: 0.7,
          max_tokens: 2048,
        });
      }
    } catch (error) {
      console.error('Failed to delete model:', error);
      toast.error('Failed to delete model', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Set model as default
  const handleSetDefault = async () => {
    if (!selectedModel || selectedModel.id === undefined) return;

    try {
      const response = await fetch(`/api/llm/models/${selectedModel.id}/default`, {
        method: 'PUT',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      toast.success(`${selectedModel.model_name} set as default model`);
      await fetchModels();
      await refreshSettings();
    } catch (error) {
      console.error('Failed to set default model:', error);
      toast.error('Failed to set default model', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Cancel editing
  const handleCancel = () => {
    if (selectedModel) {
      populateFormData(selectedModel);
    }
    setIsEditMode(false);
  };

  // Start new model creation
  const handleNewModel = () => {
    setSelectedModel(null);
    setFormData({
      provider: '',
      model_name: '',
      api_key: '',
      api_base: '',
      api_version: '',
      organization_id: '',
      temperature: 0.7,
      max_tokens: 2048,
    });
    setIsEditMode(true);
  };

  if (loading || loadingModels) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <h3 className="text-lg font-bold">Error loading LLM settings</h3>
        <p>{error}</p>
        <Button onClick={refreshSettings} className="mt-4">Retry</Button>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>LLM Settings</CardTitle>
        <CardDescription>
          Configure Language Models for AI functionality
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex items-center justify-between">
          <div className="w-1/2">
            <Label htmlFor="modelSelect">Model</Label>
            <Select
              value={selectedModel?.id?.toString() || ''}
              onValueChange={(value: string) => {
                const model = models.find(m => m.id !== undefined && m.id.toString() === value);
                setSelectedModel(model || null);
              }}
              disabled={isEditMode}
            >
              <SelectTrigger id="modelSelect">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  model.id !== undefined && (
                    <SelectItem key={model.id} value={model.id.toString()}>
                      {model.model_name}
                      {model.is_default && ' (Default)'}
                    </SelectItem>
                  )
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNewModel}
              disabled={isEditMode}
            >
              <Plus className="h-4 w-4 mr-1" /> New
            </Button>
            {selectedModel && !isEditMode && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditMode(true)}
                >
                  <Pencil className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDeleteModel}
                  disabled={selectedModel?.is_default}
                >
                  <Trash className="h-4 w-4 mr-1" /> Delete
                </Button>
                {!selectedModel.is_default && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSetDefault}
                  >
                    <Check className="h-4 w-4 mr-1" /> Set Default
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {(selectedModel || isEditMode) && (
          <div className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="provider">Provider</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(value: string) => handleSelectChange('provider', value)}
                  disabled={!isEditMode}
                >
                  <SelectTrigger id="provider">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="mistral">Mistral</SelectItem>
                    <SelectItem value="ollama">Ollama</SelectItem>
                    <SelectItem value="azure">Azure OpenAI</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="model_name">Model Name</Label>
                <Input
                  id="model_name"
                  name="model_name"
                  value={formData.model_name}
                  onChange={handleChange}
                  disabled={!isEditMode}
                />
              </div>
            </div>

            {/* API Configuration */}
            <div>
              <Label htmlFor="api_key">API Key</Label>
              <Input
                id="api_key"
                name="api_key"
                type="password"
                value={formData.api_key}
                onChange={handleChange}
                disabled={!isEditMode}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="api_base">API Base URL</Label>
                <Input
                  id="api_base"
                  name="api_base"
                  value={formData.api_base}
                  onChange={handleChange}
                  disabled={!isEditMode}
                />
              </div>
              <div>
                <Label htmlFor="api_version">API Version</Label>
                <Input
                  id="api_version"
                  name="api_version"
                  value={formData.api_version}
                  onChange={handleChange}
                  disabled={!isEditMode}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="organization_id">Organization ID</Label>
              <Input
                id="organization_id"
                name="organization_id"
                value={formData.organization_id}
                onChange={handleChange}
                disabled={!isEditMode}
              />
            </div>

            {/* LLM Parameters */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label htmlFor="temperature">Temperature: {formData.temperature}</Label>
              </div>
              <Slider
                id="temperature"
                min={0}
                max={2}
                step={0.1}
                value={[formData.temperature]}
                onValueChange={(value) => handleSliderChange('temperature', value)}
                disabled={!isEditMode}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Lower values are more deterministic, higher values more creative
              </p>
            </div>

            <div>
              <Label htmlFor="max_tokens">Max Tokens</Label>
              <Input
                id="max_tokens"
                name="max_tokens"
                type="number"
                value={formData.max_tokens}
                onChange={handleChange}
                disabled={!isEditMode}
              />
            </div>
          </div>
        )}
      </CardContent>
      {isEditMode && (
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={selectedModel ? handleUpdateModel : handleSaveNew}>
            {selectedModel ? 'Update' : 'Save'} Model
          </Button>
        </CardFooter>
      )}
    </Card>
  );
} 