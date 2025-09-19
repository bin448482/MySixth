"""
Authentication-related Pydantic schemas.
"""
from pydantic import BaseModel


class AnonymousUserResponse(BaseModel):
    """匿名用户创建响应"""
    user_id: str
    token: str
    expires_in: int = 7 * 24 * 3600  # 7天，以秒为单位


class TokenValidationRequest(BaseModel):
    """令牌验证请求"""
    token: str


class TokenValidationResponse(BaseModel):
    """令牌验证响应"""
    valid: bool
    user_id: str | None = None
    expires_at: str | None = None