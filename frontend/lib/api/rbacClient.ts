import { API_CONFIG } from '../config';
import apiClient, { ApiResponse } from './client';

// Types for RBAC
export interface Role {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: number;
  name: string;
  description?: string;
  resource: string;
  action: string;
  created_at: string;
  updated_at: string;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export interface UserRole {
  id: number;
  user_id: string;
  role_id: number;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  id: number;
  role_id: number;
  permission_id: number;
  created_at: string;
  updated_at: string;
}

export interface UserWithRoles {
  id: string;
  email: string;
  name: string;
  roles: Role[];
  permissions: Permission[];
}

// RBAC API client
const rbacClient = {
  // Role endpoints
  async getRoles(): Promise<ApiResponse<Role[]>> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/rbac/roles`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiClient.getAuthToken()}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch roles');
      }
      
      return {
        data,
        error: null
      };
    } catch (error) {
      console.error('Error fetching roles:', error);
      return {
        data: [],
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },
  
  async getRole(roleId: number): Promise<ApiResponse<RoleWithPermissions>> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/rbac/roles/${roleId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiClient.getAuthToken()}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || `Failed to fetch role with ID ${roleId}`);
      }
      
      return {
        data,
        error: null
      };
    } catch (error) {
      console.error(`Error fetching role with ID ${roleId}:`, error);
      return {
        data: null as unknown as RoleWithPermissions,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },
  
  async createRole(role: { name: string; description?: string }): Promise<ApiResponse<Role>> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/rbac/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiClient.getAuthToken()}`
        },
        body: JSON.stringify(role)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create role');
      }
      
      return {
        data,
        error: null
      };
    } catch (error) {
      console.error('Error creating role:', error);
      return {
        data: null as unknown as Role,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },
  
  async updateRole(roleId: number, role: { name?: string; description?: string }): Promise<ApiResponse<Role>> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/rbac/roles/${roleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiClient.getAuthToken()}`
        },
        body: JSON.stringify(role)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || `Failed to update role with ID ${roleId}`);
      }
      
      return {
        data,
        error: null
      };
    } catch (error) {
      console.error(`Error updating role with ID ${roleId}:`, error);
      return {
        data: null as unknown as Role,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },
  
  async deleteRole(roleId: number): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/rbac/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiClient.getAuthToken()}`
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || `Failed to delete role with ID ${roleId}`);
      }
      
      return {
        data: undefined,
        error: null
      };
    } catch (error) {
      console.error(`Error deleting role with ID ${roleId}:`, error);
      return {
        data: undefined,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },
  
  // Permission endpoints
  async getPermissions(params?: { resource?: string; action?: string }): Promise<ApiResponse<Permission[]>> {
    try {
      let url = `${API_CONFIG.BASE_URL}/api/rbac/permissions`;
      
      if (params) {
        const queryParams = new URLSearchParams();
        if (params.resource) queryParams.append('resource', params.resource);
        if (params.action) queryParams.append('action', params.action);
        
        if (queryParams.toString()) {
          url += `?${queryParams.toString()}`;
        }
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiClient.getAuthToken()}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch permissions');
      }
      
      return {
        data,
        error: null
      };
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return {
        data: [],
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },
  
  async createPermission(permission: { name: string; description?: string; resource: string; action: string }): Promise<ApiResponse<Permission>> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/rbac/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiClient.getAuthToken()}`
        },
        body: JSON.stringify(permission)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create permission');
      }
      
      return {
        data,
        error: null
      };
    } catch (error) {
      console.error('Error creating permission:', error);
      return {
        data: null as unknown as Permission,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },
  
  // User Role endpoints
  async getUserRoles(userId: string): Promise<ApiResponse<Role[]>> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/rbac/users/${userId}/roles`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiClient.getAuthToken()}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || `Failed to fetch roles for user with ID ${userId}`);
      }
      
      return {
        data,
        error: null
      };
    } catch (error) {
      console.error(`Error fetching roles for user with ID ${userId}:`, error);
      return {
        data: [],
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },
  
  async assignRoleToUser(userId: string, roleId: number): Promise<ApiResponse<UserRole>> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/rbac/users/${userId}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiClient.getAuthToken()}`
        },
        body: JSON.stringify({ role_id: roleId })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || `Failed to assign role to user with ID ${userId}`);
      }
      
      return {
        data,
        error: null
      };
    } catch (error) {
      console.error(`Error assigning role to user with ID ${userId}:`, error);
      return {
        data: null as unknown as UserRole,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },
  
  async removeRoleFromUser(userId: string, roleId: number): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/rbac/users/${userId}/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiClient.getAuthToken()}`
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || `Failed to remove role from user with ID ${userId}`);
      }
      
      return {
        data: undefined,
        error: null
      };
    } catch (error) {
      console.error(`Error removing role from user with ID ${userId}:`, error);
      return {
        data: undefined,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },
  
  // Role Permission endpoints
  async getRolePermissions(roleId: number): Promise<ApiResponse<Permission[]>> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/rbac/roles/${roleId}/permissions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiClient.getAuthToken()}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || `Failed to fetch permissions for role with ID ${roleId}`);
      }
      
      return {
        data,
        error: null
      };
    } catch (error) {
      console.error(`Error fetching permissions for role with ID ${roleId}:`, error);
      return {
        data: [],
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },
  
  async assignPermissionToRole(roleId: number, permissionId: number): Promise<ApiResponse<RolePermission>> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/rbac/roles/${roleId}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiClient.getAuthToken()}`
        },
        body: JSON.stringify({ permission_id: permissionId })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || `Failed to assign permission to role with ID ${roleId}`);
      }
      
      return {
        data,
        error: null
      };
    } catch (error) {
      console.error(`Error assigning permission to role with ID ${roleId}:`, error);
      return {
        data: null as unknown as RolePermission,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },
  
  async removePermissionFromRole(roleId: number, permissionId: number): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/rbac/roles/${roleId}/permissions/${permissionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiClient.getAuthToken()}`
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || `Failed to remove permission from role with ID ${roleId}`);
      }
      
      return {
        data: undefined,
        error: null
      };
    } catch (error) {
      console.error(`Error removing permission from role with ID ${roleId}:`, error);
      return {
        data: undefined,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },
  
  // User Permission check endpoint
  async checkPermission(permissionName: string, resource: string): Promise<ApiResponse<{ has_permission: boolean }>> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/rbac/check-permission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiClient.getAuthToken()}`
        },
        body: JSON.stringify({
          permission_name: permissionName,
          resource: resource
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to check permission');
      }
      
      return {
        data,
        error: null
      };
    } catch (error) {
      console.error('Error checking permission:', error);
      return {
        data: { has_permission: false },
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },
  
  // Current user permissions endpoint
  async getCurrentUserPermissions(): Promise<ApiResponse<UserWithRoles>> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/rbac/me/permissions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiClient.getAuthToken()}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch current user permissions');
      }
      
      return {
        data,
        error: null
      };
    } catch (error) {
      console.error('Error fetching current user permissions:', error);
      return {
        data: null as unknown as UserWithRoles,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  }
};

export default rbacClient; 