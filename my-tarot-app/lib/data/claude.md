# 塔罗牌数据导入计划

## 📋 数据概览

已完成的 JSON 数据文件位于 `my-tarot-app/assets/data/` 目录下：

| 文件名 | 版本 | 更新时间 | 记录数 | 描述 |
|--------|------|----------|---------|------|
| `cards.json` | 1.0.0 | 2025-01-12T10:00:00Z | 78 | 完整的78张塔罗牌基础信息 |
| `card_styles.json` | 1.0.0 | 2025-01-12T10:00:00Z | 1 | 卡牌风格定义（1920-raider-waite） |
| `dimensions.json` | 1.0.2 | 2025-09-12T01:18:52Z | ~数百条 | 解读维度定义（三牌映射模式） |
| `spreads.json` | 1.0.0 | 2025-01-12T10:00:00Z | 1 | 牌阵定义（三牌阵） |
| `card_interpretations.json` | 1.0.8 | 2025-09-12T02:57:02Z | 156 | 牌意解读（78×2，正位+逆位） |
| `card_interpretation_dimensions.json` | 1.0.0 | 2025-09-12T04:33:32Z | ~数千条 | 维度化解读数据 |

## 📝 导入任务清单

### 阶段一：数据库架构设计
- [ ] 设计 SQLite 数据库表结构
- [ ] 创建数据库模式定义文件 (`lib/database/schema.ts`)
- [ ] 实现数据库初始化逻辑 (`lib/database/init.ts`)
- [ ] 创建 TypeScript 类型定义 (`lib/types/database.ts`)

### 阶段二：核心数据表导入
- [ ] **Card Style 表** (`card_styles.json`)
  - 优先级：⭐⭐⭐ (必须先导入，其他表依赖此表)
  - 记录数：1条
  - 依赖关系：无
  
- [ ] **Card 表** (`cards.json`)
  - 优先级：⭐⭐⭐ (核心表，多个表依赖此表)
  - 记录数：78条
  - 依赖关系：依赖 `card_styles` 表
  
- [ ] **Spread 表** (`spreads.json`)
  - 优先级：⭐⭐⭐ (用户功能必需)
  - 记录数：1条
  - 依赖关系：无
  
- [ ] **Dimension 表** (`dimensions.json`)
  - 优先级：⭐⭐⭐ (解读系统核心)
  - 记录数：数百条
  - 依赖关系：无

### 阶段三：解读数据导入
- [ ] **Card Interpretation 表** (`card_interpretations.json`)
  - 优先级：⭐⭐ (基础解读功能)
  - 记录数：156条 (78张牌 × 2个方向)
  - 依赖关系：依赖 `cards` 表
  
- [ ] **Card Interpretation Dimension 表** (`card_interpretation_dimensions.json`)
  - 优先级：⭐ (高级解读功能)
  - 记录数：数千条
  - 依赖关系：依赖 `card_interpretations` 和 `dimensions` 表

### 阶段四：数据访问层实现
- [ ] 创建数据访问对象 (DAO) 类
- [ ] 实现查询方法和索引优化
- [ ] 创建数据同步服务
- [ ] 实现数据验证和完整性检查

## 🔄 导入策略

### 1. 数据映射策略
```typescript
// JSON 字段 → SQLite 字段映射
interface CardMapping {
  // cards.json
  name: string;           // → cards.name
  arcana: string;         // → cards.arcana  
  suit: string | null;    // → cards.suit
  number: number;         // → cards.number
  image_url: string;      // → cards.image_url
  style_name: string;     // → 关联到 card_styles.name 获取 style_id
  deck: string;           // → cards.deck
}
```

### 2. 关联关系处理
- **Card → CardStyle**: 通过 `style_name` 字段关联
- **CardInterpretation → Card**: 通过 `card_name` 字段关联
- **CardInterpretationDimension → Dimension**: 通过 `dimension_name` 字段关联

### 3. 数据一致性检查
- [ ] 验证所有外键引用的完整性
- [ ] 检查枚举值的有效性 (`arcana`, `direction` 等)
- [ ] 确保必填字段的完整性

## 🛠️ 技术实现方案

### 1. 数据库连接
```typescript
// lib/database/connection.ts
import * as SQLite from 'expo-sqlite';

export const database = SQLite.openDatabaseSync('tarot.db');
```

### 2. 导入脚本结构
```typescript
// lib/database/import.ts
interface ImportResult {
  success: boolean;
  tableName: string;
  recordsImported: number;
  errors?: string[];
}

export class DataImporter {
  async importCardStyles(): Promise<ImportResult>;
  async importCards(): Promise<ImportResult>;
  async importDimensions(): Promise<ImportResult>;
  async importSpreads(): Promise<ImportResult>;
  async importCardInterpretations(): Promise<ImportResult>;
  async importCardInterpretationDimensions(): Promise<ImportResult>;
  
  async importAll(): Promise<ImportResult[]>;
}
```

### 3. 错误处理
- 数据格式验证
- 重复数据处理
- 事务回滚机制
- 导入进度跟踪

## 🔍 数据质量检查

### 1. 基础验证
- [ ] JSON 格式正确性
- [ ] 必填字段完整性
- [ ] 数据类型匹配
- [ ] 字符编码正确性

### 2. 业务逻辑验证
- [ ] 78张牌的完整性（22张大牌 + 56张小牌）
- [ ] 正位/逆位解读的配对完整性
- [ ] 维度数据的三牌映射逻辑正确性
- [ ] 图片路径的有效性

### 3. 关联性验证
- [ ] Card → CardStyle 关联完整性
- [ ] CardInterpretation → Card 关联完整性  
- [ ] CardInterpretationDimension 的多重关联完整性

## 📊 预期结果

### 数据库大小估算
- **Card**: 78条记录 ≈ 8KB
- **CardStyle**: 1条记录 ≈ 0.1KB
- **Dimension**: ~200条记录 ≈ 20KB
- **Spread**: 1条记录 ≈ 0.5KB
- **CardInterpretation**: 156条记录 ≈ 50KB
- **CardInterpretationDimension**: ~3000条记录 ≈ 500KB

**总计预估**: ~580KB (不含索引)

### 性能指标
- 导入时间：< 5秒
- 查询响应：< 100ms
- 启动时间：< 2秒

## 🚀 执行计划

### 第1天：架构设计
1. 数据库表结构设计
2. TypeScript 类型定义
3. 导入脚本框架搭建

### 第2天：核心数据导入
1. CardStyle + Card 表导入
2. Dimension + Spread 表导入
3. 基础功能测试

### 第3天：解读数据导入
1. CardInterpretation 表导入
2. CardInterpretationDimension 表导入
3. 数据完整性验证

### 第4天：优化与测试
1. 查询性能优化
2. 错误处理完善
3. 集成测试

---

*此导入计划基于当前 JSON 数据文件的结构和内容制定，确保数据的完整性和一致性。*

## 📚 现有技术架构参考

该目录包含塔罗牌应用的数据导入系统，负责从JSON文件加载静态数据并导入到SQLite数据库中。系统采用单例模式设计，确保数据的一致性和性能。

## 架构设计

```
JSON文件 → JsonLoader → DataImporter → SQLite数据库
  ↓           ↓            ↓           ↓
静态资源    数据加载     数据转换    持久化存储
```

### 核心组件

1. **JsonLoader** - JSON文件加载器，负责从静态资源加载和验证JSON数据
2. **DataImporter** - 数据导入器，负责将JSON数据转换并导入到SQLite数据库
3. **types.ts** - 类型定义文件，定义所有数据结构和接口

## JSON数据结构定义

### 1. 通用JSON文件结构

所有JSON数据文件都遵循统一的格式规范：

```typescript
interface JsonDataFile<T> {
  version: string;        // 数据版本号，用于同步控制
  updated_at: string;     // 最后更新时间戳
  description: string;    // 数据描述信息
  data: T[];             // 实际数据数组
}
```

### 2. 卡牌风格 (card_styles.json)

存储不同塔罗牌风格的基本信息：

```json
{
  "version": "1.0.0",
  "updated_at": "2024-01-15T10:00:00Z",
  "description": "塔罗牌风格定义数据",
  "data": [
    {
      "name": "Rider-Waite",
      "image_base_url": "https://example.com/images/rider-waite/"
    },
    {
      "name": "Thoth",
      "image_base_url": "https://example.com/images/thoth/"
    }
  ]
}
```

**字段说明：**
- `name`: 风格名称，用于标识不同的牌面风格
- `image_base_url`: 该风格下图片的基础URL路径

### 3. 卡牌数据 (cards.json)

包含完整的78张塔罗牌信息：

```json
{
  "version": "1.0.0",
  "updated_at": "2024-01-15T10:00:00Z",
  "description": "塔罗牌卡牌数据，包含78张完整卡牌",
  "data": [
    {
      "name": "愚者",
      "arcana": "Major",
      "suit": null,
      "number": 0,
      "image_url": "fool.jpg",
      "style_name": "Rider-Waite",
      "deck": "标准塔罗牌"
    },
    {
      "name": "权杖一",
      "arcana": "Minor",
      "suit": "权杖",
      "number": 1,
      "image_url": "wands_01.jpg",
      "style_name": "Rider-Waite",
      "deck": "标准塔罗牌"
    }
  ]
}
```

**字段说明：**
- `name`: 卡牌名称（中文）
- `arcana`: 大牌 ("Major") 或小牌 ("Minor")
- `suit`: 花色（小牌适用：权杖、圣杯、宝剑、钱币）
- `number`: 卡牌序号
- `image_url`: 图片文件名（相对于style的base_url）
- `style_name`: 关联的风格名称（注意：JSON中使用name，数据库中转换为ID）
- `deck`: 所属牌组名称

**数据验证规则：**
- 总计78张牌（22张大牌 + 56张小牌）
- 每个花色14张牌（A-10 + 4张宫廷牌）
- 所有必要字段不能为空

### 4. 牌阵数据 (spreads.json)

定义不同的塔罗牌阵布局：

```json
{
  "version": "1.0.0",
  "updated_at": "2024-01-15T10:00:00Z",
  "description": "塔罗牌阵定义数据",
  "data": [
    {
      "name": "单张牌阵",
      "description": "抽取一张牌进行简单解读",
      "card_count": 1
    },
    {
      "name": "三张牌阵",
      "description": "过去-现在-未来三张牌解读",
      "card_count": 3
    },
    {
      "name": "凯尔特十字",
      "description": "经典的十张牌复杂牌阵",
      "card_count": 10
    }
  ]
}
```

**字段说明：**
- `name`: 牌阵名称
- `description`: 牌阵描述和用途
- `card_count`: 该牌阵需要的卡牌数量

### 5. 解读维度数据 (dimensions.json)

定义塔罗牌解读的不同维度和类别。此处引入严格规则以保证数据一致性（尤其针对三张牌阵的映射）。

规则（必须遵守）：
- name: 维度唯一标识，字符串，不可重复（例如 "情感-时间线-现在"）。
- category: 该维度所属的大类（例如 情感、事业、健康、人际 等）。category 与 name 的前缀应一致（比如 "情感-时间线" 的 category 为 "情感-时间线"）。
- description: 对该维度的文字描述（中文或多语言文本）。
- aspect: 与三牌阵（过去/现在/将来）直接关联时，取固定值之一："过去"、"现在"、"将来"。对于非三牌阵的子维度（例如互动、角色、状态等），aspect 可为描述性文本。
- aspect_type: 字段；用于表示牌在牌阵中的“位次”。规则如下：
  - 三牌阵（3张）：使用数字 1|2|3 分别表示牌在三牌阵中的位置（1=过去，2=现在，3=将来）。三牌阵的 aspect_type 只能为 1、2、3。
  - 凯尔特十字（10张）：使用整数 1..10 表示牌位（1=第1位 ... 10=第10位）。凯尔特十字的 aspect_type 只能为 1..10。
  - 非牌位关联的维度条目可省略该字段或设为 null。
说明：当前系统仅支持三牌阵（3张）和凯尔特十字阵（10张）。不考虑其他自定义牌阵；若将来需要新增牌阵，需在 `spreads.json` 中登记并更新导入/映射逻辑与校验规则。

示例（包含三牌阵 & 凯尔特十字映射的规范示例）：
```json
{
  "version": "1.0.0",
  "updated_at": "2025-09-12T00:00:00Z",
  "description": "塔罗牌解读维度定义数据（含三牌阵与凯尔特十字位置规则）",
  "data": [
    {
      "name": "情感-时间线-过去",
      "category": "情感",
      "description": "情感发展的过去方向",
      "aspect": "过去",
      "aspect_type": 1
    },
    {
      "name": "情感-时间线-现在",
      "category": "情感",
      "description": "情感发展的当前状态",
      "aspect": "现在",
      "aspect_type": 2
    },
    {
      "name": "情感-时间线-将来",
      "category": "情感",
      "description": "情感发展的未来展望",
      "aspect": "将来",
      "aspect_type": 3
    },
    {
      "name": "凯尔特十字-位置1",
      "category": "情感",
      "description": "凯尔特十字 第1位（读者/状况）",
      "aspect": "位置1",
      "aspect_type": 1
    },
    {
      "name": "凯尔特十字-位置10",
      "category": "情感",
      "description": "凯尔特十字 第10位（最终结果）",
      "aspect": "位置10",
      "aspect_type": 10
    }
  ]
}
```

说明：
- 对于“三牌阵”，aspect 必须取 "过去" / "现在" / "将来"，并且 aspect_type 必须使用数字 1|2|3 对应位置。
- 对于“凯尔特十字”，aspect_type 必须使用 1 到 10 的整数来表示牌位（1..10）。示例中展示了第1位和第10位的写法；其余 2..9 同理。
- 当前系统仅支持三牌阵（3张）和凯尔特十字（10张）。其他自定义牌阵暂不考虑；若将来添加新阵，需要在 `spreads.json` 中登记并扩展导入/映射逻辑。

**字段说明：**
- `name`: 维度名称（如：情感-时间线）
- `category`: 类别（如：情感、事业、健康）
- `description`: 维度详细描述
- `aspect`: 维度的具体子项（可选）
- `aspect_type`: 子项的类型或分类（可选）

### 6. 卡牌解读数据 (card_interpretations.json)

存储每张卡牌正位和逆位的基础解读：

```json
{
  "version": "1.0.0",
  "updated_at": "2024-01-15T10:00:00Z",
  "description": "塔罗牌基础解读数据",
  "data": [
    {
      "card_name": "愚者",
      "direction": "正位",
      "summary": "新的开始，天真，自发性",
      "detail": "愚者代表新的旅程和无限可能。正位时表示勇于冒险，保持开放心态迎接新机会。"
    },
    {
      "card_name": "愚者",
      "direction": "逆位",
      "summary": "鲁莽，缺乏计划，幼稚",
      "detail": "逆位的愚者提醒你要更加谨慎，避免冲动行事，需要更好的规划和准备。"
    },
    {
      "card_name": "魔术师",
      "direction": "正位",
      "summary": "意志力，创造力，行动力",
      "detail": "魔术师拥有实现目标的所有工具和能力。正位表示有能力将想法转化为现实。"
    }
  ]
}
```

**字段说明：**
- `card_name`: 卡牌名称（注意：JSON中使用名称，数据库中转换为ID）
- `direction`: 正位或逆位
- `summary`: 简要牌意
- `detail`: 详细说明（可选）

### 7. 卡牌解读维度关联数据 (card_interpretation_dimensions.json)

将卡牌解读与具体维度关联，提供细粒度的解读内容。遵循上文维度规则时，请注意三牌阵映射的一致性（aspect 与 aspect_type 必须匹配）。

示例（使用三牌阵位置数字化的规范示例）：
```json
{
  "version": "1.0.0",
  "updated_at": "2025-09-12T00:00:00Z",
  "description": "塔罗牌解读维度关联数据（与 dimensions.json 一致）",
  "data": [
    {
      "card_name": "愚者",
      "direction": "正位",
      "dimension_name": "情感-时间线-过去",
      "aspect": "过去",
      "aspect_type": 1,
      "content": "在情感过去中，你曾经很天真纯洁，对爱情充满美好期待。"
    },
    {
      "card_name": "愚者",
      "direction": "正位",
      "dimension_name": "情感-时间线-现在",
      "aspect": "现在",
      "aspect_type": 2,
      "content": "目前的情感状态充满新鲜感，准备开始一段新的感情历程。"
    },
    {
      "card_name": "愚者",
      "direction": "逆位",
      "dimension_name": "事业-发展趋势",
      "aspect": "发展",
      "content": "在事业发展上需要更加谨慎，避免盲目投资或冲动决策。"
    },
    {
      "card_name": "魔术师",
      "direction": "正位",
      "dimension_name": "健康-身体状况",
      "content": "身体状况良好，有足够的活力和能量来应对生活挑战。"
    }
  ]
}
```

字段说明（更新）：
- `card_name`: 关联的卡牌名称（JSON 使用名称；导入时转换为 card.id）。
- `direction`: 正位或逆位。
- `dimension_name`: 关联的维度名称（必须与 dimensions.json 中的 name 一致；三牌阵建议使用带后缀的细化名称，如 "情感-时间线-过去"）。
- `aspect`: 具体维度子项；对于三牌阵必须是 "过去"/"现在"/"将来" 之一（从 dimension 复制，可选但建议保持一致）。对于凯尔特十字，aspect 可写为描述性的 "位置X"（例如 "位置1"、"位置10"）以便可读性，但必须与 `aspect_type` 保持一致。
- `aspect_type`: 字段；表示牌在牌阵中的位次：
  - 三牌阵：1|2|3（1=过去,2=现在,3=将来）
  - 凯尔特十字：1..10（1=第1位 ... 10=第10位）
  当前系统仅支持三牌阵和凯尔特十字阵；请勿使用超出上述范围的数字。非牌位关联的维度条目可省略或将该字段设为 null。
- `content`: 该维度下的具体解读文字。

**字段说明：**
- `card_name`: 关联的卡牌名称
- `direction`: 正位或逆位
- `dimension_name`: 关联的维度名称
- `aspect`: 具体维度子项（从dimension复制，可选）
- `aspect_type`: 子项的类型或分类（从dimension复制，可选）
- `content`: 该维度下的具体解读文字

## 数据导入流程

### 导入顺序

数据导入严格按照依赖关系顺序执行：

1. **card_style** - 卡牌风格（无依赖）
2. **dimension** - 解读维度（无依赖）
3. **card** - 卡牌数据（依赖 card_style）
4. **spread** - 牌阵数据（无依赖）
5. **card_interpretation** - 卡牌解读（依赖 card）
6. **card_interpretation_dimension** - 解读维度关联（依赖 card_interpretation 和 dimension）

### 导入策略

```typescript
// 导入会话状态跟踪
interface ImportSession {
  sessionId: string;       // 导入会话ID
  startTime: string;       // 开始时间
  tables: ImportStatus[];  // 各表导入状态
  totalProgress: number;   // 总体进度百分比
  isCompleted: boolean;    // 是否完成
}

// 单表导入状态
interface ImportStatus {
  table: string;           // 表名
  status: 'pending' | 'importing' | 'completed' | 'error';
  result?: ImportResult;   // 导入结果详情
  error?: string;         // 错误信息
}

// 导入结果统计
interface ImportResult {
  success: boolean;        // 是否成功
  imported: number;        // 导入记录数
  skipped: number;         // 跳过记录数
  errors: string[];        // 错误列表
}
```

### 重复导入处理

系统采用智能重复检测：

1. **存在性检查** - 导入前检查表中是否已有数据
2. **跳过策略** - 如果数据已存在，跳过导入并记录为 `skipped`
3. **强制重导** - 提供 `clearAllTables()` 方法清空数据后重新导入

### 关联关系处理

**card表中的style_name → style_id转换：**

```typescript
// JSON中使用风格名称
{
  "style_name": "Rider-Waite"  // 人类可读的名称
}

// 数据库中使用外键ID
{
  "style_id": 1  // 关联到 card_style.id
}

// 转换过程
const styleNameToIdMap = await this.createStyleNameToIdMap();
const styleId = styleNameToIdMap[card.style_name];
```

**card_interpretation表中的card_name → card_id转换：**

```typescript
// JSON中使用卡牌名称
{
  "card_name": "愚者"  // 人类可读的卡牌名称
}

// 数据库中使用外键ID
{
  "card_id": 1  // 关联到 card.id
}

// 转换过程
const cardNameToIdMap = await this.createCardNameToIdMap();
const cardId = cardNameToIdMap[interpretation.card_name];
```

**card_interpretation_dimension表中的多重名称 → ID转换：**

```typescript
// JSON中使用名称组合
{
  "card_name": "愚者",
  "direction": "正位",
  "dimension_name": "情感-时间线"
}

// 数据库中使用外键ID组合
{
  "interpretation_id": 1,  // 关联到特定卡牌+方向的解读
  "dimension_id": 2        // 关联到 dimension.id
}

// 转换过程
const interpretationKey = `${item.card_name}-${item.direction}`;
const interpretationId = interpretationMap[interpretationKey];
const dimensionId = dimensionNameToIdMap[item.dimension_name];
```

## 错误处理

### JSON加载错误
- 文件不存在或无法访问
- JSON格式错误
- 数据结构验证失败
- 必要字段缺失

### 数据导入错误
- 数据库连接失败
- 约束违反（如重复主键）
- 外键关联错误
- 批量操作部分失败

### 错误恢复机制
```typescript
// 导入失败时的状态保持
catch (error) {
  status.status = 'error';
  status.error = error.message;
  status.result = {
    success: false,
    imported: 0,
    skipped: 0,
    errors: [error.message]
  };
}
```

## 性能优化

### 批量操作
```typescript
// 使用批量插入提高性能
const insertStatements = cards.map(card => ({
  sql: 'INSERT INTO card (...) VALUES (?, ?, ...)',
  params: [card.name, card.arcana, ...]
}));

const result = await this.dbService.executeBatch(insertStatements);
```

### 并行加载
```typescript
// 并行加载多个JSON文件
const [cardStyles, cards, spreads] = await Promise.all([
  this.loadCardStyles(),
  this.loadCards(),
  this.loadSpreads()
]);
```

### 内存管理
- 单例模式避免重复实例化
- 及时释放大型JSON数据对象
- 流式处理大文件（未来扩展）

## 使用示例

### 基本导入流程
```typescript
import { DataImporter } from './DataImporter';

// 获取导入器实例
const importer = DataImporter.getInstance();

// 执行完整导入
const session = await importer.importAll();

// 检查导入结果
if (session.isCompleted) {
  console.log('导入完成！');
  session.tables.forEach(table => {
    if (table.status === 'completed') {
      console.log(`${table.table}: ${table.result?.imported} imported`);
    }
  });
}
```

### 单独加载JSON
```typescript
import { JsonLoader } from './JsonLoader';

// 获取加载器实例
const loader = JsonLoader.getInstance();

// 加载特定文件
const cardsData = await loader.loadCards();
console.log(`加载了 ${cardsData.data.length} 张卡牌`);

// 检查数据版本
const versions = await loader.checkDataVersions();
console.log('数据版本：', versions);
```

### 清理和重建
```typescript
// 清空所有表
await importer.clearAllTables();

// 重新导入
const newSession = await importer.importAll();
```

## 扩展性设计

### 新增数据表
1. 在 `types.ts` 中定义JSON接口
2. 在 `JsonLoader` 中添加加载方法
3. 在 `DataImporter` 中添加导入方法
4. 更新导入顺序（考虑依赖关系）

### 版本控制
- JSON文件包含version字段用于版本管理
- 支持增量更新（未来扩展）
- 向后兼容性检查

### 数据同步准备
该系统为未来的服务端同步功能预留了扩展接口，支持：
- 版本比较
- 增量更新检测
- 冲突解决策略

---

*该文档描述了塔罗牌应用数据层的完整设计和实现，确保数据的一致性、完整性和可维护性。*