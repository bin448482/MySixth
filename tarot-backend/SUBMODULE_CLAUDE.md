# 塔罗牌后端核心模块开发指南 (SUBMODULE_CLAUDE.md)

## 🎯 当前子模块目标

**第一阶段核心任务**: 建立完整的后端基础架构，支持前端应用的核心功能需求。

### 🔥 优先级开发清单

#### 1. 数据库层建设 (最高优先级)
- [ ] 连接现有数据库 `../tarot-ai-generator/data/tarot_config.db`
- [ ] 创建SQLAlchemy模型映射所有7个核心表
- [ ] 实现数据库连接管理和会话处理
- [ ] 验证数据完整性和表关系

#### 2. FastAPI核心框架 (高优先级)
- [ ] `app/main.py` - FastAPI应用入口和路由注册
- [ ] `app/config.py` - 配置管理系统
- [ ] `app/database.py` - 数据库连接池和会话管理
- [ ] 全局异常处理和CORS配置

#### 3. 认证系统 (高优先级)
- [ ] `app/api/auth.py` - 匿名用户认证API
- [ ] `app/utils/auth.py` - JWT token生成和验证工具
- [ ] `app/schemas/auth.py` - 认证相关数据模型
- [ ] 中间件: 用户身份识别和权限验证

#### 4. 解读系统API (核心功能)
- [ ] `app/api/readings.py` - 两步式解读API端点
- [ ] `app/services/reading_service.py` - 解读业务逻辑
- [ ] `app/services/llm_service.py` - LLM集成服务
- [ ] `app/schemas/reading.py` - 解读请求/响应数据模型

#### 5. 基础数据API (支撑功能)
- [ ] `app/api/cards.py` - 卡牌数据查询API
- [ ] `app/api/dimensions.py` - 解读维度查询API
- [ ] `app/schemas/card.py` - 卡牌相关数据模型
- [ ] 静态资源服务 (卡牌图片)

## 📊 核心数据库模型设计

### 必须实现的SQLAlchemy模型

#### 1. `app/models/card.py`
```python
class Card(Base):
    __tablename__ = "card"

    id: int (PK)
    name: str            # 卡牌名称
    arcana: str          # Major/Minor
    suit: str            # 花色
    number: int          # 序号
    image_url: str       # 图像URL
    style_id: int (FK)   # 关联card_style
    deck: str            # 套牌类型
```

#### 2. `app/models/dimension.py`
```python
class Dimension(Base):
    __tablename__ = "dimension"

    id: int (PK)
    name: str           # 维度名称
    category: str       # 类别
    description: str    # 描述
    aspect: str         # 子项
    aspect_type: str    # 子项类型
```

#### 3. `app/models/interpretation.py`
```python
class CardInterpretation(Base):
    __tablename__ = "card_interpretation"

    id: int (PK)
    card_id: int (FK)   # 关联card表
    direction: str      # 正位/逆位
    summary: str        # 简要牌意
    detail: str         # 详细说明

class CardInterpretationDimension(Base):
    __tablename__ = "card_interpretation_dimension"

    id: int (PK)
    interpretation_id: int (FK)
    dimension_id: int (FK)
    content: str        # 解读内容
```

## 🔌 核心API接口实现

### 1. 认证API (`app/api/auth.py`)
```python
@router.post("/auth/anon")
async def create_anonymous_user():
    """生成匿名用户ID和JWT token"""
    user_id = str(uuid.uuid4())
    token = create_jwt_token(user_id)
    return {"user_id": user_id, "token": token}
```

### 2. 解读API (`app/api/readings.py`)
```python
@router.post("/readings/analyze")
async def analyze_user_description(request: AnalyzeRequest):
    """第一步: 分析用户描述，返回3个推荐维度"""
    dimensions = await reading_service.analyze_description(request.description)
    return {"recommended_dimensions": dimensions}

@router.post("/readings/generate")
async def generate_reading(request: GenerateRequest):
    """第二步: 基于选定维度生成具体解读"""
    result = await reading_service.generate_interpretation(
        cards=request.cards,
        dimension_id=request.dimension_id,
        user_description=request.description
    )
    return {"interpretation": result}
```

### 3. 基础数据API
```python
@router.get("/cards")
async def get_cards():
    """获取所有卡牌信息"""

@router.get("/dimensions")
async def get_dimensions():
    """获取所有解读维度"""

@router.get("/spreads")
async def get_spreads():
    """获取所有牌阵信息"""
```

## 🤖 LLM集成策略

### 配置管理 (`app/config.py`)
```python
class Settings(BaseSettings):
    # 数据库配置
    DATABASE_URL: str = "sqlite:///../tarot-ai-generator/data/tarot_config.db"

    # LLM配置 (参考 ../tarot-ai-generator/.env)
    API_PROVIDER: str = "zhipu"  # zhipu 或 openai
    ZHIPUAI_API_KEY: str
    OPENAI_API_KEY: str
    MODEL_NAME: str = "glm-4-flash"

    # JWT配置
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 24 * 7  # 7天
```

### LLM服务实现 (`app/services/llm_service.py`)
- 支持智谱AI和OpenAI双API提供商
- 参考 `../tarot-ai-generator/main.py` 中的 `generate_single_interpretation` 方法
- 实现两步解读逻辑:
  1. 维度分析: 输入用户描述 → 输出推荐维度
  2. 解读生成: 输入卡牌+维度 → 输出详细解读

## 📁 关键文件实现顺序

### Phase 1: 基础架构 (1-2天)
1. `app/config.py` - 配置管理
2. `app/database.py` - 数据库连接
3. `app/main.py` - FastAPI应用入口
4. 所有 `app/models/*.py` - 数据库模型

### Phase 2: 认证系统 (1天)
1. `app/utils/auth.py` - JWT工具函数
2. `app/schemas/auth.py` - 认证数据模型
3. `app/api/auth.py` - 认证API端点

### Phase 3: 核心解读功能 (2-3天)
1. `app/services/llm_service.py` - LLM集成
2. `app/services/reading_service.py` - 解读业务逻辑
3. `app/schemas/reading.py` - 解读数据模型
4. `app/api/readings.py` - 解读API端点

### Phase 4: 基础数据API (1天)
1. `app/schemas/card.py` - 卡牌数据模型
2. `app/api/cards.py` - 卡牌查询API
3. `app/api/dimensions.py` - 维度查询API

## 🛠️ 开发环境配置

### 1. 虚拟环境激活
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 2. 环境变量配置
创建 `.env` 文件:
```env
DATABASE_URL=sqlite:///../tarot-ai-generator/data/tarot_config.db
API_PROVIDER=zhipu
ZHIPUAI_API_KEY=your_key_here
MODEL_NAME=glm-4-flash
JWT_SECRET_KEY=your_jwt_secret_here
```

### 3. 开发服务器启动
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## ✅ 验证检查点

### 数据库连接验证
- [ ] 能够成功连接到 `../tarot-ai-generator/data/tarot_config.db`
- [ ] SQLAlchemy模型能够正确映射所有表
- [ ] 能够查询到卡牌、维度等基础数据

### API功能验证
- [ ] `/auth/anon` 能够生成有效的JWT token
- [ ] `/cards` 能够返回完整的卡牌列表
- [ ] `/dimensions` 能够返回所有解读维度
- [ ] `/readings/analyze` 能够调用LLM分析用户描述
- [ ] `/readings/generate` 能够生成具体解读内容

### LLM集成验证
- [ ] 能够正确读取 `../tarot-ai-generator/.env` 配置
- [ ] 智谱AI API调用正常工作
- [ ] 解读生成逻辑参考原有实现正确运行

## 🚨 关键注意事项

1. **数据库路径**: 必须使用 `../tarot-ai-generator/data/tarot_config.db`
2. **LLM配置**: 参考 `../tarot-ai-generator/.env` 进行配置
3. **解读逻辑**: 参考 `../tarot-ai-generator/main.py` 中的现有实现
4. **两步API设计**: 先分析维度，再生成解读，避免单次请求过重
5. **匿名用户**: 无需复杂用户管理，JWT token即可
6. **错误处理**: 完善的异常处理和错误响应
7. **API文档**: FastAPI自动生成文档，确保接口清晰

## 📈 成功标准

### 短期目标 (3-5天)
- 完整的FastAPI应用能够启动并响应请求
- 所有基础数据API正常工作
- LLM集成能够生成有效解读
- 前端能够通过API获取所需数据

### 中期目标 (1-2周)
- 支付系统集成完成
- 离线同步机制实现
- 完整的错误处理和日志系统
- 性能优化和缓存机制

---

*此文档专注于当前子模块的具体实现，确保快速交付核心功能*