"""
Authentication API endpoints.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends, Header
from typing import Optional
from sqlalchemy.orm import Session

from ..schemas.auth import (
    AnonymousUserResponse, TokenValidationRequest, TokenValidationResponse,
    SendVerificationEmailRequest, SendVerificationEmailResponse,
    VerifyEmailRequest, VerifyEmailResponse,
    SetPasswordRequest, SetPasswordResponse,
    EmailLoginRequest, EmailLoginResponse,
    SendPasswordResetRequest, SendPasswordResetResponse,
    ResetPasswordRequest, ResetPasswordResponse
)
from ..utils.auth import generate_anonymous_user_id, create_jwt_token, verify_jwt_token, extract_user_id_from_token
from ..utils.password import hash_password, verify_password, validate_password_strength
from ..services.email_service import EmailService
from ..models.user import User
from ..models.email_verification import EmailVerification
from ..database import get_db

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


# Email verification endpoints
@router.post("/email/send-verification", response_model=SendVerificationEmailResponse)
async def send_verification_email(
    request: SendVerificationEmailRequest,
    db: Session = Depends(get_db)
):
    """
    发送邮箱验证邮件。

    Args:
        request: 发送验证邮件请求
        db: 数据库会话

    Returns:
        SendVerificationEmailResponse: 发送结果
    """
    try:
        # 检查邮箱是否已被使用
        existing_user = db.query(User).filter(User.email == request.email).first()
        if existing_user and existing_user.email_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="该邮箱已被验证使用"
            )

        # 确定用户ID
        if request.user_id:
            # 关联现有匿名用户
            user = db.query(User).filter(User.installation_id == request.user_id).first()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="用户不存在"
                )
            user_id = user.installation_id
        else:
            # 创建新用户或使用现有未验证用户
            if existing_user:
                user_id = existing_user.installation_id
            else:
                # 创建新用户
                user_id = generate_anonymous_user_id()
                new_user = User(installation_id=user_id, email=request.email)
                db.add(new_user)
                db.commit()

        # 创建验证令牌
        verification = EmailVerification.create_verification_token(
            db=db,
            user_id=user_id,
            email=request.email,
            token_type="verify_email"
        )

        # 发送验证邮件
        email_service = EmailService()
        verification_url = f"{email_service.config.APP_BASE_URL}/auth/email/verify?token={verification.token}"

        await email_service.send_verification_email(
            to_email=request.email,
            user_name=request.email.split('@')[0],  # 使用邮箱前缀作为用户名
            verification_url=verification_url
        )

        return SendVerificationEmailResponse(
            success=True,
            message="验证邮件已发送，请检查您的邮箱",
            email=request.email,
            user_id=user_id
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"发送验证邮件失败: {str(e)}"
        )


@router.get("/email/verify", response_model=VerifyEmailResponse)
async def verify_email(
    token: str,
    db: Session = Depends(get_db)
):
    """
    验证邮箱地址。

    Args:
        token: 验证令牌
        db: 数据库会话

    Returns:
        VerifyEmailResponse: 验证结果
    """
    try:
        # 查找验证记录
        verification = db.query(EmailVerification).filter(
            EmailVerification.token == token,
            EmailVerification.token_type == "verify_email",
            EmailVerification.verified_at.is_(None)
        ).first()

        if not verification:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="无效的验证链接"
            )

        # 检查是否过期
        if verification.is_expired():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="验证链接已过期"
            )

        # 查找用户
        user = db.query(User).filter(User.installation_id == verification.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )

        # 更新用户邮箱验证状态
        user.email = verification.email
        user.email_verified = True
        user.email_verified_at = datetime.utcnow()

        # 标记验证记录为已验证
        verification.mark_as_verified(db)

        db.commit()

        return VerifyEmailResponse(
            success=True,
            message="邮箱验证成功",
            user_id=user.installation_id,
            email=user.email
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"邮箱验证失败: {str(e)}"
        )


@router.post("/email/set-password", response_model=SetPasswordResponse)
async def set_password(
    request: SetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    设置用户密码（邮箱验证后）。

    Args:
        request: 设置密码请求
        db: 数据库会话

    Returns:
        SetPasswordResponse: 设置结果
    """
    try:
        # 验证密码强度
        is_strong, errors = validate_password_strength(request.password)
        if not is_strong:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"密码不符合要求: {', '.join(errors)}"
            )

        # 查找验证记录
        verification = db.query(EmailVerification).filter(
            EmailVerification.token == request.token,
            EmailVerification.token_type == "verify_email",
            EmailVerification.verified_at.isnot(None)
        ).first()

        if not verification:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="无效的验证令牌或邮箱未验证"
            )

        # 查找用户
        user = db.query(User).filter(User.installation_id == verification.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )

        # 设置密码
        user.password_hash = hash_password(request.password)
        db.commit()

        return SetPasswordResponse(
            success=True,
            message="密码设置成功",
            user_id=user.installation_id
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"设置密码失败: {str(e)}"
        )


@router.post("/email/login", response_model=EmailLoginResponse)
async def email_login(
    request: EmailLoginRequest,
    db: Session = Depends(get_db)
):
    """
    邮箱密码登录。

    Args:
        request: 登录请求
        db: 数据库会话

    Returns:
        EmailLoginResponse: 登录结果
    """
    try:
        # 查找用户
        user = db.query(User).filter(
            User.email == request.email,
            User.email_verified == True
        ).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="邮箱或密码错误"
            )

        # 验证密码
        if not user.password_hash or not verify_password(request.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="邮箱或密码错误"
            )

        # 生成JWT令牌
        token = create_jwt_token(user.installation_id)

        return EmailLoginResponse(
            success=True,
            message="登录成功",
            user_id=user.installation_id,
            token=token,
            expires_in=7 * 24 * 3600
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"登录失败: {str(e)}"
        )


@router.post("/email/send-password-reset", response_model=SendPasswordResetResponse)
async def send_password_reset(
    request: SendPasswordResetRequest,
    db: Session = Depends(get_db)
):
    """
    发送密码重置邮件。

    Args:
        request: 发送密码重置邮件请求
        db: 数据库会话

    Returns:
        SendPasswordResetResponse: 发送结果
    """
    try:
        # 查找用户
        user = db.query(User).filter(
            User.email == request.email,
            User.email_verified == True
        ).first()

        if not user:
            # 出于安全考虑，即使用户不存在也返回成功
            return SendPasswordResetResponse(
                success=True,
                message="如果该邮箱存在，我们已向其发送密码重置邮件",
                email=request.email
            )

        # 创建重置令牌
        verification = EmailVerification.create_verification_token(
            db=db,
            user_id=user.installation_id,
            email=user.email,
            token_type="reset_password"
        )

        # 发送重置邮件
        email_service = EmailService()
        reset_url = f"{email_service.config.APP_BASE_URL}/auth/email/reset-password?token={verification.token}"

        await email_service.send_password_reset_email(
            to_email=user.email,
            user_name=user.email.split('@')[0],
            reset_url=reset_url
        )

        return SendPasswordResetResponse(
            success=True,
            message="密码重置邮件已发送，请检查您的邮箱",
            email=request.email
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"发送密码重置邮件失败: {str(e)}"
        )


@router.post("/email/reset-password", response_model=ResetPasswordResponse)
async def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    重置用户密码。

    Args:
        request: 重置密码请求
        db: 数据库会话

    Returns:
        ResetPasswordResponse: 重置结果
    """
    try:
        # 验证密码强度
        is_strong, errors = validate_password_strength(request.password)
        if not is_strong:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"密码不符合要求: {', '.join(errors)}"
            )

        # 查找重置记录
        verification = db.query(EmailVerification).filter(
            EmailVerification.token == request.token,
            EmailVerification.token_type == "reset_password",
            EmailVerification.verified_at.is_(None)
        ).first()

        if not verification:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="无效的重置链接"
            )

        # 检查是否过期
        if verification.is_expired():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="重置链接已过期"
            )

        # 查找用户
        user = db.query(User).filter(User.installation_id == verification.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )

        # 重置密码
        user.password_hash = hash_password(request.password)

        # 标记重置记录为已使用
        verification.mark_as_verified(db)

        db.commit()

        return ResetPasswordResponse(
            success=True,
            message="密码重置成功",
            user_id=user.installation_id
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"密码重置失败: {str(e)}"
        )