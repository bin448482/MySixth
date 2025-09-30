import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import Constants from 'expo-constants';
import { CollapsibleSection } from '../common/CollapsibleSection';

interface SupportButtonProps {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}

const SupportButton: React.FC<SupportButtonProps> = ({ icon, title, subtitle, onPress }) => {
  return (
    <TouchableOpacity style={styles.supportButton} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.buttonLeft}>
        <Text style={styles.buttonIcon}>{icon}</Text>
        <View style={styles.buttonContent}>
          <Text style={styles.buttonTitle}>{title}</Text>
          <Text style={styles.buttonSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Text style={styles.buttonArrow}>›</Text>
    </TouchableOpacity>
  );
};

export const SupportSection: React.FC = () => {
  const handleContact = (type: string) => {
    switch (type) {
      case 'email':
        handleEmailContact();
        break;
      case 'feedback':
        handleFeedback();
        break;
      case 'update':
        handleCheckUpdate();
        break;
      case 'help':
        handleHelp();
        break;
      case 'faq':
        handleFAQ();
        break;
      default:
        break;
    }
  };

  const handleEmailContact = async () => {
    const email = 'support@tarotapp.com';
    const subject = '塔罗牌应用 - 用户咨询';
    const body = `
应用版本: ${Constants.expoConfig?.version || '1.0.0'}
设备信息: ${Constants.deviceName || 'Unknown'}
问题描述:

[请在此处描述您遇到的问题或需要咨询的内容]
    `.trim();

    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          '无法打开邮箱',
          `请手动发送邮件至: ${email}`,
          [{ text: '确定' }]
        );
      }
    } catch (error) {
      Alert.alert(
        '邮箱打开失败',
        `请手动发送邮件至: ${email}`,
        [{ text: '确定' }]
      );
    }
  };

  const handleFeedback = () => {
    Alert.alert(
      '用户反馈',
      '感谢您的反馈！您可以通过以下方式向我们提供建议：\n\n1. 发送邮件至 feedback@tarotapp.com\n2. 在应用商店留下评价\n3. 加入我们的用户群交流',
      [
        { text: '发送邮件', onPress: () => handleContact('email') },
        { text: '取消', style: 'cancel' }
      ]
    );
  };

  const handleCheckUpdate = () => {
    // 模拟检查更新
    Alert.alert(
      '检查更新',
      `当前版本: ${Constants.expoConfig?.version || '1.0.0'}\n\n您已经使用的是最新版本！`,
      [{ text: '确定' }]
    );
  };

  const handleHelp = () => {
    Alert.alert(
      '使用帮助',
      '以下是一些常用功能的快速指南：\n\n• 占卜流程：选择类型 → 输入问题 → 抽牌 → 查看解读\n• 历史记录：可查看所有占卜历史和详细解读\n• 卡牌说明：了解78张塔罗牌的含义和背景\n• AI解读：获得更个性化的深度解读',
      [{ text: '确定' }]
    );
  };

  const handleFAQ = () => {
    Alert.alert(
      '常见问题',
      '以下是一些常见问题的解答：\n\nQ: 塔罗牌准确吗？\nA: 塔罗牌是心理投射工具，重在启发思考。\n\nQ: AI解读如何收费？\nA: 按积分消费，1积分=1元。\n\nQ: 数据会丢失吗？\nA: 数据本地存储并可云端同步。\n\nQ: 如何删除历史记录？\nA: 在历史页面长按记录即可删除。',
      [{ text: '确定' }]
    );
  };

  return (
    <CollapsibleSection
      title="帮助与支持"
      icon="🆘"
      defaultExpanded={false}
    >
      {/* 联系支持 */}
      <View style={styles.supportGroup}>
        <Text style={styles.groupTitle}>联系我们</Text>

        <SupportButton
          icon="✉️"
          title="邮件客服"
          subtitle="发送邮件获取专业帮助"
          onPress={() => handleContact('email')}
        />

        <SupportButton
          icon="💬"
          title="用户反馈"
          subtitle="分享您的建议和意见"
          onPress={() => handleContact('feedback')}
        />
      </View>

      {/* 应用相关 */}
      <View style={styles.supportGroup}>
        <Text style={styles.groupTitle}>应用信息</Text>

        <SupportButton
          icon="🔄"
          title="检查更新"
          subtitle="获取最新版本和功能"
          onPress={() => handleContact('update')}
        />

        <SupportButton
          icon="❓"
          title="使用帮助"
          subtitle="了解应用功能和操作指南"
          onPress={() => handleContact('help')}
        />

        <SupportButton
          icon="📋"
          title="常见问题"
          subtitle="查看常见问题解答"
          onPress={() => handleContact('faq')}
        />
      </View>

      {/* 版本信息 */}
      <View style={styles.versionInfo}>
        <Text style={styles.versionTitle}>版本信息</Text>
        <View style={styles.versionDetails}>
          <View style={styles.versionRow}>
            <Text style={styles.versionLabel}>应用版本</Text>
            <Text style={styles.versionValue}>{Constants.expoConfig?.version || '1.0.0'}</Text>
          </View>
          <View style={styles.versionRow}>
            <Text style={styles.versionLabel}>构建版本</Text>
            <Text style={styles.versionValue}>1</Text>
          </View>
          <View style={styles.versionRow}>
            <Text style={styles.versionLabel}>更新时间</Text>
            <Text style={styles.versionValue}>2024-01-01</Text>
          </View>
        </View>
      </View>
    </CollapsibleSection>
  );
};

const styles = StyleSheet.create({
  // 支持分组
  supportGroup: {
    marginBottom: 24,
  },

  groupTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#d4af37',
    marginBottom: 12,
  },

  // 支持按钮
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
    marginBottom: 8,
  },

  buttonLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  buttonIcon: {
    fontSize: 20,
    marginRight: 12,
  },

  buttonContent: {
    flex: 1,
  },

  buttonTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#e6e6fa',
    marginBottom: 2,
  },

  buttonSubtitle: {
    fontSize: 14,
    color: '#8b8878',
    lineHeight: 18,
  },

  buttonArrow: {
    fontSize: 20,
    color: '#d4af37',
    fontWeight: '300',
  },

  // 版本信息
  versionInfo: {
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
    padding: 16,
  },

  versionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#d4af37',
    marginBottom: 12,
  },

  versionDetails: {
    gap: 8,
  },

  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  versionLabel: {
    fontSize: 14,
    color: '#8b8878',
  },

  versionValue: {
    fontSize: 14,
    color: '#e6e6fa',
    fontWeight: '500',
  },
});