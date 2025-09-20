import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useReadingFlow } from '@/lib/contexts/ReadingContext';
import AIReadingService from '@/lib/services/AIReadingService';

interface AIResult {
  dimension_summaries: Record<string, string>;
  overall_summary: string;
  insights: string[];
  generated_at: string;
}

export default function AIResultScreen() {
  const router = useRouter();
  const { state, updateAIResult, resetFlow } = useReadingFlow();

  const [loading, setLoading] = useState(true);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    generateAIReading();
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
        // 在开发模式下，如果后端服务不可用，使用模拟数据
        if (__DEV__) {
          console.log('开发模式：使用模拟AI解读数据');

          // 模拟AI解读结果
          const mockResult = {
            dimension_summaries: {
              '情感状态': '在情感方面，当前的卡牌显示您正处于一个重要的转折点。内心的声音在引导您做出正确的选择，建议倾听直觉。',
              '当前状况': '现状显示您具备足够的能力和资源来应对挑战。保持专注和决心，成功就在前方等待着您。',
              '发展方向': '未来的道路充满希望和可能性。坚持当前的方向，但也要保持开放的心态迎接新的机遇。'
            },
            overall_summary: '整体而言，这次占卜显示您正站在人生的重要节点上。过去的经验为您提供了智慧，现在的努力正在开花结果，而未来充满着光明的前景。相信自己的能力，勇敢地迈向下一个阶段。',
            insights: [
              '相信内心的直觉，它会为您指引正确的方向',
              '现在是采取行动的最佳时机，不要犹豫',
              '保持积极乐观的心态，好运正在向您走来',
              '与重要的人分享您的想法，会获得意外的支持'
            ],
            generated_at: new Date().toISOString()
          };

          updateAIResult(mockResult);
          setAiResult(mockResult);
          return;
        } else {
          throw new Error('AI服务暂时不可用，请稍后重试');
        }
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

      const result = await aiService.generateAIReading(
        cardInfos,
        state.aiDimensions,
        state.userDescription,
        'three-card'
      );

      // 验证返回数据
      if (!result || !result.dimension_summaries || !result.overall_summary) {
        throw new Error('AI解读生成失败，请重试');
      }

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
      // 这里应该调用实际的保存历史记录服务
      // await saveToHistory();
      console.log('保存AI占卜记录:', {
        type: 'ai',
        userDescription: state.userDescription,
        selectedCards: state.selectedCards,
        aiResult: aiResult,
        timestamp: new Date()
      });

      Alert.alert('保存成功', '占卜记录已保存到历史');
    } catch (error) {
      console.error('保存AI占卜记录失败:', error);
      Alert.alert('保存失败', '请重试');
    }
  };

  const handleNewReading = () => {
    resetFlow();
    router.replace('/(reading)/type');
  };

  const handleRetry = () => {
    generateAIReading();
  };

  const getCardImage = (imageUrl: string) => {
    // React Native不支持动态require，这里需要使用静态映射或网络图片
    // 暂时使用默认图片，后续可以改为网络图片或静态映射
    try {
      // 如果是网络图片，直接返回URI对象
      if (imageUrl && imageUrl.startsWith('http')) {
        return { uri: imageUrl };
      }
      // 否则使用默认图标
      return require('../../assets/images/icon.png');
    } catch (error) {
      console.warn(`Failed to load image: ${imageUrl}`);
      return require('../../assets/images/icon.png');
    }
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
        <Text style={styles.title}>AI塔罗解读</Text>
        <Text style={styles.subtitle}>
          基于您的问题：{state.userDescription}
        </Text>
      </View>

      {/* 显示抽取的卡牌 */}
      <View style={styles.cardsContainer}>
        <Text style={styles.sectionTitle}>您的塔罗牌</Text>
        <View style={styles.cardsRow}>
          {state.selectedCards.map((card, index) => (
            <View key={card.cardId} style={styles.cardItem}>
              <Image
                source={getCardImage(card.imageUrl)}
                style={[
                  styles.cardImage,
                  card.direction === 'reversed' && styles.cardImageReversed
                ]}
                resizeMode="contain"
              />
              <Text style={styles.cardName}>{card.name}</Text>
              <Text style={styles.cardDirection}>
                {card.direction === 'upright' ? '正位' : '逆位'}
              </Text>
              <Text style={styles.cardPosition}>
                {state.aiDimensions?.[index]?.aspect || `位置${index + 1}`}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 各维度解读 */}
      <View style={styles.dimensionsContainer}>
        <Text style={styles.sectionTitle}>各维度解读</Text>
        {Object.entries(aiResult.dimension_summaries).map(([dimensionName, summary], index) => (
          <View key={dimensionName} style={styles.dimensionItem}>
            <Text style={styles.dimensionName}>
              {index + 1}. {dimensionName}
            </Text>
            <Text style={styles.dimensionSummary}>{summary}</Text>
          </View>
        ))}
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
          style={[styles.actionButton, styles.saveButton]}
          onPress={handleSaveToHistory}
        >
          <Text style={styles.saveButtonText}>保存记录</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.newReadingButton]}
          onPress={handleNewReading}
        >
          <Text style={styles.newReadingButtonText}>重新占卜</Text>
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
    fontSize: 28,
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
    backgroundColor: '#16213E',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  dimensionItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  dimensionName: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dimensionSummary: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 22,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 16,
  },
  actionButton: {
    flex: 1,
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#16213E',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  newReadingButton: {
    backgroundColor: '#FFD700',
  },
  newReadingButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F0F1A',
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