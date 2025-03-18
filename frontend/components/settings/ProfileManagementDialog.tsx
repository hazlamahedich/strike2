import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Loader2, UserCog } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Role } from "@/hooks/useRBAC";

interface User {
  id: string;
  email: string;
  name: string;
  roles: Array<Role>;
  status: string;
  debugInfo?: string;
  rawMetadata?: any;
  profileData?: any;
  source?: string;
}

interface ProfileManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export default function ProfileManagementDialog({ open, onOpenChange, user }: ProfileManagementDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState({
    fullName: '',
    displayName: '',
    bio: '',
    jobTitle: '',
    department: '',
    location: '',
    phoneNumber: '',
    timezone: 'America/New_York',
    language: 'en',
    avatarUrl: '',
  });

  // Fetch all users when dialog opens and no specific user is provided
  useEffect(() => {
    if (open && !user) {
      fetchUsers();
    }
  }, [open, user]);

  // Initialize form with user data when a user is selected or provided
  useEffect(() => {
    if (open) {
      if (user) {
        setSelectedUserId(user.id);
        initializeFormWithUserData(user);
      } else if (selectedUserId) {
        fetchUserProfile(selectedUserId);
      }
    }
  }, [open, user, selectedUserId]);

  const fetchUsers = async () => {
    setIsFetchingUsers(true);
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setAllUsers(data.users || []);
      
      // If we have users and no selected user, select the first one
      if (data.users && data.users.length > 0 && !selectedUserId) {
        setSelectedUserId(data.users[0].id);
        fetchUserProfile(data.users[0].id);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsFetchingUsers(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/profile`);
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      
      const data = await response.json();
      const profile = data.profile;
      
      // Find the user in allUsers
      const userInfo = allUsers.find(u => u.id === userId) || user;
      
      if (userInfo) {
        initializeFormWithUserData(userInfo, profile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // If profile fetch fails, still initialize with basic user data
      const userInfo = allUsers.find(u => u.id === userId) || user;
      if (userInfo) {
        initializeFormWithUserData(userInfo);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const initializeFormWithUserData = (userInfo: User, profile?: any) => {
    setProfileData({
      fullName: userInfo.name || '',
      displayName: profile?.display_name || userInfo.profileData?.displayName || '',
      bio: profile?.bio || userInfo.profileData?.bio || '',
      jobTitle: profile?.job_title || userInfo.profileData?.jobTitle || '',
      department: profile?.department || userInfo.profileData?.department || '',
      location: profile?.location || userInfo.profileData?.location || '',
      phoneNumber: profile?.phone_number || userInfo.profileData?.phoneNumber || '',
      timezone: profile?.timezone || userInfo.profileData?.timezone || 'America/New_York',
      language: profile?.language || userInfo.profileData?.language || 'en',
      avatarUrl: profile?.avatar_url || userInfo.profileData?.avatarUrl || '',
    });
  };

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const targetUserId = selectedUserId || user?.id;
    if (!targetUserId) return;
    
    setIsLoading(true);
    
    try {
      // API call to update user profile
      const response = await fetch(`/api/admin/users/${targetUserId}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileData: {
            ...profileData,
            updatedAt: new Date().toISOString(),
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      toast({
        title: "Profile updated",
        description: "User profile has been updated successfully.",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const currentUser = user || allUsers.find(u => u.id === selectedUserId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage User Profile</DialogTitle>
          <DialogDescription>
            {user 
              ? `Update profile information for ${user.name}.`
              : 'Select a user and update their profile information.'
            }
          </DialogDescription>
        </DialogHeader>
        
        {!user && (
          <div className="mb-6">
            <Label htmlFor="user-select" className="mb-2 block">Select User</Label>
            {isFetchingUsers ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading users...</span>
              </div>
            ) : (
              <Select
                value={selectedUserId || ''}
                onValueChange={handleUserChange}
                disabled={isLoading}
              >
                <SelectTrigger id="user-select" className="w-full">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {allUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
        
        {isLoading && !currentUser ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading profile data...</span>
          </div>
        ) : currentUser ? (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="flex items-center space-x-4 mb-6">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profileData.avatarUrl} alt={profileData.fullName} />
                <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-medium">{currentUser.name}</h3>
                <p className="text-sm text-muted-foreground">{currentUser.email}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={profileData.fullName}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  value={profileData.displayName}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={profileData.bio}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  name="jobTitle"
                  value={profileData.jobTitle}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  name="department"
                  value={profileData.department}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={profileData.location}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  value={profileData.phoneNumber}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={profileData.timezone}
                  onValueChange={(value) => handleSelectChange('timezone', value)}
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
                    <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={profileData.language}
                  onValueChange={(value) => handleSelectChange('language', value)}
                >
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="avatarUrl">Avatar URL</Label>
              <Input
                id="avatarUrl"
                name="avatarUrl"
                value={profileData.avatarUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <UserCog className="mx-auto h-12 w-12 opacity-50 mb-4" />
            <p>No user selected or available.</p>
            <p className="text-sm">Please select a user to manage their profile.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 