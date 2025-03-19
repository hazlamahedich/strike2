import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from '@/components/ui/use-toast';
import { ArrowUpRight, Bell, Clock, Filter, MoreHorizontal, RefreshCw, UserRound } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Temporary mock API client until real one is available
const apiClient = {
  get: async (url: string) => {
    console.log(`Mock GET request to ${url}`);
    return { data: [], error: null };
  },
  post: async (url: string, data: any) => {
    console.log(`Mock POST request to ${url} with data:`, data);
    return { data: {}, error: null };
  }
};

interface Lead {
  id: number;
  name: string;
  email: string;
  company: string;
  status: string;
  conversion_probability: number;
  workflow_name: string;
  days_in_pipeline: number;
  last_activity: string;
  avatar_url?: string;
}

interface WorkflowStage {
  id: string;
  name: string;
  leads: Lead[];
}

const workflowColors: Record<string, string> = {
  'Hibernating': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'Re-engagement': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  'Education': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'Long-term': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
};

const daysSeverity = (days: number) => {
  if (days < 30) return 'text-green-500 dark:text-green-400';
  if (days < 60) return 'text-amber-500 dark:text-amber-400';
  if (days < 90) return 'text-orange-500 dark:text-orange-400';
  return 'text-red-500 dark:text-red-400';
};

const LowConversionPipeline: React.FC = () => {
  const [stages, setStages] = useState<WorkflowStage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterWorkflow, setFilterWorkflow] = useState<string | null>(null);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const { theme } = useTheme();
  
  useEffect(() => {
    const fetchLowConversionLeads = async () => {
      setIsLoading(true);
      try {
        // For now, let's create mock data since the API endpoint may not be ready
        const mockStages: WorkflowStage[] = [
          {
            id: 'early_nurture',
            name: 'Early Nurture',
            leads: [
              {
                id: 1,
                name: 'John Smith',
                email: 'john@example.com',
                company: 'Acme Corp',
                status: 'Contacted',
                conversion_probability: 0.25,
                workflow_name: 'Hibernating',
                days_in_pipeline: 15,
                last_activity: new Date().toISOString(),
              },
              {
                id: 2,
                name: 'Jane Doe',
                email: 'jane@example.com',
                company: 'XYZ Inc',
                status: 'New',
                conversion_probability: 0.15,
                workflow_name: 'Long-term',
                days_in_pipeline: 5,
                last_activity: new Date().toISOString(),
              },
            ],
          },
          {
            id: 'education',
            name: 'Education',
            leads: [
              {
                id: 3,
                name: 'Mike Johnson',
                email: 'mike@example.com',
                company: 'Tech Solutions',
                status: 'Engaged',
                conversion_probability: 0.35,
                workflow_name: 'Education',
                days_in_pipeline: 45,
                last_activity: new Date().toISOString(),
              },
            ],
          },
          {
            id: 'value_proposition',
            name: 'Value Proposition',
            leads: [
              {
                id: 4,
                name: 'Sarah Williams',
                email: 'sarah@example.com',
                company: 'Global Services',
                status: 'Qualified',
                conversion_probability: 0.30,
                workflow_name: 'Re-engagement',
                days_in_pipeline: 75,
                last_activity: new Date().toISOString(),
              },
            ],
          },
          {
            id: 're_engagement',
            name: 'Re-engagement',
            leads: [
              {
                id: 5,
                name: 'Robert Brown',
                email: 'robert@example.com',
                company: 'Innovative LLC',
                status: 'Contacted',
                conversion_probability: 0.20,
                workflow_name: 'Hibernating',
                days_in_pipeline: 95,
                last_activity: new Date().toISOString(),
              },
            ],
          },
          {
            id: 'exit_decision',
            name: 'Exit Decision',
            leads: [
              {
                id: 6,
                name: 'Lisa Anderson',
                email: 'lisa@example.com',
                company: 'Future Corp',
                status: 'Stalled',
                conversion_probability: 0.10,
                workflow_name: 'Long-term',
                days_in_pipeline: 120,
                last_activity: new Date().toISOString(),
              },
            ],
          },
        ];
        
        setStages(mockStages);
        
        // Uncomment this when the API is ready
        /*
        const response = await apiClient.get('/api/leads/low-conversion');
        
        if (response.error) {
          toast({
            title: 'Error',
            description: 'Failed to fetch low conversion leads',
            variant: 'destructive',
          });
          return;
        }
        
        // Group leads by their current stage in the workflow
        const stageMap: Record<string, WorkflowStage> = {
          'early_nurture': { id: 'early_nurture', name: 'Early Nurture', leads: [] },
          'education': { id: 'education', name: 'Education', leads: [] },
          'value_proposition': { id: 'value_proposition', name: 'Value Proposition', leads: [] },
          're_engagement': { id: 're_engagement', name: 'Re-engagement', leads: [] },
          'exit_decision': { id: 'exit_decision', name: 'Exit Decision', leads: [] },
        };
        
        response.data.forEach((lead: any) => {
          // Map API lead to our lead structure
          const mappedLead: Lead = {
            id: lead.id,
            name: lead.name,
            email: lead.email,
            company: lead.company || '',
            status: lead.status,
            conversion_probability: lead.conversion_probability,
            workflow_name: lead.workflow_name,
            days_in_pipeline: lead.days_in_pipeline || 
              Math.floor((new Date().getTime() - new Date(lead.created_at).getTime()) / (1000 * 3600 * 24)),
            last_activity: lead.last_activity,
            avatar_url: lead.avatar_url,
          };
          
          // Add to appropriate stage
          if (stageMap[lead.workflow_stage]) {
            stageMap[lead.workflow_stage].leads.push(mappedLead);
          } else {
            // Default to early nurture if stage is unknown
            stageMap.early_nurture.leads.push(mappedLead);
          }
        });
        
        // Convert map to array and sort leads within each stage
        const stagesArray = Object.values(stageMap).map(stage => ({
          ...stage,
          leads: stage.leads.sort((a, b) => b.conversion_probability - a.conversion_probability)
        }));
        
        setStages(stagesArray);
        */
      } catch (error) {
        console.error('Error fetching low conversion leads:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLowConversionLeads();
  }, []);
  
  // Handle agent intervention
  const handleAgentIntervention = async (leadId: number) => {
    try {
      toast({
        title: 'Success',
        description: 'You have taken over this lead from automation',
      });
      
      // Uncomment when API is ready
      /*
      const response = await apiClient.post(`/api/leads/${leadId}/intervene`, {
        action: 'manual_takeover'
      });
      
      if (response.error) {
        toast({
          title: 'Error',
          description: 'Failed to intervene on this lead',
          variant: 'destructive',
        });
        return;
      }
      
      toast({
        title: 'Success',
        description: 'You have taken over this lead from automation',
      });
      */
      
      // Update local state to reflect the change
      setStages(currentStages => 
        currentStages.map(stage => ({
          ...stage,
          leads: stage.leads.filter(lead => lead.id !== leadId)
        }))
      );
    } catch (error) {
      console.error('Error intervening on lead:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };
  
  const filteredStages = filterWorkflow 
    ? stages.map(stage => ({
        ...stage,
        leads: stage.leads.filter(lead => lead.workflow_name === filterWorkflow)
      }))
    : stages;
  
  // Get unique workflow names for filtering
  const workflowNames = Array.from(
    new Set(stages.flatMap(stage => stage.leads.map(lead => lead.workflow_name)))
  );
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading low conversion pipeline...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Low Conversion Pipeline</h2>
          <p className="text-muted-foreground">Manage leads in automated nurture workflows</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setView(view === 'kanban' ? 'list' : 'kanban')}>
            {view === 'kanban' ? 'List View' : 'Kanban View'}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                {filterWorkflow || 'All Workflows'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterWorkflow(null)}>
                All Workflows
              </DropdownMenuItem>
              {workflowNames.map((name) => (
                <DropdownMenuItem key={name} onClick={() => setFilterWorkflow(name)}>
                  {name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button>
            <UserRound className="w-4 h-4 mr-2" />
            Agent Dashboard
          </Button>
        </div>
      </div>
      
      {view === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 p-1 dark:bg-background/30 rounded-lg">
          {filteredStages.map((stage) => (
            <div key={stage.id} className="flex flex-col">
              <div className="bg-muted p-3 rounded-t-md">
                <h3 className="font-medium">{stage.name}</h3>
                <p className="text-sm text-muted-foreground">{stage.leads.length} leads</p>
              </div>
              
              <div className="bg-card p-2 rounded-b-md flex-1 min-h-[300px] overflow-y-auto border border-border dark:bg-background/50">
                {stage.leads.map((lead) => (
                  <Card 
                    key={lead.id} 
                    className="mb-3 cursor-pointer hover:shadow-md transition-shadow dark:border-border dark:hover:border-primary-900 dark:shadow-none dark:hover:bg-card/80"
                  >
                    <CardHeader className="p-3 pb-0 dark:bg-card/90">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <Avatar className="w-8 h-8 mr-2">
                            <AvatarImage src={lead.avatar_url} />
                            <AvatarFallback>{lead.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-sm font-medium">{lead.name}</CardTitle>
                            <p className="text-xs text-muted-foreground">{lead.company}</p>
                          </div>
                        </div>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="outline" className={workflowColors[lead.workflow_name] || 'bg-muted'}>
                                {lead.workflow_name}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Current workflow</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-3 dark:bg-card/70">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Conversion</p>
                          <p className="font-medium dark:text-slate-200">
                            {(lead.conversion_probability * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Days</p>
                          <p className={`font-medium ${daysSeverity(lead.days_in_pipeline)}`}>
                            {lead.days_in_pipeline}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="p-3 pt-0 flex justify-between dark:bg-card/90">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-xs text-muted-foreground"
                            >
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(lead.last_activity).toLocaleDateString()}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Last activity date</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-primary hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950 dark:hover:text-primary-300"
                        onClick={() => handleAgentIntervention(lead.id)}
                      >
                        <UserRound className="w-3 h-3 mr-1" />
                        Intervene
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
                
                {stage.leads.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-muted-foreground">No leads in this stage</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-md shadow overflow-hidden border border-border">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Lead
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Workflow
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Conversion
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Days in Pipeline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filteredStages.flatMap(stage => 
                stage.leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-muted/40 dark:hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar className="w-8 h-8 mr-2">
                          <AvatarImage src={lead.avatar_url} />
                          <AvatarFallback>{lead.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{lead.name}</p>
                          <p className="text-sm text-muted-foreground">{lead.company}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {stage.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={workflowColors[lead.workflow_name] || 'bg-muted'}>
                        {lead.workflow_name}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(lead.conversion_probability * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={daysSeverity(lead.days_in_pipeline)}>
                        {lead.days_in_pipeline} days
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(lead.last_activity).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-primary hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950 dark:hover:text-primary-300"
                        onClick={() => handleAgentIntervention(lead.id)}
                      >
                        <UserRound className="w-3 h-3 mr-1" />
                        Intervene
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ArrowUpRight className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
              
              {filteredStages.flatMap(stage => stage.leads).length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-muted-foreground">
                    No leads found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LowConversionPipeline; 