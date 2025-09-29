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
        self.client = None
        self._initialize_client()
        self.prompt_template = self._load_prompt_template()

    def _initialize_client(self):
        """初始化LLM客户端"""
        if self.config.API_PROVIDER == 'zhipu':
            if not ZhipuAI:
                raise ImportError("ZhipuAI library not installed. Run: pip install zhipuai")
            if not self.config.ZHIPUAI_API_KEY:
                raise ValueError("ZHIPUAI_API_KEY not configured")
            self.client = ZhipuAI(api_key=self.config.ZHIPUAI_API_KEY)

        elif self.config.API_PROVIDER == 'openai':
            if not OpenAI:
                raise ImportError("OpenAI library not installed. Run: pip install openai")
            if not self.config.OPENAI_API_KEY:
                raise ValueError("OPENAI_API_KEY not configured")
            self.client = OpenAI(
                api_key=self.config.OPENAI_API_KEY,
                base_url=self.config.OPENAI_BASE_URL
            )
        else:
            raise ValueError(f"Unsupported API provider: {self.config.API_PROVIDER}")

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

    async def call_ai_api(self, prompt: str) -> Optional[str]:
        """调用AI API生成内容（异步版本）"""
        try:
            # 在线程池中执行同步API调用
            return await asyncio.to_thread(self._call_ai_api_sync, prompt)
        except Exception as e:
            api_logger.log_error("zhipu_api_call", e, {"prompt_length": len(prompt)})
            return None

    def _call_ai_api_sync(self, prompt: str) -> Optional[str]:
        """同步版本的AI API调用"""
        try:
            if self.config.API_PROVIDER == 'zhipu':
                response = self.client.chat.completions.create(
                    model=self.config.MODEL_NAME,
                    messages=[
                        {"role": "user", "content": prompt}
                    ],
                    temperature=self.config.TEMPERATURE,
                    max_tokens=self.config.MAX_TOKENS
                )
                return response.choices[0].message.content.strip()

            elif self.config.API_PROVIDER == 'openai':
                response = self.client.chat.completions.create(
                    model=self.config.MODEL_NAME,
                    messages=[
                        {"role": "user", "content": prompt}
                    ],
                    temperature=self.config.TEMPERATURE,
                    max_tokens=self.config.MAX_TOKENS
                )
                return response.choices[0].message.content.strip()

        except Exception as e:
            api_logger.log_error("openai_api_call", e, {"prompt_length": len(prompt)})
            return None

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

    async def analyze_user_description(self, description: str, spread_type: str = "three-card") -> tuple[List[str], str]:
        """
        分析用户描述，返回推荐的维度名称列表和统一的描述。
        Args:
            description: 用户描述（200字以内）
            spread_type: 牌阵类型（three-card 或 celtic-cross）

        Returns:
            (推荐的维度名称列表, 统一的描述)
        """
        # if spread_type == "three-card":
        #     return await self._analyze_for_three_card(description)
        # elif spread_type == "celtic-cross":
        #     return await self._analyze_for_celtic_cross(description)
        # else:
        #     # 默认使用三牌阵逻辑
        #     return await self._analyze_for_three_card(description)
        return await self._analyze_for_three_card(description)

    async def _analyze_for_three_card(self, description: str) -> tuple[List[str], str]:
        """
        三牌阵专用分析：基于因果率和发展趋势动态确定三个维度
        """
        analysis_prompt = f"""你是一位专业的塔罗牌解读师。用户提供了占卜描述，请根据三牌阵的因果率和发展趋势分析逻辑，为这个问题确定最合适的三个分析维度，并生成统一的问题概要。

用户描述：{description}

三牌阵分析要求：
1. 深入分析用户问题的核心关注点，确定ONE个最相关的主要类别
2. 根据用户的具体问题内容，动态确定三个最贴合的分析角度(aspect)
3. 按照因果递进逻辑排列这三个角度，体现从起因到结果的发展脉络
4. **重要**：三个维度必须使用完全相同的类别名称！
5. 同时生成一个统一的问题概要描述（30-50字），概括整个分析的核心主题

可选的主要类别：
- 时间：涉及过去现在未来的时间发展
- 情感：涉及感情、关系、内心状态
- 事业：涉及工作、职业发展、成就
- 决策：涉及选择、判断、行动方案
- 健康：涉及身心健康、生活状态
- 财务：涉及金钱、投资、经济状况
- 人际：涉及人际关系、社交、沟通
- 学业：涉及学习、考试、知识技能
- 家庭：涉及家庭关系、家事处理

**关键**：请根据用户的具体问题，动态生成最合适的三个aspect，不要使用模板化的固定组合。

输出格式：
DIMENSIONS:
类别-aspect1
类别-aspect2
类别-aspect3

DESCRIPTION:
[统一的问题概要描述]

例如：
DIMENSIONS:
财务-债务现状
财务-还款策略
财务-财务重建

DESCRIPTION:
探索债务处理的核心策略，从现状分析到具体行动的全面解决方案。

**确保三个维度的类别名称完全一致，aspect要贴合用户的具体问题！**"""

        try:
            result = await self.call_ai_api(analysis_prompt)
            if result:
                # 解析新的输出格式
                dimensions, description = self._parse_combined_result(result)
                if dimensions:
                    return dimensions[:3], description
            return self._get_default_three_card_dimensions_with_description()
        except Exception as e:
            api_logger.log_error("analyze_three_card_question", e, {"question_length": len(question)})
            return self._get_default_three_card_dimensions_with_description()

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

    def _get_default_three_card_dimensions_with_description(self) -> tuple[List[str], str]:
        """获取默认的三牌阵维度和描述"""
        return (
            ["整体-过去", "整体-现在", "整体-将来"],
            "三牌阵综合分析，探索问题的时间发展脉络"
        )

    async def _analyze_for_celtic_cross(self, description: str) -> List[str]:
        """
        凯尔特十字专用分析：使用固定的十个牌位维度
        """
        # 凯尔特十字使用固定的十个维度
        celtic_dimensions = [
            "凯尔特十字-现状", "凯尔特十字-挑战", "凯尔特十字-潜意识", "凯尔特十字-显意识", "凯尔特十字-过去",
            "凯尔特十字-未来", "凯尔特十字-自我态度", "凯尔特十字-外部影响", "凯尔特十字-希望恐惧", "凯尔特十字-结果"
        ]
        return celtic_dimensions

    def _get_default_three_card_dimensions(self) -> List[str]:
        """获取默认的三牌阵维度"""
        return ["整体-过去", "整体-现在", "整体-将来"]


# 全局LLM服务实例
_llm_service = None


def get_llm_service() -> LLMService:
    """获取LLM服务实例（单例模式）"""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
