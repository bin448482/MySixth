import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { HistoryList, HistoryDetail } from '@/components/history';
import { HistoryService } from '@/lib/services/HistoryService';

export default function HistoryScreen() {
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  // 模拟用户ID，实际应用中应该从全局状态或认证系统获取
  // TODO: 替换为真实的用户ID管理
  const userId = 'anonymous_user';

  const handleHistoryPress = (historyId: string) => {
    setSelectedHistoryId(historyId);
  };

  const handleBackToList = () => {
    setSelectedHistoryId(null);
  };

  if (selectedHistoryId) {
    return (
      <SafeAreaView style={styles.container}>
        {/* 详情页自定义标题栏 */}
        <View style={styles.customHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToList}
          >
            <Ionicons name="arrow-back" size={24} color="#d4af37" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>占卜详情</Text>
          <View style={styles.headerSpacer} />
        </View>

        <HistoryDetail
          historyId={selectedHistoryId}
          onBack={handleBackToList}
          style={styles.detailContainer}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 列表页自定义标题栏 */}
      <View style={styles.customHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#d4af37" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>占卜历史</Text>
        <View style={styles.headerSpacer} />
      </View>

      <HistoryList
        userId={userId}
        onHistoryPress={handleHistoryPress}
        style={styles.historyList}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  // 自定义标题栏样式（与卡牌说明页面保持一致）
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
  historyList: {
    flex: 1,
  },
  detailContainer: {
    flex: 1,
  },
});