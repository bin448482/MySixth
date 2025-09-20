"""
Card interpretation SQLAlchemy model.
"""
from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship

from ..database import Base


class CardInterpretation(Base):
    """Saves basic upright/reversed interpretations for a card."""
    __tablename__ = "card_interpretation"

    id = Column(Integer, primary_key=True, index=True)
    card_id = Column(Integer, ForeignKey("card.id"), nullable=False, comment="对应的卡牌ID")
    direction = Column(String, nullable=False, comment="正位/逆位")
    summary = Column(String, nullable=False, comment="简要牌意")
    detail = Column(Text, nullable=True, comment="详细说明")

    # Relationships
    card = relationship("Card", back_populates="interpretations")

    def __repr__(self) -> str:
        return f"<CardInterpretation(id={self.id}, card_id={self.card_id}, direction='{self.direction}')>"
