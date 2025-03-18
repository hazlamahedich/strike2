'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Plus, Trash2, Edit, Settings, Check } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Define types for LLM settings
interface LLMModel {
  id?: number;
  provider: string;
  model_name: string;
  api_key?: string;
  api_base?: string;
  api_version?: string;
  organization_id?: string;
  is_default: boolean;
  max_tokens?: number;
  temperature: number;
  created_at?: string;
  updated_at?: string;
}

interface LLMSettings {
  models: LLMModel[];
  default_model?: LLMModel;
}

interface LLMSettingsDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const LLMSettingsDialog = ({ trigger, open: controlledOpen, onOpenChange }: LLMSettingsDialogProps) => {
  const [open, setOpen] = useState(controlledOpen || false);
  const [settings, setSettings] = useState<LLMSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModelOpen, setIsAddModelOpen] = useState(false);
  const [isEditModelOpen, setIsEditModelOpen] = useState(false);
  const [currentModel, setCurrentModel] = useState<LLMModel | null>(null);
  
  // Form state for adding/editing models
  const [formState, setFormState] = useState<LLMModel>({
    provider: 'openai',
    model_name: '',
    api_key: '',
    api_base: '',
    api_version: '',
    organization_id: '',
    is_default: false,
    max_tokens: 2000,
    temperature: 0.7
  });

  // Handle controlled/uncontrolled open state
  useEffect(() => {
    if (controlledOpen !== undefined) {
      setOpen(controlledOpen);
    }
  }, [controlledOpen]);

  // Handle open change
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
    
    // Fetch settings when dialog opens
    if (newOpen) {
      fetchSettings();
    }
  };

  // Fetch LLM settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/llm/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch LLM settings');
      }
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast({
        title: 'Error',
        description: 'Failed to load LLM settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Add a new model
  const addModel = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/llm/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formState),
      });
      if (!response.ok) {
        throw new Error('Failed to add model');
      }
      await fetchSettings();
      setIsAddModelOpen(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Model added successfully',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to add model',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Update an existing model
  const updateModel = async () => {
    if (!currentModel?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/llm/models/${currentModel.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formState),
      });
      if (!response.ok) {
        throw new Error('Failed to update model');
      }
      await fetchSettings();
      setIsEditModelOpen(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Model updated successfully',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update model',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete a model
  const deleteModel = async (id: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/llm/models/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete model');
      }
      await fetchSettings();
      toast({
        title: 'Success',
        description: 'Model deleted successfully',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete model',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Open edit dialog with model data
  const openEditDialog = (model: LLMModel) => {
    setCurrentModel(model);
    setFormState(model);
    setIsEditModelOpen(true);
  };

  // Reset form state
  const resetForm = () => {
    setFormState({
      provider: 'openai',
      model_name: '',
      api_key: '',
      api_base: '',
      api_version: '',
      organization_id: '',
      is_default: false,
      max_tokens: 2000,
      temperature: 0.7
    });
    setCurrentModel(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>LLM Settings</DialogTitle>
          <DialogDescription>
            Configure your AI models and view usage statistics
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="p-4 border border-red-200 rounded-md bg-red-50 text-red-800">
            <p>Error loading LLM settings: {error}</p>
            <Button 
              variant="outline" 
              onClick={fetchSettings} 
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        ) : (
          <div className="py-4">
            <Tabs defaultValue="models" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="models">Models</TabsTrigger>
                <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="models" className="space-y-4 mt-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Configured Models</h3>
                  <Button onClick={() => setIsAddModelOpen(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Model
                  </Button>
                </div>
                
                {settings?.models && settings.models.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Provider</TableHead>
                          <TableHead>Model</TableHead>
                          <TableHead>Default</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {settings.models.map((model) => (
                          <TableRow key={model.id}>
                            <TableCell className="font-medium">{model.provider}</TableCell>
                            <TableCell>{model.model_name}</TableCell>
                            <TableCell>
                              {model.is_default && <Check className="h-4 w-4 text-green-500" />}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => openEditDialog(model)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => model.id && deleteModel(model.id)}
                                  disabled={model.is_default}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-md">
                    <p className="text-muted-foreground">No models configured yet.</p>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddModelOpen(true)} 
                      className="mt-4"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Model
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Advanced Settings</h3>
                      <p className="text-sm text-muted-foreground">
                        Configure advanced settings for your LLM integration
                      </p>
                    </div>
                    
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="cache-enabled">Enable Response Caching</Label>
                          <p className="text-sm text-muted-foreground">
                            Cache identical requests to reduce token usage and costs
                          </p>
                        </div>
                        <Switch id="cache-enabled" />
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="fallback-enabled">Enable Fallback Models</Label>
                          <p className="text-sm text-muted-foreground">
                            Automatically fallback to alternative models if primary model fails
                          </p>
                        </div>
                        <Switch id="fallback-enabled" />
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="cost-limit">Monthly Cost Limit</Label>
                          <p className="text-sm text-muted-foreground">
                            Set a maximum monthly spending limit for LLM usage
                          </p>
                        </div>
                        <Input 
                          id="cost-limit" 
                          type="number" 
                          className="w-24 text-right" 
                          placeholder="100"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
      
      {/* Add Model Dialog */}
      <Dialog open={isAddModelOpen} onOpenChange={setIsAddModelOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New LLM Model</DialogTitle>
            <DialogDescription>
              Configure a new language model for use in the application.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="provider" className="text-right">
                Provider
              </Label>
              <div className="col-span-3">
                <Select 
                  value={formState.provider} 
                  onValueChange={(value) => handleSelectChange('provider', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="azure">Azure OpenAI</SelectItem>
                    <SelectItem value="cohere">Cohere</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="model_name" className="text-right">
                Model Name
              </Label>
              <Input
                id="model_name"
                name="model_name"
                value={formState.model_name}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="api_key" className="text-right">
                API Key
              </Label>
              <Input
                id="api_key"
                name="api_key"
                type="password"
                value={formState.api_key || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="api_base" className="text-right">
                API Base URL
              </Label>
              <Input
                id="api_base"
                name="api_base"
                value={formState.api_base || ''}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="Optional"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="temperature" className="text-right">
                Temperature
              </Label>
              <Input
                id="temperature"
                name="temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={formState.temperature}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="max_tokens" className="text-right">
                Max Tokens
              </Label>
              <Input
                id="max_tokens"
                name="max_tokens"
                type="number"
                value={formState.max_tokens || ''}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="Optional"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_default" className="text-right">
                Default Model
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="is_default"
                  name="is_default"
                  checked={formState.is_default}
                  onCheckedChange={(checked) => 
                    setFormState(prev => ({ ...prev, is_default: checked }))
                  }
                />
                <Label htmlFor="is_default">Make this the default model</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModelOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addModel} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Model
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Model Dialog */}
      <Dialog open={isEditModelOpen} onOpenChange={setIsEditModelOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit LLM Model</DialogTitle>
            <DialogDescription>
              Update the configuration for this language model.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="provider" className="text-right">
                Provider
              </Label>
              <div className="col-span-3">
                <Select 
                  value={formState.provider} 
                  onValueChange={(value) => handleSelectChange('provider', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="azure">Azure OpenAI</SelectItem>
                    <SelectItem value="cohere">Cohere</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="model_name" className="text-right">
                Model Name
              </Label>
              <Input
                id="model_name"
                name="model_name"
                value={formState.model_name}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="api_key" className="text-right">
                API Key
              </Label>
              <Input
                id="api_key"
                name="api_key"
                type="password"
                value={formState.api_key || ''}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="••••••••"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="api_base" className="text-right">
                API Base URL
              </Label>
              <Input
                id="api_base"
                name="api_base"
                value={formState.api_base || ''}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="Optional"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="temperature" className="text-right">
                Temperature
              </Label>
              <Input
                id="temperature"
                name="temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={formState.temperature}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="max_tokens" className="text-right">
                Max Tokens
              </Label>
              <Input
                id="max_tokens"
                name="max_tokens"
                type="number"
                value={formState.max_tokens || ''}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="Optional"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_default" className="text-right">
                Default Model
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="is_default"
                  name="is_default"
                  checked={formState.is_default}
                  onCheckedChange={(checked) => 
                    setFormState(prev => ({ ...prev, is_default: checked }))
                  }
                />
                <Label htmlFor="is_default">Make this the default model</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModelOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateModel} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Model
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default LLMSettingsDialog; 