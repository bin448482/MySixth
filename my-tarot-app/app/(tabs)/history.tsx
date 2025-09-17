import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
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
      <HistoryDetail
        historyId={selectedHistoryId}
        onBack={handleBackToList}
        style={styles.container}
      />
    );
  }

  return (
    <View style={styles.container}>
      <HistoryList
        userId={userId}
        onHistoryPress={handleHistoryPress}
        style={styles.historyList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
    paddingTop: 60, // 为顶部状态栏和时间留出空间
  },
  historyList: {
    flex: 1,
  },
});