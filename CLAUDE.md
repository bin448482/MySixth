# 塔罗牌应用全栈开发指南 (CLAUDE.md)

## 📱 项目概述

**塔罗牌应用** 是一个全栈的跨平台塔罗牌应用，采用 Expo React Native + FastAPI 架构，提供塔罗牌抽牌、解读和付费AI解读服务。

### 项目结构
```
MySixth/
├── .docs/                           # 项目文档
├── my-tarot-app/                    # 前端应用 (Expo React Native)
│   ├── app/                         # 页面路由
│   ├── components/                  # 组件库
│   │   ├── home/                    # 首页组件
│   │   ├── common/                  # 通用组件
│   │   └── reading/                 # 占卜组件
│   └── CLAUDE.md                    # 前端开发指南
├── tarot-backend/                   # 后端应用 (FastAPI)
│   ├── app/                         # 应用代码
│   │   ├── api/                     # API路由
│   │   ├── models/                  # 数据库模型
│   │   ├── services/                # 业务逻辑层
│   │   ├── schemas/                 # 数据模型
│   │   └── utils/                   # 工具函数
│   ├── static/                      # 静态资源
│   └── CLAUDE.md                    # 后端开发指南
└── CLAUDE.md                        # 本文档
```

### 核心功能
- 匿名用户支持（无需注册）
- 神秘塔罗风格首页设计
- 完整占卜流程（5个步骤）
- 静态基础解读 + 付费LLM动态解读
- 完整的占卜历史记录功能
- 离线同步机制
- 跨平台支持（Android/iOS）

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

## 🏗️ 整体架构

```
[Expo RN 客户端 (my-tarot-app/)]
    ├── 首页 (神秘塔罗风格)
    ├── 占卜流程 (5步骤)
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
```

## 📊 数据库设计

### 核心表结构
1. **card** - 卡牌基础信息
2. **card_style** - 牌面风格
3. **dimension** - 解读维度定义
4. **card_interpretation** - 牌意主表
5. **card_interpretation_dimension** - 牌意维度关联
6. **spread** - 牌阵定义
7. **user_history** - 用户历史记录

## 🔌 API 设计规范

### 核心接口

| 方法   | 路径                   | 说明                    | 状态 |
| ---- | -------------------- | --------------------- | --- |
| POST | `/api/v1/auth/anon`   | 生成匿名用户ID              | ✅ 已实现 |
| GET  | `/api/v1/cards`       | 获取卡牌列表                | ✅ 已实现 |
| GET  | `/api/v1/dimensions`  | 获取维度列表                | ✅ 已实现 |
| GET  | `/api/v1/spreads`     | 获取牌阵列表                | ✅ 已实现 |
| POST | `/api/v1/readings/analyze` | 第一步：分析用户描述，返回推荐维度 | ✅ 已实现 |
| POST | `/api/v1/readings/generate` | 第二步：基于选定维度生成具体解读 | ✅ 已实现 |
| POST | `/payments/checkout` | 创建 Stripe Checkout 会话 | 🔄 待实现 |

### 解读API流程

**分两步解读设计**：
1. **分析阶段** (`/readings/analyze`)：
   - 用户输入200字以内的占卜描述
   - 支持三牌阵和凯尔特十字两种牌阵类型
   - LLM分析用户需求，返回推荐的维度列表

2. **生成阶段** (`/readings/generate`)：
   - 用户选择维度和卡牌
   - 基于选定维度调用LLM生成详细解读
   - 返回完整的解读结果

## 🎯 开发优先级

### ✅ 已完成阶段 - 后端核心架构
1. ✅ FastAPI后端框架搭建
2. ✅ 数据库设计和SQLAlchemy模型
3. ✅ 核心API接口实现（认证、卡牌、维度、牌阵）
4. ✅ LLM集成服务（智谱AI + OpenAI双支持）
5. ✅ 分两步解读API流程实现

### 🔄 当前优先级 - 前端开发
1. **第一阶段**: 首页设计与组件架构
2. **第二阶段**: 占卜流程开发（与后端API集成）
3. **第三阶段**: 历史记录功能
4. **第四阶段**: 支付集成与优化

### 🔄 待实现功能
- Stripe支付集成（后端）
- 离线同步机制
- 部署和监控

## 💡 开发指导原则

### 对 Claude 的指导
1. **前端优先**: 当前重点实现前端占卜流程和后端API集成
2. **组件化开发**: 严格按照组件库架构开发，保持代码复用性
3. **API集成**: 优先实现与已完成后端API的集成
4. **架构一致性**: 严格按照架构文档的设计模式开发
5. **类型安全**: 前后端都要确保类型定义正确

### 技术要求
- **前端**: 遵循 React Native 和 TypeScript 最佳实践
- **后端**: 遵循 FastAPI 和 Python 最佳实践
- **数据库**: 保持数据一致性和完整性
- **API**: RESTful 设计，清晰的错误处理

---

*此文档用于指导塔罗牌应用全栈开发工作，详细的前后端开发指南请参考各自目录下的 CLAUDE.md 文件。*