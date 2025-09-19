"""
Reading API endpoints for tarot card interpretation.
"""
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..schemas.reading import (
    AnalyzeRequest, AnalyzeResponse,
    GenerateRequest, GenerateResponse,
    BasicInterpretationRequest, BasicInterpretationResponse
)
from ..services.reading_service import get_reading_service
from ..api.auth import get_current_user_id_optional

router = APIRouter(prefix="/readings", tags=["Readings"])


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_user_description(
    request: AnalyzeRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id_optional)
):
    """
    第一步：分析用户描述，返回推荐维度。

    支持不同牌阵类型的分析：
    - three-card: 三牌阵，基于因果率和发展趋势分析出3个维度
    - celtic-cross: 凯尔特十字，返回固定的10个牌位维度

    Args:
        request: 包含用户描述和牌阵类型的请求
        db: 数据库会话
        user_id: 可选的用户ID（用于日志记录）

    Returns:
        AnalyzeResponse: 推荐的维度列表
    """
    # 调试断点 - 在这里设置断点
    print(f"DEBUG: Received request - description: {request.description[:50]}..., spread_type: {request.spread_type}")

    try:
        reading_service = get_reading_service()

        # 验证牌阵类型
        if request.spread_type not in ["three-card", "celtic-cross"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="无效的牌阵类型，支持 three-card 或 celtic-cross"
            )

        # 分析用户描述 - 在这里也可以设置断点
        print(f"DEBUG: Starting LLM analysis...")
        recommended_dimensions = await reading_service.analyze_user_description(
            request.description, request.spread_type, db
        )
        print(f"DEBUG: LLM analysis completed, got {len(recommended_dimensions) if recommended_dimensions else 0} dimensions")

        if not recommended_dimensions:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to analyze user description"
            )

        return AnalyzeResponse(
            recommended_dimensions=recommended_dimensions,
            user_description=request.description
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )


@router.post("/generate", response_model=GenerateResponse)
async def generate_reading(
    request: GenerateRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id_optional)
):
    """
    第二步：基于选定维度生成具体解读内容。

    Args:
        request: 包含卡牌ID、维度ID和用户描述的请求
        db: 数据库会话
        user_id: 可选的用户ID（用于日志记录）

    Returns:
        GenerateResponse: 详细的解读结果
    """
    try:
        reading_service = get_reading_service()

        # 生成解读
        interpretation_result = await reading_service.generate_interpretation(
            card_ids=request.card_ids,
            dimension_id=request.dimension_id,
            user_description=request.description,
            db=db
        )

        return GenerateResponse(**interpretation_result)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Generation failed: {str(e)}"
        )


# @router.post("/basic", response_model=BasicInterpretationResponse)
# async def get_basic_interpretation(
#     request: BasicInterpretationRequest,
#     db: Session = Depends(get_db)
# ):
#     """
#     获取卡牌的基础解读（不使用LLM）。

#     Args:
#         request: 包含卡牌ID和方向的请求
#         db: 数据库会话

#     Returns:
#         BasicInterpretationResponse: 基础解读信息
#     """
#     try:
#         reading_service = get_reading_service()

#         result = reading_service.get_basic_interpretation(
#             card_id=request.card_id,
#             direction=request.direction,
#             db=db
#         )

#         if not result:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail=f"Interpretation not found for card {request.card_id} ({request.direction})"
#             )

#         return BasicInterpretationResponse(**result)

#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Failed to get basic interpretation: {str(e)}"
#         )