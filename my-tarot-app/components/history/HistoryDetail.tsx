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
import { UserDatabaseService } from '../../lib/database/user-db';
import type { ParsedUserHistory } from '../../lib/types/user';

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

  const userDbService = UserDatabaseService.getInstance();
  const opacity = useSharedValue(0);
  const headerScale = useSharedValue(0.9);

  // 加载历史详情
  useEffect(() => {
    loadHistoryDetail();
  }, [historyId]);

  const loadHistoryDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const historyData = await userDbService.getUserHistoryById(historyId);

      if (historyData) {
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

  // 格式化时间
  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'long',
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

  // 渲染卡牌解读
  const renderCardInterpretation = (cardData: any, index: number) => {
    const isExpanded = expandedCard === index;

    return (
      <Animated.View key={index} entering={FadeInDown.delay(index * 100)}>
        <TouchableOpacity
          style={styles.cardContainer}
          onPress={() => toggleCardExpansion(index)}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardPosition}>
              <Text style={styles.cardPositionText}>第{index + 1}张牌</Text>
              <Text style={styles.cardDirection}>
                {cardData.direction === 'upright' ? '正位' : '逆位'}
              </Text>
            </View>
            <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
          </View>

          <Text style={styles.cardSummary}>
            {cardData.cardName ? `${cardData.cardName} - ${cardData.summary}` : cardData.summary}
          </Text>

          {isExpanded && (
            <Animated.View entering={SlideInRight.duration(300)}>
              {cardData.detail && (
                <Text style={styles.cardDetail}>{cardData.detail}</Text>
              )}

              {cardData.dimensionInterpretations?.map((dim: any, dimIndex: number) => (
                <View key={dimIndex} style={styles.dimensionContainer}>
                  <Text style={styles.dimensionName}>{dim.dimensionName}</Text>
                  <Text style={styles.dimensionContent}>{dim.content}</Text>
                </View>
              ))}
            </Animated.View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
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
        <ActivityIndicator size="large" color="#ffd700" />
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

  return (
    <Animated.View style={[styles.container, style, animatedStyle]}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 占卜信息和操作 */}
        <Animated.View style={[styles.infoSection, headerAnimatedStyle]}>
          <View style={styles.metaInfo}>
            <Text style={styles.dateTime}>{formatDateTime(history.timestamp)}</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <Text style={styles.actionIcon}>↗</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
                <Text style={styles.actionIcon}>🗑</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.badges}>
            <View style={[
              styles.badge,
              { backgroundColor: history.interpretation_mode === 'ai' ? '#00ced1' : '#ffd700' }
            ]}>
              <Text style={styles.badgeText}>
                {history.interpretation_mode === 'ai' ? 'AI解读' : '基础解读'}
              </Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{history.card_ids.length}张牌</Text>
            </View>
          </View>
        </Animated.View>

        {/* 整体解读 */}
        {history.result?.interpretation?.overall && (
          <Animated.View entering={FadeInDown.delay(200)} style={styles.overallSection}>
            <Text style={styles.sectionTitle}>🔮 整体解读</Text>
            <View style={styles.overallContainer}>
              <Text style={styles.overallText}>{history.result.interpretation.overall}</Text>
            </View>
          </Animated.View>
        )}

        {/* 卡牌解读 */}
        <View style={styles.cardsSection}>
          <Text style={styles.sectionTitle}>🎴 卡牌解读</Text>
          {history.result?.interpretation?.cards?.map((cardData, index) =>
            renderCardInterpretation(cardData, index)
          )}
        </View>

        {/* 底部间距 */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // 更新为与卡牌说明页面一致的背景色
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
  // 信息区域样式（简化后的头部）
  infoSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
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