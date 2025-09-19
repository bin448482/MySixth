"""
Authentication API endpoints.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends, Header
from typing import Optional

from ..schemas.auth import AnonymousUserResponse, TokenValidationRequest, TokenValidationResponse
from ..utils.auth import generate_anonymous_user_id, create_jwt_token, verify_jwt_token, extract_user_id_from_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/anon", response_model=AnonymousUserResponse)
async def create_anonymous_user():
    """
    生成匿名用户ID和JWT token。

    Returns:
        AnonymousUserResponse: 包含用户ID和JWT令牌的响应
    """
    try:
        # 生成匿名用户ID
        user_id = generate_anonymous_user_id()

        # 创建JWT令牌
        token = create_jwt_token(user_id)

        return AnonymousUserResponse(
            user_id=user_id,
            token=token,
            expires_in=7 * 24 * 3600  # 7天
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create anonymous user: {str(e)}"
        )


@router.post("/validate", response_model=TokenValidationResponse)
async def validate_token(request: TokenValidationRequest):
    """
    验证JWT令牌的有效性。

    Args:
        request: 包含待验证令牌的请求

    Returns:
        TokenValidationResponse: 验证结果
    """
    try:
        payload = verify_jwt_token(request.token)

        # 提取信息
        user_id = payload.get("sub")
        expires_at = datetime.fromtimestamp(payload.get("exp"), tz=timezone.utc).isoformat()

        return TokenValidationResponse(
            valid=True,
            user_id=user_id,
            expires_at=expires_at
        )

    except HTTPException:
        return TokenValidationResponse(
            valid=False,
            user_id=None,
            expires_at=None
        )


# 依赖注入函数：从请求头中获取当前用户ID
async def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    """
    从Authorization头中提取用户ID的依赖注入函数。

    Args:
        authorization: Authorization请求头

    Returns:
        str: 用户ID

    Raises:
        HTTPException: 认证失败时抛出401错误
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is required"
        )

    # 检查Bearer格式
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Expected: Bearer <token>"
        )

    # 提取令牌
    token = authorization[7:]  # 移除 "Bearer " 前缀

    # 验证令牌并提取用户ID
    return extract_user_id_from_token(token)


# 可选认证的依赖注入函数
async def get_current_user_id_optional(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """
    可选的用户ID提取函数，认证失败时返回None而不抛出异常。

    Args:
        authorization: Authorization请求头

    Returns:
        Optional[str]: 用户ID，认证失败时为None
    """
    try:
        return await get_current_user_id(authorization)
    except HTTPException:
        return None