# 塔罗牌应用全栈开发指南 (CLAUDE.md)

## 📱 项目概述

**塔罗牌应用** 是一个全栈的跨平台塔罗牌应用，采用 Expo React Native + FastAPI + Next.js 架构，提供塔罗牌抽牌、解读和付费AI解读服务，以及现代化的Web管理后台。

### 核心功能
- 匿名用户支持（无需注册）
- 神秘塔罗风格首页设计
- 完整占卜流程（4个步骤）
- 静态基础解读 + 付费LLM动态解读
- 完整的占卜历史记录功能
- 离线同步机制
- 跨平台支持（Android/iOS）
- 现代化Web管理后台系统

## 🏗️ 整体架构

```
[Expo RN 客户端 (my-tarot-app/)]
    ├── 首页 (神秘塔罗风格)
    ├── 占卜流程 (4步骤)
    ├── 历史记录
    ├── 卡牌说明
    └── 系统说明
    ↓ HTTPS
[FastAPI 后端 (tarot-backend/)]
    ├── 卡牌/牌阵/解读 API (✅ 已实现)
    ├── LLM 调用 (智谱AI + OpenAI) (✅ 已实现)
    ├── JWT 匿名认证 (✅ 已实现)
    ├── 支付 (Stripe Checkout) (🔄 待实现)
    ├── SQLite 独立数据库
    └── 静态资源 (卡牌图片)
    ↓ Web管理后台
[Next.js Web管理后台 (tarot-admin-web/)]
    ├── 用户管理 (✅ 已实现)
    ├── 兑换码管理 (✅ 已实现)
    ├── 订单管理 (🔄 待实现)
    ├── 数据仪表板 (✅ 已实现)
    └── 系统监控 (✅ 已实现)
    ↑ 数据生成
[AI生成工具 (tarot-ai-generator/)]
    ├── 维度解读生成 (✅ 已实现)
    ├── 批量内容生成 (✅ 已实现)
    └── 智谱AI集成 (✅ 已实现)
```

## 🛠️ 技术栈总览

### 前端 (my-tarot-app/)
- **框架**: Expo React Native ~54.0.1
- **语言**: TypeScript ~5.9.2
- **导航**: Expo Router ~6.0.0 + React Navigation 7.x
- **本地数据库**: SQLite (Expo SQLite)
- **构建**: EAS Build

### 后端 (tarot-backend/)
- **框架**: FastAPI ~0.104.0 (✅ 已实现)
- **数据库**: SQLite (独立数据库文件)
- **LLM集成**: 智谱AI + OpenAI API (✅ 已实现)
- **认证**: JWT 匿名用户系统 (✅ 已实现)
- **API设计**: 分两步解读流程 (✅ 已实现)
- **支付**: Stripe Checkout (🔄 待集成)
- **部署**: 单体服务器 + Nginx

### Web管理后台 (tarot-admin-web/)
- **框架**: Next.js ~15.5.4 (App Router)
- **语言**: TypeScript ~5.0
- **UI库**: Ant Design ~6.x
- **图表**: @ant-design/charts ~2.6
- **状态管理**: Zustand ~5.0
- **数据获取**: SWR ~2.3
- **样式**: Tailwind CSS + Ant Design

### 开发工具 (tarot-ai-generator/)
- **功能**: AI解读内容生成工具 (✅ 已实现)
- **语言**: Python
- **AI服务**: 智谱AI (glm-4)
- **用途**: 批量生成塔罗牌维度解读内容

## 📁 项目结构

```
MySixth/
├── .docs/                           # 项目文档
├── my-tarot-app/                    # 前端应用 (Expo React Native)
│   ├── app/                         # 页面路由
│   ├── components/                  # 组件库
│   ├── lib/                         # 核心业务逻辑
│   └── CLAUDE.md                    # 前端开发指南
├── tarot-backend/                   # 后端应用 (FastAPI)
│   ├── app/                         # 应用代码
│   ├── static/                      # 静态资源
│   └── CLAUDE.md                    # 后端开发指南
├── tarot-admin-web/                 # Web管理后台 (Next.js)
│   ├── src/                         # 源代码
│   │   ├── app/                     # 页面路由
│   │   ├── components/              # 组件库
│   │   ├── lib/                     # API客户端
│   │   └── types/                   # TypeScript类型
│   └── CLAUDE.md                    # Web管理后台开发指南
├── tarot-ai-generator/              # AI解读生成工具 (Python)
│   ├── main.py                      # 主程序
│   ├── config.py                    # 配置管理
│   └── CLAUDE.md                    # 工具使用指南
└── CLAUDE.md                        # 本文档
```

## 🔌 API 设计概览

### 核心接口

| 方法   | 路径                   | 说明                    | 状态 |
| ---- | -------------------- | --------------------- | --- |
| POST | `/api/v1/users/register`   | 生成匿名用户ID              | ✅ 已实现 |
| GET  | `/cards`       | 获取卡牌列表                | ✅ 已实现 |
| GET  | `/dimensions`  | 获取维度列表                | ✅ 已实现 |
| GET  | `/spreads`     | 获取牌阵列表                | ✅ 已实现 |
| POST | `/readings/analyze` | 第一步：分析用户描述，返回推荐维度 | ✅ 已实现 |
| POST | `/readings/generate` | 第二步：基于选定维度生成多维度解读 | ✅ 已实现 |
| POST | `/payments/checkout` | 创建 Stripe Checkout 会话 | 🔄 待实现 |

### 管理后台接口

| 方法   | 路径                   | 说明                    | 状态 |
| ---- | -------------------- | --------------------- | --- |
| POST | `/admin/login`       | 管理员登录                | ✅ 已实现 |
| GET  | `/admin/users`       | 获取用户列表               | ✅ 已实现 |
| PUT  | `/admin/users/{id}/credits` | 调整用户积分         | ✅ 已实现 |
| GET  | `/admin/redeem-codes` | 获取兑换码列表            | ✅ 已实现 |
| POST | `/admin/redeem-codes/generate` | 批量生成兑换码     | ✅ 已实现 |
| GET  | `/admin/dashboard/metrics` | 获取仪表板统计数据    | ✅ 已实现 |

### 解读API流程

**分两步解读设计**：
1. **分析阶段** (`/readings/analyze`)：用户输入描述 → LLM分析 → 返回推荐维度
2. **生成阶段** (`/readings/generate`)：选择维度和卡牌 → LLM生成 → 返回详细解读

## 📋 占卜流程设计

### 4步骤占卜流程
1. **步骤1**: 选择占卜类型（基础解读/AI解读）
2. **步骤2**: 输入占卜描述（200字以内）
3. **步骤3**: 抽取塔罗牌（支持三牌阵/凯尔特十字）
4. **步骤4**: 查看解读结果（基础牌意/AI详细解读）

## 🎯 开发优先级

### ✅ 已完成阶段 - 核心架构
1. ✅ FastAPI后端框架搭建
2. ✅ 数据库设计和SQLAlchemy模型
3. ✅ 核心API接口实现（认证、卡牌、维度、牌阵）
4. ✅ LLM集成服务（智谱AI + OpenAI双支持）
5. ✅ 分两步解读API流程实现
6. ✅ Next.js Web管理后台开发完成

### 🔄 当前优先级 - 前端开发
1. **第一阶段**: 首页设计与组件架构
2. **第二阶段**: 占卜流程开发（4步骤，与后端API集成）
3. **第三阶段**: 历史记录功能
4. **第四阶段**: 支付集成与优化

### 🔄 待实现功能
- Stripe支付集成（后端）
- 离线同步机制
- 订单管理功能（Web管理后台）
- 部署和监控

## 📚 详细开发指南

### 分支特定文档
- **前端开发**: 参考 `my-tarot-app/CLAUDE.md`
  - 组件架构设计
  - 数据库管理策略
  - AI占卜功能架构
  - 卡牌说明功能架构

- **后端开发**: 参考 `tarot-backend/CLAUDE.md`
  - FastAPI架构设计
  - 数据库表结构详情
  - LLM集成架构
  - API接口实现细节

- **Web管理后台**: 参考 `tarot-admin-web/CLAUDE.md`
  - Next.js + Ant Design架构设计
  - 管理后台功能实现
  - API集成和认证系统
  - 现代化Web体验设计

- **AI工具使用**: 参考 `tarot-ai-generator/CLAUDE.md`
  - 维度解读生成工具
  - 批量内容生成策略
  - 成本控制和质量优化

### 组件特定文档
- **首页组件**: `my-tarot-app/components/home/CLAUDE.md`
- **占卜组件**: `my-tarot-app/components/reading/CLAUDE.md`
- **通用组件**: `my-tarot-app/components/common/CLAUDE.md`

## 💡 开发指导原则

### 对 Claude 的指导
1. **前端优先**: 当前重点实现前端占卜流程和后端API集成
2. **组件化开发**: 严格按照组件库架构开发，保持代码复用性
3. **API集成**: 优先实现与已完成后端API的集成
4. **架构一致性**: 严格按照架构文档的设计模式开发
5. **类型安全**: 前后端都要确保类型定义正确
6. **管理后台**: 现代化Web管理后台已完成，支持用户管理、兑换码管理等功能

### 技术要求
- **前端**: 遵循 React Native 和 TypeScript 最佳实践
- **后端**: 遵循 FastAPI 和 Python 最佳实践
- **Web管理后台**: 遵循 Next.js 和 Ant Design 最佳实践
- **数据库**: 保持数据一致性和完整性
- **API**: RESTful 设计，清晰的错误处理

---

*此文档用于指导塔罗牌应用全栈开发工作，详细的前后端开发指南请参考各自目录下的 CLAUDE.md 文件。*