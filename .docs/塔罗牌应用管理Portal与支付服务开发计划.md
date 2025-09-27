# 塔罗牌应用管理Portal与支付服务开发计划

## 🎯 总体架构策略

基于现有FastAPI后端架构，采用**单体应用集成模式**：
- **管理Portal**: 基于FastAPI + Jinja2模板，集成在同一个应用中
- **支付API**: 扩展现有API路由结构
- **部署方式**: 一体化部署，通过路径前缀区分管理端和用户端

## 📊 数据库设计

### 现有表结构分析
- ✅ `card` - 卡牌基础信息
- ✅ `dimension` - 解读维度定义
- ✅ `card_interpretation` - 牌意主表
- ✅ `spread` - 牌阵定义

### 新增表结构
1. **users表** - 匿名用户管理
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

2. **user_balance表** - 用户积分余额
   ```sql
   CREATE TABLE user_balance (
       user_id INTEGER PRIMARY KEY,
       credits INTEGER DEFAULT 0,
       version INTEGER DEFAULT 1,  -- 乐观锁版本号
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (user_id) REFERENCES users (id)
   );
   ```

<!-- 3. **products表** - 商品定义
   ```sql
   CREATE TABLE products (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       name VARCHAR(255) NOT NULL,
       description TEXT,
       credits INTEGER NOT NULL,
       price_cents INTEGER,  -- 价格(分)
       currency VARCHAR(3) DEFAULT 'CNY',
       platform VARCHAR(50) NOT NULL,  -- redeem_code, google_play, app_store
       product_id VARCHAR(255),  -- 平台商品ID
       active BOOLEAN DEFAULT TRUE,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ``` -->

4. **redeem_codes表** - 兑换码管理
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
       FOREIGN KEY (product_id) REFERENCES products (id),
       FOREIGN KEY (used_by) REFERENCES users (id)
   );
   ```

5. **purchases表** - 订单记录
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
       FOREIGN KEY (user_id) REFERENCES users (id),
       FOREIGN KEY (product_id) REFERENCES products (id)
   );
   ```

6. **credit_transactions表** - 积分交易记录
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

## 🔧 管理Portal功能模块

### 1. 认证系统
- **登录页面**: `/admin/login`
- **会话管理**: JWT token + Cookie
- **权限控制**: 装饰器保护管理页面

### 2. 仪表板 - `/admin/dashboard`
- **关键指标**: 今日注册用户、活跃用户、收入统计
- **趋势图表**: 用户增长、收入趋势、LLM调用量
- **快速操作**: 生成兑换码、查看最新订单

### 3. 用户管理 - `/admin/users`
- **用户列表**: 分页显示、搜索过滤
- **用户详情**: 积分余额、消费记录、最后活跃时间
- **操作功能**: 手动调整积分、查看交易记录
- **数据导出**: CSV格式导出用户数据

<!-- ### 4. 商品管理 - `/admin/products`
- **商品列表**: 不同平台商品展示
- **添加/编辑**: 商品信息、定价、状态管理
- **批量操作**: 启用/禁用、价格调整 -->

### 5. 兑换码管理 - `/admin/redeem-codes`
- **批量生成**: 指定商品、数量、有效期、批次
- **码库管理**: 状态筛选、搜索、导出
- **使用统计**: 兑换率、热门商品分析
- **安全设置**: 码长度、前缀配置、防刷策略

### 6. 订单管理 - `/admin/orders`
- **订单列表**: 多维度筛选（平台、状态、时间）
- **订单详情**: 支付信息、用户信息、处理日志
- **异常处理**: 失败订单重试、手动退款
- **对账功能**: 平台收入对比、差异报告

### 7. 财务报表 - `/admin/reports`
- **收入报表**: 日/月/年收入统计，平台分布
- **用户分析**: 付费用户占比、ARPU值、留存率
- **商品分析**: 销量排行、收入贡献、库存预警
- **成本分析**: LLM调用成本、服务器成本跟踪

### 8. 系统监控 - `/admin/monitor`
- **服务状态**: 数据库连接、外部API状态
- **性能指标**: 响应时间、错误率、并发数
- **日志查看**: 错误日志、操作日志实时查看
- **告警设置**: 关键指标异常邮件通知

## 🚀 支付API开发

### 1. 用户相关接口
```python
# 用户余额和信息
GET  /api/v1/me/balance          # 查询用户余额
GET  /api/v1/me/transactions     # 消费历史记录
POST /api/v1/users/register      # 匿名用户注册（基于installation_id）
```

<!-- ### 2. 商品相关接口
```python
GET /api/v1/products             # 获取可购买商品列表
GET /api/v1/products/{platform}  # 获取特定平台商品
``` -->

### 3. 兑换码相关接口
```python
POST /api/v1/redeem              # 兑换码验证兑换
# 请求: {"code": "ABC123", "installation_id": "uuid"}
# 响应: {"success": true, "credits": 100, "balance": 150}
```

### 4. Google Play支付接口
```python
POST /api/v1/payments/google/verify    # Google Play购买验证
# 请求: {
#   "purchase_token": "token",
#   "product_id": "credits_10",
#   "installation_id": "uuid"
# }
# 响应: {"success": true, "order_id": "order_123", "credits": 10}

POST /api/v1/payments/google/consume   # 标记消费完成
```

### 5. 积分消费接口
```python
POST /api/v1/consume                   # LLM调用前扣点
# 请求: {"installation_id": "uuid", "credits": 1, "type": "ai_reading"}
# 响应: {"success": true, "remaining": 49, "transaction_id": 123}
```

### 6. Webhook接口
```python
POST /api/v1/webhooks/google           # Google Play服务端通知
POST /api/v1/webhooks/stripe           # Stripe支付回调（预留）
```

## 🔒 安全与权限设计

### 1. 管理Portal安全
- **认证方式**: 用户名密码 + JWT Token
- **会话管理**: 24小时过期，支持刷新
- **权限控制**: 基于装饰器的路由保护
- **CSRF防护**: 表单令牌验证
- **操作审计**: 关键操作记录到audit_logs表

### 2. API安全加固
- **幂等性控制**: 基于order_id防重复订单
- **并发安全**: 余额扣减使用乐观锁 + 重试
- **频率限制**: IP级别和用户级别双重限流
- **参数验证**: Pydantic模型严格验证输入
- **签名验证**: Webhook请求签名校验

### 3. 兑换码安全
- **生成策略**: 16位混合字符，避免易混淆字符
- **批次管理**: 支持批量禁用和过期设置
- **使用限制**: 单设备每日兑换次数限制
- **防爆破**: 连续失败后锁定IP/设备

## 🏗️ 技术实现路径

### 阶段1: 数据库与基础架构 (1天)

#### 1.1 数据库模型创建
- 创建6个新表的SQLAlchemy模型类
- 编写Alembic迁移脚本
- 初始数据填充（默认商品、管理员账户）

#### 1.2 基础服务层
- 用户服务: 注册、认证、余额管理
- 商品服务: CRUD操作、状态管理
- 订单服务: 创建、状态更新、查询

### 阶段2: 支付API开发 (2天)

#### 2.1 兑换码功能
- 兑换码生成算法（批量、唯一性保证）
- 兑换验证逻辑（状态检查、幂等性）
- 积分发放和交易记录

#### 2.2 Google Play集成
- Google Play Developer API集成
- 购买凭证验证流程
- 订单状态同步机制

#### 2.3 积分系统
- 余额查询和更新逻辑
- 消费扣点原子操作
- 交易历史记录和查询

### 阶段3: 管理Portal开发 (2天)

#### 3.1 认证和基础框架
- 管理员登录页面和认证逻辑
- Jinja2模板系统集成
- 基础布局和导航组件

#### 3.2 核心管理功能
- 仪表板数据统计和图表
- 用户管理界面（列表、详情、操作）
- 兑换码管理（生成、导出、状态管理）
- 订单管理（列表、筛选、详情）

### 阶段4: 高级功能和优化 (1天)

#### 4.1 报表和监控
- 财务报表生成
- 系统监控指标收集
- 日志查看和搜索功能

#### 4.2 安全加固
- API限流中间件
- 操作审计日志
- 异常监控和告警

### 阶段5: 集成测试和部署 (1天)

#### 5.1 集成配置
- 环境变量配置完善
- Docker配置更新
- Nginx配置调整

#### 5.2 测试和部署
- API接口测试
- 管理Portal功能测试
- 生产环境部署验证

## 📁 文件结构规划

```
tarot-backend/
├── app/
│   ├── models/
│   │   ├── user.py              # 用户相关模型
│   │   ├── payment.py           # 支付相关模型
│   │   └── transaction.py       # 交易记录模型
│   ├── api/
│   │   ├── payments.py          # 支付API路由
│   │   ├── users.py             # 用户API路由
│   ├── admin/                   # 管理Portal
│   │   ├── __init__.py
│   │   ├── auth.py              # 管理员认证
│   │   ├── routes.py            # 管理页面路由
│   │   └── templates/           # HTML模板
│   │       ├── base.html
│   │       ├── dashboard.html
│   │       ├── users.html
│   │       └── orders.html
│   ├── services/
│   │   ├── payment_service.py   # 支付业务逻辑
│   │   ├── user_service.py      # 用户业务逻辑
│   │   └── google_play.py       # Google Play集成
│   ├── schemas/
│   │   ├── payment.py           # 支付相关Schema
│   │   └── user.py              # 用户相关Schema
│   └── utils/
│       ├── redeem_code.py       # 兑换码生成工具
│       └── security.py          # 安全相关工具
├── migrations/                  # 数据库迁移
├── static/admin/                # 管理端静态资源
└── tests/                       # 测试文件
```

## 🚢 部署策略

### 单体应用架构
```
FastAPI应用 (端口8000)
├── /api/v1/*          (用户API - 现有)
├── /admin/*           (管理Portal - 新增)
├── /static/*          (静态资源)
└── /docs              (API文档)
```

### 环境配置新增
```env
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

## 🧪 测试策略

### 1. 单元测试
- 支付服务业务逻辑测试
- 兑换码生成和验证测试
- 积分扣减原子操作测试

### 2. 集成测试
- Google Play API集成测试
- 数据库事务完整性测试
- 并发场景压力测试

### 3. 安全测试
- SQL注入防护测试
- XSS攻击防护测试
- 频率限制效果测试

## 📈 后续扩展规划

### 1. 多平台支付
- iOS App Store内购集成
- Stripe信用卡支付
- 微信支付H5（国内版）

### 2. 高级功能
- 用户等级和VIP系统
- 积分兑换礼品功能
- 推荐奖励机制

### 3. 运营工具
- A/B测试框架
- 优惠券和促销系统
- 用户行为分析

## ⚠️ 风险和注意事项

### 1. 技术风险
- Google Play API配额限制
- 数据库并发锁竞争
- 第三方服务可用性依赖

### 2. 业务风险
- 兑换码被批量恶意尝试
- 支付欺诈和退款纠纷
- 积分系统账务不一致

### 3. 合规风险
- 各地区支付法规差异
- 用户数据隐私保护
- 财务记录审计要求

---

**开发预计时间**: 7个工作日
**开发人员要求**: 熟悉FastAPI、SQLAlchemy、支付系统集成
**部署要求**: 具备Google Play开发者账户和服务账户密钥