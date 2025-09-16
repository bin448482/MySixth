# 塔罗牌应用前端开发指南 (CLAUDE.md)

## 📱 项目信息

**my-tarot-app** 是塔罗牌应用的 Expo React Native 前端客户端，支持 Android/iOS 双平台。

### 技术栈
- **框架**: Expo React Native ~54.0.1
- **语言**: TypeScript ~5.9.2
- **导航**: Expo Router ~6.0.0
- **动画**: React Native Reanimated ~4.1.0
- **构建**: EAS Build

## 📁 项目结构

```
my-tarot-app/
├── app/                    # Expo Router 页面
├── components/             # 可复用组件
├── constants/              # 常量定义
├── hooks/                  # 自定义 Hooks
├── lib/                    # 核心业务逻辑
│   ├── database/           # 数据库层
│   ├── services/           # 服务层
│   └── types/              # TypeScript类型定义
├── assets/                 # 静态资源
│   ├── db/                 # 预置数据库
│   └── images/             # 图片资源
├── scripts/                # 开发脚本
│   └── test/               # 测试脚本
├── package.json           # 依赖配置
├── app.json              # Expo 配置
├── tsconfig.json         # TypeScript 配置
└── CLAUDE.md             # 本文档
```

[之前的内容保持不变...]

## 🔄 数据源管理策略

### 数据库初始化方案

项目采用预置 SQLite 数据库作为静态数据源，具有以下关键特性：

1. **资源位置**
   - 预置数据库: `assets/db/tarot_config.db`
   - 运行时数据库: 复制到应用可写目录

2. **初始化流程**
   - 首次启动：将预置数据库复制到可写目录
   - 后续启动：直接打开已复制的数据库
   - 用户专用表（如 `user_history`）按需创建

3. **数据完整性**
   - 验证静态数据表存在性
   - 检查卡牌、牌阵等核心数据数量
   - 确保 78 张塔罗牌（22 大阿卡纳 + 56 小阿卡纳）

### 数据源切换优势

- **性能提升**：直接读取预置数据库，避免 JSON 导入开销
- **一致性**：确保所有客户端使用相同的初始数据
- **可维护性**：简化数据更新流程

### 版本管理 (TODO)

- 引入数据库版本追踪机制
- 支持增量更新和数据迁移
- 提供版本兼容性检查

## 🚨 遗留代码清理

### 已废弃组件
- `JsonLoader`
- `DataImporter`
- 静态 JSON 导入相关脚本

*注意：这些组件将在后续版本中完全移除*

---

*此文档专门针对 my-tarot-app 前端开发，记录项目架构和关键技术决策。*