"""
User History SQLAlchemy model.
"""
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Text
from datetime import datetime

from ..database import Base


class UserHistory(Base):
    """用户历史记录表模型"""
    __tablename__ = "user_history"

    id = Column(String, primary_key=True, comment="记录唯一标识（UUID）")
    user_id = Column(String, nullable=False, comment="用户ID（可匿名）")
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow, comment="记录时间")
    spread_id = Column(Integer, ForeignKey("spread.id"), nullable=False, comment="使用的牌阵ID")
    card_ids = Column(Text, nullable=False, comment="抽到的卡牌ID数组（JSON格式）")
    interpretation_mode = Column(String, nullable=False, default="default", comment="解读方式（default/ai）")
    result = Column(Text, nullable=False, comment="解读结果（结构化JSON）")

    def __repr__(self):
        return f"<UserHistory(id='{self.id}', user_id='{self.user_id}', timestamp={self.timestamp})>"