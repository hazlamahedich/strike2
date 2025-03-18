import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, ShieldCheck, Search } from "lucide-react";

interface Role {
  id: number;
  name: string;
  description: string;
  created_at?: string;
  updated_at?: string;
  permissions?: Permission[];
}

interface Permission {
  id: number;
  name: string;
  description: string;
  category: string;
}

interface RoleManagementPanelProps {
  roles: Role[];
  permissions: Permission[];
  isLoading: boolean;
  onAddRole: (role: Omit<Role, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdateRole: (role: Role) => Promise<void>;
  onDeleteRole: (roleId: number) => Promise<void>;
  onUpdateRolePermissions: (roleId: number, permissionIds: number[]) => Promise<void>;
  onRefresh: () => void;
}

export default function RoleManagementPanel({
  roles,
  permissions,
  isLoading,
  onAddRole,
  onUpdateRole,
  onDeleteRole,
  onUpdateRolePermissions,
  onRefresh
}: RoleManagementPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false);
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [newRole, setNewRole] = useState<Omit<Role, 'id' | 'created_at' | 'updated_at'>>({
    name: '',
    description: '',
  });
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [permissionSearchQuery, setPermissionSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter roles based on search query
  const filteredRoles = roles.filter(role => {
    const searchLower = searchQuery.toLowerCase();
    return (
      role.name.toLowerCase().includes(searchLower) ||
      role.description.toLowerCase().includes(searchLower)
    );
  });

  // Filter permissions based on search query
  const filteredPermissions = permissions.filter(permission => {
    const searchLower = permissionSearchQuery.toLowerCase();
    return (
      permission.name.toLowerCase().includes(searchLower) ||
      permission.description.toLowerCase().includes(searchLower) ||
      permission.category.toLowerCase().includes(searchLower)
    );
  });

  // Group permissions by category
  const permissionsByCategory = filteredPermissions.reduce((acc, permission) => {
    const category = permission.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Handle adding a new role
  const handleAddRole = async () => {
    if (!newRole.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Role name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddRole(newRole);
      toast({
        title: "Role Added",
        description: `Role "${newRole.name}" has been added successfully.`,
      });
      setNewRole({ name: '', description: '' });
      setIsAddRoleDialogOpen(false);
      onRefresh();
    } catch (error) {
      console.error('Error adding role:', error);
      toast({
        title: "Error",
        description: "Failed to add role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle updating a role
  const handleUpdateRole = async () => {
    if (!selectedRole) return;
    if (!selectedRole.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Role name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdateRole(selectedRole);
      toast({
        title: "Role Updated",
        description: `Role "${selectedRole.name}" has been updated successfully.`,
      });
      setIsEditRoleDialogOpen(false);
      onRefresh();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deleting a role
  const handleDeleteRole = async () => {
    if (!selectedRole) return;

    setIsSubmitting(true);
    try {
      await onDeleteRole(selectedRole.id);
      toast({
        title: "Role Deleted",
        description: `Role "${selectedRole.name}" has been deleted successfully.`,
      });
      setIsDeleteDialogOpen(false);
      setSelectedRole(null);
      onRefresh();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: "Error",
        description: "Failed to delete role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle updating role permissions
  const handleUpdateRolePermissions = async () => {
    if (!selectedRole) return;

    setIsSubmitting(true);
    try {
      await onUpdateRolePermissions(selectedRole.id, selectedPermissions);
      toast({
        title: "Permissions Updated",
        description: `Permissions for role "${selectedRole.name}" have been updated successfully.`,
      });
      setIsPermissionsDialogOpen(false);
      onRefresh();
    } catch (error) {
      console.error('Error updating role permissions:', error);
      toast({
        title: "Error",
        description: "Failed to update role permissions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open edit role dialog
  const openEditRoleDialog = (role: Role) => {
    setSelectedRole(role);
    setIsEditRoleDialogOpen(true);
  };

  // Open delete role dialog
  const openDeleteRoleDialog = (role: Role) => {
    setSelectedRole(role);
    setIsDeleteDialogOpen(true);
  };

  // Open permissions dialog
  const openPermissionsDialog = (role: Role) => {
    setSelectedRole(role);
    setSelectedPermissions(role.permissions?.map(p => p.id) || []);
    setIsPermissionsDialogOpen(true);
  };

  // Toggle permission selection
  const togglePermission = (permissionId: number) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  // Toggle all permissions in a category
  const toggleCategoryPermissions = (categoryPermissions: Permission[], isSelected: boolean) => {
    const categoryPermissionIds = categoryPermissions.map(p => p.id);
    
    if (isSelected) {
      // Remove all permissions in this category
      setSelectedPermissions(prev => 
        prev.filter(id => !categoryPermissionIds.includes(id))
      );
    } else {
      // Add all permissions in this category
      setSelectedPermissions(prev => {
        const newPermissions = [...prev];
        categoryPermissionIds.forEach(id => {
          if (!newPermissions.includes(id)) {
            newPermissions.push(id);
          }
        });
        return newPermissions;
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
            placeholder="Search roles..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsAddRoleDialogOpen(true)} className="ml-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Role
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">Loading roles...</div>
                </TableCell>
              </TableRow>
            ) : filteredRoles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  {searchQuery ? (
                    <div className="text-sm text-gray-500">No roles found matching "{searchQuery}"</div>
                  ) : (
                    <div className="text-sm text-gray-500">No roles available</div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions?.slice(0, 3).map((permission) => (
                        <Badge key={permission.id} variant="outline" className="text-xs">
                          {permission.name}
                        </Badge>
                      ))}
                      {role.permissions && role.permissions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{role.permissions.length - 3} more
                        </Badge>
                      )}
                      {(!role.permissions || role.permissions.length === 0) && (
                        <span className="text-xs text-gray-500">No permissions</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPermissionsDialog(role)}
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span className="sr-only">Manage Permissions</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditRoleDialog(role)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() => openDeleteRoleDialog(role)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Role Dialog */}
      <Dialog open={isAddRoleDialogOpen} onOpenChange={setIsAddRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Role</DialogTitle>
            <DialogDescription>
              Create a new role to assign to users. You can manage permissions after creating the role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                placeholder="e.g., Admin, Editor, Viewer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                placeholder="Describe the purpose and capabilities of this role"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRole} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding...
                </>
              ) : (
                'Add Role'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update the details of this role.
            </DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Role Name</Label>
                <Input
                  id="edit-name"
                  value={selectedRole.name}
                  onChange={(e) => setSelectedRole({ ...selectedRole, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={selectedRole.description}
                  onChange={(e) => setSelectedRole({ ...selectedRole, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                'Update Role'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Permissions Dialog */}
      <Dialog 
        open={isPermissionsDialogOpen} 
        onOpenChange={setIsPermissionsDialogOpen}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manage Permissions for {selectedRole?.name}</DialogTitle>
            <DialogDescription>
              Select the permissions to assign to this role.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="mb-4">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search permissions..."
                  className="pl-8"
                  value={permissionSearchQuery}
                  onChange={(e) => setPermissionSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <ScrollArea className="h-[400px] pr-4">
              {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => {
                const allSelected = categoryPermissions.every(p => 
                  selectedPermissions.includes(p.id)
                );
                const someSelected = !allSelected && categoryPermissions.some(p => 
                  selectedPermissions.includes(p.id)
                );
                
                return (
                  <div key={category} className="mb-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <Checkbox 
                        id={`category-${category}`}
                        checked={allSelected || someSelected}
                        data-state={someSelected ? "indeterminate" : allSelected ? "checked" : "unchecked"}
                        onCheckedChange={() => toggleCategoryPermissions(categoryPermissions, allSelected)}
                        className={someSelected ? "opacity-50" : ""}
                      />
                      <Label 
                        htmlFor={`category-${category}`}
                        className="text-sm font-medium"
                      >
                        {category}
                      </Label>
                    </div>
                    <div className="ml-6 space-y-2">
                      {categoryPermissions.map(permission => (
                        <div key={permission.id} className="flex items-start space-x-2">
                          <Checkbox 
                            id={`permission-${permission.id}`}
                            checked={selectedPermissions.includes(permission.id)}
                            onCheckedChange={() => togglePermission(permission.id)}
                          />
                          <div className="grid gap-1">
                            <Label 
                              htmlFor={`permission-${permission.id}`}
                              className="text-sm font-medium leading-none"
                            >
                              {permission.name}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {permission.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Separator className="mt-4" />
                  </div>
                );
              })}
              {Object.keys(permissionsByCategory).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {permissionSearchQuery ? (
                    <p>No permissions found matching "{permissionSearchQuery}"</p>
                  ) : (
                    <p>No permissions available</p>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPermissionsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRolePermissions} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save Permissions'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the role "{selectedRole?.name}".
              Users assigned to this role will lose the associated permissions.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteRole}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                'Delete Role'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 