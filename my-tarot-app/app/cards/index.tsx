import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  FlatList,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate
} from 'react-native-reanimated';

import { CardInfoService } from '@/lib/services/card-info';
import type { CardSummary, CardDetail, TarotHistory, CardFilters, CardSide } from '@/lib/types/cards';
import { Colors } from '@/constants/theme';

const { width: screenWidth } = Dimensions.get('window');

interface FilterButtonProps {
  title: string;
  active: boolean;
  onPress: () => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({ title, active, onPress }) => (
  <TouchableOpacity
    style={[styles.filterButton, active && styles.filterButtonActive]}
    onPress={onPress}
  >
    <Text style={[styles.filterButtonText, active && styles.filterButtonTextActive]}>
      {title}
    </Text>
  </TouchableOpacity>
);

interface TarotHistoryPanelProps {
  history: TarotHistory;
  expanded: boolean;
  onToggle: () => void;
}

const TarotHistoryPanel: React.FC<TarotHistoryPanelProps> = ({ history, expanded, onToggle }) => (
  <View style={styles.historyPanel}>
    <TouchableOpacity style={styles.historyHeader} onPress={onToggle}>
      <Text style={styles.historyTitle}>塔罗牌历史文化</Text>
      <Ionicons
        name={expanded ? "chevron-up" : "chevron-down"}
        size={20}
        color={Colors.light.tint}
      />
    </TouchableOpacity>

    {expanded && (
      <View style={styles.historyContent}>
        <View style={styles.historySection}>
          <Text style={styles.historySectionTitle}>概述</Text>
          <Text style={styles.historySectionText}>{history.overview}</Text>
        </View>

        <View style={styles.historySection}>
          <Text style={styles.historySectionTitle}>历史起源</Text>
          <Text style={styles.historySectionText}>{history.origins}</Text>
        </View>

        <View style={styles.historySection}>
          <Text style={styles.historySectionTitle}>大小阿卡纳</Text>
          <Text style={styles.historySectionText}>{history.major_minor}</Text>
        </View>

        <View style={styles.historySection}>
          <Text style={styles.historySectionTitle}>使用指导</Text>
          <Text style={styles.historySectionText}>{history.usage_notes}</Text>
        </View>
      </View>
    )}
  </View>
);

interface CardItemProps {
  card: CardSummary;
  onPress: (cardId: number) => void;
}

const CardItem: React.FC<CardItemProps> = ({ card, onPress }) => (
  <TouchableOpacity
    style={styles.cardItem}
    onPress={() => onPress(card.id)}
    activeOpacity={0.7}
  >
    <View style={styles.cardImageContainer}>
      <Image
        source={card.image}
        style={styles.cardImage}
        resizeMode="cover"
      />
      <View style={styles.cardOverlay}>
        <Text style={styles.cardName}>{card.name}</Text>
        <Text style={styles.cardInfo}>
          {card.arcana === 'major' ? '大阿卡纳' : '小阿卡纳'}
          {card.suit && ` • ${card.suit}`}
          {card.number !== undefined && ` • ${card.number}`}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

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

export default function CardsIndexScreen() {
  const [cards, setCards] = useState<CardSummary[]>([]);
  const [history, setHistory] = useState<TarotHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [filters, setFilters] = useState<CardFilters>({
    arcana: 'all',
    suit: 'all',
    search: ''
  });

  // 卡牌详情相关状态
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardDetail | null>(null);
  const [cardDetailLoading, setCardDetailLoading] = useState(false);
  const [cardSide, setCardSide] = useState<CardSide>('upright');

  const cardInfoService = CardInfoService.getInstance();

  const loadData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // 并行加载卡牌和历史数据
      const [cardsResponse, historyResponse] = await Promise.all([
        cardInfoService.listCards(filters),
        cardInfoService.getTarotHistory()
      ]);

      if (cardsResponse.success && cardsResponse.data) {
        setCards(cardsResponse.data);
      } else {
        Alert.alert('错误', cardsResponse.error || '无法加载卡牌数据');
      }

      if (historyResponse.success && historyResponse.data) {
        setHistory(historyResponse.data);
      } else {
        console.warn('Failed to load tarot history:', historyResponse.error);
      }

    } catch (error) {
      console.error('Error loading cards data:', error);
      Alert.alert('错误', '加载数据时发生错误');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleFilterChange = async (newFilters: Partial<CardFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);

    try {
      const cardsResponse = await cardInfoService.listCards(updatedFilters);
      if (cardsResponse.success && cardsResponse.data) {
        setCards(cardsResponse.data);
      }
    } catch (error) {
      console.error('Error filtering cards:', error);
    }
  };

  const handleCardPress = async (cardId: number) => {
    setSelectedCardId(cardId);
    setCardDetailLoading(true);

    try {
      const cardResponse = await cardInfoService.getCardDetail(cardId);
      if (cardResponse.success && cardResponse.data) {
        setSelectedCard(cardResponse.data);
        setCardSide('upright'); // 重置为正位
      } else {
        Alert.alert('错误', cardResponse.error || '无法加载卡牌详情');
        setSelectedCardId(null);
      }
    } catch (error) {
      console.error('Error loading card detail:', error);
      Alert.alert('错误', '加载卡牌详情时发生错误');
      setSelectedCardId(null);
    } finally {
      setCardDetailLoading(false);
    }
  };

  const handleBackToList = () => {
    setSelectedCardId(null);
    setSelectedCard(null);
  };

  const handleRefresh = () => {
    loadData(true);
  };

  useEffect(() => {
    loadData();
  }, []);

  const renderCard = ({ item }: { item: CardSummary }) => (
    <CardItem card={item} onPress={handleCardPress} />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* 塔罗历史面板 */}
      {history && (
        <TarotHistoryPanel
          history={history}
          expanded={historyExpanded}
          onToggle={() => setHistoryExpanded(!historyExpanded)}
        />
      )}

      {/* 筛选器 */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>筛选卡牌</Text>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>阿卡纳:</Text>
          <View style={styles.filterButtons}>
            <FilterButton
              title="全部"
              active={filters.arcana === 'all'}
              onPress={() => handleFilterChange({ arcana: 'all' })}
            />
            <FilterButton
              title="大阿卡纳"
              active={filters.arcana === 'major'}
              onPress={() => handleFilterChange({ arcana: 'major' })}
            />
            <FilterButton
              title="小阿卡纳"
              active={filters.arcana === 'minor'}
              onPress={() => handleFilterChange({ arcana: 'minor' })}
            />
          </View>
        </View>

        {filters.arcana === 'minor' && (
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>花色:</Text>
            <View style={styles.filterButtons}>
              <FilterButton
                title="全部"
                active={filters.suit === 'all'}
                onPress={() => handleFilterChange({ suit: 'all' })}
              />
              <FilterButton
                title="权杖"
                active={filters.suit === 'wands'}
                onPress={() => handleFilterChange({ suit: 'wands' })}
              />
              <FilterButton
                title="圣杯"
                active={filters.suit === 'cups'}
                onPress={() => handleFilterChange({ suit: 'cups' })}
              />
              <FilterButton
                title="宝剑"
                active={filters.suit === 'swords'}
                onPress={() => handleFilterChange({ suit: 'swords' })}
              />
              <FilterButton
                title="钱币"
                active={filters.suit === 'pentacles'}
                onPress={() => handleFilterChange({ suit: 'pentacles' })}
              />
            </View>
          </View>
        )}
      </View>

      <View style={styles.cardsHeader}>
        <Text style={styles.cardsTitle}>
          塔罗牌库 ({cards.length} 张)
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <Text style={styles.loadingText}>加载卡牌数据...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 显示卡牌详情
  if (selectedCardId && selectedCard) {
    return (
      <SafeAreaView style={styles.container}>
        {/* 卡牌详情页面的自定义标题栏 */}
        <View style={styles.customHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToList}
          >
            <Ionicons name="arrow-back" size={24} color="#d4af37" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedCard.name}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* 卡牌图片和基本信息 */}
          <View style={styles.heroSection}>
            <View style={styles.cardDetailImageContainer}>
              <Image
                source={selectedCard.image}
                style={styles.cardDetailImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.cardDetailInfo}>
              <Text style={styles.cardDetailName}>{selectedCard.name}</Text>
              <View style={styles.cardMeta}>
                <Text style={styles.cardMetaText}>
                  {selectedCard.arcana === 'major' ? '大阿卡纳' : '小阿卡纳'}
                </Text>
                {selectedCard.suit && (
                  <Text style={styles.cardMetaText}> • {selectedCard.suit}</Text>
                )}
                {selectedCard.number !== undefined && (
                  <Text style={styles.cardMetaText}> • 第{selectedCard.number}号</Text>
                )}
              </View>
              {selectedCard.deck && (
                <Text style={styles.deckInfo}>来自: {selectedCard.deck}</Text>
              )}
            </View>
          </View>

          {/* 正逆位切换器 */}
          <SideToggle side={cardSide} onSideChange={setCardSide} />

          {/* 解读内容 */}
          <InterpretationContent card={selectedCard} side={cardSide} />

          {/* 底部间距 */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 显示卡牌详情加载状态
  if (selectedCardId && cardDetailLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.customHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToList}
          >
            <Ionicons name="arrow-back" size={24} color="#d4af37" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>卡牌详情</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <Text style={styles.loadingText}>加载卡牌详情...</Text>
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
        <Text style={styles.headerTitle}>卡牌说明</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={cards}
        renderItem={renderCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.light.tint]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
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
  content: {
    padding: 16,
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
  header: {
    marginBottom: 24,
  },

  // 历史面板样式
  historyPanel: {
    backgroundColor: 'rgba(139, 69, 19, 0.1)',
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#d4af37',
  },
  historyContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  historySection: {
    marginBottom: 16,
  },
  historySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d4af37',
    marginBottom: 8,
  },
  historySectionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#ccc',
  },

  // 筛选器样式
  filtersContainer: {
    backgroundColor: 'rgba(75, 0, 130, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.3)',
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8a2be2',
    marginBottom: 16,
  },
  filterRow: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterButtonActive: {
    backgroundColor: '#8a2be2',
    borderColor: '#8a2be2',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#ccc',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '500',
  },

  // 卡牌列表样式
  cardsHeader: {
    marginBottom: 16,
  },
  cardsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#d4af37',
  },
  row: {
    justifyContent: 'space-between',
  },
  cardItem: {
    flex: 0.48,
    marginBottom: 16,
  },
  cardImageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    aspectRatio: 0.6, // 塔罗牌标准比例
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  cardInfo: {
    fontSize: 12,
    color: '#ccc',
  },

  // 卡牌详情页面样式
  heroSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(20, 20, 40, 0.8)',
  },
  cardDetailImageContainer: {
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
  cardDetailImage: {
    width: '100%',
    height: '100%',
  },
  cardDetailInfo: {
    alignItems: 'center',
  },
  cardDetailName: {
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