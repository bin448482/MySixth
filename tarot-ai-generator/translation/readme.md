# 塔罗牌翻译系统使用指南

## 📋 概述

这是一个独立的AI驱动的塔罗牌翻译系统，专门用于将中文塔罗牌内容翻译为专业的英文。系统支持卡牌、维度、牌阵和解读的完整翻译流程。

## 🚀 快速开始

### 环境要求

- Python 3.8+
- OpenAI API密钥
- SQLite数据库文件 `tarot_config.db`

### 安装依赖

```bash
pip install openai python-dotenv asyncio rich sqlite3
```

### 配置检查

系统会自动检查配置文件 `translation_config.py` 中的API配置：

```python
"openai": {
    "api_key": "your-openai-api-key",
    "base_url": "https://api.openai.com/v1",
    "model": "gpt-5-mini-2025-08-07"
}
```

## 📖 完整使用流程

### 第一步：数据导出

将数据库中的中文原始数据导出为JSON文件：

```bash
python export_database_raw.py
```

**输出文件位置**：
- `output/database_raw/card_raw.json` - 78张卡牌数据
- `output/database_raw/dimension_raw.json` - 12个维度数据
- `output/database_raw/spread_raw.json` - 1个牌阵数据
- `output/database_raw/card_interpretation_raw.json` - 156条解读数据

### 第二步：执行翻译

使用AI引擎翻译导出的数据：

```bash
# 翻译所有表
python translate_database.py --all

# 或者翻译特定表
python translate_database.py --table card
python translate_database.py --table dimension
```

**翻译过程包含**：
- 成本预估和用户确认
- 实时进度显示
- 错误重试机制
- 详细统计报告

### 第三步：导入数据库

将翻译结果导入到数据库翻译表中：

```bash
# 导入所有翻译
python import_database_translated.py --all

# 或者导入特定表
python import_database_translated.py --table card
```

**导入特性**：
- 自动清理现有英文翻译
- 事务保证数据一致性
- 导入验证和统计

### 第四步：质量验证

验证翻译质量和数据库集成：

```bash
# 验证所有翻译
python validate_translation_quality.py --all --report

# 验证特定表
python validate_translation_quality.py --table card
```

**验证内容**：
- 翻译完整性检查
- 术语一致性验证
- 质量标准检查
- 数据库集成验证

## 🔧 高级用法

### 单表操作

```bash
# 只翻译卡牌表
python translate_database.py --table card

# 只导入维度翻译
python import_database_translated.py --table dimension

# 只验证牌阵翻译
python validate_translation_quality.py --table spread
```

### 批量操作

```bash
# 翻译多个指定表
python translate_database.py --tables card dimension

# 导入多个指定表
python import_database_translated.py --tables card dimension
```

### 强制覆盖

```bash
# 强制重新翻译（覆盖现有翻译）
python translate_database.py --all --force

# 强制重新导入
python import_database_translated.py --all --force
```

### 生成报告

```bash
# 生成详细质量报告
python validate_translation_quality.py --all --report
```

## 📊 输出文件结构

```
translation/output/
├── database_raw/                    # 原始数据
│   ├── card_raw.json
│   ├── dimension_raw.json
│   ├── spread_raw.json
│   └── card_interpretation_raw.json
├── database_translated/             # 翻译结果
│   ├── card_translated.json
│   ├── dimension_translated.json
│   ├── spread_translated.json
│   └── card_interpretation_translated.json
└── validation_report.json           # 质量验证报告
```

## 🎯 翻译标准

### 卡牌翻译标准
- **大阿卡纳**: The Fool, The Magician, The High Priestess...
- **小阿卡纳**: Ace of Wands, Two of Cups, Three of Swords...
- **牌组**: Wands, Cups, Swords, Pentacles, Major Arcana

### 维度翻译标准
- **类别**: Emotional, Career, Spiritual, Decision Making, Health, Relationships
- **时间线**: Past, Present, Future
- **保持专业性**: 使用标准占卜术语

### 解读翻译标准
- **方向**: Upright, Reversed
- **保持语气**: 维持占卜语言的神秕感和启发性
- **准确性**: 传达原意的深层含义

## 🔍 质量控制

### 自动验证项目

1. **完整性检查**
   - 所有记录都有翻译
   - 必填字段不为空
   - ID对应正确

2. **一致性检查**
   - 术语使用统一
   - 命名格式标准
   - 分类标签一致

3. **质量检查**
   - 无中文字符残留
   - 长度合理性
   - 格式规范性

4. **数据库集成**
   - 导入记录数匹配
   - ID完整性验证
   - 数据一致性检查

### 质量报告解读

```json
{
  "validation_summary": {
    "overall_quality": "Good",  // Good/Needs Improvement/Poor
    "issues_found": 0,          // 发现的问题数量
    "tables_validated": 4       // 验证的表数量
  },
  "issues": [...],              // 问题详情列表
  "glossary_size": 80,          // 术语词典大小
  "standard_cards_count": 78     // 标准卡牌数量
}
```

## 💰 成本控制

### Token使用估算

- **单条记录**: ~500 tokens
- **完整翻译**: ~123,500 tokens (247条记录)
- **预估成本**: $3-8 (取决于模型选择)

### 成本优化策略

1. **分批处理**: 按表分批翻译，便于控制成本
2. **样本测试**: 先用少量数据测试质量
3. **术语词典**: 减少重复翻译的API调用
4. **温度设置**: 使用低温度(0.1)提高一致性

### 使用统计

系统会自动统计：
- 总API调用次数
- Token使用总量
- 成功率和失败率
- 处理时间统计

## 🔧 配置自定义

### 修改AI模型

编辑 `translation_config.py`：

```python
"model": "gpt-4",  # 改为其他模型
"temperature": 0.2,  # 调整创造性
"max_tokens": 1500   # 调整最大长度
```

### 调整批处理参数

```python
"batch_config": {
    "batch_size": 5,                    # 减少并发数
    "rate_limit_per_minute": 30,        # 降低速率
    "max_retries": 5,                   # 增加重试次数
    "retry_delay": 3.0                  # 增加重试延迟
}
```

### 自定义术语词典

编辑 `translation_glossary.json`：

```json
{
  "愚者": "The Fool",
  "魔术师": "The Magician",
  "自定义术语": "Custom Translation"
}
```

## 🚨 故障排除

### 常见问题及解决方案

#### 1. API连接失败
```
❌ OpenAI客户端初始化失败: Invalid API key
```
**解决方案**: 检查 `translation_config.py` 中的API密钥是否正确

#### 2. 数据库连接失败
```
❌ 数据库文件不存在: data/tarot_config.db
```
**解决方案**: 确保数据库文件存在且路径正确

#### 3. 翻译质量问题
```
⚠️ 翻译不完整: 75/78 (缺失 3 条记录)
```
**解决方案**: 检查网络连接，重新运行翻译

#### 4. 导入失败
```
❌ 导入表 card 失败: UNIQUE constraint failed
```
**解决方案**: 使用 `--force` 参数清理现有数据

### 调试模式

启用详细日志：

```bash
# 设置环境变量
export TRANSLATION_DEBUG=1

# 运行翻译
python translate_database.py --all
```

### 手动恢复

如果出现问题，可以手动恢复：

```bash
# 1. 重新导出数据
python export_database_raw.py

# 2. 重新翻译
python translate_database.py --all --force

# 3. 重新导入
python import_database_translated.py --all --force
```

## 📈 性能优化建议

### 提高翻译质量

1. **优化提示词**: 编辑 `prompts/` 目录下的模板文件
2. **扩展术语词典**: 添加更多专业术语
3. **调整参数**: 降低temperature提高一致性
4. **人工审核**: 关键内容建议人工检查

### 提高处理效率

1. **合理批次大小**: 根据网络情况调整batch_size
2. **并发控制**: 避免过高的并发导致API限制
3. **分时处理**: 大量数据分时段处理
4. **缓存机制**: 避免重复翻译相同内容

## 📞 技术支持

### 日志文件

系统会生成详细的日志信息，包括：
- API调用详情
- 错误信息和堆栈
- 性能统计数据
- 翻译质量报告

### 获取帮助

如果遇到问题：

1. 查看控制台输出的错误信息
2. 检查 `translation/output/` 目录下的报告文件
3. 参考本文档的故障排除部分
4. 查看 `claude.md` 了解详细的技术设计

### 版本信息

- **当前版本**: v1.0.0
- **更新日期**: 2025-01-13
- **Python要求**: 3.8+
- **依赖包**: openai, rich, asyncio

---

*更多详细信息请参考 [设计文档](claude.md)*