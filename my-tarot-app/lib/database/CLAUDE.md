# 数据库架构设计文档

## 🔄 数据源管理策略

### 双数据库架构设计

项目采用**双数据库架构**，将配置数据与用户数据分离存储：

#### 数据库分类
1. **配置数据库** (`tarot_config.db`)
   - **用途**: 存储只读配置数据
   - **内容**: 卡牌信息、牌阵定义、解读维度等
   - **特性**: 预置资源，支持版本更新
   - **生命周期**: 随应用更新

2. **用户数据库** (`tarot_user_data.db`)
   - **用途**: 存储读写用户数据
   - **内容**: 用户历史记录、个人设置等
   - **特性**: 独立管理，永久保存
   - **生命周期**: 用户数据持久化

### 数据库初始化方案

#### 配置数据库初始化
1. **资源位置**
   - 预置数据库: `assets/db/tarot_config.db`
   - 运行时位置: 复制到应用可写目录

2. **初始化流程**
   - 首次启动：将预置数据库复制到可写目录
   - 后续启动：检查版本并决定是否更新
   - 版本升级：替换配置数据库，保留用户数据库

3. **数据完整性**
   - 验证静态数据表存在性
   - 检查卡牌、牌阵等核心数据数量
   - 确保 78 张塔罗牌（22 大阿卡纳 + 56 小阿卡纳）

#### 用户数据库初始化
1. **创建策略**
   - 独立创建 `tarot_user_data.db`
   - 按需创建用户相关表结构
   - 与配置数据库完全隔离

2. **表结构**
   ```sql
   CREATE TABLE user_history (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       user_id TEXT NOT NULL,
       timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
       spread_id INTEGER,
       card_ids TEXT NOT NULL, -- JSON格式
       interpretation_mode TEXT DEFAULT 'default',
       result TEXT NOT NULL, -- JSON格式
       created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
       updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
   );
   ```

### 数据库连接管理

#### 连接池设计
- **配置数据库连接**: 只读连接池
- **用户数据库连接**: 读写连接池
- **连接复用**: 优化性能，减少资源消耗

#### 查询策略
- **配置查询**: 直接访问 `tarot_config.db`
- **用户查询**: 直接访问 `tarot_user_data.db`
- **关联查询**: 应用层合并数据

### 双数据库架构优势

#### 数据安全
- **用户数据保护**: 配置更新不影响用户历史记录
- **数据隔离**: 降低数据丢失风险
- **备份策略**: 可分别备份配置和用户数据

#### 性能优化
- **读写分离**: 配置数据只读，用户数据读写
- **缓存策略**: 配置数据可缓存，用户数据实时
- **并发控制**: 减少锁竞争

#### 维护便利
- **版本管理**: 配置数据支持版本升级
- **数据迁移**: 用户数据独立，迁移简单
- **开发调试**: 可单独替换配置数据进行测试

### 版本管理策略

#### 配置数据版本管理
- 引入数据库版本追踪机制
- 支持增量更新和数据迁移
- 提供版本兼容性检查
- 自动检测和应用配置更新

#### 用户数据迁移
- 保持用户数据库结构稳定
- 提供数据结构升级脚本
- 确保向后兼容性
- 支持数据导入导出

## 🚨 遗留代码清理

### 已废弃组件
- `JsonLoader`
- `DataImporter`
- 静态 JSON 导入相关脚本

*注意：这些组件将在后续版本中完全移除*

## 📋 实施指导

### 开发优先级
1. **数据库连接管理**: 实现双数据库连接池 ✅
2. **API接口更新**: 更新服务层使用双数据库架构
3. **服务层重构**: 按照读写分离原则重构服务
4. **类型系统更新**: 为双数据库架构更新类型定义

### 关键实现要点
- **双数据库架构**: 配置数据库(`tarot_config.db`)只读，用户数据库(`tarot_user_data.db`)读写
- **服务职责分离**:
  - 配置数据服务：CardService, SpreadService, DimensionService 使用 ConfigDatabaseService
  - 用户数据服务：ReadingService, HistoryService 使用 UserDatabaseService
- **API兼容性**: 保持现有API接口不变，内部实现双数据库访问
- **错误处理**: 双数据库连接池管理，事务处理，回滚机制

### 实施路线图
#### 阶段1: 配置数据服务更新 ✅
- [x] 创建ConfigDatabaseService (`lib/database/config-db.ts`)
- [x] 创建UserDatabaseService (`lib/database/user-db.ts`)
- [x] 创建双数据库连接管理器 (`lib/database/connection.ts`)

#### 阶段2: 服务层重构
- [ ] 更新CardService使用ConfigDatabaseService
- [ ] 更新SpreadService使用ConfigDatabaseService
- [ ] 更新DimensionService使用ConfigDatabaseService

#### 阶段3: 用户数据服务创建
- [ ] 创建ReadingService：完整占卜业务流程
- [ ] 创建HistoryService：用户历史记录管理
- [ ] 创建类型定义文件 (`lib/types/config.ts`, `lib/types/user.ts`)

#### 阶段4: 集成测试
- [ ] 更新服务导出 (`lib/services/index.ts`)
- [ ] 单元测试：各服务独立测试
- [ ] 集成测试：双数据库协同工作
- [ ] 端到端测试：完整占卜流程验证

### 测试策略
- **单元测试**: 数据库连接管理、服务层逻辑
- **集成测试**: 双数据库协同工作、事务处理
- **端到端测试**: 完整用户占卜流程
- **性能测试**: 双数据库架构性能对比、并发测试