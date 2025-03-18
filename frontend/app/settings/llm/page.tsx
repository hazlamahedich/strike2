'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Plus, Settings, RefreshCw, Trash2 } from 'lucide-react';
import { useLLM } from '@/contexts/LLMContext';
import { getAllLLMModels, getLLMProviders } from '@/lib/services/llmService';
import { LLMModel, LLMProviderInfo } from '@/lib/types/llm';

export default function LLMSettingsPage() {
  const { settings, defaultModel, loading, error, refreshSettings } = useLLM();
  const [models, setModels] = useState<LLMModel[]>([]);
  const [providers, setProviders] = useState<LLMProviderInfo[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [isNewModelOpen, setIsNewModelOpen] = useState(false);
  const [mockModeEnabled, setMockModeEnabled] = useState(false);
  const [selectedModel, setSelectedModel] = useState<LLMModel | null>(null);
  const [isEditModelOpen, setIsEditModelOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const router = useRouter();

  // Form state for new/edit model
  const [formState, setFormState] = useState<Partial<LLMModel>>({
    provider: '',
    model_name: '',
    api_key: '',
    api_base: '',
    api_version: '',
    organization_id: '',
    max_tokens: 1000,
    temperature: 0.7,
    is_default: false
  });

  // Load models and providers
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingModels(true);
        const [modelsData, providersData] = await Promise.all([
          getAllLLMModels(),
          getLLMProviders()
        ]);
        setModels(modelsData);
        setProviders(providersData);
        
        // Check if mock mode is enabled from localStorage
        const mockMode = localStorage.getItem('useMockData') === 'true';
        setMockModeEnabled(mockMode);
      } catch (error) {
        console.error('Error loading LLM data:', error);
        toast({
          title: 'Error loading data',
          description: 'Could not load LLM models and providers. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoadingModels(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Handle toggling mock mode
  const handleToggleMockMode = (enabled: boolean) => {
    localStorage.setItem('useMockData', String(enabled));
    setMockModeEnabled(enabled);
    
    toast({
      title: enabled ? 'Mock mode enabled' : 'Mock mode disabled',
      description: enabled 
        ? 'Using mock data for all LLM calls' 
        : 'Using real LLM API calls',
    });
    
    // Refresh settings to update the UI
    refreshSettings();
  };
  
  // Handle form change
  const handleFormChange = (field: keyof LLMModel, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };
  
  // Handle save model
  const handleSaveModel = async () => {
    try {
      // Validate form
      if (!formState.provider || !formState.model_name) {
        toast({
          title: 'Validation error',
          description: 'Provider and model name are required',
          variant: 'destructive',
        });
        return;
      }
      
      // API endpoint
      const endpoint = selectedModel 
        ? `/api/llm/models/${selectedModel.id}` 
        : '/api/llm/models';
      
      // HTTP method
      const method = selectedModel ? 'PUT' : 'POST';
      
      // Make the API call
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      // Refresh data
      const updatedModels = await getAllLLMModels();
      setModels(updatedModels);
      
      // Refresh context if this is the default model
      if (formState.is_default) {
        refreshSettings();
      }
      
      // Close dialog/sheet
      setIsNewModelOpen(false);
      setIsEditModelOpen(false);
      setSelectedModel(null);
      
      // Show success message
      toast({
        title: selectedModel ? 'Model updated' : 'Model added',
        description: `Successfully ${selectedModel ? 'updated' : 'added'} the LLM model.`,
      });
      
      // Reset form
      setFormState({
        provider: '',
        model_name: '',
        api_key: '',
        api_base: '',
        api_version: '',
        organization_id: '',
        max_tokens: 1000,
        temperature: 0.7,
        is_default: false
      });
    } catch (error) {
      console.error('Error saving model:', error);
      toast({
        title: 'Error',
        description: `Failed to ${selectedModel ? 'update' : 'add'} the LLM model. Please try again.`,
        variant: 'destructive',
      });
    }
  };
  
  // Handle edit model
  const handleEditModel = (model: LLMModel) => {
    setSelectedModel(model);
    setFormState(model);
    setIsEditModelOpen(true);
  };
  
  // Handle delete model
  const handleDeleteModel = async () => {
    if (!selectedModel?.id) return;
    
    try {
      const response = await fetch(`/api/llm/models/${selectedModel.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      // Refresh data
      const updatedModels = await getAllLLMModels();
      setModels(updatedModels);
      
      // Check if we deleted the default model
      if (selectedModel.is_default) {
        refreshSettings();
      }
      
      // Close dialog
      setIsDeleteDialogOpen(false);
      setSelectedModel(null);
      
      // Show success message
      toast({
        title: 'Model deleted',
        description: 'Successfully deleted the LLM model.',
      });
    } catch (error) {
      console.error('Error deleting model:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the LLM model. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle set default model
  const handleSetDefaultModel = async (model: LLMModel) => {
    try {
      const response = await fetch(`/api/llm/models/${model.id}/default`, {
        method: 'PUT',
      });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      // Refresh data
      const updatedModels = await getAllLLMModels();
      setModels(updatedModels);
      
      // Refresh settings
      refreshSettings();
      
      // Show success message
      toast({
        title: 'Default model updated',
        description: `${model.provider} / ${model.model_name} is now the default model.`,
      });
    } catch (error) {
      console.error('Error setting default model:', error);
      toast({
        title: 'Error',
        description: 'Failed to set the default model. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">LLM Settings</h1>
          <p className="text-muted-foreground">
            Manage your Large Language Model configurations
          </p>
        </div>
        <Button onClick={refreshSettings} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      <Tabs defaultValue="models" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        {/* Models Tab */}
        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>Configured Models</CardTitle>
                <CardDescription>
                  Manage your LLM models and API configurations
                </CardDescription>
              </div>
              <Button onClick={() => setIsNewModelOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Model
              </Button>
            </CardHeader>
            <CardContent>
              {loadingModels ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : models.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No models configured yet</p>
                  <p className="text-sm mt-2">Add your first model to get started</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Model Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {models.map((model) => (
                      <TableRow key={model.id}>
                        <TableCell className="font-medium">{model.provider}</TableCell>
                        <TableCell>{model.model_name}</TableCell>
                        <TableCell>
                          {model.is_default && (
                            <Badge variant="default">Default</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {!model.is_default && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSetDefaultModel(model)}
                            >
                              Set Default
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditModel(model)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedModel(model);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>LLM Usage Statistics</CardTitle>
              <CardDescription>
                View your token usage and cost information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="text-center py-8 text-destructive">
                  <p>Error loading usage data</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Tokens
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {settings?.usage.totalTokens.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Prompt Tokens
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {settings?.usage.totalPromptTokens.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Completion Tokens
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {settings?.usage.totalCompletionTokens.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="md:col-span-3">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Estimated Cost
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ${settings?.usage.totalCost.toFixed(4)}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Global Settings</CardTitle>
              <CardDescription>
                Configure global settings for LLM functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mock Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Use mock data instead of making real API calls
                  </p>
                </div>
                <Switch
                  checked={mockModeEnabled}
                  onCheckedChange={handleToggleMockMode}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Default Model</Label>
                  <p className="text-sm text-muted-foreground">
                    Currently using: {defaultModel ? `${defaultModel.provider} / ${defaultModel.model_name}` : 'None'}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/settings/llm?tab=models')}
                  disabled={models.length === 0}
                >
                  Change
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Add Model Sheet */}
      <Sheet open={isNewModelOpen} onOpenChange={setIsNewModelOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add New Model</SheetTitle>
            <SheetDescription>
              Configure a new LLM model to use in your application
            </SheetDescription>
          </SheetHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select
                value={formState.provider}
                onValueChange={(value) => handleFormChange('provider', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="model_name">Model Name</Label>
              <Input
                id="model_name"
                value={formState.model_name || ''}
                onChange={(e) => handleFormChange('model_name', e.target.value)}
                placeholder="e.g., gpt-4, claude-3-haiku"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="api_key">API Key</Label>
              <Input
                id="api_key"
                type="password"
                value={formState.api_key || ''}
                onChange={(e) => handleFormChange('api_key', e.target.value)}
                placeholder="API key"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="api_base">API Base URL (Optional)</Label>
              <Input
                id="api_base"
                value={formState.api_base || ''}
                onChange={(e) => handleFormChange('api_base', e.target.value)}
                placeholder="e.g., https://api.openai.com/v1"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="api_version">API Version (Optional)</Label>
              <Input
                id="api_version"
                value={formState.api_version || ''}
                onChange={(e) => handleFormChange('api_version', e.target.value)}
                placeholder="e.g., 2023-05-15"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="organization_id">Organization ID (Optional)</Label>
              <Input
                id="organization_id"
                value={formState.organization_id || ''}
                onChange={(e) => handleFormChange('organization_id', e.target.value)}
                placeholder="Organization ID"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max_tokens">Max Tokens</Label>
              <Input
                id="max_tokens"
                type="number"
                value={formState.max_tokens || 1000}
                onChange={(e) => handleFormChange('max_tokens', parseInt(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={formState.temperature || 0.7}
                onChange={(e) => handleFormChange('temperature', parseFloat(e.target.value))}
              />
              <p className="text-sm text-muted-foreground">
                Lower values = more deterministic, higher values = more creative
              </p>
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="is_default"
                checked={formState.is_default || false}
                onCheckedChange={(checked) => handleFormChange('is_default', checked)}
              />
              <Label htmlFor="is_default">Set as default model</Label>
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setIsNewModelOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveModel}>Save Model</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      
      {/* Edit Model Dialog */}
      <Dialog open={isEditModelOpen} onOpenChange={setIsEditModelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Model</DialogTitle>
            <DialogDescription>
              Update your LLM model configuration
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-provider">Provider</Label>
              <Select
                value={formState.provider}
                onValueChange={(value) => handleFormChange('provider', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-model_name">Model Name</Label>
              <Input
                id="edit-model_name"
                value={formState.model_name || ''}
                onChange={(e) => handleFormChange('model_name', e.target.value)}
                placeholder="e.g., gpt-4, claude-3-haiku"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-api_key">API Key</Label>
              <Input
                id="edit-api_key"
                type="password"
                value={formState.api_key || ''}
                onChange={(e) => handleFormChange('api_key', e.target.value)}
                placeholder="API key"
              />
              <p className="text-sm text-muted-foreground">
                Leave blank to keep the existing key
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-api_base">API Base URL</Label>
              <Input
                id="edit-api_base"
                value={formState.api_base || ''}
                onChange={(e) => handleFormChange('api_base', e.target.value)}
                placeholder="e.g., https://api.openai.com/v1"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-max_tokens">Max Tokens</Label>
              <Input
                id="edit-max_tokens"
                type="number"
                value={formState.max_tokens || 1000}
                onChange={(e) => handleFormChange('max_tokens', parseInt(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-temperature">Temperature</Label>
              <Input
                id="edit-temperature"
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={formState.temperature || 0.7}
                onChange={(e) => handleFormChange('temperature', parseFloat(e.target.value))}
              />
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="edit-is_default"
                checked={formState.is_default || false}
                onCheckedChange={(checked) => handleFormChange('is_default', checked)}
              />
              <Label htmlFor="edit-is_default">Set as default model</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModelOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveModel}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the model configuration for{' '}
              <strong>{selectedModel?.provider} / {selectedModel?.model_name}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteModel} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 