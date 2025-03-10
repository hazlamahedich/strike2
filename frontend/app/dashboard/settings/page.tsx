'use client';

import { useState, useEffect } from 'react';
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
import { Loader2, AlertTriangle, Users, Settings, Sliders } from "lucide-react";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useMockData } from "@/hooks/useMockData";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { 
    profile, 
    isLoading, 
    error, 
    updatePreferences, 
    updateNotificationSettings,
  } = useUserSettings();
  
  const { isEnabled: isMockFeaturesEnabled, toggleMockData: toggleMockFeatures } = useMockData();
  
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
    theme: 'system',
    currency: 'USD',
    date_format: 'MM/DD/YYYY',
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

  // Application settings state
  const [settings, setSettings] = useState({
    compact_mode: false,
    default_view: 'kanban',
    enable_mock_features: true,
  });

  // Mock users for the user management tab
  const [users, setUsers] = useState([
    { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'Admin', status: 'Active' },
    { id: '2', name: 'Sales Rep', email: 'sales@example.com', role: 'Sales', status: 'Active' },
    { id: '3', name: 'Marketing User', email: 'marketing@example.com', role: 'Marketing', status: 'Inactive' },
  ]);

  // Load user data when profile is available
  useEffect(() => {
    if (profile && profile.preferences) {
      setFormValues({
        ...formValues,
        name: profile.preferences.full_name || '',
        email: session?.user?.email || '',
        theme: profile.preferences.theme || 'system',
        language: profile.preferences.language || 'en',
        currency: profile.preferences.currency || 'USD',
        date_format: profile.preferences.date_format || 'MM/DD/YYYY',
      });
      
      setSettings({
        compact_mode: profile.preferences.compact_mode || false,
        default_view: profile.preferences.default_view || 'kanban',
        enable_mock_features: isMockFeaturesEnabled,
      });
    }
    
    if (profile && profile.notification_settings) {
      setNotifications({
        ...notifications,
        ...profile.notification_settings,
      });
    }
  }, [profile, session, isMockFeaturesEnabled]);

  // Handle profile form submission
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updatePreferences({
        full_name: formValues.name,
        theme: formValues.theme as 'light' | 'dark' | 'system',
        language: formValues.language,
        currency: formValues.currency,
        date_format: formValues.date_format,
      });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
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
    
    try {
      await updateNotificationSettings({
        [key]: updatedNotifications[key],
      });
      
      toast({
        title: "Notifications updated",
        description: "Your notification preferences have been updated.",
      });
    } catch (error) {
      // Revert on error
      setNotifications(notifications);
      toast({
        title: "Error",
        description: "Failed to update notification settings.",
        variant: "destructive",
      });
    }
  };

  // Handle settings change
  const handleSettingsChange = async (key: string, value: any) => {
    const updatedSettings = {
      ...settings,
      [key]: value,
    };
    
    setSettings(updatedSettings);
    
    try {
      await updatePreferences({
        [key]: value,
      });
      
      toast({
        title: "Settings updated",
        description: "Your application settings have been updated.",
      });
    } catch (error) {
      // Revert on error
      setSettings(settings);
      toast({
        title: "Error",
        description: "Failed to update application settings.",
        variant: "destructive",
      });
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Handle mock features toggle
  const handleToggleMockFeatures = async () => {
    try {
      await toggleMockFeatures();
      // The state will be updated via the useEffect when isMockFeaturesEnabled changes
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle mock features.",
        variant: "destructive",
      });
    }
  };

  // Add new user (mock function)
  const handleAddUser = () => {
    toast({
      title: "Feature in development",
      description: "User management functionality is coming soon.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading settings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load settings. Please refresh the page or try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>
      
      <Tabs defaultValue="account" className="space-y-4">
        <TabsList>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Account</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>User Management</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Sliders className="h-4 w-4" />
            <span>Preferences</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Account Settings Tab */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account information and personal details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="flex flex-col items-center space-y-2">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={formValues.avatar} alt={formValues.name} />
                      <AvatarFallback className="text-lg">{getInitials(formValues.name)}</AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="sm">Change Avatar</Button>
                  </div>
                  
                  <div className="grid gap-4 flex-1">
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
                          onChange={(e) => setFormValues({...formValues, email: e.target.value})}
                          disabled
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
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
                          onChange={(e) => setFormValues({...formValues, role: e.target.value})}
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
                        placeholder="Tell us about yourself"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit">Save Changes</Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage how you receive notifications and updates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications for important updates.
                    </p>
                  </div>
                  <Switch 
                    id="email-notifications" 
                    checked={notifications.email}
                    onCheckedChange={() => handleNotificationToggle('email')}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-notifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications in your browser.
                    </p>
                  </div>
                  <Switch 
                    id="push-notifications" 
                    checked={notifications.push}
                    onCheckedChange={() => handleNotificationToggle('push')}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="task-reminders">Task Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminders for upcoming tasks and deadlines.
                    </p>
                  </div>
                  <Switch 
                    id="task-reminders" 
                    checked={notifications.task_reminders}
                    onCheckedChange={() => handleNotificationToggle('task_reminders')}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="deal-updates">Deal Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications when deals are updated.
                    </p>
                  </div>
                  <Switch 
                    id="deal-updates" 
                    checked={notifications.deal_updates}
                    onCheckedChange={() => handleNotificationToggle('deal_updates')}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="weekly-reports">Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive weekly summary reports of your activity.
                    </p>
                  </div>
                  <Switch 
                    id="weekly-reports" 
                    checked={notifications.weekly_reports}
                    onCheckedChange={() => handleNotificationToggle('weekly_reports')}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="marketing-emails">Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive marketing emails and product updates.
                    </p>
                  </div>
                  <Switch 
                    id="marketing-emails" 
                    checked={notifications.marketing_emails}
                    onCheckedChange={() => handleNotificationToggle('marketing_emails')}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="system-announcements">System Announcements</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive important system announcements and updates.
                    </p>
                  </div>
                  <Switch 
                    id="system-announcements" 
                    checked={notifications.system_announcements}
                    onCheckedChange={() => handleNotificationToggle('system_announcements')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage users and their access to the application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Button onClick={handleAddUser}>Add User</Button>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {users.length} users
              </p>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Role-Based Access Control</CardTitle>
              <CardDescription>
                Configure roles and permissions for users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTitle>Coming Soon</AlertTitle>
                <AlertDescription>
                  Role-based access control configuration will be available in a future update.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Application Preferences</CardTitle>
              <CardDescription>
                Customize your application experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select 
                      value={formValues.theme} 
                      onValueChange={(value) => {
                        setFormValues({...formValues, theme: value});
                        handleSettingsChange('theme', value);
                      }}
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select 
                      value={formValues.language} 
                      onValueChange={(value) => {
                        setFormValues({...formValues, language: value});
                        handleSettingsChange('language', value);
                      }}
                    >
                      <SelectTrigger id="language">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
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
                        <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="date-format">Date Format</Label>
                    <Select 
                      value={formValues.date_format} 
                      onValueChange={(value) => {
                        setFormValues({...formValues, date_format: value});
                        handleSettingsChange('date_format', value);
                      }}
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select 
                      value={formValues.currency} 
                      onValueChange={(value) => {
                        setFormValues({...formValues, currency: value});
                        handleSettingsChange('currency', value);
                      }}
                    >
                      <SelectTrigger id="currency">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">US Dollar ($)</SelectItem>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                        <SelectItem value="GBP">British Pound (£)</SelectItem>
                        <SelectItem value="JPY">Japanese Yen (¥)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="default-view">Default View</Label>
                    <Select 
                      value={settings.default_view} 
                      onValueChange={(value) => handleSettingsChange('default_view', value)}
                    >
                      <SelectTrigger id="default-view">
                        <SelectValue placeholder="Select default view" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kanban">Kanban</SelectItem>
                        <SelectItem value="list">List</SelectItem>
                        <SelectItem value="calendar">Calendar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="compact-mode">Compact Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Use a more compact layout for the application.
                    </p>
                  </div>
                  <Switch 
                    id="compact-mode" 
                    checked={settings.compact_mode}
                    onCheckedChange={(checked) => handleSettingsChange('compact_mode', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="mock-features">Enable Mock Features</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable mock features for demonstration purposes.
                    </p>
                  </div>
                  <Switch 
                    id="mock-features" 
                    checked={isMockFeaturesEnabled}
                    onCheckedChange={handleToggleMockFeatures}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Manage your data and export options.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline">Export All Data</Button>
                <Button variant="outline">Import Data</Button>
              </div>
              
              <Alert className="mt-4">
                <AlertTitle>Data Privacy</AlertTitle>
                <AlertDescription>
                  Your data is securely stored and processed according to our privacy policy.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}