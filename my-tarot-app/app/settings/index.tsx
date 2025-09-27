import React from 'react';
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

export default function SettingsScreen() {
  const router = useRouter();

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
          <RechargeSection />
          <DisclaimerSection />
          <PrivacySection />
          <SupportSection />
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
});