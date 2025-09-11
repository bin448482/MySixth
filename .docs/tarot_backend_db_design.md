# 塔罗牌应用后端数据库设计文档

## 1. 设计目标
- 支持塔罗牌应用的核心功能
- 满足 MVP 阶段需求
- 为未来扩展预留架构灵活性
- 支持离线同步机制
- 区分后端应用表和同步表

## 2. 数据库选型
- 初始阶段：SQLite
- 未来可扩展：PostgreSQL
- ORM：SQLAlchemy

## 3. 数据表设计

### 后端应用表（内部使用）

#### 3.1 `app_card` 表 - 卡牌基础信息（内部）
```sql
CREATE TABLE app_card (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    arcana TEXT NOT NULL,  -- 'Major' / 'Minor'
    suit TEXT,             -- 小牌适用
    number INTEGER,
    image_url TEXT,
    style_id INTEGER,
    deck TEXT,
    additional_metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (style_id) REFERENCES app_card_style(id)
);
```

#### 3.2 `app_card_style` 表 - 卡牌风格（内部）
```sql
CREATE TABLE app_card_style (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    image_base_url TEXT,
    style_metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3.3 `app_dimension` 表 - 解读维度（内部）
```sql
CREATE TABLE app_dimension (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    aspect TEXT,
    aspect_type TEXT,
    ai_generation_params JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3.4 `app_card_interpretation` 表 - 卡牌解读（内部）
```sql
CREATE TABLE app_card_interpretation (
    id INTEGER PRIMARY KEY,
    card_id INTEGER NOT NULL,
    direction TEXT NOT NULL,  -- 'Upright' / 'Reversed'
    summary TEXT,
    detail TEXT,
    ai_context JSON,
    psychological_insight TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES app_card(id)
);
```

#### 3.5 `app_card_interpretation_dimension` 表 - 卡牌解读维度关联（内部）
```sql
CREATE TABLE app_card_interpretation_dimension (
    id INTEGER PRIMARY KEY,
    interpretation_id INTEGER NOT NULL,
    dimension_id INTEGER NOT NULL,
    aspect TEXT,
    aspect_type TEXT,
    content TEXT,
    ai_generation_details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (interpretation_id) REFERENCES app_card_interpretation(id),
    FOREIGN KEY (dimension_id) REFERENCES app_dimension(id)
);
```

#### 3.6 `app_spread` 表 - 牌阵定义（内部）
```sql
CREATE TABLE app_spread (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    card_count INTEGER,
    spread_metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3.7 `app_prompt_template` 表 - LLM Prompt 模板（内部）
```sql
CREATE TABLE app_prompt_template (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    template TEXT NOT NULL,
    template_type TEXT,
    ai_model_params JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 同步表（用于前端）

#### 3.8 `sync_card`、`sync_card_style`、`sync_dimension`、`sync_card_interpretation`、`sync_card_interpretation_dimension`、`sync_spread`、`sync_prompt_template`
（结构类似后端应用表，但保留核心字段，去除复杂的元数据）

## 4. 同步设计考虑
- 后端应用表用于复杂的内部处理
- 同步表提供给前端的精简数据
- 定期将后端应用表数据处理并同步到对应的同步表
- 使用版本号和时间戳进行增量更新

## 5. 数据同步流程
1. 在后端应用表中处理和生成复杂数据
2. 后台任务定期处理后端应用表数据
3. 将处理后的数据同步到对应的同步表
4. 同步表数据推送到前端

## 6. 未来扩展方向
- 支持更复杂的 AI 解读算法
- 优化数据处理和同步机制
- 实现更精细的数据转换和筛选