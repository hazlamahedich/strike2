'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import rbacClient from '../../../../lib/api/rbacClient';
import { Role, Permission, RoleWithPermissions } from '../../../../lib/api/rbacClient';
import PermissionGuard from '../../../../components/PermissionGuard';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`role-tabpanel-${index}`}
      aria-labelledby={`role-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const RolesPage: React.FC = () => {
  const theme = useTheme();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [openPermissionDialog, setOpenPermissionDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [roleFormData, setRoleFormData] = useState({ name: '', description: '' });
  const [permissionFormData, setPermissionFormData] = useState({
    name: '',
    description: '',
    resource: '',
    action: '',
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Show snackbar notification
  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Fetch roles and permissions on mount
  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  // Fetch roles
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await rbacClient.getRoles();
      if (response.error) {
        throw response.error;
      }
      setRoles(response.data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      showNotification('Failed to fetch roles', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch permissions
  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const response = await rbacClient.getPermissions();
      if (response.error) {
        throw response.error;
      }
      setPermissions(response.data || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      showNotification('Failed to fetch permissions', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch role details
  const fetchRoleDetails = async (roleId: number) => {
    setLoading(true);
    try {
      const response = await rbacClient.getRole(roleId);
      if (response.error) {
        throw response.error;
      }
      setSelectedRole(response.data || null);
    } catch (error) {
      console.error(`Error fetching role details for role ID ${roleId}:`, error);
      showNotification('Failed to fetch role details', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle role selection
  const handleRoleSelect = (role: Role) => {
    fetchRoleDetails(role.id);
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle role form change
  const handleRoleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRoleFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle permission form change
  const handlePermissionFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPermissionFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle role dialog open
  const handleOpenRoleDialog = (role?: Role) => {
    if (role) {
      setRoleFormData({ name: role.name, description: role.description || '' });
    } else {
      setRoleFormData({ name: '', description: '' });
    }
    setOpenRoleDialog(true);
  };

  // Handle permission dialog open
  const handleOpenPermissionDialog = () => {
    setPermissionFormData({ name: '', description: '', resource: '', action: '' });
    setOpenPermissionDialog(true);
  };

  // Handle role dialog close
  const handleCloseRoleDialog = () => {
    setOpenRoleDialog(false);
  };

  // Handle permission dialog close
  const handleClosePermissionDialog = () => {
    setOpenPermissionDialog(false);
  };

  // Handle delete dialog open
  const handleOpenDeleteDialog = () => {
    setOpenDeleteDialog(true);
  };

  // Handle delete dialog close
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  // Handle role creation
  const handleCreateRole = async () => {
    setLoading(true);
    try {
      const response = await rbacClient.createRole(roleFormData);
      if (response.error) {
        throw response.error;
      }
      showNotification('Role created successfully', 'success');
      fetchRoles();
      handleCloseRoleDialog();
    } catch (error) {
      console.error('Error creating role:', error);
      showNotification('Failed to create role', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle permission creation
  const handleCreatePermission = async () => {
    setLoading(true);
    try {
      const response = await rbacClient.createPermission(permissionFormData);
      if (response.error) {
        throw response.error;
      }
      showNotification('Permission created successfully', 'success');
      fetchPermissions();
      handleClosePermissionDialog();
    } catch (error) {
      console.error('Error creating permission:', error);
      showNotification('Failed to create permission', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle role deletion
  const handleDeleteRole = async () => {
    if (!selectedRole) return;

    setLoading(true);
    try {
      const response = await rbacClient.deleteRole(selectedRole.id);
      if (response.error) {
        throw response.error;
      }
      showNotification('Role deleted successfully', 'success');
      fetchRoles();
      setSelectedRole(null);
      handleCloseDeleteDialog();
    } catch (error) {
      console.error(`Error deleting role with ID ${selectedRole.id}:`, error);
      showNotification('Failed to delete role', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle permission assignment to role
  const handleAssignPermission = async (permissionId: number) => {
    if (!selectedRole) return;

    setLoading(true);
    try {
      const response = await rbacClient.assignPermissionToRole(selectedRole.id, permissionId);
      if (response.error) {
        throw response.error;
      }
      showNotification('Permission assigned successfully', 'success');
      fetchRoleDetails(selectedRole.id);
    } catch (error) {
      console.error(`Error assigning permission to role with ID ${selectedRole.id}:`, error);
      showNotification('Failed to assign permission', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle permission removal from role
  const handleRemovePermission = async (permissionId: number) => {
    if (!selectedRole) return;

    setLoading(true);
    try {
      const response = await rbacClient.removePermissionFromRole(selectedRole.id, permissionId);
      if (response.error) {
        throw response.error;
      }
      showNotification('Permission removed successfully', 'success');
      fetchRoleDetails(selectedRole.id);
    } catch (error) {
      console.error(`Error removing permission from role with ID ${selectedRole.id}:`, error);
      showNotification('Failed to remove permission', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Check if a permission is assigned to the selected role
  const isPermissionAssigned = (permissionId: number): boolean => {
    if (!selectedRole) return false;
    return selectedRole.permissions.some((p) => p.id === permissionId);
  };

  return (
    <PermissionGuard permissionName="manage_roles" resource="roles">
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Role Management
        </Typography>

        <Grid container spacing={3}>
          {/* Roles List */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader
                title="Roles"
                action={
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenRoleDialog()}
                  >
                    Add Role
                  </Button>
                }
              />
              <Divider />
              <CardContent>
                <List>
                  {roles.map((role) => (
                    <ListItemButton
                      key={role.id}
                      selected={selectedRole?.id === role.id}
                      onClick={() => handleRoleSelect(role)}
                    >
                      <ListItemText
                        primary={role.name}
                        secondary={role.description || 'No description'}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Role Details */}
          <Grid item xs={12} md={8}>
            {selectedRole ? (
              <Card>
                <CardHeader
                  title={`Role: ${selectedRole.name}`}
                  subheader={selectedRole.description || 'No description'}
                  action={
                    <>
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenRoleDialog(selectedRole)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={handleOpenDeleteDialog}>
                        <DeleteIcon />
                      </IconButton>
                    </>
                  }
                />
                <Divider />
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    aria-label="role tabs"
                  >
                    <Tab label="Permissions" />
                    <Tab label="Users" />
                  </Tabs>
                </Box>
                <TabPanel value={tabValue} index={0}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Assigned Permissions
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedRole.permissions.length > 0 ? (
                        selectedRole.permissions.map((permission) => (
                          <Chip
                            key={permission.id}
                            label={`${permission.name} (${permission.resource})`}
                            onDelete={() => handleRemovePermission(permission.id)}
                            color="primary"
                            variant="outlined"
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          No permissions assigned
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Available Permissions
                    </Typography>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={handleOpenPermissionDialog}
                      sx={{ mb: 2 }}
                    >
                      Create Permission
                    </Button>
                    <List>
                      {permissions
                        .filter(
                          (permission) =>
                            !isPermissionAssigned(permission.id)
                        )
                        .map((permission) => (
                          <ListItem key={permission.id}>
                            <ListItemText
                              primary={permission.name}
                              secondary={`${permission.resource} - ${permission.action}`}
                            />
                            <ListItemSecondaryAction>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() =>
                                  handleAssignPermission(permission.id)
                                }
                              >
                                Assign
                              </Button>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                    </List>
                  </Box>
                </TabPanel>
                <TabPanel value={tabValue} index={1}>
                  <Typography variant="body1">
                    User management coming soon...
                  </Typography>
                </TabPanel>
              </Card>
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="textSecondary">
                  Select a role to view details
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>

        {/* Role Dialog */}
        <Dialog open={openRoleDialog} onClose={handleCloseRoleDialog}>
          <DialogTitle>
            {roleFormData.name ? 'Edit Role' : 'Create Role'}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Role Name"
              type="text"
              fullWidth
              value={roleFormData.name}
              onChange={handleRoleFormChange}
            />
            <TextField
              margin="dense"
              name="description"
              label="Description"
              type="text"
              fullWidth
              multiline
              rows={3}
              value={roleFormData.description}
              onChange={handleRoleFormChange}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseRoleDialog}>Cancel</Button>
            <Button
              onClick={handleCreateRole}
              color="primary"
              disabled={!roleFormData.name}
            >
              {roleFormData.name ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Permission Dialog */}
        <Dialog
          open={openPermissionDialog}
          onClose={handleClosePermissionDialog}
        >
          <DialogTitle>Create Permission</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Permission Name"
              type="text"
              fullWidth
              value={permissionFormData.name}
              onChange={handlePermissionFormChange}
            />
            <TextField
              margin="dense"
              name="description"
              label="Description"
              type="text"
              fullWidth
              value={permissionFormData.description}
              onChange={handlePermissionFormChange}
            />
            <TextField
              margin="dense"
              name="resource"
              label="Resource"
              type="text"
              fullWidth
              value={permissionFormData.resource}
              onChange={handlePermissionFormChange}
            />
            <TextField
              margin="dense"
              name="action"
              label="Action"
              type="text"
              fullWidth
              value={permissionFormData.action}
              onChange={handlePermissionFormChange}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClosePermissionDialog}>Cancel</Button>
            <Button
              onClick={handleCreatePermission}
              color="primary"
              disabled={
                !permissionFormData.name ||
                !permissionFormData.resource ||
                !permissionFormData.action
              }
            >
              Create
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
          <DialogTitle>Delete Role</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the role "{selectedRole?.name}"?
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
            <Button onClick={handleDeleteRole} color="error">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </PermissionGuard>
  );
};

export default RolesPage; 