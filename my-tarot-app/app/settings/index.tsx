import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '@/components/common/GradientBackground';
import {
  AppInfoSection,
  RechargeSection,
  DisclaimerSection,
  PrivacySection,
  SupportSection
} from '@/components/settings';
import UserService, { BalanceResponse, UserStatsResponse, UserTransaction } from '@/lib/services/UserService';

export default function SettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userBalance, setUserBalance] = useState<BalanceResponse | null>(null);
  const [userStats, setUserStats] = useState<UserStatsResponse | null>(null);
  const [transactions, setTransactions] = useState<UserTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    console.log('🔄 === 加载用户数据 ===');
    setLoading(true);
    setError(null);

    try {
      const userService = UserService.getInstance();
      const userInfo = await userService.getUserInfo();

      setUserBalance(userInfo.balance);
      setUserStats(userInfo.stats);
      setTransactions(userInfo.transactions);

      console.log('✅ 用户数据加载成功');
    } catch (err) {
      console.error('❌ 加载用户数据失败:', err);
      setError('加载用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <GradientBackground>
        {/* 自定义标题栏 */}
        <View style={styles.customHeader}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#d4af37" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>系统说明</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* 滚动内容区域 */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <AppInfoSection />
          <RechargeSection
            currentCredits={userBalance?.credits || 0}
            userEmail={undefined} // 目前后端没有返回邮箱信息
            rechargeHistory={transactions}
          />
          <DisclaimerSection />
          <PrivacySection />
          <SupportSection />

          {/* 加载状态和错误提示 */}
          {loading && (
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>正在加载用户信息...</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadUserData}>
                <Text style={styles.retryText}>重试</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </GradientBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },

  // 自定义标题栏样式
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 60,
    backgroundColor: 'rgba(20, 20, 40, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.3)',
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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

  // 滚动区域样式
  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 40,
  },

  // 状态提示样式
  statusContainer: {
    padding: 20,
    alignItems: 'center',
  },

  statusText: {
    fontSize: 14,
    color: '#8b8878',
    textAlign: 'center',
  },

  errorContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },

  errorText: {
    fontSize: 14,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 12,
  },

  retryButton: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },

  retryText: {
    fontSize: 14,
    color: '#d4af37',
    fontWeight: '500',
  },
});