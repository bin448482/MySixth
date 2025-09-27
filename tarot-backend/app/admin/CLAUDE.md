# 管理Portal设计 (app/admin/CLAUDE.md)

## 🎛️ 管理Portal架构

### Portal组织结构
```
app/admin/
├── __init__.py           # Portal模块初始化
├── auth.py               # 管理员认证
├── routes.py             # 管理页面路由
├── dependencies.py       # 管理员依赖项
├── templates/           # HTML模板
│   ├── base.html        # 基础模板
│   ├── login.html       # 登录页面
│   ├── dashboard.html   # 仪表板
│   ├── users.html       # 用户管理
│   ├── redeem_codes.html # 兑换码管理
│   ├── orders.html      # 订单管理
│   └── reports.html     # 财务报表
└── static/              # 静态资源
    ├── css/
    ├── js/
    └── images/
```

## 🔐 认证系统 (auth.py)

### 管理员认证
```python
class AdminAuthService:
    """管理员认证服务"""

    def __init__(self):
        self.secret_key = os.getenv("JWT_SECRET_KEY")
        self.admin_username = os.getenv("ADMIN_USERNAME", "admin")
        self.admin_password = os.getenv("ADMIN_PASSWORD")
        self.session_expire_hours = int(os.getenv("ADMIN_SESSION_EXPIRE_HOURS", "24"))

    async def authenticate(self, username: str, password: str) -> Optional[dict]:
        """管理员登录认证"""

        if username != self.admin_username:
            return None

        # 验证密码（生产环境应使用哈希）
        if not self._verify_password(password, self.admin_password):
            return None

        # 生成JWT token
        token = self._generate_admin_token(username)

        return {
            "username": username,
            "token": token,
            "expires_in": self.session_expire_hours * 3600
        }

    def _generate_admin_token(self, username: str) -> str:
        """生成管理员JWT token"""

        payload = {
            "username": username,
            "role": "admin",
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(hours=self.session_expire_hours)
        }

        return jwt.encode(payload, self.secret_key, algorithm="HS256")

    def verify_admin_token(self, token: str) -> Optional[dict]:
        """验证管理员token"""

        try:
            payload = jwt.decode(token, self.secret_key, algorithms=["HS256"])
            if payload.get("role") != "admin":
                return None
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

    def _verify_password(self, password: str, stored_password: str) -> bool:
        """验证密码（简化版本）"""
        # 生产环境应使用bcrypt等安全哈希
        return password == stored_password
```

### 管理员依赖项 (dependencies.py)
```python
def get_admin_user(
    request: Request,
    admin_auth: AdminAuthService = Depends()
) -> dict:
    """获取当前管理员用户"""

    # 尝试从Cookie获取token
    token = request.cookies.get("admin_token")
    if not token:
        raise HTTPException(
            status_code=302,
            headers={"Location": "/admin/login"}
        )

    # 验证token
    admin_user = admin_auth.verify_admin_token(token)
    if not admin_user:
        raise HTTPException(
            status_code=302,
            headers={"Location": "/admin/login"}
        )

    return admin_user

def require_admin(admin_user: dict = Depends(get_admin_user)) -> dict:
    """要求管理员权限"""
    return admin_user
```

## 🏠 管理路由 (routes.py)

### 核心路由定义
```python
router = APIRouter(prefix="/admin", tags=["管理Portal"])

@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    """管理员登录页面"""
    return templates.TemplateResponse("admin/login.html", {
        "request": request,
        "title": "管理员登录"
    })

@router.post("/login")
async def admin_login(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
    admin_auth: AdminAuthService = Depends()
):
    """管理员登录处理"""

    auth_result = await admin_auth.authenticate(username, password)
    if not auth_result:
        return templates.TemplateResponse("admin/login.html", {
            "request": request,
            "error": "用户名或密码错误",
            "title": "管理员登录"
        }, status_code=401)

    # 设置Cookie并重定向
    response = RedirectResponse(url="/admin/dashboard", status_code=302)
    response.set_cookie(
        key="admin_token",
        value=auth_result["token"],
        httponly=True,
        secure=True,  # 生产环境启用
        samesite="lax",
        max_age=auth_result["expires_in"]
    )
    return response

@router.get("/dashboard", response_class=HTMLResponse)
async def dashboard(
    request: Request,
    admin_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """管理仪表板"""

    # 获取统计数据
    stats = await _get_dashboard_stats(db)

    return templates.TemplateResponse("admin/dashboard.html", {
        "request": request,
        "admin_user": admin_user,
        "stats": stats,
        "title": "管理仪表板"
    })
```

### 核心管理功能
```python
@router.get("/users", response_class=HTMLResponse)
async def users_management(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=100),
    admin_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """用户管理页面"""

    # 分页查询用户
    offset = (page - 1) * limit
    users_query = db.query(User).order_by(User.created_at.desc())
    total_users = users_query.count()
    users = users_query.offset(offset).limit(limit).all()

    # 获取用户余额信息
    users_with_balance = []
    for user in users:
        balance = db.query(UserBalance).filter(UserBalance.user_id == user.id).first()
        users_with_balance.append({
            "user": user,
            "balance": balance.credits if balance else 0,
            "last_active": user.last_active_at
        })

    return templates.TemplateResponse("admin/users.html", {
        "request": request,
        "admin_user": admin_user,
        "users": users_with_balance,
        "total_users": total_users,
        "current_page": page,
        "total_pages": (total_users + limit - 1) // limit,
        "title": "用户管理"
    })

@router.get("/redeem-codes", response_class=HTMLResponse)
async def redeem_codes_management(
    request: Request,
    status: str = Query("all"),
    admin_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """兑换码管理页面"""

    # 查询兑换码
    query = db.query(RedeemCode).order_by(RedeemCode.created_at.desc())
    if status != "all":
        query = query.filter(RedeemCode.status == status)

    redeem_codes = query.limit(100).all()

    # 统计信息
    stats = {
        "total": db.query(RedeemCode).count(),
        "active": db.query(RedeemCode).filter(RedeemCode.status == "active").count(),
        "used": db.query(RedeemCode).filter(RedeemCode.status == "used").count(),
        "expired": db.query(RedeemCode).filter(RedeemCode.status == "expired").count()
    }

    return templates.TemplateResponse("admin/redeem_codes.html", {
        "request": request,
        "admin_user": admin_user,
        "redeem_codes": redeem_codes,
        "stats": stats,
        "current_status": status,
        "title": "兑换码管理"
    })

@router.post("/redeem-codes/generate")
async def generate_redeem_codes(
    request: Request,
    count: int = Form(...),
    credits: int = Form(...),
    expires_days: int = Form(365),
    admin_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """批量生成兑换码"""

    if count > 1000:
        raise HTTPException(status_code=400, detail="一次最多生成1000个兑换码")

    batch_id = str(uuid4())
    expires_at = datetime.utcnow() + timedelta(days=expires_days)

    # 批量生成兑换码
    generated_codes = []
    for _ in range(count):
        code = generate_redeem_code()  # 工具函数
        redeem_code = RedeemCode(
            code=code,
            product_id=1,  # 默认产品
            credits=credits,
            expires_at=expires_at,
            batch_id=batch_id
        )
        db.add(redeem_code)
        generated_codes.append(code)

    db.commit()

    return templates.TemplateResponse("admin/redeem_codes_generated.html", {
        "request": request,
        "admin_user": admin_user,
        "generated_codes": generated_codes,
        "count": count,
        "credits": credits,
        "batch_id": batch_id,
        "title": "兑换码生成成功"
    })
```

## 📊 仪表板数据

### 统计数据获取
```python
async def _get_dashboard_stats(db: Session) -> dict:
    """获取仪表板统计数据"""

    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)
    month_start = today_start - timedelta(days=30)

    # 用户统计
    total_users = db.query(User).count()
    active_users_today = db.query(User).filter(
        User.last_active_at >= today_start
    ).count()
    new_users_week = db.query(User).filter(
        User.created_at >= week_start
    ).count()

    # 订单统计
    total_orders = db.query(Purchase).count()
    completed_orders = db.query(Purchase).filter(
        Purchase.status == "completed"
    ).count()
    orders_today = db.query(Purchase).filter(
        Purchase.created_at >= today_start
    ).count()

    # 收入统计（以积分计算）
    total_credits_sold = db.query(func.sum(Purchase.credits)).filter(
        Purchase.status == "completed"
    ).scalar() or 0

    month_credits_sold = db.query(func.sum(Purchase.credits)).filter(
        Purchase.status == "completed",
        Purchase.completed_at >= month_start
    ).scalar() or 0

    # 兑换码统计
    total_redeem_codes = db.query(RedeemCode).count()
    active_redeem_codes = db.query(RedeemCode).filter(
        RedeemCode.status == "active"
    ).count()
    used_redeem_codes = db.query(RedeemCode).filter(
        RedeemCode.status == "used"
    ).count()

    # 积分统计
    total_credits_in_system = db.query(func.sum(UserBalance.credits)).scalar() or 0

    return {
        "users": {
            "total": total_users,
            "active_today": active_users_today,
            "new_this_week": new_users_week
        },
        "orders": {
            "total": total_orders,
            "completed": completed_orders,
            "today": orders_today,
            "success_rate": (completed_orders / total_orders * 100) if total_orders > 0 else 0
        },
        "revenue": {
            "total_credits_sold": total_credits_sold,
            "month_credits_sold": month_credits_sold,
            "avg_order_size": (total_credits_sold / completed_orders) if completed_orders > 0 else 0
        },
        "redeem_codes": {
            "total": total_redeem_codes,
            "active": active_redeem_codes,
            "used": used_redeem_codes,
            "usage_rate": (used_redeem_codes / total_redeem_codes * 100) if total_redeem_codes > 0 else 0
        },
        "credits": {
            "total_in_system": total_credits_in_system,
            "distributed": total_credits_sold,
            "circulation_rate": (total_credits_in_system / total_credits_sold * 100) if total_credits_sold > 0 else 0
        }
    }
```

## 🎨 模板设计

### 基础模板 (base.html)
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}塔罗牌应用管理后台{% endblock %}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="/static/admin/css/admin.css">
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container-fluid">
            <a class="navbar-brand" href="/admin/dashboard">塔罗牌管理后台</a>

            {% if admin_user %}
            <div class="navbar-nav ms-auto">
                <span class="navbar-text me-3">
                    欢迎，{{ admin_user.username }}
                </span>
                <a class="nav-link" href="/admin/logout">退出登录</a>
            </div>
            {% endif %}
        </div>
    </nav>

    <div class="container-fluid">
        <div class="row">
            {% if admin_user %}
            <nav class="col-md-3 col-lg-2 d-md-block bg-light sidebar">
                <div class="position-sticky pt-3">
                    <ul class="nav flex-column">
                        <li class="nav-item">
                            <a class="nav-link" href="/admin/dashboard">
                                📊 仪表板
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="/admin/users">
                                👥 用户管理
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="/admin/redeem-codes">
                                🎫 兑换码管理
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="/admin/orders">
                                💳 订单管理
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="/admin/reports">
                                📈 财务报表
                            </a>
                        </li>
                    </ul>
                </div>
            </nav>
            {% endif %}

            <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
                {% block content %}{% endblock %}
            </main>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="/static/admin/js/admin.js"></script>
</body>
</html>
```

### 仪表板模板 (dashboard.html)
```html
{% extends "admin/base.html" %}

{% block content %}
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">仪表板</h1>
    <div class="btn-toolbar mb-2 mb-md-0">
        <div class="btn-group me-2">
            <button type="button" class="btn btn-sm btn-outline-secondary">导出数据</button>
        </div>
    </div>
</div>

<!-- 统计卡片 -->
<div class="row mb-4">
    <div class="col-md-3">
        <div class="card text-white bg-primary">
            <div class="card-body">
                <div class="d-flex justify-content-between">
                    <div>
                        <h4 class="card-title">{{ stats.users.total }}</h4>
                        <p class="card-text">总用户数</p>
                    </div>
                    <div class="align-self-center">
                        <i class="fas fa-users fa-2x"></i>
                    </div>
                </div>
                <small class="text-white-50">今日活跃: {{ stats.users.active_today }}</small>
            </div>
        </div>
    </div>

    <div class="col-md-3">
        <div class="card text-white bg-success">
            <div class="card-body">
                <div class="d-flex justify-content-between">
                    <div>
                        <h4 class="card-title">{{ stats.orders.completed }}</h4>
                        <p class="card-text">完成订单</p>
                    </div>
                    <div class="align-self-center">
                        <i class="fas fa-shopping-cart fa-2x"></i>
                    </div>
                </div>
                <small class="text-white-50">成功率: {{ "%.1f" | format(stats.orders.success_rate) }}%</small>
            </div>
        </div>
    </div>

    <div class="col-md-3">
        <div class="card text-white bg-info">
            <div class="card-body">
                <div class="d-flex justify-content-between">
                    <div>
                        <h4 class="card-title">{{ stats.revenue.total_credits_sold }}</h4>
                        <p class="card-text">总积分销售</p>
                    </div>
                    <div class="align-self-center">
                        <i class="fas fa-coins fa-2x"></i>
                    </div>
                </div>
                <small class="text-white-50">本月: {{ stats.revenue.month_credits_sold }}</small>
            </div>
        </div>
    </div>

    <div class="col-md-3">
        <div class="card text-white bg-warning">
            <div class="card-body">
                <div class="d-flex justify-content-between">
                    <div>
                        <h4 class="card-title">{{ stats.redeem_codes.active }}</h4>
                        <p class="card-text">活跃兑换码</p>
                    </div>
                    <div class="align-self-center">
                        <i class="fas fa-ticket-alt fa-2x"></i>
                    </div>
                </div>
                <small class="text-white-50">使用率: {{ "%.1f" | format(stats.redeem_codes.usage_rate) }}%</small>
            </div>
        </div>
    </div>
</div>

<!-- 图表区域 -->
<div class="row">
    <div class="col-md-8">
        <div class="card">
            <div class="card-header">
                <h5>订单趋势</h5>
            </div>
            <div class="card-body">
                <canvas id="ordersChart" width="400" height="200"></canvas>
            </div>
        </div>
    </div>

    <div class="col-md-4">
        <div class="card">
            <div class="card-header">
                <h5>积分分布</h5>
            </div>
            <div class="card-body">
                <canvas id="creditsChart" width="200" height="200"></canvas>
            </div>
        </div>
    </div>
</div>
{% endblock %}
```

## 🔧 静态资源

### 管理样式 (static/admin/css/admin.css)
```css
.sidebar {
    position: fixed;
    top: 56px;
    bottom: 0;
    left: 0;
    z-index: 100;
    padding: 0;
    box-shadow: inset -1px 0 0 rgba(0, 0, 0, .1);
}

.sidebar .nav-link {
    font-weight: 500;
    color: #333;
}

.sidebar .nav-link:hover {
    background-color: #f8f9fa;
}

.card {
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    border: 1px solid rgba(0, 0, 0, 0.125);
}

.table-responsive {
    border-radius: 0.375rem;
}

.btn-group .btn {
    margin-right: 0.5rem;
}

/* 响应式调整 */
@media (max-width: 768px) {
    .sidebar {
        position: static;
        height: auto;
    }

    main {
        padding-top: 1rem;
    }
}
```

## 🛡️ 安全考虑

### CSRF防护
```python
from fastapi_csrf_protect import CsrfProtect

@router.post("/redeem-codes/generate")
async def generate_redeem_codes(
    request: Request,
    csrf_protect: CsrfProtect = Depends(),
    # ... 其他参数
):
    await csrf_protect.validate_csrf(request)
    # ... 业务逻辑
```

### 操作审计
```python
class AuditLog(Base):
    """操作审计日志"""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)
    admin_username = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)
    resource = Column(String(100), nullable=False)
    resource_id = Column(String(50), nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

def log_admin_action(
    admin_username: str,
    action: str,
    resource: str,
    resource_id: str = None,
    details: dict = None,
    ip_address: str = None,
    db: Session = None
):
    """记录管理员操作"""
    audit_log = AuditLog(
        admin_username=admin_username,
        action=action,
        resource=resource,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address
    )
    db.add(audit_log)
    db.commit()
```

## 👥 用户管理功能实现

### API路由实现 (app/api/admin.py)

用户管理功能已完整实现，包含以下API接口：

#### 1. GET /api/v1/admin/users - 用户列表查询
```python
@user_router.get("/users", response_model=UserListResponse)
async def get_users(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    installation_id: Optional[str] = Query(None),
    min_credits: Optional[int] = Query(None),
    date_range: Optional[str] = Query(None),
    current_admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    获取用户列表（分页），支持筛选：
    - installation_id: 用户ID搜索
    - min_credits: 最低积分筛选
    - date_range: 注册时间筛选（today, week, month）
    """
```

**功能特性**：
- 分页查询（默认每页20条）
- 多条件筛选支持
- 关联查询用户余额信息
- 返回格式化的用户数据

#### 2. GET /api/v1/admin/users/{installation_id} - 用户详情
```python
@user_router.get("/users/{installation_id}", response_model=UserDetailResponse)
async def get_user_detail(
    installation_id: str,
    current_admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """获取用户详情信息，包括最近10条交易记录"""
```

**功能特性**：
- 用户基本信息展示
- 积分余额和统计信息
- 最近交易记录查询
- 详细的用户画像数据

#### 3. POST /api/v1/admin/users/adjust-credits - 积分调整
```python
@user_router.post("/users/adjust-credits", response_model=AdjustCreditsResponse)
async def adjust_user_credits(
    request: AdjustCreditsRequest,
    current_admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """管理员调整用户积分"""
```

**功能特性**：
- 支持增加或减少用户积分
- 乐观锁保证数据一致性
- 自动创建交易记录
- 更新用户统计信息

#### 4. GET /api/v1/admin/users/export - 数据导出
```python
@user_router.get("/users/export")
async def export_users(
    installation_id: Optional[str] = Query(None),
    min_credits: Optional[int] = Query(None),
    date_range: Optional[str] = Query(None),
    current_admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """导出用户数据为CSV文件"""
```

**功能特性**：
- 支持与列表相同的筛选条件
- 生成时间戳文件名
- UTF-8-BOM编码支持中文
- 流式响应优化内存使用

### Web界面实现 (app/admin/web_routes.py)

#### 用户管理页面路由
```python
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
```

**实现说明**：
- 移除了占位符代码
- 直接渲染完整的用户管理模板
- 前端JavaScript负责调用API获取数据

### 前端模板功能 (app/admin/templates/users.html)

用户管理模板已完整实现以下功能：

#### 1. 搜索筛选功能
- 用户ID搜索（支持部分匹配）
- 最低积分筛选
- 注册时间范围筛选（今天/本周/本月）
- 实时搜索和结果更新

#### 2. 用户列表展示
- 分页展示用户数据
- 显示用户ID（可复制完整ID）
- 积分余额彩色徽章
- 累计购买和消费统计
- 注册时间和最后活跃时间

#### 3. 用户操作功能
- **查看详情**：弹窗显示用户完整信息和交易记录
- **调整积分**：管理员可增加或减少用户积分
- **数据导出**：支持筛选条件的CSV导出

#### 4. 交互体验优化
- 响应式设计适配各种屏幕
- 加载状态和错误提示
- 操作成功反馈
- 数据实时刷新

### 路由注册 (app/main.py)

```python
# 注册用户管理API路由
app.include_router(admin.user_router)  # Admin user management API (/api/v1/admin/*)
```

### 数据模型支持

用户管理功能依赖以下数据模型：
- **User**: 用户基本信息
- **UserBalance**: 用户积分余额（支持乐观锁）
- **CreditTransaction**: 积分交易记录

### 安全机制

1. **管理员认证**：所有API都需要管理员JWT认证
2. **权限验证**：使用 `get_current_admin` 依赖项
3. **数据验证**：Pydantic模型验证请求数据
4. **事务安全**：积分调整使用数据库事务
5. **操作审计**：所有管理员操作自动记录

### 性能优化

1. **分页查询**：避免一次性加载大量数据
2. **关联查询**：使用 `joinedload` 避免N+1查询
3. **索引优化**：在常用查询字段建立索引
4. **流式导出**：大量数据导出使用流式响应

---

*此文档定义了塔罗牌应用后端的管理Portal设计，提供完整的后台管理系统架构和实现指南。*