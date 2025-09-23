import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

interface DisclaimerItem {
  icon: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'suggestion' | 'restriction';
}

interface DisclaimerCardProps {
  item: DisclaimerItem;
}

const DisclaimerCard: React.FC<DisclaimerCardProps> = ({ item }) => {
  const getCardStyle = (type: string) => {
    switch (type) {
      case 'warning':
        return {
          backgroundColor: 'rgba(243, 156, 18, 0.1)',
          borderColor: 'rgba(243, 156, 18, 0.3)',
        };
      case 'suggestion':
        return {
          backgroundColor: 'rgba(39, 174, 96, 0.1)',
          borderColor: 'rgba(39, 174, 96, 0.3)',
        };
      case 'restriction':
        return {
          backgroundColor: 'rgba(231, 76, 60, 0.1)',
          borderColor: 'rgba(231, 76, 60, 0.3)',
        };
      default:
        return {
          backgroundColor: 'rgba(212, 175, 55, 0.05)',
          borderColor: 'rgba(212, 175, 55, 0.2)',
        };
    }
  };

  const cardStyle = getCardStyle(item.type);

  return (
    <View style={[styles.disclaimerCard, cardStyle]}>
      <View style={styles.cardHeader}>
        <Text style={styles.disclaimerIcon}>{item.icon}</Text>
        <Text style={styles.disclaimerTitle}>{item.title}</Text>
      </View>
      <Text style={styles.disclaimerContent}>{item.content}</Text>
    </View>
  );
};

export const DisclaimerSection: React.FC = () => {
  const disclaimers: DisclaimerItem[] = [
    {
      icon: "💫",
      title: "应用目的",
      content: "本应用旨在提供个人成长和自我探索的工具，帮助用户通过塔罗牌获得心理咨询和个人洞察，同时提供娱乐性和启发性体验。",
      type: 'info'
    },
    {
      icon: "⚠️",
      title: "免责声明",
      content: "塔罗牌解读仅供参考，不构成医学、法律、金融等专业建议。本应用不能替代心理咨询与专业诊断，用户需对自身决策承担责任。",
      type: 'warning'
    },
    {
      icon: "🧘",
      title: "使用建议",
      content: "建议用户保持开放和反思的心态，不要过度依赖占卜结果。请理性看待占卜内容，尊重个人意志和选择，将其作为思考和成长的辅助工具。",
      type: 'suggestion'
    },
    {
      icon: "👶",
      title: "年龄限制",
      content: "未成年人使用本应用需要监护人的同意和指导。我们建议家长陪同未成年人一起使用，确保正确理解和使用塔罗牌功能。",
      type: 'restriction'
    }
  ];

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>使用声明</Text>

      <BlurView intensity={20} style={styles.cardContainer}>
        <View style={styles.disclaimerList}>
          {disclaimers.map((item, index) => (
            <DisclaimerCard key={index} item={item} />
          ))}
        </View>

        {/* 重要提醒 */}
        <View style={styles.importantNotice}>
          <Text style={styles.noticeTitle}>⚡ 重要提醒</Text>
          <Text style={styles.noticeContent}>
            塔罗牌是一种心理投射工具，其价值在于帮助用户反思和探索内心。
            请将占卜结果作为参考和启发，而非绝对真理或行动指南。
          </Text>
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#d4af37',
    marginBottom: 16,
    textAlign: 'center',
  },

  cardContainer: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    overflow: 'hidden',
    backgroundColor: 'rgba(20, 20, 40, 0.6)',
    padding: 16,
  },

  disclaimerList: {
    marginBottom: 20,
  },

  disclaimerCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  disclaimerIcon: {
    fontSize: 20,
    marginRight: 8,
  },

  disclaimerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d4af37',
    flex: 1,
  },

  disclaimerContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#e6e6fa',
    marginLeft: 28, // 对齐图标后的文本
  },

  // 重要提醒样式
  importantNotice: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
    padding: 16,
  },

  noticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e74c3c',
    marginBottom: 8,
  },

  noticeContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#e6e6fa',
  },
});