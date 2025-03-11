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
import { Loader2, AlertTriangle, Users, Settings, Sliders, ShieldCheck, UserPlus, UserMinus, Search, Plus, Pencil, Trash2, Info, Lock, UserCog, CheckCircle, AlertCircle, Ban, MoreHorizontal, Copy } from "lucide-react";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useMockData } from "@/hooks/useMockData";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import RoleManagementDialog from "@/components/settings/RoleManagementDialog";
import PermissionManagementDialog from "@/components/settings/PermissionManagementDialog";
import UserRoleManagementDialog from "@/components/settings/UserRoleManagementDialog";
import ProfileManagementDialog from "@/components/settings/ProfileManagementDialog";
import UserPermissionsDialog from "@/components/settings/UserPermissionsDialog";
import AddUserDialog from "@/components/settings/AddUserDialog";
import { useRBAC } from "@/hooks/useRBAC";
import { Badge } from "@/components/ui/badge";
import { Role as RBACRole, Permission as RBACPermission, RoleWithPermissions } from "@/hooks/useRBAC";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShieldAlert } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import UserManagementTable from "@/components/settings/UserManagementTable";
import RoleManagementPanel from "@/components/settings/RoleManagementPanel";
import PermissionManagementPanel from "@/components/settings/PermissionManagementPanel";

// Define types for user management
interface User {
  id: string;
  email: string;
  name: string;
  roles: Array<RBACRole>;
  is_active?: boolean;
  status: string; // Derived from is_active, but required for UI
  debugInfo?: string;
  rawMetadata?: any;
  profileData?: any;
  source?: string;
}

// Define types for role management that match the RoleManagementPanel component
interface PanelRole {
  id: number;
  name: string;
  description: string;
  created_at?: string;
  updated_at?: string;
  permissions?: PanelPermission[];
}

interface PanelPermission {
  id: number;
  name: string;
  description: string;
  category: string;
}

// Default UUID to use as fallback if a non-UUID ID is encountered
const DEFAULT_UUID = "00000000-0000-0000-0000-000000000000";

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
  const { 
    userRoles, 
    fetchUserRolesAndPermissions, 
    currentUserRoles, 
    hasPermission, 
    permissions: allPermissions,
    roles: allRoles,
    fetchPermissions,
    fetchRoles,
    fetchRolesWithPermissions,
    createRole,
    deleteRole
  } = useRBAC();
  
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

  // User management state
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Dialog states
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [isUserRoleDialogOpen, setIsUserRoleDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isUserPermissionsDialogOpen, setIsUserPermissionsDialogOpen] = useState(false);
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false);
  
  // Active tab state
  const [activeTab, setActiveTab] = useState("users");

  // Application settings state
  const [settings, setSettings] = useState({
    compact_mode: false,
    default_view: 'kanban',
    enable_mock_features: true,
  });

  // New state for role management
  const [newRoleDialogOpen, setNewRoleDialogOpen] = useState(false);
  const [deleteRoleDialogOpen, setDeleteRoleDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<RBACRole | null>(null);
  const [newRoleData, setNewRoleData] = useState({ name: '', description: '' });

  // New state for the unified UI
  const [activeView, setActiveView] = useState<'user-details' | 'roles' | 'permissions' | 'profiles'>('user-details');
  const [searchTerm, setSearchTerm] = useState('');
  const [permissionSearchTerm, setPermissionSearchTerm] = useState('');
  const [permissionResourceFilter, setPermissionResourceFilter] = useState('all');
  const [selectedRole, setSelectedRole] = useState<RBACRole | null>(null);
  const [selectedPermission, setSelectedPermission] = useState<any>(null);
  const [showDeleteRoleConfirm, setShowDeleteRoleConfirm] = useState(false);
  const [showDeletePermissionConfirm, setShowDeletePermissionConfirm] = useState(false);
  const [selectedRoleToRemove, setSelectedRoleToRemove] = useState<RBACRole | null>(null);
  const [showRemoveRoleConfirm, setShowRemoveRoleConfirm] = useState(false);
  const [userPermissions, setUserPermissions] = useState<any[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [showDeleteUserConfirm, setShowDeleteUserConfirm] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Get unique resources for filtering permissions
  const uniqueResources = [...new Set(allPermissions?.map(p => p.resource) || [])].sort();

  // Filter permissions based on search and resource filter
  const filteredPermissions = allPermissions?.filter(permission => {
    const matchesSearch = permissionSearchTerm === '' || 
      permission.name.toLowerCase().includes(permissionSearchTerm.toLowerCase()) ||
      permission.resource.toLowerCase().includes(permissionSearchTerm.toLowerCase()) ||
      permission.action.toLowerCase().includes(permissionSearchTerm.toLowerCase());
    
    const matchesResource = permissionResourceFilter === 'all' || permission.resource === permissionResourceFilter;
    
    return matchesSearch && matchesResource;
  }) || [];

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

  // Fetch user roles and permissions
  useEffect(() => {
    if (session?.user?.id) {
      console.log('Session user ID in settings page:', session.user.id);
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(session.user.id)) {
        console.error('Invalid user ID format in session. Expected UUID, got:', session.user.id);
        console.warn('Using default UUID instead of invalid user ID');
        // Use default UUID instead of showing an error
        if (session.user) {
          session.user.id = DEFAULT_UUID;
        }
      }
      
      fetchUserRolesAndPermissions();
    }
  }, [session, fetchUserRolesAndPermissions]);

  // Load user data when profile is available
  useEffect(() => {
    if (profile) {
      fetchUsers();
    }
  }, [profile]);

  // Fetch roles and permissions when component mounts
  useEffect(() => {
    fetchRolesWithPermissions();
    fetchPermissions();
  }, [fetchRolesWithPermissions, fetchPermissions]);

  // Fetch users from the API
  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      setUserError(null);
      
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      
      // Map is_active to status if needed
      const processedUsers = data.map((user: any) => ({
        ...user,
        // Ensure status is always defined based on is_active
        status: user.status || (user.is_active === false ? 'inactive' : 'active')
      }));
      
      setUsers(processedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUserError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Fetch user permissions
  const fetchUserPermissions = async (userId: string) => {
    try {
      setIsLoadingPermissions(true);
      const response = await fetch(`/api/admin/users/${userId}/permissions`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user permissions');
      }
      
      const data = await response.json();
      setUserPermissions(data.permissions || []);
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user permissions. Please try again.",
        variant: "destructive",
      });
      setUserPermissions([]);
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  // Effect to fetch user permissions when a user is selected
  useEffect(() => {
    if (selectedUser && activeView === 'user-details') {
      fetchUserPermissions(selectedUser.id);
    }
  }, [selectedUser, activeView]);

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
    setIsAddUserDialogOpen(true);
  };

  // Check if user has admin role
  const isAdmin = currentUserRoles.some(role => role.name === 'Admin');

  // Handle adding a new role
  const handleAddRole = async () => {
    if (!newRoleData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Role name is required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await createRole({ name: newRoleData.name, description: newRoleData.description });
      
      toast({
        title: "Success",
        description: "Role created successfully",
      });
      
      // Reset form and close dialog
      setNewRoleData({ name: '', description: '' });
      setNewRoleDialogOpen(false);
      
      // Refresh roles
      fetchRolesWithPermissions();
    } catch (error) {
      console.error('Error creating role:', error);
      toast({
        title: "Error",
        description: "Failed to create role. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle deleting a role
  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    
    try {
      await deleteRole(roleToDelete.id);
      
      toast({
        title: "Success",
        description: "Role deleted successfully",
      });
      
      // Reset state and close dialog
      setRoleToDelete(null);
      setDeleteRoleDialogOpen(false);
      
      // Refresh roles
      fetchRolesWithPermissions();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: "Error",
        description: "Failed to delete role. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle user status change
  const handleUserStatusChange = async (userId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Error updating user status:', errorData);
        throw new Error(errorData?.error || 'Failed to update user status');
      }
      
      const result = await response.json();
      
      // Update the user in the local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status } : user
      ));
      
      // Update selected user if it's the one being modified
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, status });
      }
      
      toast({
        title: "Success",
        description: "User status updated successfully",
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user status. Please try again.",
        variant: "destructive",
      });
    }
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
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowDebug(!showDebug)}
        >
          {showDebug ? "Hide Debug" : "Show Debug"}
        </Button>
      </div>

      {showDebug && (
        <div className="bg-slate-100 p-4 rounded-md mb-4 overflow-auto max-h-60">
          <h2 className="text-lg font-semibold mb-2">Session Debug Info</h2>
          <pre className="text-xs">{JSON.stringify(session, null, 2)}</pre>
          <h2 className="text-lg font-semibold mt-4 mb-2">Current User Roles</h2>
          <pre className="text-xs">{JSON.stringify(currentUserRoles, null, 2)}</pre>
        </div>
      )}

      <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="space-y-4">
          <UserManagementTable 
            users={users}
            isLoading={isLoadingUsers}
            onAddUser={() => setIsAddUserDialogOpen(true)}
            onEditUser={(user) => {
              setSelectedUser(user);
              setIsProfileDialogOpen(true);
            }}
            onDeleteUser={async (user) => {
              try {
                const response = await fetch(`/api/admin/users/${user.id}`, {
                  method: 'DELETE',
                });
                
                if (!response.ok) {
                  throw new Error('Failed to delete user');
                }
                
                toast({
                  title: "User deleted",
                  description: `${user.name} has been deleted successfully.`,
                });
                
                fetchUsers();
              } catch (error) {
                console.error('Error deleting user:', error);
                toast({
                  title: "Error",
                  description: "Failed to delete user. Please try again.",
                  variant: "destructive",
                });
              }
            }}
            onManageRoles={(user) => {
              setSelectedUser(user);
              setIsUserRoleDialogOpen(true);
            }}
            onManagePermissions={(user) => {
              setSelectedUser(user);
              setIsUserPermissionsDialogOpen(true);
            }}
            onManageProfile={(user) => {
              setSelectedUser(user);
              setIsProfileDialogOpen(true);
            }}
            onStatusChange={async (userId, status) => {
              try {
                const response = await fetch(`/api/admin/users/${userId}/status`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ status }),
                });
                
                if (!response.ok) {
                  throw new Error('Failed to update user status');
                }
                
                fetchUsers();
                return Promise.resolve();
              } catch (error) {
                console.error('Error updating user status:', error);
                return Promise.reject(error);
              }
            }}
            onRefresh={fetchUsers}
          />
          
          {userError && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{userError}</AlertDescription>
            </Alert>
          )}
        </TabsContent>
        <TabsContent value="roles" className="space-y-4">
          <RoleManagementPanel 
            roles={allRoles.map((role: RBACRole | RoleWithPermissions) => ({
              id: role.id,
              name: role.name,
              description: role.description || '',
              created_at: role.created_at,
              updated_at: role.updated_at,
              permissions: 'permissions' in role 
                ? role.permissions.map((p: RBACPermission) => ({
                    id: p.id,
                    name: p.name,
                    description: p.description || '',
                    category: p.resource || 'General'
                  }))
                : []
            }))}
            permissions={allPermissions.map((permission: RBACPermission) => ({
              id: permission.id,
              name: permission.name,
              description: permission.description || '',
              category: permission.resource || 'General'
            }))}
            isLoading={isLoading}
            onAddRole={async (role) => {
              try {
                await createRole({ name: role.name, description: role.description });
                toast({
                  title: "Role created",
                  description: `Role "${role.name}" has been created successfully.`,
                });
                return Promise.resolve();
              } catch (error) {
                console.error('Error creating role:', error);
                toast({
                  title: "Error",
                  description: "Failed to create role. Please try again.",
                  variant: "destructive",
                });
                return Promise.reject(error);
              }
            }}
            onUpdateRole={async (role) => {
              try {
                // Implement role update API call
                const response = await fetch(`/api/admin/roles/${role.id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ 
                    name: role.name, 
                    description: role.description 
                  }),
                });
                
                if (!response.ok) {
                  throw new Error('Failed to update role');
                }
                
                toast({
                  title: "Role updated",
                  description: `Role "${role.name}" has been updated successfully.`,
                });
                
                fetchRolesWithPermissions();
                return Promise.resolve();
              } catch (error) {
                console.error('Error updating role:', error);
                toast({
                  title: "Error",
                  description: "Failed to update role. Please try again.",
                  variant: "destructive",
                });
                return Promise.reject(error);
              }
            }}
            onDeleteRole={async (roleId) => {
              try {
                await deleteRole(roleId);
                toast({
                  title: "Role deleted",
                  description: "Role has been deleted successfully.",
                });
                return Promise.resolve();
              } catch (error) {
                console.error('Error deleting role:', error);
                toast({
                  title: "Error",
                  description: "Failed to delete role. Please try again.",
                  variant: "destructive",
                });
                return Promise.reject(error);
              }
            }}
            onUpdateRolePermissions={async (roleId, permissionIds) => {
              try {
                // Implement role permissions update API call
                const response = await fetch(`/api/admin/roles/${roleId}/permissions`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ permissions: permissionIds }),
                });
                
                if (!response.ok) {
                  throw new Error('Failed to update role permissions');
                }
                
                toast({
                  title: "Permissions updated",
                  description: "Role permissions have been updated successfully.",
                });
                
                fetchRolesWithPermissions();
                return Promise.resolve();
              } catch (error) {
                console.error('Error updating role permissions:', error);
                toast({
                  title: "Error",
                  description: "Failed to update role permissions. Please try again.",
                  variant: "destructive",
                });
                return Promise.reject(error);
              }
            }}
            onRefresh={fetchRolesWithPermissions}
          />
        </TabsContent>
        <TabsContent value="permissions" className="space-y-4">
          <PermissionManagementPanel 
            permissions={allPermissions.map((permission: RBACPermission) => ({
              id: permission.id,
              name: permission.name,
              description: permission.description || '',
              category: permission.resource || 'General'
            }))}
            categories={Array.from(new Set(allPermissions.map(p => p.resource || 'General')))}
            isLoading={isLoading}
            onAddPermission={async (permission) => {
              try {
                // Implement permission creation API call
                const response = await fetch('/api/admin/permissions', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    name: permission.name,
                    description: permission.description,
                    resource: permission.category,
                    action: 'access' // Default action
                  }),
                });
                
                if (!response.ok) {
                  throw new Error('Failed to create permission');
                }
                
                toast({
                  title: "Permission created",
                  description: `Permission "${permission.name}" has been created successfully.`,
                });
                
                fetchPermissions();
                return Promise.resolve();
              } catch (error) {
                console.error('Error creating permission:', error);
                toast({
                  title: "Error",
                  description: "Failed to create permission. Please try again.",
                  variant: "destructive",
                });
                return Promise.reject(error);
              }
            }}
            onUpdatePermission={async (permission) => {
              try {
                // Implement permission update API call
                const response = await fetch(`/api/admin/permissions/${permission.id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    name: permission.name,
                    description: permission.description,
                    resource: permission.category
                  }),
                });
                
                if (!response.ok) {
                  throw new Error('Failed to update permission');
                }
                
                toast({
                  title: "Permission updated",
                  description: `Permission "${permission.name}" has been updated successfully.`,
                });
                
                fetchPermissions();
                return Promise.resolve();
              } catch (error) {
                console.error('Error updating permission:', error);
                toast({
                  title: "Error",
                  description: "Failed to update permission. Please try again.",
                  variant: "destructive",
                });
                return Promise.reject(error);
              }
            }}
            onDeletePermission={async (permissionId) => {
              try {
                // Implement permission deletion API call
                const response = await fetch(`/api/admin/permissions/${permissionId}`, {
                  method: 'DELETE',
                });
                
                if (!response.ok) {
                  throw new Error('Failed to delete permission');
                }
                
                toast({
                  title: "Permission deleted",
                  description: "Permission has been deleted successfully.",
                });
                
                fetchPermissions();
                return Promise.resolve();
              } catch (error) {
                console.error('Error deleting permission:', error);
                toast({
                  title: "Error",
                  description: "Failed to delete permission. Please try again.",
                  variant: "destructive",
                });
                return Promise.reject(error);
              }
            }}
            onRefresh={fetchPermissions}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddUserDialog 
        open={isAddUserDialogOpen} 
        onOpenChange={setIsAddUserDialogOpen} 
        onSuccess={fetchUsers}
      />
      
      <RoleManagementDialog 
        open={isRoleDialogOpen} 
        onOpenChange={setIsRoleDialogOpen}
      />
      
      <PermissionManagementDialog 
        open={isPermissionDialogOpen} 
        onOpenChange={setIsPermissionDialogOpen}
      />
      
      <UserRoleManagementDialog 
        open={isUserRoleDialogOpen} 
        onOpenChange={setIsUserRoleDialogOpen}
        selectedUser={selectedUser}
      />
      
      <ProfileManagementDialog 
        open={isProfileDialogOpen} 
        onOpenChange={setIsProfileDialogOpen}
        user={selectedUser}
      />
      
      <UserPermissionsDialog 
        open={isUserPermissionsDialogOpen} 
        onOpenChange={setIsUserPermissionsDialogOpen}
        user={selectedUser}
      />
    </div>
  );
}