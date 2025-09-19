"""
Dimension SQLAlchemy model.
"""
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from ..database import Base


class Dimension(Base):
    """解读维度定义表模型"""
    __tablename__ = "dimension"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, comment="维度名称")
    category = Column(String, nullable=False, comment="类别")
    description = Column(String, nullable=False, comment="维度详细描述")
    aspect = Column(String, nullable=True, comment="维度的具体子项")
    aspect_type = Column(Integer, nullable=True, comment="子项的类型或分类")

    # 关联关系
    interpretation_dimensions = relationship("CardInterpretationDimension", back_populates="dimension")

    def __repr__(self):
        return f"<Dimension(id={self.id}, name='{self.name}', category='{self.category}')>"