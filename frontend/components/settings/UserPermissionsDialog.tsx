import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Info, ShieldAlert } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Role } from "@/hooks/useRBAC";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

interface Permission {
  id: number;
  name: string;
  description: string;
  category: string;
}

interface UserPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export default function UserPermissionsDialog({ open, onOpenChange, user }: UserPermissionsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [userPermissions, setUserPermissions] = useState<number[]>([]);
  const [rolePermissions, setRolePermissions] = useState<number[]>([]);
  
  // Fetch all users when dialog opens and no specific user is provided
  useEffect(() => {
    if (open && !user) {
      fetchUsers();
    }
  }, [open, user]);
  
  // Fetch permissions when dialog opens or user changes
  useEffect(() => {
    if (open) {
      if (user) {
        setSelectedUserId(user.id);
        fetchPermissions(user.id);
      } else if (selectedUserId) {
        fetchPermissions(selectedUserId);
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
        fetchPermissions(data.users[0].id);
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
  
  const fetchPermissions = async (userId: string) => {
    if (!userId) return;
    
    setIsFetching(true);
    
    try {
      // Fetch all available permissions
      const allPermsResponse = await fetch('/api/admin/permissions');
      if (!allPermsResponse.ok) {
        throw new Error('Failed to fetch permissions');
      }
      const allPermsData = await allPermsResponse.json();
      setAllPermissions(allPermsData.permissions || []);
      
      // Fetch user's direct permissions
      const userPermsResponse = await fetch(`/api/admin/users/${userId}/permissions`);
      if (!userPermsResponse.ok) {
        throw new Error('Failed to fetch user permissions');
      }
      const userPermsData = await userPermsResponse.json();
      setUserPermissions(userPermsData.permissions?.map((p: any) => p.id) || []);
      
      // Fetch permissions from user's roles
      const rolePermsResponse = await fetch(`/api/admin/users/${userId}/role-permissions`);
      if (!rolePermsResponse.ok) {
        throw new Error('Failed to fetch role permissions');
      }
      const rolePermsData = await rolePermsResponse.json();
      setRolePermissions(rolePermsData.permissions?.map((p: any) => p.id) || []);
      
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch permissions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };
  
  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
  };
  
  const handlePermissionToggle = (permissionId: number) => {
    setUserPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const targetUserId = selectedUserId || user?.id;
    if (!targetUserId) return;
    
    setIsLoading(true);
    
    try {
      // API call to update user permissions
      const response = await fetch(`/api/admin/users/${targetUserId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permissions: userPermissions,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update permissions');
      }
      
      toast({
        title: "Permissions updated",
        description: "User permissions have been updated successfully.",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast({
        title: "Error",
        description: "Failed to update permissions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Group permissions by category
  const permissionsByCategory = allPermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);
  
  const currentUser = user || allUsers.find(u => u.id === selectedUserId);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Manage User Permissions</DialogTitle>
          <DialogDescription>
            {user 
              ? `Configure specific permissions for ${user.name}.`
              : 'Select a user and configure their specific permissions.'
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
                disabled={isLoading || isFetching}
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
        
        {currentUser && (
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-medium">{currentUser.name}</h3>
              <span className="text-sm text-muted-foreground">({currentUser.email})</span>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-sm font-medium">Roles:</span>
              {currentUser.roles && currentUser.roles.length > 0 ? (
                currentUser.roles.map(role => (
                  <Badge key={role.id} variant="outline">
                    {role.name}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No roles assigned</span>
              )}
            </div>
          </div>
        )}
        
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>About User Permissions</AlertTitle>
          <AlertDescription>
            Users inherit permissions from their roles. You can grant additional permissions here that will override role-based permissions.
            Permissions granted directly to a user take precedence over role permissions.
          </AlertDescription>
        </Alert>
        
        {isFetching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading permissions...</span>
          </div>
        ) : currentUser && allPermissions.length > 0 ? (
          <form onSubmit={handleSubmit}>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                  <div key={category} className="space-y-3">
                    <h4 className="text-sm font-medium uppercase tracking-wide">{category}</h4>
                    <Separator />
                    
                    <div className="space-y-2">
                      {permissions.map(permission => {
                        const isInherited = rolePermissions.includes(permission.id);
                        const isDirectlyAssigned = userPermissions.includes(permission.id);
                        
                        return (
                          <div key={permission.id} className="flex items-start space-x-2 py-1">
                            <Checkbox
                              id={`permission-${permission.id}`}
                              checked={isDirectlyAssigned}
                              onCheckedChange={() => handlePermissionToggle(permission.id)}
                              disabled={isInherited} // Disable checkbox if permission is inherited from role
                            />
                            <div className="grid gap-1.5 leading-none">
                              <div className="flex items-center">
                                <Label
                                  htmlFor={`permission-${permission.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {permission.name}
                                </Label>
                                {isInherited && (
                                  <Badge variant="secondary" className="ml-2 text-xs">
                                    Inherited from role
                                  </Badge>
                                )}
                              </div>
                              {permission.description && (
                                <p className="text-xs text-muted-foreground">
                                  {permission.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Permissions
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <ShieldAlert className="mx-auto h-12 w-12 opacity-50 mb-4" />
            <p>No user selected or permissions available.</p>
            <p className="text-sm">Please select a user to manage their permissions.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 