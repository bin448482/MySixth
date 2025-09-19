# Tarot Backend

塔罗牌应用后端服务

## 项目结构

基于 FastAPI 的塔罗牌应用后端，支持匿名用户、LLM解读和支付功能。

## 环境要求

- Python 3.9+
- FastAPI 0.104+
- SQLite/PostgreSQL

## 快速开始

```bash
# 安装依赖
pip install -r requirements.txt

# 运行开发服务器
uvicorn app.main:app --reload

# claude code 内执行测试
PYTHONIOENCODING=utf-8 python test_analyze_user_description.py
```

## 文档

详细开发指南请参考 `CLAUDE.md`。