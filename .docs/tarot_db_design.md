# 塔罗牌应用数据库设计文档（更新版）

## 概述
本数据库设计为塔罗牌应用提供了高度灵活和可扩展的数据模型，支持：
- 动态管理卡牌基础信息
- 多风格卡牌图片支持
- 可配置的解读维度系统
- 灵活的牌阵定义
- 用户历史记录追踪

## 数据库表结构

### 1. `card` 表 — 卡牌基础信息
存储塔罗牌的核心属性。

| 字段名     | 类型           | 描述                           |
|------------|----------------|--------------------------------|
| id         | INTEGER (PK)   | 唯一牌ID                       |
| name       | TEXT           | 牌名称（如「愚者」）           |
| arcana     | TEXT           | 大牌/小牌（Major/Minor）       |
| suit       | TEXT           | 花色（小牌适用）               |
| number     | INTEGER        | 牌序号                         |
| image_url  | TEXT           | 默认图像URL                    |
| style_id   | INTEGER (FK)   | 默认使用的牌面风格             |
| deck       | TEXT           | 所属塔罗牌套牌（如Rider-Waite, Thoth）|

### 2. `card_style` 表 — 牌面风格
管理不同风格的卡牌图像。

| 字段名          | 类型           | 描述                           |
|-----------------|----------------|--------------------------------|
| id              | INTEGER (PK)   | 风格唯一标识                   |
| name            | TEXT           | 风格名称                       |
| image_base_url  | TEXT           | 图像基础路径                   |

### 3. `dimension` 表 — 解读维度定义
提供可配置的解读维度。

| 字段名      | 类型           | 描述                           |
|-------------|----------------|--------------------------------|
| id          | INTEGER (PK)   | 维度唯一标识                   |
| name        | TEXT           | 维度名称（如：情感-时间线）    |
| category    | TEXT           | 类别（如：情感、事业、健康）   |
| description | TEXT           | 维度详细描述                   |
| aspect      | TEXT           | 维度的具体子项（可选）         |
| aspect_type | TEXT           | 子项的类型或分类（可选）       |

### 4. `card_interpretation` 表 — 牌意主表
存储卡牌解读的基本信息。

| 字段名      | 类型           | 描述                           |
|-------------|----------------|--------------------------------|
| id          | INTEGER (PK)   | 解释唯一标识                   |
| card_id     | INTEGER (FK)   | 对应的卡牌ID                   |
| direction   | TEXT           | 正位 / 逆位                    |
| summary     | TEXT           | 简要牌意                       |
| detail      | TEXT           | 详细说明（可选）               |

### 5. `card_interpretation_dimension` 表 — 牌意维度关联
支持多维度、细粒度的卡牌解读。

| 字段名            | 类型           | 描述                           |
|-------------------|----------------|--------------------------------|
| id                | INTEGER (PK)   | 关联唯一标识                   |
| interpretation_id | INTEGER (FK)   | 关联到 card_interpretation.id  |
| dimension_id      | INTEGER (FK)   | 关联到 dimension.id            |
| aspect            | TEXT           | 具体维度子项（从dimension复制）|
| aspect_type       | TEXT           | 子项的类型或分类（从dimension复制）|
| content           | TEXT           | 该维度下的解读文字             |

### 6. `spread` 表 — 牌阵定义
定义不同类型的塔罗牌阵。

| 字段名        | 类型           | 描述                           |
|---------------|----------------|--------------------------------|
| id            | INTEGER (PK)   | 牌阵唯一标识                   |
| name          | TEXT           | 牌阵名称                       |
| description   | TEXT           | 牌阵描述                       |
| card_count    | INTEGER        | 牌阵所需卡牌数量               |

### 7. `user_history` 表 — 用户历史记录
记录用户的占卜历史。

| 字段名              | 类型           | 描述                           |
|---------------------|----------------|--------------------------------|
| id                  | INTEGER (PK)   | 记录唯一标识                   |
| user_id             | TEXT           | 用户ID（可匿名）               |
| timestamp           | DATETIME       | 记录时间                       |
| spread_id           | INTEGER (FK)   | 使用的牌阵ID                   |
| card_ids            | TEXT (JSON)    | 抽到的卡牌ID数组               |
| interpretation_mode | TEXT           | 解读方式（default/ai）         |
| result              | TEXT (JSON)    | 解读结果（结构可自定义）       |

## 设计要点与优势

### 多套牌支持
新增的 `deck` 字段允许：
- 区分不同传统的塔罗牌套牌（如Rider-Waite, Thoth, Marseille）
- 支持多种塔罗牌传统的解读
- 为不同套牌提供独特的解读和风格

### 动态解读维度详解

#### `aspect`（具体维度子项）的概念解释

`aspect` 是用于更精细地描述和解读特定维度的子项。它允许在同一个维度下进行更细致的解读。

**示例：情感维度的 `aspect` 详解**

假设我们有一个名为"情感-时间线"的维度：

1. 维度（Dimension）：
   - name: "情感-时间线"
   - category: "情感"
   - description: "描述情感在不同时间段的变化和状态"
   - aspect: "过去"
   - aspect_type: "时间线"

2. 维度子项（Aspect）可能包括：
   - "过去": 过去的情感经历和影响
   - "现在": 当前的情感状态
   - "未来": 对未来情感发展的预测

**具体存储示例**：

对于「恋人」牌在"情感-时间线"维度下的解读：

```
dimension 表：
- id: 5
- name: "情感-时间线"
- category: "情感"
- aspect: "过去"
- aspect_type: "时间线"

card_interpretation_dimension 表：
- interpretation_id: 1 (恋人牌的解读ID)
- dimension_id: 5 (情感-时间线维度的ID)
- aspect: "过去"
- aspect_type: "时间线"
- content: "过去的感情经历给你带来了深刻的成长和理解..."
```

### 灵活的卡牌风格
- `card_style` 表允许为每张卡牌定义多种图像风格
- 可以轻松添加新的卡牌风格，无需修改核心表结构

### 用户历史追踪
- `user_history` 保存每次抽牌和解读过程
- 支持不同解读模式（默认/AI）
- 可用于历史回顾和数据分析

### 可扩展性
- 解读维度可动态配置
- 支持多种牌阵类型
- 可轻松添加新的解读维度和子维度

## 未来扩展潜力
- 支持更多解读维度
- 添加用户个性化解读偏好
- 实现更复杂的 AI 解读算法
- 开发数据分析和推荐功能