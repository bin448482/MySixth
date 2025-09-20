"""
Reading service for tarot card interpretation business logic.
"""
from typing import Dict, List, Optional, Any, Set
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Card, Dimension, CardInterpretation
from .llm_service import get_llm_service
from ..schemas.reading import CardInfo, DimensionInfo


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
            # 调用 LLM 分析，获取推荐的维度名称和统一描述
            recommended_names, unified_description = await self.llm_service.analyze_user_description(description, spread_type)

            # if spread_type == "three-card":
            #     return await self._process_three_card_dimensions(recommended_names, db, limit)
            # elif spread_type == "celtic-cross":
            #     return self._process_celtic_cross_dimensions(recommended_names, db, limit)
            # else:
            #     # 默认处理
            #     return await self._process_three_card_dimensions(recommended_names, db, limit)
            return await self._process_three_card_dimensions(recommended_names, unified_description, db, limit)

        except Exception as e:
            print(f"分析用户描述失败: {e}")
            # 返回默认维度
            if spread_type == "three-card":
                # 为三牌阵返回默认的时间维度
                default_names = ["整体-过去", "整体-现在", "整体-将来"]
                default_description = "三牌阵综合分析，探索问题的时间发展脉络"
                return await self._process_three_card_dimensions(default_names, default_description, db, limit)
            else:
                return self._get_default_celtic_cross_dimensions(db)

    async def _process_three_card_dimensions(self, recommended_names: List[str], unified_description: str, db: Session, limit: int) -> List[Dict[str, Any]]:
        """
        处理三牌阵维度：支持动态创建和 aspect_type 分配
        """
        dimensions: List[Dict[str, Any]] = []

        # 直接使用传入的统一description（来自LLM的单次调用）

        for i, name in enumerate(recommended_names[:limit]):
            if not name:
                continue

            # 首先尝试从现有维度中查找
            dimension = self._find_existing_dimension(name, db)

            if dimension:
                # 确保 aspect_type 正确设置为递进顺序
                dimension_dict = self._serialize_dimension(dimension)
                dimension_dict["aspect_type"] = i + 1  # 1, 2, 3
                # 更新description为统一的概要
                dimension_dict["description"] = unified_description
                dimensions.append(dimension_dict)
            else:
                # 动态创建新维度
                new_dimension = self._create_dynamic_dimension(name, i + 1, unified_description, db)
                if new_dimension:
                    dimensions.append(self._serialize_dimension(new_dimension))

        # 确保返回3个维度
        while len(dimensions) < limit:
            fallback_name = f"整体-维度{len(dimensions) + 1}"
            fallback_dimension = self._create_dynamic_dimension(fallback_name, len(dimensions) + 1, unified_description, db)
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

    async def _generate_unified_description(self, recommended_names: List[str], user_description: str) -> str:
        """
        为三牌阵生成统一的description，基于用户问题的概要分析
        """
        try:
            # 基于用户描述和推荐的维度名称生成统一的问题概要
            names_text = "、".join(recommended_names)

            summary_prompt = f"""请为以下塔罗三牌阵分析生成一个统一的问题概要描述（30-50字）。

用户问题：{user_description}
分析维度：{names_text}

要求：
1. 基于用户的具体问题，概括核心关注点
2. 体现三牌阵的因果发展逻辑
3. 语言简洁专业，适合塔罗解读
4. 不要重复用户的原始问题，而是提炼出问题的本质

请直接输出概要描述，不要包含任何格式化标记。"""

            result = await self.llm_service.call_ai_api(summary_prompt)
            if result and result.strip():
                return result.strip()
            else:
                # 默认描述：基于用户问题生成
                category = recommended_names[0].split('-')[0] if recommended_names and '-' in recommended_names[0] else "整体"
                return f"关于{category}方面的发展分析，探索当前状况与未来走向"

        except Exception as e:
            print(f"生成统一description失败: {e}")
            # 返回基于第一个维度的默认描述
            if recommended_names:
                category = recommended_names[0].split('-')[0] if '-' in recommended_names[0] else "整体"
                return f"关于{category}方面的发展分析，探索当前状况与未来走向"
            return "三牌阵综合分析，探索问题的关键发展脉络"

    def _create_dynamic_dimension(self, name: str, aspect_type: int, description: str, db: Session) -> Optional[Dimension]:
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

            # 创建新维度 - 使用传入的统一description
            dimension = Dimension(
                name=name,
                category=category,
                description=description,  # 使用统一的description
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
        cards: List[Dict[str, Any]],
        dimensions: List[Dict[str, Any]],
        user_description: str,
        spread_type: str,
        db: Session
    ) -> Dict[str, Any]:
        """
        生成多维度解读（重构版本）。
        Args:
            cards: 卡牌信息列表（CardInfo格式）
            dimensions: 维度信息列表（DimensionInfo格式）
            user_description: 用户原始描述
            spread_type: 牌阵类型
            db: 数据库会话
        Returns:
            多维度解读结果字典
        """
        try:
            # 1. 解析卡牌信息
            resolved_cards = []
            for card_info in cards:
                db_card = await self._resolve_card_info(card_info, db)
                resolved_cards.append((card_info, db_card))

            # 2. 为每个维度生成解读
            dimension_summaries = {}
            all_card_interpretations = []

            for dimension in dimensions:
                # 为当前维度生成卡牌解读
                card_interpretations = []
                for card_info, db_card in resolved_cards:
                    # 使用现有的单张卡牌解读逻辑
                    interpretation = await self._generate_single_card_interpretation(
                        card_info, db_card, dimension, user_description
                    )
                    card_interpretations.append(interpretation)

                # 为当前维度生成总结
                dimension_summary = await self._generate_dimension_summary(
                    card_interpretations, dimension, user_description
                )
                dimension_summaries[dimension["name"]] = dimension_summary

                # 收集所有卡牌解读
                all_card_interpretations.extend(card_interpretations)

            # 3. 生成跨维度综合分析
            overall_summary = await self._generate_cross_dimension_summary(
                dimension_summaries, user_description
            )

            # 4. 提取关键洞察
            insights = await self._extract_key_insights(
                dimension_summaries, overall_summary
            )

            return {
                "dimensions": dimensions,
                "user_description": user_description,
                "spread_type": spread_type,
                "card_interpretations": all_card_interpretations,
                "dimension_summaries": dimension_summaries,
                "overall_summary": overall_summary,
                "insights": insights,
                "generated_at": "now"
            }

        except Exception as e:
            print(f"生成多维度解读失败: {e}")
            raise

    async def _resolve_card_info(self, card_info: Dict[str, Any], db: Session) -> Card:
        """解析客户端传递的卡牌信息，匹配数据库中的卡牌"""
        # 优先使用名称精确匹配
        card = db.query(Card).filter(
            Card.name == card_info["name"]
        ).first()

        if not card:
            raise ValueError(f"无法找到卡牌: {card_info['name']}")

        return card

    async def _generate_single_card_interpretation(
        self,
        card_info: Dict[str, Any],
        db_card: Card,
        dimension: Dict[str, Any],
        user_description: str
    ) -> Dict[str, Any]:
        """为单张卡牌在特定维度下生成解读"""
        try:
            # 查询基础解读
            basic_interpretation = db.query(CardInterpretation).filter(
                CardInterpretation.card_id == db_card.id,
                CardInterpretation.direction == card_info["direction"]
            ).first()

            # 准备卡牌信息用于LLM
            card_data = {
                "name": db_card.name,
                "direction": card_info["direction"],
                "summary": basic_interpretation.summary if basic_interpretation else "",
                "detail": basic_interpretation.detail if basic_interpretation else ""
            }

            # 使用LLM生成解读
            ai_interpretation = await self.llm_service.generate_single_interpretation(
                card_data, dimension
            )

            return {
                "card_id": db_card.id,
                "card_name": db_card.name,
                "direction": card_info["direction"],
                "position": card_info["position"],
                "basic_summary": basic_interpretation.summary if basic_interpretation else "",
                "ai_interpretation": ai_interpretation["content"] if ai_interpretation else "",
                "dimension_aspect": dimension
            }

        except Exception as e:
            print(f"生成单张卡牌解读失败: {e}")
            # 返回默认解读
            return {
                "card_id": db_card.id,
                "card_name": db_card.name,
                "direction": card_info["direction"],
                "position": card_info["position"],
                "basic_summary": "基础的卡牌意义",
                "ai_interpretation": "请相信你的直觉，这张牌对你有特别的意义。",
                "dimension_aspect": dimension
            }

    async def _generate_dimension_summary(
        self,
        card_interpretations: List[Dict[str, Any]],
        dimension: Dict[str, Any],
        user_description: str
    ) -> str:
        """为单个维度生成总结"""
        try:
            # 构建当前维度的卡牌解读摘要
            cards_summary = "\n".join([
                f"第{interp['position']}张牌：{interp['card_name']} {interp['direction']}\n解读：{interp['ai_interpretation']}"
                for interp in card_interpretations
            ])

            summary_prompt = f"""
基于以下在特定维度下的卡牌解读，请生成一个简洁的维度总结（100-120字）。

用户问题：{user_description}
解读维度：{dimension['name']} - {dimension.get('description', '')}

各卡牌解读：
{cards_summary}

请针对该维度的特定关注点，综合所有卡牌信息，给出连贯的分析和建议。
要求：
1. 突出该维度的核心信息
2. 整合所有卡牌的意义
3. 给出明确的指导意见
4. 语言简洁明了，易于理解

请直接输出总结内容，不要包含任何格式化标记。"""

            result = await self.llm_service.call_ai_api(summary_prompt)
            return result if result else f"在{dimension['name']}方面，建议您保持开放的心态，相信自己的直觉。"

        except Exception as e:
            print(f"生成维度总结失败: {e}")
            return f"在{dimension['name']}方面，建议您保持开放的心态，相信自己的直觉。"

    async def _generate_cross_dimension_summary(
        self,
        dimension_summaries: Dict[str, str],
        user_description: str
    ) -> str:
        """生成维度间的综合分析"""
        # 构建跨维度分析提示词
        dimensions_summary = "\n".join([
            f"【{dim_name}】: {summary}"
            for dim_name, summary in dimension_summaries.items()
        ])

        cross_analysis_prompt = f"""
基于以下多维度塔罗解读结果，请生成一个综合分析（150-200字）：

用户问题：{user_description}
各维度解读：{dimensions_summary}

请综合分析各维度信息的一致性、互补性和整体发展趋势，给出具体的行动指导。
"""

        try:
            result = await self.llm_service.call_ai_api(cross_analysis_prompt)
            return result if result else "综合来看，建议您保持开放的心态，相信自己的直觉。"
        except Exception as e:
            print(f"生成跨维度分析失败: {e}")
            return "综合来看，建议您保持开放的心态，相信自己的直觉。"

    async def _extract_key_insights(
        self,
        dimension_summaries: Dict[str, str],
        overall_summary: str
    ) -> List[str]:
        """提取关键洞察点"""
        try:
            insights_prompt = f"""
基于以下的多维度塔罗解读结果，请提取3-5个关键洞察点。

各维度分析：
{"; ".join([f"{name}: {summary}" for name, summary in dimension_summaries.items()])}

综合分析：
{overall_summary}

请返回3-5个简洁的洞察点（每个15-25字），每个洞察占一行，不要编号或格式化。
"""

            result = await self.llm_service.call_ai_api(insights_prompt)
            if result:
                # 将结果按行分割为列表
                insights = [line.strip() for line in result.split("\n") if line.strip()]
                return insights[:5]  # 最多返回5个
            else:
                return ["相信自己的直觉", "保持开放的心态", "积极面对挑战"]

        except Exception as e:
            print(f"提取关键洞察失败: {e}")
            return ["相信自己的直觉", "保持开放的心态", "积极面对挑战"]

    async def _generate_overall_summary(
        self,
        card_interpretations: List[Dict[str, Any]],
        dimension_info: Dict[str, Any],
        user_description: str
    ) -> str:
        """生成整体总结（兼容旧的API）"""
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
