import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CardFlipAnimation } from './CardFlipAnimation';

interface DimensionData {
  id: number;
  name: string;
  category: string;
  description: string;
  aspect: string;
  aspect_type: number;
}

interface DrawnCard {
  cardId: number;
  name: string;
  imageUrl: string;
  position: string;
  dimension: DimensionData;
  direction: 'upright' | 'reversed';
  revealed: boolean;
  basicSummary?: string;
}

interface CardSlotProps {
  dimension: DimensionData;
  slotIndex: number;
  droppedCard?: DrawnCard;
  isHighlighted: boolean;
  onCardPress?: (card: DrawnCard) => void;
  canTriggerStars?: boolean; // 新增：控制特效触发
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
// 根据屏幕尺寸动态调整卡槽大小，考虑多个卡槽的布局
const SLOT_WIDTH = Math.min(screenWidth * 0.28, 120); // 调整为更合适的比例
const SLOT_HEIGHT = SLOT_WIDTH * 1.6; // 稍微调整宽高比

export function CardSlot({
  dimension,
  slotIndex,
  droppedCard,
  isHighlighted,
  onCardPress,
  canTriggerStars = false, // 新增：默认值为false
}: CardSlotProps) {

  const renderEmptySlot = () => (
    <LinearGradient
      colors={isHighlighted ?
        ['rgba(255, 215, 0, 0.4)', 'rgba(255, 215, 0, 0.2)'] :
        ['rgba(255, 215, 0, 0.1)', 'rgba(22, 33, 62, 0.3)']
      }
      style={[
        styles.slotContent,
        isHighlighted && styles.highlightedSlot
      ]}
    >
      <View style={styles.slotInfo}>
        {/* 移除维度名称，只显示aspect */}
        <Text style={[styles.dimensionAspect, isHighlighted && styles.highlightedAspect]}>
          {dimension.aspect}
        </Text>
        <Text style={[styles.dragHint, isHighlighted && styles.highlightedHint]}>
          {isHighlighted ? '松开放置卡牌' : '拖拽卡牌到此处'}
        </Text>
      </View>
    </LinearGradient>
  );

  const renderFilledSlot = () => (
    <View style={styles.filledSlotContainer}>
      <CardFlipAnimation
        card={{
          id: droppedCard!.cardId,
          name: droppedCard!.name,
          imageUrl: droppedCard!.imageUrl,
          direction: droppedCard!.direction,
          revealed: true,
        }}
        onPress={() => onCardPress?.(droppedCard!)}
        showName={true}
        isInSlot={true}
        canTriggerStars={canTriggerStars} // 传递特效触发状态
      />
      <View style={styles.slotLabel}>
        <Text style={styles.slotLabelText}>{dimension.aspect}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.slot}>
        {droppedCard ? renderFilledSlot() : renderEmptySlot()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: SLOT_WIDTH,
    marginHorizontal: 4, // 缩小卡槽间距
  },
  slot: {
    width: SLOT_WIDTH,
    height: SLOT_HEIGHT,
    borderRadius: 16, // 稍微增大圆角
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFD700',
    elevation: 5, // 增加阴影效果
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  slotContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  highlightedSlot: {
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    elevation: 8,
  },
  slotInfo: {
    alignItems: 'center',
  },
  // dimensionName 样式已移除 - 不再显示维度名称
  dimensionAspect: {
    fontSize: 14,  // 增大字体因为现在是主要文字
    color: '#FFD700',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  dragHint: {
    fontSize: 9,
    color: '#888888',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 12,
  },
  filledSlotContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 6, // 进一步缩小内边距
    paddingTop: 8, // 缩小顶部间距
    paddingBottom: 6,
  },
  slotLabel: {
    marginTop: 4, // 缩小标签与卡牌的间距
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 6,
    minWidth: '70%', // 进一步适应紧凑布局
    alignItems: 'center',
  },
  slotLabelText: {
    fontSize: 10, // 适应较小尺寸的字体
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.3, // 适中的字母间距
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2, // 稍小的阴影半径
  },
  highlightedText: {
    color: '#FFFFFF',
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  highlightedAspect: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  highlightedHint: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 9,
  },
});