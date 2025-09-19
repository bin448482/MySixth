"""
Reading-related Pydantic schemas.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    """分析用户描述的请求"""
    description: str = Field(..., max_length=200, description="用户描述，最多200字")
    spread_type: str = Field(default="three-card", description="牌阵类型：three-card（三牌阵）、celtic-cross（凯尔特十字）")


class DimensionInfo(BaseModel):
    """维度信息"""
    id: int
    name: str
    category: str
    description: str
    aspect: Optional[str] = None
    aspect_type: Optional[int] = None


class AnalyzeResponse(BaseModel):
    """分析用户描述的响应"""
    recommended_dimensions: List[DimensionInfo]
    user_description: str


class GenerateRequest(BaseModel):
    """生成解读的请求"""
    card_ids: List[int] = Field(..., min_items=1, max_items=10, description="抽到的卡牌ID列表")
    dimension_id: int = Field(..., description="用户选择的维度ID")
    description: str = Field(..., max_length=200, description="用户原始描述")


class CardInterpretationInfo(BaseModel):
    """单张卡牌解读信息"""
    card_id: int
    card_name: str
    direction: str
    position: int
    basic_summary: str
    ai_interpretation: str
    dimension_aspect: Dict[str, Any]


class GenerateResponse(BaseModel):
    """生成解读的响应"""
    dimension: DimensionInfo
    user_description: str
    card_interpretations: List[CardInterpretationInfo]
    overall_summary: str
    generated_at: str


class BasicInterpretationRequest(BaseModel):
    """基础解读请求"""
    card_id: int
    direction: str = Field(default="正位", description="牌位方向")


class BasicInterpretationResponse(BaseModel):
    """基础解读响应"""
    card_id: int
    card_name: str
    arcana: str
    direction: str
    summary: str
    detail: Optional[str] = None