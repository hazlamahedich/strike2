import React, { useState } from 'react';
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Search, 
  UserPlus, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  ShieldCheck, 
  UserCog, 
  CheckCircle, 
  AlertCircle, 
  Ban 
} from "lucide-react";
import { Role } from "@/hooks/useRBAC";
import { toast } from "@/components/ui/use-toast";

interface User {
  id: string;
  email: string;
  name: string;
  roles: Array<Role>;
  is_active?: boolean;
  status: string;
  deactivated_at?: string;
  scheduled_archive_date?: string;
  debugInfo?: string;
  rawMetadata?: any;
  profileData?: any;
  source?: string;
}

interface UserManagementTableProps {
  users: User[];
  isLoading: boolean;
  onAddUser: () => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
  onManageRoles: (user: User) => void;
  onManagePermissions: (user: User) => void;
  onManageProfile: (user: User) => void;
  onStatusChange: (userId: string, status: string) => Promise<void>;
  onRefresh: () => void;
}

export default function UserManagementTable({
  users,
  isLoading,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onManageRoles,
  onManagePermissions,
  onManageProfile,
  onStatusChange,
  onRefresh
}: UserManagementTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.roles.some(role => role.name?.toLowerCase().includes(searchLower))
    );
  });

  // Handle user deletion
  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    try {
      await onDeleteUser(userToDelete);
      toast({
        title: "User deleted",
        description: `${userToDelete.name} has been deleted successfully.`,
      });
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">{status}</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">{status}</Badge>;
      case 'deactivated':
        return <Badge variant="destructive">{status}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Handle status change
  const handleStatusChange = async (user: User, newStatus: string) => {
    try {
      await onStatusChange(user.id, newStatus);
      toast({
        title: "Status updated",
        description: `${user.name}'s status has been updated to ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={onAddUser} className="ml-auto">
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">Loading users...</div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  {searchQuery ? (
                    <div className="text-sm text-gray-500">No users found matching "{searchQuery}"</div>
                  ) : (
                    <div className="text-sm text-gray-500">No users available</div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.profileData?.avatarUrl || ''} alt={user.name} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-gray-500">ID: {user.id.substring(0, 8)}...</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role.id} variant="outline" className="text-xs">
                          {role.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {user.status === 'active' && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Active
                        </Badge>
                      )}
                      {user.status === 'inactive' && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                      {user.status === 'deactivated' && (
                        <div className="space-y-1">
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <Ban className="mr-1 h-3 w-3" />
                            Deactivated
                          </Badge>
                          {user.deactivated_at && (
                            <div className="text-xs text-gray-500">
                              Deactivated on {new Date(user.deactivated_at).toLocaleDateString()}
                            </div>
                          )}
                          {user.scheduled_archive_date && (
                            <div className="text-xs text-gray-500">
                              Scheduled for archival on {new Date(user.scheduled_archive_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onEditUser(user)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onManageProfile(user)}>
                          <UserCog className="mr-2 h-4 w-4" />
                          Manage Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onManageRoles(user)}>
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Manage Roles
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onManagePermissions(user)}>
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Manage Permissions
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Status</DropdownMenuLabel>
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(user, 'active')}
                          disabled={user.status === 'active'}
                        >
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                          Set Active
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(user, 'inactive')}
                          disabled={user.status === 'inactive'}
                        >
                          <AlertCircle className="mr-2 h-4 w-4 text-yellow-500" />
                          Set Inactive
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(user, 'deactivated')}
                          disabled={user.status === 'deactivated'}
                        >
                          <Ban className="mr-2 h-4 w-4 text-red-500" />
                          Deactivate
                          <span className="ml-2 text-xs text-gray-500">(Removes all permissions)</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setUserToDelete(user)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {userToDelete?.name}'s account and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                'Delete User'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 