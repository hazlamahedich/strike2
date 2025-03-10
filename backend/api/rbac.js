const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware to check if user has admin permissions
const requireAdmin = async (req, res, next) => {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has admin permissions
    const { data, error } = await supabase.rpc('has_permission', {
      user_email: user.email,
      permission_name: 'manage_users'
    });

    if (error || !data) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Error in admin middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all roles
router.get('/roles', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('name');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// Get all permissions
router.get('/permissions', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('name');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

// Get all users with their roles
router.get('/users', requireAdmin, async (req, res) => {
  try {
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email, created_at');

    if (usersError) throw usersError;

    // Get user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role_id');

    if (rolesError) throw rolesError;

    // Get roles
    const { data: roles, error: roleNamesError } = await supabase
      .from('roles')
      .select('id, name');

    if (roleNamesError) throw roleNamesError;

    // Map roles to users
    const usersWithRoles = users.map(user => {
      const userRoleIds = userRoles
        .filter(ur => ur.user_id === user.id)
        .map(ur => ur.role_id);
      
      const userRoleNames = roles
        .filter(role => userRoleIds.includes(role.id))
        .map(role => ({ id: role.id, name: role.name }));

      return {
        ...user,
        roles: userRoleNames
      };
    });

    res.json(usersWithRoles);
  } catch (error) {
    console.error('Error fetching users with roles:', error);
    res.status(500).json({ error: 'Failed to fetch users with roles' });
  }
});

// Get permissions for a specific role
router.get('/roles/:roleId/permissions', requireAdmin, async (req, res) => {
  try {
    const { roleId } = req.params;

    const { data, error } = await supabase
      .from('role_permissions')
      .select('permission_id')
      .eq('role_id', roleId);

    if (error) throw error;

    const permissionIds = data.map(rp => rp.permission_id);

    const { data: permissions, error: permissionsError } = await supabase
      .from('permissions')
      .select('*')
      .in('id', permissionIds);

    if (permissionsError) throw permissionsError;

    res.json(permissions);
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    res.status(500).json({ error: 'Failed to fetch role permissions' });
  }
});

// Assign a role to a user
router.post('/users/:userId/roles', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;

    if (!roleId) {
      return res.status(400).json({ error: 'Role ID is required' });
    }

    const { data, error } = await supabase
      .from('user_roles')
      .insert([
        { user_id: userId, role_id: roleId, created_at: new Date(), updated_at: new Date() }
      ])
      .select();

    if (error) {
      // Check if it's a duplicate error
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({ error: 'User already has this role' });
      }
      throw error;
    }

    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error assigning role to user:', error);
    res.status(500).json({ error: 'Failed to assign role to user' });
  }
});

// Remove a role from a user
router.delete('/users/:userId/roles/:roleId', requireAdmin, async (req, res) => {
  try {
    const { userId, roleId } = req.params;

    const { data, error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', roleId)
      .select();

    if (error) throw error;

    if (data.length === 0) {
      return res.status(404).json({ error: 'User role not found' });
    }

    res.json({ message: 'Role removed from user successfully' });
  } catch (error) {
    console.error('Error removing role from user:', error);
    res.status(500).json({ error: 'Failed to remove role from user' });
  }
});

// Create a new role
router.post('/roles', requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Role name is required' });
    }

    const { data, error } = await supabase
      .from('roles')
      .insert([
        { name, description, created_at: new Date(), updated_at: new Date() }
      ])
      .select();

    if (error) {
      // Check if it's a duplicate error
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({ error: 'Role with this name already exists' });
      }
      throw error;
    }

    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
});

// Update a role
router.put('/roles/:roleId', requireAdmin, async (req, res) => {
  try {
    const { roleId } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Role name is required' });
    }

    const { data, error } = await supabase
      .from('roles')
      .update({ name, description, updated_at: new Date() })
      .eq('id', roleId)
      .select();

    if (error) throw error;

    if (data.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json(data[0]);
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// Delete a role
router.delete('/roles/:roleId', requireAdmin, async (req, res) => {
  try {
    const { roleId } = req.params;

    // First, check if any users have this role
    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role_id', roleId);

    if (userRolesError) throw userRolesError;

    if (userRoles.length > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete role that is assigned to users',
        userCount: userRoles.length
      });
    }

    // Delete role permissions first
    await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId);

    // Then delete the role
    const { data, error } = await supabase
      .from('roles')
      .delete()
      .eq('id', roleId)
      .select();

    if (error) throw error;

    if (data.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
});

// Assign permissions to a role
router.post('/roles/:roleId/permissions', requireAdmin, async (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissionIds } = req.body;

    if (!permissionIds || !Array.isArray(permissionIds) || permissionIds.length === 0) {
      return res.status(400).json({ error: 'Permission IDs array is required' });
    }

    // Create role-permission entries
    const rolePermissions = permissionIds.map(permissionId => ({
      role_id: roleId,
      permission_id: permissionId,
      created_at: new Date(),
      updated_at: new Date()
    }));

    const { data, error } = await supabase
      .from('role_permissions')
      .insert(rolePermissions)
      .select();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Error assigning permissions to role:', error);
    res.status(500).json({ error: 'Failed to assign permissions to role' });
  }
});

// Remove a permission from a role
router.delete('/roles/:roleId/permissions/:permissionId', requireAdmin, async (req, res) => {
  try {
    const { roleId, permissionId } = req.params;

    const { data, error } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId)
      .eq('permission_id', permissionId)
      .select();

    if (error) throw error;

    if (data.length === 0) {
      return res.status(404).json({ error: 'Role permission not found' });
    }

    res.json({ message: 'Permission removed from role successfully' });
  } catch (error) {
    console.error('Error removing permission from role:', error);
    res.status(500).json({ error: 'Failed to remove permission from role' });
  }
});

// Get current user's permissions
router.get('/my-permissions', async (req, res) => {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase.rpc('get_user_permissions', {
      user_email: user.email
    });

    if (error) throw error;

    res.json({ permissions: data });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({ error: 'Failed to fetch user permissions' });
  }
});

module.exports = router; 