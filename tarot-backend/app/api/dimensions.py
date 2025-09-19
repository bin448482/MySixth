"""
Dimensions API endpoints.
"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..models import Dimension
from ..schemas.reading import DimensionInfo

router = APIRouter(prefix="/dimensions", tags=["Dimensions"])


@router.get("/", response_model=list[DimensionInfo])
async def get_dimensions(
    category: Optional[str] = Query(None, description="筛选类别"),
    aspect_type: Optional[int] = Query(None, description="筛选子项类型"),
    limit: int = Query(50, ge=1, le=100, description="返回数量限制"),
    offset: int = Query(0, ge=0, description="偏移量"),
    db: Session = Depends(get_db)
):
    """
    获取解读维度列表，支持筛选和分页。

    Args:
        category: 类别筛选
        aspect_type: 子项类型筛选
        limit: 返回数量限制
        offset: 偏移量
        db: 数据库会话

    Returns:
        List[DimensionInfo]: 维度列表
    """
    try:
        # 构建查询
        query = db.query(Dimension)

        # 应用筛选
        if category:
            query = query.filter(Dimension.category == category)
        if aspect_type is not None:
            query = query.filter(Dimension.aspect_type == aspect_type)

        # 应用分页
        dimensions = query.offset(offset).limit(limit).all()

        # 转换为响应格式
        dimension_infos = []
        for dim in dimensions:
            dimension_info = DimensionInfo(
                id=dim.id,
                name=dim.name,
                category=dim.category,
                description=dim.description,
                aspect=dim.aspect,
                aspect_type=dim.aspect_type
            )
            dimension_infos.append(dimension_info)

        return dimension_infos

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch dimensions: {str(e)}"
        )


@router.get("/{dimension_id}", response_model=DimensionInfo)
async def get_dimension_detail(
    dimension_id: int,
    db: Session = Depends(get_db)
):
    """
    获取单个维度的详细信息。

    Args:
        dimension_id: 维度ID
        db: 数据库会话

    Returns:
        DimensionInfo: 维度详情
    """
    try:
        dimension = db.query(Dimension).filter(Dimension.id == dimension_id).first()
        if not dimension:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dimension with id {dimension_id} not found"
            )

        return DimensionInfo(
            id=dimension.id,
            name=dimension.name,
            category=dimension.category,
            description=dimension.description,
            aspect=dimension.aspect,
            aspect_type=dimension.aspect_type
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch dimension detail: {str(e)}"
        )


@router.get("/categories/list")
async def get_dimension_categories(db: Session = Depends(get_db)):
    """
    获取所有维度类别。

    Args:
        db: 数据库会话

    Returns:
        维度类别列表
    """
    try:
        from sqlalchemy import distinct

        categories = db.query(distinct(Dimension.category)).all()
        category_list = [cat[0] for cat in categories if cat[0]]

        return {
            "categories": category_list,
            "total": len(category_list)
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch dimension categories: {str(e)}"
        )