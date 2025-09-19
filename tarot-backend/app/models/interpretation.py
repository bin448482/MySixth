"""
Card Interpretation SQLAlchemy models.
"""
from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship

from ..database import Base


class CardInterpretation(Base):
    """牌意主表模型"""
    __tablename__ = "card_interpretation"

    id = Column(Integer, primary_key=True, index=True)
    card_id = Column(Integer, ForeignKey("card.id"), nullable=False, comment="对应的卡牌ID")
    direction = Column(String, nullable=False, comment="正位/逆位")
    summary = Column(String, nullable=False, comment="简要牌意")
    detail = Column(Text, nullable=True, comment="详细说明")

    # 关联关系
    card = relationship("Card", back_populates="interpretations")
    interpretation_dimensions = relationship("CardInterpretationDimension", back_populates="interpretation")

    def __repr__(self):
        return f"<CardInterpretation(id={self.id}, card_id={self.card_id}, direction='{self.direction}')>"


class CardInterpretationDimension(Base):
    """牌意维度关联表模型"""
    __tablename__ = "card_interpretation_dimension"

    id = Column(Integer, primary_key=True, index=True)
    interpretation_id = Column(Integer, ForeignKey("card_interpretation.id"), nullable=False, comment="关联到 card_interpretation.id")
    dimension_id = Column(Integer, ForeignKey("dimension.id"), nullable=False, comment="关联到 dimension.id")
    aspect = Column(String, nullable=True, comment="具体维度子项")
    aspect_type = Column(Integer, nullable=True, comment="子项的类型或分类")
    content = Column(Text, nullable=False, comment="该维度下的解读文字")

    # 关联关系
    interpretation = relationship("CardInterpretation", back_populates="interpretation_dimensions")
    dimension = relationship("Dimension", back_populates="interpretation_dimensions")

    def __repr__(self):
        return f"<CardInterpretationDimension(id={self.id}, interpretation_id={self.interpretation_id}, dimension_id={self.dimension_id})>"