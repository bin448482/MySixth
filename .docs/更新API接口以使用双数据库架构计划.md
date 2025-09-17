# 更新API接口以使用双数据库架构计划

## 📋 项目背景

当前塔罗牌应用采用单一数据库架构，所有数据（配置和用户数据）存储在 `tarot_config.db` 中。为解决配置更新时可能丢失用户数据的问题，已实施**双数据库架构**：

- **配置数据库** (`tarot_config.db`): 只读配置数据（卡牌、牌阵、解读等）
- **用户数据库** (`tarot_user_data.db`): 读写用户数据（历史记录、占卜结果等）

## 🎯 更新目标

### 核心目标
1. **读写分离**: 配置数据只读，用户数据读写
2. **职责清晰**: 每个服务专注于特定数据库
3. **向后兼容**: 保持现有API接口不变
4. **性能优化**: 减少锁竞争，提升并发性能

### 具体目标
- 更新所有配置数据服务使用配置数据库
- 创建用户数据服务管理用户历史记录
- 确保所有服务正确集成双数据库架构

## 🔧 架构变更

### 现有架构
```
单一数据库架构:
- DatabaseService (读写混合)
  ├─ CardService
  ├─ SpreadService
  ├─ DimensionService
  └─ 直接访问user_history表
```

### 新架构
```
双数据库架构:
┌─────────────────┐    ┌─────────────────┐
│  ConfigDatabase │    │  UserDatabase   │
│     (只读)      │    │    (读写)       │
└─────────────────┘    └─────────────────┘
         │                       │
         │                       │
┌─────────────────┐    ┌─────────────────┐
│ ConfigDatabase  │    │ UserDatabase    │
│      Service    │    │    Service      │
│  ├─ CardService │    │ ├─ ReadingService│
│  ├─ SpreadService│    │ ├─ HistoryService│
│  ├─ DimensionService│ │ └─ UserService   │
│  └─ StyleService │    └─────────────────┘
└─────────────────┘
```

## 📁 文件更新计划

### 1. 配置数据服务更新

#### ✅ 已创建文件
- `lib/database/config-db.ts` - 配置数据库服务
- `lib/database/user-db.ts` - 用户数据库服务
- `lib/database/connection.ts` - 双数据库连接管理器

#### 📋 需要更新
- `lib/services/CardService.ts` - 替换为ConfigDatabaseService
- `lib/services/SpreadService.ts` - 替换为ConfigDatabaseService
- `lib/services/DimensionService.ts` - 更新为使用配置数据库

### 2. 新服务创建

#### 需要创建
- `lib/services/ReadingService.ts` - 占卜业务逻辑服务
- `lib/services/HistoryService.ts` - 用户历史记录服务
- `lib/services/index.ts` - 服务导出更新

### 3. 类型定义更新

#### 需要创建
- `lib/types/config.ts` - 配置数据类型定义
- `lib/types/user.ts` - 用户数据类型定义

## 🔍 具体更新内容

### 1. CardService更新

#### 变更内容
```typescript
// 之前
import { DatabaseService } from './DatabaseService';
private dbService: DatabaseService;

// 之后
import { ConfigDatabaseService } from '../database/config-db';
private configDbService: ConfigDatabaseService;
```

#### 方法调整
- 所有方法改为使用 `configDbService.query()` 和 `configDbService.queryFirst()`
- 保持API接口不变
- 确保只读操作

### 2. SpreadService更新

#### 变更内容
```typescript
// 之前
import { DatabaseService } from './DatabaseService';
private dbService: DatabaseService;

// 之后
import { ConfigDatabaseService } from '../database/config-db';
private configDbService: ConfigDatabaseService;
```

#### 方法调整
- 移除用户历史相关检查逻辑
- 专注于牌阵配置数据管理
- 保持读取功能

### 3. 新服务创建

#### ReadingService (占卜服务)
```typescript
// 功能：
- 执行完整占卜流程
- 集成配置数据查询
- 保存用户占卜结果
- 提供占卜历史查询
```

#### HistoryService (历史服务)
```typescript
// 功能：
- 用户历史记录CRUD操作
- 历史统计和查询
- 数据分页和筛选
- 用户数据管理
```

## 🚀 实施步骤

### 阶段1: 服务更新 (优先级1)
1. **更新CardService.ts**
   - 替换数据库连接
   - 更新所有查询方法
   - 测试卡牌查询功能

2. **更新SpreadService.ts**
   - 替换数据库连接
   - 移除用户历史检查
   - 测试牌阵查询功能

### 阶段2: 新服务创建 (优先级2)
1. **创建ReadingService.ts**
   - 实现占卜业务逻辑
   - 集成ConfigDatabaseService获取配置
   - 集成UserDatabaseService保存结果

2. **创建HistoryService.ts**
   - 实现用户历史管理
   - 提供完整的CRUD接口
   - 实现统计和查询功能

### 阶段3: 类型定义 (优先级3)
1. **创建config.ts**
   - 卡牌相关类型
   - 牌阵相关类型
   - 维度相关类型

2. **创建user.ts**
   - 用户历史记录类型
   - 占卜结果类型
   - 用户设置类型

### 阶段4: 集成测试 (优先级4)
1. **更新服务导出**
   - 更新lib/services/index.ts
   - 确保向后兼容性

2. **功能测试**
   - 测试配置数据查询
   - 测试用户数据读写
   - 验证双数据库协同

## 📊 变更影响评估

### 正面影响
- ✅ **数据安全**: 配置更新不影响用户数据
- ✅ **性能提升**: 读写分离减少锁竞争
- ✅ **可维护性**: 服务职责清晰，代码结构清晰
- ✅ **扩展性**: 为未来功能扩展奠定基础

### 潜在风险
- ⚠️ **兼容性**: 需要确保API接口向后兼容
- ⚠️ **测试**: 需要全面测试所有功能点

## 🧪 测试计划

### 1. 单元测试
- [ ] 配置数据服务测试
- [ ] 用户数据服务测试
- [ ] 数据库连接测试

### 2. 集成测试
- [ ] 双数据库协同工作测试
- [ ] 完整占卜流程测试
- [ ] 历史记录管理测试

### 3. 端到端测试
- [ ] 用户完整使用流程
- [ ] 配置数据更新流程
- [ ] 数据一致性验证

## 📈 性能优化

### 1. 查询优化
- 配置数据缓存策略
- 用户数据索引优化
- 批量操作支持

### 2. 连接管理
- 连接池复用
- 事务处理优化
- 错误恢复机制

## 🔄 部署策略

### 1. 渐进式部署
- 先部署配置数据服务
- 再部署用户数据服务
- 最后集成测试

### 2. 回滚机制
- 保留原有服务代码
- 提供快速回滚方案
- 监控部署状态

## 📋 检查清单

### 开发完成
- [ ] CardService更新完成
- [ ] SpreadService更新完成
- [ ] ReadingService创建完成
- [ ] HistoryService创建完成
- [ ] 类型定义更新完成
- [ ] 服务导出更新完成

### 测试完成
- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 端到端测试通过

### 部署准备
- [ ] 代码审查完成
- [ ] 文档更新完成
- [ ] 回滚方案准备