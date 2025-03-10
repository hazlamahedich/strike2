from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from typing import Callable, Dict, Any, Optional
import jwt
from jwt.exceptions import PyJWTError

from app.core.config import settings
from app.services.rbac import RBACService


class RBACMiddleware:
    """
    Middleware for RBAC permission checking.
    """
    
    def __init__(
        self,
        app,
        exclude_paths: list = None,
        admin_paths: list = None
    ):
        self.app = app
        self.exclude_paths = exclude_paths or ["/api/auth", "/docs", "/redoc", "/openapi.json"]
        self.admin_paths = admin_paths or ["/api/rbac"]
    
    async def __call__(self, request: Request, call_next):
        # Skip RBAC check for excluded paths
        path = request.url.path
        if any(path.startswith(excluded) for excluded in self.exclude_paths):
            return await call_next(request)
        
        # Get the authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            # If no auth header, allow the request to proceed
            # The endpoint will handle authentication if required
            return await call_next(request)
        
        # Extract the token
        token = auth_header.replace("Bearer ", "")
        
        try:
            # Decode the token
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM]
            )
            user_id = payload.get("sub")
            user_role = payload.get("role")
            
            # If user is admin, allow access to all paths
            if user_role == "admin":
                return await call_next(request)
            
            # Check if path is admin-only
            if any(path.startswith(admin_path) for admin_path in self.admin_paths) and user_role != "admin":
                # For admin paths, check if user has specific permissions
                # This is a fallback in case the endpoint doesn't check permissions
                has_permission = await self._check_permission(user_id, path, request.method)
                if not has_permission:
                    return JSONResponse(
                        status_code=status.HTTP_403_FORBIDDEN,
                        content={"detail": "Not enough permissions"}
                    )
            
            # For other paths, let the endpoint handle permission checking
            return await call_next(request)
            
        except PyJWTError:
            # If token is invalid, let the endpoint handle it
            return await call_next(request)
        except Exception as e:
            # For any other error, let the endpoint handle it
            return await call_next(request)
    
    async def _check_permission(self, user_id: str, path: str, method: str) -> bool:
        """
        Check if a user has permission to access a path with a specific method.
        """
        # Map HTTP methods to actions
        method_to_action = {
            "GET": "read",
            "POST": "create",
            "PUT": "update",
            "PATCH": "update",
            "DELETE": "delete"
        }
        
        action = method_to_action.get(method, "read")
        
        # Map path to resource
        resource = self._path_to_resource(path)
        
        # Check if user has permission
        return await RBACService.has_permission(
            user_id=user_id,
            permission_name=f"{action}_{resource}",
            resource=resource
        )
    
    def _path_to_resource(self, path: str) -> str:
        """
        Convert a path to a resource name.
        """
        # Remove /api/ prefix
        if path.startswith("/api/"):
            path = path[5:]
        
        # Get the first part of the path
        parts = path.split("/")
        if len(parts) > 1:
            return parts[1]
        
        return "unknown"


def add_rbac_middleware(app):
    """
    Add RBAC middleware to the app.
    """
    app.add_middleware(RBACMiddleware) 