import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Tabs,
  Tab,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  FormHelperText,
  IconButton,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  VpnKey as VpnKeyIcon
} from '@mui/icons-material';
import axios from 'axios';

const RBACManagement = () => {
  // State
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [openPermissionDialog, setOpenPermissionDialog] = useState(false);
  const [openUserRoleDialog, setOpenUserRoleDialog] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [selectedUserRole, setSelectedUserRole] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch data
  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/rbac/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      showSnackbar('Failed to fetch users', 'error');
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get('/api/rbac/roles');
      setRoles(response.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
      showSnackbar('Failed to fetch roles', 'error');
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await axios.get('/api/rbac/permissions');
      setPermissions(response.data);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      showSnackbar('Failed to fetch permissions', 'error');
    }
  };

  const fetchRolePermissions = async (roleId) => {
    try {
      const response = await axios.get(`/api/rbac/roles/${roleId}/permissions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      showSnackbar('Failed to fetch role permissions', 'error');
      return [];
    }
  };

  // Event handlers
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenRoleDialog = (role = null) => {
    if (role) {
      setSelectedRole(role);
      setNewRoleName(role.name);
      setNewRoleDescription(role.description || '');
      setIsEditing(true);
    } else {
      setSelectedRole(null);
      setNewRoleName('');
      setNewRoleDescription('');
      setIsEditing(false);
    }
    setOpenRoleDialog(true);
  };

  const handleCloseRoleDialog = () => {
    setOpenRoleDialog(false);
    setSelectedRole(null);
    setNewRoleName('');
    setNewRoleDescription('');
    setIsEditing(false);
  };

  const handleOpenPermissionDialog = async (role) => {
    setSelectedRole(role);
    const rolePermissions = await fetchRolePermissions(role.id);
    setSelectedPermissions(rolePermissions.map(p => p.id));
    setOpenPermissionDialog(true);
  };

  const handleClosePermissionDialog = () => {
    setOpenPermissionDialog(false);
    setSelectedRole(null);
    setSelectedPermissions([]);
  };

  const handleOpenUserRoleDialog = (user) => {
    setSelectedUser(user);
    setSelectedUserRole('');
    setOpenUserRoleDialog(true);
  };

  const handleCloseUserRoleDialog = () => {
    setOpenUserRoleDialog(false);
    setSelectedUser(null);
    setSelectedUserRole('');
  };

  const handlePermissionChange = (event) => {
    setSelectedPermissions(event.target.value);
  };

  const handleUserRoleChange = (event) => {
    setSelectedUserRole(event.target.value);
  };

  // API actions
  const createOrUpdateRole = async () => {
    try {
      if (isEditing) {
        await axios.put(`/api/rbac/roles/${selectedRole.id}`, {
          name: newRoleName,
          description: newRoleDescription
        });
        showSnackbar(`Role "${newRoleName}" updated successfully`, 'success');
      } else {
        await axios.post('/api/rbac/roles', {
          name: newRoleName,
          description: newRoleDescription
        });
        showSnackbar(`Role "${newRoleName}" created successfully`, 'success');
      }
      fetchRoles();
      handleCloseRoleDialog();
    } catch (error) {
      console.error('Error creating/updating role:', error);
      showSnackbar(`Failed to ${isEditing ? 'update' : 'create'} role`, 'error');
    }
  };

  const deleteRole = async (roleId) => {
    try {
      await axios.delete(`/api/rbac/roles/${roleId}`);
      showSnackbar('Role deleted successfully', 'success');
      fetchRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
      if (error.response && error.response.status === 409) {
        showSnackbar('Cannot delete role that is assigned to users', 'error');
      } else {
        showSnackbar('Failed to delete role', 'error');
      }
    }
  };

  const updateRolePermissions = async () => {
    try {
      // First, get current permissions
      const currentPermissions = await fetchRolePermissions(selectedRole.id);
      const currentPermissionIds = currentPermissions.map(p => p.id);
      
      // Permissions to add
      const permissionsToAdd = selectedPermissions.filter(
        id => !currentPermissionIds.includes(id)
      );
      
      // Permissions to remove
      const permissionsToRemove = currentPermissionIds.filter(
        id => !selectedPermissions.includes(id)
      );
      
      // Add new permissions
      if (permissionsToAdd.length > 0) {
        await axios.post(`/api/rbac/roles/${selectedRole.id}/permissions`, {
          permissionIds: permissionsToAdd
        });
      }
      
      // Remove permissions
      for (const permissionId of permissionsToRemove) {
        await axios.delete(`/api/rbac/roles/${selectedRole.id}/permissions/${permissionId}`);
      }
      
      showSnackbar('Role permissions updated successfully', 'success');
      handleClosePermissionDialog();
    } catch (error) {
      console.error('Error updating role permissions:', error);
      showSnackbar('Failed to update role permissions', 'error');
    }
  };

  const assignRoleToUser = async () => {
    try {
      await axios.post(`/api/rbac/users/${selectedUser.id}/roles`, {
        roleId: selectedUserRole
      });
      showSnackbar('Role assigned to user successfully', 'success');
      fetchUsers();
      handleCloseUserRoleDialog();
    } catch (error) {
      console.error('Error assigning role to user:', error);
      if (error.response && error.response.status === 409) {
        showSnackbar('User already has this role', 'error');
      } else {
        showSnackbar('Failed to assign role to user', 'error');
      }
    }
  };

  const removeRoleFromUser = async (userId, roleId) => {
    try {
      await axios.delete(`/api/rbac/users/${userId}/roles/${roleId}`);
      showSnackbar('Role removed from user successfully', 'success');
      fetchUsers();
    } catch (error) {
      console.error('Error removing role from user:', error);
      showSnackbar('Failed to remove role from user', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Render functions
  const renderUsersTab = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        User Role Management
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Roles</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.roles && user.roles.length > 0 ? (
                    user.roles.map((role) => (
                      <Chip
                        key={role.id}
                        label={role.name}
                        onDelete={() => removeRoleFromUser(user.id, role.id)}
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No roles assigned
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    startIcon={<AddIcon />}
                    variant="outlined"
                    size="small"
                    onClick={() => handleOpenUserRoleDialog(user)}
                  >
                    Assign Role
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderRolesTab = () => (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Role Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenRoleDialog()}
        >
          Create Role
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>{role.name}</TableCell>
                <TableCell>{role.description}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenRoleDialog(role)}
                    title="Edit Role"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="secondary"
                    onClick={() => handleOpenPermissionDialog(role)}
                    title="Manage Permissions"
                  >
                    <VpnKeyIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => deleteRole(role.id)}
                    title="Delete Role"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderPermissionsTab = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Available Permissions
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Resource</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {permissions.map((permission) => (
              <TableRow key={permission.id}>
                <TableCell>{permission.name}</TableCell>
                <TableCell>{permission.description}</TableCell>
                <TableCell>{permission.resource}</TableCell>
                <TableCell>{permission.action}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Role-Based Access Control Management
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab icon={<PersonIcon />} label="Users" />
          <Tab icon={<SecurityIcon />} label="Roles" />
          <Tab icon={<VpnKeyIcon />} label="Permissions" />
        </Tabs>
      </Box>
      
      {tabValue === 0 && renderUsersTab()}
      {tabValue === 1 && renderRolesTab()}
      {tabValue === 2 && renderPermissionsTab()}
      
      {/* Role Dialog */}
      <Dialog open={openRoleDialog} onClose={handleCloseRoleDialog}>
        <DialogTitle>{isEditing ? 'Edit Role' : 'Create New Role'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Role Name"
            fullWidth
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            required
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            value={newRoleDescription}
            onChange={(e) => setNewRoleDescription(e.target.value)}
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRoleDialog}>Cancel</Button>
          <Button 
            onClick={createOrUpdateRole} 
            variant="contained"
            disabled={!newRoleName}
          >
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Permission Dialog */}
      <Dialog 
        open={openPermissionDialog} 
        onClose={handleClosePermissionDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Manage Permissions for Role: {selectedRole?.name}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Select the permissions to assign to this role:
          </DialogContentText>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Permissions</InputLabel>
            <Select
              multiple
              value={selectedPermissions}
              onChange={handlePermissionChange}
              input={<OutlinedInput label="Permissions" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const permission = permissions.find(p => p.id === value);
                    return (
                      <Chip 
                        key={value} 
                        label={permission ? permission.name : value} 
                      />
                    );
                  })}
                </Box>
              )}
            >
              {permissions.map((permission) => (
                <MenuItem key={permission.id} value={permission.id}>
                  <Checkbox checked={selectedPermissions.indexOf(permission.id) > -1} />
                  <ListItemText 
                    primary={permission.name} 
                    secondary={permission.description} 
                  />
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              Select multiple permissions by clicking on them
            </FormHelperText>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePermissionDialog}>Cancel</Button>
          <Button 
            onClick={updateRolePermissions} 
            variant="contained"
          >
            Save Permissions
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* User Role Dialog */}
      <Dialog open={openUserRoleDialog} onClose={handleCloseUserRoleDialog}>
        <DialogTitle>Assign Role to User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Assign a role to {selectedUser?.email}:
          </DialogContentText>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={selectedUserRole}
              onChange={handleUserRoleChange}
              label="Role"
            >
              {roles.map((role) => (
                <MenuItem 
                  key={role.id} 
                  value={role.id}
                  disabled={selectedUser?.roles?.some(r => r.id === role.id)}
                >
                  {role.name}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              Roles already assigned to the user are disabled
            </FormHelperText>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUserRoleDialog}>Cancel</Button>
          <Button 
            onClick={assignRoleToUser} 
            variant="contained"
            disabled={!selectedUserRole}
          >
            Assign Role
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RBACManagement; 