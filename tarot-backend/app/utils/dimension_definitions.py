"""
Canonical dimension definitions for tarot readings.
"""
from typing import Any, Dict, List, Optional

DimensionDefinition = Dict[str, Any]


DIMENSION_DEFINITIONS: List[DimensionDefinition] = [
    {
        "name": "整体-过去",
        "category": "整体",
        "description": "回顾整体运势中过往的关键节点，理解它们对当前局势的铺垫。",
        "aspect": "过去",
        "aspect_type": 1,
        "spread_type": "three-card"
    },
    {
        "name": "整体-现在",
        "category": "整体",
        "description": "分析当前整体能量与主导主题，帮助你掌握当下的重点。",
        "aspect": "现在",
        "aspect_type": 2,
        "spread_type": "three-card"
    },
    {
        "name": "整体-将来",
        "category": "整体",
        "description": "预测整体发展趋势与潜在机会，指引你提前做好布局。",
        "aspect": "将来",
        "aspect_type": 3,
        "spread_type": "three-card"
    },
    {
        "name": "情感-过去",
        "category": "情感",
        "description": "回顾感情关系中过去的重要事件，理解它们如何塑造当前的情绪基础。",
        "aspect": "过去",
        "aspect_type": 1,
        "spread_type": "three-card"
    },
    {
        "name": "情感-现在",
        "category": "情感",
        "description": "洞察当下双方的互动状态与情感温度，明确目前的连结质量。",
        "aspect": "现在",
        "aspect_type": 2,
        "spread_type": "three-card"
    },
    {
        "name": "情感-将来",
        "category": "情感",
        "description": "预测关系在可见未来的走向，为情感发展提前做好准备。",
        "aspect": "将来",
        "aspect_type": 3,
        "spread_type": "three-card"
    },
    {
        "name": "情感-沟通策略",
        "category": "情感",
        "description": "分析双方的沟通节奏与表达模式，提出改善亲密对话的方向。",
        "aspect": "沟通",
        "aspect_type": None,
        "spread_type": "general"
    },
    {
        "name": "情感-自我定位",
        "category": "情感",
        "description": "帮助你厘清在关系中的角色定位，找到更平衡的相处方式。",
        "aspect": "角色",
        "aspect_type": None,
        "spread_type": "general"
    },
    {
        "name": "事业-过去",
        "category": "事业",
        "description": "梳理过去工作经历中的关键节点，找出影响当前职业局势的根源。",
        "aspect": "过去",
        "aspect_type": 1,
        "spread_type": "three-card"
    },
    {
        "name": "事业-现在",
        "category": "事业",
        "description": "评估当下职场环境与自身角色，明确眼前的机会与挑战。",
        "aspect": "现在",
        "aspect_type": 2,
        "spread_type": "three-card"
    },
    {
        "name": "事业-将来",
        "category": "事业",
        "description": "展望事业发展的可能趋势，帮助你制定战略性行动。",
        "aspect": "将来",
        "aspect_type": 3,
        "spread_type": "three-card"
    },
    {
        "name": "事业-发展策略",
        "category": "事业",
        "description": "为职业晋升与长期规划提供聚焦方向与可执行步骤。",
        "aspect": "规划",
        "aspect_type": None,
        "spread_type": "general"
    },
    {
        "name": "事业-团队协作",
        "category": "事业",
        "description": "洞察团队互动模式与分工状态，辅助你优化协作关系。",
        "aspect": "互动",
        "aspect_type": None,
        "spread_type": "general"
    },
    {
        "name": "健康-过去",
        "category": "健康",
        "description": "回顾既往的生活习惯与健康事件，了解它们对当前状态的影响。",
        "aspect": "过去",
        "aspect_type": 1,
        "spread_type": "three-card"
    },
    {
        "name": "健康-现在",
        "category": "健康",
        "description": "评估当前身心状况与能量水平，找出需要关注的重点。",
        "aspect": "现在",
        "aspect_type": 2,
        "spread_type": "three-card"
    },
    {
        "name": "健康-将来",
        "category": "健康",
        "description": "预测健康走势与潜在变化，提醒你提前做好调养安排。",
        "aspect": "将来",
        "aspect_type": 3,
        "spread_type": "three-card"
    },
    {
        "name": "健康-养护建议",
        "category": "健康",
        "description": "提供日常养护与作息调整的建议，支持身心复原。",
        "aspect": "日常养护",
        "aspect_type": None,
        "spread_type": "general"
    },
    {
        "name": "健康-情绪调适",
        "category": "健康",
        "description": "关注情绪与压力管理，帮助你重建身心平衡。",
        "aspect": "情绪",
        "aspect_type": None,
        "spread_type": "general"
    },
    {
        "name": "人际-过去",
        "category": "人际",
        "description": "回顾人际关系中曾经的模式或冲突，找出影响目前互动的因素。",
        "aspect": "过去",
        "aspect_type": 1,
        "spread_type": "three-card"
    },
    {
        "name": "人际-现在",
        "category": "人际",
        "description": "洞察当前关系网络的氛围与互动节奏，明确合作与支持状况。",
        "aspect": "现在",
        "aspect_type": 2,
        "spread_type": "three-card"
    },
    {
        "name": "人际-将来",
        "category": "人际",
        "description": "预测人际关系的走向，帮助你安排下一步的沟通策略。",
        "aspect": "将来",
        "aspect_type": 3,
        "spread_type": "three-card"
    },
    {
        "name": "人际-互动氛围",
        "category": "人际",
        "description": "描绘当前社交互动的氛围，指出需要调整的沟通重点。",
        "aspect": "互动",
        "aspect_type": None,
        "spread_type": "general"
    },
    {
        "name": "人际-界限设定",
        "category": "人际",
        "description": "协助你辨识并设定健康界限，维护人际间的互惠平衡。",
        "aspect": "界限",
        "aspect_type": None,
        "spread_type": "general"
    },
    {
        "name": "学业-过去",
        "category": "学业",
        "description": "梳理过往的学习经验与成果，理解形成当前学习状态的原因。",
        "aspect": "过去",
        "aspect_type": 1,
        "spread_type": "three-card"
    },
    {
        "name": "学业-现在",
        "category": "学业",
        "description": "评估目前的学习效率与资源使用情况，明确即刻改进点。",
        "aspect": "现在",
        "aspect_type": 2,
        "spread_type": "three-card"
    },
    {
        "name": "学业-将来",
        "category": "学业",
        "description": "预测学业发展的可能路径，帮助你制定阶段目标。",
        "aspect": "将来",
        "aspect_type": 3,
        "spread_type": "three-card"
    },
    {
        "name": "学业-学习方法",
        "category": "学业",
        "description": "分析适合你的学习策略与工具，提高专注与吸收效率。",
        "aspect": "方法",
        "aspect_type": None,
        "spread_type": "general"
    },
    {
        "name": "学业-心态调节",
        "category": "学业",
        "description": "关注学习过程中的情绪与压力调节，保持稳定动力。",
        "aspect": "心态",
        "aspect_type": None,
        "spread_type": "general"
    },
    {
        "name": "决策-过去",
        "category": "决策",
        "description": "回顾过去的抉择经验与背景，提供当前判断的参照。",
        "aspect": "过去",
        "aspect_type": 1,
        "spread_type": "three-card"
    },
    {
        "name": "决策-现在",
        "category": "决策",
        "description": "聚焦当前决策场景中的关键信息与影响因素。",
        "aspect": "现在",
        "aspect_type": 2,
        "spread_type": "three-card"
    },
    {
        "name": "决策-将来",
        "category": "决策",
        "description": "预测不同选择可能带来的未来走向，支持你做出更有把握的决定。",
        "aspect": "将来",
        "aspect_type": 3,
        "spread_type": "three-card"
    },
    {
        "name": "决策-选项评估",
        "category": "决策",
        "description": "比较各个选项的潜在价值与成本，帮助你找出优势方案。",
        "aspect": "评估",
        "aspect_type": None,
        "spread_type": "general"
    },
    {
        "name": "决策-行动建议",
        "category": "决策",
        "description": "提出具体行动步骤与时机安排，辅助你落实选择。",
        "aspect": "行动",
        "aspect_type": None,
        "spread_type": "general"
    },
    {
        "name": "凯尔特十字-现状",
        "category": "凯尔特十字",
        "description": "展示你当前所处的核心局面与主题焦点。",
        "aspect": "现状",
        "aspect_type": 1,
        "spread_type": "celtic-cross"
    },
    {
        "name": "凯尔特十字-挑战",
        "category": "凯尔特十字",
        "description": "揭示阻碍或需要正视的主要挑战与阻力。",
        "aspect": "挑战",
        "aspect_type": 2,
        "spread_type": "celtic-cross"
    },
    {
        "name": "凯尔特十字-潜意识",
        "category": "凯尔特十字",
        "description": "映照深层潜意识的态度与隐藏动机。",
        "aspect": "潜意识",
        "aspect_type": 3,
        "spread_type": "celtic-cross"
    },
    {
        "name": "凯尔特十字-显意识",
        "category": "凯尔特十字",
        "description": "呈现你在表层意识中的想法与期待。",
        "aspect": "显意识",
        "aspect_type": 4,
        "spread_type": "celtic-cross"
    },
    {
        "name": "凯尔特十字-过去",
        "category": "凯尔特十字",
        "description": "回顾近期过去对当前局势的影响与铺垫。",
        "aspect": "过去影响",
        "aspect_type": 5,
        "spread_type": "celtic-cross"
    },
    {
        "name": "凯尔特十字-未来",
        "category": "凯尔特十字",
        "description": "预示短期内即将浮现的趋势或事件。",
        "aspect": "未来趋势",
        "aspect_type": 6,
        "spread_type": "celtic-cross"
    },
    {
        "name": "凯尔特十字-自我态度",
        "category": "凯尔特十字",
        "description": "分析你对该议题的自我认知与内在姿态。",
        "aspect": "自我态度",
        "aspect_type": 7,
        "spread_type": "celtic-cross"
    },
    {
        "name": "凯尔特十字-外部影响",
        "category": "凯尔特十字",
        "description": "评估环境、他人或社会因素对局势的影响。",
        "aspect": "外部影响",
        "aspect_type": 8,
        "spread_type": "celtic-cross"
    },
    {
        "name": "凯尔特十字-希望恐惧",
        "category": "凯尔特十字",
        "description": "剖析你内心的期望与顾虑之间的拉扯。",
        "aspect": "希望恐惧",
        "aspect_type": 9,
        "spread_type": "celtic-cross"
    },
    {
        "name": "凯尔特十字-结果",
        "category": "凯尔特十字",
        "description": "综合推演事件的最终走向或长期结果。",
        "aspect": "最终结果",
        "aspect_type": 10,
        "spread_type": "celtic-cross"
    }
]


DIMENSION_DEFINITIONS_BY_NAME: Dict[str, DimensionDefinition] = {
    definition["name"]: definition for definition in DIMENSION_DEFINITIONS
}

THREE_CARD_ASPECT_TO_POSITION = {"过去": 1, "现在": 2, "将来": 3}

DEFAULT_ANALYZE_ORDER: List[str] = [
    "整体-现在",
    "情感-现在",
    "事业-现在",
    "决策-现在"
]

for definition in DIMENSION_DEFINITIONS:
    spread_type = definition.get("spread_type")
    aspect_type = definition.get("aspect_type")

    if spread_type == "three-card":
        aspect = definition.get("aspect")
        expected_position = THREE_CARD_ASPECT_TO_POSITION.get(aspect)
        if expected_position is None:
            raise ValueError(f"三牌阵维度 {definition['name']} 的 aspect 必须为 过去/现在/将来")
        if aspect_type != expected_position:
            raise ValueError(
                f"三牌阵维度 {definition['name']} 的 aspect_type 必须为 {expected_position}"
            )
    elif spread_type == "celtic-cross":
        if aspect_type is None or not 1 <= int(aspect_type) <= 10:
            raise ValueError(
                f"凯尔特十字维度 {definition['name']} 的 aspect_type 必须为 1..10"
            )


def get_dimension_definition(name: str) -> Optional[DimensionDefinition]:
    """Return a copy of the canonical definition for the given dimension name."""
    definition = DIMENSION_DEFINITIONS_BY_NAME.get(name)
    return dict(definition) if definition else None


def list_dimension_names() -> List[str]:
    """List all canonical dimension names."""
    return list(DIMENSION_DEFINITIONS_BY_NAME.keys())


def iter_dimension_definitions() -> List[DimensionDefinition]:
    """Return copies of all canonical dimension definitions."""
    return [dict(item) for item in DIMENSION_DEFINITIONS]


def get_default_recommendations(limit: int = 3) -> List[str]:
    """Return the default ordered list of dimension names used as fallback."""
    names: List[str] = []

    for name in DEFAULT_ANALYZE_ORDER:
        if name in DIMENSION_DEFINITIONS_BY_NAME and name not in names:
            names.append(name)
        if len(names) >= limit:
            return names[:limit]

    for name in DIMENSION_DEFINITIONS_BY_NAME:
        if name not in names:
            names.append(name)
        if len(names) >= limit:
            break

    return names[:limit]


def get_dimension_definitions_by_spread(spread_type: str) -> List[DimensionDefinition]:
    """Return all canonical definitions for a given spread type."""
    return [
        dict(item)
        for item in DIMENSION_DEFINITIONS
        if item.get("spread_type") == spread_type
    ]


def is_valid_dimension_name(name: str) -> bool:
    """Check whether the given dimension name exists in the canonical registry."""
    return name in DIMENSION_DEFINITIONS_BY_NAME
