# 塔罗牌应用后端开发指南 (CLAUDE.md)

## 📖 项目简介

**塔罗牌应用后端服务** 是一个基于 FastAPI 的塔罗牌应用后端，支持匿名用户、牌阵解读、LLM集成和支付功能。采用单体架构快速上线，支持后续扩展。

## 🎯 核心目标

- 支持匿名用户系统，降低使用门槛
- 提供静态基础解读 + 付费LLM动态解读
- 完整的管理Portal + 支付系统集成
- 支持兑换码和Google Play多平台支付
- 单体架构快速上线，支持后续扩展

## 🔧 技术栈

### 后端框架
- **FastAPI 0.104+**: 现代Python Web框架，自动API文档
- **SQLAlchemy 2.0+**: ORM框架，支持异步操作
- **Alembic**: 数据库迁移工具
- **Pydantic 2.0+**: 数据验证和序列化

### 外部服务集成
- **LLM服务**: 智谱AI + OpenAI API
- **支付系统**: Google Play + 兑换码系统
- **模板引擎**: Jinja2 (管理Portal)
- **认证**: JWT (匿名用户 + 管理员)

## 🔗 API接口设计

### 核心API

| 方法   | 路径                   | 说明                    | 状态 |
| ---- | -------------------- | --------------------- | --- |
| POST | `/api/v1/users/register`         | 生成匿名用户ID              | ✅ 已实现 |
| POST | `/readings/analyze`  | 第一步：分析用户描述，返回推荐维度     | ✅ 已实现 |
| POST | `/readings/generate` | 第二步：基于选定维度生成多维度解读    | ✅ 已实现 |
| GET  | `/api/v1/me/balance` | 查询用户余额                | 🔄 待实现 |
| POST | `/api/v1/redeem`     | 兑换码验证兑换               | 🔄 待实现 |

### 解读API流程（分两步）
1. **分析阶段** (`/readings/analyze`)：用户输入描述 → LLM分析 → 返回推荐维度
2. **生成阶段** (`/readings/generate`)：选择维度和卡牌 → LLM生成 → 返回详细解读

## 📊 数据库配置

### 数据库文件管理
- **后台数据库**: `./backend_tarot.db` (独立数据库文件)
- **源数据库**: `../tarot-ai-generator/data/tarot_config.db`
- **迁移策略**: 从源数据库复制核心表

### 核心表结构
1. **card** - 卡牌基础信息（78张塔罗牌）
2. **dimension** - 解读维度定义
3. **card_interpretation** - 牌意主表（156条正逆位解读）
4. **spread** - 牌阵定义（三牌阵、凯尔特十字）
5. **users** - 匿名用户管理
6. **purchases** - 订单记录
7. **redeem_codes** - 兑换码管理

## 🚨 常见问题解决方案

### 邮件验证链接404错误问题

**问题现象**：
- 邮件中的验证链接无法访问，返回 `{"detail":"Not Found"}` 404错误

**根本原因**：
- 邮件服务中生成的URL路径与实际API路由不匹配
- FastAPI路由注册时的前缀配置问题

**问题定位步骤**：
1. **检查API文档**：访问 `http://localhost:8001/docs` 或 `http://localhost:8001/openapi.json`
2. **确认实际路由**：在openapi.json中搜索 `email/verify` 找到真实路径
3. **对比邮件URL**：检查邮件中生成的URL是否与实际路由匹配

**解决方案**：

1. **路由配置** (`app/main.py`):
```python
# 确保认证路由正确注册
app.include_router(auth.router, prefix="/api/v1")  # 实际路径: /api/v1/auth/email/verify
```

2. **邮件URL生成** (`app/services/email_service.py`):
```python
# 修正邮件验证URL生成
verification_url = f"{settings.APP_BASE_URL}/api/v1/auth/email/verify?token={verification_token}"
reset_url = f"{settings.APP_BASE_URL}/api/v1/auth/email/reset-password?token={reset_token}"
```

3. **环境配置** (`.env`):
```env
# 确保基础URL端口正确
APP_BASE_URL=http://localhost:8001
```

**验证方法**：
```bash
# 测试路由是否可访问
curl -s "http://localhost:8001/api/v1/auth/email/verify?token=test-token"

# 不应该返回404，而应该返回具体的业务错误（如token无效等）
```

**注意事项**：
- 修改路由配置后需要重启服务器
- uvicorn的--reload模式会自动检测文件变化并重启
- 确保数据库中email_verifications表的user_id字段关联正确

### 邮件验证逻辑错误问题

**问题现象**：
- 路由可以访问，但返回"用户不存在"错误

**根本原因**：
- email_verifications.user_id 存储的是数据库内部ID
- 查询users表时错误使用了installation_id字段

**解决方案**：
```python
# app/api/auth.py - verify_email方法中
# 错误写法：
user = db.query(User).filter(User.installation_id == verification.user_id).first()

# 正确写法：
user = db.query(User).filter(User.id == verification.user_id).first()
```

### 管理员API路由冲突问题

**问题现象**：
- 访问管理员页面 `/admin/redeem-codes` 时自动重定向到登录页面
- API请求返回 403 Forbidden 错误：`{"error":"Not authenticated","status_code":403}`
- 日志显示：`"GET /api/v1/admin/redeem-codes?page=1&size=20 HTTP/1.1" 403 Forbidden`

**根本原因**：
- 在 `payments.py` 和 `admin.py` 中存在重复的路由定义
- `payments.py` 中的 `@router.get("/admin/redeem-codes")` 使用Bearer token认证
- `admin.py` 中的 `@redeem_router.get("")` (完整路径: `/api/v1/admin/redeem-codes`) 使用Cookie认证
- 由于路由注册顺序问题，`payments.router` 先注册，拦截了所有请求

**问题定位步骤**：
1. **检查路由注册顺序**：在 `app/main.py` 中查看路由注册顺序
2. **查找重复路由**：使用 `grep -r "/admin/redeem-codes" app/api/` 查找重复路由
3. **确认认证方式差异**：比较两个路由的认证依赖项

**解决方案**：
删除 `payments.py` 中的重复路由，保留 `admin.py` 中使用Cookie认证的专用管理路由：

```python
# 删除 app/api/payments.py 中的重复路由：
@router.get("/admin/redeem-codes", response_model=RedeemCodeListResponse)
async def list_redeem_codes(...):
    # 这个路由使用 Depends(require_admin) - Bearer token认证
    pass

# 保留 app/api/admin.py 中的正确路由：
@redeem_router.get("", response_model=RedeemCodeListResponse)
async def get_redeem_codes(
    current_admin: str = Depends(get_current_admin_from_cookie),  # Cookie认证
    ...
):
    pass
```

**验证方法**：
```bash
# 1. 获取管理员登录token
curl -X POST "http://localhost:8001/admin/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"

# 2. 测试API访问
curl "http://localhost:8001/api/v1/admin/redeem-codes?page=1&size=20" \
  -H "Cookie: admin_token=YOUR_TOKEN_HERE"
```

**预防措施**：
1. **路由命名规范**：管理员专用API使用 `/api/v1/admin/` 前缀
2. **认证方式统一**：同一功能模块使用统一的认证方式
3. **路由注册检查**：定期检查路由冲突，确保专用路由优先注册

### payments.py模块职责重构问题

**问题背景**：
- `payments.py` 中包含了大量管理员专用功能（创建、统计、禁用兑换码等）
- 这些功能与 `admin.py` 中的管理功能重复
- 不同的认证方式导致架构混乱

**重构方案**：
```python
# payments.py - 只保留前端支付相关功能
router = APIRouter(prefix="/api/v1/payments", tags=["payments"])

@router.post("/redeem", response_model=RedeemCodeValidateResponse)
async def redeem_code(...):
    """兑换码验证兑换（前端核心功能）"""
    pass

# 删除所有管理员路由：
# - POST /admin/redeem-codes/create
# - GET /admin/redeem-codes/batch/{batch_id}/stats
# - POST /admin/redeem-codes/disable
# - POST /admin/redeem-codes/cleanup-expired
```

**模块职责清晰划分**：
1. **payments.py**:
   - 前缀：`/api/v1/payments`
   - 职责：兑换码兑换、Google Play支付验证
   - 认证：Bearer Token（面向前端应用）

2. **admin.py**:
   - 前缀：`/api/v1/admin`
   - 职责：完整的兑换码管理、用户管理
   - 认证：Cookie（面向管理后台）

**重构效果**：
- 消除功能重复，避免路由冲突
- 明确模块边界，提高代码可维护性
- 统一认证方式，简化前后端集成

---

## 🚀 快速开始

### 1. 环境配置
```bash
cp .env.example .env
# 编辑 .env 文件配置 LLM API、JWT密钥等
```

### 2. 安装依赖
```bash
pip install -r requirements.txt
```

### 3. 运行开发服务器
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 📁 详细文档索引

### 核心模块文档
- **数据库模型**: `app/models/CLAUDE.md` - 数据库设计和SQLAlchemy模型
- **API路由**: `app/api/CLAUDE.md` - 接口设计和实现细节
- **业务逻辑**: `app/services/CLAUDE.md` - 服务层和LLM集成
- **管理Portal**: `app/admin/CLAUDE.md` - 后台管理系统
- **工具函数**: `app/utils/CLAUDE.md` - 认证、兑换码等工具

### 开发阶段规划
1. **阶段1**: 数据库与基础架构 (1天) 🔥
2. **阶段2**: 支付API开发 (2天)
3. **阶段3**: 管理Portal开发 (2天)
4. **阶段4**: 高级功能和优化 (1天)
5. **阶段5**: 集成测试和部署 (1天)

## 🔑 关键技术实现点

### 匿名用户系统
- UUID生成唯一用户ID，JWT token管理会话
- 无需注册，降低使用门槛

### 支付系统
- 兑换码系统：16位混合字符，批次管理
- Google Play集成：购买验证，订单同步
- 积分系统：原子操作，乐观锁防并发

### 解读算法
- 基于用户描述的LLM维度推荐
- 参考 `generate_single_interpretation` 方法
- 支持三牌阵和凯尔特十字两种牌阵

## 🛡️ 安全考虑

- API安全：HTTPS传输、输入验证、SQL注入防护
- 支付安全：购买凭证验证、原子性更新、幂等性控制
- 管理Portal安全：JWT认证、CSRF防护、操作审计
- 兑换码安全：防爆破、使用限制、批次管理

## 🧪 测试策略

测试要创建到 `tests/` 目录下：
- **单元测试**: 支付服务、兑换码生成、积分扣减
- **集成测试**: Google Play API、数据库事务、支付流程
- **安全测试**: SQL注入、XSS、CSRF防护验证

## 📈 扩展性考虑

- 微服务拆分预留：用户服务、解读服务、支付服务
- 性能扩展点：Redis缓存、Celery异步任务、数据库读写分离
- 监控告警：支付成功率、API响应时间、数据库连接

---

**开发预计时间**: 7个工作日
**部署要求**: Google Play开发者账户和服务账户密钥

*详细实现细节请查看各子目录下的 CLAUDE.md 文档。*