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
│   ├── (tabs)/             # 主导航标签页
│   │   ├── index.tsx       # 首页
│   │   ├── history.tsx     # 占卜历史
│   │   └── cards.tsx       # 卡牌说明（新增）
│   ├── cards/              # 卡牌说明功能页面组（新增）
│   │   ├── _layout.tsx     # 卡牌页面布局
│   │   ├── index.tsx       # 卡牌列表页面
│   │   └── [id].tsx        # 卡牌详情页面
│   └── (reading)/          # 占卜流程页面组
├── components/             # 可复用组件
│   ├── home/               # 首页组件
│   ├── common/             # 通用组件
│   ├── cards/              # 卡牌说明组件（新增）
│   │   ├── CardsList.tsx   # 卡牌网格列表
│   │   ├── CardDetail.tsx  # 卡牌详情展示
│   │   ├── TarotHistoryPanel.tsx # 历史说明面板
│   │   └── CardFilterBar.tsx # 筛选工具栏
│   ├── history/            # 历史记录组件
│   └── reading/            # 占卜流程组件
├── constants/              # 常量定义
├── hooks/                  # 自定义 Hooks
├── lib/                    # 核心业务逻辑
│   ├── database/           # 数据库层
│   │   ├── config-db.ts    # 配置数据库管理
│   │   ├── user-db.ts      # 用户数据库管理
│   │   └── connection.ts   # 数据库连接管理
│   ├── services/           # 服务层
│   │   ├── reading.ts      # 占卜服务（读写用户数据）
│   │   ├── cards.ts        # 卡牌服务（只读配置数据）
│   │   ├── card-info.ts    # 卡牌信息聚合服务（新增）
│   │   └── sync.ts         # 数据同步服务
│   └── types/              # TypeScript类型定义
│       ├── config.ts       # 配置数据类型
│       ├── user.ts         # 用户数据类型
│       └── cards.ts        # 卡牌说明相关类型（新增）
├── assets/                 # 静态资源
│   ├── db/                 # 预置数据库
│   │   └── tarot_config.db # 配置数据库（预置）
│   ├── data/               # 数据文件（新增）
│   │   └── tarot_history.json # 塔罗历史说明
│   └── images/             # 图片资源
│       ├── major/          # 大阿卡纳卡牌图片
│       └── minor/          # 小阿卡纳卡牌图片
├── scripts/                # 开发脚本
│   └── test/               # 测试脚本
├── package.json           # 依赖配置
├── app.json              # Expo 配置
├── tsconfig.json         # TypeScript 配置
└── CLAUDE.md             # 本文档
```

[之前的内容保持不变...]

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

## 🤖 AI占卜功能架构

### 功能概述
AI占卜功能基于LLM技术提供智能化的塔罗牌解读服务，与现有基础占卜功能完全兼容。

#### 核心特性
- **智能问题分析**：用户输入问题描述，AI分析并推荐最相关的解读维度
- **多维度解读**：基于选定维度生成综合性解读内容
- **与基础占卜兼容**：共享抽牌交互和视觉效果
- **完整解读结果**：包含维度解读、综合分析和关键洞察

### 技术架构设计

#### 数据流对比
```typescript
// 基础占卜流程
type → category → draw → basic

// AI占卜流程
type → ai-input → draw → ai-result
```

#### 状态管理扩展
```typescript
interface ReadingFlowState {
  step: number
  type: 'offline' | 'ai'          // 新增AI类型
  category: string
  userDescription?: string         // AI模式：用户问题描述
  aiDimensions?: DimensionInfo[]   // AI推荐的维度
  selectedCards: SelectedCard[]
  interpretations: any[]
  aiResult?: {                     // AI解读结果
    dimension_summaries: Record<string, string>
    overall_summary: string
    insights: string[]
  }
  createdAt: Date
  isLoading: boolean
  error: string | null
}
```

#### API服务架构
```typescript
class AIReadingService {
  // 分析用户问题描述
  async analyzeDescription(description: string, spreadType: string): Promise<AnalyzeResponse>

  // 生成AI解读结果
  async generateAIReading(
    cards: CardInfo[],
    dimensions: DimensionInfo[],
    description: string,
    spreadType: string
  ): Promise<GenerateResponse>
}
```

### 页面架构设计

#### 路由结构
```
app/(reading)/
├── _layout.tsx          # 布局保持不变
├── type.tsx            # 修改：AI占卜变为可用
├── ai-input.tsx        # 新增：AI问题输入页
├── category.tsx        # 保持不变（仅基础占卜使用）
├── draw.tsx            # 修改：兼容两种模式
├── basic.tsx           # 保持不变（仅基础占卜使用）
└── ai-result.tsx       # 新增：AI解读结果页
```

#### 核心页面设计

**ai-input.tsx - AI问题输入页**
- 用户输入占卜问题（200字限制）
- 调用 `/analyze` 接口获取推荐维度
- 自动进入抽牌环节

**ai-result.tsx - AI解读结果页**
- 显示多维度解读内容
- 展示综合分析和关键洞察
- 支持保存到历史记录

#### 兼容性设计

**draw.tsx 兼容性改造**
```typescript
const loadDimensions = async () => {
  if (state.type === 'ai' && state.aiDimensions) {
    // AI模式：使用推荐的维度
    const sortedDimensions = [...state.aiDimensions].sort((a, b) => a.aspect_type - b.aspect_type);
    setDimensions(sortedDimensions.slice(0, 3));
  } else {
    // 基础模式：使用原有逻辑
    // ... 现有代码保持不变
  }
};
```

### 错误处理与用户体验

#### API错误处理
- 网络连接异常处理
- LLM服务超时处理
- 请求失败重试机制
- 友好的错误提示信息

#### 加载状态设计
- 问题分析加载指示
- AI解读生成进度显示
- 合理的超时时间设置

### 历史记录兼容

#### 扩展历史记录结构
```typescript
interface HistoryRecord {
  id: string;
  type: 'offline' | 'ai';
  timestamp: Date;
  cards: SelectedCard[];

  // 基础占卜字段
  category?: string;
  basicInterpretations?: any[];

  // AI占卜字段
  userDescription?: string;
  aiResult?: {
    dimension_summaries: Record<string, string>;
    overall_summary: string;
    insights: string[];
  };
}
```

## 🎴 卡牌说明功能架构

### 功能概述
卡牌说明功能为用户提供完整的塔罗牌知识库，包括78张卡牌的详细解读和塔罗文化背景介绍。

#### 核心特性
- **78张完整卡牌**：展示所有大阿卡纳和小阿卡纳卡牌
- **正逆位解读**：每张卡牌提供正位和逆位两种解读
- **塔罗历史介绍**：提供塔罗牌文化背景和使用指导
- **筛选功能**：支持按大小阿卡纳、花色等方式筛选
- **图片展示**：高质量卡牌图片配合文字解读

### 数据架构设计

#### 数据源集成
```typescript
// 复用现有配置数据
data/config_jsons/cards.json           // 78张卡牌基础信息
data/config_jsons/card_interpretations.json  // 正逆位解读内容（156条）

// 新增数据文件
assets/data/tarot_history.json         // 塔罗历史文化背景
```

#### 类型定义系统
```typescript
// lib/types/cards.ts - 卡牌说明专用类型
interface TarotHistory {
  version: string;
  overview: string;        // 塔罗概述
  origins: string;         // 历史起源
  major_minor: string;     // 大小阿卡纳说明
  usage_notes: string;     // 使用指导
  references: string[];    // 参考资料
}

interface CardSummary {
  id: number;
  name: string;
  arcana: "major" | "minor";
  suit?: "wands" | "cups" | "swords" | "pentacles";
  number?: number;
  image: string;           // 图片资源路径
}

interface CardInterpretation {
  cardId: number;
  upright: {
    summary: string;       // 简要牌意
    detail: string;        // 详细解读
  };
  reversed: {
    summary: string;
    detail: string;
  };
}

interface CardDetail extends CardSummary {
  interpretations: CardInterpretation;
}
```

### 服务层架构

#### CardInfoService 聚合服务
```typescript
// lib/services/card-info.ts
class CardInfoService {
  // 获取塔罗历史说明
  async getTarotHistory(): Promise<TarotHistory>

  // 获取所有卡牌列表（支持筛选）
  async listCards(filters?: CardFilters): Promise<CardSummary[]>

  // 获取单张卡牌详情
  async getCardDetail(cardId: number): Promise<CardDetail>

  // 搜索卡牌（按名称、关键词）
  async searchCards(query: string): Promise<CardSummary[]>
}
```

#### 数据聚合策略
- **配置数据**：从ConfigDatabaseService读取卡牌基础信息
- **解读数据**：从预置JSON文件读取正逆位解读
- **历史数据**：从assets/data/tarot_history.json读取
- **图片路径**：通过CardImageUtils生成标准路径

### 页面路由架构

#### 路由结构
```
app/cards/                  # 卡牌说明路由组
├── _layout.tsx            # 卡牌页面布局（Stack导航）
├── index.tsx              # 卡牌列表页面
└── [id].tsx               # 卡牌详情页面（动态路由）
```

#### 导航集成
- **主导航更新**：将"Explore"标签页改为"Cards"
- **图标设计**：使用扑克牌或卡牌相关图标
- **页面标题**：中英文标题适配

### 组件库架构

#### 核心组件系统
```typescript
// components/cards/CardsList.tsx
interface CardsListProps {
  cards: CardSummary[];
  onCardPress: (cardId: number) => void;
  layout?: 'grid' | 'list';
}

// components/cards/CardDetail.tsx
interface CardDetailProps {
  card: CardDetail;
  side: 'upright' | 'reversed';
  onSideChange: (side: 'upright' | 'reversed') => void;
}

// components/cards/TarotHistoryPanel.tsx
interface TarotHistoryPanelProps {
  history: TarotHistory;
  expanded?: boolean;
  onToggle?: () => void;
}

// components/cards/CardFilterBar.tsx
interface CardFilterBarProps {
  filters: CardFilters;
  onFiltersChange: (filters: CardFilters) => void;
}
```

#### 视觉设计规范
- **色彩系统**：继承首页神秘塔罗风格
- **卡牌布局**：响应式网格，支持2-3列展示
- **动画效果**：卡牌翻转、正逆位切换动画
- **字体层级**：中文serif标题 + system正文

### 性能优化策略

#### 数据加载优化
- **懒加载**：卡牌图片按需加载
- **缓存机制**：塔罗历史数据内存缓存
- **分页加载**：大列表虚拟化处理
- **预加载**：详情页图片预加载

#### 搜索优化
- **索引构建**：卡牌名称和关键词索引
- **防抖处理**：搜索输入防抖
- **结果高亮**：搜索结果关键词高亮

### 国际化扩展设计

#### 多语言架构准备
```typescript
// 未来扩展结构
interface TarotHistoryMultiLang {
  locales: {
    'zh-CN': TarotHistory;
    'zh-TW': TarotHistory;
    'en-US': TarotHistory;
  };
}

// 卡牌名称多语言映射
interface CardNameMapping {
  cardId: number;
  names: {
    'zh-CN': string;
    'zh-TW': string;
    'en-US': string;
  };
}
```

#### 扩展路径
1. **数据文件拆分**：按语言拆分tarot_history.json
2. **名称映射表**：创建卡牌名称多语言映射
3. **解读内容国际化**：扩展card_interpretations支持多语言
4. **UI文案国际化**：组件文案多语言支持

### 集成测试策略

#### 功能测试
- **数据完整性**：验证78张卡牌数据完整
- **路由导航**：测试页面间导航流畅性
- **筛选搜索**：验证筛选和搜索功能正确性
- **正逆位切换**：测试卡牌详情页切换功能

#### 性能测试
- **图片加载**：测试大量卡牌图片加载性能
- **内存使用**：监控长时间使用内存占用
- **滚动性能**：测试长列表滚动流畅度

---

*此文档专门针对 my-tarot-app 前端开发，记录项目架构和关键技术决策。*