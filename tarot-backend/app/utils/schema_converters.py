"""
Schema转换工具 - 负责V1和V2数据模型之间的转换
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from ..models import Card, Dimension
from ..schemas.reading import (
    GenerateRequest, GenerateRequestV2,
    CardInfo, DimensionInfoV2, RequestConversionResult
)


class CardInfoResolutionError(Exception):
    """卡牌信息解析错误"""
    def __init__(self, card_info: dict, details: str):
        self.card_info = card_info
        self.details = details
        super().__init__(f"Failed to resolve card: {details}")


class SchemaConverter:
    """Schema转换工具"""

    @staticmethod
    async def convert_v1_to_v2_request(
        v1_request: GenerateRequest,
        db: Session,
        default_spread_type: str = "three-card"
    ) -> GenerateRequestV2:
        """将V1请求转换为V2格式"""

        # 转换卡牌信息
        cards = []
        for i, card_id in enumerate(v1_request.card_ids):
            card = db.query(Card).filter(Card.id == card_id).first()
            if not card:
                raise ValueError(f"Card ID {card_id} not found")

            cards.append(CardInfo(
                id=card.id,
                name=card.name,
                arcana=card.arcana,
                suit=card.suit,
                number=card.number,
                direction="正位",  # 默认正位，实际可能需要更复杂逻辑
                position=i + 1,
                image_url=card.image_url if hasattr(card, 'image_url') else None,
                deck=card.deck if hasattr(card, 'deck') else "default"
            ))

        # 转换维度信息
        dimension = db.query(Dimension).filter(
            Dimension.id == v1_request.dimension_id
        ).first()
        if not dimension:
            raise ValueError(f"Dimension ID {v1_request.dimension_id} not found")

        dimensions = [DimensionInfoV2(
            id=dimension.id,
            name=dimension.name,
            category=dimension.category,
            description=dimension.description,
            aspect=dimension.aspect,
            aspect_type=dimension.aspect_type,
            spread_type=default_spread_type,
            weight=1.0
        )]

        return GenerateRequestV2(
            cards=cards,
            dimensions=dimensions,
            description=v1_request.description,
            spread_type=default_spread_type
        )

    @staticmethod
    def validate_card_against_db(
        card_info: CardInfo,
        db_card: Card
    ) -> bool:
        """验证客户端卡牌信息与数据库的一致性"""
        return (
            card_info.name == db_card.name and
            card_info.arcana == db_card.arcana and
            card_info.number == db_card.number
        )

    @staticmethod
    async def convert_with_validation(
        v1_request: GenerateRequest,
        db: Session,
        spread_type: str = "three-card"
    ) -> RequestConversionResult:
        """带验证的V1到V2转换"""
        warnings = []

        try:
            v2_request = await SchemaConverter.convert_v1_to_v2_request(
                v1_request, db, spread_type
            )

            # 验证转换结果
            from .validators import ReadingValidator

            card_errors = ReadingValidator.validate_cards_consistency(v2_request.cards)
            if card_errors:
                warnings.extend([f"卡牌验证: {error}" for error in card_errors])

            dimension_errors = ReadingValidator.validate_dimensions_for_spread(
                v2_request.dimensions, v2_request.spread_type
            )
            if dimension_errors:
                warnings.extend([f"维度验证: {error}" for error in dimension_errors])

            return RequestConversionResult(
                v2_request=v2_request,
                conversion_warnings=warnings,
                conversion_success=True
            )

        except Exception as e:
            return RequestConversionResult(
                v2_request=None,
                conversion_warnings=[f"转换失败: {str(e)}"],
                conversion_success=False
            )