/**
 * Component for connecting a lead to their external calendar
 */
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar, Check, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getLeadCalendarIntegration } from '@/lib/services/calendarIntegrationService';
import { signIn, useSession } from 'next-auth/react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface CalendarIntegrationProps {
  leadId: string;
  onIntegrationChange?: (isConnected: boolean) => void;
}

interface CalendarProviderOption {
  id: 'google' | 'microsoft' | 'apple';
  name: string;
  description: string;
  authProvider: string;
  icon?: React.ReactNode;
  enabled: boolean;
}

export function CalendarIntegration({ leadId, onIntegrationChange }: CalendarIntegrationProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectedProvider, setConnectedProvider] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const session = useSession();

  const calendarProviders: CalendarProviderOption[] = [
    {
      id: 'google',
      name: 'Google Calendar',
      description: 'Connect Google Calendar',
      authProvider: 'google',
      enabled: true
    },
    {
      id: 'microsoft',
      name: 'Microsoft Outlook',
      description: 'Connect Microsoft Outlook Calendar',
      authProvider: 'azure-ad',
      enabled: true
    },
    {
      id: 'apple',
      name: 'Apple Calendar',
      description: 'Connect Apple iCloud Calendar',
      authProvider: 'apple',
      enabled: false // Set to false since we don't have full Apple Calendar support yet
    }
  ];

  useEffect(() => {
    async function checkIntegration() {
      if (!leadId) return;
      
      setIsLoading(true);
      try {
        const integration = await getLeadCalendarIntegration(leadId);
        setIsConnected(!!integration);
        if (integration) {
          setConnectedProvider(integration.provider);
        }
        if (onIntegrationChange) {
          onIntegrationChange(!!integration);
        }
      } catch (error) {
        console.error('Error checking calendar integration:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkIntegration();
  }, [leadId, onIntegrationChange]);

  const handleConnectCalendar = async (provider: CalendarProviderOption) => {
    if (!provider.enabled) {
      toast({
        title: "Provider not available",
        description: `${provider.name} integration is not available yet.`,
        variant: "destructive"
      });
      return;
    }
    
    // Initiate OAuth flow with the selected provider
    signIn(provider.authProvider, { 
      callbackUrl: `${window.location.origin}/api/auth/callback/calendar?lead_id=${leadId}&provider=${provider.id}` 
    });
  };

  const getProviderLabel = (providerId: string): string => {
    const provider = calendarProviders.find(p => p.id === providerId);
    return provider?.name || 'Calendar';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Calendar Integration</CardTitle>
            <CardDescription>
              Connect this lead's external calendar to check their availability
            </CardDescription>
          </div>
          <Calendar className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-r-transparent rounded-full" />
          </div>
        ) : isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 py-2">
              <div className="bg-green-100 dark:bg-green-900 p-1 rounded-full">
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <span>
                Connected to <span className="font-medium">{getProviderLabel(connectedProvider || '')}</span>
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Drop existing connection and allow reconnecting
                setIsConnected(false);
                setConnectedProvider(null);
                if (onIntegrationChange) {
                  onIntegrationChange(false);
                }
                toast({
                  title: "Calendar disconnected",
                  description: "You can now connect a different calendar.",
                });
              }}
            >
              Change calendar
            </Button>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            <p className="text-sm text-muted-foreground mb-2">
              Connecting the lead's calendar allows you to see their real availability
            </p>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <span>Connect Calendar</span>
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {calendarProviders.map(provider => (
                  <DropdownMenuItem
                    key={provider.id}
                    onClick={() => handleConnectCalendar(provider)}
                    disabled={!provider.enabled}
                    className={!provider.enabled ? "opacity-50 cursor-not-allowed" : ""}
                  >
                    {provider.name}
                    {!provider.enabled && <span className="ml-2 text-xs">(Coming soon)</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 