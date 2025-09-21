# Readings API 重构设计文档 (简化版)

## 📖 概述

本文档描述了塔罗牌应用中 Readings API 的简化重构设计。由于是开发阶段，无需考虑向后兼容性，直接修改现有模型以支持多维度解读功能。

## 🎯 重构目标

### 核心问题
1. **单维度限制**：现有设计只支持单一维度解读
2. **数据依赖性过强**：过度依赖客户端与服务端数据库ID的一致性

### 改进目标
1. **多维度支持**：支持用户选择多个维度进行综合解读
2. **数据自包含**：客户端传递完整对象信息，减少对数据库ID的依赖

## 🚀 重构设计方案

### 数据模型变更

#### 1. 新增 CardInfo - 卡牌信息自包含
```python
class CardInfo(BaseModel):
    """客户端传递的完整卡牌信息"""
    id: Optional[int] = None  # 可选的数据库ID
    name: str = Field(..., description="卡牌名称")
    arcana: str = Field(..., description="Major/Minor")
    suit: Optional[str] = None  # 花色（小牌适用）
    number: int = Field(..., description="牌序号")
    direction: str = Field("正位", description="正位/逆位")
    position: int = Field(..., description="在牌阵中的位置")
```

#### 2. DimensionInfo - 保持不变
```python
class DimensionInfo(BaseModel):
    """维度信息（保持现有结构）"""
    id: int
    name: str
    category: str
    description: str
    aspect: Optional[str] = None
    aspect_type: Optional[int] = None
```

#### 3. 修改 GenerateRequest
```python
class GenerateRequest(BaseModel):
    """生成解读的请求（直接修改）"""
    cards: List[CardInfo] = Field(..., min_items=1, max_items=10)
    dimensions: List[DimensionInfo] = Field(..., min_items=1, max_items=3)  # 改为多个维度
    description: str = Field(..., max_length=200)
    spread_type: str = Field(default="three-card")
```

#### 4. 修改 GenerateResponse
```python
class GenerateResponse(BaseModel):
    """生成解读的响应（直接修改）"""
    dimensions: List[DimensionInfo]  # 改为多个维度
    user_description: str
    spread_type: str
    card_interpretations: List[CardInterpretationInfo]
    overall_summary: str
    insights: List[str] = []  # 新增：关键洞察点
    generated_at: str
```

### 核心功能重构

#### 1. 多维度解读核心逻辑
```python
async def generate_interpretation(
    self,
    cards: List[Dict],           # 卡牌字典列表，包含完整卡牌信息
    dimensions: List[Dict],      # 维度字典列表，包含完整维度信息
    user_description: str,
    spread_type: str,
    db: Session
) -> Dict[str, Any]:
    """重构现有方法支持多维度"""

    # 1. 解析卡牌信息
    resolved_cards = []
    for card_dict in cards:
        db_card = await self._resolve_card_dict(card_dict, db)
        resolved_cards.append((card_dict, db_card))

    # 2. 为每个维度生成解读
    all_card_interpretations = []

    for dimension_dict in dimensions:
        # 为当前维度生成卡牌解读（基于现有逻辑）
        card_interpretations = []
        for card_dict, db_card in resolved_cards:
            # 使用现有的单张卡牌解读逻辑
            interpretation = await self._generate_single_card_interpretation(
                card_dict, db_card, dimension_dict, user_description
            )
            card_interpretations.append(interpretation)

        # 收集所有卡牌解读
        all_card_interpretations.extend(card_interpretations)

    # 3. 生成跨维度综合分析
    overall_summary = await self._generate_cross_dimension_summary(
        all_card_interpretations, user_description
    )

    # 4. 提取关键洞察
    insights = await self._extract_key_insights(
        dimension_summaries, overall_summary
    )

    return {
        "dimensions": dimensions,
        "user_description": user_description,
        "spread_type": spread_type,
        "card_interpretations": all_card_interpretations,
        "overall_summary": overall_summary,
        "insights": insights,
        "generated_at": "now"
    }
```

#### 2. 卡牌信息解析
```python
async def _resolve_card_dict(self, card_dict: Dict, db: Session) -> Card:
    """解析客户端传递的卡牌字典信息，匹配数据库中的卡牌"""

    # 优先使用名称精确匹配
    card = db.query(Card).filter(
        Card.name == card_dict["name"]
    ).first()

    if not card:
        raise ValueError(f"无法找到卡牌: {card_dict['name']}")

    return card
```

#### 3. 跨维度综合分析
```python
async def _generate_cross_dimension_summary(
    self,
    dimension_results: Dict[str, Any],
    user_description: str
) -> str:
    """生成维度间的综合分析"""

    # 构建跨维度分析提示词
    dimensions_summary = "\n".join([
        f"【{dim_name}】: {result.get('summary', '')}"
        for dim_name, result in dimension_results.items()
    ])

    cross_analysis_prompt = f"""
基于以下多维度塔罗解读结果，请生成一个综合分析（150-200字）：

用户问题：{user_description}
各维度解读：{dimensions_summary}

请综合分析各维度信息的一致性、互补性和整体发展趋势，给出具体的行动指导。
"""

    try:
        result = await self.llm_service.call_ai_api(cross_analysis_prompt)
        return result if result else "综合来看，建议您保持开放的心态，相信自己的直觉。"
    except Exception as e:
        print(f"生成跨维度分析失败: {e}")
        return "综合来看，建议您保持开放的心态，相信自己的直觉。"
```

## 🔧 实施细节

### 替换策略
1. **直接替换**：由于是开发阶段，直接替换现有接口
2. **保持接口路径不变**：`/readings/generate` 路径保持不变
3. **渐进式更新**：先实现核心功能，再逐步添加高级特性

### 测试策略
```python
# 重点测试用例
def test_generate_multi_dimension():
    """测试多维度解读功能"""
    request_data = {
                        "cards": [
                            {"name": "愚者", "arcana": "Major", "number": 0,
                    "direction": "正位", "position": 1},
                            {"name": "魔术师", "arcana": "Major", "number": 1,
                    "direction": "逆位", "position": 2},
                            {"name": "女祭司", "arcana": "Major", "number": 2,
                    "direction": "正位", "position": 3}
                        ],
                        "dimensions": [
                            {"id": 1, "name": "事业-过去", "category": "事业",
                    "description": "过去经历"},
                            {"id": 2, "name": "事业-现在", "category": "事业",
                    "description": "当前状况"},
                            {"id": 3, "name": "事业-未来", "category": "事业",
                    "description": "未来发展"}
                        ],
                        "description": "关于事业发展的困惑",
                        "spread_type": "three-card"
                    }

    response = client.post("/api/v1/readings/generate", json=request_data)
    assert response.status_code == 200

    data = response.json()
    assert len(data["dimensions"]) == 3
    assert "overall_summary" in data
    assert "insights" in data
```

### 质量保证
- 单元测试覆盖率 > 90%
- 集成测试覆盖主要业务流程
- 性能测试验证响应时间 < 10秒
- 错误处理覆盖所有异常情况

## ⚠️ 风险控制

### 技术风险
1. **多维度处理复杂度**：通过模块化设计和充分测试缓解
2. **LLM调用失败**：实现降级策略和重试机制
3. **数据解析错误**：完善验证和错误提示

### 缓解措施
- 保留现有V1接口作为回滚方案
- 分阶段发布，先内部测试
- 详细的日志记录和监控
- 充分的单元测试和集成测试

---

**实施原则**：简单、直接、有效，专注于多维度解读的核心功能实现。