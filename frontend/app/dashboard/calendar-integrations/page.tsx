'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Check, ExternalLink, RefreshCw, X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Mock data for connected calendars
const MOCK_CONNECTED_CALENDARS = [
  {
    id: 'google-1',
    provider: 'google',
    name: 'Work Calendar',
    email: 'user@example.com',
    connected: true,
    lastSync: '2023-06-15T10:30:00Z'
  }
];

export default function CalendarIntegrationsPage() {
  const [activeTab, setActiveTab] = useState('connected');
  const [connectedCalendars, setConnectedCalendars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingCalendar, setSyncingCalendar] = useState<string | null>(null);

  // Fetch connected calendars on component mount
  useEffect(() => {
    // In a real implementation, this would fetch from the API
    // For now, we'll use mock data
    setTimeout(() => {
      setConnectedCalendars(MOCK_CONNECTED_CALENDARS);
      setLoading(false);
    }, 1000);
  }, []);

  // Handle connecting to Google Calendar
  const handleConnectGoogle = () => {
    // In a real implementation, this would redirect to the Google OAuth flow
    // For now, we'll just show a toast
    toast({
      title: 'Redirecting to Google',
      description: 'You will be redirected to Google to authorize access to your calendar.',
    });
    
    // Simulate a redirect
    setTimeout(() => {
      window.location.href = '/api/v1/meetings/google-calendar/auth';
    }, 1500);
  };

  // Handle connecting to Microsoft Calendar
  const handleConnectMicrosoft = () => {
    // In a real implementation, this would redirect to the Microsoft OAuth flow
    // For now, we'll just show a toast
    toast({
      title: 'Redirecting to Microsoft',
      description: 'You will be redirected to Microsoft to authorize access to your calendar.',
    });
    
    // Simulate a redirect
    setTimeout(() => {
      toast({
        title: 'Microsoft Calendar Integration',
        description: 'This feature is coming soon.',
        variant: 'destructive'
      });
    }, 1500);
  };

  // Handle syncing a calendar
  const handleSyncCalendar = (calendarId: string) => {
    setSyncingCalendar(calendarId);
    
    // In a real implementation, this would call the API to sync the calendar
    // For now, we'll just simulate a sync
    setTimeout(() => {
      toast({
        title: 'Calendar Synced',
        description: 'Your calendar has been synced successfully.',
      });
      setSyncingCalendar(null);
      
      // Update the last sync time
      setConnectedCalendars(calendars => 
        calendars.map(cal => 
          cal.id === calendarId 
            ? { ...cal, lastSync: new Date().toISOString() } 
            : cal
        )
      );
    }, 2000);
  };

  // Handle disconnecting a calendar
  const handleDisconnectCalendar = (calendarId: string) => {
    // In a real implementation, this would call the API to disconnect the calendar
    // For now, we'll just simulate a disconnect
    toast({
      title: 'Confirm Disconnect',
      description: 'Are you sure you want to disconnect this calendar?',
      action: (
        <div className="flex space-x-2">
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => {
              setConnectedCalendars(calendars => 
                calendars.filter(cal => cal.id !== calendarId)
              );
              toast({
                title: 'Calendar Disconnected',
                description: 'Your calendar has been disconnected successfully.',
              });
            }}
          >
            Disconnect
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              toast({
                title: 'Cancelled',
                description: 'Calendar disconnect cancelled.',
              });
            }}
          >
            Cancel
          </Button>
        </div>
      ),
    });
  };

  // Handle toggling calendar sync
  const handleToggleSync = (calendarId: string, enabled: boolean) => {
    // In a real implementation, this would call the API to toggle sync
    // For now, we'll just update the local state
    setConnectedCalendars(calendars => 
      calendars.map(cal => 
        cal.id === calendarId 
          ? { ...cal, connected: enabled } 
          : cal
      )
    );
    
    toast({
      title: enabled ? 'Sync Enabled' : 'Sync Disabled',
      description: `Calendar sync has been ${enabled ? 'enabled' : 'disabled'}.`,
    });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Calendar Integrations</h2>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="connected">Connected Calendars</TabsTrigger>
          <TabsTrigger value="available">Available Integrations</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="connected" className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : connectedCalendars.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Connected Calendars</CardTitle>
                <CardDescription>
                  You haven't connected any calendars yet. Go to the "Available Integrations" tab to connect a calendar.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid gap-4">
              {connectedCalendars.map(calendar => (
                <Card key={calendar.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center">
                          {calendar.provider === 'google' && (
                            <img 
                              src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" 
                              alt="Google Calendar" 
                              className="h-5 w-5 mr-2" 
                            />
                          )}
                          {calendar.provider === 'microsoft' && (
                            <img 
                              src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg" 
                              alt="Microsoft Calendar" 
                              className="h-5 w-5 mr-2" 
                            />
                          )}
                          {calendar.name}
                        </CardTitle>
                        <CardDescription>{calendar.email}</CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2">
                          <Switch 
                            id={`sync-${calendar.id}`}
                            checked={calendar.connected}
                            onCheckedChange={(checked) => handleToggleSync(calendar.id, checked)}
                          />
                          <Label htmlFor={`sync-${calendar.id}`}>
                            {calendar.connected ? 'Sync enabled' : 'Sync disabled'}
                          </Label>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="text-sm text-muted-foreground">
                      Last synced: {formatDate(calendar.lastSync)}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleSyncCalendar(calendar.id)}
                      disabled={syncingCalendar === calendar.id}
                    >
                      {syncingCalendar === calendar.id ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Sync Now
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDisconnectCalendar(calendar.id)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Disconnect
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="available" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" 
                    alt="Google Calendar" 
                    className="h-5 w-5 mr-2" 
                  />
                  Google Calendar
                </CardTitle>
                <CardDescription>
                  Connect your Google Calendar to sync events and meetings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Sync your Google Calendar events with our platform. This allows you to:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    View all your events in one place
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    Automatically add meetings to your Google Calendar
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    Avoid scheduling conflicts
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button onClick={handleConnectGoogle} className="w-full">
                  Connect Google Calendar
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg" 
                    alt="Microsoft Calendar" 
                    className="h-5 w-5 mr-2" 
                  />
                  Microsoft Calendar
                </CardTitle>
                <CardDescription>
                  Connect your Outlook or Microsoft 365 Calendar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Sync your Microsoft Calendar events with our platform. This allows you to:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    View all your events in one place
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    Automatically add meetings to your Microsoft Calendar
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    Avoid scheduling conflicts
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button onClick={handleConnectMicrosoft} className="w-full">
                  Connect Microsoft Calendar
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendar Sync Settings</CardTitle>
              <CardDescription>
                Configure how calendar events are synced between our platform and your external calendars
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="two-way-sync">Two-way Sync</Label>
                    <p className="text-sm text-muted-foreground">
                      Sync events in both directions between our platform and your calendars
                    </p>
                  </div>
                  <Switch id="two-way-sync" defaultChecked />
                </div>
                
                <div className="border-t my-4"></div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-sync">Auto Sync</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically sync calendars every 15 minutes
                    </p>
                  </div>
                  <Switch id="auto-sync" defaultChecked />
                </div>
                
                <div className="border-t my-4"></div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="meeting-notifications">Meeting Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications for upcoming meetings from connected calendars
                    </p>
                  </div>
                  <Switch id="meeting-notifications" defaultChecked />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Settings</Button>
            </CardFooter>
          </Card>
          
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertTitle>Calendar Privacy</AlertTitle>
            <AlertDescription>
              We only access the calendar events you explicitly share with us. Your calendar data is encrypted and never shared with third parties.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
} 