# 塔罗牌维度解读生成工具

`tarot-ai-generator` 是一套面向多语言塔罗解读的批量生成工具。系统读取 SQLite 配置库（卡牌/维度/翻译），按语言路由到不同的大模型，并通过协程并发输出结构化 JSON。当前聚焦三类场景：

1. 调试提示词模板（随机样本）
2. 维度全量生成（156 张卡牌 × 指定维度）
3. 基于问题描述的多维度生成（自动匹配 3 个维度）

## 🎯 功能亮点

- **多语言调试样本**：`debug-sample` 随机抽取卡牌 × 维度组合，快速评估不同语言的提示词效果。
- **维度全量生成**：`dimension` 一次性生成指定维度的所有卡牌解读，支持断点续传与失败补齐。
- **问题驱动生成**：`question` 根据问题描述匹配维度并批量生成多语言解读。
- **模型路由**：按语言映射到智谱、OpenAI 或 Ollama，配置单独的温度、速率限制、批大小。
- **结构化输出**：结果写入 `output/` 目录，包含生成内容、提示词上下文、模型信息与失败列表。

## ⚡ 快速开始

```bash
cd tarot-ai-generator
venv\Scripts\activate          # Windows
# 或
source venv/bin/activate       # Linux / macOS
pip install -r requirements.txt
cp .env.example .env           # 仅填写敏感 API Key
python - <<'PY'                # 验证配置是否完整
from config import Config
Config().validate()
PY
```

核心配置位于 `config/settings.yaml`：

- `database.path`：`data/tarot_config.db`
- `database.locales`：例如 `["zh-CN", "en-US"]`
- `paths.prompt_templates`：语言 → 提示词模板路径
- `llm.language_providers`：语言 → 模型提供商 / 模型名 / 温度 / 速率 / 并发
- `llm.<provider>.api_key`：模型密钥（可被 `.env` 覆盖）

## 🛠️ 命令示例

```bash
# 查看帮助
python main.py --help
python main.py debug-sample --help
python main.py dimension --help
python main.py question --help

# 随机 10 条中英样本
python main.py debug-sample --count 10 --locales zh-CN en-US

# “情感-时间线-过去”维度全量生成（断点续传）
python main.py dimension --name "情感-时间线-过去" --locales zh-CN en-US

# 根据问题描述匹配维度并生成
python main.py question --text "我需要换工作吗？" --question-locale zh-CN --locales zh-CN en-US
```

输出目录约定：

- `output/debug_samples/`：调试样本
- `output/dimensions/dimension_<id>.json`：单维度全量结果
- `output/questions/question_<timestamp>.json`：问题驱动聚合结果
- `output/logs/`：失败任务/运行日志（可选）

维度输出示例（简化）：

```json
{
  "dimension_id": 5,
  "locales": ["zh-CN", "en-US"],
  "records": [
    {
      "interpretation_id": 12,
      "card_id": 6,
      "direction": "正位",
      "cards": {"zh-CN": {...}, "en-US": {...}},
      "results": {
        "zh-CN": {"content": "...", "provider": "zhipu"},
        "en-US": {"content": "...", "provider": "openai"}
      }
    }
  ],
  "failures": []
}
```

## 📊 数据依赖

- `card_interpretation` + `card_interpretation_translation`
- `dimension` + `dimension_translation`
- `dimension_translation.description`（问题描述 → 维度映射）

确保 `data/tarot_config.db` 保持最新：新增维度或翻译后需重新导入。

## 💡 推荐流程

1. `debug-sample`（每种语言 5–10 条，调提示词）
2. `dimension`（批量生成，确认 `failures`）
3. `question`（产品/内容终验）
4. 视需要将内容写回数据库或后台系统

## 📥 导入生成结果到 SQLite

- **备份数据库**：`sqlite3 data/tarot_config.db ".backup 'backup/tarot_config_YYYYMMDD.db'"`
- **导入前验证**：`python scripts/import_dimension_results.py --json output/dimensions/dimension_<id>.json --dry-run --locales zh-CN en-US`
- **正式写入**：`python scripts/import_dimension_results.py --json output/dimensions/dimension_<id>.json --locales zh-CN en-US`
- **说明**：`dimension_<id>.json` 为 `main.py` 生成的单维度结果；问题汇总文件 `output/questions/question_*.json` 仅用于记录，可按需保留。

## ❗ 常见问题

| 症状 | 排查方向 |
|------|----------|
| 数据库缺失 | 检查 `data/tarot_config.db` 是否存在 / 路径正确 |
| 提示词模板缺失 | 校验 `paths.prompt_templates` 中的文件是否存在 |
| 模型调用失败 | 检查 API Key、速率限制或网络连通性 |
| 语言混乱 | 确认数据库翻译完备、提示词模板是否匹配目标语言 |
| question 找不到维度 | 检查问题描述是否与 `dimension_translation.description` 完全一致 |
| 英文输出仍含中文牌名 | 数据访问层会自动将 `en-US`→`en` 等区域代码回退到基础语言，请确认数据库中的英文翻译（`card_translation.locale = 'en'`）已填充 |

## 📞 参考文件

- 业务逻辑：`services/generation_service.py`
- 模型路由：`services/model_router.py`
- 提示词构建：`services/prompt_builder.py`
- 数据访问：`data_loader.py`
- 结果写回：`scripts/import_dimension_results.py`（支持 `--dry-run`，根语言写入主表，其它语言写入翻译表）

欢迎在执行前充分审阅提示词与配置，确保生成内容符合产品调性。祝使用顺利！
