import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { CollapsibleSection } from '../common/CollapsibleSection';

interface AppInfoSectionProps {
  version?: string;
  buildNumber?: string;
}

interface InfoCardProps {
  icon: string;
  title: string;
  content: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon, title, content }) => {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={styles.infoContent}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoText}>{content}</Text>
      </View>
    </View>
  );
};

export const AppInfoSection: React.FC<AppInfoSectionProps> = ({
  version = Constants.expoConfig?.version || "1.0.0",
  buildNumber = "1"
}) => {
  return (
    <CollapsibleSection
      title="应用信息"
      icon="📱"
      defaultExpanded={false}
    >
      {/* Logo区域 */}
      <View style={styles.logoContainer}>
        <Text style={styles.appLogo}>🔮</Text>
        <Text style={styles.appName}>神秘塔罗牌</Text>
        <Text style={styles.versionText}>v{version} ({buildNumber})</Text>
      </View>

      {/* 愿景使命 */}
      <View style={styles.missionContainer}>
        <InfoCard
          icon="✨"
          title="我们的愿景"
          content="为用户提供深入、个性化的塔罗牌洞察"
        />
        <InfoCard
          icon="🎯"
          title="我们的使命"
          content="结合传统塔罗智慧与现代AI技术，帮助用户探索内心世界"
        />
      </View>
    </CollapsibleSection>
  );
};

const styles = StyleSheet.create({
  // Logo区域样式
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },

  appLogo: {
    fontSize: 48,
    marginBottom: 8,
  },

  appName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#d4af37',
    marginBottom: 4,
  },

  versionText: {
    fontSize: 14,
    color: '#8b8878',
  },

  // 使命愿景区域
  missionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
  },

  infoIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#d4af37',
    marginBottom: 4,
  },

  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#e6e6fa',
  },
});