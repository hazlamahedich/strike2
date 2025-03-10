from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

from app.models.rbac import (
    RoleCreate, RoleUpdate, Role, 
    PermissionCreate, PermissionUpdate, Permission,
    UserRoleCreate, UserRole,
    RolePermissionCreate, RolePermission,
    RoleWithPermissions, UserWithRoles
)
from app.core.database import fetch_one, fetch_all, insert_row, update_row, delete_row


class RBACService:
    """
    Service class for RBAC operations
    """
    
    # Role operations
    @staticmethod
    async def get_role_by_id(role_id: int) -> Optional[Role]:
        """
        Get a role by ID.
        """
        role_data = await fetch_one("roles", {"id": role_id})
        if not role_data:
            return None
        return Role(**role_data)
    
    @staticmethod
    async def get_role_by_name(name: str) -> Optional[Role]:
        """
        Get a role by name.
        """
        role_data = await fetch_one("roles", {"name": name})
        if not role_data:
            return None
        return Role(**role_data)
    
    @staticmethod
    async def get_roles(skip: int = 0, limit: int = 100) -> List[Role]:
        """
        Get all roles.
        """
        roles_data = await fetch_all(
            "roles", 
            query_params={}, 
            limit=limit, 
            offset=skip,
            order_by={"name": "asc"}
        )
        return [Role(**role_data) for role_data in roles_data]
    
    @staticmethod
    async def create_role(role_in: RoleCreate) -> Role:
        """
        Create a new role.
        """
        role_data = role_in.dict()
        role_data.update({
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        })
        
        new_role_data = await insert_row("roles", role_data)
        return Role(**new_role_data)
    
    @staticmethod
    async def update_role(role_id: int, role_in: RoleUpdate) -> Role:
        """
        Update a role.
        """
        # Get current role
        current_role_data = await fetch_one("roles", {"id": role_id})
        if not current_role_data:
            raise ValueError(f"Role with ID {role_id} not found")
        
        # Prepare update data
        update_data = role_in.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.now()
        
        # Update the role
        updated_role_data = await update_row("roles", role_id, update_data)
        return Role(**updated_role_data)
    
    @staticmethod
    async def delete_role(role_id: int) -> bool:
        """
        Delete a role.
        """
        # First, delete all role permissions
        await delete_row("role_permissions", {"role_id": role_id}, is_filter=True)
        
        # Then, delete all user roles
        await delete_row("user_roles", {"role_id": role_id}, is_filter=True)
        
        # Finally, delete the role
        await delete_row("roles", role_id)
        return True
    
    # Permission operations
    @staticmethod
    async def get_permission_by_id(permission_id: int) -> Optional[Permission]:
        """
        Get a permission by ID.
        """
        permission_data = await fetch_one("permissions", {"id": permission_id})
        if not permission_data:
            return None
        return Permission(**permission_data)
    
    @staticmethod
    async def get_permission_by_name(name: str) -> Optional[Permission]:
        """
        Get a permission by name.
        """
        permission_data = await fetch_one("permissions", {"name": name})
        if not permission_data:
            return None
        return Permission(**permission_data)
    
    @staticmethod
    async def get_permissions(
        skip: int = 0, 
        limit: int = 100,
        resource: Optional[str] = None,
        action: Optional[str] = None
    ) -> List[Permission]:
        """
        Get all permissions with optional filtering.
        """
        query_params = {}
        if resource:
            query_params["resource"] = resource
        if action:
            query_params["action"] = action
            
        permissions_data = await fetch_all(
            "permissions", 
            query_params=query_params, 
            limit=limit, 
            offset=skip,
            order_by={"resource": "asc", "action": "asc"}
        )
        return [Permission(**permission_data) for permission_data in permissions_data]
    
    @staticmethod
    async def create_permission(permission_in: PermissionCreate) -> Permission:
        """
        Create a new permission.
        """
        permission_data = permission_in.dict()
        permission_data.update({
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        })
        
        new_permission_data = await insert_row("permissions", permission_data)
        return Permission(**new_permission_data)
    
    @staticmethod
    async def update_permission(permission_id: int, permission_in: PermissionUpdate) -> Permission:
        """
        Update a permission.
        """
        # Get current permission
        current_permission_data = await fetch_one("permissions", {"id": permission_id})
        if not current_permission_data:
            raise ValueError(f"Permission with ID {permission_id} not found")
        
        # Prepare update data
        update_data = permission_in.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.now()
        
        # Update the permission
        updated_permission_data = await update_row("permissions", permission_id, update_data)
        return Permission(**updated_permission_data)
    
    @staticmethod
    async def delete_permission(permission_id: int) -> bool:
        """
        Delete a permission.
        """
        # First, delete all role permissions
        await delete_row("role_permissions", {"permission_id": permission_id}, is_filter=True)
        
        # Then, delete the permission
        await delete_row("permissions", permission_id)
        return True
    
    # User Role operations
    @staticmethod
    async def assign_role_to_user(user_id: str, role_id: int) -> UserRole:
        """
        Assign a role to a user.
        """
        user_role_data = {
            "user_id": user_id,
            "role_id": role_id,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        # Check if the assignment already exists
        existing = await fetch_one("user_roles", {"user_id": user_id, "role_id": role_id})
        if existing:
            return UserRole(**existing)
        
        new_user_role_data = await insert_row("user_roles", user_role_data)
        return UserRole(**new_user_role_data)
    
    @staticmethod
    async def remove_role_from_user(user_id: str, role_id: int) -> bool:
        """
        Remove a role from a user.
        """
        await delete_row("user_roles", {"user_id": user_id, "role_id": role_id}, is_filter=True)
        return True
    
    @staticmethod
    async def get_user_roles(user_id: str) -> List[Role]:
        """
        Get all roles for a user.
        """
        user_roles_data = await fetch_all(
            "user_roles", 
            query_params={"user_id": user_id}
        )
        
        roles = []
        for user_role in user_roles_data:
            role_data = await fetch_one("roles", {"id": user_role["role_id"]})
            if role_data:
                roles.append(Role(**role_data))
        
        return roles
    
    # Role Permission operations
    @staticmethod
    async def assign_permission_to_role(role_id: int, permission_id: int) -> RolePermission:
        """
        Assign a permission to a role.
        """
        role_permission_data = {
            "role_id": role_id,
            "permission_id": permission_id,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        # Check if the assignment already exists
        existing = await fetch_one("role_permissions", {"role_id": role_id, "permission_id": permission_id})
        if existing:
            return RolePermission(**existing)
        
        new_role_permission_data = await insert_row("role_permissions", role_permission_data)
        return RolePermission(**new_role_permission_data)
    
    @staticmethod
    async def remove_permission_from_role(role_id: int, permission_id: int) -> bool:
        """
        Remove a permission from a role.
        """
        await delete_row("role_permissions", {"role_id": role_id, "permission_id": permission_id}, is_filter=True)
        return True
    
    @staticmethod
    async def get_role_permissions(role_id: int) -> List[Permission]:
        """
        Get all permissions for a role.
        """
        role_permissions_data = await fetch_all(
            "role_permissions", 
            query_params={"role_id": role_id}
        )
        
        permissions = []
        for role_permission in role_permissions_data:
            permission_data = await fetch_one("permissions", {"id": role_permission["permission_id"]})
            if permission_data:
                permissions.append(Permission(**permission_data))
        
        return permissions
    
    @staticmethod
    async def get_role_with_permissions(role_id: int) -> Optional[RoleWithPermissions]:
        """
        Get a role with all its permissions.
        """
        role = await RBACService.get_role_by_id(role_id)
        if not role:
            return None
        
        permissions = await RBACService.get_role_permissions(role_id)
        
        return RoleWithPermissions(
            id=role.id,
            name=role.name,
            description=role.description,
            created_at=role.created_at,
            updated_at=role.updated_at,
            permissions=permissions
        )
    
    @staticmethod
    async def get_user_with_roles_and_permissions(user_id: str, user_email: str, user_name: str) -> UserWithRoles:
        """
        Get a user with all their roles and permissions.
        """
        roles = await RBACService.get_user_roles(user_id)
        
        all_permissions = set()
        for role in roles:
            permissions = await RBACService.get_role_permissions(role.id)
            all_permissions.update(permissions)
        
        return UserWithRoles(
            id=user_id,
            email=user_email,
            name=user_name,
            roles=roles,
            permissions=list(all_permissions)
        )
    
    @staticmethod
    async def has_permission(user_id: str, permission_name: str, resource: str) -> bool:
        """
        Check if a user has a specific permission on a resource.
        """
        # Get all roles for the user
        user_roles = await RBACService.get_user_roles(user_id)
        
        # For each role, check if it has the permission
        for role in user_roles:
            role_permissions = await RBACService.get_role_permissions(role.id)
            for permission in role_permissions:
                if permission.name == permission_name and permission.resource == resource:
                    return True
        
        return False 