"""
Cards API endpoints.
"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..models import Card, CardStyle
from ..schemas.card import CardInfo, CardListResponse, CardDetailResponse

router = APIRouter(prefix="/cards", tags=["Cards"])


@router.get("/", response_model=CardListResponse)
async def get_cards(
    arcana: Optional[str] = Query(None, description="筛选大牌或小牌 (Major/Minor)"),
    suit: Optional[str] = Query(None, description="筛选花色（小牌适用）"),
    deck: Optional[str] = Query(None, description="筛选套牌类型"),
    limit: int = Query(78, ge=1, le=100, description="返回数量限制"),
    offset: int = Query(0, ge=0, description="偏移量"),
    db: Session = Depends(get_db)
):
    """
    获取卡牌列表，支持筛选和分页。

    Args:
        arcana: 大牌/小牌筛选
        suit: 花色筛选
        deck: 套牌筛选
        limit: 返回数量限制
        offset: 偏移量
        db: 数据库会话

    Returns:
        CardListResponse: 卡牌列表
    """
    try:
        # 构建查询
        query = db.query(Card)

        # 应用筛选
        if arcana:
            query = query.filter(Card.arcana == arcana)
        if suit:
            query = query.filter(Card.suit == suit)
        if deck:
            query = query.filter(Card.deck == deck)

        # 获取总数
        total = query.count()

        # 应用分页
        cards = query.offset(offset).limit(limit).all()

        # 转换为响应格式
        card_infos = []
        for card in cards:
            card_info = CardInfo(
                id=card.id,
                name=card.name,
                arcana=card.arcana,
                suit=card.suit,
                number=card.number,
                image_url=card.image_url,
                style_id=card.style_id,
                deck=card.deck
            )
            card_infos.append(card_info)

        return CardListResponse(
            cards=card_infos,
            total=total
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch cards: {str(e)}"
        )


@router.get("/{card_id}", response_model=CardDetailResponse)
async def get_card_detail(
    card_id: int,
    include_interpretations: bool = Query(False, description="是否包含解读信息"),
    db: Session = Depends(get_db)
):
    """
    获取单张卡牌的详细信息。

    Args:
        card_id: 卡牌ID
        include_interpretations: 是否包含解读信息
        db: 数据库会话

    Returns:
        CardDetailResponse: 卡牌详情
    """
    try:
        # 查询卡牌
        card = db.query(Card).filter(Card.id == card_id).first()
        if not card:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Card with id {card_id} not found"
            )

        # 查询风格信息
        style_info = None
        if card.style_id:
            style = db.query(CardStyle).filter(CardStyle.id == card.style_id).first()
            if style:
                style_info = {
                    "id": style.id,
                    "name": style.name,
                    "image_base_url": style.image_base_url
                }

        card_info = CardInfo(
            id=card.id,
            name=card.name,
            arcana=card.arcana,
            suit=card.suit,
            number=card.number,
            image_url=card.image_url,
            style_id=card.style_id,
            deck=card.deck,
            style=style_info
        )

        # 可选：包含解读信息
        interpretations = []
        if include_interpretations:
            from ..models import CardInterpretation
            card_interpretations = db.query(CardInterpretation).filter(
                CardInterpretation.card_id == card_id
            ).all()

            interpretations = [{
                "id": interp.id,
                "direction": interp.direction,
                "summary": interp.summary,
                "detail": interp.detail
            } for interp in card_interpretations]

        return CardDetailResponse(
            card=card_info,
            interpretations=interpretations
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch card detail: {str(e)}"
        )


# @router.get("/random/{count}")
# async def get_random_cards(
#     count: int,
#     arcana: Optional[str] = Query(None, description="限制大牌或小牌"),
#     db: Session = Depends(get_db)
# ):
#     """
#     获取随机卡牌（用于抽牌功能）。

#     Args:
#         count: 随机卡牌数量 (1-10)
#         arcana: 可选的大牌/小牌限制
#         db: 数据库会话

#     Returns:
#         随机卡牌列表
#     """
#     # 验证count参数
#     if count < 1 or count > 10:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Count must be between 1 and 10"
#         )
#     try:
#         from sqlalchemy import func

#         # 构建查询
#         query = db.query(Card)
#         if arcana:
#             query = query.filter(Card.arcana == arcana)

#         # 随机选择
#         random_cards = query.order_by(func.random()).limit(count).all()

#         if len(random_cards) < count:
#             raise HTTPException(
#                 status_code=status.HTTP_400_BAD_REQUEST,
#                 detail=f"Not enough cards available. Requested: {count}, Available: {len(random_cards)}"
#             )

#         # 转换为响应格式
#         card_infos = []
#         for card in random_cards:
#             card_info = CardInfo(
#                 id=card.id,
#                 name=card.name,
#                 arcana=card.arcana,
#                 suit=card.suit,
#                 number=card.number,
#                 image_url=card.image_url,
#                 style_id=card.style_id,
#                 deck=card.deck
#             )
#             card_infos.append(card_info)

#         return {
#             "cards": card_infos,
#             "count": len(card_infos)
#         }

#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Failed to get random cards: {str(e)}"
#         )