# AI占卜功能实现计划

## 📋 需求分析

基于用户需求和现有系统架构，AI占卜功能具有以下特点：
1. **用户先输入问题**（最多200字）→ 调用 `/analyze` 接口获取推荐维度
2. **进入抽牌环节**，交互和基础占卜相同 → 用户抽牌后提交到 `/generate` 接口
3. **显示AI解读结果**，包含 `overall_summary` 和 `insights`

## 🔍 现有系统分析

### 后端API现状 ✅
- **已实现** `/api/v1/readings/analyze` - 分析用户描述，返回推荐维度
- **已实现** `/api/v1/readings/generate` - 基于选定维度生成多维度解读
- **数据模型完整** - 支持CardInfo、DimensionInfo、GenerateResponse等
- **LLM服务就绪** - 智谱AI + OpenAI双支持

### 前端现状分析
- **基础占卜流程** - 4步流程已完整实现（type → category → draw → basic）
- **组件库完备** - 卡牌抽取、翻转动画、拖拽交互等组件齐全
- **状态管理** - ReadingContext已建立，支持流程状态持久化
- **路由架构** - 使用Expo Router的Stack导航

### 兼容性要求
- AI占卜需与现有基础占卜完全兼容
- 复用现有的卡牌抽取和显示逻辑
- 保持统一的视觉风格和交互体验

## 🛠️ 实施方案

### 1. 新增页面架构

#### 路由结构调整
```
app/(reading)/
├── _layout.tsx          # 布局保持不变
├── type.tsx            # 修改：AI占卜变为可用
├── ai-input.tsx        # 新增：AI问题输入页
├── category.tsx        # 保持不变（仅基础占卜使用）
├── draw.tsx            # 修改：兼容两种模式
├── basic.tsx           # 保持不变（仅基础占卜使用）
└── ai-result.tsx       # 新增：AI解读结果页
```

#### 流程对比
```
基础占卜：type → category → draw → basic
AI占卜：  type → ai-input → draw → ai-result
```

### 2. 数据流设计

#### 状态管理扩展
```typescript
interface ReadingFlowState {
  step: number
  type: 'offline' | 'ai'          // 新增AI类型
  category: string
  userDescription?: string         // AI模式专用：用户问题描述
  aiDimensions?: DimensionInfo[]   // AI推荐的维度
  selectedCards: SelectedCard[]
  interpretations: any[]
  aiResult?: {                     // AI解读结果
    dimension_summaries: Record<string, string>
    overall_summary: string
    insights: string[]
  }
  createdAt: Date
  isLoading: boolean
  error: string | null
}
```

#### API服务封装
```typescript
class AIReadingService {
  async analyzeDescription(description: string, spreadType: string = "three-card") {
    // 调用 /api/v1/readings/analyze
    return await fetch('/api/v1/readings/analyze', {
      method: 'POST',
      body: JSON.stringify({ description, spread_type: spreadType })
    })
  }

  async generateAIReading(
    cards: CardInfo[],
    dimensions: DimensionInfo[],
    description: string,
    spreadType: string = "three-card"
  ) {
    // 调用 /api/v1/readings/generate
    return await fetch('/api/v1/readings/generate', {
      method: 'POST',
      body: JSON.stringify({ cards, dimensions, description, spread_type: spreadType })
    })
  }
}
```

### 3. 页面实现详情

#### 3.1 修改 type.tsx
**变更内容：**
- 将AI占卜选项从"锁定"改为"可用"
- 修改handleAISelect函数，跳转到ai-input页面
- 保持现有的视觉设计和布局

**核心逻辑：**
```typescript
const handleAISelect = () => {
  updateStep(2); // AI占卜的步骤2是问题输入
  router.push('/(reading)/ai-input');
};
```

#### 3.2 新增 ai-input.tsx
**功能职责：**
- 用户输入占卜问题（200字限制）
- 调用 `/analyze` 接口获取推荐维度
- 显示推荐维度并自动进入抽牌环节

**页面布局：**
```
┌─────────────────────────────────────┐
│  进度指示器 (步骤2/4) ●●○○           │
├─────────────────────────────────────┤
│  标题：描述您的问题                  │
├─────────────────────────────────────┤
│  ┌─────────────────────────────────┐ │
│  │  输入框 (200字限制)             │ │
│  │  请详细描述您想要占卜的问题...   │ │
│  └─────────────────────────────────┘ │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │  分析问题                       │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**实现要点：**
```typescript
const handleAnalyze = async () => {
  setLoading(true);
  try {
    const result = await aiService.analyzeDescription(userDescription);
    updateAIDimensions(result.recommended_dimensions);
    updateUserDescription(userDescription);
    updateStep(3);
    router.push('/(reading)/draw');
  } catch (error) {
    Alert.alert('分析失败', '请检查网络连接后重试');
  } finally {
    setLoading(false);
  }
};
```

#### 3.3 修改 draw.tsx
**兼容性改造：**
- 检测当前占卜类型（AI vs 基础）
- AI模式：使用aiDimensions
- 基础模式：使用现有dimensions逻辑
- 保持抽牌交互和视觉效果不变

**关键修改点：**
```typescript
const loadDimensions = async () => {
  if (state.type === 'ai' && state.aiDimensions) {
    // AI模式：使用推荐的维度
    const sortedDimensions = [...state.aiDimensions].sort((a, b) => a.aspect_type - b.aspect_type);
    setDimensions(sortedDimensions.slice(0, 3));
  } else {
    // 基础模式：使用原有逻辑
    // ... 现有代码保持不变
  }
};

const handleContinue = () => {
  updateCards(drawnCards);
  updateStep(4);

  if (state.type === 'ai') {
    router.push('/(reading)/ai-result');
  } else {
    router.push('/(reading)/basic');
  }
};
```

#### 3.4 新增 ai-result.tsx
**功能职责：**
- 调用 `/generate` 接口获取AI解读
- 显示多维度解读结果
- 展示overall_summary和insights
- 支持保存到历史记录

**页面布局：**
```
┌─────────────────────────────────────┐
│  进度指示器 (步骤4/4) ●●●●           │
├─────────────────────────────────────┤
│  AI塔罗解读                         │
├─────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐           │
│  │牌面1│ │牌面2│ │牌面3│           │
│  │维度1│ │维度2│ │维度3│           │
│  └─────┘ └─────┘ └─────┘           │
├─────────────────────────────────────┤
│  【各维度解读】                      │
│  维度1解读内容...                   │
│  维度2解读内容...                   │
│  维度3解读内容...                   │
├─────────────────────────────────────┤
│  【综合分析】                       │
│  overall_summary内容...             │
├─────────────────────────────────────┤
│  【关键洞察】                       │
│  • insight 1                       │
│  • insight 2                       │
│  • insight 3                       │
├─────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐   │
│  │  保存记录   │ │  重新占卜   │   │
│  └─────────────┘ └─────────────┘   │
└─────────────────────────────────────┘
```

**核心实现：**
```typescript
const generateAIReading = async () => {
  setLoading(true);
  try {
    const cardInfos = state.selectedCards.map(card => ({
      id: card.cardId,
      name: card.name,
      arcana: 'Major', // 从卡牌数据获取
      number: card.cardId,
      direction: card.direction === 'upright' ? '正位' : '逆位',
      position: card.position
    }));

    const result = await aiService.generateAIReading(
      cardInfos,
      state.aiDimensions,
      state.userDescription
    );

    updateAIResult(result);
  } catch (error) {
    Alert.alert('生成解读失败', '请检查网络连接后重试');
  } finally {
    setLoading(false);
  }
};
```

### 4. 技术实现要点

#### 4.1 Context状态扩展
```typescript
// 在ReadingContext中新增AI相关方法
const useReadingFlow = () => {
  const updateUserDescription = (description: string) =>
    setState(prev => ({ ...prev, userDescription: description }));

  const updateAIDimensions = (dimensions: DimensionInfo[]) =>
    setState(prev => ({ ...prev, aiDimensions: dimensions }));

  const updateAIResult = (result: any) =>
    setState(prev => ({ ...prev, aiResult: result }));

  return {
    // 现有方法...
    updateUserDescription,
    updateAIDimensions,
    updateAIResult
  };
};
```

#### 4.2 API错误处理
```typescript
class APIErrorHandler {
  static handle(error: any, context: string) {
    console.error(`${context} error:`, error);

    if (error.code === 'NETWORK_ERROR') {
      return '网络连接失败，请检查网络设置';
    } else if (error.status === 500) {
      return 'AI服务暂时不可用，请稍后重试';
    } else {
      return '未知错误，请重试';
    }
  }
}
```

#### 4.3 历史记录兼容
```typescript
interface HistoryRecord {
  id: string;
  type: 'offline' | 'ai';
  timestamp: Date;
  cards: SelectedCard[];

  // 基础占卜字段
  category?: string;
  basicInterpretations?: any[];

  // AI占卜字段
  userDescription?: string;
  aiResult?: {
    dimension_summaries: Record<string, string>;
    overall_summary: string;
    insights: string[];
  };
}
```

## 📋 实施步骤

### 阶段1：基础框架搭建
1. **扩展ReadingContext** - 添加AI占卜相关状态和方法
2. **创建AIReadingService** - 封装后端API调用
3. **修改type.tsx** - 启用AI占卜选项

### 阶段2：核心页面开发
4. **创建ai-input.tsx** - 问题输入和维度分析页面
5. **修改draw.tsx** - 兼容AI和基础两种模式
6. **创建ai-result.tsx** - AI解读结果展示页面

### 阶段3：集成和测试
7. **更新路由配置** - 在_layout.tsx中注册新页面
8. **扩展历史记录** - 支持AI占卜记录存储
9. **端到端测试** - 完整流程功能验证

### 阶段4：优化和完善
10. **错误处理优化** - 网络异常、API失败等场景
11. **加载状态优化** - 改善用户等待体验
12. **性能测试** - LLM调用响应时间优化

## ⚠️ 风险控制

### 技术风险
- **API响应时间** - LLM调用可能较慢，需要合适的加载状态
- **网络依赖** - AI功能需要网络，要有友好的离线提示
- **状态复杂度** - 两种占卜模式的状态管理需要仔细设计

### 缓解措施
- 设置合理的超时时间和重试机制
- 提供清晰的加载进度指示
- 充分的错误处理和用户提示
- 保持与基础占卜的完全兼容

## 🎯 验收标准

### 功能验收
- [ ] AI占卜完整流程可用（输入问题→抽牌→查看解读）
- [ ] 与基础占卜功能完全兼容，互不影响
- [ ] API调用正确，数据显示完整
- [ ] 历史记录正确保存AI占卜结果

### 用户体验验收
- [ ] 界面风格与现有设计保持一致
- [ ] 加载状态友好，错误提示清晰
- [ ] 流程切换顺畅，无卡顿现象
- [ ] 支持返回和重新开始功能

### 性能验收
- [ ] AI分析响应时间 < 10秒
- [ ] 页面切换动画流畅
- [ ] 内存使用稳定，无泄漏
- [ ] 离线模式下基础功能不受影响

---

**实施原则**：循序渐进，保持兼容，注重体验，确保质量