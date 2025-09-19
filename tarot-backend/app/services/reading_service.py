"""
Reading service for tarot card interpretation business logic.
"""
from typing import Dict, List, Optional, Any, Set
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Card, Dimension, CardInterpretation, CardInterpretationDimension
from .llm_service import get_llm_service


class ReadingService:
    """解读服务 - 处理塔罗牌解读的业务逻辑"""

    def __init__(self):
        self.llm_service = get_llm_service()

    @staticmethod
    def _serialize_dimension(dimension: Dimension) -> Dict[str, Any]:
        """Convert a dimension ORM object into a response dictionary."""
        return {
            "id": dimension.id,
            "name": dimension.name,
            "category": dimension.category,
            "description": dimension.description,
            "aspect": dimension.aspect,
            "aspect_type": dimension.aspect_type
        }

    async def analyze_user_description(self, description: str, spread_type: str, db: Session) -> List[Dict[str, Any]]:
        """
        第一步：分析用户描述，返回推荐的维度信息。
        Args:
            description: 用户描述（200字以内）
            spread_type: 牌阵类型（three-card 或 celtic-cross）
            db: 数据库会话
        Returns:
            推荐的维度信息列表
        """
        limit = 3 if spread_type == "three-card" else 10

        try:
            # 调用 LLM 分析，获取推荐的维度名称
            recommended_names = await self.llm_service.analyze_user_description(description, spread_type)

            # if spread_type == "three-card":
            #     return await self._process_three_card_dimensions(recommended_names, db, limit)
            # elif spread_type == "celtic-cross":
            #     return self._process_celtic_cross_dimensions(recommended_names, db, limit)
            # else:
            #     # 默认处理
            #     return await self._process_three_card_dimensions(recommended_names, db, limit)
            return await self._process_three_card_dimensions(recommended_names, db, limit)

        except Exception as e:
            print(f"分析用户描述失败: {e}")
            # 返回默认维度
            if spread_type == "three-card":
                # 为三牌阵返回默认的时间维度
                default_names = ["整体-过去", "整体-现在", "整体-将来"]
                return await self._process_three_card_dimensions(default_names, db, limit)
            else:
                return self._get_default_celtic_cross_dimensions(db)

    async def _process_three_card_dimensions(self, recommended_names: List[str], db: Session, limit: int) -> List[Dict[str, Any]]:
        """
        处理三牌阵维度：支持动态创建和 aspect_type 分配
        """
        dimensions: List[Dict[str, Any]] = []

        for i, name in enumerate(recommended_names[:limit]):
            if not name:
                continue

            # 首先尝试从现有维度中查找
            dimension = self._find_existing_dimension(name, db)

            if dimension:
                # 确保 aspect_type 正确设置为递进顺序
                dimension_dict = self._serialize_dimension(dimension)
                dimension_dict["aspect_type"] = i + 1  # 1, 2, 3
                dimensions.append(dimension_dict)
            else:
                # 动态创建新维度
                new_dimension = self._create_dynamic_dimension(name, i + 1, db)
                if new_dimension:
                    dimensions.append(self._serialize_dimension(new_dimension))

        # 确保返回3个维度
        while len(dimensions) < limit:
            fallback_name = f"整体-维度{len(dimensions) + 1}"
            fallback_dimension = self._create_dynamic_dimension(fallback_name, len(dimensions) + 1, db)
            if fallback_dimension:
                dimensions.append(self._serialize_dimension(fallback_dimension))

        return dimensions[:limit]

    def _process_celtic_cross_dimensions(self, recommended_names: List[str], db: Session, limit: int) -> List[Dict[str, Any]]:
        """
        处理凯尔特十字维度：使用固定的十个维度
        """
        celtic_names = [
            "凯尔特十字-现状", "凯尔特十字-挑战", "凯尔特十字-潜意识", "凯尔特十字-显意识", "凯尔特十字-过去",
            "凯尔特十字-未来", "凯尔特十字-自我态度", "凯尔特十字-外部影响", "凯尔特十字-希望恐惧", "凯尔特十字-结果"
        ]

        dimensions: List[Dict[str, Any]] = []
        for i, name in enumerate(celtic_names[:limit]):
            dimension = self._find_existing_dimension(name, db)
            if dimension:
                dimension_dict = self._serialize_dimension(dimension)
                dimension_dict["aspect_type"] = i + 1  # 确保正确的 aspect_type
                dimensions.append(dimension_dict)
            else:
                # 如果维度不存在，创建它
                new_dimension = self._create_dynamic_dimension(name, i + 1, db)
                if new_dimension:
                    dimensions.append(self._serialize_dimension(new_dimension))

        return dimensions

    def _find_existing_dimension(self, name: str, db: Session) -> Optional[Dimension]:
        """查找现有维度"""
        return db.query(Dimension).filter(Dimension.name == name).first()

    def _create_dynamic_dimension(self, name: str, aspect_type: int, db: Session) -> Optional[Dimension]:
        """
        动态创建维度
        """
        try:
            # 解析维度名称：格式为 "类别-aspect" 或直接名称
            if '-' in name:
                category, aspect = name.split('-', 1)
            else:
                category = "整体"
                aspect = name

            # 创建新维度
            dimension = Dimension(
                name=name,
                category=category,
                description=f"根据用户描述动态生成的解读维度：{aspect}",
                aspect=aspect,
                aspect_type=aspect_type
            )

            db.add(dimension)
            db.commit()
            db.refresh(dimension)
            return dimension

        except Exception as e:
            db.rollback()
            print(f"创建动态维度失败 {name}: {e}")
            return None

    def _get_default_celtic_cross_dimensions(self, db: Session) -> List[Dict[str, Any]]:
        """获取默认凯尔特十字维度"""
        celtic_names = [
            "凯尔特十字-现状", "凯尔特十字-挑战", "凯尔特十字-潜意识", "凯尔特十字-显意识", "凯尔特十字-过去",
            "凯尔特十字-未来", "凯尔特十字-自我态度", "凯尔特十字-外部影响", "凯尔特十字-希望恐惧", "凯尔特十字-结果"
        ]
        return self._process_celtic_cross_dimensions(celtic_names, db, 10)

    async def generate_interpretation(
        self,
        card_ids: List[int],
        dimension_id: int,
        user_description: str,
        db: Session
    ) -> Dict[str, Any]:
        """
        第二步：基于选定的维度和卡牌生成具体解读。
        Args:
            card_ids: 抽到的卡牌ID列表
            dimension_id: 用户选择的维度ID
            user_description: 用户原始描述
            db: 数据库会话
        Returns:
            解读结果字典
        """
        try:
            # 查询维度信息
            dimension = db.query(Dimension).filter(Dimension.id == dimension_id).first()
            if not dimension:
                raise ValueError(f"维度ID {dimension_id} 不存在")

            # 查询卡牌信息
            cards = db.query(Card).filter(Card.id.in_(card_ids)).all()
            if len(cards) != len(card_ids):
                raise ValueError("部分卡牌ID不存在")

            # 为每张卡牌生成解读
            card_interpretations = []
            for i, card in enumerate(cards):
                # 随机决定正位还是逆位（简化处理，实际应用中可能需要更复杂的逻辑）
                direction = "正位" if i % 2 == 0 else "逆位"

                # 查询基础解读
                basic_interpretation = db.query(CardInterpretation).filter(
                    CardInterpretation.card_id == card.id,
                    CardInterpretation.direction == direction
                ).first()

                # 准备卡牌信息用于LLM
                card_info = {
                    "name": card.name,
                    "direction": direction,
                    "summary": basic_interpretation.summary if basic_interpretation else "",
                    "detail": basic_interpretation.detail if basic_interpretation else ""
                }

                # 准备维度信息用于LLM
                dimension_info = {
                    "name": dimension.name,
                    "category": dimension.category,
                    "description": dimension.description,
                    "aspect": dimension.aspect or "",
                    "aspect_type": dimension.aspect_type or ""
                }

                # 使用LLM生成解读
                ai_interpretation = await self.llm_service.generate_single_interpretation(
                    card_info, dimension_info
                )

                card_interpretations.append({
                    "card_id": card.id,
                    "card_name": card.name,
                    "direction": direction,
                    "position": i + 1,  # 卡牌在牌阵中的位置
                    "basic_summary": basic_interpretation.summary if basic_interpretation else "",
                    "ai_interpretation": ai_interpretation["content"] if ai_interpretation else "",
                    "dimension_aspect": dimension_info
                })

            # 生成整体总结
            overall_summary = await self._generate_overall_summary(
                card_interpretations, dimension_info, user_description
            )

            return {
                "dimension": {
                    "id": dimension.id,
                    "name": dimension.name,
                    "category": dimension.category,
                    "description": dimension.description
                },
                "user_description": user_description,
                "card_interpretations": card_interpretations,
                "overall_summary": overall_summary,
                "generated_at": "now"  # 实际使用时应该是时间戳
            }

        except Exception as e:
            print(f"生成解读失败: {e}")
            raise

    async def _generate_overall_summary(
        self,
        card_interpretations: List[Dict[str, Any]],
        dimension_info: Dict[str, Any],
        user_description: str
    ) -> str:
        """生成整体总结"""
        try:
            # 构造整体总结的提示词
            cards_summary = "\n".join([
                f"第{interp['position']}张牌：{interp['card_name']} {interp['direction']}\n解读：{interp['ai_interpretation']}"
                for interp in card_interpretations
            ])

            summary_prompt = f"""
基于以下塔罗牌解读结果，请生成一个简洁的整体总结（100-150字）。
用户问题：{user_description}
解读维度：{dimension_info['name']} - {dimension_info['description']}

各卡牌解读：
{cards_summary}

请综合所有卡牌的信息，给出一个连贯的整体指导建议。要求：
1. 结合用户的具体问题
2. 整合所有卡牌的信息
3. 给出明确的建议或指引
4. 语言简洁明了，易于理解

请直接输出总结内容，不要包含任何格式化标记。"""

            result = await self.llm_service.call_ai_api(summary_prompt)
            return result if result else "综合来看，建议您保持开放的心态，相信自己的直觉，并积极面对当前的挑战。"

        except Exception as e:
            print(f"生成整体总结失败: {e}")
            return "综合来看，建议您保持开放的心态，相信自己的直觉，并积极面对当前的挑战。"

    def get_basic_interpretation(
        self,
        card_id: int,
        direction: str,
        db: Session
    ) -> Optional[Dict[str, Any]]:
        """
        获取卡牌的基础解读（不使用LLM）。
        Args:
            card_id: 卡牌ID
            direction: 牌位方向（正位/逆位）
            db: 数据库会话
        Returns:
            基础解读信息
        """
        try:
            card = db.query(Card).filter(Card.id == card_id).first()
            if not card:
                return None

            interpretation = db.query(CardInterpretation).filter(
                CardInterpretation.card_id == card_id,
                CardInterpretation.direction == direction
            ).first()

            if not interpretation:
                return None

            return {
                "card_id": card.id,
                "card_name": card.name,
                "arcana": card.arcana,
                "direction": direction,
                "summary": interpretation.summary,
                "detail": interpretation.detail
            }

        except Exception as e:
            print(f"获取基础解读失败: {e}")
            return None


# 全局读书服务实例
_reading_service = None


def get_reading_service() -> ReadingService:
    """获取解读服务实例（单例模式）"""
    global _reading_service
    if _reading_service is None:
        _reading_service = ReadingService()
    return _reading_service
