# GenerateRequest API重构计划

## 📋 问题分析

### 当前问题
1. **card_ids传递问题**：
   - 当前传递`List[int]`类型的卡牌ID
   - 客户端数据库可能与后端不同步
   - 导致ID匹配失败或数据不一致

2. **dimension_id传递问题**：
   - 当前传递单个`int`类型的维度ID
   - 同样存在客户端后端数据库不同步问题
   - 限制了多维度解读的可能性

3. **数据依赖性问题**：
   - API过度依赖数据库ID的一致性
   - 客户端需要完整同步才能正常工作

### 影响范围
- `app/schemas/reading.py` - GenerateRequest定义
- `app/api/readings.py` - generate_reading接口
- `app/services/reading_service.py` - generate_interpretation方法

## 🎯 重构目标

1. **数据自包含**：客户端传递完整对象，减少对数据库ID的依赖
2. **多维度支持**：支持用户选择多个维度进行解读
3. **数据一致性**：确保传递的数据完整有效
4. **向后兼容**：考虑现有客户端的迁移路径

## 📊 新数据结构设计

### 1. 新增CardInfo模型
```python
class CardInfo(BaseModel):
    """客户端传递的卡牌信息"""
    id: Optional[int] = None  # 可选的数据库ID（用于验证）
    name: str = Field(..., description="卡牌名称")
    arcana: str = Field(..., description="大牌/小牌")
    suit: Optional[str] = None  # 花色（小牌适用）
    number: int = Field(..., description="牌序号")
    direction: str = Field(default="正位", description="正位/逆位")
    position: int = Field(..., description="在牌阵中的位置")
    image_url: Optional[str] = None  # 图片URL
```

### 2. 重构GenerateRequest
```python
class GenerateRequest(BaseModel):
    """生成解读的请求（重构版本）"""
    cards: List[CardInfo] = Field(..., min_items=1, max_items=10, description="抽到的卡牌信息列表")
    dimensions: List[DimensionInfo] = Field(..., min_items=1, max_items=3, description="用户选择的维度列表")
    description: str = Field(..., max_length=200, description="用户原始描述")
    spread_type: str = Field(default="three-card", description="牌阵类型")
```

### 3. 更新GenerateResponse
```python
class GenerateResponse(BaseModel):
    """生成解读的响应（增强版本）"""
    dimensions: List[DimensionInfo]  # 支持多维度
    user_description: str
    spread_type: str
    card_interpretations: List[CardInterpretationInfo]
    overall_summary: str
    dimension_summaries: Dict[str, str]  # 各维度的小结
    generated_at: str
```

## 🔄 重构实施步骤

### 第一阶段：Schema重构
1. **新增CardInfo模型** (`app/schemas/reading.py`)
   - 定义完整的卡牌信息结构
   - 包含位置、方向等解读必需信息

2. **重构GenerateRequest** (`app/schemas/reading.py`)
   - `card_ids` → `cards: List[CardInfo]`
   - `dimension_id` → `dimensions: List[DimensionInfo]`
   - 新增`spread_type`字段

3. **更新GenerateResponse** (`app/schemas/reading.py`)
   - 支持多维度响应结构

### 第二阶段：Service层重构
1. **重构generate_interpretation方法** (`app/services/reading_service.py`)
   ```python
   async def generate_interpretation(
       self,
       cards: List[CardInfo],           # 改为接收完整卡牌对象
       dimensions: List[DimensionInfo], # 改为接收多个维度
       user_description: str,
       spread_type: str,
       db: Session
   ) -> Dict[str, Any]:
   ```

2. **新增卡牌验证逻辑**
   - 验证传入卡牌信息的有效性
   - 可选择性地与数据库进行交叉验证

3. **实现多维度解读**
   - 为每个维度生成独立解读
   - 生成维度间的综合分析

### 第三阶段：API层适配
1. **更新generate_reading接口** (`app/api/readings.py`)
   - 适配新的请求结构
   - 更新参数传递方式

2. **增强错误处理**
   - 卡牌信息验证失败处理
   - 维度信息验证失败处理


## 🔧 实现细节

### 卡牌信息处理逻辑
```python
async def _resolve_card_info(self, card_info: CardInfo, db: Session) -> Card:
    """解析客户端传递的卡牌信息，匹配数据库中的卡牌"""
    # 优先使用name+number进行匹配
    query = db.query(Card).filter(
        Card.name == card_info.name
    )

    card = query.first()

    if not card:
        raise ValueError(f"无法找到卡牌: {card_info.name}")

    return card
```

### 多维度解读逻辑
```python
async def _generate_multi_dimension_interpretation(
    self,
    cards: List[CardInfo],
    dimensions: List[DimensionInfo],
    user_description: str
) -> Dict[str, Any]:
    """生成多维度解读"""

    dimension_results = {}

    for dimension in dimensions:
        # 为每个维度生成独立解读
        dimension_interpretation = await self._generate_single_dimension_interpretation(
            cards, dimension, user_description
        )
        dimension_results[dimension.name] = dimension_interpretation

    # 生成维度间的综合分析
    overall_summary = await self._generate_cross_dimension_summary(
        dimension_results, user_description
    )

    return {
        "dimension_results": dimension_results,
        "overall_summary": overall_summary
    }
```

## 📋 测试计划

### 单元测试
1. **Schema验证测试**
   - CardInfo模型验证
   - GenerateRequest验证
   - 边界条件测试

2. **Service层测试**
   - 卡牌匹配逻辑测试
   - 多维度解读测试
   - 错误处理测试

### 集成测试
1. **API端到端测试**
   - 完整解读流程测试
   - 多维度请求测试
   - 异常情况处理测试

2. **数据一致性测试**
   - 客户端数据与数据库匹配测试
   - 数据验证逻辑测试

## 🚀 迁移策略

### 向后兼容方案
1. **保留旧接口**（临时）
   - 在v1路径下保留原有接口
   - 标记为deprecated
   - 设置迁移时间表

2. **新接口部署**
   - 在v2路径下部署新接口
   - 提供迁移文档
   - 逐步引导客户端迁移

### 客户端迁移指导
1. **数据结构变更**
   - 提供新旧结构对比
   - 迁移示例代码
   - 常见问题解答

2. **测试支持**
   - 提供测试数据
   - 兼容性检查工具
   - 迁移验证脚本

## ⚠️ 风险评估

### 技术风险
1. **性能影响**：传递更多数据可能影响请求大小
2. **复杂性增加**：多维度解读逻辑更复杂
3. **兼容性问题**：现有客户端需要适配

### 缓解措施
1. **性能优化**：
   - 数据压缩
   - 缓存策略
   - 异步处理

2. **渐进部署**：
   - 分阶段发布
   - A/B测试
   - 监控指标

## 📅 时间计划

| 阶段 | 时间 | 任务 |
|------|------|------|
| 第1周 | Schema设计 | 完成新数据结构设计和验证 |
| 第2周 | Service重构 | 实现新的服务层逻辑 |
| 第3周 | API适配 | 更新API接口和测试 |
| 第4周 | 集成测试 | 完整功能测试和优化 |
| 第5周 | 部署准备 | 文档、迁移工具准备 |

## 📝 注意事项

1. **数据完整性**：确保客户端传递的数据足够完整和准确
2. **错误处理**：提供清晰的错误信息帮助调试
3. **性能考虑**：多维度解读可能增加计算时间
4. **扩展性**：设计应支持未来更多牌阵类型和维度
5. **安全性**：验证客户端传递数据的安全性

---

**审查要点**：
- [ ] 数据结构设计是否合理
- [ ] 迁移策略是否可行
- [ ] 风险评估是否充分
- [ ] 时间计划是否现实
- [ ] 向后兼容性处理是否妥当