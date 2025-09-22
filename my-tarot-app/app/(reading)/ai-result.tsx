import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useReadingFlow } from '@/lib/contexts/ReadingContext';
import AIReadingService from '@/lib/services/AIReadingService';
import { CardImageLoader } from '@/components/reading/CardImageLoader';

interface AIResult {
  dimension_summaries?: Record<string, string>; // 现在是可选的，为了向后兼容
  overall_summary: string;
  insights: string[];
  generated_at: string;
  // 新的主要数据结构
  card_interpretations: Array<{
    card_id: number;
    card_name: string;
    direction: string;
    position: number;
    ai_interpretation: string;
    basic_summary: string;
    dimension_aspect?: {
      dimension_name: string;
      interpretation: string;
    };
  }>;
  dimensions: Array<{
    id: number;
    name: string;
    aspect: string;
    aspect_type: number;
    category: string;
    description: string;
  }>;
}

export default function AIResultScreen() {
  const router = useRouter();
  const { state, updateAIResult, resetFlow, saveToHistory } = useReadingFlow();

  const [loading, setLoading] = useState(true);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // 检查是否已经有AI解读结果
    if (state.aiResult) {
      // 如果已经有结果，直接使用，不重新调用API
      console.log('使用已有的AI解读结果，避免重复调用API');
      setAiResult(state.aiResult);
      setLoading(false);
    } else {
      // 如果没有结果，才调用API生成解读
      console.log('没有AI解读结果，开始生成新的解读');
      generateAIReading();
    }
  }, []);

  const generateAIReading = async () => {
    if (!state.selectedCards || !state.aiDimensions || !state.userDescription) {
      setError('缺少必要的占卜数据，请重新开始');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const aiService = AIReadingService.getInstance();

      // 检查服务健康状态
      const isHealthy = await aiService.checkServiceHealth();
      if (!isHealthy) {
        throw new Error('AI服务暂时不可用，请稍后重试');
      }

      // 转换卡牌数据格式，符合后端API要求
      const cardInfos = state.selectedCards.map((card, index) => ({
        id: card.cardId,
        name: card.name,
        arcana: 'Major', // 可以从卡牌数据获取
        number: card.cardId,
        direction: card.direction === 'upright' ? '正位' : '逆位',
        position: index + 1, // API要求1-10之间的整数
        image_url: card.imageUrl || '',
        deck: 'default'
      }));

      // 📋 详细打印请求数据用于后台调试
      console.log('=== AI解读请求数据开始 ===');
      console.log('📝 用户问题描述:', state.userDescription);
      console.log('🎴 卡牌信息 (cardInfos):', JSON.stringify(cardInfos, null, 2));
      console.log('🎯 AI维度信息 (aiDimensions):', JSON.stringify(state.aiDimensions, null, 2));
      console.log('📊 牌阵类型 (spreadType):', 'three-card');
      console.log('🔗 完整请求参数:', {
        cards: cardInfos,
        dimensions: state.aiDimensions,
        userDescription: state.userDescription,
        spreadType: 'three-card'
      });
      console.log('=== AI解读请求数据结束 ===');

      const result = await aiService.generateAIReading(
        cardInfos,
        state.aiDimensions,
        state.userDescription,
        'three-card'
      );

      // 📋 详细打印响应数据用于后台调试
      console.log('=== AI解读响应数据开始 ===');
      console.log('📦 完整响应数据:', JSON.stringify(result, null, 2));
      console.log('🔍 响应数据类型检查:');
      console.log('  - 是否有 card_interpretations:', !!result.card_interpretations);
      console.log('  - card_interpretations 类型:', typeof result.card_interpretations);
      console.log('  - card_interpretations 长度:', result.card_interpretations?.length);
      console.log('  - 是否有 dimensions:', !!result.dimensions);
      console.log('  - dimensions 长度:', result.dimensions?.length);
      console.log('  - 是否有 overall_summary:', !!result.overall_summary);
      console.log('  - 是否有 insights:', !!result.insights);
      console.log('=== AI解读响应数据结束 ===');

      // 验证返回数据
      if (!result || !result.card_interpretations || !result.overall_summary) {
        throw new Error('AI解读生成失败，请重试');
      }

      console.log('AI解读生成成功，保存到Context');
      updateAIResult(result);
      setAiResult(result);
    } catch (error) {
      console.error('AI解读生成失败:', error);
      let errorMessage = '网络连接失败，请检查网络设置';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      setError(errorMessage);
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToHistory = async () => {
    if (!aiResult) {
      Alert.alert('保存失败', '没有可保存的解读结果');
      return;
    }

    try {
      // 调用ReadingContext的saveToHistory方法
      // 该方法会调用ReadingService.saveReadingFromState()处理AI占卜数据保存
      const savedId = await saveToHistory();
      Alert.alert(
        '保存成功',
        `占卜记录已保存到历史记录 (ID: ${savedId})`,
        [{ text: '了解', onPress: handleComplete }]
      );
    } catch (error) {
      console.error('保存AI占卜记录失败:', error);
      const errorMessage = error instanceof Error ? error.message : '保存记录失败，请重试';
      Alert.alert('保存失败', errorMessage);
    }
  };

  const handleComplete = () => {
    resetFlow();
    router.replace('/(tabs)');
  };

  const handleNewReading = () => {
    resetFlow();
    router.replace('/(reading)/type');
  };

  const handleRetry = () => {
    // 清除当前结果并重新生成
    setAiResult(null);
    setError(null);
    setRetryCount(prev => prev + 1);

    // 清除context中的结果，确保重新调用API
    updateAIResult(undefined);

    // 重新生成解读
    generateAIReading();
  };


  const handleGoBack = () => {
    router.back();
  };

  // 改进加载状态显示
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>AI正在生成您的专属解读...</Text>
        <Text style={styles.loadingSubText}>
          {retryCount > 0 ? `正在重试 (${retryCount}/3)` : '请稍候，这可能需要10-30秒'}
        </Text>
        <View style={styles.loadingProgress}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '60%' }]} />
          </View>
          <Text style={styles.progressText}>分析卡牌含义...</Text>
        </View>
      </View>
    );
  }

  // 改进错误状态显示
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>解读生成失败</Text>
        <Text style={styles.errorText}>{error}</Text>

        <View style={styles.errorActions}>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>
              {retryCount >= 3 ? '再次尝试' : '重试'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Text style={styles.backButtonText}>返回上一步</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.errorTips}>
          <Text style={styles.tipsTitle}>💡 解决建议：</Text>
          <Text style={styles.tipsText}>• 检查网络连接是否正常</Text>
          <Text style={styles.tipsText}>• 稍后再试，AI服务可能繁忙</Text>
          <Text style={styles.tipsText}>• 重新描述问题可能有帮助</Text>
        </View>
      </View>
    );
  }

  if (!aiResult) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>解读数据不完整</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>重新生成</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{state.userDescription}</Text>
      </View>

      {/* 各维度解读 - 包含卡牌图片和基础牌意 */}
      <View style={styles.dimensionsContainer}>
        {/* <Text style={styles.sectionTitle}>{state.userDescription}</Text> */}
        {aiResult.card_interpretations && aiResult.card_interpretations.length > 0 ? (
          aiResult.card_interpretations.map((cardInterpretation, index) => {
            const card = state.selectedCards[index];
            if (!card) return null;

            return (
              <View key={cardInterpretation.card_id} style={styles.dimensionCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.positionBadge}>
                    <Text style={styles.positionText}>{cardInterpretation.position}</Text>
                  </View>
                  <View style={styles.cardInfoSection}>
                    <Text style={styles.cardName}>{cardInterpretation.card_name}</Text>
                    <Text style={styles.cardDirection}>
                      {cardInterpretation.direction}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardContent}>
                  {/* 卡牌图片居中显示 */}
                  <View style={styles.cardImageSection}>
                    <CardImageLoader
                      imageUrl={card.imageUrl}
                      width={120}
                      height={200}
                      style={[
                        styles.cardImageLarge,
                        cardInterpretation.direction === '逆位' && styles.cardImageReversed
                      ]}
                      resizeMode="contain"
                    />
                  </View>

                  {/* 维度信息 */}
                  <View style={styles.dimensionInfo}>
                    <Text style={styles.dimensionName}>
                      {cardInterpretation.dimension_aspect?.dimension_name || `维度${index + 1}`}
                    </Text>
                    <Text style={styles.dimensionAspect}>
                      {aiResult.dimensions?.[index]?.aspect || ''}
                    </Text>
                  </View>

                  {/* 基础牌意 */}
                  <View style={styles.basicInterpretationContainer}>
                    <Text style={styles.interpretationLabel}>基础牌意：</Text>
                    <Text style={styles.basicInterpretation}>
                      {cardInterpretation.basic_summary}
                    </Text>
                  </View>

                  {/* AI详细解读 */}
                  <View style={styles.aiInterpretationContainer}>
                    <Text style={styles.interpretationLabel}>AI详细解读：</Text>
                    <Text style={styles.aiInterpretation}>
                      {cardInterpretation.ai_interpretation}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>没有找到卡牌解读数据</Text>
          </View>
        )}
      </View>

      {/* 综合分析 */}
      <View style={styles.overallContainer}>
        <Text style={styles.sectionTitle}>综合分析</Text>
        <Text style={styles.overallSummary}>{aiResult.overall_summary}</Text>
      </View>

      {/* 关键洞察 */}
      {aiResult.insights && aiResult.insights.length > 0 && (
        <View style={styles.insightsContainer}>
          <Text style={styles.sectionTitle}>关键洞察</Text>
          {aiResult.insights.map((insight, index) => (
            <View key={index} style={styles.insightItem}>
              <Text style={styles.insightBullet}>•</Text>
              <Text style={styles.insightText}>{insight}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 操作按钮 */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleSaveToHistory}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>保存记录</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={handleNewReading}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>重新占卜</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.tertiaryButton]}
          onPress={handleComplete}
          activeOpacity={0.8}
        >
          <Text style={styles.tertiaryButtonText}>返回首页</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>步骤 4 / 4 - 完成</Text>
        <Text style={styles.generatedTime}>
          生成时间：{new Date().toLocaleString()}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0F0F1A',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F0F1A',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#FFD700',
    textAlign: 'center',
    fontWeight: '600',
  },
  loadingSubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0F0F1A',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#0F0F1A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 16,
  },
  cardsContainer: {
    marginBottom: 32,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  cardItem: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  cardImage: {
    width: 80,
    height: 133,
    borderRadius: 8,
    marginBottom: 8,
  },
  cardImageReversed: {
    transform: [{ rotate: '180deg' }],
  },
  cardName: {
    fontSize: 12,
    color: '#FFD700',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 2,
  },
  cardDirection: {
    fontSize: 10,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 2,
  },
  cardPosition: {
    fontSize: 10,
    color: '#888888',
    textAlign: 'center',
  },
  dimensionsContainer: {
    marginBottom: 32,
  },
  dimensionCard: {
    backgroundColor: '#16213E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  positionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  positionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F0F1A',
  },
  cardInfoSection: {
    flex: 1,
  },
  cardContent: {
    alignItems: 'center',
    gap: 16,
  },
  cardImageSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  cardImageLarge: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  dimensionInfo: {
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    width: '100%',
  },
  dimensionAspect: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
    textAlign: 'center',
  },
  basicInterpretationContainer: {
    width: '100%',
    marginBottom: 16,
  },
  aiInterpretationContainer: {
    width: '100%',
  },
  interpretationLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  basicInterpretation: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    textAlign: 'center',
  },
  aiInterpretation: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    textAlign: 'left',
  },
  dimensionName: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  overallContainer: {
    backgroundColor: '#16213E',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  overallSummary: {
    fontSize: 15,
    color: '#CCCCCC',
    lineHeight: 24,
  },
  insightsContainer: {
    backgroundColor: '#16213E',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightBullet: {
    fontSize: 16,
    color: '#FFD700',
    marginRight: 8,
    marginTop: 2,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 22,
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    borderRadius: 25,
    paddingHorizontal: 48,
    paddingVertical: 16,
    minWidth: 200,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#FFD700',
    elevation: 4,
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F0F1A',
  },
  secondaryButton: {
    backgroundColor: '#4ECDC4',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  tertiaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 4,
  },
  generatedTime: {
    fontSize: 12,
    color: '#666666',
  },
  // 改进的加载状态样式
  loadingProgress: {
    marginTop: 24,
    alignItems: 'center',
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  // 改进的错误状态样式
  errorIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    color: '#FF6B6B',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 24,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#16213E',
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorTips: {
    backgroundColor: '#16213E',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  tipsTitle: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tipsText: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    marginBottom: 4,
  },
});