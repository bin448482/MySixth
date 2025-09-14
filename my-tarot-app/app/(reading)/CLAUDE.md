# 占卜流程路由开发指南

## 🧭 路由结构

### 占卜流程路由组（离线占卜 - 4步流程）
```
app/(reading)/
├── _layout.tsx          # 占卜流程布局（4步进度指示器 + 内容区域）
├── type.tsx            # 步骤1：选择占卜类型（仅离线，AI为未来功能）
├── category.tsx        # 步骤2：选择占卜类别（情感/事业/健康等）
├── draw.tsx            # 步骤3：抽牌页面（三牌阵动画，使用本地图片）
└── basic.tsx           # 步骤4：基础解读（流程结束）
```

## 📊 流程状态管理

### 占卜状态结构
```typescript
interface ReadingFlowState {
  step: number                    // 当前步骤 (1-4，离线占卜4步流程)
  type: 'offline'                 // 占卜类型（当前仅支持离线）
  category: string                // 占卜类别
  selectedCards: SelectedCard[]   // 选择的卡牌
  interpretations: InterpretationData[] // 解读结果
  createdAt: Date                 // 创建时间
  isLoading: boolean              // 加载状态
  error: string | null            // 错误信息
}

interface SelectedCard {
  cardId: number
  position: 'past' | 'present' | 'future'
  direction: 'upright' | 'reversed'
  revealed: boolean
  imageUrl: string                // 本地图片路径
}

interface CardData {
  name: string
  arcana: string
  suit: string | null
  number: number
  image_url: string               // 来自cards表的相对路径
  style_name: string
  deck: string
}
```

### 状态持久化
- **本地存储**: AsyncStorage 保存占卜状态
- **内存缓存**: React Context 实时状态
- **恢复机制**: 应用重启后可恢复占卜流程
- **图片加载**: 通过 require() 加载本地塔罗牌图片

## 🖼️ 塔罗牌图片资源

### 图片目录结构
```
assets/images/
├── major/                      # 22张大阿卡纳
│   ├── 00-fool.jpg
│   ├── 01-magician.jpg
│   ├── ...
│   └── 21-world.jpg
└── minor/                      # 56张小阿卡纳
    ├── cups/                   # 圣杯套牌
    ├── pentacles/              # 钱币套牌
    ├── swords/                 # 宝剑套牌
    └── wands/                  # 权杖套牌
```

### 图片加载逻辑
```typescript
const card = cardsData.find(c => c.id === cardId)
const imageUrl = card.image_url  // 如 "major/00-fool.jpg"

// 加载本地图片
const getCardImage = (imageUrl: string) => {
  try {
    return require(`../assets/images/${imageUrl}`)
  } catch (error) {
    console.warn(`Failed to load image: ${imageUrl}`)
    return require('../assets/images/card-back.jpg') // 默认卡背
  }
}
```

## 🎯 每个步骤详细设计

### 步骤1：选择占卜类型 (type.tsx)

#### 页面功能
- **类型选择**: 离线占卜（当前唯一可用选项）
- **AI占卜**: 显示为"即将推出"，点击显示提示信息
- **视觉反馈**: 选中状态高亮显示

#### 布局设计
```
┌─────────────────────────────────────┐
│  进度指示器 (步骤1/4) ●○○○           │
├─────────────────────────────────────┤
│  标题：选择占卜方式                  │
├─────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐   │
│  │  离线占卜   │  │  AI占卜     │   │
│  │  📖         │  │  🤖         │   │
│  │  内置解读   │  │  即将推出   │   │
│  │  [可用]     │  │  [锁定]     │   │
│  └─────────────┘  └─────────────┘   │
└─────────────────────────────────────┘
```

#### 交互逻辑
```typescript
const handleTypeSelect = async (type: 'offline') => {
  // 当前仅支持离线占卜
  await updateReadingState({ type: 'offline', step: 2 })
  router.push('/(reading)/category')
}

const handleAIClick = () => {
  // AI占卜提示
  Alert.alert(
    'AI占卜功能',
    '智能塔罗牌解读功能即将推出，敬请期待！',
    [{ text: '了解', style: 'default' }]
  )
}
```

### 步骤2：选择占卜类别 (category.tsx)

#### 数据来源
从数据库表 `dimension` 中提取不同的 categories：
- 情感 (Emotional)
- 事业 (Career)
- 健康 (Health)
- 学业 (Academic)
- 人际关系 (Relationships)
- 其他类别

#### 类别获取逻辑
```typescript
const getAvailableCategories = async () => {
  const dimensions = await loadDimensionsFromDB()

  // 从维度数据中提取唯一的categories
  const uniqueCategories = [...new Set(dimensions.map(d => d.category))]

  // 过滤出主要类别（排除带"-"的子类别）
  const mainCategories = uniqueCategories.filter(cat => !cat.includes('-'))

  return mainCategories.map(category => ({
    id: category,
    name: getCategoryDisplayName(category),
    icon: getCategoryIcon(category),
    color: getCategoryColor(category)
  }))
}
```

#### 布局设计
```
┌─────────────────────────────────────┐
│  进度指示器 (步骤2/4) ●●○○           │
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
- **三牌阵展示**: 3个位置分别代表3个维度（使用dimensions表的aspect显示）
- **洗牌动画**: 卡牌随机重排动画
- **抽牌交互**: 点击或自动抽取3张牌
- **正逆位显示**: 正位图片正常显示，逆位图片旋转180度
- **牌面交互**: 点击牌面可查看基础牌意（card_interpretations表的summary）

#### 布局设计
```
┌─────────────────────────────────────┐
│  进度指示器 (步骤3/4) ●●●○           │
├─────────────────────────────────────┤
│  标题：抽取塔罗牌                    │
├─────────────────────────────────────┤
│                                     │
│    [卡牌1]    [卡牌2]    [卡牌3]    │
│   [维度1]    [维度2]    [维度3]    │
│  (aspect1)   (aspect2)  (aspect3)   │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │  点击开始抽牌                  │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### 抽牌流程
```typescript
const drawCards = async () => {
  setIsLoading(true)

  // 1. 根据选择的category获取对应的3个维度
  const categoryDimensions = await getDimensionsByCategory(selectedCategory)
  // 按aspect_type排序：1(过去), 2(现在), 3(将来)
  const sortedDimensions = categoryDimensions.sort((a, b) => a.aspect_type - b.aspect_type)

  // 2. 洗牌动画
  await shuffleAnimation()

  // 3. 从78张牌中随机抽取3张
  const allCards = await loadCardsData()
  const shuffled = [...allCards].sort(() => Math.random() - 0.5)
  const drawnCards = shuffled.slice(0, 3)

  // 4. 分配到3个位置，每个位置对应一个维度
  const positionedCards = drawnCards.map((card, index) => ({
    cardId: card.id,
    name: card.name,
    imageUrl: card.image_url,
    position: sortedDimensions[index].aspect,  // 过去/现在/将来
    dimension: sortedDimensions[index],
    direction: Math.random() > 0.5 ? 'upright' : 'reversed',
    revealed: false
  }))

  await updateReadingState({
    selectedCards: positionedCards,
    step: 4
  })

  setIsLoading(false)
  router.push('/(reading)/basic')
}

// 点击牌面显示基础牌意
const showCardMeaning = async (card) => {
  const interpretation = await getCardInterpretation(card.name, card.direction)
  Alert.alert(
    `${card.name} (${card.direction})`,
    interpretation?.summary || '暂无解读'
  )
}
```

### 步骤4：基础解读 (basic.tsx) - 流程终点

#### 解读内容
- **详细解读**: 显示 card_interpretation_dimensions表 中的 content
- **匹配条件**: 根据 card_name, direction, dimension_name, dimension_category, aspect_type 进行精确匹配
- **布局展示**: 每张牌显示其在对应维度下的详细解读内容
- **完成按钮**: 保存到历史记录，返回首页

#### 布局设计
```
┌─────────────────────────────────────┐
│  进度指示器 (步骤4/4) ●●●●           │
├─────────────────────────────────────┤
│  基础牌意解读                        │
├─────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐           │
│  │牌面1│ │牌面2│ │牌面3│           │
│  │维度1│ │维度2│ │维度3│           │
│  └─────┘ └─────┘ └─────┘           │
├─────────────────────────────────────┤
│  详细解读内容区域                     │
│  维度1: [aspect] - [card_name] [direction]  │
│  [来自card_interpretation_dimensions的content] │
│                                     │
│  维度2: [aspect] - [card_name] [direction]  │
│  [content]                          │
│                                     │
│  维度3: [aspect] - [card_name] [direction]  │
│  [content]                          │
├─────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐   │
│  │  保存记录   │ │  重新占卜   │   │
│  └─────────────┘ └─────────────┘   │
└─────────────────────────────────────┘
```

#### 数据获取逻辑
```typescript
const getDetailedInterpretation = async (card, dimension) => {
  const interpretations = await loadCardInterpretationDimensions()

  // 精确匹配所有条件
  return interpretations.find(item =>
    item.card_name === card.name &&
    item.direction === card.direction &&
    item.dimension_name === dimension.name &&
    item.dimension_category === dimension.category &&
    item.aspect_type === dimension.aspect_type
  )
}

const generateDetailedReading = async (selectedCards: SelectedCard[]) => {
  const readings = await Promise.all(
    selectedCards.map(async card => {
      const detailedInterpretation = await getDetailedInterpretation(card, card.dimension)

      return {
        ...card,
        interpretation: {
          summary: card.basicSummary, // 来自card_interpretations表
          detailedContent: detailedInterpretation?.content || '暂无详细解读',
          dimension: card.dimension
        }
      }
    })
  )

  // 保存到历史记录
  await saveToHistory({
    cards: selectedCards,
    category: selectedCategory,
    interpretations: readings,
    timestamp: new Date(),
    type: 'offline'
  })

  return readings
}

// 完成占卜，返回首页
const completeReading = async () => {
  await resetReadingState()
  router.replace('/(tabs)/')
}
```

## 🔄 页面间状态传递

### 状态管理方案
```typescript
// 使用 React Context
const ReadingContext = createContext<ReadingFlowState>()

// 更新的状态结构
interface SelectedCard {
  cardId: number
  name: string
  imageUrl: string
  position: string                    // 维度的aspect
  dimension: DimensionData           // 完整的维度信息
  direction: 'upright' | 'reversed'
  revealed: boolean
  basicSummary?: string              // 来自card_interpretations表
}

interface DimensionData {
  name: string
  category: string
  description: string
  aspect: string
  aspect_type: number                // 1,2,3分别对应第一、二、三个位置
}

// 状态更新函数
const useReadingFlow = () => {
  const [state, setState] = useState(defaultReadingState)

  const updateStep = (step: number) =>
    setState(prev => ({ ...prev, step }))

  const updateCategory = (category: string) =>
    setState(prev => ({ ...prev, category }))

  const updateCards = (cards: SelectedCard[]) =>
    setState(prev => ({ ...prev, selectedCards: cards }))

  return { state, updateStep, updateCategory, updateCards }
}
```

### 页面跳转流程（4步离线占卜）
```
首页 → 步骤1 → 步骤2 → 步骤3 → 步骤4 → [完成/返回首页]
  ↓     (type)   (category)  (draw)   (basic)
  └──── 历史记录 ────┘
```

### 进度指示器状态
- **步骤1/4**: ●○○○ (25%) - 选择占卜类型
- **步骤2/4**: ●●○○ (50%) - 选择占卜类别
- **步骤3/4**: ●●●○ (75%) - 抽牌并查看基础牌意
- **步骤4/4**: ●●●● (100%) - 查看详细解读，流程完成

### 数据匹配逻辑
1. **步骤2**: 选择类别 → 获取该类别下的维度数据
2. **步骤3**: 根据aspect_type(1,2,3)排序维度 → 分配给3个位置
3. **步骤3**: 点击牌面 → 显示card_interpretations表的summary
4. **步骤4**: 详细解读 → 根据card_name+direction+dimension精确匹配content

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
      </Stack>
    </ReadingProvider>
  )
}
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