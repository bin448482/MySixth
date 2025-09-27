"""
Admin authentication API routes.
"""
from fastapi import APIRouter, HTTPException, status, Depends, Request
from pydantic import BaseModel, Field, ValidationError
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


router = APIRouter(prefix="/admin-api", tags=["admin-auth"])




async def parse_admin_login_payload(request: Request) -> AdminLoginRequest:
    """Parse admin login payload from JSON or form submissions."""
    content_type = (request.headers.get("content-type") or "").lower()

    data = None
    try:
        if "application/json" in content_type:
            data = await request.json()
        elif "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type:
            form = await request.form()
            data = dict(form.multi_items()) if hasattr(form, 'multi_items') else dict(form)
        else:
            data = await request.json()
    except Exception:
        try:
            form = await request.form()
            data = dict(form.multi_items()) if hasattr(form, 'multi_items') else dict(form)
        except Exception:
            data = None

    if not data:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Username and password are required"
        )

    try:
        return AdminLoginRequest.model_validate(data)
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.errors()
        )

@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(login_request: AdminLoginRequest = Depends(parse_admin_login_payload)):
    """
    Admin login endpoint.

    Authenticates admin credentials and returns a JWT token.
    """
    try:
        # Verify credentials
        if not admin_auth_service.verify_credentials(login_request.username, login_request.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )

        # Create JWT token
        token = admin_auth_service.create_admin_token(login_request.username)

        return AdminLoginResponse(
            access_token=token,
            expires_in=admin_auth_service.expire_hours * 3600,  # Convert to seconds
            username=login_request.username
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