"""
Card SQLAlchemy model.
"""
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from ..database import Base


class Card(Base):
    """卡牌基础信息表模型"""
    __tablename__ = "card"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, comment="牌名称")
    arcana = Column(String, nullable=False, comment="大牌/小牌 (Major/Minor)")
    suit = Column(String, nullable=True, comment="花色（小牌适用）")
    number = Column(Integer, nullable=False, comment="牌序号")
    image_url = Column(String, nullable=False, comment="默认图像URL")
    style_id = Column(Integer, nullable=True, comment="默认使用的牌面风格")
    deck = Column(String, nullable=False, comment="所属塔罗牌套牌")

    # 关联关系
    interpretations = relationship("CardInterpretation", back_populates="card")

    def __repr__(self):
        return f"<Card(id={self.id}, name='{self.name}', arcana='{self.arcana}')>"
