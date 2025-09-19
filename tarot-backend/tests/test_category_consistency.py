#!/usr/bin/env python3
"""
测试category统一问题的修复
"""
import asyncio
import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.reading_service import ReadingService

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

async def test_category_consistency():
    """测试category一致性问题的修复"""
    print("测试category统一性修复")
    print("=" * 50)

    # 测试用例
    test_cases = [
        {
            "description": "为了更健康地处理我的债务状况，我最需要关注的核心环节和第一步行动是什么？",
            "expected_category_type": "应该统一为一个category"
        },
        {
            "description": "在当前的经济环境下，我财务上最需要关注的核心课题和潜在机会是什么？",
            "expected_category_type": "应该统一为一个category"
        },
        {
            "description": "我和男朋友最近关系紧张，经常吵架，不知道我们的关系走向如何",
            "expected_category_type": "应该统一为一个category"
        }
    ]

    for i, test_case in enumerate(test_cases, 1):
        print(f"\n测试用例 {i}:")
        print(f"用户描述: {test_case['description']}")
        print(f"期望: {test_case['expected_category_type']}")
        print()

        try:
            # 初始化服务
            reading_service = ReadingService()
            mock_db = MockDatabase()

            # 调用分析
            print("正在分析...")
            result = await reading_service.analyze_user_description(
                test_case['description'], "three-card", mock_db
            )

            print(f"✓ 分析完成，返回 {len(result)} 个维度")

            # 检查category一致性
            categories = [dim['category'] for dim in result]
            unique_categories = set(categories)

            print(f"Categories: {categories}")

            if len(unique_categories) == 1:
                print(f"✅ Category统一: {list(unique_categories)[0]}")
            else:
                print(f"❌ Category不统一: {list(unique_categories)}")

            print("维度详情:")
            for j, dimension in enumerate(result, 1):
                print(f"  {j}. {dimension['name']} (category: {dimension['category']}, aspect: {dimension['aspect']})")

        except Exception as e:
            print(f"✗ 测试失败: {e}")
            import traceback
            traceback.print_exc()

        print("-" * 50)

if __name__ == "__main__":
    asyncio.run(test_category_consistency())