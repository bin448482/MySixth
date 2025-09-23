# 塔罗牌应用后端开发指南 (CLAUDE.md)

## 📖 项目简介

**塔罗牌应用后端服务** 是一个基于 FastAPI 的塔罗牌应用后端，支持匿名用户、牌阵解读、LLM集成和支付功能。采用单体架构快速上线，支持后续扩展。

## 🎯 核心目标

- 支持匿名用户系统，降低使用门槛
- 提供静态基础解读 + 付费LLM动态解读
- 实现完整的离线同步机制
- 集成Stripe支付系统
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
- **支付系统**: Stripe Checkout
- **定时任务**: APScheduler
- **认证**: JWT (匿名用户)

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
1. **card** - 卡牌基础信息
2. **card_style** - 牌面风格
3. **dimension** - 解读维度定义
4. **card_interpretation** - 牌意主表
5. **card_interpretation_dimension** - 牌意维度关联
6. **spread** - 牌阵定义
7. **user_history** - 用户历史记录

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

## 📅 开发阶段规划

### 第一阶段：项目基础搭建 (2-3天)

#### 1.1 项目初始化 ✅
- [x] 创建项目目录结构
- [x] 配置Python虚拟环境
- [x] 安装核心依赖包
- [x] 设置开发环境配置文件

#### 1.2 数据库独立化实现 🔥
- [x] 修改数据库配置指向独立数据库文件
- [x] 创建数据库初始化脚本从源数据库复制数据
- [x] 复制核心表（card, dimension, card_interpretation）
- [x] 确保_create_dynamic_dimension保存到后台数据库
- [x] 验证数据库表结构和数据完整性

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
- [ ] 参考 `../tarot-ai-generator/.env` 配置LLM服务
- [ ] 支持智谱AI和OpenAI两种API提供商
- [ ] 实现维度分析接口（第一步API）
- [ ] 实现解读生成接口（第二步API，参考 `generate_single_interpretation`）
- [ ] 配置提示词模板和参数
- [ ] 实现API调用限流和错误处理

#### 3.2 解读系统API设计 ✅
- [x] `POST /readings/analyze` - 分析用户描述，返回推荐维度
  - 接收用户200字以内描述，支持三牌阵和凯尔特十字
  - 调用LLM解析需求（通过reading_service.analyze_user_description）
  - 返回推荐维度列表
- [x] `POST /readings/generate` - 生成多维度解读内容
  - 接收用户选择的多个维度和卡牌信息（支持完整CardInfo对象）
  - 验证维度数量与牌阵类型匹配（三牌阵3个维度，凯尔特十字10个维度）
  - 调用reading_service.generate_interpretation生成多维度解读
  - 返回详细的GenerateResponse（包含overall_summary）
- [x] 解读结果实时返回（无需存储历史）
- [x] 支持数据自包含设计，客户端传递完整对象信息，减少数据库ID依赖

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

# 支付配置
STRIPE_SECRET_KEY=your_stripe_secret

# JWT配置
JWT_SECRET_KEY=your_jwt_secret
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
- Stripe webhook签名验证
- 支付状态原子性更新
- 敏感信息环境变量管理

### 数据安全
- 用户数据最小化收集
- 匿名用户隐私保护
- 定期数据备份策略

## 🧪 测试策略

- 测试要创建到tests目录下

### 单元测试
- 业务逻辑层测试
- API接口测试
- 数据模型验证测试

### 集成测试
- 数据库操作测试
- 外部API集成测试
- 支付流程测试

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

## ⚠️ 注意事项

- 严格按照本架构设计进行开发
- 优先实现 MVP 功能，避免过度设计
- 保持代码质量和文档完整性
- 及时进行代码审查和测试

---

*此文档用于指导塔罗牌应用后端开发工作，与主项目的CLAUDE.md配合使用。*

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

