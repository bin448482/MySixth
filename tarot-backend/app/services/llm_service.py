"""
LLM integration service for tarot reading generation.
"""
import asyncio
from typing import Dict, List, Optional, Any
from ..utils.logger import api_logger  # 添加日志导入
from pathlib import Path

try:
    from zhipuai import ZhipuAI
except ImportError:
    ZhipuAI = None

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

from ..config import settings


class LLMService:
    """LLM服务，支持智谱AI和OpenAI"""

    def __init__(self):
        self.config = settings
        self.clients: Dict[str, Any] = {}
        self.default_provider = self.config.API_PROVIDER or "zhipu"
        self._initialize_clients()
        self.prompt_template = self._load_prompt_template()

    def _initialize_clients(self):
        """初始化可用的 LLM 客户端"""
        if ZhipuAI and self.config.ZHIPUAI_API_KEY:
            self.clients['zhipu'] = ZhipuAI(api_key=self.config.ZHIPUAI_API_KEY)

        if OpenAI and self.config.OPENAI_API_KEY:
            self.clients['openai'] = OpenAI(
                api_key=self.config.OPENAI_API_KEY,
                base_url=self.config.OPENAI_BASE_URL
            )

        if not self.clients:
            raise ValueError("No LLM providers are configured. Please set API keys for at least one provider.")

        if self.default_provider not in self.clients:
            # 回退到第一个可用的提供方
            self.default_provider = next(iter(self.clients.keys()))

    def _load_prompt_template(self) -> str:
        """加载提示词模板"""
        template_path = Path("../tarot-ai-generator/prompt_template.txt")
        if template_path.exists():
            return template_path.read_text(encoding='utf-8')

        # 默认模板
        return """你是一位专业的塔罗牌解读师，拥有丰富的塔罗牌解读经验。现在需要你为塔罗牌在特定维度下生成详细的解读内容。
## 塔罗牌信息
- 卡牌名称：{card_name}
- 牌位方向：{direction}
- 基础牌意：{summary}
- 详细说明：{detail}

## 解读维度
- 维度类别：{category}
- 维度描述：{description}
- 维度子项：{aspect}
- 子项类型：{aspect_type}

## 要求
1. 基于给定的塔罗牌信息和解读维度，生成一段150-300字的详细解读
2. 解读内容要结合传统塔罗牌象征意义和牌意与现代生活实际应用
3. 语言风格要专业且易懂，适合普通用户理解
4. 内容要具体实用，能给用户提供明确的指导建议
5. 可以抽象或模糊的表述
6. 考虑牌位方向（正位/逆位）的影响
7. 考虑维度子项的影响
8. 紧扣维度描述的主题，不要偏离核心内容

## 输出格式
请直接输出解读内容，不要包含任何格式化标记或前言后语。"""

    async def call_ai_api(
        self,
        prompt: str,
        locale: Optional[str] = None,
        provider: Optional[str] = None,
        model: Optional[str] = None
    ) -> Optional[str]:
        """调用AI API生成内容（异步版本）"""
        resolved_provider, resolved_model = self._resolve_provider_and_model(locale, provider, model)
        try:
            # 在线程池中执行同步API调用
            return await asyncio.to_thread(
                self._call_ai_api_sync,
                prompt,
                resolved_provider,
                resolved_model
            )
        except Exception as e:
            api_logger.log_error(
                "llm_api_call",
                e,
                {"prompt_length": len(prompt), "provider": resolved_provider, "model": resolved_model}
            )
            return None

    def _call_ai_api_sync(self, prompt: str, provider: str, model: str) -> Optional[str]:
        """同步版本的AI API调用"""
        client = self.clients.get(provider)
        if not client:
            raise ValueError(f"LLM provider '{provider}' is not initialized")

        try:
            if provider == 'zhipu':
                response = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=self.config.TEMPERATURE,
                    max_tokens=self.config.MAX_TOKENS
                )
            elif provider == 'openai':
                response = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=self.config.TEMPERATURE,
                    max_tokens=self.config.MAX_TOKENS
                )
            else:
                raise ValueError(f"Unsupported provider: {provider}")

            return response.choices[0].message.content.strip()
        except Exception as e:
            api_logger.log_error(
                f"{provider}_api_call",
                e,
                {"prompt_length": len(prompt), "model": model}
            )
            return None

    def _resolve_provider_and_model(
        self,
        locale: Optional[str],
        provider: Optional[str],
        model: Optional[str]
    ) -> tuple[str, str]:
        """根据 locale 和配置决定使用的模型和服务商"""
        resolved_provider = provider
        if not resolved_provider:
            if self._is_english_locale(locale) and 'openai' in self.clients:
                resolved_provider = 'openai'
            else:
                resolved_provider = self.default_provider if self.default_provider in self.clients else next(iter(self.clients))

        if resolved_provider == 'openai':
            resolved_model = model or self.config.OPENAI_MODEL_NAME or self.config.MODEL_NAME
        elif resolved_provider == 'zhipu':
            resolved_model = model or self.config.ZHIPU_MODEL_NAME or self.config.MODEL_NAME
        else:
            resolved_model = model or self.config.MODEL_NAME

        return resolved_provider, resolved_model

    @staticmethod
    def _is_english_locale(locale: Optional[str]) -> bool:
        """判断 locale 是否为英文环境"""
        return bool(locale and locale.lower().startswith("en"))

    @staticmethod
    def _clean_dimension_name(line: str) -> str:
        """Normalize a single line returned by the model into a dimension name."""
        cleaned = line.strip()
        leading_markers = {'-', '*', '•', '●', '·'}

        while cleaned and cleaned[0] in leading_markers:
            cleaned = cleaned[1:].lstrip()

        index = 0
        while index < len(cleaned) and cleaned[index].isdigit():
            index += 1

        while index < len(cleaned) and cleaned[index] in {'.', ')', ' '}:
            index += 1

        return cleaned[index:].strip()

    async def analyze_user_description(
        self,
        description: str,
        spread_type: str = "three-card",
        locale: str = "zh-CN"
    ) -> tuple[List[str], str]:
        """
        分析用户描述，返回推荐的维度名称列表和统一的描述。
        """
        try:
            if spread_type == "celtic-cross":
                dimensions = await self._analyze_for_celtic_cross(locale)
                return dimensions, self._default_celtic_summary(locale)
            return await self._analyze_for_three_card(description, locale)
        except Exception as e:
            api_logger.log_error("analyze_user_description", e, {"description_length": len(description)})
            if spread_type == "celtic-cross":
                return self._get_celtic_default(locale), self._default_celtic_summary(locale)
            return self._get_default_three_card_dimensions_with_description(locale)

    async def _analyze_for_three_card(self, description: str, locale: str) -> tuple[List[str], str]:
        """
        三牌阵专用分析：基于因果率和发展趋势动态确定三个维度
        """
        is_english = self._is_english_locale(locale)
        if is_english:
            analysis_prompt = f"""You are a seasoned tarot reader. Based on the client's question, determine the most aligned three-card dimensions and produce a unified summary (30-50 words).

Client Question:
{description}

Instructions:
1. Select one overarching category that best matches the client's concern.
2. Generate three specific aspects (category-aspect) that describe the evolution of the issue from cause to outcome.
3. Ensure all three aspects share the exact same category prefix (e.g., Career-Root Cause, Career-Current Status, Career-Next Step).
4. Provide a concise summary (30-50 words) capturing the overall theme.

Available categories:
- Time: past, present, future dynamics
- Emotion: relationships, feelings, inner state
- Career: work, vocation, achievements
- Decision: choices, judgement, action plans
- Health: mind-body wellness, lifestyle
- Finance: money, investment, economic outlook
- Relationship: social interaction, communication
- Study: learning, exams, knowledge growth
- Family: household matters, family ties

Output format:
DIMENSIONS:
Category-Aspect1
Category-Aspect2
Category-Aspect3

DESCRIPTION:
[Unified summary]

Respond in English and keep the category names consistent."""
        else:
            analysis_prompt = f"""你是一位资深的塔罗牌解读师。请结合用户的问题，为三牌阵分析生成最合适的三个维度，并给出统一的问题概要（30-50字）。

用户描述：{description}

分析要求：
1. 找出最契合问题的一个主要类别。
2. 生成三个细化的分析角度（类别-aspect），体现问题从起因到结果的发展。
3. 三个维度必须具有相同的类别前缀。
4. 输出一个概括性的概要描述（30-50字），体现整体主题。

可选类别：
- 时间：关注过去、现在与未来
- 情感：关注关系、情绪与内在状态
- 事业：关注工作、职涯与成就
- 决策：关注选择、判断与行动计划
- 健康：关注身心状态与生活节律
- 财务：关注资金、投资与经济状况
- 人际：关注社交、沟通与合作
- 学业：关注学习、考试与技能成长
- 家庭：关注家庭关系与事务处理

输出格式：
DIMENSIONS:
类别-aspect1
类别-aspect2
类别-aspect3

DESCRIPTION:
[统一概要描述]

请使用简体中文输出，确保三个维度类别名称完全一致。"""

        try:
            result = await self.call_ai_api(analysis_prompt, locale=locale)
            if result:
                dimensions, summary = self._parse_combined_result(result)
                if dimensions:
                    return dimensions[:3], summary
            return self._get_default_three_card_dimensions_with_description(locale)
        except Exception as e:
            api_logger.log_error("analyze_three_card_question", e, {"description_length": len(description)})
            return self._get_default_three_card_dimensions_with_description(locale)

    def _parse_combined_result(self, result: str) -> tuple[List[str], str]:
        """解析合并的LLM结果，提取维度和描述"""
        try:
            lines = result.strip().split('\n')
            dimensions = []
            description = ""

            # 查找DIMENSIONS和DESCRIPTION部分
            in_dimensions = False
            in_description = False

            for line in lines:
                line = line.strip()
                if line.upper().startswith('DIMENSIONS:'):
                    in_dimensions = True
                    in_description = False
                    continue
                elif line.upper().startswith('DESCRIPTION:'):
                    in_dimensions = False
                    in_description = True
                    continue
                elif line and in_dimensions:
                    # 处理维度行
                    cleaned = self._clean_dimension_name(line)
                    if cleaned and cleaned not in dimensions:
                        dimensions.append(cleaned)
                        if len(dimensions) >= 3:
                            in_dimensions = False
                elif line and in_description:
                    # 处理描述行
                    if description:
                        description += " " + line
                    else:
                        description = line

            return dimensions, description.strip()
        except Exception as e:
            api_logger.log_error("parse_combined_result", e, {"result_length": len(result)})
            return [], ""

    def _get_default_three_card_dimensions_with_description(self, locale: str) -> tuple[List[str], str]:
        """获取默认的三牌阵维度和描述"""
        if self._is_english_locale(locale):
            return (
                ["General-Past", "General-Present", "General-Future"],
                "A foundational three-card storyline that examines how the situation evolved from past influences to its emerging outcome."
            )
        return (
            ["整体-过去", "整体-现在", "整体-将来"],
            "三牌阵综合分析，探索问题从过去到未来的发展脉络。"
        )

    async def _analyze_for_celtic_cross(self, locale: str) -> List[str]:
        """
        凯尔特十字专用分析：使用固定的十个牌位维度（语言适配）
        """
        return self._get_celtic_default(locale)

    def _get_celtic_default(self, locale: str) -> List[str]:
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

    def _default_celtic_summary(self, locale: str) -> str:
        if self._is_english_locale(locale):
            return "A comprehensive Celtic Cross overview that examines ten critical perspectives influencing the issue."
        return "凯尔特十字牌阵将从十个关键角度展开分析，全面洞察问题的发展走向。"


# 全局LLM服务实例
_llm_service = None


def get_llm_service() -> LLMService:
    """获取LLM服务实例（单例模式）"""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
