"""
Reading service for tarot card interpretation business logic.
"""
import json
import re
from datetime import datetime
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Card, Dimension, CardInterpretation
from ..utils.logger import api_logger  # 添加日志导入
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

    async def analyze_user_description(
        self,
        description: str,
        spread_type: str,
        locale: str,
        db: Session
    ) -> List[Dict[str, Any]]:
        """
        第一步：分析用户描述，返回推荐的维度信息。

        Args:
            description: 用户描述（200字以内）
            spread_type: 牌阵类型（three-card 或 celtic-cross）
            locale: 客户端期望的语言
            db: 数据库会话

        Returns:
            推荐的维度信息列表
        """
        limit = 3 if spread_type == "three-card" else 10

        try:
            # 调用 LLM 分析，获取推荐的维度名称和统一描述
            recommended_names, unified_description = await self.llm_service.analyze_user_description(
                description=description,
                spread_type=spread_type,
                locale=locale
            )

            if spread_type == "three-card":
                return await self._process_three_card_dimensions(
                    recommended_names=recommended_names,
                    unified_description=unified_description,
                    db=db,
                    limit=limit,
                    locale=locale
                )

            return self._process_celtic_cross_dimensions(
                recommended_names=recommended_names,
                db=db,
                limit=limit,
                locale=locale,
                default_description=unified_description
            )

        except Exception as e:
            api_logger.log_error("analyze_user_description", e, {"description": description[:100]})
            if spread_type == "three-card":
                default_names, default_description = self._get_default_three_card_dimensions_with_description(locale)
                return await self._process_three_card_dimensions(
                    recommended_names=default_names,
                    unified_description=default_description,
                    db=db,
                    limit=limit,
                    locale=locale
                )

            return self._process_celtic_cross_dimensions(
                recommended_names=self._get_celtic_dimension_names(locale),
                db=db,
                limit=limit,
                locale=locale,
                default_description=self._default_celtic_description(locale)
            )

    async def _process_three_card_dimensions(
        self,
        recommended_names: List[str],
        unified_description: str,
        db: Session,
        limit: int,
        locale: str
    ) -> List[Dict[str, Any]]:
        """
        处理三牌阵维度：支持动态创建和 aspect_type 分配
        """
        dimensions: List[Dict[str, Any]] = []
        fallback_names, fallback_description = self._get_default_three_card_dimensions_with_description(locale)
        description_text = unified_description or fallback_description

        processed_names = [name for name in (recommended_names or []) if name]

        for i, name in enumerate(processed_names[:limit]):
            dimension = self._find_existing_dimension(name, db)

            if dimension:
                dimension_dict = self._serialize_dimension(dimension)
                dimension_dict["aspect_type"] = i + 1  # 1, 2, 3
                if description_text:
                    dimension_dict["description"] = description_text
                dimensions.append(dimension_dict)
            else:
                new_dimension = self._create_dynamic_dimension(
                    name=name,
                    aspect_type=i + 1,
                    description=description_text,
                    db=db
                )
                if new_dimension:
                    dimensions.append(self._serialize_dimension(new_dimension))

        existing_names = {dim["name"] for dim in dimensions}

        for fallback_index, fallback_name in enumerate(fallback_names, start=1):
            if len(dimensions) >= limit:
                break
            if fallback_name in existing_names:
                continue
            new_dimension = self._create_dynamic_dimension(
                name=fallback_name,
                aspect_type=len(dimensions) + 1,
                description=description_text,
                db=db
            )
            if new_dimension:
                dimensions.append(self._serialize_dimension(new_dimension))
                existing_names.add(fallback_name)

        # 确保按照 aspect_type 排序返回
        return sorted(dimensions[:limit], key=lambda item: item.get("aspect_type") or 0)

    def _process_celtic_cross_dimensions(
        self,
        recommended_names: List[str],
        db: Session,
        limit: int,
        locale: str,
        default_description: Optional[str]
    ) -> List[Dict[str, Any]]:
        """
        处理凯尔特十字维度：优先使用推荐的名称，其次使用默认列表
        """
        names_to_use = [name for name in (recommended_names or []) if name] or self._get_celtic_dimension_names(locale)
        description_text = default_description or self._default_celtic_description(locale)

        dimensions: List[Dict[str, Any]] = []
        existing_names: set[str] = set()

        for i, name in enumerate(names_to_use[:limit]):
            dimension = self._find_existing_dimension(name, db)
            if dimension:
                dimension_dict = self._serialize_dimension(dimension)
                dimension_dict["aspect_type"] = i + 1
                if description_text:
                    dimension_dict["description"] = description_text
                dimensions.append(dimension_dict)
            else:
                new_dimension = self._create_dynamic_dimension(
                    name=name,
                    aspect_type=i + 1,
                    description=description_text,
                    db=db
                )
                if new_dimension:
                    dimensions.append(self._serialize_dimension(new_dimension))
            existing_names.add(name)

        # 如果仍不足，使用默认名称补全
        for fallback_name in self._get_celtic_dimension_names(locale):
            if len(dimensions) >= limit:
                break
            if fallback_name in existing_names:
                continue
            new_dimension = self._create_dynamic_dimension(
                name=fallback_name,
                aspect_type=len(dimensions) + 1,
                description=description_text,
                db=db
            )
            if new_dimension:
                dimensions.append(self._serialize_dimension(new_dimension))
                existing_names.add(fallback_name)

        return sorted(dimensions[:limit], key=lambda item: item.get("aspect_type") or 0)

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
            api_logger.log_error("generate_unified_description", e, {"recommendation_count": len(recommended_names or [])})
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
            api_logger.log_error("create_dynamic_dimension", e, {"name": name})
            return None

    @staticmethod
    def _is_english_locale(locale: Optional[str]) -> bool:
        """判断是否为英文语系"""
        return bool(locale and locale.lower().startswith("en"))

    def _get_default_three_card_dimensions_with_description(self, locale: str) -> tuple[List[str], str]:
        """根据语言返回默认的三牌阵维度及统一描述"""
        if self._is_english_locale(locale):
            return (
                ["General-Past", "General-Present", "General-Future"],
                "A holistic three-card spread that follows the situation from its origins to the likely outcome."
            )
        return (
            ["整体-过去", "整体-现在", "整体-将来"],
            "三牌阵综合分析，探索问题的时间发展脉络"
        )

    def _get_celtic_dimension_names(self, locale: str) -> List[str]:
        """根据语言返回凯尔特十字的默认维度名称"""
        if self._is_english_locale(locale):
            return [
                "Celtic Cross-Current Situation",
                "Celtic Cross-Challenge",
                "Celtic Cross-Subconscious",
                "Celtic Cross-Conscious Mind",
                "Celtic Cross-Past",
                "Celtic Cross-Future",
                "Celtic Cross-Self",
                "Celtic Cross-External Influence",
                "Celtic Cross-Hopes and Fears",
                "Celtic Cross-Outcome",
            ]
        return [
            "凯尔特十字-现状", "凯尔特十字-挑战", "凯尔特十字-潜意识", "凯尔特十字-显意识", "凯尔特十字-过去",
            "凯尔特十字-未来", "凯尔特十字-自我态度", "凯尔特十字-外部影响", "凯尔特十字-希望恐惧", "凯尔特十字-结果"
        ]

    def _default_celtic_description(self, locale: str) -> str:
        """凯尔特十字默认描述"""
        if self._is_english_locale(locale):
            return "A comprehensive Celtic Cross reading that explores ten pivotal facets shaping the situation."
        return "利用凯尔特十字牌阵，从十个关键角度解析问题的发展脉络。"

    def _direction_to_locale(self, direction: str, locale: str) -> str:
        """根据语言返回牌位方向描述"""
        if self._is_english_locale(locale):
            normalized = direction.strip().lower()
            if normalized in {"正位", "upright"}:
                return "Upright"
            if normalized in {"逆位", "reversed"}:
                return "Reversed"
        return direction

    def _format_position_label(self, position: int, locale: str) -> str:
        """构建位置描述"""
        if self._is_english_locale(locale):
            return f"Position {position}"
        return f"位置{position}"

    async def generate_interpretation(
        self,
        cards: List[Dict[str, Any]],
        dimensions: List[Dict[str, Any]],
        user_description: str,
        spread_type: str,
        locale: str,
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
                resolved_cards=resolved_cards,
                dimensions=dimensions,
                user_description=user_description,
                spread_type=spread_type,
                locale=locale,
                db=db
            )

            return all_interpretation_result

        except Exception as e:
            api_logger.log_error(
                "generate_reading",
                e,
                {
                    "spread_type": spread_type,
                    "card_count": len(cards),
                    "dimension_count": len(dimensions),
                },
            )
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
        spread_type: str,
        locale: str,
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
                    "direction_localized": self._direction_to_locale(card_info["direction"], locale),
                    "position": card_info["position"],
                    "summary": basic_interpretation.summary if basic_interpretation else "",
                    "detail": basic_interpretation.detail if basic_interpretation else ""
                }
                cards_info.append(card_data)

            # 构建一次性解读提示词
            complete_prompt = self._build_complete_interpretation_prompt(
                cards_info=cards_info,
                dimensions=dimensions,
                user_description=user_description,
                spread_type=spread_type,
                locale=locale
            )

            # 调用LLM一次性生成所有解读
            result = await self.llm_service.call_ai_api(
                prompt=complete_prompt,
                locale=locale
            )

            if not result:
                raise ValueError("LLM调用失败，无法生成解读内容")

            # 解析LLM返回的完整结果
            return self._parse_complete_interpretation_result(
                llm_result=result,
                cards_info=cards_info,
                dimensions=dimensions,
                user_description=user_description,
                spread_type=spread_type,
                locale=locale,
                db=db
            )

        except Exception as e:
            api_logger.log_error(
                "generate_complete_reading",
                e,
                {"card_count": len(resolved_cards), "dimension_count": len(dimensions)}
            )
            raise

    def _build_complete_interpretation_prompt(
        self,
        cards_info: List[Dict[str, Any]],
        dimensions: List[Dict[str, Any]],
        user_description: str,
        spread_type: str,
        locale: str
    ) -> str:
        """构建一次性完整解读的提示词"""

        is_english = self._is_english_locale(locale)
        sorted_dimensions = sorted(dimensions, key=lambda x: x.get('aspect_type', 0))

        cards_lines: List[str] = []
        for card in cards_info:
            position_label = self._format_position_label(card["position"], locale)
            direction_label = card.get("direction_localized") or card.get("direction")
            summary = card.get("summary") or ""
            if is_english:
                line = f"{position_label}: {card['name']} ({direction_label}) - Traditional summary (Chinese): {summary}"
            else:
                line = f"{position_label}: {card['name']}({direction_label}) - {summary}"
            cards_lines.append(line.strip())

        cards_section = "\n".join(cards_lines) if cards_lines else ""

        dimensions_lines: List[str] = []
        for i, dim in enumerate(sorted_dimensions):
            idx = dim.get('aspect_type', i + 1)
            description = dim.get("description") or ""
            if is_english:
                line = f"Dimension {idx}: {dim['name']} - {description}"
            else:
                line = f"维度{idx}: {dim['name']} - {description}"
            dimensions_lines.append(line.strip())
        dimensions_section = "\n".join(dimensions_lines)

        mapping_lines: List[str] = []
        for i, dim in enumerate(sorted_dimensions):
            idx = dim.get('aspect_type', i + 1)
            position_label = self._format_position_label(i + 1, locale)
            if is_english:
                line = f"{position_label} corresponds to Dimension {idx} ({dim['name']})"
            else:
                line = f"{position_label}的卡牌对应维度{idx}({dim['name']})"
            mapping_lines.append(line)
        position_mapping = "\n".join(mapping_lines)

        if spread_type == "celtic-cross":
            spread_label_en = "Celtic Cross"
            spread_label_zh = "凯尔特十字"
        else:
            spread_label_en = "three-card"
            spread_label_zh = "三牌阵"

        if is_english:
            prompt = f"""You are a professional tarot reader. Craft a complete interpretation for the following {spread_label_en} spread.

## Client Question
{user_description}

## Drawn Cards
{cards_section}

## Interpretation Dimensions
{dimensions_section}

## Card-to-Dimension Mapping
{position_mapping}

## Output Requirements
Return a JSON document that matches this structure:

```json
{{
    "card_interpretations": [
        {{
            "card_id": 1,
            "card_name": "Card Name (Upright/Reversed)",
            "direction": "Upright or Reversed",
            "position": 1,
            "basic_summary": "Short traditional meaning translated into English",
            "ai_interpretation": "150-300 word detailed guidance in English for the assigned dimension",
            "dimension_aspect": {{
                "dimension_name": "Dimension label",
                "interpretation": "150-300 word explanation in English describing how this card expresses the dimension"
            }}
        }}
    ],
    "overall_summary": "200-300 word overall synthesis in English",
    "insights": ["Actionable insight 1", "Actionable insight 2", "Actionable insight 3"]
}}
```

Guidelines:
1. Each card must map to exactly one dimension.
2. Keep the narrative coherent across the three cards and their dimensions.
3. Insights must be specific and actionable, not vague platitudes.
Always respond in English."""
        else:
            prompt = f"""你是一位专业的塔罗牌解读师，请为以下{spread_label_zh}抽牌结果生成完整的解读。

## 用户问题
{user_description}

## 抽到的卡牌
{cards_section}

## 解读维度
{dimensions_section}

## 位置-维度对应关系
{position_mapping}

## 输出要求
请按照以下 JSON 结构返回结果：

```json
{{
    "card_interpretations": [
        {{
            "card_id": 1,
            "card_name": "卡牌名称(正位/逆位)",
            "direction": "正位或逆位",
            "position": 1,
            "basic_summary": "基础牌意概述（简体中文）",
            "ai_interpretation": "150-300字的详细解读（简体中文），说明该卡牌在对应维度下的含义与指导",
            "dimension_aspect": {{
                "dimension_name": "维度名称",
                "interpretation": "150-300字的详细说明（简体中文），描述该卡牌如何体现该维度"
            }}
        }}
    ],
    "overall_summary": "200-300字的整体总结（简体中文）",
    "insights": ["关键洞察1", "关键洞察2", "关键洞察3"]
}}
```

注意事项：
1. 每张卡牌只能对应一个维度。
2. 解读要体现维度之间的关联与发展脉络。
3. 洞察要具体可执行，避免空泛表达。
请使用简体中文输出。"""

        return prompt

    def _parse_complete_interpretation_result(
        self,
        llm_result: str,
        cards_info: List[Dict[str, Any]],
        dimensions: List[Dict[str, Any]],
        user_description: str,
        spread_type: str,
        locale: str,
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
                dimension_dict: Dict[str, Any] = {}
                dimension_id = dim.get("id")
                if dimension_id:
                    db_dimension = db.query(Dimension).filter(Dimension.id == dimension_id).first()
                    if db_dimension:
                        dimension_dict = self._serialize_dimension(db_dimension)
                if not dimension_dict:
                    dimension_dict = {**dim}

                if dim.get("description"):
                    dimension_dict["description"] = dim["description"]
                if dim.get("aspect_type"):
                    dimension_dict["aspect_type"] = dim["aspect_type"]
                if dim.get("aspect"):
                    dimension_dict["aspect"] = dim["aspect"]

                complete_dimensions.append(dimension_dict)

            # 验证和补全数据结构
            card_interpretations = parsed_data.get("card_interpretations", [])
            if not isinstance(card_interpretations, list):
                card_interpretations = []

            insights = parsed_data.get("insights", [])
            if isinstance(insights, str):
                insights = [insights]
            elif not isinstance(insights, list):
                insights = []

            return {
                "dimensions": complete_dimensions,
                "user_description": user_description,
                "spread_type": spread_type,
                "card_interpretations": card_interpretations,
                "overall_summary": parsed_data.get("overall_summary", ""),
                "insights": insights,
                "generated_at": datetime.utcnow().isoformat() + "Z",
                "metadata": {"locale": locale}
            }

        except Exception as e:
            api_logger.log_error("parse_complete_interpretation_result", e, {"result_length": len(llm_result)})
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
            api_logger.log_error("get_basic_interpretation", e, {"card_id": card_id, "orientation": orientation})
            return None


# 全局读书服务实例
_reading_service = None


def get_reading_service() -> ReadingService:
    """获取解读服务实例（单例模式）"""
    global _reading_service
    if _reading_service is None:
        _reading_service = ReadingService()
    return _reading_service
