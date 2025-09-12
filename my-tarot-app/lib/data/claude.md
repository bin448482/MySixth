# 数据层设计文档 (my-tarot-app/lib/data)

## 概述

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

定义塔罗牌解读的不同维度和类别：

```json
{
  "version": "1.0.0",
  "updated_at": "2024-01-15T10:00:00Z",
  "description": "塔罗牌解读维度定义数据",
  "data": [
    {
      "name": "情感-时间线",
      "category": "情感",
      "description": "情感发展的时间线解读",
      "aspect": "过去",
      "aspect_type": "时间线"
    },
    {
      "name": "情感-现状",
      "category": "情感",
      "description": "当前情感状态分析",
      "aspect": "现在",
      "aspect_type": "时间线"
    },
    {
      "name": "事业-发展趋势",
      "category": "事业",
      "description": "事业发展方向和趋势",
      "aspect": "发展",
      "aspect_type": "趋势"
    },
    {
      "name": "健康-身体状况",
      "category": "健康",
      "description": "身体健康状况评估"
    }
  ]
}
```

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

将卡牌解读与具体维度关联，提供细粒度的解读内容：

```json
{
  "version": "1.0.0",
  "updated_at": "2024-01-15T10:00:00Z",
  "description": "塔罗牌解读维度关联数据",
  "data": [
    {
      "card_name": "愚者",
      "direction": "正位",
      "dimension_name": "情感-时间线",
      "aspect": "过去",
      "aspect_type": "时间线",
      "content": "在情感过去中，你曾经很天真纯洁，对爱情充满美好期待。"
    },
    {
      "card_name": "愚者",
      "direction": "正位",
      "dimension_name": "情感-现状",
      "aspect": "现在",
      "aspect_type": "时间线",
      "content": "目前的情感状态充满新鲜感，准备开始一段新的感情历程。"
    },
    {
      "card_name": "愚者",
      "direction": "逆位",
      "dimension_name": "事业-发展趋势",
      "aspect": "发展",
      "aspect_type": "趋势",
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