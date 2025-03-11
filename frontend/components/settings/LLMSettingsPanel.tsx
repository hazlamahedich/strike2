'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Plus, Trash2, Edit, BarChart, Settings, Check } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

interface LLMUsageRecord {
  model_name: string;
  tokens: number;
  cost: number;
  count: number;
}

interface UsageByDay {
  date: string;
  tokens: number;
  cost: number;
}

interface LLMUsageSummary {
  total_requests: number;
  total_tokens: number;
  total_cost: number;
  tokens_by_model: Record<string, number>;
  cost_by_model: Record<string, number>;
  requests_by_type: Record<string, number>;
  usage_by_day: Record<string, { tokens: number; cost: number }>;
}

interface LLMSettings {
  models: LLMModel[];
  default_model?: LLMModel;
  usage_summary?: LLMUsageSummary;
}

const LLMSettingsPanel = () => {
  const [settings, setSettings] = useState<LLMSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('models');
  const [isAddModelOpen, setIsAddModelOpen] = useState(false);
  const [isEditModelOpen, setIsEditModelOpen] = useState(false);
  const [currentModel, setCurrentModel] = useState<LLMModel | null>(null);
  const [usagePeriod, setUsagePeriod] = useState('month');

  // Form state for adding/editing models
  const [formState, setFormState] = useState<LLMModel>({
    provider: 'openai',
    model_name: '',
    api_key: '',
    api_base: '',
    api_version: '',
    organization_id: '',
    is_default: false,
    max_tokens: undefined,
    temperature: 0.0,
  });

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

  // Fetch usage data for a specific period
  const fetchUsage = async (period: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/llm/usage?period=${period}`);
      if (!response.ok) {
        throw new Error('Failed to fetch LLM usage data');
      }
      const data = await response.json();
      setSettings(prev => prev ? { ...prev, usage_summary: data } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast({
        title: 'Error',
        description: 'Failed to load LLM usage data',
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
    if (!confirm('Are you sure you want to delete this model?')) return;
    
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
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormState(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Open edit model dialog
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
      max_tokens: undefined,
      temperature: 0.0,
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(amount);
  };

  // Load settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []);

  // Update usage data when period changes
  useEffect(() => {
    if (activeTab === 'usage') {
      fetchUsage(usagePeriod);
    }
  }, [usagePeriod, activeTab]);

  if (loading && !settings) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading LLM settings...</span>
      </div>
    );
  }

  if (error && !settings) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          LLM Settings
        </CardTitle>
        <CardDescription>
          Configure language models and monitor usage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="usage">Usage & Costs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="models">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Available Models</h3>
              <Button onClick={() => { resetForm(); setIsAddModelOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Model
              </Button>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead>Temperature</TableHead>
                    <TableHead>Max Tokens</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings?.models && settings.models.length > 0 ? (
                    settings.models.map((model) => (
                      <TableRow key={model.id}>
                        <TableCell className="font-medium">{model.provider}</TableCell>
                        <TableCell>{model.model_name}</TableCell>
                        <TableCell>
                          {model.is_default && <Check className="h-4 w-4 text-green-500" />}
                        </TableCell>
                        <TableCell>{model.temperature}</TableCell>
                        <TableCell>{model.max_tokens || 'Not set'}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(model)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => model.id && deleteModel(model.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No models configured. Add a model to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="usage">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Usage & Costs</h3>
              <Select value={usagePeriod} onValueChange={setUsagePeriod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Last 24 hours</SelectItem>
                  <SelectItem value="week">Last 7 days</SelectItem>
                  <SelectItem value="month">Last 30 days</SelectItem>
                  <SelectItem value="year">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {settings?.usage_summary ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{settings.usage_summary.total_requests.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Tokens</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{settings.usage_summary.total_tokens.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(settings.usage_summary.total_cost)}</div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-md font-medium">Usage by Model</h4>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Model</TableHead>
                          <TableHead>Tokens</TableHead>
                          <TableHead>Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {settings.usage_summary && Object.keys(settings.usage_summary.tokens_by_model).length > 0 ? (
                          Object.keys(settings.usage_summary.tokens_by_model).map((modelName) => (
                            <TableRow key={modelName}>
                              <TableCell className="font-medium">{modelName}</TableCell>
                              <TableCell>{settings.usage_summary?.tokens_by_model[modelName].toLocaleString()}</TableCell>
                              <TableCell>{formatCurrency(settings.usage_summary?.cost_by_model[modelName] || 0)}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-4">
                              No usage data available for this period.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-md font-medium">Usage by Request Type</h4>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Request Type</TableHead>
                          <TableHead>Count</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {settings.usage_summary && Object.keys(settings.usage_summary.requests_by_type).length > 0 ? (
                          Object.keys(settings.usage_summary.requests_by_type).map((type) => (
                            <TableRow key={type}>
                              <TableCell className="font-medium">{type}</TableCell>
                              <TableCell>{settings.usage_summary?.requests_by_type[type]}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center py-4">
                              No request data available for this period.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <p className="text-muted-foreground">No usage data available yet.</p>
                <p className="text-sm text-muted-foreground">
                  You can enable mock data in the <strong>Advanced Settings</strong> tab to see sample usage data.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

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
              <Label htmlFor="provider" className="text-right">Provider</Label>
              <Select 
                value={formState.provider} 
                onValueChange={(value) => handleSelectChange('provider', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="azure">Azure OpenAI</SelectItem>
                  <SelectItem value="google">Google AI</SelectItem>
                  <SelectItem value="cohere">Cohere</SelectItem>
                  <SelectItem value="huggingface">Hugging Face</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="model_name" className="text-right">Model Name</Label>
              <Input
                id="model_name"
                name="model_name"
                value={formState.model_name}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="api_key" className="text-right">API Key</Label>
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
              <Label htmlFor="api_base" className="text-right">API Base URL</Label>
              <Input
                id="api_base"
                name="api_base"
                value={formState.api_base || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="api_version" className="text-right">API Version</Label>
              <Input
                id="api_version"
                name="api_version"
                value={formState.api_version || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="organization_id" className="text-right">Organization ID</Label>
              <Input
                id="organization_id"
                name="organization_id"
                value={formState.organization_id || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="max_tokens" className="text-right">Max Tokens</Label>
              <Input
                id="max_tokens"
                name="max_tokens"
                type="number"
                value={formState.max_tokens || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="temperature" className="text-right">Temperature</Label>
              <Input
                id="temperature"
                name="temperature"
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={formState.temperature}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_default" className="text-right">Default Model</Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="is_default"
                  name="is_default"
                  checked={formState.is_default}
                  onCheckedChange={(checked) => setFormState(prev => ({ ...prev, is_default: checked }))}
                />
                <Label htmlFor="is_default">Set as default model</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModelOpen(false)}>Cancel</Button>
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
              <Label htmlFor="edit-provider" className="text-right">Provider</Label>
              <Select 
                value={formState.provider} 
                onValueChange={(value) => handleSelectChange('provider', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="azure">Azure OpenAI</SelectItem>
                  <SelectItem value="google">Google AI</SelectItem>
                  <SelectItem value="cohere">Cohere</SelectItem>
                  <SelectItem value="huggingface">Hugging Face</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-model_name" className="text-right">Model Name</Label>
              <Input
                id="edit-model_name"
                name="model_name"
                value={formState.model_name}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-api_key" className="text-right">API Key</Label>
              <Input
                id="edit-api_key"
                name="api_key"
                type="password"
                value={formState.api_key || ''}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="Leave blank to keep current key"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-api_base" className="text-right">API Base URL</Label>
              <Input
                id="edit-api_base"
                name="api_base"
                value={formState.api_base || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-api_version" className="text-right">API Version</Label>
              <Input
                id="edit-api_version"
                name="api_version"
                value={formState.api_version || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-organization_id" className="text-right">Organization ID</Label>
              <Input
                id="edit-organization_id"
                name="organization_id"
                value={formState.organization_id || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-max_tokens" className="text-right">Max Tokens</Label>
              <Input
                id="edit-max_tokens"
                name="max_tokens"
                type="number"
                value={formState.max_tokens || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-temperature" className="text-right">Temperature</Label>
              <Input
                id="edit-temperature"
                name="temperature"
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={formState.temperature}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-is_default" className="text-right">Default Model</Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="edit-is_default"
                  name="is_default"
                  checked={formState.is_default}
                  onCheckedChange={(checked) => setFormState(prev => ({ ...prev, is_default: checked }))}
                />
                <Label htmlFor="edit-is_default">Set as default model</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModelOpen(false)}>Cancel</Button>
            <Button onClick={updateModel} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Model
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default LLMSettingsPanel; 