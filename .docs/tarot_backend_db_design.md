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
    ai_generation_params JSON,
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
    ai_enhancement_params JSON,
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
    complexity_level INTEGER,
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
    generation_confidence FLOAT,
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
    confidence_score FLOAT,
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
    ai_analysis_params JSON,
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
    usage_statistics JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 同步表（用于前端）

#### 3.8 `sync_card` 表 - 卡牌基础信息（同步）
```sql
CREATE TABLE sync_card (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    arcana TEXT NOT NULL,
    suit TEXT,
    number INTEGER,
    image_url TEXT,
    style_id INTEGER,
    deck TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1,
    FOREIGN KEY (style_id) REFERENCES sync_card_style(id)
);
```

#### 3.9 `sync_card_style` 表 - 卡牌风格（同步）
```sql
CREATE TABLE sync_card_style (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    image_base_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1
);
```

#### 3.10 `sync_dimension` 表 - 解读维度（同步）
```sql
CREATE TABLE sync_dimension (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    aspect TEXT,
    aspect_type TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1
);
```

#### 3.11 `sync_card_interpretation` 表 - 卡牌解读（同步）
```sql
CREATE TABLE sync_card_interpretation (
    id INTEGER PRIMARY KEY,
    card_id INTEGER NOT NULL,
    direction TEXT NOT NULL,
    summary TEXT,
    detail TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1,
    FOREIGN KEY (card_id) REFERENCES sync_card(id)
);
```

#### 3.12 `sync_card_interpretation_dimension` 表 - 卡牌解读维度关联（同步）
```sql
CREATE TABLE sync_card_interpretation_dimension (
    id INTEGER PRIMARY KEY,
    interpretation_id INTEGER NOT NULL,
    dimension_id INTEGER NOT NULL,
    aspect TEXT,
    aspect_type TEXT,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1,
    FOREIGN KEY (interpretation_id) REFERENCES sync_card_interpretation(id),
    FOREIGN KEY (dimension_id) REFERENCES sync_dimension(id)
);
```

#### 3.13 `sync_spread` 表 - 牌阵定义（同步）
```sql
CREATE TABLE sync_spread (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    card_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1
);
```

#### 3.14 `sync_prompt_template` 表 - LLM Prompt 模板（同步）
```sql
CREATE TABLE sync_prompt_template (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    template TEXT NOT NULL,
    template_type TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1
);
```

### 其他表（不参与同步）

#### 3.15 `user` 表 - 用户信息
```sql
CREATE TABLE user (
    id TEXT PRIMARY KEY,
    anon_token TEXT UNIQUE,
    email TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3.16 `payment` 表 - 支付记录
```sql
CREATE TABLE payment (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount DECIMAL(10, 2),
    status TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id)
);
```

#### 3.17 `model_usage_log` 表 - 模型调用日志
```sql
CREATE TABLE model_usage_log (
    id INTEGER PRIMARY KEY,
    user_id TEXT,
    tokens INTEGER,
    cost DECIMAL(10, 4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id)
);
```

## 4. 索引优化
```sql
-- 后端应用表索引
CREATE INDEX idx_app_card_name ON app_card(name);
CREATE INDEX idx_app_card_deck ON app_card(deck);
CREATE INDEX idx_app_interpretation_card ON app_card_interpretation(card_id);

-- 同步表索引
CREATE INDEX idx_sync_card_name ON sync_card(name);
CREATE INDEX idx_sync_card_deck ON sync_card(deck);
CREATE INDEX idx_sync_interpretation_card ON sync_card_interpretation(card_id);
```

## 5. 版本控制机制
- 同步表包含 `version` 字段用于版本控制
- `created_at` 和 `updated_at` 用于同步时间戳比较
- 支持增量更新和冲突解决

## 6. 同步设计考虑
- 后端应用表用于复杂的内部处理和AI生成
- 同步表提供给前端的精简、标准化数据
- 定期将后端应用表数据处理并同步到对应的同步表
- 使用版本号和时间戳进行增量更新

## 7. 数据同步流程
1. 在后端应用表中处理和生成复杂数据
2. 后台任务定期处理后端应用表数据
3. 将处理后的数据同步到对应的同步表
4. 同步表数据推送到前端

## 8. 未来扩展方向
- 支持更复杂的 AI 解读算法
- 优化数据处理和同步机制
- 实现更精细的数据转换和筛选
- 开发数据分析和推荐功能