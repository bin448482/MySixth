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
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { CardInfoService } from '@/lib/services/card-info';
import type { CardSummary, TarotHistory, CardFilters } from '@/lib/types/cards';
import { Colors } from '@/constants/theme';

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

  const handleCardPress = (cardId: number) => {
    router.push(`/cards/${cardId}`);
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

  return (
    <SafeAreaView style={styles.container}>
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
});