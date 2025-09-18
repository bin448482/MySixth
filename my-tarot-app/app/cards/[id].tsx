import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate
} from 'react-native-reanimated';

import { CardInfoService } from '@/lib/services/card-info';
import type { CardDetail, CardSide } from '@/lib/types/cards';
import { Colors } from '@/constants/theme';

const { width: screenWidth } = Dimensions.get('window');

interface SideToggleProps {
  side: CardSide;
  onSideChange: (side: CardSide) => void;
}

const SideToggle: React.FC<SideToggleProps> = ({ side, onSideChange }) => {
  const animatedValue = useSharedValue(side === 'upright' ? 0 : 1);

  useEffect(() => {
    animatedValue.value = withTiming(side === 'upright' ? 0 : 1, { duration: 300 });
  }, [side, animatedValue]);

  const containerStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolate(
        animatedValue.value,
        [0, 1],
        [0x4b0082aa, 0x8b0000aa]
      ),
    };
  });

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(
            animatedValue.value,
            [0, 1],
            [0, 80]
          )
        }
      ],
    };
  });

  return (
    <View style={styles.sideToggleContainer}>
      <Text style={styles.sideToggleLabel}>解读方向</Text>
      <Animated.View style={[styles.toggleContainer, containerStyle]}>
        <TouchableOpacity
          style={styles.toggleOption}
          onPress={() => onSideChange('upright')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.toggleText,
            side === 'upright' && styles.toggleTextActive
          ]}>
            正位
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toggleOption}
          onPress={() => onSideChange('reversed')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.toggleText,
            side === 'reversed' && styles.toggleTextActive
          ]}>
            逆位
          </Text>
        </TouchableOpacity>

        <Animated.View style={[styles.toggleIndicator, indicatorStyle]} />
      </Animated.View>
    </View>
  );
};

interface InterpretationContentProps {
  card: CardDetail;
  side: CardSide;
}

const InterpretationContent: React.FC<InterpretationContentProps> = ({ card, side }) => {
  const interpretation = card.interpretations[side];

  return (
    <View style={styles.interpretationContainer}>
      <View style={styles.interpretationHeader}>
        <Text style={styles.interpretationTitle}>
          {side === 'upright' ? '正位解读' : '逆位解读'}
        </Text>
        <View style={[
          styles.directionBadge,
          side === 'upright' ? styles.uprightBadge : styles.reversedBadge
        ]}>
          <Text style={styles.directionBadgeText}>
            {side === 'upright' ? '正位' : '逆位'}
          </Text>
        </View>
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryLabel}>核心牌意</Text>
        <Text style={styles.summaryText}>{interpretation.summary}</Text>
      </View>

      <View style={styles.detailContainer}>
        <Text style={styles.detailLabel}>详细解读</Text>
        <Text style={styles.detailText}>{interpretation.detail}</Text>
      </View>
    </View>
  );
};

export default function CardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [card, setCard] = useState<CardDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [side, setSide] = useState<CardSide>('upright');

  const cardInfoService = CardInfoService.getInstance();

  const loadCardDetail = async () => {
    if (!id) {
      Alert.alert('错误', '无效的卡牌ID');
      router.back();
      return;
    }

    try {
      setLoading(true);

      const cardResponse = await cardInfoService.getCardDetail(parseInt(id));
      if (cardResponse.success && cardResponse.data) {
        setCard(cardResponse.data);
      } else {
        Alert.alert('错误', cardResponse.error || '无法加载卡牌详情');
        router.back();
      }

    } catch (error) {
      console.error('Error loading card detail:', error);
      Alert.alert('错误', '加载卡牌详情时发生错误');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCardDetail();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <Text style={styles.loadingText}>加载卡牌详情...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!card) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#888" />
          <Text style={styles.errorText}>卡牌详情不可用</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 自定义标题栏 */}
      <View style={styles.customHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#d4af37" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{card?.name || '卡牌详情'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 卡牌图片和基本信息 */}
        <View style={styles.heroSection}>
          <View style={styles.cardImageContainer}>
            <Image
              source={card.image}
              style={styles.cardImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{card.name}</Text>
            <View style={styles.cardMeta}>
              <Text style={styles.cardMetaText}>
                {card.arcana === 'major' ? '大阿卡纳' : '小阿卡纳'}
              </Text>
              {card.suit && (
                <Text style={styles.cardMetaText}> • {card.suit}</Text>
              )}
              {card.number !== undefined && (
                <Text style={styles.cardMetaText}> • 第{card.number}号</Text>
              )}
            </View>
            {card.deck && (
              <Text style={styles.deckInfo}>来自: {card.deck}</Text>
            )}
          </View>
        </View>

        {/* 正逆位切换器 */}
        <SideToggle side={side} onSideChange={setSide} />

        {/* 解读内容 */}
        <InterpretationContent card={card} side={side} />

        {/* 底部间距 */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  // 自定义标题栏样式
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60, // 确保最小高度一致
    backgroundColor: 'rgba(20, 20, 40, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.3)',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#d4af37',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40, // 与backButton保持平衡
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#888',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#888',
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(20, 20, 40, 0.8)',
  },
  cardImageContainer: {
    width: screenWidth * 0.5,
    aspectRatio: 0.6,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardInfo: {
    alignItems: 'center',
  },
  cardName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#d4af37',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardMetaText: {
    fontSize: 16,
    color: '#ccc',
  },
  deckInfo: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },

  // Side Toggle
  sideToggleContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  sideToggleLabel: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 25,
    padding: 4,
    position: 'relative',
  },
  toggleOption: {
    width: 80,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  toggleText: {
    fontSize: 16,
    color: '#ccc',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  toggleIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 80,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    zIndex: 1,
  },

  // Interpretation Content
  interpretationContainer: {
    margin: 16,
    backgroundColor: 'rgba(40, 40, 60, 0.6)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  interpretationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  interpretationTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#d4af37',
  },
  directionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  uprightBadge: {
    backgroundColor: 'rgba(75, 0, 130, 0.8)',
  },
  reversedBadge: {
    backgroundColor: 'rgba(139, 0, 0, 0.8)',
  },
  directionBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  summaryContainer: {
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8a2be2',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 18,
    lineHeight: 26,
    color: '#fff',
    fontWeight: '500',
  },

  detailContainer: {
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8a2be2',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#ccc',
  },

  bottomSpacer: {
    height: 40,
  },
});