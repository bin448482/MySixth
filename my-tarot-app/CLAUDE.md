# 塔罗牌应用前端开发指南 (CLAUDE.md)

## 📱 项目信息

**my-tarot-app** 是塔罗牌应用的 Expo React Native 前端客户端，支持 Android/iOS 双平台。

### 技术栈
- **框架**: Expo React Native ~54.0.1
- **语言**: TypeScript ~5.9.2
- **导航**: Expo Router ~6.0.0
- **动画**: React Native Reanimated ~4.1.0
- **构建**: EAS Build

## 📁 项目架构

```
my-tarot-app/
├── app/                     # Expo Router 页面
│   ├── (tabs)/              # 主导航标签页
│   │   ├── index.tsx        # 首页
│   │   └── cards.tsx        # 卡牌说明
│   ├── cards/               # 卡牌说明功能页面组
│   ├── (reading)/           # 占卜流程页面组
│   └── (history)/           # 历史记录页面组
├── components/              # 可复用组件库
│   ├── home/                # 首页组件 -> 详见 components/home/CLAUDE.md
│   ├── cards/               # 卡牌说明组件 -> 详见 components/cards/CLAUDE.md
│   ├── reading/             # 占卜流程组件 -> 详见 components/reading/CLAUDE.md
│   ├── history/             # 历史记录组件
│   └── common/              # 通用组件
├── lib/                     # 核心业务逻辑
│   ├── database/            # 数据库层 -> 详见 lib/database/CLAUDE.md
│   ├── ai/                  # AI功能架构 -> 详见 lib/ai/CLAUDE.md
│   ├── services/            # 服务层
│   └── types/               # TypeScript类型定义
├── assets/                  # 静态资源
│   ├── db/                  # 预置数据库
│   ├── data/                # 数据文件
│   └── images/              # 图片资源
└── CLAUDE.md               # 本文档
```

## 🏗️ 核心功能架构

### 主要功能模块

#### 1. 首页模块 (`app/(tabs)/index.tsx`)
- **神秘塔罗风格设计**：金色渐变主题，星空背景
- **4大导航入口**：开始占卜、占卜历史、卡牌说明、系统说明
- **应用声明**：塔罗学习工具定位声明
- **详细设计**: 参考 `components/home/CLAUDE.md`

#### 2. 占卜流程模块 (`app/(reading)/`)
- **4步骤占卜流程**：类型选择 → 问题输入 → 抽牌 → 解读结果
- **双模式支持**：基础占卜（离线）+ AI占卜（在线）
- **牌阵支持**：三牌阵、凯尔特十字
- **详细设计**: 参考 `components/reading/CLAUDE.md` 和 `lib/ai/CLAUDE.md`

#### 3. 卡牌说明模块 (`app/cards/`)
- **完整卡牌库**：78张塔罗牌展示
- **正逆位解读**：每张卡牌提供双重解读
- **塔罗历史**：文化背景介绍
- **详细设计**: 参考 `components/cards/CLAUDE.md`

#### 4. 历史记录模块 (`app/(history)/`)
- **占卜记录管理**：基础占卜和AI占卜历史
- **数据持久化**：本地SQLite存储
- **离线同步**：与后端API同步机制

## 🔄 数据管理架构

### 双数据库设计
- **配置数据库** (`tarot_config.db`): 只读配置数据
- **用户数据库** (`tarot_user_data.db`): 读写用户数据
- **详细设计**: 参考 `lib/database/CLAUDE.md`

### 服务层架构
```typescript
lib/services/
├── cards.ts             # 卡牌服务（配置数据）
├── reading.ts           # 占卜服务（用户数据）
├── card-info.ts         # 卡牌信息聚合服务
└── sync.ts              # 数据同步服务
```

## 📡 API集成架构

### 后端API集成
项目与 FastAPI 后端服务集成，支持以下核心功能：

| 接口 | 用途 | 集成状态 |
|------|------|----------|
| `POST /auth/anon` | 匿名用户认证 | ✅ 已集成 |
| `POST /readings/analyze` | AI问题分析 | ✅ 已集成 |
| `POST /readings/generate` | AI解读生成 | ✅ 已集成 |
| `POST /payments/checkout` | 支付会话创建 | 🔄 待集成 |

### API调用模式
- **数据自包含设计**：前端传递完整对象信息，减少ID依赖
- **错误处理机制**：网络异常自动降级到离线模式
- **状态管理**：统一的加载、错误、成功状态处理

## 🎯 开发重点

### 当前开发优先级
1. **占卜流程完善**：AI占卜功能集成和优化
2. **历史记录功能**：完整的历史管理和同步机制
3. **支付集成**：Stripe支付流程集成
4. **性能优化**：图片加载、动画性能、内存管理

### 关键技术要点
- **类型安全**：完整的TypeScript类型定义系统
- **组件化开发**：可复用组件库架构
- **状态管理**：Context + Hooks模式
- **导航架构**：Expo Router文件系统路由

## 📚 详细开发文档

### 功能特定文档
- **数据库架构**: `lib/database/CLAUDE.md`
- **AI占卜功能**: `lib/ai/CLAUDE.md`
- **卡牌说明功能**: `components/cards/CLAUDE.md`

### 组件特定文档
- **首页组件**: `components/home/CLAUDE.md`
- **占卜组件**: `components/reading/CLAUDE.md`
- **通用组件**: `components/common/CLAUDE.md`

## 🛠️ 开发指导

### 对 Claude 的指导
1. **组件化优先**：严格按照组件库架构开发
2. **类型安全**：确保TypeScript类型定义完整
3. **API集成**：优先实现与后端API的集成
4. **性能考虑**：注意图片加载、动画性能优化
5. **用户体验**：保持流畅的交互体验

---

*此文档专门针对 my-tarot-app 前端开发，详细的功能实现和组件设计请参考对应的专门文档。*