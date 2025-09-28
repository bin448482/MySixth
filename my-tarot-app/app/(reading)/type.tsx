import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useReadingFlow } from '@/lib/contexts/ReadingContext';
import { useAppContext } from '@/lib/contexts/AppContext';

export default function TypeSelectionScreen() {
  const router = useRouter();
  const { updateStep, updateType } = useReadingFlow();
  const { state } = useAppContext();

  const isAIServiceAvailable = state.isAIServiceAvailable;
  const isCheckingService = state.isCheckingAIService || !state.isAppInitialized;

  const handleTypeSelect = async (type: 'offline' | 'ai') => {
    if (type === 'ai' && !isAIServiceAvailable) {
      return; // Prevent selection if AI service is unavailable
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
          请选择您希望的占卜方式
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
            isAIServiceAvailable ? styles.availableOption : styles.disabledOption
          ]}
          onPress={() => handleTypeSelect('ai')}
          activeOpacity={isAIServiceAvailable ? 0.8 : 1}
          disabled={!isAIServiceAvailable}
        >
          <View style={styles.iconContainer}>
            <Text style={[
              styles.icon,
              isAIServiceAvailable ? styles.availableIcon : styles.disabledIcon
            ]}>🤖</Text>
          </View>
          <Text style={[
            styles.optionTitle,
            isAIServiceAvailable ? styles.availableTitle : styles.disabledTitle
          ]}>
            AI占卜
          </Text>
          <Text style={[
            styles.optionDescription,
            isAIServiceAvailable ? styles.availableDescription : styles.disabledDescription
          ]}>
            {isCheckingService
              ? '正在检查服务状态...'
              : isAIServiceAvailable
                ? '智能解读服务，个性化分析'
                : 'AI服务暂时不可用，请稍后重试'
            }
          </Text>
          <Text style={[
            styles.optionStatus,
            isAIServiceAvailable ? styles.availableStatus : styles.disabledStatus
          ]}>
            {isCheckingService
              ? '[检查中...]'
              : isAIServiceAvailable
                ? '[可用]'
                : '[不可用]'
            }
          </Text>
          {isCheckingService && (
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