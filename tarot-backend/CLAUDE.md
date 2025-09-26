# 塔罗牌应用后端开发指南 (CLAUDE.md)

## 📖 项目简介

**塔罗牌应用后端服务** 是一个基于 FastAPI 的塔罗牌应用后端，支持匿名用户、牌阵解读、LLM集成和支付功能。采用单体架构快速上线，支持后续扩展。

## 🎯 核心目标

- 支持匿名用户系统，降低使用门槛
- 提供静态基础解读 + 付费LLM动态解读
- 完整的管理Portal + 支付系统集成
- 支持兑换码和Google Play多平台支付
- 单体架构快速上线，支持后续扩展

## 📁 项目结构

```
tarot-backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI应用入口
│   ├── config.py              # 配置管理
│   ├── database.py            # 数据库连接
│   ├── models/                # SQLAlchemy模型
│   │   ├── __init__.py
│   │   ├── card.py           # 卡牌模型
│   │   ├── dimension.py      # 解读维度模型
│   │   ├── interpretation.py # 解读模型
│   │   ├── spread.py         # 牌阵模型
│   │   ├── user.py           # 用户相关模型
│   │   ├── payment.py        # 支付相关模型
│   │   └── transaction.py    # 交易记录模型
│   ├── api/                   # API路由
│   │   ├── __init__.py
│   │   ├── auth.py           # 匿名认证
│   │   ├── readings.py       # 解读相关API
│   │   ├── payments.py       # 支付相关API
│   │   ├── users.py          # 用户API路由
│   │   └── sync.py           # 离线同步API
│   ├── admin/                 # 管理Portal
│   │   ├── __init__.py
│   │   ├── auth.py           # 管理员认证
│   │   ├── routes.py         # 管理页面路由
│   │   └── templates/        # HTML模板
│   │       ├── base.html
│   │       ├── dashboard.html
│   │       ├── users.html
│   │       └── orders.html
│   ├── services/             # 业务逻辑层
│   │   ├── __init__.py
│   │   ├── reading_service.py # 解读业务逻辑
│   │   ├── llm_service.py    # LLM调用服务
│   │   ├── payment_service.py # 支付服务
│   │   ├── user_service.py   # 用户业务逻辑
│   │   ├── google_play.py    # Google Play集成
│   │   └── sync_service.py   # 同步服务
│   ├── schemas/              # Pydantic数据模型
│   │   ├── __init__.py
│   │   ├── card.py          # 卡牌数据模型
│   │   ├── reading.py       # 解读数据模型
│   │   ├── payment.py       # 支付数据模型
│   │   ├── user.py          # 用户相关Schema
│   │   └── sync.py          # 同步数据模型
│   └── utils/                # 工具函数
│       ├── __init__.py
│       ├── auth.py          # 认证工具
│       ├── redeem_code.py   # 兑换码生成工具
│       ├── security.py      # 安全相关工具
│       └── helpers.py       # 辅助函数
├── static/                  # 静态资源
│   ├── admin/              # 管理端静态资源
│   └── images/             # 卡牌图片资源
├── migrations/             # 数据库迁移文件
├── tests/                  # 测试文件目录
├── requirements.txt        # Python依赖包
├── Dockerfile             # Docker配置
├── docker-compose.yml     # 本地开发环境
└── README.md              # 项目文档
```

## 🔧 技术栈

### 后端框架
- **FastAPI 0.104+**: 现代Python Web框架，自动API文档
- **SQLAlchemy 2.0+**: ORM框架，支持异步操作
- **Alembic**: 数据库迁移工具
- **Pydantic 2.0+**: 数据验证和序列化

### 数据库
- **开发环境**: SQLite（简单快速）
- **生产环境**: SQLite（简单快速）

### 外部服务集成
- **LLM服务**: 智谱AI + OpenAI API
- **支付系统**: Google Play + 兑换码系统
- **模板引擎**: Jinja2 (管理Portal)
- **定时任务**: APScheduler
- **认证**: JWT (匿名用户 + 管理员)

### 部署相关
- **Web服务器**: Uvicorn + Gunicorn
- **容器化**: Docker
- **反向代理**: Nginx (生产环境)

## 📊 数据库配置

### 数据库独立化设计 🔥
- **后台数据库**: `./backend_tarot.db` (独立数据库文件)
- **源数据库**: `../tarot-ai-generator/data/tarot_config.db`
- **迁移策略**: 从源数据库复制核心表（card, dimension, card_interpretation）
- **状态**: 需要实施数据库独立化

### 数据库表结构
**现有表**:
1. **card** - 卡牌基础信息
2. **card_style** - 牌面风格
3. **dimension** - 解读维度定义
4. **card_interpretation** - 牌意主表
5. **card_interpretation_dimension** - 牌意维度关联
6. **spread** - 牌阵定义
7. **user_history** - 用户历史记录

**新增支付系统表**:
8. **users** - 匿名用户管理 (installation_id, credits统计)
9. **user_balance** - 用户积分余额 (乐观锁版本控制)
10. **redeem_codes** - 兑换码管理 (状态跟踪, 批次管理)
11. **purchases** - 订单记录 (多平台支付支持)
12. **credit_transactions** - 积分交易记录 (完整审计追踪)

## 🔗 API接口设计

### 认证相关
```
POST /auth/anon          # 生成匿名用户ID
```

### 解读相关（分两步API请求）
```
POST /readings/analyze   # 第一步：分析用户描述，返回3个推荐维度
POST /readings/generate  # 第二步：根据选定维度生成多维度解读
```

### 支付相关
```
# 用户余额和信息
GET  /api/v1/me/balance          # 查询用户余额
GET  /api/v1/me/transactions     # 消费历史记录
POST /api/v1/users/register      # 匿名用户注册

# 兑换码相关
POST /api/v1/redeem              # 兑换码验证兑换

# Google Play支付
POST /api/v1/payments/google/verify    # Google Play购买验证
POST /api/v1/payments/google/consume   # 标记消费完成

# 积分消费
POST /api/v1/consume             # LLM调用前扣点

# Webhook接口
POST /api/v1/webhooks/google     # Google Play服务端通知
POST /api/v1/webhooks/stripe     # Stripe支付回调（预留）
```

### 管理Portal路由
```
# 认证系统
GET  /admin/login               # 管理员登录页面
POST /admin/login               # 管理员认证
POST /admin/logout              # 退出登录

# 仪表板和管理
GET  /admin/dashboard           # 仪表板首页
GET  /admin/users               # 用户管理
GET  /admin/redeem-codes        # 兑换码管理
GET  /admin/orders              # 订单管理
GET  /admin/reports             # 财务报表
GET  /admin/monitor             # 系统监控
```

### 离线同步
```
GET       /sync/initial  # 初始全量同步
GET       /sync/delta    # 增量更新
POST      /sync/manual   # 手动同步
WebSocket /sync/updates  # 实时更新推送
```

## 📅 开发阶段规划

### 阶段1: 数据库与基础架构 (1天) 🔥

#### 1.1 数据库模型创建
- [ ] 创建用户相关模型 (`app/models/user.py`, `payment.py`, `transaction.py`)
- [ ] 编写Alembic迁移脚本添加新表
- [ ] 初始数据填充（默认管理员账户）

#### 1.2 基础服务层
- [ ] 用户服务: 注册、认证、余额管理 (`app/services/user_service.py`)
- [ ] 支付服务: CRUD操作、状态管理 (`app/services/payment_service.py`)
- [ ] Google Play集成服务 (`app/services/google_play.py`)

### 阶段2: 支付API开发 (2天)

#### 2.1 兑换码功能
- [ ] 兑换码生成算法 (`app/utils/redeem_code.py`)
- [ ] 兑换验证逻辑和API (`POST /api/v1/redeem`)
- [ ] 积分发放和交易记录

#### 2.2 Google Play集成
- [ ] Google Play Developer API集成
- [ ] 购买凭证验证流程 (`POST /api/v1/payments/google/verify`)
- [ ] 订单状态同步机制

#### 2.3 积分系统
- [ ] 余额查询和更新API (`GET /api/v1/me/balance`)
- [ ] 消费扣点原子操作 (`POST /api/v1/consume`)
- [ ] 交易历史记录查询 (`GET /api/v1/me/transactions`)

### 阶段3: 管理Portal开发 (2天)

#### 3.1 认证和基础框架
- [ ] 管理员登录系统 (`app/admin/auth.py`)
- [ ] Jinja2模板集成和基础布局 (`app/admin/templates/`)
- [ ] 路由保护和会话管理

#### 3.2 核心管理功能
- [ ] 仪表板数据统计 (`/admin/dashboard`)
- [ ] 用户管理界面 (`/admin/users`)
- [ ] 兑换码管理系统 (`/admin/redeem-codes`)
- [ ] 订单管理界面 (`/admin/orders`)

### 阶段4: 高级功能和优化 (1天)

#### 4.1 报表和监控
- [ ] 财务报表生成 (`/admin/reports`)
- [ ] 系统监控指标 (`/admin/monitor`)
- [ ] 日志查看功能

#### 4.2 安全加固
- [ ] API限流中间件 (`app/utils/security.py`)
- [ ] 操作审计日志
- [ ] CSRF防护和异常监控

### 阶段5: 集成测试和部署 (1天)

#### 5.1 测试覆盖
- [ ] 支付系统单元测试
- [ ] 管理Portal功能测试
- [ ] 安全性测试

#### 5.2 部署配置
- [ ] Docker配置更新 (Jinja2依赖)
- [ ] 环境变量配置完善
- [ ] Nginx配置调整

## 🔑 关键技术实现点

### 1. 匿名用户系统
- UUID生成唯一用户ID
- JWT token管理用户会话
- 无需注册，降低使用门槛

### 2. 解读算法设计（分两步API请求）
**第一步 - 维度分析**：
- 用户输入200字以内描述
- 调用LLM解析用户需求
- 返回3个最相关的dimensions

**第二步 - 具体解读**：
- 基于用户选择的维度
- 参考 `generate_single_interpretation` 方法
- 返回详细的卡牌解读内容

### 3. 支付流程实现
**兑换码系统**:
- 16位混合字符生成，避免易混淆字符
- 批次管理和过期设置
- 防爆破和使用限制

**Google Play集成**:
- Google Play Developer API购买验证
- 订单状态同步和幂等性控制
- 并发安全的余额扣减（乐观锁）

**积分系统**:
- 原子操作积分扣减
- 完整的交易记录审计
- 乐观锁防并发冲突

### 4. 管理Portal架构
**单体应用集成**:
- FastAPI + Jinja2模板引擎
- 路径前缀区分(`/admin/*` vs `/api/*`)
- JWT token + Cookie会话管理

**核心功能模块**:
- 仪表板: 关键指标、趋势图表
- 用户管理: 列表查询、积分调整
- 兑换码管理: 批量生成、状态跟踪
- 订单管理: 多维度筛选、异常处理
- 财务报表: 收入分析、用户分析
- 系统监控: 服务状态、性能指标

## 🚀 快速开始

### 1. 环境配置

#### 复制环境变量模板
```bash
cp .env.example .env
```

#### 编辑环境变量
```env
# 数据库配置
DATABASE_URL=sqlite:///tarot-ai-generator/data/tarot_config.db

# LLM配置（参考 tarot-ai-generator/.env）
API_PROVIDER=zhipu  # 或 openai
ZHIPUAI_API_KEY=your_zhipu_key
OPENAI_API_KEY=your_openai_key
MODEL_NAME=glm-4-flash

# JWT配置
JWT_SECRET_KEY=your_jwt_secret

# 管理员认证
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_admin_password
ADMIN_SESSION_EXPIRE_HOURS=24

# Google Play API配置
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=./google_play_service_account.json
GOOGLE_PACKAGE_NAME=com.mysixth.tarot
GOOGLE_PLAY_ENABLED=true

# 兑换码配置
REDEEM_CODE_LENGTH=16
REDEEM_CODE_PREFIX=TAROT
REDEEM_CODE_EXPIRES_DAYS=365
REDEEM_CODE_DAILY_LIMIT_PER_DEVICE=5

# 积分系统配置
DEFAULT_CREDITS_PER_AI_READING=1
CREDITS_EXPIRE_DAYS=0  # 0表示永不过期

# 支付安全配置
PAYMENT_RATE_LIMIT_PER_HOUR=10
WEBHOOK_SECRET_KEY=your_webhook_secret

# Stripe配置（预留）
STRIPE_SECRET_KEY=your_stripe_secret
```

### 2. 安装依赖
```bash
pip install -r requirements.txt
```

### 3. 运行开发服务器
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 🛡️ 安全考虑

### API安全
- 强制HTTPS传输
- 输入参数验证和过滤
- SQL注入防护（SQLAlchemy ORM）
- XSS攻击防护

### 支付安全
- Google Play购买凭证签名验证
- 支付状态原子性更新
- 敏感信息环境变量管理
- 幂等性控制防重复订单

### 管理Portal安全
- JWT Token + Cookie双重认证
- CSRF防护和表单令牌验证
- 操作审计日志记录
- IP白名单限制（可选）

### 兑换码安全
- 防爆破连续失败锁定
- 设备级别使用限制
- 批次管理和过期控制
- 避免易混淆字符

### 数据安全
- 用户数据最小化收集
- 匿名用户隐私保护
- 定期数据备份策略
- 乐观锁防并发竞争

## 🧪 测试策略

- 测试要创建到tests目录下

### 单元测试
- 支付服务业务逻辑测试 (`tests/services/`)
- 兑换码生成和验证测试 (`tests/utils/`)
- 积分扣减原子操作测试
- API接口输入验证测试
- 数据模型验证测试

### 集成测试
- Google Play API集成测试 (`tests/integration/`)
- 数据库事务完整性测试
- 管理Portal认证流程测试
- 支付流程端到端测试
- 并发场景压力测试

### 安全测试
- SQL注入防护测试
- XSS攻击防护测试
- CSRF防护测试
- API限流效果验证
- 兑换码防爆破测试

### 性能测试
- 数据库查询性能测试
- 大量用户并发测试
- 内存使用和泄漏测试
- API响应时间基准测试

## 📈 扩展性考虑

### 微服务拆分预留
- 用户服务：认证和用户管理
- 解读服务：卡牌和解读逻辑
- 支付服务：支付和订单管理
- 同步服务：数据同步和缓存

### 性能扩展点
- Redis缓存集成（用户余额、商品信息缓存）
- Celery异步任务队列（兑换码批量生成）
- 数据库读写分离
- CDN静态资源加速

## 🚢 部署架构

### 单体应用架构
```
FastAPI应用 (端口8000)
├── /api/v1/*          (用户API - 支付系统)
├── /api/v1/readings/* (解读API - 现有)
├── /admin/*           (管理Portal - 新增)
├── /static/*          (静态资源)
└── /docs              (API文档)
```

### Docker配置更新
```dockerfile
# 新增依赖
RUN pip install jinja2 google-api-python-client

# 挂载Google服务账户密钥
VOLUME ["/app/credentials"]

# 暴露管理端口（可选，用于分离部署）
EXPOSE 8001
```

### Nginx配置示例
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 用户API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 管理Portal
    location /admin/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # 可选：IP白名单限制
        # allow 192.168.1.0/24;
        # deny all;
    }

    # 静态文件
    location /static/ {
        proxy_pass http://localhost:8000;
    }
}
```

## ⚡ 性能优化考虑

### 1. 数据库优化
- 关键字段添加索引（installation_id, code, order_id）
- 读写分离准备（主从配置）
- 连接池配置优化

### 2. 缓存策略
- Redis集成准备（用户余额缓存）
- 商品信息缓存（较少变化）
- 统计数据缓存（仪表板数据）

### 3. 监控告警
- 支付成功率监控
- 兑换码库存预警
- API响应时间监控
- 数据库连接监控

## 📝 关键实现要点

### 1. 数据库配置
- 使用现有的 `../tarot-ai-generator/data/tarot_config.db`
- 数据库已完成初始设计和数据导入
- 需按照数据库表结构创建对应的SQLAlchemy模型

### 2. LLM集成配置
- 参考 `../tarot-ai-generator/.env` 进行LLM服务配置
- 支持智谱AI（zhipu）和OpenAI两种API提供商
- 模型推荐：`glm-4-flash`（智谱）或 `gpt-4`（OpenAI）

### 3. API解读功能设计
- **第一个请求**: 用户输入200字以内描述 → LLM解析 → 返回3个推荐dimensions
- **第二个请求**: 基于选定的维度 → 参考 `generate_single_interpretation` 方法 → 返回详细解读
- 无需历史记录存储，实时生成和返回结果

### 4. 核心参考文件
- 数据库: `../tarot-ai-generator/data/tarot_config.db`
- 环境配置: `../tarot-ai-generator/.env`
- 解读逻辑: `../tarot-ai-generator/main.py` 中的 `generate_single_interpretation` 方法

## ⚠️ 风险和注意事项

### 1. 技术风险
- Google Play API配额限制和服务可用性
- 数据库并发锁竞争和死锁风险
- 第三方服务依赖和故障恢复

### 2. 业务风险
- 兑换码被批量恶意尝试和滥用
- 支付欺诈检测和退款纠纷处理
- 积分系统账务不一致和审计追踪

### 3. 合规风险
- 各地区支付法规差异和合规要求
- 用户数据隐私保护和GDPR合规
- 财务记录审计要求和税务处理

### 4. 安全风险
- 管理Portal暴露面和权限控制
- API接口攻击和频率限制绕过
- 敏感配置泄露和密钥管理

## 📈 后续扩展规划

### 1. 多平台支付集成
- iOS App Store内购集成
- 微信支付H5（国内版本）
- Stripe信用卡支付（国际版本）

### 2. 高级功能开发
- 用户等级和VIP系统
- 积分兑换礼品功能
- 推荐奖励和分销机制

### 3. 运营工具建设
- A/B测试框架集成
- 优惠券和促销系统
- 用户行为分析和漏斗优化

## 📚 数据库表结构详细设计

### 新增支付系统表SQL定义

#### 1. users表 - 匿名用户管理
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    installation_id VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_credits_purchased INTEGER DEFAULT 0,
    total_credits_consumed INTEGER DEFAULT 0
);
```

#### 2. user_balance表 - 用户积分余额
```sql
CREATE TABLE user_balance (
    user_id INTEGER PRIMARY KEY,
    credits INTEGER DEFAULT 0,
    version INTEGER DEFAULT 1,  -- 乐观锁版本号
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
```

#### 3. redeem_codes表 - 兑换码管理
```sql
CREATE TABLE redeem_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(32) UNIQUE NOT NULL,
    product_id INTEGER NOT NULL,
    credits INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'active',  -- active, used, expired, disabled
    used_by INTEGER NULL,
    used_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    batch_id VARCHAR(50) NULL,  -- 批次ID
    FOREIGN KEY (used_by) REFERENCES users (id)
);
```

#### 4. purchases表 - 订单记录
```sql
CREATE TABLE purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id VARCHAR(100) UNIQUE NOT NULL,
    platform VARCHAR(50) NOT NULL,  -- redeem_code, google_play, app_store
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    credits INTEGER NOT NULL,
    amount_cents INTEGER,
    currency VARCHAR(3),
    status VARCHAR(20) DEFAULT 'pending',  -- pending, completed, failed, refunded
    purchase_token TEXT NULL,  -- Google Play/App Store购买凭证
    redeem_code VARCHAR(32) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
```

#### 5. credit_transactions表 - 积分交易记录
```sql
CREATE TABLE credit_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL,  -- earn, consume, refund, admin_adjust
    credits INTEGER NOT NULL,  -- 正数表示增加，负数表示扣减
    balance_after INTEGER NOT NULL,
    reference_type VARCHAR(50) NULL,  -- purchase, reading, refund
    reference_id INTEGER NULL,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
```

---

**开发预计时间**: 7个工作日
**开发人员要求**: 熟悉FastAPI、SQLAlchemy、支付系统集成
**部署要求**: 具备Google Play开发者账户和服务账户密钥

*此文档已根据管理Portal与支付服务开发计划全面更新，用于指导完整的后端开发工作。*

## 📚 解读维度规范

### 规则
- `name`：维度唯一标识，字符串，不可重复。
- `category`：所属大类（情感、事业、健康、人际、学业、决策等）。
- `description`：1-2句话描述该维度的核心解读关注点，可使用中文或多语言。
- `aspect`：
  - 三牌阵：必须根据用户提供的信息分析，按照因果率和发展的趋势分析出3个维度。可以是时间维度（过去、现在、将来），情感维度（我、对方、关系），月运维度（上弦月、下弦月、总体趋势），或其他符合因果关系和发展脉络的三元素组合。
  - 凯尔特十字：按照传统牌位含义固定设定。
- `aspect_type`：
  - 三牌阵：固定为 1/2/3，按照因果逻辑递进顺序排列。
  - 凯尔特十字：固定为 1..10（对应牌位次序）。
- `spread_type`：当前支持 `three-card`（三牌阵）、`celtic-cross`（凯尔特十字）

可以参考表dimensions里的定义。


### 凯尔特十字（10张）维度（spread_type = `celtic-cross`）
| name | category | description | aspect | aspect_type |
| --- | --- | --- | --- | --- |
| 凯尔特十字-现状 | 凯尔特十字 | 展示你当前所处的核心局面与主题焦点。 | 现状 | 1 |
| 凯尔特十字-挑战 | 凯尔特十字 | 揭示阻碍或需要正视的主要挑战与阻力。 | 挑战 | 2 |
| 凯尔特十字-潜意识 | 凯尔特十字 | 映照深层潜意识的态度与隐藏动机。 | 潜意识 | 3 |
| 凯尔特十字-显意识 | 凯尔特十字 | 呈现你在表层意识中的想法与期待。 | 显意识 | 4 |
| 凯尔特十字-过去 | 凯尔特十字 | 回顾近期过去对当前局势的影响与铺垫。 | 过去影响 | 5 |
| 凯尔特十字-未来 | 凯尔特十字 | 预示短期内即将浮现的趋势或事件。 | 未来趋势 | 6 |
| 凯尔特十字-自我态度 | 凯尔特十字 | 分析你对该议题的自我认知与内在姿态。 | 自我态度 | 7 |
| 凯尔特十字-外部影响 | 凯尔特十字 | 评估环境、他人或社会因素对局势的影响。 | 外部影响 | 8 |
| 凯尔特十字-希望恐惧 | 凯尔特十字 | 剖析你内心的期望与顾虑之间的拉扯。 | 希望恐惧 | 9 |
| 凯尔特十字-结果 | 凯尔特十字 | 综合推演事件的最终走向或长期结果。 | 最终结果 | 10 |

> 以上定义同时写入 `app/utils/dimension_definitions.py` 并由后端服务加载校验，确保 API 返回值与数据库中的维度数据保持一致。

<!-- 执行测试脚本的时候 -->
执行测试脚本的时候，加上这个命令：PYTHONIOENCODING=utf-8

## 🗄️ 数据库设计详情

### 核心表结构设计
1. **card** - 卡牌基础信息
   - 78张塔罗牌完整信息
   - 大小阿卡纳分类
   - 花色、编号等属性

2. **card_style** - 牌面风格
   - 支持多种卡牌艺术风格
   - 预留未来扩展

3. **dimension** - 解读维度定义
   - 三牌阵维度（3个）
   - 凯尔特十字维度（10个）
   - 支持动态维度生成

4. **card_interpretation** - 牌意主表
   - 正逆位解读（156条）
   - 基础牌意和详细说明

5. **card_interpretation_dimension** - 牌意维度关联
   - 卡牌与解读维度的多对多关系
   - 支持AI生成的个性化解读

6. **spread** - 牌阵定义
   - 三牌阵布局
   - 凯尔特十字布局
   - 预留扩展牌阵类型

7. **user_history** - 用户历史记录
   - 匿名用户占卜记录
   - 支持离线同步

### 数据库文件管理
- **开发数据库**: `./backend_tarot.db`
- **源数据库**: `../tarot-ai-generator/data/tarot_config.db`
- **迁移策略**: 独立数据库确保后端服务稳定性

## 💡 LLM集成架构

### 双API支持设计
- **智谱AI**: 主要LLM提供商（glm-4-flash）
- **OpenAI**: 备用LLM提供商（gpt-4）
- **配置方式**: 环境变量控制API选择

### 解读生成流程
#### 第一步 - 问题分析 (`/readings/analyze`)
1. 接收用户200字以内问题描述
2. 支持三牌阵和凯尔特十字两种牌阵类型
3. LLM分析问题并推荐相关维度
4. 返回推荐维度列表供用户选择

#### 第二步 - 解读生成 (`/readings/generate`)
1. 接收用户选择的维度和卡牌信息
2. 验证维度数量匹配牌阵类型
3. 调用LLM生成多维度详细解读
4. 返回完整解读结果（dimension_summaries + overall_summary）

### 提示词工程
- 基于 `../tarot-ai-generator/prompt_template.txt`
- 支持维度定制和风格调整
- 多语言解读支持预留

