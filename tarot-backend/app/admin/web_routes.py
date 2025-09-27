"""
Admin web interface routes for the management portal.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Form, Request, Cookie
from fastapi.responses import RedirectResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from app.admin.auth import admin_auth_service
from app.services.dashboard_service import dashboard_service
from app.database import get_db
from typing import Optional
import os

# Initialize Jinja2 templates
templates_dir = os.path.join(os.path.dirname(__file__), "templates")
templates = Jinja2Templates(directory=templates_dir)

router = APIRouter(prefix="/admin", tags=["admin-web"])


# Authentication middleware for web pages
async def require_web_admin(request: Request, admin_token: Optional[str] = Cookie(None)):
    """Require admin authentication for web pages."""
    if not admin_token:
        return RedirectResponse(url="/admin/login", status_code=status.HTTP_302_FOUND)

    try:
        admin_auth_service.verify_admin_token(admin_token)
        return True
    except:
        return RedirectResponse(url="/admin/login", status_code=status.HTTP_302_FOUND)


@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request, error: Optional[str] = None):
    """Admin login page."""
    return templates.TemplateResponse("login.html", {
        "request": request,
        "error": error
    })


@router.post("/login", response_class=HTMLResponse)
async def login_submit(
    request: Request
):
    """Handle login form submission."""
    try:
        # Parse form data
        form = await request.form()
        username = form.get("username")
        password = form.get("password")
        remember = form.get("remember")

        if not username or not password:
            return templates.TemplateResponse("login.html", {
                "request": request,
                "error": "用户名和密码不能为空",
                "username": username or ""
            })

        # Verify credentials
        if not admin_auth_service.verify_credentials(username, password):
            return templates.TemplateResponse("login.html", {
                "request": request,
                "error": "用户名或密码错误",
                "username": username
            })

        # Create JWT token
        token = admin_auth_service.create_admin_token(username)

        # Create redirect response to dashboard
        response = RedirectResponse(url="/admin/dashboard", status_code=status.HTTP_302_FOUND)

        # Set cookie with JWT token
        max_age = admin_auth_service.expire_hours * 3600 if remember else None
        response.set_cookie(
            key="admin_token",
            value=token,
            max_age=max_age,
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite="lax"
        )

        return response

    except Exception as e:
        return templates.TemplateResponse("login.html", {
            "request": request,
            "error": "登录失败，请稍后重试",
            "username": username
        })


@router.get("/logout")
async def logout():
    """Admin logout."""
    response = RedirectResponse(url="/admin/login", status_code=status.HTTP_302_FOUND)
    response.delete_cookie("admin_token")
    return response


@router.get("/dashboard", response_class=HTMLResponse)
async def dashboard(
    request: Request,
    db: Session = Depends(get_db),
    admin_check: bool = Depends(require_web_admin)
):
    """Admin dashboard page."""
    if isinstance(admin_check, RedirectResponse):
        return admin_check

    try:
        # Get dashboard data
        metrics = await dashboard_service.get_dashboard_metrics(db)
        chart_data = await dashboard_service.get_chart_data(db)
        recent_activities = await dashboard_service.get_recent_activities(db)

        return templates.TemplateResponse("dashboard.html", {
            "request": request,
            "metrics": metrics,
            "chart_data": chart_data,
            "recent_activities": recent_activities
        })

    except Exception as e:
        # Log error and show basic dashboard
        print(f"Dashboard error: {e}")
        return templates.TemplateResponse("dashboard.html", {
            "request": request,
            "metrics": {},
            "chart_data": {
                "revenue_labels": [],
                "revenue_data": [],
                "user_growth_labels": [],
                "user_growth_data": [],
                "platform_labels": ["Google Play", "兑换码", "其他"],
                "platform_data": [0, 0, 0]
            },
            "recent_activities": []
        })


@router.get("/users", response_class=HTMLResponse)
async def users_page(
    request: Request,
    admin_check: bool = Depends(require_web_admin)
):
    """User management page."""
    if isinstance(admin_check, RedirectResponse):
        return admin_check

    return templates.TemplateResponse("users.html", {
        "request": request
    })


@router.get("/redeem-codes", response_class=HTMLResponse)
async def redeem_codes_page(
    request: Request,
    admin_check: bool = Depends(require_web_admin)
):
    """Redeem codes management page."""
    if isinstance(admin_check, RedirectResponse):
        return admin_check

    # TODO: Implement redeem codes management page
    return templates.TemplateResponse("base.html", {
        "request": request,
        "content": "<h2>兑换码管理页面开发中...</h2>"
    })


@router.get("/orders", response_class=HTMLResponse)
async def orders_page(
    request: Request,
    admin_check: bool = Depends(require_web_admin)
):
    """Orders management page."""
    if isinstance(admin_check, RedirectResponse):
        return admin_check

    # TODO: Implement orders management page
    return templates.TemplateResponse("base.html", {
        "request": request,
        "content": "<h2>订单管理页面开发中...</h2>"
    })


@router.get("/reports", response_class=HTMLResponse)
async def reports_page(
    request: Request,
    admin_check: bool = Depends(require_web_admin)
):
    """Financial reports page."""
    if isinstance(admin_check, RedirectResponse):
        return admin_check

    # TODO: Implement reports page
    return templates.TemplateResponse("base.html", {
        "request": request,
        "content": "<h2>财务报表页面开发中...</h2>"
    })


@router.get("/monitor", response_class=HTMLResponse)
async def monitor_page(
    request: Request,
    admin_check: bool = Depends(require_web_admin)
):
    """System monitoring page."""
    if isinstance(admin_check, RedirectResponse):
        return admin_check

    # TODO: Implement monitoring page
    return templates.TemplateResponse("base.html", {
        "request": request,
        "content": "<h2>系统监控页面开发中...</h2>"
    })


@router.get("/profile", response_class=HTMLResponse)
async def profile_page(
    request: Request,
    admin_check: bool = Depends(require_web_admin)
):
    """Admin profile page."""
    if isinstance(admin_check, RedirectResponse):
        return admin_check

    # TODO: Implement profile page
    return templates.TemplateResponse("base.html", {
        "request": request,
        "content": "<h2>个人资料页面开发中...</h2>"
    })