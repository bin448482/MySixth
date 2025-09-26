"""
Admin authentication API routes.
"""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import Optional

from app.admin.auth import admin_auth_service, get_current_admin


class AdminLoginRequest(BaseModel):
    """Admin login request schema."""
    username: str = Field(..., description="Admin username")
    password: str = Field(..., description="Admin password")


class AdminLoginResponse(BaseModel):
    """Admin login response schema."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    username: str


class AdminProfileResponse(BaseModel):
    """Admin profile response schema."""
    username: str
    role: str = "admin"
    authenticated: bool = True


router = APIRouter(prefix="/admin", tags=["admin-auth"])


@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(request: AdminLoginRequest):
    """
    Admin login endpoint.

    Authenticates admin credentials and returns a JWT token.
    """
    try:
        # Verify credentials
        if not admin_auth_service.verify_credentials(request.username, request.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )

        # Create JWT token
        token = admin_auth_service.create_admin_token(request.username)

        return AdminLoginResponse(
            access_token=token,
            expires_in=admin_auth_service.expire_hours * 3600,  # Convert to seconds
            username=request.username
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


@router.get("/profile", response_model=AdminProfileResponse)
async def get_admin_profile(current_admin: str = Depends(get_current_admin)):
    """
    Get current admin profile information.

    Requires valid admin authentication.
    """
    return AdminProfileResponse(
        username=current_admin
    )


@router.post("/logout")
async def admin_logout(current_admin: str = Depends(get_current_admin)):
    """
    Admin logout endpoint.

    Note: Since we're using stateless JWT tokens, logout is handled
    on the client side by discarding the token.
    """
    return {
        "message": "Successfully logged out",
        "username": current_admin
    }


@router.post("/refresh")
async def refresh_admin_token(current_admin: str = Depends(get_current_admin)):
    """
    Refresh admin JWT token.

    Returns a new token with extended expiration time.
    """
    try:
        # Create new token
        new_token = admin_auth_service.create_admin_token(current_admin)

        return {
            "access_token": new_token,
            "token_type": "bearer",
            "expires_in": admin_auth_service.expire_hours * 3600,
            "username": current_admin
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to refresh token"
        )