# API路由设计 (app/api/CLAUDE.md)

## 🔗 API架构概述

### API组织结构
```
app/api/
├── __init__.py          # 路由注册
├── auth.py              # 匿名认证 (✅ 已实现)
├── readings.py          # 解读相关API (✅ 已实现)
├── admin.py             # 管理员API (✅ 已实现)
├── payments.py          # 支付相关API (✅ 已重构)
├── users.py             # 用户API路由 (🔄 待实现)
└── sync.py              # 离线同步API (🔄 待实现)
```

### API版本管理
- **核心API**: `/` 根路径 (解读功能)
- **支付API**: `/api/v1/payments/` (兑换码、Google Play)
- **管理认证API**: `/api/v1/admin-api/` (管理员登录、认证)
- **管理功能API**: `/api/v1/admin/` (用户管理、兑换码管理)
- **管理Portal**: `/admin/` (Web界面)
- **用户API**: `/api/v1/me/` (用户余额、交易历史)

## 📋 核心API接口 (✅ 已实现)

### 认证相关 (`auth.py`)
**实现位置**: `app/api/auth.py`

- **POST /auth/anon**: 生成匿名用户ID和JWT token
- **POST /api/v1/auth/register**: 用户邮箱注册
- **POST /api/v1/auth/email/verify**: 邮箱验证
- **POST /api/v1/auth/email/resend**: 重发验证邮件
- **POST /api/v1/auth/email/reset-password**: 密码重置

### 解读相关 (`readings.py`)
**实现位置**: `app/api/readings.py`

- **POST /readings/analyze**: 分析用户描述，返回推荐维度
- **POST /readings/generate**: 基于选定维度生成多维度解读
- **GET /cards**: 获取所有卡牌信息
- **GET /dimensions**: 获取所有解读维度
- **GET /spreads**: 获取牌阵配置

### 支付相关 (`payments.py` - 已重构)
**实现位置**: `app/api/payments.py`

**重构说明**：
- **路由前缀**: `/api/v1/payments`
- **职责范围**: 前端支付功能（兑换码兑换、Google Play验证）
- **认证方式**: Bearer Token（面向前端应用）
- **已删除**: 所有管理员路由，统一迁移至 `admin.py`

#### 核心功能
- **POST /api/v1/payments/redeem**: 兑换码验证兑换
- **POST /api/v1/payments/redeem/info**: 获取兑换码信息（不使用）
- **POST /api/v1/payments/google/verify**: Google Play购买验证
- **POST /api/v1/payments/google/consume**: 标记Google Play购买已消费
- **POST /api/v1/payments/webhooks/google/play**: Google Play webhooks

## 🔐 管理员API接口 (✅ 已实现)

### 管理员认证 (`admin.py`)
**实现位置**: `app/api/admin.py:100-182`

- **POST /api/v1/admin-api/login**: 管理员登录认证
- **GET /api/v1/admin-api/profile**: 获取当前管理员信息
- **POST /api/v1/admin-api/refresh**: 刷新JWT token

### 用户管理 (`admin.py`)
**实现位置**: `app/api/admin.py:227-583`

- **GET /api/v1/admin/users**: 用户列表查询（分页、筛选）
- **GET /api/v1/admin/users/{id}**: 用户详情和交易记录
- **POST /api/v1/admin/users/adjust-credits**: 管理员调整用户积分
- **GET /api/v1/admin/users/export**: 用户数据CSV导出
- **DELETE /api/v1/admin/users/{id}**: 删除用户及相关数据

### 兑换码管理 (`admin.py`)
**实现位置**: `app/api/admin.py:649-1024`

- **GET /api/v1/admin/redeem-codes**: 兑换码列表查询
- **POST /api/v1/admin/redeem-codes/generate**: 批量生成兑换码
- **PUT /api/v1/admin/redeem-codes/{id}**: 更新兑换码状态
- **GET /api/v1/admin/redeem-codes/export/csv**: 兑换码CSV导出
- **GET /api/v1/admin/redeem-codes/stats**: 统计信息
- **GET /api/v1/admin/redeem-codes/batches**: 获取批次列表

## 🎨 前端模板和Web路由 (✅ 已实现)

### 管理Portal (`app/admin/web_routes.py`)
- **GET /admin/login**: 登录页面
- **POST /admin/login**: 登录处理
- **GET /admin/dashboard**: 仪表板
- **GET /admin/users**: 用户管理页面
- **GET /admin/redeem-codes**: 兑换码管理页面

### 功能特性
1. **用户管理**: 分页列表、详情查看、积分调整、数据导出
2. **兑换码管理**: 批量生成、状态管理、使用统计
3. **响应式设计**: Bootstrap 5框架，移动端适配
4. **实时更新**: Ajax加载，无需刷新页面

## 🔄 待实现功能

### 用户API (`users.py` - 待实现)
- **GET /api/v1/me/balance**: 查询用户余额
- **GET /api/v1/me/transactions**: 消费历史查询
- **POST /api/v1/consume**: LLM调用前扣点

### 离线同步API (`sync.py` - 待实现)
- **GET /sync/initial**: 初始全量同步
- **GET /sync/delta**: 增量数据更新

## 🔧 技术实现

### 认证机制
- **匿名用户**: JWT token，无需注册
- **管理员**: JWT token + Cookie双重认证
- **邮箱用户**: 可选注册，增强用户体验

### 数据处理
- **分页查询**: 避免大量数据加载
- **关联查询**: 使用 `joinedload` 优化N+1问题
- **乐观锁**: 保证积分操作数据一致性
- **流式响应**: 大文件导出内存优化

### 错误处理
- **全局异常**: 统一错误格式和日志
- **用户友好**: 前端展示清晰错误信息
- **数据验证**: Pydantic模型严格验证

## 🚀 已解决的技术问题

### 路由冲突问题
- **问题**: `payments.py` 和 `admin.py` 存在重复路由
- **解决**: 重构模块职责，删除重复功能
- **参考**: `tarot-backend/CLAUDE.md` 路由冲突解决方案

### 邮件验证404错误
- **问题**: 邮件验证链接路径错误
- **解决**: 修正URL生成逻辑，确保路径匹配
- **参考**: `app/services/email_service.py:31-32`

### 用户删除约束错误
- **问题**: 外键约束导致删除失败
- **解决**: 按正确顺序删除关联数据
- **参考**: `app/api/admin.py:546-563`

## 🛡️ 安全考虑

### API安全
- HTTPS强制传输
- JWT token过期控制
- SQL注入防护（SQLAlchemy ORM）
- 请求参数验证和过滤

### 支付安全
- Google Play凭证签名验证
- 原子性支付状态更新
- 幂等性防重复订单
- 敏感信息环境变量管理

### 兑换码安全
- 防爆破连续失败锁定
- 16位混合字符防重复
- 批次管理和过期控制

## 📊 性能优化

### 缓存策略（计划实现）
- Redis缓存用户余额查询
- 静态数据缓存（cards, dimensions）
- LLM解读结果缓存

### 限流控制（计划实现）
- 支付API: 每用户每小时10次
- 解读API: 每用户每分钟5次
- 管理API: 基于IP限制

---

*API架构已基本完成，核心功能均已实现并通过测试。待实现功能主要为用户API和离线同步。*