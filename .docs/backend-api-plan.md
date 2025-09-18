# 塔罗牌应用后端API搭建计划

## 🎯 项目概述

搭建基于 FastAPI 的塔罗牌应用后端服务，支持匿名用户、牌阵解读、LLM集成和支付功能。

### 核心目标
- 支持匿名用户系统，降低使用门槛
- 提供静态基础解读 + 付费LLM动态解读
- 实现完整的离线同步机制
- 集成Stripe支付系统
- 单体架构快速上线，支持后续扩展

## 📁 项目结构规划

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
│   │   └── user_history.py   # 用户历史模型
│   ├── api/                   # API路由
│   │   ├── __init__.py
│   │   ├── auth.py           # 匿名认证
│   │   ├── readings.py       # 解读相关API
│   │   ├── payments.py       # 支付相关API
│   │   └── sync.py           # 离线同步API
│   ├── services/             # 业务逻辑层
│   │   ├── __init__.py
│   │   ├── reading_service.py # 解读业务逻辑
│   │   ├── llm_service.py    # LLM调用服务
│   │   ├── payment_service.py # 支付服务
│   │   └── sync_service.py   # 同步服务
│   ├── schemas/              # Pydantic数据模型
│   │   ├── __init__.py
│   │   ├── card.py          # 卡牌数据模型
│   │   ├── reading.py       # 解读数据模型
│   │   ├── payment.py       # 支付数据模型
│   │   └── sync.py          # 同步数据模型
│   └── utils/                # 工具函数
│       ├── __init__.py
│       ├── auth.py          # 认证工具
│       └── helpers.py       # 辅助函数
├── static/                  # 静态资源
│   └── images/             # 卡牌图片资源
├── migrations/             # 数据库迁移文件
├── tests/                  # 测试文件目录
├── requirements.txt        # Python依赖包
├── Dockerfile             # Docker配置
├── docker-compose.yml     # 本地开发环境
└── README.md              # 项目文档
```

## 🔧 技术栈选择

### 后端框架
- **FastAPI 0.104+**: 现代Python Web框架，自动API文档
- **SQLAlchemy 2.0+**: ORM框架，支持异步操作
- **Alembic**: 数据库迁移工具
- **Pydantic 2.0+**: 数据验证和序列化

### 数据库
- **开发环境**: SQLite（简单快速）
- **生产环境**: SQLite（简单快速）

### 外部服务集成
- **LLM服务**: LangChain + OpenAI API
- **支付系统**: Stripe Checkout
- **定时任务**: APScheduler
- **认证**: JWT (匿名用户)

### 部署相关
- **Web服务器**: Uvicorn + Gunicorn
- **容器化**: Docker
- **反向代理**: Nginx (生产环境)

## 📅 开发阶段规划

### 第一阶段：项目基础搭建 (2-3天)

#### 1.1 项目初始化
- [ ] 创建项目目录结构
- [ ] 配置Python虚拟环境
- [ ] 安装核心依赖包
- [ ] 设置开发环境配置文件

#### 1.2 数据库设计实现
- [ ] 根据现有数据库创建SQLAlchemy模型（数据库位置：`tarot-ai-generator/data/tarot_config.db`）
- [ ] 连接现有SQLite数据库
- [ ] 验证数据库表结构和数据完整性

#### 1.3 FastAPI基础框架
- [ ] 创建FastAPI应用入口
- [ ] 配置CORS和安全中间件
- [ ] 实现全局异常处理
- [ ] 设置日志系统

### 第二阶段：核心API开发 (3-4天)

#### 2.1 认证系统
- [ ] 实现匿名用户ID生成 (`POST /auth/anon`)
- [ ] JWT token生成和验证
- [ ] 用户身份识别中间件
- [ ] 认证装饰器实现


### 第三阶段：高级功能开发 (3-4天)

#### 3.1 LLM集成服务
- [ ] 参考 `tarot-ai-generator/.env` 配置LLM服务
- [ ] 支持智谱AI和OpenAI两种API提供商
- [ ] 实现维度分析接口（第一步API）
- [ ] 实现解读生成接口（第二步API，参考 `generate_single_interpretation`）
- [ ] 配置提示词模板和参数
- [ ] 实现API调用限流和错误处理

#### 3.2 解读系统API设计
- [ ] `POST /readings/analyze` - 分析用户描述，返回推荐维度
  - 接收用户200字以内描述
  - 调用LLM解析需求
  - 返回3个最相关维度
- [ ] `POST /readings/generate` - 生成具体解读内容
  - 接收用户选择的维度和卡牌信息
  - 调用 `generate_single_interpretation` 逻辑
  - 返回详细解读结果
- [ ] 解读结果实时返回（无需存储历史）

#### 3.3 支付系统集成
- [ ] Stripe Checkout会话创建
- [ ] `POST /payments/checkout` - 创建支付会话
- [ ] `POST /webhooks/stripe` - 支付成功回调处理
- [ ] 支付状态管理和验证
- [ ] 付费解读权限控制

### 第四阶段：离线同步系统 (2-3天)

#### 4.1 同步API设计
- [ ] `GET /sync/initial` - 初始全量数据同步
- [ ] `GET /sync/delta` - 增量更新数据获取
- [ ] `POST /sync/manual` - 手动触发同步
- [ ] WebSocket实时更新推送 (`/sync/updates`)

#### 4.2 版本控制系统
- [ ] 数据版本时间戳管理
- [ ] 增量更新算法实现
- [ ] 冲突解决机制（服务端优先）
- [ ] 同步状态跟踪

#### 4.3 同步优化
- [ ] 数据压缩传输
- [ ] 增量更新最小化
- [ ] 同步进度反馈
- [ ] 离线缓存策略

### 第五阶段：部署和优化 (2-3天)

#### 5.1 容器化部署
- [ ] 编写Dockerfile
- [ ] 创建docker-compose配置
- [ ] 环境变量配置管理
- [ ] 生产环境优化设置

#### 5.2 性能优化
- [ ] 数据库查询优化（索引、连接池）
- [ ] API响应缓存（Redis集成准备）
- [ ] 异步处理优化
- [ ] 内存使用优化

#### 5.3 监控和测试
- [ ] API自动化测试编写
- [ ] 错误监控和日志收集
- [ ] 健康检查端点
- [ ] API文档完善（Swagger）

## 🔗 API接口详细设计

### 认证相关
```
POST /auth/anon          # 生成匿名用户ID
```

### 解读相关
```
POST /readings/analyze   # 第一步：分析用户描述，返回3个推荐维度
POST /readings/generate  # 第二步：根据选定维度生成具体解读
```

### 支付相关
```
POST /payments/checkout  # 创建Stripe支付会话
POST /webhooks/stripe    # Stripe回调处理
```

### 离线同步
```
GET       /sync/initial  # 初始全量同步
GET       /sync/delta    # 增量更新
POST      /sync/manual   # 手动同步
WebSocket /sync/updates  # 实时更新推送
```

## 🗄️ 数据库表结构

基于设计文档的7个核心表：

1. **card** - 卡牌基础信息
2. **card_style** - 牌面风格
3. **dimension** - 解读维度定义
4. **card_interpretation** - 牌意主表
5. **card_interpretation_dimension** - 牌意维度关联
6. **spread** - 牌阵定义
7. **user_history** - 用户历史记录

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
- Stripe Checkout创建支付会话
- Webhook验证支付结果
- 付费解读权限管理

### 4. 离线同步机制
- 时间戳版本控制
- 增量更新传输
- 冲突解决（服务端优先）

<!-- ### 5. 定时任务管理
- APScheduler管理后台任务
- 数据更新和维护
- 缓存清理和优化 -->

## 📊 数据库配置

### 现有数据库
- **数据库文件**: `tarot-ai-generator/data/tarot_config.db`
- **数据库类型**: SQLite
- **状态**: 已完成设计和初始化
- **表结构**: 按照设计文档的7个核心表创建


## 🛡️ 安全考虑

### API安全
- 强制HTTPS传输
- 输入参数验证和过滤
- SQL注入防护（SQLAlchemy ORM）
- XSS攻击防护

### 支付安全
- Stripe webhook签名验证
- 支付状态原子性更新
- 敏感信息环境变量管理

### 数据安全
- 用户数据最小化收集
- 匿名用户隐私保护
- 定期数据备份策略

## 🚀 部署方案

### 开发环境
```bash
# 本地开发
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Docker开发环境
docker-compose up -d
```

### 生产环境
```bash
# Docker部署
docker build -t tarot-backend .
docker run -d -p 8000:8000 tarot-backend

# 配合Nginx反向代理
# SSL证书使用Let's Encrypt
```

### 环境变量配置
```env
# 数据库配置
DATABASE_URL=sqlite:///tarot-ai-generator/data/tarot_config.db

# LLM配置（参考 tarot-ai-generator/.env）
API_PROVIDER=zhipu  # 或 openai

# 智谱AI配置
ZHIPUAI_API_KEY=your_zhipu_key

# OpenAI配置
OPENAI_API_KEY=your_openai_key
OPENAI_BASE_URL=https://api.hdgsb.com/v1

# 模型配置
MODEL_NAME=glm-4-flash  # 或 gpt-4
TEMPERATURE=0.7
MAX_TOKENS=1000

# 支付配置
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# JWT配置
JWT_SECRET_KEY=your_jwt_secret
JWT_ALGORITHM=HS256
```

## 📈 扩展性考虑

### 微服务拆分预留
- 用户服务：认证和用户管理
- 解读服务：卡牌和解读逻辑
- 支付服务：支付和订单管理
- 同步服务：数据同步和缓存

### 性能扩展点
- Redis缓存集成
- Celery异步任务队列
- 数据库读写分离
- CDN静态资源加速

### 功能扩展方向
- 多语言支持框架
- 更多LLM模型集成
- 用户个性化推荐
- 社交功能模块

## 🧪 测试策略

### 单元测试
- 业务逻辑层测试
- API接口测试
- 数据模型验证测试

### 集成测试
- 数据库操作测试
- 外部API集成测试
- 支付流程测试

### 性能测试
- API响应时间测试
- 并发处理能力测试
- 数据库查询优化验证

---

## 📝 开发备注

### 关键实现要点（根据现有项目更新）
1. **数据库配置**
   - 使用现有的 `tarot-ai-generator/data/tarot_config.db`
   - 数据库已完成初始设计和数据导入
   - 需按照数据库表结构创建对应的SQLAlchemy模型

2. **LLM集成配置**
   - 参考 `tarot-ai-generator/.env` 进行LLM服务配置
   - 支持智谱AI（zhipu）和OpenAI两种API提供商
   - 模型推荐：`glm-4-flash`（智谱）或 `gpt-4`（OpenAI）

3. **API解读功能设计**
   - **第一个请求**: 用户输入200字以内描述 → LLM解析 → 返回3个推荐dimensions
   - **第二个请求**: 基于选定的维度 → 参考 `generate_single_interpretation` 方法 → 返回详细解读
   - 无需历史记录存储，实时生成和返回结果

4. **核心参考文件**
   - 数据库: `tarot-ai-generator/data/tarot_config.db`
   - 环境配置: `tarot-ai-generator/.env`
   - 解读逻辑: `tarot-ai-generator/main.py` 中的 `generate_single_interpretation` 方法

### 下一步行动
1. 根据本计划调整开发优先级
2. 确定具体的开发时间安排
3. 准备开发环境和工具
4. 开始第一阶段的项目初始化

### 注意事项
- 严格按照 CLAUDE.md 中的架构设计进行开发
- 优先实现 MVP 功能，避免过度设计
- 保持代码质量和文档完整性
- 及时进行代码审查和测试

---

*此文档基于项目需求和架构设计生成，可根据实际开发过程进行调整和完善。*