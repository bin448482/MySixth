"""
Reading service for tarot card interpretation business logic.
"""
import json
import re
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

            # 2. 一次性生成所有维度和卡牌的完整解读
            all_interpretation_result = await self._generate_complete_interpretation(
                resolved_cards, dimensions, user_description, db
            )

            return all_interpretation_result

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

    async def _generate_complete_interpretation(
        self,
        resolved_cards: List[tuple],
        dimensions: List[Dict[str, Any]],
        user_description: str,
        db: Session
    ) -> Dict[str, Any]:
        """一次性生成所有维度和卡牌的完整解读"""
        try:
            # 构建完整的解读请求
            cards_info = []
            for card_info, db_card in resolved_cards:
                # 查询基础解读
                basic_interpretation = db.query(CardInterpretation).filter(
                    CardInterpretation.card_id == db_card.id,
                    CardInterpretation.direction == card_info["direction"]
                ).first()

                card_data = {
                    "name": db_card.name,
                    "direction": card_info["direction"],
                    "position": card_info["position"],
                    "summary": basic_interpretation.summary if basic_interpretation else "",
                    "detail": basic_interpretation.detail if basic_interpretation else ""
                }
                cards_info.append(card_data)

            # 构建一次性解读提示词
            complete_prompt = self._build_complete_interpretation_prompt(
                cards_info, dimensions, user_description
            )

            # 调用LLM一次性生成所有解读
            result = await self.llm_service.call_ai_api(complete_prompt)

            if not result:
                raise ValueError("LLM调用失败，无法生成解读内容")

            # 解析LLM返回的完整结果
            return self._parse_complete_interpretation_result(
                result, cards_info, dimensions, user_description, db
            )

        except Exception as e:
            print(f"生成完整解读失败: {e}")
            raise

    def _build_complete_interpretation_prompt(
        self,
        cards_info: List[Dict[str, Any]],
        dimensions: List[Dict[str, Any]],
        user_description: str
    ) -> str:
        """构建一次性完整解读的提示词"""

        # 卡牌信息部分
        cards_section = "\n".join([
            f"位置{card['position']}: {card['name']}({card['direction']}) - {card['summary']}"
            for card in cards_info
        ])

        # 维度信息部分 - 按 aspect_type 排序
        sorted_dimensions = sorted(dimensions, key=lambda x: x.get('aspect_type', 0))
        dimensions_section = "\n".join([
            f"维度{dim.get('aspect_type', i+1)}: {dim['name']} - {dim['description']}"
            for i, dim in enumerate(sorted_dimensions)
        ])

        # 位置-维度对应关系
        position_mapping = "\n".join([
            f"位置{i+1}的卡牌对应维度{dim.get('aspect_type', i+1)}({dim['name']})"
            for i, dim in enumerate(sorted_dimensions)
        ])

        prompt = f"""你是一位专业的塔罗牌解读师。请为以下塔罗牌抽卡结果生成完整的解读。

## 用户问题
{user_description}

## 抽到的卡牌
{cards_section}

## 解读维度
{dimensions_section}

## 位置-维度对应关系
{position_mapping}

## 要求
请按照以下JSON格式返回完整的解读结果：

```json
{{
    "card_interpretations": [
        {{
            "card_id": 1,
            "card_name": "卡牌名称(正位/逆位)",
            "direction": "正位/逆位",
            "position": 1,
            "basic_summary": "基础牌意",
            "ai_interpretation": "在对应维度下的详细解读(150-300字)",
            "dimension_aspect": {{
                "dimension_name": "对应维度名称",
                "interpretation": "该卡牌在此维度下的具体含义和指导(150-300字)"
            }}
        }}
    ],
    "overall_summary": "跨维度的整体分析和建议(200-300字)",
    "insights": ["关键洞察1", "关键洞察2", "关键洞察3"]
}}
```

注意：
1. 每张卡牌只对应一个维度：位置1对应维度1，位置2对应维度2，位置3对应维度3
2. ai_interpretation 要针对该卡牌在对应维度下的含义进行详细解读(150-300字)
3. dimension_aspect 中的 interpretation 要具体说明该卡牌如何体现该维度的含义
4. 整体分析要体现三个维度的关联性和发展脉络
5. 洞察要具体可行，避免过于抽象
"""
        return prompt

    def _parse_complete_interpretation_result(
        self,
        llm_result: str,
        cards_info: List[Dict[str, Any]],
        dimensions: List[Dict[str, Any]],
        user_description: str,
        db: Session
    ) -> Dict[str, Any]:
        """解析LLM返回的完整解读结果"""
        try:
            # 尝试从LLM结果中提取JSON
            json_match = re.search(r'```json\s*(.*?)\s*```', llm_result, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                # 如果没有markdown格式，尝试直接解析整个结果
                json_str = llm_result.strip()

            parsed_data = json.loads(json_str)

            # 从数据库重新获取完整的维度信息（包含aspect和aspect_type）
            complete_dimensions = []
            for dim in dimensions:
                db_dimension = db.query(Dimension).filter(Dimension.id == dim["id"]).first()
                if db_dimension:
                    complete_dimensions.append(self._serialize_dimension(db_dimension))
                else:
                    # 如果数据库中找不到，使用传入的数据
                    complete_dimensions.append(dim)

            # 验证和补全数据结构
            return {
                "dimensions": complete_dimensions,
                "user_description": user_description,
                "spread_type": "three-card",  # 根据实际情况设置
                "card_interpretations": parsed_data.get("card_interpretations", []),
                "overall_summary": parsed_data.get("overall_summary", ""),
                "insights": parsed_data.get("insights", []),
                "generated_at": "now"
            }

        except Exception as e:
            print(f"解析LLM结果失败: {e}")
            raise ValueError(f"解析LLM返回结果失败: {e}")

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
