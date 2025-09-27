"""
Admin authentication and management API routes.
"""
from fastapi import APIRouter, HTTPException, status, Depends, Request, Query, Cookie
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, ValidationError
from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, asc, func, or_
from datetime import datetime, timedelta
import csv
import io

from app.admin.auth import admin_auth_service, get_current_admin
from app.database import get_db
from app.models.user import User, UserBalance
from app.models.transaction import CreditTransaction


def get_current_admin_from_cookie(admin_token: Optional[str] = Cookie(None)) -> str:
    """从Cookie获取当前管理员用户"""
    if not admin_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing admin authentication cookie"
        )

    username = admin_auth_service.verify_admin_token(admin_token)
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin authentication cookie"
        )

    return username


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


# ============================================================================
# 用户管理API路由
# ============================================================================

class UserListResponse(BaseModel):
    """用户列表响应模型"""
    success: bool = True
    users: List[dict]
    total: int
    page: int
    size: int


class UserDetailResponse(BaseModel):
    """用户详情响应模型"""
    success: bool = True
    user: dict


class AdjustCreditsRequest(BaseModel):
    """调整积分请求模型"""
    installation_id: str = Field(..., description="用户installation_id")
    credits: int = Field(..., description="积分变更量（正数增加，负数减少）")
    reason: str = Field(..., description="调整原因")


class AdjustCreditsResponse(BaseModel):
    """调整积分响应模型"""
    success: bool = True
    message: str
    new_balance: int


# 创建用户管理路由组
user_router = APIRouter(prefix="/api/v1/admin", tags=["admin-users"])


@user_router.get("/users", response_model=UserListResponse)
async def get_users(
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(20, ge=1, le=100, description="每页数量"),
    installation_id: Optional[str] = Query(None, description="用户ID筛选"),
    min_credits: Optional[int] = Query(None, ge=0, description="最低积分筛选"),
    date_range: Optional[str] = Query(None, description="注册时间筛选"),
    current_admin: str = Depends(get_current_admin_from_cookie),
    db: Session = Depends(get_db)
):
    """
    获取用户列表（分页）

    支持以下筛选条件：
    - installation_id: 用户ID搜索
    - min_credits: 最低积分筛选
    - date_range: 注册时间筛选（today, week, month）
    """
    try:
        # 构建查询
        query = db.query(User).options(joinedload(User.balance))

        # 应用筛选条件
        if installation_id:
            query = query.filter(User.installation_id.contains(installation_id))

        if date_range:
            now = datetime.utcnow()
            if date_range == "today":
                start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            elif date_range == "week":
                start_date = now - timedelta(days=7)
            elif date_range == "month":
                start_date = now - timedelta(days=30)
            else:
                start_date = None

            if start_date:
                query = query.filter(User.created_at >= start_date)

        if min_credits is not None:
            query = query.join(UserBalance).filter(UserBalance.credits >= min_credits)

        # 计算总数
        total = query.count()

        # 分页查询
        offset = (page - 1) * size
        users = query.order_by(desc(User.created_at)).offset(offset).limit(size).all()

        # 格式化响应数据
        user_list = []
        for user in users:
            balance = user.balance.credits if user.balance else 0
            user_list.append({
                "installation_id": user.installation_id,
                "credits": balance,
                "total_credits_purchased": user.total_credits_purchased,
                "total_credits_consumed": user.total_credits_consumed,
                "created_at": user.created_at.isoformat(),
                "last_active_at": user.last_active_at.isoformat()
            })

        return UserListResponse(
            users=user_list,
            total=total,
            page=page,
            size=size
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取用户列表失败: {str(e)}"
        )


@user_router.get("/users/{installation_id}", response_model=UserDetailResponse)
async def get_user_detail(
    installation_id: str,
    current_admin: str = Depends(get_current_admin_from_cookie),
    db: Session = Depends(get_db)
):
    """获取用户详情信息"""
    try:
        # 查询用户
        user = db.query(User).options(
            joinedload(User.balance)
        ).filter(User.installation_id == installation_id).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )

        # 查询最近交易记录
        recent_transactions = db.query(CreditTransaction).filter(
            CreditTransaction.user_id == user.id
        ).order_by(desc(CreditTransaction.created_at)).limit(10).all()

        # 格式化用户数据
        user_detail = {
            "installation_id": user.installation_id,
            "credits": user.balance.credits if user.balance else 0,
            "total_credits_purchased": user.total_credits_purchased,
            "total_credits_consumed": user.total_credits_consumed,
            "created_at": user.created_at.isoformat(),
            "last_active_at": user.last_active_at.isoformat(),
            "recent_transactions": [
                {
                    "type": tx.type,
                    "credits": tx.credits,
                    "balance_after": tx.balance_after,
                    "description": tx.description,
                    "created_at": tx.created_at.isoformat()
                } for tx in recent_transactions
            ]
        }

        return UserDetailResponse(user=user_detail)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取用户详情失败: {str(e)}"
        )


@user_router.post("/users/adjust-credits", response_model=AdjustCreditsResponse)
async def adjust_user_credits(
    request: AdjustCreditsRequest,
    current_admin: str = Depends(get_current_admin_from_cookie),
    db: Session = Depends(get_db)
):
    """管理员调整用户积分"""
    try:
        # 查询用户
        user = db.query(User).filter(
            User.installation_id == request.installation_id
        ).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )

        # 获取或创建用户余额记录
        balance = db.query(UserBalance).filter(UserBalance.user_id == user.id).first()
        if not balance:
            balance = UserBalance(user_id=user.id, credits=0)
            db.add(balance)
            db.flush()

        # 计算新余额
        new_balance = balance.credits + request.credits
        if new_balance < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="积分余额不足，无法减少该数量的积分"
            )

        # 更新余额（使用乐观锁）
        old_version = balance.version
        balance.credits = new_balance
        balance.version += 1
        balance.updated_at = datetime.utcnow()

        # 创建交易记录
        transaction = CreditTransaction(
            user_id=user.id,
            type="admin_adjust",
            credits=request.credits,
            balance_after=new_balance,
            reference_type="admin",
            description=f"管理员调整：{request.reason}",
            created_at=datetime.utcnow()
        )
        db.add(transaction)

        # 更新用户统计
        if request.credits > 0:
            user.total_credits_purchased += request.credits
        else:
            user.total_credits_consumed += abs(request.credits)

        # 提交事务
        db.commit()

        return AdjustCreditsResponse(
            message=f"积分调整成功：{request.credits:+d}",
            new_balance=new_balance
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"积分调整失败: {str(e)}"
        )


@user_router.get("/users/export")
async def export_users(
    installation_id: Optional[str] = Query(None),
    min_credits: Optional[int] = Query(None),
    date_range: Optional[str] = Query(None),
    current_admin: str = Depends(get_current_admin_from_cookie),
    db: Session = Depends(get_db)
):
    """导出用户数据为CSV文件"""
    try:
        # 构建查询（与获取用户列表相同的逻辑）
        query = db.query(User).options(joinedload(User.balance))

        if installation_id:
            query = query.filter(User.installation_id.contains(installation_id))

        if date_range:
            now = datetime.utcnow()
            if date_range == "today":
                start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            elif date_range == "week":
                start_date = now - timedelta(days=7)
            elif date_range == "month":
                start_date = now - timedelta(days=30)
            else:
                start_date = None

            if start_date:
                query = query.filter(User.created_at >= start_date)

        if min_credits is not None:
            query = query.join(UserBalance).filter(UserBalance.credits >= min_credits)

        # 获取所有用户数据
        users = query.order_by(desc(User.created_at)).all()

        # 创建CSV内容
        output = io.StringIO()
        writer = csv.writer(output)

        # 写入表头
        writer.writerow([
            "用户ID", "当前积分", "累计购买", "累计消费", "注册时间", "最后活跃时间"
        ])

        # 写入数据
        for user in users:
            balance = user.balance.credits if user.balance else 0
            writer.writerow([
                user.installation_id,
                balance,
                user.total_credits_purchased,
                user.total_credits_consumed,
                user.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                user.last_active_at.strftime("%Y-%m-%d %H:%M:%S")
            ])

        # 准备响应
        output.seek(0)
        filename = f"users_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"

        return StreamingResponse(
            io.BytesIO(output.getvalue().encode('utf-8-sig')),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"导出用户数据失败: {str(e)}"
        )