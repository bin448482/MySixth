#!/usr/bin/env python3
"""
测试analyze_user_description使用真实数据库保存维度
"""
import asyncio
import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.reading_service import ReadingService
from app.database import get_db, create_tables

async def test_with_real_database():
    """测试使用真实数据库的analyze_user_description功能"""
    print("测试analyze_user_description真实数据库保存功能")
    print("=" * 60)

    # 确保数据库表存在
    create_tables()

    # 测试用例
    description = "我想了解我当前的感情状态和未来发展方向"
    spread_type = "three-card"

    print(f"用户描述: {description}")
    print(f"牌阵类型: {spread_type}")
    print()

    try:
        # 获取真实数据库会话
        db_gen = get_db()
        db = next(db_gen)

        # 检查初始维度数量
        from app.models.dimension import Dimension
        initial_count = db.query(Dimension).count()
        print(f"初始维度数量: {initial_count}")

        # 初始化服务并调用分析
        reading_service = ReadingService()
        print("正在分析并保存维度...")

        result = await reading_service.analyze_user_description(
            description, spread_type, db
        )

        # 检查结果
        print(f"返回维度数量: {len(result)}")

        # 检查数据库中的维度数量变化
        final_count = db.query(Dimension).count()
        print(f"最终维度数量: {final_count}")
        print(f"新增维度数量: {final_count - initial_count}")
        print()

        # 显示新创建的维度
        if final_count > initial_count:
            print("新创建的维度:")
            new_dimensions = db.query(Dimension).order_by(Dimension.id.desc()).limit(final_count - initial_count).all()
            for dim in new_dimensions:
                print(f"  ID: {dim.id}")
                print(f"  Name: {dim.name}")
                print(f"  Category: {dim.category}")
                print(f"  Aspect: {dim.aspect}")
                print(f"  Aspect_type: {dim.aspect_type}")
                print(f"  Description: {dim.description}")
                print()

        # 显示返回的维度信息
        print("返回的维度信息:")
        for i, dimension in enumerate(result, 1):
            print(f"  {i}. {dimension['name']}")
            print(f"     ID: {dimension.get('id', 'N/A')}")
            print(f"     Category: {dimension['category']}")
            print(f"     Aspect: {dimension['aspect']}")
            print(f"     Aspect_type: {dimension['aspect_type']}")
            print()

        print("测试完成！")
        if final_count > initial_count:
            print("成功：新维度已保存到数据库")
        else:
            print("注意：没有新维度保存到数据库（可能使用了已存在的维度）")

    except Exception as e:
        print(f"测试失败: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # 关闭数据库连接
        db.close()

if __name__ == "__main__":
    asyncio.run(test_with_real_database())