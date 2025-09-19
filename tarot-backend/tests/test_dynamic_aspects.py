#!/usr/bin/env python3
"""
测试动态aspect生成功能
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

async def test_dynamic_aspects():
    """测试动态aspect生成功能"""
    print("测试动态aspect生成功能")
    print("=" * 60)

    # 不同类型的测试用例，期望生成不同的aspect
    test_cases = [
        {
            "description": "为了更健康地处理我的债务状况，我最需要关注的核心环节和第一步行动是什么？",
            "expected_category": "财务",
            "expected_aspects": "应该包含债务相关的具体aspect，不是固定的'现状/机会/行动'"
        },
        {
            "description": "我正在考虑换工作，但担心新公司的发展前景，应该如何做决定？",
            "expected_category": "事业或决策",
            "expected_aspects": "应该包含换工作决策相关的具体aspect"
        },
        {
            "description": "我和同事之间总是有误解，想改善办公室人际关系",
            "expected_category": "人际",
            "expected_aspects": "应该包含人际关系改善相关的具体aspect"
        },
        {
            "description": "最近失眠严重，精神状态很差，影响了日常生活",
            "expected_category": "健康",
            "expected_aspects": "应该包含失眠和精神状态相关的具体aspect"
        },
        {
            "description": "准备考研复试，但很紧张害怕表现不好",
            "expected_category": "学业",
            "expected_aspects": "应该包含考研复试相关的具体aspect"
        }
    ]

    for i, test_case in enumerate(test_cases, 1):
        print(f"\n测试用例 {i}:")
        print(f"用户描述: {test_case['description']}")
        print(f"期望category: {test_case['expected_category']}")
        print(f"期望aspects: {test_case['expected_aspects']}")
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
            aspects = [dim['aspect'] for dim in result]

            unique_categories = set(categories)
            print(f"Category: {list(unique_categories)[0] if len(unique_categories) == 1 else categories}")
            print(f"Aspects: {aspects}")

            if len(unique_categories) == 1:
                print("✅ Category统一")
            else:
                print("❌ Category不统一")

            print("维度详情:")
            for j, dimension in enumerate(result, 1):
                print(f"  {j}. {dimension['name']}")
                print(f"     Category: {dimension['category']}")
                print(f"     Aspect: {dimension['aspect']}")
                print(f"     Description: {dimension['description']}")

        except Exception as e:
            print(f"✗ 测试失败: {e}")
            import traceback
            traceback.print_exc()

        print("-" * 60)

if __name__ == "__main__":
    asyncio.run(test_dynamic_aspects())