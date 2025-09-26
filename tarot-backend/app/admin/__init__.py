"""
Admin module for management portal authentication and routes.
"""
from .auth import admin_auth_service, get_current_admin, require_admin
from .routes import router as admin_router

__all__ = [
    "admin_auth_service",
    "get_current_admin",
    "require_admin",
    "admin_router"
]