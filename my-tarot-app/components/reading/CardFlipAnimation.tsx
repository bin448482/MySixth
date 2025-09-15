import React, { useState, useEffect } from 'react';
import { Image } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getCardImage } from '@/lib/utils/cardImages';

interface CardFlipAnimationProps {
  card: {
    id: number;
    name: string;
    imageUrl: string;
    direction: 'upright' | 'reversed';
    revealed: boolean;
  };
  onPress?: () => void;
  disabled?: boolean;
  showName?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = Math.min(screenWidth * 0.25, 120);
const CARD_HEIGHT = CARD_WIDTH * 1.7;

export function CardFlipAnimation({
  card,
  onPress,
  disabled = false,
  showName = false,
}: CardFlipAnimationProps) {
  const [animatedValue] = useState(new Animated.Value(0));
  const [isFlipped, setIsFlipped] = useState(false);

  // 根据card.revealed状态自动翻转
  useEffect(() => {
    if (card.revealed && !isFlipped) {
      // 自动翻转到正面
      Animated.spring(animatedValue, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start(() => {
        setIsFlipped(true);
      });
    }
  }, [card.revealed, isFlipped, animatedValue]);

  // 点击处理 - 只在已翻开时触发onPress
  const handlePress = () => {
    if (disabled) return;
    
    // 如果卡牌已经翻开，直接调用onPress显示牌意
    if (card.revealed && onPress) {
      onPress();
    }
  };

  // 正面旋转
  const frontAnimatedStyle = {
    transform: [
      {
        rotateY: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ],
  };

  // 背面旋转
  const backAnimatedStyle = {
    transform: [
      {
        rotateY: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: ['180deg', '360deg'],
        }),
      },
    ],
  };

  // 逆位旋转
  const cardRotation = card.direction === 'reversed' ? '180deg' : '0deg';

  // 获取卡牌图片资源
  const cardImageSource = getCardImage(card.imageUrl);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.9}
    >
      <View style={[styles.cardContainer, { width: CARD_WIDTH, height: CARD_HEIGHT }]} >
        {/* 卡背 */}
        <Animated.View
          style={[
            styles.card,
            styles.cardBack,
            frontAnimatedStyle,
            { backfaceVisibility: 'hidden' },
          ]}
        >
          <LinearGradient
            colors={['#1A1A2E', '#16213E']}
            style={styles.cardBackGradient}
          >
            <View style={styles.cardBackContent}>
              <Text style={styles.cardBackText}>TAROT</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* 卡牌正面 */}
        <Animated.View
          style={[
            styles.card,
            styles.cardFront,
            backAnimatedStyle,
            { transform: [...backAnimatedStyle.transform, { rotate: cardRotation }] },
            { backfaceVisibility: 'hidden' },
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
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 8,
  },
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
  cardBack: {
    backgroundColor: '#1A1A2E',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  cardBackGradient: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBackContent: {
    borderWidth: 1,
    borderColor: '#FFD700',
    padding: 20,
    borderRadius: 8,
  },
  cardBackText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 2,
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
  cardName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
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