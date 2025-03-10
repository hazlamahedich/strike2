from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models.rbac import (
    RoleCreate, RoleUpdate, Role, 
    PermissionCreate, PermissionUpdate, Permission,
    UserRoleCreate, UserRole,
    RolePermissionCreate, RolePermission,
    RoleWithPermissions, UserWithRoles,
    UserPermissionCheck
)
from app.core.database import get_db
from app.services.rbac import RBACService
from app.core.auth import get_current_user, get_current_active_user

router = APIRouter(prefix="/rbac", tags=["rbac"])

# Role endpoints
@router.get("/roles", response_model=List[Role])
async def get_roles(
    skip: int = 0,
    limit: int = 100,
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Get all roles.
    """
    # Check if user has permission to view roles
    has_permission = await RBACService.has_permission(
        user_id=current_user["id"],
        permission_name="view_roles",
        resource="roles"
    )
    
    if not has_permission and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return await RBACService.get_roles(skip=skip, limit=limit)

@router.get("/roles/{role_id}", response_model=RoleWithPermissions)
async def get_role(
    role_id: int,
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Get a specific role by ID with its permissions.
    """
    # Check if user has permission to view roles
    has_permission = await RBACService.has_permission(
        user_id=current_user["id"],
        permission_name="view_roles",
        resource="roles"
    )
    
    if not has_permission and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    role = await RBACService.get_role_with_permissions(role_id)
    if role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with ID {role_id} not found"
        )
    return role

@router.post("/roles", response_model=Role, status_code=status.HTTP_201_CREATED)
async def create_role(
    role: RoleCreate,
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Create a new role.
    """
    # Check if user has permission to manage roles
    has_permission = await RBACService.has_permission(
        user_id=current_user["id"],
        permission_name="manage_roles",
        resource="roles"
    )
    
    if not has_permission and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if role with this name already exists
    existing_role = await RBACService.get_role_by_name(role.name)
    if existing_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Role with name '{role.name}' already exists"
        )
    
    return await RBACService.create_role(role)

@router.put("/roles/{role_id}", response_model=Role)
async def update_role(
    role_id: int,
    role: RoleUpdate,
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Update a role.
    """
    # Check if user has permission to manage roles
    has_permission = await RBACService.has_permission(
        user_id=current_user["id"],
        permission_name="manage_roles",
        resource="roles"
    )
    
    if not has_permission and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if role exists
    existing_role = await RBACService.get_role_by_id(role_id)
    if not existing_role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with ID {role_id} not found"
        )
    
    # If name is being updated, check if it's unique
    if role.name and role.name != existing_role.name:
        name_exists = await RBACService.get_role_by_name(role.name)
        if name_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Role with name '{role.name}' already exists"
            )
    
    return await RBACService.update_role(role_id, role)

@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(
    role_id: int,
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Delete a role.
    """
    # Check if user has permission to manage roles
    has_permission = await RBACService.has_permission(
        user_id=current_user["id"],
        permission_name="manage_roles",
        resource="roles"
    )
    
    if not has_permission and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if role exists
    existing_role = await RBACService.get_role_by_id(role_id)
    if not existing_role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with ID {role_id} not found"
        )
    
    await RBACService.delete_role(role_id)
    return {"detail": "Role deleted successfully"}

# Permission endpoints
@router.get("/permissions", response_model=List[Permission])
async def get_permissions(
    skip: int = 0,
    limit: int = 100,
    resource: Optional[str] = None,
    action: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Get all permissions with optional filtering.
    """
    # Check if user has permission to view permissions
    has_permission = await RBACService.has_permission(
        user_id=current_user["id"],
        permission_name="view_roles",
        resource="roles"
    )
    
    if not has_permission and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return await RBACService.get_permissions(skip=skip, limit=limit, resource=resource, action=action)

@router.get("/permissions/{permission_id}", response_model=Permission)
async def get_permission(
    permission_id: int,
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Get a specific permission by ID.
    """
    # Check if user has permission to view permissions
    has_permission = await RBACService.has_permission(
        user_id=current_user["id"],
        permission_name="view_roles",
        resource="roles"
    )
    
    if not has_permission and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    permission = await RBACService.get_permission_by_id(permission_id)
    if permission is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Permission with ID {permission_id} not found"
        )
    return permission

@router.post("/permissions", response_model=Permission, status_code=status.HTTP_201_CREATED)
async def create_permission(
    permission: PermissionCreate,
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Create a new permission.
    """
    # Check if user has permission to manage roles
    has_permission = await RBACService.has_permission(
        user_id=current_user["id"],
        permission_name="manage_roles",
        resource="roles"
    )
    
    if not has_permission and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if permission with this name already exists
    existing_permission = await RBACService.get_permission_by_name(permission.name)
    if existing_permission:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Permission with name '{permission.name}' already exists"
        )
    
    return await RBACService.create_permission(permission)

@router.put("/permissions/{permission_id}", response_model=Permission)
async def update_permission(
    permission_id: int,
    permission: PermissionUpdate,
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Update a permission.
    """
    # Check if user has permission to manage roles
    has_permission = await RBACService.has_permission(
        user_id=current_user["id"],
        permission_name="manage_roles",
        resource="roles"
    )
    
    if not has_permission and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if permission exists
    existing_permission = await RBACService.get_permission_by_id(permission_id)
    if not existing_permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Permission with ID {permission_id} not found"
        )
    
    # If name is being updated, check if it's unique
    if permission.name and permission.name != existing_permission.name:
        name_exists = await RBACService.get_permission_by_name(permission.name)
        if name_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Permission with name '{permission.name}' already exists"
            )
    
    return await RBACService.update_permission(permission_id, permission)

@router.delete("/permissions/{permission_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_permission(
    permission_id: int,
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Delete a permission.
    """
    # Check if user has permission to manage roles
    has_permission = await RBACService.has_permission(
        user_id=current_user["id"],
        permission_name="manage_roles",
        resource="roles"
    )
    
    if not has_permission and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if permission exists
    existing_permission = await RBACService.get_permission_by_id(permission_id)
    if not existing_permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Permission with ID {permission_id} not found"
        )
    
    await RBACService.delete_permission(permission_id)
    return {"detail": "Permission deleted successfully"}

# User Role endpoints
@router.get("/users/{user_id}/roles", response_model=List[Role])
async def get_user_roles(
    user_id: str,
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Get all roles for a user.
    """
    # Check if user has permission to view roles or is viewing their own roles
    has_permission = await RBACService.has_permission(
        user_id=current_user["id"],
        permission_name="view_roles",
        resource="roles"
    )
    
    if not has_permission and current_user["id"] != user_id and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return await RBACService.get_user_roles(user_id)

@router.post("/users/{user_id}/roles", response_model=UserRole, status_code=status.HTTP_201_CREATED)
async def assign_role_to_user(
    user_id: str,
    role_id: int = Body(..., embed=True),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Assign a role to a user.
    """
    # Check if user has permission to manage roles
    has_permission = await RBACService.has_permission(
        user_id=current_user["id"],
        permission_name="manage_roles",
        resource="roles"
    )
    
    if not has_permission and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if role exists
    role = await RBACService.get_role_by_id(role_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with ID {role_id} not found"
        )
    
    return await RBACService.assign_role_to_user(user_id, role_id)

@router.delete("/users/{user_id}/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_role_from_user(
    user_id: str,
    role_id: int,
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Remove a role from a user.
    """
    # Check if user has permission to manage roles
    has_permission = await RBACService.has_permission(
        user_id=current_user["id"],
        permission_name="manage_roles",
        resource="roles"
    )
    
    if not has_permission and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if role exists
    role = await RBACService.get_role_by_id(role_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with ID {role_id} not found"
        )
    
    await RBACService.remove_role_from_user(user_id, role_id)
    return {"detail": "Role removed from user successfully"}

# Role Permission endpoints
@router.get("/roles/{role_id}/permissions", response_model=List[Permission])
async def get_role_permissions(
    role_id: int,
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Get all permissions for a role.
    """
    # Check if user has permission to view roles
    has_permission = await RBACService.has_permission(
        user_id=current_user["id"],
        permission_name="view_roles",
        resource="roles"
    )
    
    if not has_permission and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if role exists
    role = await RBACService.get_role_by_id(role_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with ID {role_id} not found"
        )
    
    return await RBACService.get_role_permissions(role_id)

@router.post("/roles/{role_id}/permissions", response_model=RolePermission, status_code=status.HTTP_201_CREATED)
async def assign_permission_to_role(
    role_id: int,
    permission_id: int = Body(..., embed=True),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Assign a permission to a role.
    """
    # Check if user has permission to manage roles
    has_permission = await RBACService.has_permission(
        user_id=current_user["id"],
        permission_name="manage_roles",
        resource="roles"
    )
    
    if not has_permission and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if role exists
    role = await RBACService.get_role_by_id(role_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with ID {role_id} not found"
        )
    
    # Check if permission exists
    permission = await RBACService.get_permission_by_id(permission_id)
    if not permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Permission with ID {permission_id} not found"
        )
    
    return await RBACService.assign_permission_to_role(role_id, permission_id)

@router.delete("/roles/{role_id}/permissions/{permission_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_permission_from_role(
    role_id: int,
    permission_id: int,
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Remove a permission from a role.
    """
    # Check if user has permission to manage roles
    has_permission = await RBACService.has_permission(
        user_id=current_user["id"],
        permission_name="manage_roles",
        resource="roles"
    )
    
    if not has_permission and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if role exists
    role = await RBACService.get_role_by_id(role_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with ID {role_id} not found"
        )
    
    # Check if permission exists
    permission = await RBACService.get_permission_by_id(permission_id)
    if not permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Permission with ID {permission_id} not found"
        )
    
    await RBACService.remove_permission_from_role(role_id, permission_id)
    return {"detail": "Permission removed from role successfully"}

# User Permission check endpoint
@router.post("/check-permission", response_model=Dict[str, bool])
async def check_permission(
    permission_check: UserPermissionCheck,
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Check if the current user has a specific permission on a resource.
    """
    has_permission = await RBACService.has_permission(
        user_id=current_user["id"],
        permission_name=permission_check.permission_name,
        resource=permission_check.resource
    )
    
    # Admin users always have all permissions
    if current_user.get("role") == "admin":
        has_permission = True
    
    return {"has_permission": has_permission}

# Current user permissions endpoint
@router.get("/me/permissions", response_model=UserWithRoles)
async def get_current_user_permissions(
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Get all roles and permissions for the current user.
    """
    return await RBACService.get_user_with_roles_and_permissions(
        user_id=current_user["id"],
        user_email=current_user["email"],
        user_name=current_user.get("name", "")
    ) 