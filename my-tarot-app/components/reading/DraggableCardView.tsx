import React from 'react';
import { Image } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getCardImage } from '@/lib/utils/cardImages';

interface DraggableCardViewProps {
  card: {
    id: number;
    name: string;
    imageUrl: string;
    direction: 'upright' | 'reversed';
    revealed: boolean;
  };
  showName?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = Math.min(screenWidth * 0.25, 120);
const CARD_HEIGHT = CARD_WIDTH * 1.7;

export function DraggableCardView({
  card,
  showName = false,
}: DraggableCardViewProps) {
  // 逆位旋转
  const cardRotation = card.direction === 'reversed' ? '180deg' : '0deg';

  // 获取卡牌图片资源
  const cardImageSource = getCardImage(card.imageUrl);

  return (
    <View style={[styles.cardContainer, { width: CARD_WIDTH, height: CARD_HEIGHT }]}>
      {/* 卡牌正面 */}
      <View
        style={[
          styles.card,
          styles.cardFront,
          { transform: [{ rotate: cardRotation }] },
        ]}
      >
        <LinearGradient
          colors={['#16213E', '#0F0F1A']}
          style={styles.cardFrontGradient}
        >
          <View style={styles.cardImageContainer}>
            <Image
              source={cardImageSource}
              style={styles.cardImage}
              resizeMode="cover"
            />
          </View>
          {showName && (
            <Text style={styles.cardTitle} numberOfLines={2}>{card.name}</Text>
          )}
          {card.direction === 'reversed' && (
            <Text style={styles.directionLabel}>逆位</Text>
          )}
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    position: 'relative',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  cardFront: {
    backgroundColor: '#16213E',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  cardFrontGradient: {
    flex: 1,
    borderRadius: 12,
    padding: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 120,
  },
  cardImage: {
    width: CARD_WIDTH - 16,
    height: CARD_HEIGHT - 40,
    borderRadius: 8,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 4,
  },
  directionLabel: {
    fontSize: 8,
    color: '#FF6B6B',
    fontWeight: 'bold',
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
});