"""
Spread SQLAlchemy model.
"""
from sqlalchemy import Column, Integer, String, Text

from ..database import Base


class Spread(Base):
    """牌阵定义表模型"""
    __tablename__ = "spread"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, comment="牌阵名称")
    description = Column(Text, nullable=False, comment="牌阵描述")
    card_count = Column(Integer, nullable=False, comment="牌阵所需卡牌数量")

    def __repr__(self):
        return f"<Spread(id={self.id}, name='{self.name}', card_count={self.card_count})>"