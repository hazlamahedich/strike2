'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";
import { useUserSettings } from "@/hooks/useUserSettings";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { 
    profile, 
    isLoading, 
    error, 
    updatePreferences, 
    updateNotificationSettings,
    toggleMockFeatures,
    isMockFeaturesEnabled
  } = useUserSettings();
  
  // Local state for form values
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    avatar: '',
    bio: '',
    timezone: 'America/New_York',
    language: 'en',
  });
  
  // Notification preferences state
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    task_reminders: true,
    deal_updates: true,
    weekly_reports: true,
    marketing_emails: false,
    system_announcements: true,
  });
  
  // General settings state
  const [settings, setSettings] = useState({
    theme: 'system',
    compact_mode: false,
    auto_save: true,
    show_kpi: true,
    default_view: 'kanban',
    currency: 'USD',
    date_format: 'MM/DD/YYYY',
  });

  // Update local state when profile data is loaded
  useEffect(() => {
    if (profile) {
      // Update form values
      setFormValues({
        name: profile.preferences?.full_name || '',
        email: session?.user?.email || '',
        phone: '',
        role: session?.user?.role || 'user',
        avatar: profile.avatar_url || '',
        bio: '',
        timezone: 'America/New_York',
        language: profile.preferences?.language || 'en',
      });
      
      // Update notification settings
      if (profile.notification_settings) {
        setNotifications({
          email: profile.notification_settings.email || true,
          push: profile.notification_settings.push || false,
          task_reminders: profile.notification_settings.task_reminders || true,
          deal_updates: profile.notification_settings.deal_updates || true,
          weekly_reports: profile.notification_settings.weekly_reports || true,
          marketing_emails: profile.notification_settings.marketing_emails || false,
          system_announcements: profile.notification_settings.system_announcements || true,
        });
      }
      
      // Update general settings
      if (profile.preferences) {
        setSettings({
          theme: profile.preferences.theme || 'system',
          compact_mode: profile.preferences.compact_mode || false,
          auto_save: true,
          show_kpi: true,
          default_view: profile.preferences.default_view || 'kanban',
          currency: profile.preferences.currency || 'USD',
          date_format: profile.preferences.date_format || 'MM/DD/YYYY',
        });
      }
    }
  }, [profile, session]);
  
  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await updatePreferences({
      full_name: formValues.name,
      language: formValues.language,
    });
    
    if (success) {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    }
  };
  
  // Handle notification toggle
  const handleNotificationToggle = async (key: keyof typeof notifications) => {
    const updatedNotifications = {
      ...notifications,
      [key]: !notifications[key],
    };
    
    setNotifications(updatedNotifications);
    
    const success = await updateNotificationSettings({
      [key]: !notifications[key]
    });
    
    if (success) {
      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been saved.",
      });
    }
  };
  
  // Handle settings change
  const handleSettingsChange = async (key: keyof typeof settings, value: any) => {
    const updatedSettings = {
      ...settings,
      [key]: value,
    };
    
    setSettings(updatedSettings);
    
    const success = await updatePreferences({
      [key]: value
    });
    
    if (success) {
      toast({
        title: "Settings updated",
        description: "Your settings have been saved.",
      });
    }
  };
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Handle mock features toggle
  const handleToggleMockFeatures = async () => {
    const success = await toggleMockFeatures();
    
    if (success) {
      toast({
        title: "Mock Features " + (isMockFeaturesEnabled ? "Disabled" : "Enabled"),
        description: "Your settings have been updated.",
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading settings...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load settings: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 p-2 md:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 md:w-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="developer">Developer</TabsTrigger>
        </TabsList>
        
        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and profile settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex flex-col items-center space-y-2">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={formValues.avatar} alt={formValues.name} />
                      <AvatarFallback className="text-2xl">{getInitials(formValues.name || 'User')}</AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="sm" type="button">
                      Change Avatar
                    </Button>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input 
                          id="name" 
                          value={formValues.name}
                          onChange={(e) => setFormValues({...formValues, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          value={formValues.email}
                          disabled
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input 
                          id="phone" 
                          value={formValues.phone}
                          onChange={(e) => setFormValues({...formValues, phone: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Input 
                          id="role" 
                          value={formValues.role}
                          disabled
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea 
                        id="bio" 
                        value={formValues.bio}
                        onChange={(e) => setFormValues({...formValues, bio: e.target.value})}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select 
                      value={formValues.timezone}
                      onValueChange={(value) => setFormValues({...formValues, timezone: value})}
                    >
                      <SelectTrigger id="timezone">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                        <SelectItem value="Europe/London">Greenwich Mean Time (GMT)</SelectItem>
                        <SelectItem value="Europe/Paris">Central European Time (CET)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select 
                      value={formValues.language}
                      onValueChange={(value) => setFormValues({...formValues, language: value})}
                    >
                      <SelectTrigger id="language">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleProfileUpdate}>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what notifications you receive and how they are delivered.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email.</p>
                    </div>
                    <Switch 
                      id="email-notifications" 
                      checked={notifications.email}
                      onCheckedChange={() => handleNotificationToggle('email')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push-notifications" className="font-medium">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications in your browser.</p>
                    </div>
                    <Switch 
                      id="push-notifications" 
                      checked={notifications.push}
                      onCheckedChange={() => handleNotificationToggle('push')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="task-reminders" className="font-medium">Task Reminders</Label>
                      <p className="text-sm text-muted-foreground">Get reminders about upcoming and overdue tasks.</p>
                    </div>
                    <Switch 
                      id="task-reminders" 
                      checked={notifications.task_reminders}
                      onCheckedChange={() => handleNotificationToggle('task_reminders')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="deal-updates" className="font-medium">Deal Updates</Label>
                      <p className="text-sm text-muted-foreground">Get notified when deals are updated or change status.</p>
                    </div>
                    <Switch 
                      id="deal-updates" 
                      checked={notifications.deal_updates}
                      onCheckedChange={() => handleNotificationToggle('deal_updates')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="weekly-reports" className="font-medium">Weekly Reports</Label>
                      <p className="text-sm text-muted-foreground">Receive weekly summary reports of your activity.</p>
                    </div>
                    <Switch 
                      id="weekly-reports" 
                      checked={notifications.weekly_reports}
                      onCheckedChange={() => handleNotificationToggle('weekly_reports')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="marketing-emails" className="font-medium">Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">Receive marketing and promotional emails.</p>
                    </div>
                    <Switch 
                      id="marketing-emails" 
                      checked={notifications.marketing_emails}
                      onCheckedChange={() => handleNotificationToggle('marketing_emails')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="system-announcements" className="font-medium">System Announcements</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications about system updates and maintenance.</p>
                    </div>
                    <Switch 
                      id="system-announcements" 
                      checked={notifications.system_announcements}
                      onCheckedChange={() => handleNotificationToggle('system_announcements')}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Customize your CRM experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Appearance</h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select 
                      value={settings.theme}
                      onValueChange={(value) => handleSettingsChange('theme', value)}
                    >
                      <SelectTrigger id="theme">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="compact-mode" className="font-medium">Compact Mode</Label>
                      <p className="text-sm text-muted-foreground">Use a more compact layout to fit more content on screen.</p>
                    </div>
                    <Switch 
                      id="compact-mode" 
                      checked={settings.compact_mode}
                      onCheckedChange={(value) => handleSettingsChange('compact_mode', value)}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Behavior</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-save" className="font-medium">Auto-Save</Label>
                      <p className="text-sm text-muted-foreground">Automatically save changes as you work.</p>
                    </div>
                    <Switch 
                      id="auto-save" 
                      checked={settings.auto_save}
                      onCheckedChange={(value) => handleSettingsChange('auto_save', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-kpi" className="font-medium">Show KPI Dashboard</Label>
                      <p className="text-sm text-muted-foreground">Show key performance indicators on the dashboard.</p>
                    </div>
                    <Switch 
                      id="show-kpi" 
                      checked={settings.show_kpi}
                      onCheckedChange={(value) => handleSettingsChange('show_kpi', value)}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Regional</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select 
                      value={settings.currency}
                      onValueChange={(value) => handleSettingsChange('currency', value)}
                    >
                      <SelectTrigger id="currency">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">US Dollar ($)</SelectItem>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                        <SelectItem value="GBP">British Pound (£)</SelectItem>
                        <SelectItem value="JPY">Japanese Yen (¥)</SelectItem>
                        <SelectItem value="CAD">Canadian Dollar (C$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="date-format">Date Format</Label>
                    <Select 
                      value={settings.date_format}
                      onValueChange={(value) => handleSettingsChange('date_format', value)}
                    >
                      <SelectTrigger id="date-format">
                        <SelectValue placeholder="Select date format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Developer Tab */}
        <TabsContent value="developer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Developer Settings</CardTitle>
              <CardDescription>
                Advanced settings for developers and testing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Feature Flags</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="mock-features" className="font-medium">Enable Mock Features</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable mock features and sample data for testing and demonstration purposes.
                      </p>
                    </div>
                    <Switch 
                      id="mock-features" 
                      checked={isMockFeaturesEnabled}
                      onCheckedChange={handleToggleMockFeatures}
                    />
                  </div>
                  
                  {isMockFeaturesEnabled && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Mock Features Enabled</AlertTitle>
                      <AlertDescription>
                        You are currently using mock features. Some functionality may be simulated.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 