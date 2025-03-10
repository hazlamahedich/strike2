'use client';

import { useState } from 'react';
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

export default function SettingsPage() {
  // User profile state
  const [profile, setProfile] = useState({
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    phone: '+1 (555) 123-4567',
    role: 'Sales Manager',
    avatar: '',
    bio: 'Sales professional with 8+ years of experience in SaaS and enterprise solutions.',
    timezone: 'America/New_York',
    language: 'en',
  });
  
  // Notification preferences state
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    taskReminders: true,
    dealUpdates: true,
    weeklyReports: true,
    marketingEmails: false,
    systemAnnouncements: true,
  });
  
  // General settings state
  const [settings, setSettings] = useState({
    theme: 'system',
    compactMode: false,
    autoSave: true,
    showKPI: true,
    defaultView: 'kanban',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
  });
  
  // Handle profile update
  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully.",
    });
  };
  
  // Handle notification toggle
  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications({
      ...notifications,
      [key]: !notifications[key],
    });
    
    toast({
      title: "Preferences updated",
      description: "Your notification preferences have been saved.",
    });
  };
  
  // Handle settings change
  const handleSettingsChange = (key: keyof typeof settings, value: any) => {
    setSettings({
      ...settings,
      [key]: value,
    });
    
    toast({
      title: "Settings updated",
      description: "Your settings have been saved.",
    });
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
  
  return (
    <div className="space-y-6 p-2 md:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
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
                      <AvatarImage src={profile.avatar} alt={profile.name} />
                      <AvatarFallback className="text-2xl">{getInitials(profile.name)}</AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="sm">
                      Change Avatar
                    </Button>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input 
                          id="name" 
                          value={profile.name}
                          onChange={(e) => setProfile({...profile, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          value={profile.email}
                          onChange={(e) => setProfile({...profile, email: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input 
                          id="phone" 
                          value={profile.phone}
                          onChange={(e) => setProfile({...profile, phone: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Input 
                          id="role" 
                          value={profile.role}
                          onChange={(e) => setProfile({...profile, role: e.target.value})}
                          disabled
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea 
                        id="bio" 
                        value={profile.bio}
                        onChange={(e) => setProfile({...profile, bio: e.target.value})}
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
                      value={profile.timezone}
                      onValueChange={(value) => setProfile({...profile, timezone: value})}
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
                      value={profile.language}
                      onValueChange={(value) => setProfile({...profile, language: value})}
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
          
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Manage your password and security settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Enable Two-Factor Auth</Button>
              <Button>Update Password</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how and when you want to be notified.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Communication</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive email notifications for important updates.</p>
                    </div>
                    <Switch 
                      id="email-notifications" 
                      checked={notifications.emailNotifications}
                      onCheckedChange={() => handleNotificationToggle('emailNotifications')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push-notifications" className="font-medium">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive push notifications in your browser.</p>
                    </div>
                    <Switch 
                      id="push-notifications" 
                      checked={notifications.pushNotifications}
                      onCheckedChange={() => handleNotificationToggle('pushNotifications')}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Activity Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="task-reminders" className="font-medium">Task Reminders</Label>
                      <p className="text-sm text-muted-foreground">Get notified about upcoming and overdue tasks.</p>
                    </div>
                    <Switch 
                      id="task-reminders" 
                      checked={notifications.taskReminders}
                      onCheckedChange={() => handleNotificationToggle('taskReminders')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="deal-updates" className="font-medium">Deal Updates</Label>
                      <p className="text-sm text-muted-foreground">Get notified when deals are updated or change stages.</p>
                    </div>
                    <Switch 
                      id="deal-updates" 
                      checked={notifications.dealUpdates}
                      onCheckedChange={() => handleNotificationToggle('dealUpdates')}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Other Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="weekly-reports" className="font-medium">Weekly Reports</Label>
                      <p className="text-sm text-muted-foreground">Receive weekly performance and activity reports.</p>
                    </div>
                    <Switch 
                      id="weekly-reports" 
                      checked={notifications.weeklyReports}
                      onCheckedChange={() => handleNotificationToggle('weeklyReports')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="marketing-emails" className="font-medium">Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">Receive marketing emails about new features and offers.</p>
                    </div>
                    <Switch 
                      id="marketing-emails" 
                      checked={notifications.marketingEmails}
                      onCheckedChange={() => handleNotificationToggle('marketingEmails')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="system-announcements" className="font-medium">System Announcements</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications about system updates and maintenance.</p>
                    </div>
                    <Switch 
                      id="system-announcements" 
                      checked={notifications.systemAnnouncements}
                      onCheckedChange={() => handleNotificationToggle('systemAnnouncements')}
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
                      checked={settings.compactMode}
                      onCheckedChange={(value) => handleSettingsChange('compactMode', value)}
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
                      checked={settings.autoSave}
                      onCheckedChange={(value) => handleSettingsChange('autoSave', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-kpi" className="font-medium">Show KPI Dashboard</Label>
                      <p className="text-sm text-muted-foreground">Show key performance indicators on the dashboard.</p>
                    </div>
                    <Switch 
                      id="show-kpi" 
                      checked={settings.showKPI}
                      onCheckedChange={(value) => handleSettingsChange('showKPI', value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="default-view">Default Deal View</Label>
                    <Select 
                      value={settings.defaultView}
                      onValueChange={(value) => handleSettingsChange('defaultView', value)}
                    >
                      <SelectTrigger id="default-view">
                        <SelectValue placeholder="Select default view" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kanban">Kanban</SelectItem>
                        <SelectItem value="list">List</SelectItem>
                        <SelectItem value="table">Table</SelectItem>
                      </SelectContent>
                    </Select>
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
                      value={settings.dateFormat}
                      onValueChange={(value) => handleSettingsChange('dateFormat', value)}
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
            <CardFooter className="flex justify-between">
              <Button variant="outline">Reset to Defaults</Button>
              <Button>Save Settings</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Manage your data and export options.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Export Data</h3>
                <p className="text-sm text-muted-foreground">
                  Export your CRM data for backup or analysis.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline">Export Contacts</Button>
                <Button variant="outline">Export Deals</Button>
                <Button variant="outline">Export Tasks</Button>
                <Button variant="outline">Full Data Export</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 