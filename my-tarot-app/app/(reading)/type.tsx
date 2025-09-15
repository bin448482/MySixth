import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useReadingFlow } from '@/lib/contexts/ReadingContext';

export default function TypeSelectionScreen() {
  const router = useRouter();
  const { updateStep } = useReadingFlow();

  const handleOfflineSelect = () => {
    updateStep(2);
    router.push('/(reading)/category');
  };

  const handleAISelect = () => {
    Alert.alert(
      'AI占卜功能',
      '智能塔罗牌解读功能即将推出，敬请期待！',
      [{ text: '了解', style: 'default' }]
    );
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>选择占卜方式</Text>
        <Text style={styles.subtitle}>
          请选择您希望的占卜方式
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.optionCard, styles.availableOption]}
          onPress={handleOfflineSelect}
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
          style={[styles.optionCard, styles.lockedOption]}
          onPress={handleAISelect}
          activeOpacity={0.8}
        >
          <View style={styles.iconContainer}>
            <Text style={[styles.icon, styles.lockedIcon]}>🤖</Text>
          </View>
          <Text style={[styles.optionTitle, styles.lockedTitle]}>
            AI占卜
          </Text>
          <Text style={[styles.optionDescription, styles.lockedDescription]}>
            智能解读服务即将推出
          </Text>
          <Text style={[styles.optionStatus, styles.lockedStatus]}>
            [锁定]
          </Text>
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
  lockedOption: {
    borderColor: '#666666',
    backgroundColor: '#0A0A15',
    opacity: 0.7,
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
  lockedIcon: {
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
  lockedTitle: {
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
  lockedDescription: {
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
  lockedStatus: {
    color: '#666666',
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