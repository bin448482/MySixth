# 塔罗牌应用全栈开发指南 (CLAUDE.md)

## 📱 项目概述

**塔罗牌应用** 是一个全栈的跨平台塔罗牌应用，采用 Expo React Native + FastAPI 架构，提供塔罗牌抽牌、解读和付费AI解读服务。

### 项目结构
```
MySixth/
├── .docs/                           # 项目文档
│   ├── tarot_app_architecture_design.md
│   └── tarot_db_design.md
├── my-tarot-app/                    # 前端应用 (Expo React Native)
└── CLAUDE.md                        # 本文档
```

### 核心功能
- 匿名用户支持（无需注册）
- 多种牌阵类型支持
- 静态基础解读 + 付费LLM动态解读
- 离线同步机制
- 跨平台支持（Android/iOS）

## 🛠️ 技术栈总览

### 前端 (my-tarot-app/)
- **框架**: Expo React Native ~54.0.1
- **语言**: TypeScript ~5.9.2
- **导航**: Expo Router ~6.0.0 + React Navigation 7.x
- **本地数据库**: SQLite (Expo SQLite)
- **构建**: EAS Build

### 后端 (待开发)
- **框架**: FastAPI (Python)
- **数据库**: SQLite (初期) → PostgreSQL (扩展)
- **LLM集成**: LangChain + OpenAI API
- **支付**: Stripe Checkout
- **定时任务**: APScheduler
- **部署**: 单体服务器 + Nginx

## 🏗️ 整体架构

```
[Expo RN 客户端 (my-tarot-app/)]
    ↓ HTTPS
[FastAPI 单体后端 (待开发)]
    ├── 卡牌/牌阵/解读 API
    ├── LLM 调用 (LangChain + OpenAI)
    ├── 定时任务 (APScheduler)
    ├── 支付 (Stripe Checkout)
    ├── SQLite / PostgreSQL 单库
    └── 静态资源 (卡牌图片 / JSON)
```

**部署形态 (生产环境)**
- 单台云服务器（2C/4G）
- FastAPI（`uvicorn`）+ SQLite 文件数据库
- Nginx + TLS 反向代理
- Expo EAS 构建客户端包

## 📊 数据库设计

### 核心表结构

#### 1. `card` 表 - 卡牌基础信息
存储塔罗牌的核心属性。

| 字段名     | 类型           | 描述                           |
|------------|----------------|--------------------------------|
| id         | INTEGER (PK)   | 唯一牌ID                       |
| name       | TEXT           | 牌名称（如「愚者」）           |
| arcana     | TEXT           | 大牌/小牌（Major/Minor）       |
| suit       | TEXT           | 花色（小牌适用）               |
| number     | INTEGER        | 牌序号                         |
| image_url  | TEXT           | 默认图像URL                    |
| style_id   | INTEGER (FK)   | 默认使用的牌面风格             |
| deck       | TEXT           | 所属塔罗牌套牌（如Rider-Waite, Thoth）|

#### 2. `card_style` 表 - 牌面风格
管理不同风格的卡牌图像。

| 字段名          | 类型           | 描述                           |
|-----------------|----------------|--------------------------------|
| id              | INTEGER (PK)   | 风格唯一标识                   |
| name            | TEXT           | 风格名称                       |
| image_base_url  | TEXT           | 图像基础路径                   |

#### 3. `dimension` 表 - 解读维度定义
提供可配置的解读维度。

| 字段名      | 类型           | 描述                           |
|-------------|----------------|--------------------------------|
| id          | INTEGER (PK)   | 维度唯一标识                   |
| name        | TEXT           | 维度名称（如：情感-时间线）    |
| category    | TEXT           | 类别（如：情感、事业、健康）   |
| description | TEXT           | 维度详细描述                   |
| aspect      | TEXT           | 维度的具体子项（可选）         |
| aspect_type | TEXT           | 子项的类型或分类（可选）       |

#### 4. `card_interpretation` 表 - 牌意主表
存储卡牌解读的基本信息。

| 字段名      | 类型           | 描述                           |
|-------------|----------------|--------------------------------|
| id          | INTEGER (PK)   | 解释唯一标识                   |
| card_id     | INTEGER (FK)   | 对应的卡牌ID                   |
| direction   | TEXT           | 正位 / 逆位                    |
| summary     | TEXT           | 简要牌意                       |
| detail      | TEXT           | 详细说明（可选）               |

#### 5. `card_interpretation_dimension` 表 - 牌意维度关联
支持多维度、细粒度的卡牌解读。

| 字段名            | 类型           | 描述                           |
|-------------------|----------------|--------------------------------|
| id                | INTEGER (PK)   | 关联唯一标识                   |
| interpretation_id | INTEGER (FK)   | 关联到 card_interpretation.id  |
| dimension_id      | INTEGER (FK)   | 关联到 dimension.id            |
| aspect            | TEXT           | 具体维度子项（从dimension复制）|
| aspect_type       | TEXT           | 子项的类型或分类（从dimension复制）|
| content           | TEXT           | 该维度下的解读文字             |

#### 6. `spread` 表 - 牌阵定义
定义不同类型的塔罗牌阵。

| 字段名        | 类型           | 描述                           |
|---------------|----------------|--------------------------------|
| id            | INTEGER (PK)   | 牌阵唯一标识                   |
| name          | TEXT           | 牌阵名称                       |
| description   | TEXT           | 牌阵描述                       |
| card_count    | INTEGER        | 牌阵所需卡牌数量               |

#### 7. `user_history` 表 - 用户历史记录
记录用户的占卜历史。

| 字段名              | 类型           | 描述                           |
|---------------------|----------------|--------------------------------|
| id                  | INTEGER (PK)   | 记录唯一标识                   |
| user_id             | TEXT           | 用户ID（可匿名）               |
| timestamp           | DATETIME       | 记录时间                       |
| spread_id           | INTEGER (FK)   | 使用的牌阵ID                   |
| card_ids            | TEXT (JSON)    | 抽到的卡牌ID数组               |
| interpretation_mode | TEXT           | 解读方式（default/ai）         |
| result              | TEXT (JSON)    | 解读结果（结构可自定义）       |

## 🔌 API 设计规范

### 核心接口

| 方法   | 路径                   | 说明                    |
| ---- | -------------------- | --------------------- |
| POST | `/auth/anon`         | 生成匿名用户ID              |
| GET  | `/cards`             | 获取卡牌列表                |
| GET  | `/dimensions`        | 获取维度列表                |
| POST | `/readings`          | 请求一次解读（同步 LLM 调用）     |
| GET  | `/readings/{id}`     | 获取历史解读结果              |
| POST | `/payments/checkout` | 创建 Stripe Checkout 会话 |
| POST | `/webhooks/stripe`   | Stripe 支付回调           |

### 离线同步API

| 方法   | 路径                   | 说明                    |
| ---- | -------------------- | --------------------- |
| GET  | `/sync/initial`      | 获取初始全量数据              |
| GET  | `/sync/delta`        | 获取增量更新                |
| POST | `/sync/manual`       | 手动触发同步                |
| WebSocket | `/sync/updates`  | 实时更新推送               |

## 🔄 离线同步架构

### 同步策略
- **初始化同步**: 首次启动时下载全量数据
- **增量更新**: 后端通过推送通知触发更新
- **手动同步**: 用户可主动触发同步
- **排除同步**: `user_history` 表不参与同步

### 同步模式
1. **自动后台同步**
   - 应用启动时检查更新
   - 网络环境稳定时静默同步
2. **手动同步**
   - 用户可在设置中主动触发
   - 提供同步进度和结果反馈

### 同步表
需要同步的表：
1. `card`
2. `card_style`
3. `dimension`
4. `card_interpretation`
5. `card_interpretation_dimension`
6. `spread`
7. `user`

### 技术实现
- **客户端本地数据库**: SQLite/Realm
- **更新通知**: WebSocket / Server-Sent Events
- **数据传输**: 增量更新，最小化网络负载

### 冲突解决
- 服务端版本号优先
- 基于时间戳的更新合并
- 保留最新服务端数据

## 🛡️ 安全与隐私

### MVP 安全要求
- 强制 HTTPS
- SQLite 文件读写权限限制
- Stripe 回调签名校验
- 基础输入过滤，防止敏感内容传入 LLM

### 数据隐私
- 支持匿名用户，降低隐私风险
- 用户历史数据可选择性清除
- 最小化数据收集原则

## 🚀 部署与运维

### 客户端部署
- **构建**: 使用 EAS Build 构建原生应用
- **更新**: 支持 OTA 更新，快速迭代JS层逻辑
- **发布**: Android APK + iOS IPA 双平台发布

### 服务端部署
- **环境**: 单台云服务器（2C/4G）
- **服务**: FastAPI + uvicorn + systemd/pm2 守护
- **代理**: Nginx + TLS 反向代理
- **证书**: Let's Encrypt 自动更新

### 监控
- 简单日志监控（uvicorn 日志 + Stripe webhook 日志）
- 数据库每日备份（crontab）

## 📈 演进路线

| 触发点     | 升级方向                        |
| ------- | --------------------------- |
| 请求量增大   | 增加 Redis 缓存、Celery 异步任务     |
| 数据量增大   | 迁移到 PostgreSQL              |
| LLM 成本高 | 缓存结果 / prompt 优化 / 降级链路     |
| 架构复杂度上升 | 拆分为 API / Worker / Admin 服务 |

## 🎯 MVP 开发优先级

### 第一阶段 - 核心功能
1. 数据库设计和初始数据
2. 基础 FastAPI 后端 API
3. Expo 前端基础框架
4. 卡牌抽取和基础解读功能

### 第二阶段 - 增强功能  
1. 离线同步机制
2. 付费 LLM 解读集成
3. Stripe 支付集成
4. 用户历史记录

### 第三阶段 - 优化迭代
1. 性能优化和缓存
2. UI/UX 优化
3. 更多牌阵和解读维度
4. 部署和监控完善

## 💡 开发指导原则

### 对 Claude 的指导
1. **架构一致性**: 严格按照架构文档的设计模式开发
2. **数据库优先**: 所有数据操作都要符合数据库设计文档
3. **MVP 优先**: 避免过度设计，优先实现核心功能
4. **离线优先**: 考虑网络状况不佳的场景，设计要支持离线使用
5. **类型安全**: 前后端都要确保类型定义正确

### 开发最佳实践
- **前端**: 遵循 React Native 和 TypeScript 最佳实践
- **后端**: 遵循 FastAPI 和 Python 最佳实践
- **数据库**: 保持数据一致性和完整性
- **API**: RESTful 设计，清晰的错误处理
- **安全**: 最小权限原则，输入验证

### 常见开发场景
- **新增卡牌解读维度** → 修改 `dimension` 表和相关API
- **新增牌阵类型** → 修改 `spread` 表和前端选择界面  
- **优化解读算法** → 修改后端LLM调用逻辑
- **添加新的卡牌风格** → 修改 `card_style` 表和图片资源

---

*此文档基于 `.docs/tarot_app_architecture_design.md` 和 `.docs/tarot_db_design.md` 编写，用于指导全栈开发工作。*