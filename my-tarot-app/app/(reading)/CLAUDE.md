# 占卜流程路由开发指南

## 🧭 路由结构

### 占卜流程路由组
```
app/(reading)/
├── _layout.tsx          # 占卜流程布局（进度指示器 + 内容区域）
├── type.tsx            # 步骤1：选择占卜类型（离线/AI）
├── category.tsx        # 步骤2：选择占卜类别（情感/事业/健康等）
├── draw.tsx            # 步骤3：抽牌页面（三牌阵动画）
├── basic.tsx           # 步骤4：基础解读（单张牌意）
└── deep.tsx            # 步骤5：深度解读（系统分析）
```

## 📊 流程状态管理

### 占卜状态结构
```typescript
interface ReadingFlowState {
  step: number                    // 当前步骤 (1-5)
  type: 'offline' | 'ai'         // 占卜类型
  category: string               // 占卜类别
  selectedCards: SelectedCard[]  // 选择的卡牌
  interpretations: InterpretationData[] // 解读结果
  createdAt: Date               // 创建时间
}

interface SelectedCard {
  cardId: number
  position: 'past' | 'present' | 'future'
  direction: 'upright' | 'reversed'
  revealed: boolean
}
```

### 状态持久化
- **本地存储**: AsyncStorage 保存占卜状态
- **内存缓存**: React Context 实时状态
- **恢复机制**: 应用重启后可恢复占卜流程

## 🎯 每个步骤详细设计

### 步骤1：选择占卜类型 (type.tsx)

#### 页面功能
- **类型选择**: 离线占卜 vs AI占卜
- **解锁机制**: AI占卜需完成1次离线占卜
- **视觉反馈**: 选中状态高亮显示

#### 布局设计
```
┌─────────────────────────────────────┐
│  进度指示器 (步骤1/5)                │
├─────────────────────────────────────┤
│  标题：选择占卜方式                  │
├─────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐   │
│  │  离线占卜   │  │  AI占卜     │   │
│  │  📖         │  │  🤖         │   │
│  │  内置解读   │  │  [锁定]     │   │
│  └─────────────┘  └─────────────┘   │
└─────────────────────────────────────┘
```

#### 交互逻辑
```typescript
const handleTypeSelect = async (type: 'offline' | 'ai') => {
  if (type === 'ai' && !hasCompletedOfflineReading) {
    showLockedMessage()
    return
  }

  await updateReadingState({ type, step: 2 })
  router.push('/(reading)/category')
}
```

### 步骤2：选择占卜类别 (category.tsx)

#### 数据来源
从 `dimensions.json` 中提取 categories:
- 情感 (Emotional)
- 事业 (Career)
- 健康 (Health)
- 学业 (Academic)
- 人际关系 (Relationships)

#### 布局设计
```
┌─────────────────────────────────────┐
│  进度指示器 (步骤2/5)                │
├─────────────────────────────────────┤
│  标题：选择占卜主题                  │
├─────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│  │情感 │ │事业 │ │健康 │ │学业 │   │
│  │💗  │ │💼  │ │🏥  │ │📚  │   │
│  └─────┘ └─────┘ └─────┘ └─────┘   │
│  ┌─────┐ ┌─────┐                   │
│  │人际 │ │其他 │                   │
│  │🤝  │ │🔮  │                   │
│  └─────┘ └─────┘                   │
└─────────────────────────────────────┘
```

### 步骤3：抽牌页面 (draw.tsx)

#### 核心功能
- **三牌阵展示**: 过去-现在-将来布局
- **洗牌动画**: 卡牌随机重排动画
- **抽牌交互**: 点击或自动抽取3张牌
- **正逆位**: 50%概率决定每张牌的方向

#### 布局设计
```
┌─────────────────────────────────────┐
│  进度指示器 (步骤3/5)                │
├─────────────────────────────────────┤
│  标题：抽取塔罗牌                    │
├─────────────────────────────────────┤
│                                     │
│      [卡牌1]  [卡牌2]  [卡牌3]      │
│       过去     现在     将来        │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │  点击开始洗牌                    │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### 抽牌流程
```typescript
const drawCards = async () => {
  // 1. 洗牌动画
  await shuffleAnimation()

  // 2. 抽取3张牌
  const cards = selectRandomCards(3)

  // 3. 决定正逆位
  const positionedCards = cards.map((card, index) => ({
    ...card,
    position: ['past', 'present', 'future'][index],
    direction: Math.random() > 0.5 ? 'upright' : 'reversed',
    revealed: false
  }))

  await updateReadingState({
    selectedCards: positionedCards,
    step: 4
  })
}
```

### 步骤4：基础解读 (basic.tsx)

#### 解读内容
- **单张牌意**: 基于 `card_interpretations.json`
- **位置意义**: 结合牌阵位置的解读
- **关键词**: 每张牌的核心关键词

#### 布局设计
```
┌─────────────────────────────────────┐
│  进度指示器 (步骤4/5)                │
├─────────────────────────────────────┤
│  基础牌意解读                        │
├─────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐           │
│  │过去 │ │现在 │ │将来 │           │
│  │牌面 │ │牌面 │ │牌面 │           │
│  └─────┘ └─────┘ └─────┘           │
├─────────────────────────────────────┤
│  详细解读内容区域                     │
└─────────────────────────────────────┘
```

### 步骤5：深度解读 (deep.tsx)

#### 解读内容
- **维度化解读**: 基于 `card_interpretation_dimensions.json`
- **综合建议**: 三张牌的关联分析
- **行动指引**: 基于塔罗牌意的具体建议

#### 数据关联
```typescript
const getDeepInterpretation = (cards, category) => {
  // 根据选择的category匹配合适的维度
  const dimensions = getDimensionsByCategory(category)

  // 获取每张牌在特定维度下的解读
  const interpretations = cards.map(card =>
    getCardInterpretation(card.id, card.direction, dimensions)
  )

  return generateComprehensiveReading(interpretations, category)
}
```

## 🔄 页面间状态传递

### 状态管理方案
```typescript
// 使用 React Context
const ReadingContext = createContext<ReadingFlowState>()

// 状态更新函数
const useReadingFlow = () => {
  const [state, setState] = useState(defaultReadingState)

  const updateStep = (step: number) =>
    setState(prev => ({ ...prev, step }))

  const updateType = (type: 'offline' | 'ai') =>
    setState(prev => ({ ...prev, type }))

  const updateCategory = (category: string) =>
    setState(prev => ({ ...prev, category }))

  const updateCards = (cards: SelectedCard[]) =>
    setState(prev => ({ ...prev, selectedCards: cards }))

  return { state, updateStep, updateType, updateCategory, updateCards }
}
```

### 路由参数传递
```typescript
// 使用 Expo Router 的 params
const navigateWithParams = (step: number, params: any) => {
  router.push({
    pathname: `/(reading)/${getStepRoute(step)}`,
    params: { ...params, step }
  })
}
```

## 🎨 视觉设计系统

### 占卜流程主题
- **主色调**: 深蓝黑 (#0F0F1A) + 金色 (#FFD700)
- **进度指示**: 金色渐变进度条
- **卡牌样式**: 3D翻转效果，金色边框
- **背景效果**: 神秘星空粒子背景

### 动画规范
- **页面切换**: 淡入淡出 (300ms)
- **卡牌翻转**: 3D翻转 (800ms)
- **进度更新**: 平滑过渡 (500ms)
- **状态变化**: 弹性动画 (400ms)

## 🚀 使用示例

### 完整占卜流程
```typescript
// _layout.tsx
export default function ReadingLayout() {
  return (
    <ReadingProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="type" options={{ title: '选择占卜类型' }} />
        <Stack.Screen name="category" options={{ title: '选择占卜类别' }} />
        <Stack.Screen name="draw" options={{ title: '抽取塔罗牌' }} />
        <Stack.Screen name="basic" options={{ title: '基础解读' }} />
        <Stack.Screen name="deep" options={{ title: '深度解读' }} />
      </Stack>
    </ReadingProvider>
  )
}
```

### 页面跳转流程
```
首页 → 步骤1 → 步骤2 → 步骤3 → 步骤4 → 步骤5
  ↓     (type)   (category)  (draw)   (basic)   (deep)
  └──── 历史记录 ────┘
```

## 📊 错误处理

### 常见错误场景
- **数据加载失败**: 显示重试按钮
- **网络异常**: 离线模式提示
- **卡牌数据缺失**: 使用默认卡牌
- **解读数据错误**: 显示友好错误信息

### 恢复机制
- **状态恢复**: 从本地存储恢复占卜状态
- **步骤回退**: 支持返回上一步修改选择
- **重置流程**: 一键重新开始占卜流程

## 🧪 测试策略

### 单元测试
- 各步骤组件独立测试
- 状态管理逻辑测试
- 数据转换函数测试

### 集成测试
- 完整占卜流程测试
- 状态持久化测试
- 错误恢复机制测试

### UI测试
- 动画效果测试
- 响应式布局测试
- 交互反馈测试

## 📈 性能优化

### 卡牌加载优化
- 图片懒加载
- 预加载下一张卡牌
- 使用WebP格式

### 动画优化
- 硬件加速3D变换
- 避免重排重绘
- 使用requestAnimationFrame

### 内存管理
- 及时清理不需要的数据
- 图片缓存管理
- 避免内存泄漏

## 🔧 开发工具

### 调试工具
- React DevTools
- Expo Dev Client
- Flipper调试器

### 性能监控
- 页面加载时间
- 动画性能指标
- 内存使用情况

### 测试工具
- Jest单元测试
- React Native Testing Library
- Detox E2E测试

## 📋 开发检查清单

### 功能检查
- [ ] 占卜类型选择
- [ ] 占卜类别选择
- [ ] 三牌阵抽牌
- [ ] 基础解读展示
- [ ] 深度解读展示
- [ ] 状态持久化
- [ ] 错误处理
- [ ] 性能优化

### 视觉检查
- [ ] 神秘塔罗风格
- [ ] 动画流畅性
- [ ] 响应式布局
- [ ] 交互反馈
- [ ] 加载状态
- [ ] 错误提示

### 用户体验
- [ ] 直观的导航
- [ ] 清晰的提示
- [ ] 流畅的动画
- [ ] 快速的响应
- [ ] 友好的错误处理
- [ ] 状态恢复机制