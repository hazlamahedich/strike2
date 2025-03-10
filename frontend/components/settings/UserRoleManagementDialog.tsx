import React, { useState, useEffect } from 'react';
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

interface UserRoleManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface User {
  id: string;
  email: string;
  roles: Role[];
}

const UserRoleManagementDialog: React.FC<UserRoleManagementDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { 
    roles, 
    isLoading, 
    assignRoleToUser, 
    removeRoleFromUser, 
    getUsersWithRoles 
  } = useRBAC();
  
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Fetch users when dialog opens
  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  // Filtered users based on search term
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch users with their roles
  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      console.log('Fetching users with roles...');
      
      const usersWithRoles = await getUsersWithRoles();
      
      // Check if we got a valid response
      if (Array.isArray(usersWithRoles)) {
        console.log('Successfully fetched users with roles:', usersWithRoles);
        
        // Filter out any null values and ensure the type matches User[]
        const validUsers: User[] = [];
        
        for (const user of usersWithRoles) {
          if (user && typeof user === 'object' && 'id' in user && 'email' in user) {
            validUsers.push({
              id: user.id as string,
              email: user.email as string,
              roles: Array.isArray(user.roles) ? user.roles : []
            });
          }
        }
        
        setUsers(validUsers);
        
        // If we have a selected user, update their data
        if (selectedUser) {
          const updatedUser = validUsers.find(user => user.id === selectedUser.id);
          if (updatedUser) {
            setSelectedUser(updatedUser);
          }
        }
      } else {
        // Handle case where getUsersWithRoles returns empty or invalid data
        console.error('Invalid response from getUsersWithRoles');
        toast({
          title: "Warning",
          description: "Could not retrieve user roles. Some data may be missing.",
          variant: "destructive",
        });
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users with roles:', error);
      toast({
        title: "Error",
        description: typeof error === 'string' ? error : "Failed to fetch users with roles",
        variant: "destructive",
      });
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Assign role to user
  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) {
      toast({
        title: "Error",
        description: "Please select a user and a role",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await assignRoleToUser(selectedUser.id, selectedRole);
      
      // Refresh users list
      await fetchUsers();
      
      toast({
        title: "Success",
        description: "Role assigned successfully",
      });
      
      // Reset selection
      setSelectedRole(null);
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: "Error",
        description: "Failed to assign role",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove role from user
  const handleRemoveRole = async (userId: string, roleId: number) => {
    try {
      setIsSubmitting(true);
      await removeRoleFromUser(userId, roleId);
      
      // Refresh users list
      await fetchUsers();
      
      toast({
        title: "Success",
        description: "Role removed successfully",
      });
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        title: "Error",
        description: "Failed to remove role",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage User Roles</DialogTitle>
          <DialogDescription>
            Assign or remove roles from users to control their access levels.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={fetchUsers}
              disabled={isLoadingUsers}
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingUsers ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <div className="border rounded-md flex-1 overflow-y-auto min-h-[300px]">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingUsers ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span>Loading users...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      {searchTerm ? 
                        'No users match your search' : 
                        'No users found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow 
                      key={user.id} 
                      className={selectedUser?.id === user.id ? 'bg-muted/50' : ''}
                      onClick={() => setSelectedUser(user)}
                    >
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length === 0 ? (
                            <span className="text-muted-foreground">No roles</span>
                          ) : (
                            user.roles.map((role) => (
                              <Badge 
                                key={role.id} 
                                variant="outline"
                                className="flex items-center gap-1"
                              >
                                {role.name}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-4 w-4 rounded-full"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveRole(user.id, role.id);
                                  }}
                                  disabled={isSubmitting}
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
                            value={selectedUser?.id === user.id ? selectedRole?.toString() || '' : ''}
                            onValueChange={(value) => {
                              setSelectedUser(user);
                              setSelectedRole(parseInt(value));
                            }}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
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
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              handleAssignRole();
                            }}
                            disabled={isSubmitting || selectedUser?.id !== user.id || !selectedRole}
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