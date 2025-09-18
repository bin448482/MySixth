# 步骤3拖拽功能实现方案

## 🎯 功能设计概述

### 核心交互流程
1. **洗牌阶段**: 显示一副牌背朝上的卡牌
2. **翻牌阶段**: 用户点击卡牌，随机翻出3张牌（保持现有逻辑）
3. **拖拽阶段**: 翻开的3张牌可以被拖拽到对应的卡槽
4. **绑定完成**: 每个卡槽对应一个dimension，放置后自动绑定

### 用户体验目标
- 直观的拖放交互
- 流畅的动画反馈
- 清晰的视觉指引
- 容错和恢复机制

## 🏗️ 技术架构

### 1. 依赖库
```json
{
  "react-native-gesture-handler": "~2.28.0",  // 已安装
  "react-native-reanimated": "~4.1.0"        // 已安装
}
```

### 2. 新增组件结构
```
components/reading/
├── CardSlot.tsx           # 卡槽组件
├── DraggableCard.tsx      # 可拖拽卡牌组件
├── DragDropContainer.tsx  # 拖拽容器
└── SlotIndicator.tsx      # 卡槽指示器
```

### 3. 核心组件设计

#### CardSlot.tsx - 卡槽组件
```typescript
interface CardSlotProps {
  dimension: DimensionData;
  slotIndex: number;
  droppedCard?: DrawnCard;
  isHighlighted: boolean;
  onDrop: (cardId: number, slotIndex: number) => void;
}
```

**功能特性:**
- 显示dimension信息（name, aspect）
- 接收拖拽事件
- 悬停高亮效果
- 已放置卡牌显示

#### DraggableCard.tsx - 可拖拽卡牌
```typescript
interface DraggableCardProps extends CardFlipAnimationProps {
  isDraggable: boolean;
  onDragStart: (cardId: number) => void;
  onDragEnd: (cardId: number, dropZone?: number) => void;
  slotIndex?: number; // 已放置的卡槽索引
}
```

**功能特性:**
- 继承现有CardFlipAnimation
- 支持拖拽手势
- 拖拽状态视觉反馈
- 放置动画

#### DragDropContainer.tsx - 拖拽容器
```typescript
interface DragDropContainerProps {
  dimensions: DimensionData[];
  drawnCards: DrawnCard[];
  onCardPlacement: (cardId: number, slotIndex: number) => void;
  onAllCardsPlaced: () => void;
}
```

**功能特性:**
- 管理整体拖拽状态
- 碰撞检测
- 布局管理
- 完成状态检查

## 🎨 UI/UX 设计

### 1. 布局设计
```
┌─────────────────────────────────────┐
│  进度指示器 (步骤3/4) ●●●○           │
├─────────────────────────────────────┤
│  标题：将卡牌拖拽到对应位置           │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │ 卡槽1   │ │ 卡槽2   │ │ 卡槽3   │ │
│  │         │ │         │ │          │ │
│  │dimension│ │dimension│ │dimension│ │
│  └─────────┘ └─────────┘ └─────────┘ │
│                                     │
│    [卡牌1]    [卡牌2]    [卡牌3]    │
│   (可拖拽)   (可拖拽)   (可拖拽)    │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │  全部放置完成后显示此按钮        │ │
│  │  [查看解读]                    │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 2. 卡槽设计规范

#### 空状态
```typescript
const emptySlotStyle = {
  borderStyle: 'dashed',
  borderWidth: 2,
  borderColor: '#FFD700',
  backgroundColor: 'rgba(255, 215, 0, 0.1)',
  borderRadius: 12,
  padding: 16,
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 120,
}
```

#### 悬停状态
```typescript
const highlightedSlotStyle = {
  ...emptySlotStyle,
  borderColor: '#FFD700',
  backgroundColor: 'rgba(255, 215, 0, 0.2)',
  shadowColor: '#FFD700',
  shadowOpacity: 0.4,
  shadowRadius: 8,
  elevation: 4,
}
```

#### 已放置状态
```typescript
const filledSlotStyle = {
  borderStyle: 'solid',
  borderWidth: 2,
  borderColor: '#FFD700',
  backgroundColor: '#16213E',
  borderRadius: 12,
  padding: 8,
}
```

### 3. 拖拽视觉反馈

#### 拖拽开始
- 卡牌轻微放大（scale: 1.05）
- 增加阴影效果
- 其他卡牌轻微淡化

#### 拖拽进行中
- 卡牌跟随手指移动
- 半透明效果（opacity: 0.8）
- 可放置的卡槽高亮显示

#### 放置成功
- 弹性动画归位到卡槽中心
- 成功反馈（轻微震动）
- 卡槽状态变为已填充

#### 放置失败
- 弹回原始位置
- 错误反馈提示

## 🔧 技术实现细节

### 1. 手势处理
```typescript
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

const DraggableCard = ({ card, onDrop, ...props }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      scale.value = withSpring(1.05);
    },
    onActive: (event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    },
    onEnd: () => {
      // 检查是否在卡槽范围内
      const dropZone = checkDropZone(translateX.value, translateY.value);
      if (dropZone !== -1) {
        // 成功放置
        runOnJS(onDrop)(card.cardId, dropZone);
      }

      // 重置位置
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={animatedStyle}>
        <CardFlipAnimation card={card} {...props} />
      </Animated.View>
    </PanGestureHandler>
  );
};
```

### 2. 碰撞检测算法
```typescript
const checkDropZone = (x: number, y: number, slotPositions: SlotPosition[]) => {
  for (let i = 0; i < slotPositions.length; i++) {
    const slot = slotPositions[i];
    if (
      x >= slot.x - slot.width / 2 &&
      x <= slot.x + slot.width / 2 &&
      y >= slot.y - slot.height / 2 &&
      y <= slot.y + slot.height / 2
    ) {
      return i; // 返回卡槽索引
    }
  }
  return -1; // 未找到匹配的卡槽
};
```

### 3. 状态管理
```typescript
interface DragDropState {
  draggedCard: number | null;
  cardPlacements: { [cardId: number]: number }; // cardId -> slotIndex
  highlightedSlot: number | null;
  allCardsPlaced: boolean;
}

const useDragDropState = (cards: DrawnCard[], dimensions: DimensionData[]) => {
  const [state, setState] = useState<DragDropState>({
    draggedCard: null,
    cardPlacements: {},
    highlightedSlot: null,
    allCardsPlaced: false,
  });

  const handleCardDrop = (cardId: number, slotIndex: number) => {
    const newPlacements = { ...state.cardPlacements, [cardId]: slotIndex };
    const allPlaced = Object.keys(newPlacements).length === cards.length;

    setState(prev => ({
      ...prev,
      cardPlacements: newPlacements,
      allCardsPlaced: allPlaced,
      draggedCard: null,
      highlightedSlot: null,
    }));

    if (allPlaced) {
      // 触发完成回调
      onAllCardsPlaced();
    }
  };

  return { state, handleCardDrop };
};
```

## 🔄 draw.tsx 修改方案

### 1. 新增状态管理
```typescript
// 在现有状态基础上新增
const [dragDropEnabled, setDragDropEnabled] = useState(false);
const [cardPlacements, setCardPlacements] = useState<{[cardId: number]: number}>({});
const [allCardsPlaced, setAllCardsPlaced] = useState(false);
```

### 2. 修改抽牌流程
```typescript
const handleDrawCards = async () => {
  // ... 现有抽牌逻辑保持不变

  // 抽牌完成后启用拖拽
  setDrawnCards(cardsWithInterpretation);
  setDragDropEnabled(true); // 新增：启用拖拽模式
};
```

### 3. 新增布局组件
```typescript
const renderDragDropInterface = () => {
  if (!dragDropEnabled) return null;

  return (
    <DragDropContainer
      dimensions={dimensions}
      drawnCards={drawnCards}
      onCardPlacement={handleCardPlacement}
      onAllCardsPlaced={() => setAllCardsPlaced(true)}
    />
  );
};

const handleCardPlacement = (cardId: number, slotIndex: number) => {
  // 更新卡牌-卡槽绑定关系
  setCardPlacements(prev => ({ ...prev, [cardId]: slotIndex }));

  // 更新drawnCards中的dimension绑定
  setDrawnCards(prev => prev.map(card =>
    card.cardId === cardId
      ? { ...card, dimension: dimensions[slotIndex] }
      : card
  ));
};
```

### 4. 条件渲染逻辑
```typescript
return (
  <ScrollView contentContainerStyle={styles.container}>
    {/* 头部保持不变 */}

    {/* 维度显示区域 */}
    {!dragDropEnabled && (
      <View style={styles.dimensionsContainer}>
        {/* 现有维度显示逻辑 */}
      </View>
    )}

    {/* 拖拽界面 */}
    {dragDropEnabled && (
      <DragDropContainer
        dimensions={dimensions}
        drawnCards={drawnCards}
        onCardPlacement={handleCardPlacement}
        onAllCardsPlaced={() => setAllCardsPlaced(true)}
      />
    )}

    {/* 原有卡牌显示区域 - 在拖拽模式下隐藏 */}
    {!dragDropEnabled && (
      <View style={styles.cardsContainer}>
        {/* 现有卡牌显示逻辑 */}
      </View>
    )}

    {/* 按钮区域 */}
    <View style={styles.actionsContainer}>
      {drawnCards.length === 0 ? (
        <TouchableOpacity onPress={handleDrawCards}>
          <Text>开始抽牌</Text>
        </TouchableOpacity>
      ) : !allCardsRevealed && !dragDropEnabled ? (
        <TouchableOpacity onPress={handleRevealAll}>
          <Text>全部翻开</Text>
        </TouchableOpacity>
      ) : allCardsPlaced ? ( // 新增条件
        <TouchableOpacity onPress={handleContinue}>
          <Text>查看解读</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  </ScrollView>
);
```

## 📱 响应式适配

### 1. 屏幕尺寸适配
```typescript
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const getLayoutConfig = () => {
  if (screenWidth < 375) {
    // 小屏幕（iPhone SE等）
    return {
      slotWidth: screenWidth * 0.28,
      slotHeight: 100,
      cardSpacing: 8,
      topSpacing: 40,
    };
  } else if (screenWidth < 414) {
    // 中等屏幕
    return {
      slotWidth: screenWidth * 0.3,
      slotHeight: 120,
      cardSpacing: 12,
      topSpacing: 60,
    };
  } else {
    // 大屏幕
    return {
      slotWidth: screenWidth * 0.3,
      slotHeight: 140,
      cardSpacing: 16,
      topSpacing: 80,
    };
  }
};
```

### 2. 平台差异处理
```typescript
import { Platform } from 'react-native';

const platformStyles = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  android: {
    elevation: 8,
  },
  default: {},
});
```

## 🧪 测试策略

### 1. 单元测试
- 碰撞检测算法测试
- 状态管理逻辑测试
- 动画配置测试

### 2. 集成测试
- 完整拖拽流程测试
- 不同屏幕尺寸测试
- 手势冲突测试

### 3. 用户体验测试
- 拖拽响应速度测试
- 动画流畅度测试
- 错误恢复机制测试

## 🚀 性能优化

### 1. 动画优化
- 使用原生驱动（useNativeDriver: true）
- 避免JS线程阻塞
- 合理设置动画帧率

### 2. 手势优化
- 合理设置手势识别阈值
- 防止过度灵敏的触发
- 优化touch事件处理

### 3. 渲染优化
- 使用React.memo优化重渲染
- 合理使用useCallback和useMemo
- 避免不必要的状态更新

## 🔧 降级方案

### 如果拖拽功能异常
1. **点击分配模式**: 点击卡牌然后点击卡槽完成绑定
2. **自动分配模式**: 按照抽牌顺序自动分配到三个位置
3. **错误提示**: 清晰的错误信息和重试选项

### 兼容性考虑
- 低版本设备的手势处理
- 不同Android厂商的差异
- iOS和Android的动画差异

## 📝 开发计划

### Phase 1: 基础组件 (1-2天)
- [ ] CardSlot组件开发
- [ ] DraggableCard组件开发
- [ ] 基础手势处理

### Phase 2: 集成拖拽 (1-2天)
- [ ] DragDropContainer开发
- [ ] draw.tsx集成修改
- [ ] 碰撞检测实现

### Phase 3: 视觉优化 (1天)
- [ ] 动画效果完善
- [ ] 视觉反馈优化
- [ ] 响应式适配

### Phase 4: 测试优化 (1天)
- [ ] 功能测试
- [ ] 性能优化
- [ ] 错误处理完善

## 💡 后续扩展可能

1. **多点触控**: 支持同时拖拽多张卡牌
2. **手势增强**: 支持双击、长按等操作
3. **动画库**: 集成更丰富的动画效果
4. **音效反馈**: 添加拖拽音效
5. **触觉反馈**: 利用设备震动功能