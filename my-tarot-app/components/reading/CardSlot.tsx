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
}

const { width: screenWidth } = Dimensions.get('window');
const SLOT_WIDTH = Math.min(screenWidth * 0.28, 110);
const SLOT_HEIGHT = SLOT_WIDTH * 1.6;

export function CardSlot({
  dimension,
  slotIndex,
  droppedCard,
  isHighlighted,
  onCardPress,
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
        <Text style={[styles.dimensionName, isHighlighted && styles.highlightedText]} numberOfLines={2}>
          {dimension.name}
        </Text>
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
      />
      <View style={styles.slotLabel}>
        <Text style={styles.slotLabelText}>{dimension.aspect}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { width: SLOT_WIDTH }]}>
      <View style={[styles.slot, { height: SLOT_HEIGHT }]}>
        {droppedCard ? renderFilledSlot() : renderEmptySlot()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 4,
  },
  slot: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFD700',
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
  dimensionName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 4,
  },
  dimensionAspect: {
    fontSize: 10,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 8,
  },
  dragHint: {
    fontSize: 8,
    color: '#888888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  filledSlotContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 4,
  },
  slotLabel: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 8,
  },
  slotLabelText: {
    fontSize: 9,
    color: '#FFD700',
    fontWeight: 'bold',
    textAlign: 'center',
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