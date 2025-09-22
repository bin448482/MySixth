import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useReadingFlow } from '@/lib/contexts/ReadingContext';
import AIReadingService from '@/lib/services/AIReadingService';

export default function AIInputScreen() {
  const router = useRouter();
  const { updateStep, updateUserDescription, updateAIDimensions } = useReadingFlow();

  const [userDescription, setUserDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [dimensions, setDimensions] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    // 清除之前的错误
    setError('');

    if (!userDescription.trim()) {
      setError('请输入您的问题');
      return;
    }

    if (userDescription.trim().length > 200) {
      setError('问题描述不能超过200字');
      return;
    }

    setLoading(true);
    try {
      const aiService = AIReadingService.getInstance();

      // 检查服务健康状态
      const isHealthy = await aiService.checkServiceHealth();
      if (!isHealthy) {
        // 在开发模式下，如果后端服务不可用，使用模拟数据
        if (__DEV__) {
          console.log('开发模式：使用模拟AI分析数据');

          // 模拟AI分析结果
          const mockResult = {
            recommended_dimensions: [
              {
                id: 1,
                name: '情感维度',
                category: '情感',
                description: '关于情感关系的深度分析',
                aspect: '情感状态',
                aspect_type: 1
              },
              {
                id: 2,
                name: '现状维度',
                category: '现状',
                description: '当前情况的客观分析',
                aspect: '当前状况',
                aspect_type: 2
              },
              {
                id: 3,
                name: '发展维度',
                category: '未来',
                description: '未来发展的可能性',
                aspect: '发展方向',
                aspect_type: 3
              }
            ],
            user_description: userDescription.trim()
          };

          // 更新状态
          updateUserDescription(userDescription.trim());
          updateAIDimensions(mockResult.recommended_dimensions);
          setDimensions(mockResult.recommended_dimensions);

          // 移除自动跳转，只能手动点击继续

          return;
        } else {
          throw new Error('AI服务暂时不可用，请稍后重试');
        }
      }

      const result = await aiService.analyzeDescription(userDescription.trim());

      // 验证返回数据
      if (!result || !result.recommended_dimensions || result.recommended_dimensions.length === 0) {
        throw new Error('AI分析未返回有效结果，请重新描述您的问题');
      }

      // 更新状态
      updateUserDescription(userDescription.trim());
      updateAIDimensions(result.recommended_dimensions);
      setDimensions(result.recommended_dimensions);

      // 移除自动跳转，只能手动点击继续

    } catch (error) {
      console.error('AI分析失败:', error);
      let errorMessage = '网络连接失败，请检查网络设置';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getCharacterCount = () => userDescription.length;

  const handleRetry = () => {
    setError('');
    setDimensions(null);
    handleAnalyze();
  };

  const handleManualContinue = () => {
    if (dimensions && dimensions.length > 0) {
      updateStep(3);
      router.push('/(reading)/draw');
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>描述您的问题</Text>
        <Text style={styles.subtitle}>
          请详细描述您想要占卜的问题，AI将为您推荐最合适的解读维度
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>您的问题：</Text>
        <TextInput
          style={styles.textInput}
          multiline
          numberOfLines={6}
          value={userDescription}
          onChangeText={setUserDescription}
          placeholder="请详细描述您想要占卜的问题..."
          placeholderTextColor="#888888"
          maxLength={200}
          textAlignVertical="top"
        />
        <View style={styles.charCountContainer}>
          <Text style={[
            styles.charCount,
            getCharacterCount() > 200 && styles.charCountError
          ]}>
            {getCharacterCount()}/200
          </Text>
        </View>
      </View>

      {/* 错误显示 */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>⚠️ 分析失败</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 加载状态 */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>AI正在分析您的问题...</Text>
          <Text style={styles.loadingSubText}>请稍候，这可能需要几秒钟</Text>
        </View>
      )}

      {dimensions && !loading && (
        <View style={styles.dimensionsContainer}>
          <Text style={styles.dimensionsTitle}>推荐的解读维度：</Text>
          {dimensions.map((dimension, index) => (
            <View key={dimension.id} style={styles.dimensionItem}>
              <Text style={styles.dimensionName}>
                {index + 1}. {dimension.aspect}
              </Text>
              <Text style={styles.dimensionDescription}>
                {dimension.description}
              </Text>
            </View>
          ))}
          <View style={styles.continueContainer}>
            <Text style={styles.autoRedirectText}>
              点击下方按钮继续
            </Text>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleManualContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>立即继续</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.actionsContainer}>
        {!dimensions && !loading && !error && (
          <TouchableOpacity
            style={[
              styles.analyzeButton,
              loading && styles.analyzeButtonDisabled
            ]}
            onPress={handleAnalyze}
            disabled={loading || !userDescription.trim()}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#0F0F1A" />
            ) : (
              <Text style={styles.analyzeButtonText}>分析问题</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>步骤 2 / 4</Text>
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
  inputContainer: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 16,
    color: '#FFD700',
    marginBottom: 12,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#16213E',
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
    minHeight: 120,
  },
  charCountContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  charCount: {
    fontSize: 14,
    color: '#888888',
  },
  charCountError: {
    color: '#FF6B6B',
  },
  errorContainer: {
    backgroundColor: '#2D1B1B',
    borderWidth: 1,
    borderColor: '#FF6B6B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 18,
    color: '#FF6B6B',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#FFCCCC',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    backgroundColor: '#16213E',
    borderRadius: 12,
    padding: 32,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
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
  dimensionsContainer: {
    backgroundColor: '#16213E',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  dimensionsTitle: {
    fontSize: 18,
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  dimensionItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  dimensionName: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: '600',
    marginBottom: 4,
  },
  dimensionDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  continueContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  continueButton: {
    backgroundColor: '#FFD700',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 12,
  },
  continueButtonText: {
    color: '#0F0F1A',
    fontSize: 14,
    fontWeight: 'bold',
  },
  autoRedirectText: {
    fontSize: 14,
    color: '#FFD700',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 16,
  },
  actionsContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  analyzeButton: {
    backgroundColor: '#FFD700',
    borderRadius: 25,
    paddingHorizontal: 48,
    paddingVertical: 16,
    minWidth: 200,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#666666',
    shadowColor: 'transparent',
  },
  analyzeButtonText: {
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
  },
});