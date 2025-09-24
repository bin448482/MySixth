# 塔罗牌维度解读生成工具

一个支持多种AI模型的Python工具，用于生成详细的塔罗牌维度解读内容，支持断点续传和批量生成。

## 🎯 功能特性

- **多模型支持**: 智谱AI、OpenAI、Ollama本地模型
- **批量生成**: 一键生成完整的1,872条维度解读记录
- **断点续传**: 自动检测并恢复未完成的生成任务
- **并发处理**: 异步批处理提高生成效率
- **成本控制**: 预估API调用成本，支持用户确认
- **进度跟踪**: 实时显示生成进度和状态
- **错误处理**: 自动重试机制和详细错误日志

## 📋 数据概览

- **塔罗牌**: 78张 × 2个方向 = 156条记录
- **解读维度**: 12个维度（情感、决策、财富等类别）
- **总生成量**: 156 × 12 = 1,872条解读记录

## 🚀 快速开始

### 环境配置

```bash
# 进入项目目录
cd tarot-ai-generator

# 激活虚拟环境
venv\Scripts\activate  # Windows
# 或
source venv/bin/activate  # Linux/Mac

# 安装依赖
pip install -r requirements.txt
```

### API配置

复制环境变量模板并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 选择AI提供商 (zhipu/openai/ollama)
API_PROVIDER=zhipu

# 智谱AI配置
ZHIPUAI_API_KEY=your_api_key_here

# 或 OpenAI配置
# API_PROVIDER=openai
# OPENAI_API_KEY=your_api_key_here
# OPENAI_BASE_URL=https://api.openai.com/v1

# 或 Ollama本地模型
# API_PROVIDER=ollama
# OLLAMA_BASE_URL=http://localhost:11434
# OLLAMA_MODEL=qwen2.5:7b
```

## 📖 使用指南

### 基本命令

```bash
# 查看帮助
python main.py --help

# 查看当前生成状态
python main.py --check-status

# 列出所有塔罗牌
python main.py --list-cards

# 列出所有维度
python main.py --list-dimensions
```

### 生成功能

```bash
# 生成样本数据（测试用）
python main.py --sample 5

# 为指定卡牌生成所有维度解读
python main.py --card "愚者" --direction "正位"

# 为指定维度生成所有卡牌解读
python main.py --dimension "时间之流牌阵-过去"

# 🎯 批量生成完整数据集（支持断点续传）
python main.py --generate-all

# 跳过确认直接生成
python main.py --generate-all --force
```

## 🔄 断点续传机制

系统会自动：

1. **检测状态**: 分析现有数据，识别不完整的维度
2. **清理数据**: 移除不完整维度的所有记录（避免数据不一致）
3. **恢复生成**: 只生成缺失的维度，保留完整的维度
4. **实时保存**: 每完成一个维度立即保存进度

### 状态示例

```
生成状态总览
期望总记录数: 1872 (12 维度 × 156 卡牌)
当前记录数: 468
完成维度数: 3/12
不完整维度数: 9

需要生成的维度:
  - 时间之流牌阵-过去 (2/156)     # 不完整，将重新生成
  - 时间之流牌阵-现在 (0/156)     # 未开始
  - 恋人金字塔牌阵-自己 (156/156) # 已完成，跳过
```

## 📊 输出格式

生成的JSON文件结构：

```json
{
  "version": "1.0.0",
  "generated_at": "2025-09-24T21:00:00",
  "model": "glm-4",
  "count": 1872,
  "data": [
    {
      "card_name": "愚者",
      "direction": "正位",
      "dimension_name": "时间之流牌阵-过去",
      "dimension_category": "情感",
      "aspect": "过去",
      "aspect_type": 1,
      "content": "AI生成的详细解读内容..."
    }
  ]
}
```

## ⚙️ 配置说明

### 关键配置项

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `API_PROVIDER` | AI服务提供商 | `zhipu` |
| `TEMPERATURE` | 生成温度 | `0.7` |
| `MAX_TOKENS` | 最大Token数 | `1000` |
| `RATE_LIMIT_PER_MINUTE` | 每分钟API调用限制 | `60` |
| `BATCH_SIZE` | 并发批处理大小 | `10` |

### 支持的AI模型

| 提供商 | 模型 | 优势 | 成本 |
|--------|------|------|------|
| **智谱AI** | glm-4 | 中文理解能力强 | 低 |
| **OpenAI** | gpt-4 | 生成质量高 | 高 |
| **Ollama** | qwen2.5:7b | 本地运行，免费 | 无 |

## 💰 成本预估

### 完整生成成本（1,872条记录）

- **智谱AI**: ~$15-20
- **OpenAI GPT-4**: ~$150-200
- **Ollama**: 免费（需本地计算资源）

### 推荐策略

1. **测试阶段**: 使用 `--sample 10` 验证效果
2. **小规模**: 按维度分批生成 `--dimension`
3. **大规模**: 使用智谱AI或Ollama降低成本

## 🛠️ 故障排除

### 常见问题

**1. API密钥错误**
```bash
错误: 请在 .env 文件中设置 ZHIPUAI_API_KEY
解决: 检查 .env 文件中的API密钥配置
```

**2. 数据文件路径错误**
```bash
错误: 卡牌解读文件不存在
解决: 确保 data/config_jsons/ 目录下有必要的JSON文件
```

**3. 生成中断**
```bash
情况: 生成过程中断（网络/电脑重启等）
解决: 重新运行 python main.py --generate-all
系统会自动从中断点继续
```

### 调试模式

```bash
# 生成单条记录用于调试
python main.py --sample 1 --force

# 检查具体维度状态
python main.py --check-status
```

## 📁 项目结构

```
tarot-ai-generator/
├── main.py                    # 主程序
├── config.py                  # 配置管理
├── prompt_template.txt        # AI提示词模板
├── requirements.txt           # 依赖包
├── .env.example              # 环境变量模板
├── README.md                 # 本文档
├── data/config_jsons/        # 数据文件
│   ├── card_interpretations.json      # 塔罗牌数据(156条)
│   ├── dimensions.json                # 维度定义(12个)
│   └── card_interpretation_dimensions.json # 生成结果
├── output/                   # 输出文件
└── venv/                    # Python虚拟环境
```

## 🔧 开发指南

### 自定义提示词

编辑 `prompt_template.txt` 调整AI生成的内容风格：

```text
请为塔罗牌 "{card_name}" ({direction}) 在 "{dimension_name}" 维度下生成详细解读。

卡牌信息：
- 基础牌意：{summary}
- 详细说明：{detail}

维度信息：
- 维度类别：{category}
- 维度描述：{description}
- 具体方面：{aspect}

请生成200-300字的详细解读内容...
```

### 批处理脚本

创建自动化脚本：

```bash
#!/bin/bash
# 分维度生成
python main.py --dimension "时间之流牌阵-过去"
python main.py --dimension "时间之流牌阵-现在"
python main.py --dimension "时间之流牌阵-将来"
```

### 扩展新模型

在 `config.py` 和 `main.py` 中添加新的AI服务支持。

## 📞 支持与反馈

### 最佳实践

1. **渐进式生成**: 从样本开始，逐步扩大规模
2. **质量检查**: 定期检查生成内容质量
3. **备份数据**: 及时备份生成的重要数据
4. **监控成本**: 使用智谱AI等低成本方案进行大批量生成

### 性能优化

- 调整 `BATCH_SIZE` 控制并发数量
- 设置合理的 `RATE_LIMIT_PER_MINUTE` 避免API限制
- 使用本地Ollama模型避免网络开销

---

**注意**: 本工具专门为塔罗牌应用的维度解读内容生成而设计，与主项目的CLAUDE.md配合使用。