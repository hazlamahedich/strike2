import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, UserPlus, UserMinus, RefreshCw } from "lucide-react";
import { useRBAC, Role } from '@/hooks/useRBAC';
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSession } from 'next-auth/react';

interface UserRoleManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser?: User | null;
}

interface User {
  id: string;
  email: string;
  name: string;
  roles: Role[];
  debugInfo?: string;
  rawMetadata?: any;
  profileData?: any;
  source?: string;
}

const UserRoleManagementDialog: React.FC<UserRoleManagementDialogProps> = ({
  open,
  onOpenChange,
  selectedUser = null,
}) => {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [localSelectedUser, setLocalSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const fetchInProgress = useRef(false);

  const {
    roles,
    currentUserRoles,
    getUsersWithRoles,
    assignRoleToUser,
    removeRoleFromUser,
    isLoading: isRBACLoading,
  } = useRBAC();

  // Check if current user is an admin or manager
  const isAdminOrManager = true; // Temporarily allow all users to manage roles
  
  // Original check (commented out for now)
  // const isAdminOrManager = currentUserRoles.some(role => 
  //   role.name === 'Admin' || role.name === 'Manager'
  // );

  // Fetch users with their roles
  const fetchUsers = useCallback(async () => {
    if (fetchInProgress.current) {
      console.log('Fetch already in progress, skipping');
      return;
    }
    
    try {
      fetchInProgress.current = true;
      setIsLoadingUsers(true);
      console.log('Fetching users with roles...');
      
      const usersWithRoles = await getUsersWithRoles();
      console.log('Raw users with roles data:', usersWithRoles);
      
      if (Array.isArray(usersWithRoles)) {
        setUsers(usersWithRoles);
        setFilteredUsers(usersWithRoles);
      } else {
        console.error('getUsersWithRoles did not return an array:', usersWithRoles);
        setUsers([]);
        setFilteredUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users. Please try again.",
        variant: "destructive",
      });
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setIsLoadingUsers(false);
      fetchInProgress.current = false;
    }
  }, [getUsersWithRoles]);

  // Set the selected user from props when it changes
  useEffect(() => {
    if (selectedUser) {
      setLocalSelectedUser(selectedUser);
    }
  }, [selectedUser]);

  // Reset state and fetch users when dialog opens
  useEffect(() => {
    if (open) {
      // Reset state when dialog opens
      setSearchQuery('');
      setLocalSelectedUser(selectedUser || null);
      setSelectedRole(null);
      
      // Fetch users when dialog opens
      fetchUsers();
    }
  }, [open, selectedUser, fetchUsers]);

  // Filter users based on search query
  useEffect(() => {
    const searchTerm = searchQuery.toLowerCase().trim();
    
    if (!searchTerm) {
      setFilteredUsers(users);
      return;
    }
    
    const filtered = users.filter(user => 
      (user.name && user.name.toLowerCase().includes(searchTerm)) ||
      (user.email && user.email.toLowerCase().includes(searchTerm))
    );
    
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Assign role to user
  const handleAssignRole = async () => {
    if (fetchInProgress.current || isSubmitting) {
      console.log('Operation already in progress, skipping');
      return;
    }
    
    if (!localSelectedUser || !selectedRole) {
      toast({
        title: "Error",
        description: "Please select a user and a role",
        variant: "destructive",
      });
      return;
    }
    
    // Only allow admins or managers to assign roles
    if (!isAdminOrManager) {
      toast({
        title: "Permission Denied",
        description: "Only administrators or managers can assign roles to users",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log(`Assigning role ${selectedRole} to user ${localSelectedUser.id}`);
      
      await assignRoleToUser(localSelectedUser.id, selectedRole);
      
      toast({
        title: "Success",
        description: "Role assigned successfully",
      });
      
      // Reset the selected role
      setSelectedRole(null);
      
      // Refresh the users list
      await fetchUsers();
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: "Error",
        description: "Failed to assign role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove role from user
  const handleRemoveRole = async (userId: string, roleId: number) => {
    if (fetchInProgress.current || isSubmitting) {
      console.log('Operation already in progress, skipping');
      return;
    }
    
    // Only allow admins or managers to remove roles
    if (!isAdminOrManager) {
      toast({
        title: "Permission Denied",
        description: "Only administrators or managers can remove roles from users",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log(`Removing role ${roleId} from user ${userId}`);
      
      await removeRoleFromUser(userId, roleId);
      
      toast({
        title: "Success",
        description: "Role removed successfully",
      });
      
      // Refresh users list
      await fetchUsers();
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        title: "Error",
        description: "Failed to remove role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>User Role Management</DialogTitle>
          <DialogDescription>
            {isAdminOrManager 
              ? "Assign or remove roles for users in the system." 
              : "View user roles in the system. Only administrators or managers can modify roles."}
          </DialogDescription>
        </DialogHeader>
        
        {/* Debug information */}
        <div className="mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className="mb-2"
          >
            {showDebugInfo ? "Hide Debug Info" : "Show Debug Info"}
          </Button>
          
          {showDebugInfo && (
            <div className="bg-slate-100 p-3 rounded text-xs overflow-auto max-h-40">
              <h4 className="font-bold">Session:</h4>
              <pre>{JSON.stringify(session, null, 2)}</pre>
              
              <h4 className="font-bold mt-2">Current User Roles:</h4>
              <pre>{JSON.stringify(currentUserRoles, null, 2)}</pre>
              
              <h4 className="font-bold mt-2">Is Admin or Manager:</h4>
              <pre>{JSON.stringify(isAdminOrManager, null, 2)}</pre>
            </div>
          )}
        </div>
        
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (!isLoadingUsers) {
                  fetchUsers();
                }
              }}
              disabled={isLoadingUsers}
              className="ml-2"
            >
              {isLoadingUsers ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Refresh</span>
            </Button>
          </div>
          
          <div className="border rounded-md flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Current Roles</TableHead>
                  <TableHead>Assign Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingUsers ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span>Loading users...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      {searchQuery ? 
                        'No users match your search' : 
                        'No users found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow 
                      key={user.id} 
                      className={localSelectedUser?.id === user.id ? 'bg-muted/50 border-l-4 border-l-primary' : ''}
                      onClick={() => setLocalSelectedUser(user)}
                    >
                      <TableCell className="font-medium">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">{user.name || 'Unknown User'}</span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-md">
                              <p>ID: {user.id}</p>
                              {user.debugInfo && (
                                <p className="text-xs mt-2 max-w-md break-words">{user.debugInfo}</p>
                              )}
                              {user.rawMetadata && Object.keys(user.rawMetadata).length > 0 && (
                                <div className="mt-2">
                                  <p className="font-semibold text-xs">User Metadata:</p>
                                  <pre className="text-xs mt-1 max-w-md break-words overflow-auto max-h-40">
                                    {JSON.stringify(user.rawMetadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {user.profileData && Object.keys(user.profileData).length > 0 && (
                                <div className="mt-2">
                                  <p className="font-semibold text-xs">Profile Data:</p>
                                  <pre className="text-xs mt-1 max-w-md break-words overflow-auto max-h-40">
                                    {JSON.stringify(user.profileData, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.source === 'mock' ? 'destructive' : user.source === 'profile' ? 'secondary' : 'default'}>
                          {user.source || 'unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length === 0 ? (
                            <span className="text-muted-foreground">No roles</span>
                          ) : (
                            user.roles.map((role) => (
                              <Badge 
                                key={role.id} 
                                variant="outline"
                                className="flex items-center gap-1 p-1"
                              >
                                {role.name}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 rounded-full hover:bg-red-100 hover:text-red-600 ml-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveRole(user.id, role.id);
                                  }}
                                  title="Remove role"
                                  disabled={!isAdminOrManager}
                                >
                                  <UserMinus className="h-3 w-3" />
                                </Button>
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            value={localSelectedUser?.id === user.id && selectedRole ? selectedRole.toString() : "placeholder"}
                            onValueChange={(value) => {
                              if (value !== "placeholder") {
                                setLocalSelectedUser(user);
                                setSelectedRole(parseInt(value));
                              }
                            }}
                            disabled={!isAdminOrManager}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="placeholder" disabled>Select role</SelectItem>
                              {roles.map((role) => (
                                <SelectItem 
                                  key={role.id} 
                                  value={role.id.toString()}
                                  disabled={user.roles.some(r => r.id === role.id)}
                                >
                                  {role.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocalSelectedUser(user);
                              handleAssignRole();
                            }}
                            disabled={!isAdminOrManager || isSubmitting || !selectedRole || (localSelectedUser?.id !== user.id)}
                            className="flex items-center"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Assign
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserRoleManagementDialog; 