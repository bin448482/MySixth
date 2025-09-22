import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeInDown,
  SlideInRight,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { UserDatabaseService } from '../../lib/database/user-db';
import { ConfigDatabaseService } from '../../lib/database/config-db';
import { CardImageLoader } from '../reading/CardImageLoader';
import { getCardImage } from '../../lib/utils/cardImages';
import type { ParsedUserHistory } from '../../lib/types/user';
import type { Card } from '../../lib/types/config';

interface HistoryDetailProps {
  historyId: string;
  onBack: () => void;
  style?: any;
}

export const HistoryDetail: React.FC<HistoryDetailProps> = ({
  historyId,
  onBack,
  style,
}) => {
  const [history, setHistory] = useState<ParsedUserHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [cardsData, setCardsData] = useState<Card[]>([]);

  const userDbService = UserDatabaseService.getInstance();
  const configDbService = ConfigDatabaseService.getInstance();
  const opacity = useSharedValue(0);
  const headerScale = useSharedValue(0.9);

  // 加载历史详情
  useEffect(() => {
    loadHistoryDetail();
    loadCardsData();
  }, [historyId]);

  const loadCardsData = async () => {
    try {
      const response = await configDbService.getAllCards();
      if (response.success && response.data) {
        console.log('Cards data loaded, count:', response.data.length);
        console.log('First few cards:', response.data.slice(0, 5).map(c => ({ name: c.name, image_url: c.image_url })));
        setCardsData(response.data);
      }
    } catch (error) {
      console.error('Error loading cards data:', error);
    }
  };

  const loadHistoryDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const historyData = await userDbService.getUserHistoryById(historyId);

      if (historyData) {
        console.log('History data loaded:', historyData);
        if (historyData.result?.interpretation?.card_interpretations) {
          console.log('Card interpretations:', historyData.result.interpretation.card_interpretations);
        }
        setHistory(historyData);
        // 入场动画
        opacity.value = withTiming(1, { duration: 500 });
        headerScale.value = withSpring(1, { damping: 15 });
      } else {
        setError('历史记录不存在');
      }
    } catch (err) {
      console.error('Error loading history detail:', err);
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 格式化时间 - 显示完整的日期时间
  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 分享历史记录
  const handleShare = async () => {
    if (!history) return;

    try {
      const shareContent = `塔罗占卜记录\n时间：${formatDateTime(history.timestamp)}\n模式：${
        history.interpretation_mode === 'ai' ? 'AI解读' : '基础解读'
      }\n\n${history.result?.interpretation?.overall || '查看完整解读...'}\n\n来自神秘塔罗牌应用`;

      await Share.share({
        message: shareContent,
        title: '塔罗占卜记录',
      });
    } catch (error) {
      console.error('分享失败:', error);
    }
  };

  // 删除历史记录
  const handleDelete = () => {
    Alert.alert(
      '删除确认',
      '确定要删除这条历史记录吗？此操作不可恢复。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await userDbService.deleteUserHistory(historyId);
              onBack();
            } catch (error) {
              Alert.alert('删除失败', '请稍后重试');
            }
          },
        },
      ]
    );
  };

  // 切换卡牌展开状态
  const toggleCardExpansion = (cardIndex: number) => {
    setExpandedCard(expandedCard === cardIndex ? null : cardIndex);
  };

  // 根据卡牌名称获取图片路径
  const getCardImageByName = (cardName: string): string => {
    console.log('Looking for card image for:', cardName);

    // 首先尝试完全匹配
    let card = cardsData.find(c => c.name === cardName);

    if (!card) {
      // 尝试部分匹配（去除空格、标点符号等）
      const normalizedSearchName = cardName.replace(/[^\w\u4e00-\u9fff]/g, '').toLowerCase();
      card = cardsData.find(c => {
        const normalizedCardName = c.name.replace(/[^\w\u4e00-\u9fff]/g, '').toLowerCase();
        return normalizedCardName.includes(normalizedSearchName) || normalizedSearchName.includes(normalizedCardName);
      });
    }

    if (card) {
      console.log('Found card:', card.name, 'with image:', card.image_url);
      return card.image_url;
    } else {
      console.log('Card not found for:', cardName);
      console.log('Available cards:', cardsData.slice(0, 10).map(c => c.name));
      return 'major/00-fool.jpg';
    }
  };

  // 渲染AI占卜的卡牌解读（样式与ai-result.tsx一致）
  const renderAICardInterpretation = (cardInterpretation: any, index: number) => {
    const cardImageUrl = getCardImageByName(cardInterpretation.card_name);

    return (
      <View key={index} style={styles.aiDimensionCard}>
        <View style={styles.aiCardHeader}>
          <View style={styles.aiPositionBadge}>
            <Text style={styles.aiPositionText}>{cardInterpretation.position || (index + 1)}</Text>
          </View>
          <View style={styles.aiCardInfoSection}>
            <Text style={styles.aiCardName}>{cardInterpretation.card_name}</Text>
            <Text style={styles.aiCardDirection}>
              {cardInterpretation.direction}
            </Text>
          </View>
        </View>

        <View style={styles.aiCardContent}>
          {/* 卡牌图片区域 */}
          <View style={styles.aiCardImageSection}>
            <CardImageLoader
              imageUrl={cardImageUrl}
              width={120}
              height={200}
              style={[
                styles.aiCardImageLarge,
                cardInterpretation.direction === '逆位' && styles.aiCardImageReversed
              ]}
              resizeMode="contain"
            />
          </View>

          {/* 维度信息 */}
          <View style={styles.aiDimensionInfo}>
            <Text style={styles.aiDimensionName}>
              {cardInterpretation.dimension_aspect?.dimension_name || `维度${index + 1}`}
            </Text>
          </View>

          {/* 基础牌意 */}
          <View style={styles.aiBasicInterpretationContainer}>
            <Text style={styles.aiInterpretationLabel}>基础牌意：</Text>
            <Text style={styles.aiBasicInterpretation}>
              {cardInterpretation.basic_summary}
            </Text>
          </View>

          {/* AI详细解读 */}
          <View style={styles.aiDetailedInterpretationContainer}>
            <Text style={styles.aiInterpretationLabel}>AI详细解读：</Text>
            <Text style={styles.aiDetailedInterpretation}>
              {cardInterpretation.ai_interpretation}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // 渲染基础占卜的卡牌解读（使用AI解读的样式）
  const renderBasicCardInterpretation = (cardData: any, index: number) => {
    const cardImageUrl = cardData.cardName ? getCardImageByName(cardData.cardName) : 'major/00-fool.jpg';

    return (
      <View key={index} style={styles.aiDimensionCard}>
        <View style={styles.aiCardHeader}>
          <View style={styles.aiPositionBadge}>
            <Text style={styles.aiPositionText}>{index + 1}</Text>
          </View>
          <View style={styles.aiCardInfoSection}>
            <Text style={styles.aiCardName}>{cardData.cardName || `第${index + 1}张牌`}</Text>
            <Text style={styles.aiCardDirection}>
              {cardData.direction === 'upright' ? '正位' : '逆位'}
            </Text>
          </View>
        </View>

        <View style={styles.aiCardContent}>
          {/* 卡牌图片区域 */}
          <View style={styles.aiCardImageSection}>
            <CardImageLoader
              imageUrl={cardImageUrl}
              width={120}
              height={200}
              style={[
                styles.aiCardImageLarge,
                cardData.direction === 'reversed' && styles.aiCardImageReversed
              ]}
              resizeMode="contain"
            />
          </View>

          {/* 维度信息 */}
          {cardData.dimensionInterpretations && cardData.dimensionInterpretations.length > 0 && (
            <View style={styles.aiDimensionInfo}>
              <Text style={styles.aiDimensionName}>
                {cardData.dimensionInterpretations[0]?.dimensionName || `维度${index + 1}`}
              </Text>
            </View>
          )}

          {/* 基础牌意 */}
          {cardData.summary && (
            <View style={styles.aiBasicInterpretationContainer}>
              <Text style={styles.aiInterpretationLabel}>基础牌意：</Text>
              <Text style={styles.aiBasicInterpretation}>
                {cardData.summary}
              </Text>
            </View>
          )}

          {/* 详细解读 */}
          {cardData.detail && (
            <View style={styles.aiDetailedInterpretationContainer}>
              <Text style={styles.aiInterpretationLabel}>详细解读：</Text>
              <Text style={styles.aiDetailedInterpretation}>
                {cardData.detail}
              </Text>
            </View>
          )}

          {/* 维度解读 */}
          {cardData.dimensionInterpretations?.map((dim: any, dimIndex: number) => (
            <View key={dimIndex} style={styles.aiDetailedInterpretationContainer}>
              <Text style={styles.aiInterpretationLabel}>{dim.dimensionName}：</Text>
              <Text style={styles.aiDetailedInterpretation}>{dim.content}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // 渲染卡牌解读（根据类型选择不同的渲染方法）
  const renderCardInterpretation = (cardData: any, index: number) => {
    const isAI = history?.interpretation_mode === 'ai';

    if (isAI && history?.result?.interpretation?.card_interpretations) {
      // AI占卜：使用AI解读格式
      return renderAICardInterpretation(cardData, index);
    } else {
      // 基础占卜：使用原有格式
      return renderBasicCardInterpretation(cardData, index);
    }
  };

  // 动画样式
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
  }));

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  if (error || !history) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error || '记录不存在'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>返回</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isAI = history.interpretation_mode === 'ai';
  const interpretation = history.result?.interpretation;

  return (
    <Animated.View style={[styles.container, style, animatedStyle]}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 简化的头部信息 */}
        <Animated.View style={[styles.infoSection, headerAnimatedStyle]}>
          <View style={styles.typeAndActions}>
            <View style={[
              styles.typeBadge,
              { backgroundColor: isAI ? '#00ced1' : '#ffd700' }
            ]}>
              <Text style={styles.typeBadgeText}>
                {isAI ? '✨ AI解读' : '📖 基础解读'}
              </Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <Text style={styles.actionIcon}>↗</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
                <Text style={styles.actionIcon}>🗑</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* AI占卜的各维度解读 */}
        {isAI && interpretation?.card_interpretations && (
          <View style={styles.aiDimensionsContainer}>
            <Text style={styles.aiSectionTitle}>
              {interpretation?.user_description || '您的塔罗牌与解读'}
            </Text>
            {interpretation.card_interpretations.map((cardInterpretation: any, index: number) =>
              renderAICardInterpretation(cardInterpretation, index)
            )}
          </View>
        )}

        {/* 综合分析 */}
        {interpretation?.overall && (
          <Animated.View entering={FadeInDown.delay(200)} style={isAI ? styles.aiOverallContainer : styles.overallSection}>
            <Text style={isAI ? styles.aiSectionTitle : styles.sectionTitle}>
              {isAI ? '综合分析' : '🔮 整体解读'}
            </Text>
            <View style={isAI ? styles.aiOverallContentContainer : styles.overallContainer}>
              <Text style={isAI ? styles.aiOverallSummary : styles.overallText}>
                {interpretation.overall}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* AI占卜的关键洞察 */}
        {isAI && interpretation?.insights && interpretation.insights.length > 0 && (
          <View style={styles.aiInsightsContainer}>
            <Text style={styles.aiSectionTitle}>关键洞察</Text>
            {interpretation.insights.map((insight: string, index: number) => (
              <View key={index} style={styles.aiInsightItem}>
                <Text style={styles.aiInsightBullet}>•</Text>
                <Text style={styles.aiInsightText}>{insight}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 基础占卜的卡牌解读 */}
        {!isAI && interpretation?.cards && (
          <View style={styles.aiDimensionsContainer}>
            <Text style={styles.aiSectionTitle}>
              {history.result?.metadata?.theme || '卡牌解读'}
            </Text>
            {interpretation.cards.map((cardData: any, index: number) =>
              renderBasicCardInterpretation(cardData, index)
            )}
          </View>
        )}

        {/* 底部间距 */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A', // 与ai-result.tsx一致的背景色
  },
  // 自定义标题栏样式（与占卜历史页面保持一致）
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  // AI占卜专用头部样式
  aiHeader: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  aiTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 8,
  },
  aiSubtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
  },
  // 信息区域样式（简化后的头部）
  infoSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  questionSection: {
    marginBottom: 16,
  },
  questionText: {
    fontSize: 16,
    color: '#e6e6fa',
    lineHeight: 24,
    textAlign: 'center',
  },
  typeAndActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  typeBadgeText: {
    color: '#1a1a2e',
    fontSize: 12,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIconText: {
    color: '#ffd700',
    fontSize: 24,
    fontWeight: '300',
  },
  title: {
    color: '#e6e6fa',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionIcon: {
    fontSize: 16,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateTime: {
    color: '#e6e6fa',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  badgeText: {
    color: '#1a1a2e',
    fontSize: 12,
    fontWeight: '600',
  },
  // AI占卜各维度解读样式（与ai-result.tsx一致）
  aiDimensionsContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    marginBottom: 32,
  },
  aiSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 16,
  },
  aiDimensionCard: {
    backgroundColor: '#16213E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  aiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiPositionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiPositionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F0F1A',
  },
  aiCardInfoSection: {
    flex: 1,
  },
  aiCardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 2,
  },
  aiCardDirection: {
    fontSize: 14,
    color: '#CCCCCC',
    textTransform: 'capitalize',
  },
  aiCardContent: {
    alignItems: 'center',
    gap: 16,
  },
  aiCardImageSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  aiCardImageLarge: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  aiCardImageReversed: {
    transform: [{ rotate: '180deg' }],
  },
  aiDimensionInfo: {
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    width: '100%',
  },
  aiDimensionName: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  aiBasicInterpretationContainer: {
    width: '100%',
    marginBottom: 16,
  },
  aiDetailedInterpretationContainer: {
    width: '100%',
  },
  aiInterpretationLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  aiBasicInterpretation: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    textAlign: 'center',
  },
  aiDetailedInterpretation: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    textAlign: 'left',
  },
  // AI占卜综合分析样式
  aiOverallContainer: {
    backgroundColor: '#16213E',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  aiOverallContentContainer: {
    // 容器样式，用于包装内容
  },
  aiOverallSummary: {
    fontSize: 15,
    color: '#CCCCCC',
    lineHeight: 24,
  },
  // AI占卜关键洞察样式
  aiInsightsContainer: {
    backgroundColor: '#16213E',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  aiInsightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  aiInsightBullet: {
    fontSize: 16,
    color: '#FFD700',
    marginRight: 8,
    marginTop: 2,
  },
  aiInsightText: {
    flex: 1,
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 22,
  },
  // 基础占卜样式
  overallSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  sectionTitle: {
    color: '#ffd700',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  overallContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.1)',
  },
  overallText: {
    color: '#e6e6fa',
    fontSize: 16,
    lineHeight: 24,
  },
  cardsSection: {
    padding: 20,
  },
  cardContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardPosition: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardPositionText: {
    color: '#ffd700',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  cardDirection: {
    color: '#8b8878',
    fontSize: 12,
    backgroundColor: 'rgba(139, 136, 120, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  expandIcon: {
    color: '#ffd700',
    fontSize: 16,
  },
  cardSummary: {
    color: '#e6e6fa',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  cardDetail: {
    color: '#8b8878',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
    marginBottom: 16,
  },
  dimensionContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  dimensionName: {
    color: '#ffd700',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  dimensionContent: {
    color: '#e6e6fa',
    fontSize: 14,
    lineHeight: 20,
  },
  loadingText: {
    color: '#e6e6fa',
    marginTop: 12,
    fontSize: 16,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    color: '#8b0000',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#ffd700',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 40,
  },
});