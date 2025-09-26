# API路由设计 (app/api/CLAUDE.md)

## 🔗 API架构概述

### API组织结构
```
app/api/
├── __init__.py          # 路由注册
├── auth.py              # 匿名认证
├── readings.py          # 解读相关API (✅ 已实现)
├── payments.py          # 支付相关API (🔄 待实现)
├── users.py             # 用户API路由 (🔄 待实现)
└── sync.py              # 离线同步API (🔄 待实现)
```

### API版本管理
- **核心API**: `/` 根路径 (解读功能)
- **用户API**: `/api/v1/` (支付、用户管理)
- **管理API**: `/admin/` (管理Portal)
- **同步API**: `/sync/` (离线同步)

## 📋 核心API接口

### 认证相关 (auth.py)

#### POST /auth/anon - 生成匿名用户ID
**状态**: ✅ 已实现

```python
@router.post("/anon", response_model=AuthResponse)
async def create_anonymous_user(db: Session = Depends(get_db)):
    """生成匿名用户ID和JWT token"""

# 请求: 无需body
# 响应:
{
    "user_id": "uuid_string",
    "token": "jwt_token_string",
    "expires_in": 3600
}
```

### 解读相关 (readings.py)

#### POST /readings/analyze - 分析用户描述
**状态**: ✅ 已实现

```python
@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_reading_request(
    request: AnalyzeRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """分析用户描述，返回推荐维度"""

# 请求:
{
    "question": "我想知道我的感情状况",
    "spread_type": "three-card"  # 或 "celtic-cross"
}

# 响应:
{
    "question": "我想知道我的感情状况",
    "spread_type": "three-card",
    "recommended_dimensions": [
        {
            "id": 1,
            "name": "情感-自我感受",
            "description": "分析你内心对当前感情状态的真实感受",
            "category": "情感",
            "aspect": "自我感受",
            "aspect_type": 1
        }
    ]
}
```

#### POST /readings/generate - 生成多维度解读
**状态**: ✅ 已实现

```python
@router.post("/generate", response_model=ReadingResponse)
async def generate_reading(
    request: ReadingRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """基于选定维度生成多维度解读"""

# 请求:
{
    "question": "我想知道我的感情状况",
    "spread_type": "three-card",
    "selected_dimensions": [1, 2, 3],
    "cards": [
        {"card_id": 1, "orientation": "upright", "position": 1},
        {"card_id": 2, "orientation": "reversed", "position": 2},
        {"card_id": 3, "orientation": "upright", "position": 3}
    ]
}

# 响应:
{
    "reading_id": "uuid_string",
    "question": "我想知道我的感情状况",
    "spread_type": "three-card",
    "cards": [...],
    "dimension_summaries": {
        "1": "在自我感受维度上...",
        "2": "在对方态度维度上...",
        "3": "在关系发展维度上..."
    },
    "overall_summary": "综合来看，你的感情状况...",
    "created_at": "2024-01-01T00:00:00Z"
}
```

## 💳 支付API接口 (payments.py)

### 用户余额管理

#### GET /api/v1/me/balance - 查询用户余额
**状态**: 🔄 待实现

```python
@router.get("/balance", response_model=UserBalanceResponse)
async def get_user_balance(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """查询用户当前积分余额"""

# 响应:
{
    "user_id": "uuid_string",
    "credits": 10,
    "total_purchased": 15,
    "total_consumed": 5,
    "last_updated": "2024-01-01T00:00:00Z"
}
```

#### GET /api/v1/me/transactions - 消费历史
**状态**: 🔄 待实现

```python
@router.get("/transactions", response_model=List[TransactionResponse])
async def get_user_transactions(
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """查询用户积分交易历史"""

# 响应:
[
    {
        "id": 1,
        "type": "consume",
        "credits": -1,
        "balance_after": 9,
        "description": "AI解读服务消费",
        "created_at": "2024-01-01T00:00:00Z"
    }
]
```

### 兑换码功能

#### POST /api/v1/redeem - 兑换码验证兑换
**状态**: 🔄 待实现

```python
@router.post("/redeem", response_model=RedeemResponse)
async def redeem_code(
    request: RedeemRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """兑换码验证和积分发放"""

# 请求:
{
    "code": "TAROT123456789ABCD"
}

# 响应:
{
    "success": true,
    "credits_earned": 5,
    "new_balance": 15,
    "message": "兑换成功，获得5积分"
}
```

### Google Play支付

#### POST /api/v1/payments/google/verify - 购买验证
**状态**: 🔄 待实现

```python
@router.post("/google/verify", response_model=PaymentResponse)
async def verify_google_purchase(
    request: GooglePlayRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """验证Google Play购买凭证"""

# 请求:
{
    "purchase_token": "google_purchase_token",
    "product_id": "credits_pack_5",
    "order_id": "google_order_id"
}

# 响应:
{
    "success": true,
    "order_id": "internal_order_id",
    "credits_earned": 5,
    "new_balance": 20,
    "purchase_status": "completed"
}
```

#### POST /api/v1/payments/google/consume - 标记消费完成
**状态**: 🔄 待实现

```python
@router.post("/google/consume", response_model=ConsumeResponse)
async def consume_google_purchase(
    request: ConsumeRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """标记Google Play购买已消费"""

# 请求:
{
    "purchase_token": "google_purchase_token"
}

# 响应:
{
    "success": true,
    "message": "购买已标记为消费完成"
}
```

### 积分消费

#### POST /api/v1/consume - LLM调用前扣点
**状态**: 🔄 待实现

```python
@router.post("/consume", response_model=ConsumeCreditsResponse)
async def consume_credits(
    request: ConsumeCreditsRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """LLM解读前的积分扣减"""

# 请求:
{
    "service_type": "ai_reading",
    "credits_required": 1,
    "reading_id": "uuid_string"
}

# 响应:
{
    "success": true,
    "credits_consumed": 1,
    "remaining_balance": 9,
    "transaction_id": 123
}
```

## 🔄 离线同步API (sync.py)

### 数据同步接口

#### GET /sync/initial - 初始全量同步
**状态**: 🔄 待实现

```python
@router.get("/initial", response_model=InitialSyncResponse)
async def initial_sync(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """客户端初始化时的全量数据同步"""

# 响应:
{
    "cards": [...],
    "dimensions": [...],
    "spreads": [...],
    "user_history": [...],
    "sync_timestamp": "2024-01-01T00:00:00Z"
}
```

#### GET /sync/delta - 增量更新
**状态**: 🔄 待实现

```python
@router.get("/delta", response_model=DeltaSyncResponse)
async def delta_sync(
    last_sync: datetime = Query(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """基于时间戳的增量数据同步"""

# 响应:
{
    "updated_records": [...],
    "deleted_records": [...],
    "sync_timestamp": "2024-01-01T00:00:00Z"
}
```

## 🔒 中间件和依赖项

### 认证依赖
```python
# app/api/deps.py
async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """解析JWT token获取当前用户"""
    pass

async def get_current_user_optional(token: str = Depends(oauth2_scheme)) -> Optional[dict]:
    """可选的用户认证（支持匿名访问）"""
    pass

async def require_credits(credits_needed: int = 1) -> bool:
    """检查用户积分是否充足"""
    pass
```

### 验证模型
```python
# app/schemas/ 中定义的Pydantic模型

class AnalyzeRequest(BaseModel):
    question: str = Field(..., max_length=200)
    spread_type: str = Field(..., regex="^(three-card|celtic-cross)$")

class ReadingRequest(BaseModel):
    question: str
    spread_type: str
    selected_dimensions: List[int]
    cards: List[CardSelection]

class RedeemRequest(BaseModel):
    code: str = Field(..., regex="^[A-Z0-9]{16}$")
```

## ⚡ 性能优化

### 缓存策略
- Redis缓存用户余额查询
- 静态数据缓存（cards, dimensions）
- LLM解读结果缓存（相同问题+卡牌组合）

### 限流控制
```python
# 每个用户每小时支付API限制
@limiter.limit("10 per hour")
@router.post("/payments/google/verify")
async def verify_google_purchase(...):
    pass

# 每个用户每分钟解读限制
@limiter.limit("5 per minute")
@router.post("/readings/generate")
async def generate_reading(...):
    pass
```

### 异步处理
- 支付验证异步处理
- 邮件通知异步发送
- 数据统计异步计算

## 🧪 API测试

### 测试组织
```
tests/api/
├── test_auth.py              # 认证API测试
├── test_readings.py          # 解读API测试
├── test_payments.py          # 支付API测试
├── test_sync.py              # 同步API测试
└── conftest.py               # 测试配置
```

### 测试示例
```python
# tests/api/test_readings.py
def test_analyze_reading_request(client, auth_headers):
    response = client.post("/readings/analyze", json={
        "question": "测试问题",
        "spread_type": "three-card"
    }, headers=auth_headers)

    assert response.status_code == 200
    assert len(response.json()["recommended_dimensions"]) == 3
```

## 🔐 安全考虑

### API安全
- 所有API强制HTTPS
- JWT token过期时间控制
- 请求参数验证和过滤
- SQL注入防护（SQLAlchemy ORM）

### 支付安全
- Google Play购买凭证签名验证
- 支付状态原子性更新
- 幂等性控制防重复订单
- 敏感信息环境变量管理

### 兑换码安全
- 防爆破连续失败锁定
- 设备级别使用限制
- 批次管理和过期控制

---

*此文档定义了塔罗牌应用后端的完整API架构，为前端集成提供详细的接口规范。*