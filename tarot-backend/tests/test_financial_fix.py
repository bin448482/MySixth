#!/usr/bin/env python3
"""
测试修复后的API - 财务问题
"""
import asyncio
import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.reading_service import ReadingService
from app.database import get_db

# 模拟数据库环境
class MockDatabase:
    def __init__(self):
        self.dimensions = {}
        self.next_id = 1

    def query(self, model):
        return MockQuery(self, model)

    def add(self, dimension):
        dimension.id = self.next_id
        self.dimensions[self.next_id] = dimension
        self.next_id += 1

    def commit(self):
        pass

    def refresh(self, dimension):
        pass

    def rollback(self):
        pass

class MockQuery:
    def __init__(self, db, model):
        self.db = db
        self.model = model

    def filter(self, condition):
        return self

    def first(self):
        return None

async def test_financial_question():
    """测试财务问题的API修复"""
    print("测试修复后的财务问题API")
    print("=" * 50)

    # 测试数据
    description = "在当前的经济环境下，我财务上最需要关注的核心课题和潜在机会是什么？"
    spread_type = "three-card"

    print(f"用户描述: {description}")
    print(f"牌阵类型: {spread_type}")
    print()

    try:
        # 初始化服务
        reading_service = ReadingService()
        mock_db = MockDatabase()

        # 调用分析
        print("正在分析...")
        result = await reading_service.analyze_user_description(
            description, spread_type, mock_db
        )

        print(f"✓ 分析完成，返回 {len(result)} 个维度")
        print()
        print("维度详情:")
        for i, dimension in enumerate(result, 1):
            print(f"{i}. {dimension['name']}")
            print(f"   ID: {dimension['id']}")
            print(f"   类别: {dimension['category']}")
            print(f"   描述: {dimension['description']}")
            print(f"   方面: {dimension['aspect']}")
            print(f"   类型: {dimension['aspect_type']}")
            print()

        # 检查description是否统一
        descriptions = [dim['description'] for dim in result]
        if len(set(descriptions)) == 1:
            print("✓ 所有维度的description已统一")
            print(f"统一的description: {descriptions[0]}")
        else:
            print("✗ 维度description仍不统一")
            for i, desc in enumerate(descriptions, 1):
                print(f"维度{i}: {desc}")

    except Exception as e:
        print(f"✗ 测试失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_financial_question())