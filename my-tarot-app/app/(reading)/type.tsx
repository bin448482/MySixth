import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  BackHandler,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useReadingFlow } from '@/lib/contexts/ReadingContext';
import { useAppContext } from '@/lib/contexts/AppContext';
import UserService from '@/lib/services/UserService';

export default function TypeSelectionScreen() {
  const router = useRouter();
  const { updateStep, updateType } = useReadingFlow();
  const { state } = useAppContext();

  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);

  const isAIServiceAvailable = state.isAIServiceAvailable;
  const isCheckingService = state.isCheckingAIService || !state.isAppInitialized;
  const hasEnoughCredits = userCredits !== null && userCredits >= 2;
  const isAIButtonDisabled = !isAIServiceAvailable || !hasEnoughCredits;

  // 页面获得焦点时刷新积分（首次加载和每次返回此页面时都会触发）
  useFocusEffect(
    React.useCallback(() => {
      loadUserCredits();
    }, [])
  );

  // 添加硬件返回键处理
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // 直接跳转到首页，而不是使用默认的router.back()
      router.push('/(tabs)/');
      return true; // 阻止默认返回行为
    });

    return () => backHandler.remove();
  }, [router]);

  const loadUserCredits = async () => {
    setIsLoadingCredits(true);
    try {
      const userService = UserService.getInstance();
      const balance = await userService.getUserBalance();
      if (balance) {
        setUserCredits(balance.credits);
      }
    } catch (error) {
      console.error('Failed to load user credits:', error);
    } finally {
      setIsLoadingCredits(false);
    }
  };

  const handleTypeSelect = async (type: 'offline' | 'ai') => {
    if (type === 'ai') {
      // AI占卜前先检查服务和积分
      if (!isAIServiceAvailable) {
        return;
      }

      if (!hasEnoughCredits) {
        Alert.alert(
          '积分不足',
          `AI占卜需要消耗2积分，您当前积分：${userCredits || 0}。请前往充值页面获取积分。`,
          [
            {
              text: '去充值',
              onPress: () => router.push('/settings'),
            },
            {
              text: '取消',
              style: 'cancel',
            },
          ]
        );
        return;
      }
    }

    updateType(type);
    updateStep(2);

    if (type === 'offline') {
      router.push('/(reading)/category');
    } else {
      router.push('/(reading)/ai-input');
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>选择占卜方式</Text>
        <Text style={styles.subtitle}>
          请选择您希望的占卜方式,手势左滑返回首页
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.optionCard, styles.availableOption]}
          onPress={() => handleTypeSelect('offline')}
          activeOpacity={0.8}
        >
          <View style={styles.iconContainer}>
            <Text style={[styles.icon, styles.availableIcon]}>📖</Text>
          </View>
          <Text style={[styles.optionTitle, styles.availableTitle]}>
            离线占卜
          </Text>
          <Text style={[styles.optionDescription, styles.availableDescription]}>
            使用内置解读，无需网络连接
          </Text>
          <Text style={[styles.optionStatus, styles.availableStatus]}>
            [可用]
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionCard,
            isAIButtonDisabled ? styles.disabledOption : styles.availableOption
          ]}
          onPress={() => handleTypeSelect('ai')}
          activeOpacity={isAIButtonDisabled ? 1 : 0.8}
          disabled={isAIButtonDisabled}
        >
          <View style={styles.iconContainer}>
            <Text style={[
              styles.icon,
              isAIButtonDisabled ? styles.disabledIcon : styles.availableIcon
            ]}>🤖</Text>
          </View>
          <Text style={[
            styles.optionTitle,
            isAIButtonDisabled ? styles.disabledTitle : styles.availableTitle
          ]}>
            AI占卜 {userCredits !== null && `(需要2积分)`}
          </Text>
          <Text style={[
            styles.optionDescription,
            isAIButtonDisabled ? styles.disabledDescription : styles.availableDescription
          ]}>
            {isCheckingService
              ? '正在检查服务状态...'
              : isLoadingCredits
                ? '正在加载积分信息...'
                : !isAIServiceAvailable
                  ? 'AI服务暂时不可用，请稍后重试'
                  : !hasEnoughCredits
                    ? `当前积分：${userCredits || 0}，积分不足`
                    : `智能解读服务，个性化分析 (当前积分：${userCredits})`
            }
          </Text>
          <Text style={[
            styles.optionStatus,
            isAIButtonDisabled ? styles.disabledStatus : styles.availableStatus
          ]}>
            {isCheckingService
              ? '[检查中...]'
              : isLoadingCredits
                ? '[加载中...]'
                : !isAIServiceAvailable
                  ? '[不可用]'
                  : !hasEnoughCredits
                    ? '[积分不足]'
                    : '[可用]'
            }
          </Text>
          {(isCheckingService || isLoadingCredits) && (
            <ActivityIndicator
              size="small"
              color="#888888"
              style={{ marginTop: 8 }}
            />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          步骤 1 / 4
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
  header: {
    alignItems: 'center',
    marginBottom: 48,
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
  },
  optionsContainer: {
    gap: 24,
  },
  optionCard: {
    backgroundColor: '#16213E',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  availableOption: {
    borderColor: '#FFD700',
    backgroundColor: '#16213E',
  },
  disabledOption: {
    borderColor: '#666666',
    backgroundColor: '#1A1A2E',
    opacity: 0.6,
  },
  iconContainer: {
    marginBottom: 16,
  },
  icon: {
    fontSize: 48,
  },
  availableIcon: {
    opacity: 1,
  },
  disabledIcon: {
    opacity: 0.5,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  availableTitle: {
    color: '#FFD700',
  },
  disabledTitle: {
    color: '#888888',
  },
  optionDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  availableDescription: {
    color: '#CCCCCC',
  },
  disabledDescription: {
    color: '#666666',
  },
  optionStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 12,
  },
  availableStatus: {
    color: '#FFD700',
  },
  disabledStatus: {
    color: '#F44336',
  },
  footer: {
    alignItems: 'center',
    marginTop: 48,
  },
  footerText: {
    fontSize: 14,
    color: '#888888',
  },
});