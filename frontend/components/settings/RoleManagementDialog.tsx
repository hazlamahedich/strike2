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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { useRBAC, Role, RoleWithPermissions } from '@/hooks/useRBAC';
import { toast } from "@/components/ui/use-toast";

interface RoleManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RoleManagementDialog: React.FC<RoleManagementDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { roles, isLoading, fetchRoles, createRole, updateRole, deleteRole, fetchRoleWithPermissions } = useRBAC();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleWithPermissions, setRoleWithPermissions] = useState<RoleWithPermissions | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch roles when dialog opens
  useEffect(() => {
    if (open) {
      fetchRoles();
    }
  }, [open, fetchRoles]);

  // Fetch role details when a role is selected
  useEffect(() => {
    if (selectedRole) {
      const loadRoleWithPermissions = async () => {
        try {
          const roleData = await fetchRoleWithPermissions(selectedRole.id);
          setRoleWithPermissions(roleData);
        } catch (error) {
          console.error('Error fetching role permissions:', error);
        }
      };
      
      loadRoleWithPermissions();
    } else {
      setRoleWithPermissions(null);
    }
  }, [selectedRole, fetchRoleWithPermissions]);

  // Reset form when selected role changes
  useEffect(() => {
    if (selectedRole) {
      setFormData({
        name: selectedRole.name,
        description: selectedRole.description || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
      });
    }
  }, [selectedRole]);

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setIsEditing(false);
    setShowDeleteConfirm(false);
  };

  const handleCreateNew = () => {
    setSelectedRole(null);
    setIsEditing(true);
    setShowDeleteConfirm(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setShowDeleteConfirm(false);
  };

  const handleDelete = async () => {
    if (!selectedRole) return;
    
    try {
      setIsSubmitting(true);
      await deleteRole(selectedRole.id);
      setSelectedRole(null);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting role:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Role name is required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      if (selectedRole) {
        // Update existing role
        await updateRole(selectedRole.id, formData);
      } else {
        // Create new role
        await createRole(formData);
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving role:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Roles</DialogTitle>
          <DialogDescription>
            Create and manage roles for users in the system.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-3 gap-4 py-4 flex-1 overflow-hidden">
          {/* Role List */}
          <div className="col-span-1 border rounded-md overflow-hidden flex flex-col max-h-[500px]">
            <div className="p-2 bg-muted flex justify-between items-center">
              <h3 className="text-sm font-medium">Roles</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSelectedRole(null);
                  setFormData({ name: '', description: '' });
                  setIsEditing(true);
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="overflow-y-auto flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Loading roles...</span>
                </div>
              ) : roles.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No roles found
                </div>
              ) : (
                <div className="divide-y">
                  {roles.map((role) => (
                    <div 
                      key={role.id}
                      className={`p-2 cursor-pointer hover:bg-muted ${selectedRole?.id === role.id ? 'bg-muted' : ''}`}
                      onClick={() => handleSelectRole(role)}
                    >
                      <div className="font-medium">{role.name}</div>
                      {role.description && (
                        <div className="text-sm text-muted-foreground truncate">
                          {role.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Role Details */}
          <div className="col-span-2 border rounded-md p-4 flex flex-col overflow-hidden max-h-[500px]">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Role Name</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange}
                    placeholder="Enter role name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    value={formData.description || ''} 
                    onChange={handleInputChange}
                    placeholder="Enter role description"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {selectedRole ? 'Update Role' : 'Create Role'}
                  </Button>
                </div>
              </form>
            ) : selectedRole && !isEditing ? (
              <>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedRole.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedRole.description || 'No description'}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleEdit}
                      disabled={isSubmitting}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
                
                <h4 className="text-sm font-medium mb-2">Permissions</h4>
                <div className="flex-1 overflow-y-auto">
                  {roleWithPermissions ? (
                    roleWithPermissions.permissions.length > 0 ? (
                      <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Resource</TableHead>
                            <TableHead>Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {roleWithPermissions.permissions.map((permission) => (
                            <TableRow key={permission.id}>
                              <TableCell>{permission.name}</TableCell>
                              <TableCell>{permission.resource}</TableCell>
                              <TableCell>{permission.action}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-center text-muted-foreground">
                        No permissions assigned to this role
                      </p>
                    )
                  ) : (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Loading permissions...</span>
                    </div>
                  )}
                </div>
              </>
            ) : showDeleteConfirm ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Confirm Deletion</h3>
                <p>
                  Are you sure you want to delete the role "{selectedRole?.name}"? 
                  This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Delete
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-8">
                <p className="text-muted-foreground mb-4">
                  Select a role to view details or create a new role
                </p>
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Role
                </Button>
              </div>
            )}
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

export default RoleManagementDialog; 