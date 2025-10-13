# 塔罗牌维度解读生成工具 (CLAUDE.md)

## 📖 项目简介

**塔罗牌维度解读生成工具** 是一个支持多种AI模型的Python工具，用于生成详细的塔罗牌维度解读内容。该工具可以根据现有的塔罗牌基础解读数据和维度定义，调用AI模型（智谱AI、OpenAI或Ollama本地模型）生成更加详细和个性化的解读文本。

## 📌 重要说明

**本项目为独立工具**，所有文件修改和更新均在 `tarot-ai-generator/` 目录下进行，除非特别说明需要访问其他项目目录（如读取 `../my-tarot-app/` 的数据文件）。开发时请确保：
- 所有代码文件位于当前目录
- 配置文件（.env）在当前目录
- 输出文件默认保存到 `./output/` 目录
- 仅在需要读取源数据时访问其他项目目录

## 🎯 核心功能

- **单卡牌生成**: 为指定塔罗牌生成所有维度的解读内容
- **单维度生成**: 为指定维度生成所有塔罗牌的解读内容
- **样本生成**: 生成少量样本数据用于测试和验证
- **数据查看**: 列出所有可用的塔罗牌和解读维度
- **成本控制**: 预估API调用成本，支持用户确认后执行
- **进度跟踪**: 实时显示生成进度和预估完成时间
- **多模型支持**: 支持智谱AI、OpenAI和Ollama本地模型

## 📁 项目结构

```
tarot-ai-generator/
├── main.py                    # 主程序文件
├── config.py                  # 配置管理
├── prompt_template.txt        # AI提示词模板
├── requirements.txt           # Python依赖
├── .env.example              # 环境变量示例
├── .env                      # 环境变量配置（需创建）
├── venv/                     # Python虚拟环境
├── output/                   # 生成结果输出目录
├── translation/              # 翻译系统（独立模块）
│   ├── translation_config.py         # 翻译配置管理
│   ├── ai_translation_engine.py      # AI翻译引擎
│   ├── export_database_raw.py        # 数据导出脚本
│   ├── translate_database.py         # 主翻译流程
│   ├── import_database_translated.py # 数据导入脚本
│   ├── validate_translation_quality.py # 质量验证脚本
│   ├── prompts/                        # 翻译提示词模板
│   ├── output/                         # 翻译输出文件
│   ├── claude.md                       # 翻译系统设计文档
│   └── readme.md                       # 翻译系统使用说明
└── CLAUDE.md                 # 本文档
```

## 🚀 快速开始

### 1. 环境配置

#### 激活虚拟环境
```bash
# Windows
cd tarot-ai-generator
venv\Scripts\activate

# Linux/Mac
cd tarot-ai-generator
source venv/bin/activate
```

#### 安装依赖
```bash
pip install -r requirements.txt
```

#### 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，配置API提供商
# 方式1: 使用智谱AI
# API_PROVIDER=zhipu
# ZHIPUAI_API_KEY=your_api_key_here

# 方式2: 使用OpenAI
# API_PROVIDER=openai
# OPENAI_API_KEY=your_api_key_here
# OPENAI_BASE_URL=https://api.openai.com/v1

# 方式3: 使用Ollama本地模型
# API_PROVIDER=ollama
# OLLAMA_BASE_URL=http://localhost:11434
# OLLAMA_MODEL=llama3
```

### 2. 使用方法

#### 查看可用数据
```bash
# 列出所有塔罗牌
python main.py --list-cards

# 列出所有解读维度
python main.py --list-dimensions
```

#### 生成解读内容
```bash
# 为指定卡牌生成所有维度解读（21条）
python main.py --card "魔术师" --direction "正位"

# 为指定维度生成所有卡牌解读（156条）
python main.py --dimension "情感-时间线-过去"

# 生成样本数据（用于测试）
python main.py --sample 5
```

## 📊 数据源

### 塔罗牌数据
- **来源**: `../my-tarot-app/assets/data/card_interpretations.json`
- **内容**: 78张塔罗牌的正位和逆位解读（共156条记录）
- **格式**: 每条记录包含卡牌名称、方向、基础牌意和详细说明

### 维度数据
- **来源**: `../my-tarot-app/assets/data/dimensions.json`
- **内容**: 21个解读维度的定义
- **类别**: 包含情感、事业、精神、决策、健康、人际关系、类比-生命周期等维度

## 🔧 配置说明

### 支持的AI模型提供商

| 提供商 | 说明 | 优势 | 配置要求 |
|--------|------|------|----------|
| **智谱AI** | 智谱AI的GLM系列模型 | 中文理解能力强，性价比高 | ZHIPUAI_API_KEY |
| **OpenAI** | OpenAI的GPT系列模型 | 生成质量高，功能强大 | OPENAI_API_KEY, OPENAI_BASE_URL |
| **Ollama** | 本地部署的开源模型 | 免费使用，数据隐私，无网络依赖 | OLLAMA_BASE_URL, OLLAMA_MODEL |

### 环境变量配置 (.env)

#### 通用配置
| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `API_PROVIDER` | API提供商选择 (zhipu/openai/ollama) | `zhipu` |
| `CARD_INTERPRETATIONS_PATH` | 塔罗牌数据文件路径 | `data/config_jsons/card_interpretations.json` |
| `DIMENSIONS_PATH` | 维度数据文件路径 | `data/config_jsons/dimensions.json` |
| `OUTPUT_PATH` | 输出文件路径 | `./output/card_interpretation_dimensions.json` |
| `TEMPERATURE` | AI生成温度参数 | `0.7` |
| `MAX_TOKENS` | 最大token数量 | `1000` |
| `RATE_LIMIT_PER_MINUTE` | API调用频率限制 | `60` |
| `BATCH_SIZE` | 并发批处理大小 | `10` |

#### 智谱AI配置
| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `ZHIPUAI_API_KEY` | 智谱AI的API密钥 | 必填（当API_PROVIDER=zhipu） |
| `MODEL_NAME` | 使用的模型名称 | `glm-4` |

#### OpenAI配置
| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `OPENAI_API_KEY` | OpenAI的API密钥 | 必填（当API_PROVIDER=openai） |
| `OPENAI_BASE_URL` | OpenAI API基础URL | `https://api.openai.com/v1` |
| `MODEL_NAME` | 使用的模型名称 | `gpt-4` |

#### Ollama配置
| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `OLLAMA_BASE_URL` | Ollama服务地址 | `http://localhost:11434` |
| `OLLAMA_MODEL` | Ollama模型名称 | `llama3` |

### 提示词模板

工具使用 `prompt_template.txt` 中的模板来构建发送给AI的提示词。模板包含：

- 塔罗牌基础信息（名称、方向、牌意）
- 解读维度信息（名称、类别、描述）
- 生成要求和格式说明

## 📝 输出格式

生成的JSON文件格式如下：

```json
{
  "version": "1.0.0",
  "generated_at": "2025-09-12T10:00:00",
  "model": "glm-4",
  "count": 21,
  "data": [
    {
      "card_name": "魔术师",
      "direction": "正位",
      "dimension_name": "情感-时间线-过去",
      "dimension_category": "情感",
      "aspect": "过去",
      "aspect_type": "1",
      "content": "AI生成的详细解读内容..."
    }
  ]
}
```

## 💰 成本预估

### 单次生成成本
- **单卡牌全维度**: 21个维度 × ~500 tokens = ~10,500 tokens
- **单维度全卡牌**: 156张卡牌 × ~500 tokens = ~78,000 tokens
- **全量生成**: 3,276条解读 × ~500 tokens = ~1,638,000 tokens

### 推荐使用策略
1. **先测试**: 使用 `--sample` 生成少量数据验证效果
2. **分批生成**: 按维度或卡牌类型分批处理
3. **质量优先**: 调优提示词模板后再批量生成

## 🔍 使用示例

### 例1: 测试工具效果
```bash
# 生成5条样本数据
python main.py --sample 5

# 检查输出结果
# 输出文件: ./output/card_interpretation_dimensions_sample.json
```

### 例2: 为特定卡牌生成全维度解读
```bash
# 为"愚者"正位生成21个维度解读
python main.py --card "愚者" --direction "正位"

# 输出文件: ./output/card_interpretation_dimensions_card_愚者_正位.json
```

### 例3: 为特定维度生成全卡牌解读
```bash
# 为"情感-时间线-过去"维度生成156张卡牌解读
python main.py --dimension "情感-时间线-过去"

# 输出文件: ./output/card_interpretation_dimensions_dimension_情感-时间线-过去.json
```

## ⚠️ 注意事项

### API使用限制
- 工具内置了API调用频率控制（默认每分钟60次）
- 每次调用前会预估成本并要求用户确认
- 支持暂停和恢复功能

### 数据质量
- 生成的内容质量取决于提示词模板的设计
- 建议先用样本数据测试，调优后再批量生成
- 可能需要人工审核和调整生成的内容

### 文件路径
- 确保数据源文件路径正确
- 输出目录会自动创建
- 建议定期备份生成的结果

## 🛠️ 故障排除

### 常见问题

1. **API密钥错误**
   ```
   解决: 检查 .env 文件中的 ZHIPUAI_API_KEY 是否正确
   ```

2. **数据文件未找到**
   ```
   解决: 检查 CARD_INTERPRETATIONS_PATH 和 DIMENSIONS_PATH 路径是否正确
   ```

3. **API调用失败**
   ```
   解决: 检查网络连接，确认API密钥有效且有足够额度
   ```

### 调试模式
```bash
# 查看详细错误信息
python main.py --sample 1
```

## 🔄 扩展功能

### 自定义提示词
编辑 `prompt_template.txt` 文件来调整AI生成的内容风格和质量。

### 批处理脚本
可以创建批处理脚本来自动化大量数据的生成：

```bash
#!/bin/bash
# batch_generate.sh

# 生成所有情感维度
python main.py --dimension "情感-时间线-过去"
python main.py --dimension "情感-时间线-现在"
python main.py --dimension "情感-时间线-将来"

# 生成重要卡牌
python main.py --card "愚者" --direction "正位"
python main.py --card "魔术师" --direction "正位"
```

## 📞 技术支持

### 开发指导原则
1. **质量优先**: 确保生成内容的准确性和实用性
2. **成本控制**: 避免不必要的大量API调用
3. **用户友好**: 提供清晰的进度反馈和错误提示
4. **数据安全**: 保护API密钥和生成的内容

### 最佳实践
- 在正式使用前先用样本数据测试
- 定期检查生成内容的质量
- 合理设置API调用频率限制
- 备份重要的生成结果

## 🌐 翻译系统 (Translation System)

### 概述
项目包含一个独立的AI翻译系统，专门用于将塔罗牌相关的中文内容翻译为专业的英文。该系统完全独立运行，支持数据库翻译的完整流程。

### 主要功能
- **数据导出**: 从SQLite数据库导出中文原始数据
- **AI翻译**: 使用OpenAI API进行专业术语翻译
- **数据导入**: 将翻译结果导入数据库翻译表
- **质量验证**: 完整的翻译质量检查机制

### 使用指南
详细的使用说明请参考：[翻译系统使用指南](translation/readme.md)

### 技术设计
系统的技术架构和设计细节请参考：[翻译系统设计文档](translation/claude.md)

### 快速使用
```bash
# 进入翻译系统目录
cd translation

# 完整翻译流程
python export_database_raw.py          # 1. 导出数据
python translate_database.py --all     # 2. 执行翻译
python import_database_translated.py --all  # 3. 导入数据库
python validate_translation_quality.py --all  # 4. 质量验证
```

---

*此工具专门用于塔罗牌应用的维度解读内容生成，与主项目的CLAUDE.md配合使用。翻译系统为独立模块，详见 [translation/](translation/) 目录。*