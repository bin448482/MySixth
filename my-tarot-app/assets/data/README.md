# 塔罗牌数据格式说明

## 文件说明

本目录包含塔罗牌应用的所有静态数据文件，以JSON格式存储。

### 文件列表

- `card_styles.json` - 卡牌风格数据
- `cards.json` - 78张塔罗牌完整数据
- `spreads.json` - 牌阵数据

## 数据结构

### 通用格式

所有JSON文件都遵循以下基本结构：

```json
{
  "version": "版本号",
  "updated_at": "最后更新时间（ISO 8601格式）",
  "description": "数据描述",
  "data": [ /* 实际数据数组 */ ]
}
```

### 1. card_styles.json - 卡牌风格

```json
{
  "version": "1.0.0",
  "updated_at": "2025-01-12T10:00:00Z",
  "description": "塔罗牌卡牌风格数据",
  "data": [
    {
      "name": "风格唯一标识符",
      "image_base_url": "图片基础URL"
    }
  ]
}
```

### 2. cards.json - 卡牌数据

```json
{
  "version": "1.0.0", 
  "updated_at": "2025-01-12T10:00:00Z",
  "description": "78张塔罗牌完整数据",
  "data": [
    {
      "name": "卡牌名称",
      "arcana": "Major | Minor",
      "suit": "花色（仅小阿卡纳）或 null",
      "number": "卡牌序号（0-21大阿卡纳，1-14小阿卡纳）",
      "image_url": "相对图片路径",
      "style_name": "对应的风格名称", 
      "deck": "套牌类型"
    }
  ]
}
```

**卡牌数据说明：**
- **大阿卡纳**: 22张，number 0-21，suit为null
- **小阿卡纳**: 56张，按花色分组
  - 权杖 (Wands): 14张，number 1-14
  - 圣杯 (Cups): 14张，number 1-14  
  - 宝剑 (Swords): 14张，number 1-14
  - 钱币 (Pentacles): 14张，number 1-14

### 3. spreads.json - 牌阵数据

```json
{
  "version": "1.0.0",
  "updated_at": "2025-01-12T10:00:00Z",
  "description": "塔罗牌牌阵数据",
  "data": [
    {
      "name": "牌阵名称",
      "description": "牌阵详细描述",
      "card_count": "需要的卡牌数量"
    }
  ]
}
```

## 数据编辑说明

1. **版本管理**: 修改数据时请更新 `version` 和 `updated_at` 字段
2. **数据验证**: 确保JSON格式正确，所有必需字段都存在
3. **外键关联**: cards.json中的 `style_name` 必须在 card_styles.json 中存在
4. **数据一致性**: 确保卡牌数量正确（总计78张）

## 导入流程

应用启动时会自动从这些JSON文件导入数据到本地SQLite数据库。如果修改了JSON文件，需要：

1. 重新启动应用，或
2. 使用数据库重置功能，或 
3. 手动触发数据重新导入

## 文件维护

- 定期备份JSON文件
- 修改前先验证JSON格式
- 大量修改前建议使用版本控制
- 测试修改后的数据导入是否正常