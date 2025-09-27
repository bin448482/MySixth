"""
Admin authentication utilities and dependencies.
"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.hash import bcrypt

from app.config import settings


# HTTP Bearer token scheme
bearer_scheme = HTTPBearer()


class AdminAuthService:
    """Admin authentication service."""

    def __init__(self):
        self.secret_key = settings.JWT_SECRET_KEY
        self.algorithm = settings.JWT_ALGORITHM
        self.expire_hours = settings.ADMIN_SESSION_EXPIRE_HOURS

    def verify_credentials(self, username: str, password: str) -> bool:
        """
        Verify admin credentials.

        Args:
            username: Admin username
            password: Plain text password

        Returns:
            True if credentials are valid, False otherwise
        """
        if username != settings.ADMIN_USERNAME:
            return False

        # In production, this should use hashed passwords
        # For development, we use plain text comparison
        return password == settings.ADMIN_PASSWORD

    def create_admin_token(self, username: str) -> str:
        """
        Create a JWT token for admin authentication.

        Args:
            username: Admin username

        Returns:
            JWT token string
        """
        expire = datetime.utcnow() + timedelta(hours=self.expire_hours)
        payload = {
            "sub": username,
            "type": "admin",
            "exp": expire,
            "iat": datetime.utcnow()
        }

        token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
        return token

    def verify_admin_token(self, token: str) -> Optional[str]:
        """
        Verify admin JWT token and return username if valid.

        Args:
            token: JWT token string

        Returns:
            Username if token is valid, None otherwise
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            username = payload.get("sub")
            token_type = payload.get("type")

            if username is None or token_type != "admin":
                return None

            return username

        except JWTError:
            return None

    def hash_password(self, password: str) -> str:
        """
        Hash a password using bcrypt.

        Args:
            password: Plain text password

        Returns:
            Hashed password string
        """
        return bcrypt.hash(password)

    def verify_password(self, password: str, hashed_password: str) -> bool:
        """
        Verify a password against its hash.

        Args:
            password: Plain text password
            hashed_password: Hashed password

        Returns:
            True if password matches, False otherwise
        """
        return bcrypt.verify(password, hashed_password)


# Global instance
admin_auth_service = AdminAuthService()


def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> str:
    """
    FastAPI dependency to get current authenticated admin user.

    Args:
        credentials: HTTP Bearer credentials

    Returns:
        Admin username

    Raises:
        HTTPException: If authentication fails
    """
    username = admin_auth_service.verify_admin_token(credentials.credentials)

    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return username


def require_admin(current_admin: str = Depends(get_current_admin)) -> str:
    """
    FastAPI dependency that requires admin authentication.

    Args:
        current_admin: Current admin username from get_current_admin

    Returns:
        Admin username

    Raises:
        HTTPException: If user is not admin
    """
    # Additional admin validation can be added here
    # For now, if the token is valid, user is admin
    return current_admin