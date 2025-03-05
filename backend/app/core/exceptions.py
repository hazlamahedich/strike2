from fastapi import HTTPException, status
from typing import Optional, Dict, Any, List

class CRMException(Exception):
    """Base exception class for CRM system"""
    def __init__(
        self, 
        message: str, 
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code: str = "internal_error",
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary format"""
        return {
            "error_code": self.error_code,
            "message": self.message,
            "details": self.details
        }

class ResourceNotFoundException(CRMException):
    """Exception raised when a requested resource is not found"""
    def __init__(
        self, 
        message: str = "The requested resource was not found",
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None
    ):
        details = {}
        if resource_type:
            details["resource_type"] = resource_type
        if resource_id:
            details["resource_id"] = resource_id
            
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="resource_not_found",
            details=details
        )

class ValidationException(CRMException):
    """Exception raised when data validation fails"""
    def __init__(
        self, 
        message: str = "Data validation failed",
        field_errors: Optional[Dict[str, str]] = None
    ):
        details = {"field_errors": field_errors or {}}
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code="validation_error",
            details=details
        )

class AuthenticationException(CRMException):
    """Exception raised for authentication errors"""
    def __init__(
        self, 
        message: str = "Authentication failed",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="authentication_error",
            details=details
        )

class AuthorizationException(CRMException):
    """Exception raised for authorization errors"""
    def __init__(
        self, 
        message: str = "You don't have permission to perform this action",
        required_role: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        _details = details or {}
        if required_role:
            _details["required_role"] = required_role
            
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="authorization_error",
            details=_details
        )

class DatabaseException(CRMException):
    """Exception raised for database errors"""
    def __init__(
        self, 
        message: str = "Database operation failed",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="database_error",
            details=details
        )

class ThirdPartyServiceException(CRMException):
    """Exception raised for errors with third-party services"""
    def __init__(
        self, 
        message: str = "Third-party service error",
        service_name: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        _details = details or {}
        if service_name:
            _details["service_name"] = service_name
            
        super().__init__(
            message=message,
            status_code=status.HTTP_502_BAD_GATEWAY,
            error_code="third_party_error",
            details=_details
        )

class RateLimitException(CRMException):
    """Exception raised when rate limits are exceeded"""
    def __init__(
        self, 
        message: str = "Rate limit exceeded",
        limit: Optional[int] = None,
        reset_at: Optional[str] = None
    ):
        details = {}
        if limit:
            details["limit"] = limit
        if reset_at:
            details["reset_at"] = reset_at
            
        super().__init__(
            message=message,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            error_code="rate_limit_exceeded",
            details=details
        ) 