import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Save, 
  Plus, 
  Trash2, 
  Settings, 
  Clock, 
  Mail, 
  RefreshCw, 
  Users,
  UserPlus,
  FileText,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { useWorkflowSettings, useSaveWorkflowSettings, useManageWorkflows } from '@/lib/hooks/useWorkflowSettings';

// Mock workflow types
const workflowTypes = [
  { id: 1, name: 'Educational Nurture', active: true, duration: 90, stages: 4 },
  { id: 2, name: 'Industry Focus', active: true, duration: 120, stages: 5 },
  { id: 3, name: 'Case Study Series', active: true, duration: 60, stages: 3 },
  { id: 4, name: 'Product Update', active: false, duration: 45, stages: 2 },
];

// Mock entry conditions
const entryConditions = [
  { id: 1, name: 'Lead Score Below 20', type: 'score', value: 20, operator: '<' },
  { id: 2, name: 'No Activity in 30 Days', type: 'activity', value: 30, operator: '>' },
  { id: 3, name: 'Visited Pricing Page', type: 'behavior', value: 'pricing_page_visit', operator: '=' },
];

// Mock exit conditions
const exitConditions = [
  { id: 1, name: 'Lead Score Rises Above 40', type: 'score', value: 40, operator: '>' },
  { id: 2, name: 'Replies to Email', type: 'activity', value: 'email_reply', operator: '=' },
  { id: 3, name: 'Maximum Duration Reached', type: 'time', value: 120, operator: '>' },
  { id: 4, name: 'Requests Demo', type: 'conversion', value: 'demo_request', operator: '=' },
];

const WorkflowSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('workflows');
  const [activeWorkflow, setActiveWorkflow] = useState<number | null>(null);
  const { data, isLoading, error } = useWorkflowSettings();
  const { saveSettings, isSaving } = useSaveWorkflowSettings();
  const { createWorkflow, updateWorkflow, deleteWorkflow, isProcessing } = useManageWorkflows();

  // Handler functions for workflow management
  const handleAddWorkflow = async () => {
    const newWorkflow = {
      name: 'New Workflow',
      active: true,
      duration: 90,
      stages: 0
    };
    
    const createdWorkflow = await createWorkflow(newWorkflow);
    if (createdWorkflow) {
      setActiveWorkflow(createdWorkflow.id);
    }
  };

  const handleEditWorkflow = (id: number) => {
    setActiveWorkflow(id);
  };

  const handleToggleWorkflowActive = async (id: number, active: boolean) => {
    await updateWorkflow(id, { active });
  };

  const handleWorkflowFieldChange = async (field: string, value: string | number | boolean) => {
    if (!activeWorkflow) return;
    
    const updatedWorkflow = {
      [field]: value
    };
    
    await updateWorkflow(activeWorkflow, updatedWorkflow);
  };

  const handleAddStage = async () => {
    if (!activeWorkflow || !data) return;
    
    const workflow = data.workflowTypes.find(w => w.id === activeWorkflow);
    if (!workflow || !workflow.stageDetails) return;
    
    const lastStage = workflow.stageDetails[workflow.stageDetails.length - 1];
    const newEndDay = lastStage ? lastStage.endDay + 30 : 30;
    const newStartDay = lastStage ? lastStage.endDay + 1 : 1;
    
    const newStage = {
      id: Math.floor(Math.random() * 1000), // Temporary ID that would be replaced by server
      name: `Stage ${workflow.stageDetails.length + 1}`,
      description: 'New stage description',
      durationDays: 30,
      startDay: newStartDay,
      endDay: newEndDay
    };
    
    // This would be replaced with a proper API call in production
    const stageDetails = [...workflow.stageDetails, newStage];
    await updateWorkflow(activeWorkflow, { 
      stageDetails,
      stages: stageDetails.length
    });
  };

  const handleEditStage = (stageId: number) => {
    // Implement stage editing functionality
    // This could open a dialog or expand the stage for editing
    console.log('Edit stage', stageId);
  };

  // Entry and exit condition handlers
  const handleAddEntryCondition = () => {
    // In a real implementation, this would open a modal dialog
    // to configure the new entry condition
    const newCondition = {
      name: 'New Entry Condition',
      type: 'score' as const,
      value: 30,
      operator: '<' as const
    };
    
    // This would be handled by the API in production
    if (data) {
      const updatedData = {
        ...data,
        entryConditions: [
          ...data.entryConditions,
          { ...newCondition, id: Math.floor(Math.random() * 1000) }
        ]
      };
      saveSettings(updatedData);
    }
  };

  const handleEditEntryCondition = (id: number) => {
    // This would open a modal to edit the condition
    console.log('Edit entry condition', id);
  };

  const handleDeleteEntryCondition = (id: number) => {
    if (!data) return;
    
    const updatedData = {
      ...data,
      entryConditions: data.entryConditions.filter(condition => condition.id !== id)
    };
    saveSettings(updatedData);
  };

  const handleAddExitCondition = () => {
    // In a real implementation, this would open a modal dialog
    // to configure the new exit condition
    const newCondition = {
      name: 'New Exit Condition',
      type: 'score' as const,
      value: 40,
      operator: '>' as const
    };
    
    // This would be handled by the API in production
    if (data) {
      const updatedData = {
        ...data,
        exitConditions: [
          ...data.exitConditions,
          { ...newCondition, id: Math.floor(Math.random() * 1000) }
        ]
      };
      saveSettings(updatedData);
    }
  };

  const handleEditExitCondition = (id: number) => {
    // This would open a modal to edit the condition
    console.log('Edit exit condition', id);
  };

  const handleDeleteExitCondition = (id: number) => {
    if (!data) return;
    
    const updatedData = {
      ...data,
      exitConditions: data.exitConditions.filter(condition => condition.id !== id)
    };
    saveSettings(updatedData);
  };

  // Template and schedule handlers
  const handleAddTemplate = (type: 'educational' | 'industry' | 'casestudy' | 'product') => {
    if (!data) return;
    
    const newTemplate = {
      id: Math.floor(Math.random() * 1000),
      name: 'New Template',
      description: 'Template description',
      type
    };
    
    const updatedData = {
      ...data,
      emailTemplates: {
        ...data.emailTemplates,
        [type]: [...data.emailTemplates[type], newTemplate]
      }
    };
    
    saveSettings(updatedData);
  };

  const handleViewTemplate = (id: number) => {
    // This would open a preview of the template
    console.log('View template', id);
  };

  const handleEditTemplate = (id: number) => {
    // This would open a template editor
    console.log('Edit template', id);
  };

  const handleAddScheduleRule = (type: 'educational' | 'industry' | 'casestudy' | 'product') => {
    if (!data) return;
    
    // Get the last day from existing schedules or default to 0
    const lastDay = data.deliverySchedules[type].length > 0 
      ? Math.max(...data.deliverySchedules[type].map(s => s.day))
      : 0;
    
    // Get the first template id if available
    const firstTemplateId = data.emailTemplates[type].length > 0 
      ? data.emailTemplates[type][0].id 
      : 0;
    
    const newSchedule = {
      id: Math.floor(Math.random() * 1000),
      day: lastDay + 7, // Add a week from the last one
      templateId: firstTemplateId,
      templateName: data.emailTemplates[type].length > 0 
        ? data.emailTemplates[type][0].name 
        : 'Select a template'
    };
    
    const updatedData = {
      ...data,
      deliverySchedules: {
        ...data.deliverySchedules,
        [type]: [...data.deliverySchedules[type], newSchedule]
      }
    };
    
    saveSettings(updatedData);
  };

  const getScheduleTitle = (schedule: any) => {
    // Generate a title based on the day
    if (schedule.day === 1) return 'Initial Contact';
    if (schedule.day <= 14) return 'Early Follow-up';
    if (schedule.day <= 30) return 'Mid-term Engagement';
    return 'Re-engagement';
  };

  const handleEditSchedule = (id: number) => {
    // This would open a schedule editor
    console.log('Edit schedule', id);
  };

  // Advanced settings handlers
  const handleAdvancedSettingChange = (setting: string, value: any) => {
    if (!data) return;
    
    const updatedData = {
      ...data,
      advancedSettings: {
        ...data.advancedSettings,
        [setting]: value
      }
    };
    
    saveSettings(updatedData);
  };

  const handleSaveSettings = async () => {
    if (!data) return;
    
    const success = await saveSettings(data);
    if (success) {
      // Additional actions after successful save if needed
    }
  };

  // Render loading state
  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64 mb-1" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <Skeleton className="h-10 w-full" />

        <div className="space-y-4">
          <Skeleton className="h-4 w-48 mb-2" />
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <h3 className="font-medium">Error loading workflow settings</h3>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {error}. Please try refreshing the page.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Workflow Settings</h2>
          <p className="text-muted-foreground">
            Configure automation workflows for low conversion leads
          </p>
        </div>
        <Button onClick={handleSaveSettings} disabled={isSaving}>
          {isSaving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="entry-exit">Entry & Exit Conditions</TabsTrigger>
          <TabsTrigger value="content">Content Sequences</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
        </TabsList>
        
        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-medium">Active Workflows</h3>
            <Button size="sm" onClick={handleAddWorkflow} disabled={isProcessing}>
              <Plus className="h-4 w-4 mr-2" />
              Add Workflow
            </Button>
          </div>
          
          <div className="grid gap-4">
            {data.workflowTypes.map((workflow) => (
              <Card 
                key={workflow.id} 
                className={`cursor-pointer ${activeWorkflow === workflow.id ? 'border-primary' : ''}`}
                onClick={() => setActiveWorkflow(workflow.id)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${workflow.active ? 'bg-green-500' : 'bg-amber-500'}`} />
                    <div>
                      <h4 className="font-medium">{workflow.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {workflow.duration} days · {workflow.stages} stages
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      handleEditWorkflow(workflow.id);
                    }}>
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Switch 
                      checked={workflow.active} 
                      onCheckedChange={(checked) => handleToggleWorkflowActive(workflow.id, checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {activeWorkflow && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Workflow Configuration</CardTitle>
                <CardDescription>
                  {data.workflowTypes.find(w => w.id === activeWorkflow)?.name} workflow settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="workflow-name">Workflow Name</Label>
                    <Input 
                      id="workflow-name" 
                      defaultValue={data.workflowTypes.find(w => w.id === activeWorkflow)?.name}
                      onChange={(e) => handleWorkflowFieldChange('name', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="workflow-duration">Maximum Duration (days)</Label>
                    <Input 
                      id="workflow-duration" 
                      type="number"
                      defaultValue={data.workflowTypes.find(w => w.id === activeWorkflow)?.duration}
                      onChange={(e) => handleWorkflowFieldChange('duration', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="workflow-status" 
                      checked={data.workflowTypes.find(w => w.id === activeWorkflow)?.active} 
                      onCheckedChange={(checked) => handleWorkflowFieldChange('active', checked)}
                    />
                    <Label htmlFor="workflow-status">Workflow Active</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    When disabled, no new leads will enter this workflow, but existing leads will continue to progress.
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Workflow Stages</Label>
                  <div className="space-y-3">
                    {data.workflowTypes.find(w => w.id === activeWorkflow)?.stageDetails?.map((stage) => (
                      <div key={stage.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div>
                          <span className="font-medium">{stage.name}</span>
                          <p className="text-sm text-muted-foreground">
                            Day {stage.startDay}-{stage.endDay}: {stage.description}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditStage(stage.id)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <Button variant="outline" size="sm" className="w-full" onClick={handleAddStage}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Stage
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Entry & Exit Conditions Tab */}
        <TabsContent value="entry-exit" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Entry Conditions */}
            <Card>
              <CardHeader>
                <CardTitle>Entry Conditions</CardTitle>
                <CardDescription>When leads should enter low conversion workflows</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.entryConditions.map((condition) => (
                  <div key={condition.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <span className="font-medium">{condition.name}</span>
                      <p className="text-sm text-muted-foreground">
                        {condition.type === 'score' && `Lead score ${condition.operator} ${condition.value}`}
                        {condition.type === 'activity' && `No activity for ${condition.value} days`}
                        {condition.type === 'behavior' && `Specific behavior: ${condition.value}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditEntryCondition(condition.id)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteEntryCondition(condition.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleAddEntryCondition}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry Condition
                </Button>
              </CardContent>
            </Card>
            
            {/* Exit Conditions */}
            <Card>
              <CardHeader>
                <CardTitle>Exit Conditions</CardTitle>
                <CardDescription>When leads should exit low conversion workflows</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.exitConditions.map((condition) => (
                  <div key={condition.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <span className="font-medium">{condition.name}</span>
                      <p className="text-sm text-muted-foreground">
                        {condition.type === 'score' && `Lead score ${condition.operator} ${condition.value}`}
                        {condition.type === 'activity' && `Activity: ${condition.value}`}
                        {condition.type === 'time' && `After ${condition.value} days in workflow`}
                        {condition.type === 'conversion' && `Conversion action: ${condition.value}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditExitCondition(condition.id)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteExitCondition(condition.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleAddExitCondition}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Exit Condition
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Content Sequences Tab */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Sequences</CardTitle>
              <CardDescription>Email and content templates for low conversion workflows</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="educational">
                <TabsList>
                  <TabsTrigger value="educational">Educational</TabsTrigger>
                  <TabsTrigger value="industry">Industry</TabsTrigger>
                  <TabsTrigger value="casestudy">Case Study</TabsTrigger>
                  <TabsTrigger value="product">Product</TabsTrigger>
                </TabsList>
                
                <TabsContent value="educational" className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Email Templates</Label>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAddTemplate('educational')}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Template
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {data.emailTemplates.educational.map(template => (
                        <div key={template.id} className="flex items-center justify-between p-3 border rounded-md">
                          <div>
                            <span className="font-medium">{template.name}</span>
                            <p className="text-sm text-muted-foreground">
                              {template.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleViewTemplate(template.id)}>
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEditTemplate(template.id)}>
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Delivery Schedule</Label>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAddScheduleRule('educational')}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Schedule Rule
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {data.deliverySchedules.educational.map(schedule => (
                        <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-md">
                          <div>
                            <span className="font-medium">Day {schedule.day}: {getScheduleTitle(schedule)}</span>
                            <p className="text-sm text-muted-foreground">
                              Send "{schedule.templateName}" template
                              {schedule.condition && ` ${schedule.condition}`}
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditSchedule(schedule.id)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="industry" className="pt-4">
                  <div className="flex items-center justify-center h-40">
                    <p className="text-muted-foreground">Select or create industry-specific content templates and sequences.</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="casestudy" className="pt-4">
                  <div className="flex items-center justify-center h-40">
                    <p className="text-muted-foreground">Select or create case study content templates and sequences.</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="product" className="pt-4">
                  <div className="flex items-center justify-center h-40">
                    <p className="text-muted-foreground">Select or create product-focused content templates and sequences.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Advanced Settings Tab */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Workflow Settings</CardTitle>
              <CardDescription>
                Configure advanced settings for low conversion workflows
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Automation Rules</h3>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-transition" className="font-medium">Automatic Lead Transitions</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically move leads between stages based on behavior
                      </p>
                    </div>
                    <Switch 
                      id="auto-transition" 
                      checked={data.advancedSettings.automaticLeadTransitions}
                      onCheckedChange={(checked) => handleAdvancedSettingChange('automaticLeadTransitions', checked)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="score-updates" className="font-medium">Dynamic Score Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Update lead scores based on engagement with workflow content
                      </p>
                    </div>
                    <Switch 
                      id="score-updates" 
                      checked={data.advancedSettings.dynamicScoreUpdates}
                      onCheckedChange={(checked) => handleAdvancedSettingChange('dynamicScoreUpdates', checked)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sales-alerts" className="font-medium">Sales Team Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Alert sales team when a lead shows re-engagement signals
                      </p>
                    </div>
                    <Switch 
                      id="sales-alerts" 
                      checked={data.advancedSettings.salesTeamAlerts}
                      onCheckedChange={(checked) => handleAdvancedSettingChange('salesTeamAlerts', checked)}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Performance Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="success-metric">Primary Success Metric</Label>
                    <Select 
                      value={data.advancedSettings.primarySuccessMetric}
                      onValueChange={(value) => handleAdvancedSettingChange('primarySuccessMetric', value)}
                    >
                      <SelectTrigger id="success-metric">
                        <SelectValue placeholder="Select success metric" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reengagement">Re-engagement Rate</SelectItem>
                        <SelectItem value="openrate">Email Open Rate</SelectItem>
                        <SelectItem value="clickthrough">Click-through Rate</SelectItem>
                        <SelectItem value="conversion">Conversion to Sales</SelectItem>
                        <SelectItem value="meetings">Meetings Booked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="target-value">Target Value</Label>
                    <div className="flex items-center space-x-2">
                      <Input 
                        id="target-value" 
                        type="number" 
                        value={data.advancedSettings.targetValue}
                        onChange={(e) => handleAdvancedSettingChange('targetValue', parseInt(e.target.value))}
                      />
                      <span>%</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ab-testing">A/B Testing</Label>
                  <Select 
                    value={data.advancedSettings.abTesting}
                    onValueChange={(value) => handleAdvancedSettingChange('abTesting', value)}
                  >
                    <SelectTrigger id="ab-testing">
                      <SelectValue placeholder="Select A/B testing mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disabled">Disabled</SelectItem>
                      <SelectItem value="subject">Email Subject Lines</SelectItem>
                      <SelectItem value="content">Email Content</SelectItem>
                      <SelectItem value="timing">Send Timing</SelectItem>
                      <SelectItem value="full">Full Workflow Testing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Data Retention & History</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="retention-period">Data Retention Period</Label>
                  <Select 
                    value={data.advancedSettings.retentionPeriod}
                    onValueChange={(value) => handleAdvancedSettingChange('retentionPeriod', value)}
                  >
                    <SelectTrigger id="retention-period">
                      <SelectValue placeholder="Select retention period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                      <SelectItem value="730">2 years</SelectItem>
                      <SelectItem value="unlimited">Unlimited</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="activity-log" className="font-medium">Detailed Activity Logging</Label>
                      <p className="text-sm text-muted-foreground">
                        Keep detailed logs of all workflow activities and lead interactions
                      </p>
                    </div>
                    <Switch 
                      id="activity-log" 
                      checked={data.advancedSettings.detailedLogging}
                      onCheckedChange={(checked) => handleAdvancedSettingChange('detailedLogging', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkflowSettings; 