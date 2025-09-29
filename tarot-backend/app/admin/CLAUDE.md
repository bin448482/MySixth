# 管理Portal设计 (app/admin/CLAUDE.md)

## 🎛️ 管理Portal架构

### Portal组织结构
```
app/admin/
├── auth.py               # 管理员认证 (✅ 已实现)
├── web_routes.py         # 管理页面路由 (✅ 已实现)
├── templates/            # HTML模板 (✅ 已实现)
│   ├── base.html        # 基础模板
│   ├── login.html       # 登录页面
│   ├── dashboard.html   # 仪表板
│   ├── users.html       # 用户管理
│   └── redeem_codes.html # 兑换码管理
└── static/              # 静态资源
    ├── css/admin.css    # 管理样式
    └── js/admin.js      # 管理脚本
```

## 🔐 认证系统 (✅ 已实现)

**实现位置**: `app/admin/auth.py`
**认证方式**: JWT Bearer Token（已统一，移除Cookie认证）

### 核心功能
- **AdminAuthService**: JWT token管理，密码验证
- **管理员依赖项**: Bearer token认证，权限验证
- **环境配置**: 用户名、密码、过期时间可配置

### 关键方法
```python
# 登录认证
admin_auth_service.verify_credentials(username, password)

# Token验证
admin_auth_service.verify_admin_token(token)

# 依赖项验证
get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme))
```

## 🏠 管理路由 (✅ 已实现)

**实现位置**: `app/admin/web_routes.py`

### 核心页面路由
- **GET /admin/login**: 登录页面 (`login.html`)
- **POST /admin/login**: 登录处理，设置Cookie
- **GET /admin/dashboard**: 仪表板 (`dashboard.html`)
- **GET /admin/users**: 用户管理页面 (`users.html`)
- **GET /admin/redeem-codes**: 兑换码管理页面 (`redeem-codes.html`)

### 认证机制
- Cookie认证，自动重定向未登录用户
- 响应式模板设计，支持多屏幕适配

**注意**: Web页面使用Cookie认证，API接口使用JWT Bearer token认证

## 📊 API接口 (✅ 已实现)

**实现位置**: `app/api/admin.py`

### 管理员认证API
- **POST /api/v1/admin-api/login**: 管理员登录
- **GET /api/v1/admin-api/profile**: 获取当前管理员信息
- **POST /api/v1/admin-api/refresh**: 刷新JWT token

### 用户管理API
- **GET /api/v1/admin/users**: 用户列表查询（分页、筛选）
- **GET /api/v1/admin/users/{id}**: 用户详情
- **POST /api/v1/admin/users/adjust-credits**: 积分调整
- **GET /api/v1/admin/users/export**: 用户数据CSV导出
- **DELETE /api/v1/admin/users/{id}**: 删除用户

### 兑换码管理API
- **GET /api/v1/admin/redeem-codes**: 兑换码列表查询
- **POST /api/v1/admin/redeem-codes/generate**: 批量生成兑换码
- **PUT /api/v1/admin/redeem-codes/{id}**: 更新兑换码状态
- **GET /api/v1/admin/redeem-codes/export/csv**: 兑换码CSV导出
- **GET /api/v1/admin/redeem-codes/stats**: 统计信息

## 🎨 前端模板 (✅ 已实现)

**实现位置**: `app/admin/templates/`

### 用户管理功能 (`users.html`)
1. **搜索筛选**: 用户ID、邮箱、积分、注册时间筛选
2. **列表展示**: 分页、ID复制、积分徽章、统计信息
3. **用户操作**: 查看详情弹窗、积分调整、删除用户
4. **数据导出**: 支持筛选条件的CSV导出

### 兑换码管理功能 (`redeem-codes.html`)
1. **列表查询**: 状态筛选、批次筛选、代码搜索
2. **批量生成**: 自定义数量、积分值、有效期
3. **状态管理**: 启用/禁用/过期状态切换
4. **统计信息**: 实时显示各状态兑换码数量

### 响应式设计
- Bootstrap 5框架
- 移动端适配
- 加载状态和错误处理
- 实时数据刷新

## 🔧 技术特性

### 认证安全
- JWT token + Cookie存储
- 24小时过期时间（可配置）
- CSRF防护（生产环境）
- 操作审计日志

### 数据处理
- 分页查询优化
- 关联查询避免N+1问题
- 乐观锁保证数据一致性
- 流式响应支持大文件导出

### 错误处理
- 全局异常捕获
- 用户友好错误提示
- 详细日志记录
- 自动错误恢复

## 📋 使用说明

### 访问管理后台
1. 访问 `http://localhost:8001/admin/login`
2. 使用环境变量配置的管理员账号登录
3. 成功后重定向到仪表板

### 用户管理操作
- **查看用户**: `/admin/users` 页面查看所有用户
- **用户详情**: 点击"查看详情"查看完整信息和交易记录
- **调整积分**: 使用"调整积分"功能增减用户积分
- **导出数据**: 使用筛选条件导出用户数据CSV

### 兑换码管理操作
- **查看兑换码**: `/admin/redeem-codes` 页面管理所有兑换码
- **生成兑换码**: 使用"生成兑换码"功能批量创建
- **更改状态**: 启用、禁用或设置过期兑换码
- **导出数据**: 导出兑换码使用情况CSV

## 🚀 已解决的技术问题

### 路由冲突问题
- **问题**: `payments.py` 和 `admin.py` 路由冲突
- **解决**: 移除重复路由，明确模块职责边界
- **参考**: 参见 `tarot-backend/CLAUDE.md` 路由冲突解决方案

### 邮件验证404错误
- **问题**: 邮件验证链接返回404
- **解决**: 修正URL路径生成，确保与实际API路由匹配
- **参考**: `app/services/email_service.py:31-32`

### 用户删除约束错误
- **问题**: 删除用户时外键约束错误
- **解决**: 按正确顺序删除关联表数据
- **参考**: `app/api/admin.py:546-563`

---

*管理Portal已完整实现，提供用户管理、兑换码管理、统计报表等完整功能。*