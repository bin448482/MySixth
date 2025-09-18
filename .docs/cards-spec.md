# 卡牌说明功能设计规范

## 目标
- 提供“卡牌说明”功能入口与页面结构
- 支持塔罗牌历史文字说明（先以单语言JSON供前端展示，未来可扩展多语言）
- 基于现有 `card_interpretations` 数据渲染 78 张牌列表与详情，包含正位/逆位解读

---

## 数据设计

### 1) 塔罗历史数据文件
- 路径：`my-tarot-app/assets/data/tarot_history.json`
- 单语言结构（后续可拆分多语言）
```json
{
  "overview": "……",
  "origins": "……",
  "major_minor": "……",
  "usage_notes": "……",
  "references": []
}
```
- 用途：在“卡牌说明”页顶部或独立信息页展示基础历史背景与说明

### 2) 卡牌与解读数据来源
- 现有来源（只读配置）：`tarot-ai-generator/data/config_jsons/card_interpretations.json`
- 其他相关：`tarot-ai-generator/data/config_jsons/cards.json`、`.../card_styles.json`、`.../dimensions.json`
- 前端访问策略：
  - 首期：为降低耦合，前端侧新增解析与映射层，从配置数据库或导入的JSON中读取
  - 若直接使用 SQLite 预置库（`assets/db/tarot_config.db`）：通过现有 `CardService` / `CardInterpretationService` 统一访问
- 目标数据模型（前端消费）：
```ts
type CardSide = "upright" | "reversed";

interface CardSummary {
  id: number;              // 全局唯一ID（建议与配置库一致）
  name: string;            // 名称（本地化前为中文）
  arcana: "major" | "minor";
  suit?: "wands" | "cups" | "swords" | "pentacles"; // 小阿卡纳才有
  number?: number;         // 大阿卡纳编号或小阿卡纳点数
  image: string;           // 图片asset相对路径，例如 assets/images/major/00-fool.jpg
}

interface CardInterpretation {
  cardId: number;
  upright: {
    keywords: string[];
    meaning: string;       // 正位解读
  };
  reversed: {
    keywords: string[];
    meaning: string;       // 逆位解读
  };
}

interface CardDetail extends CardSummary {
  interpretations: CardInterpretation;
}
```

---

## 路由与页面结构

### 路由
- 列表页：`/cards`
- 详情页：`/cards/[id]`（通过卡牌ID或复合标识定位）

### 组件划分
- `CardsListScreen.tsx`：渲染 78 张牌的网格/分组列表
  - 顶部可显示“塔罗历史”简介（展开查看更多跳转）
  - 支持按「大/小阿卡纳」「花色」过滤
  - 列表项：缩略图 + 名称
- `CardDetailScreen.tsx`：单张牌详情
  - 主要展示：大图、名称、所属、正位/逆位切换
  - 内容：关键词、解释
  - 预留：相关牌、常见组合（后续扩展）

### UI 草图（文字）
- `/cards`
  - Header：标题、搜索/筛选入口
  - Tarot History Panel（可折叠）：来自 `tarot_history.json`
  - Grid/List：每行2-3列，点击进入详情
- `/cards/[id]`
  - Hero：卡图 + 标题
  - Tabs/Segmented：正位 | 逆位
  - Content：关键词 + 文本解读
  - Footer：返回、相关链接

---

## 数据映射与图片路径

### 图片组织（已有）
- 大阿卡纳：`assets/images/major/{00-fool.jpg ... 21-world.jpg}`
- 小阿卡纳：
  - `assets/images/minor/wands/{01-ace-of-wands.jpg ... 14-king-of-wands.jpg}`
  - `assets/images/minor/cups/...`
  - `assets/images/minor/swords/...`
  - `assets/images/minor/pentacles/...`

### 前端映射策略
- 使用已存在的工具或新增 util：`lib/utils/cardImages.ts`（已有）
  - 提供 `getCardImage(cardId | suit+number)` → 图片路径
- 统一卡牌ID策略
  - 若后端/配置库已有稳定ID，则直接复用
  - 若仅有名称/花色/点数，前端建立映射表生成稳定键

---

## 交互与状态

### 列表页
- 支持筛选：
  - 全部/大阿卡纳/小阿卡纳
  - 小阿卡纳按花色分组
- 支持搜索（名称、关键词）

### 详情页
- 正位/逆位切换：
  - Segment 控件或按钮切换，底部有轻微动画过渡
- 文本内容：
  - 支持长文滚动
  - 预留复制分享（后续）

---

## 加载与服务层

### 加载流程
- 启动时（首次进入 `/cards`）：
  - 并行读取：`tarot_history.json` + 卡牌基础与解读映射
- 服务与适配层
  - 新增 `CardInfoService`（前端适配层），聚合：
    - 基础卡牌列表（名称、图片、归属）
    - 正/逆位解读（从 `CardInterpretationService`）
  - 提供方法：
    - `listCards(filters?) → CardSummary[]`
    - `getCardDetail(id) → CardDetail`
    - `getTarotHistory() → TarotHistory`

---

## 国际化与可扩展性

### 先行策略（本期）
- `tarot_history.json` 单语言字段
- `card_interpretations` 按当前中文/现有结构渲染

### 未来扩展
- 将 `tarot_history.json` 拆分为 `assets/data/i18n/{lang}/tarot_history.json`
- 或改为包含 `locales` 字段的对象结构
- 卡牌名称与解读增加多语言字段，或前端字典表映射

---

## 验收清单
- `/cards` 页面可打开并显示历史简介与完整卡牌列表
- 78 张牌均能进入详情页
- 详情页可切换正位/逆位并展示对应解读
- 历史说明文本来自 `assets/data/tarot_history.json`
- 图片显示正确且性能可接受（懒加载或低开销）

---

## 后续任务拆分
1. 创建并填充 `assets/data/tarot_history.json`（单语言结构）
2. 新增前端页面：`/cards` 与 `/cards/[id]`
3. 实现 `CardInfoService` 适配层（聚合卡牌+解读）
4. 接入 `card_interpretations` 数据并完成正/逆位展示
5. 列表筛选、搜索与基础性能优化
6. 预留多语言扩展接口