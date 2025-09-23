import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface PrivacyItem {
  id: string;
  title: string;
  icon: string;
  summary: string;
  details: string;
}

interface PrivacyCardProps {
  item: PrivacyItem;
  expanded: boolean;
  onToggle: () => void;
}

const PrivacyCard: React.FC<PrivacyCardProps> = ({ item, expanded, onToggle }) => {
  const rotation = useSharedValue(0);
  const height = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withTiming(expanded ? 180 : 0, { duration: 300 });
    height.value = withTiming(expanded ? 1 : 0, { duration: 300 });
  }, [expanded]);

  const iconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const contentStyle = useAnimatedStyle(() => {
    const opacity = interpolate(height.value, [0, 1], [0, 1]);
    return {
      opacity,
      maxHeight: height.value * 200, // 预估最大高度
    };
  });

  return (
    <View style={styles.privacyCard}>
      <TouchableOpacity style={styles.cardHeader} onPress={onToggle} activeOpacity={0.7}>
        <View style={styles.headerLeft}>
          <Text style={styles.privacyIcon}>{item.icon}</Text>
          <View style={styles.headerContent}>
            <Text style={styles.privacyTitle}>{item.title}</Text>
            <Text style={styles.privacySummary}>{item.summary}</Text>
          </View>
        </View>
        <Animated.View style={iconStyle}>
          <Ionicons name="chevron-down" size={20} color="#d4af37" />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View style={[styles.expandableContent, contentStyle]}>
        <Text style={styles.privacyDetails}>{item.details}</Text>
      </Animated.View>
    </View>
  );
};

export const PrivacySection: React.FC = () => {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const privacyItems: PrivacyItem[] = [
    {
      id: "collection",
      title: "数据收集说明",
      icon: "📊",
      summary: "我们遵循最小化、必要性原则收集数据",
      details: "我们仅收集提供服务所必需的数据，包括：\n\n• 占卜记录：您的占卜问题、选择的卡牌、解读结果\n• 使用偏好：界面设置、语言偏好等个性化配置\n• 设备信息：设备型号、操作系统版本（用于兼容性优化）\n• 使用统计：功能使用频率、操作路径（用于改善用户体验）\n\n我们承诺不收集您的姓名、地址、电话等个人身份信息。"
    },
    {
      id: "usage",
      title: "数据使用方式",
      icon: "🎯",
      summary: "用于改进体验与个性化，不出售数据",
      details: "您的数据仅用于以下目的：\n\n• 提供塔罗牌解读服务\n• 保存和同步您的占卜历史\n• 改善应用功能和用户体验\n• 提供个性化推荐和设置\n• 技术支持和客户服务\n\n我们承诺：\n• 绝不将您的数据出售给第三方\n• 不用于广告投放或营销目的\n• 不与其他应用或服务共享个人数据"
    },
    {
      id: "protection",
      title: "数据保护承诺",
      icon: "🔒",
      summary: "加密存储、定期审计、支持导出与删除",
      details: "我们采用行业标准的安全措施保护您的数据：\n\n• 加密存储：所有数据采用AES-256加密存储\n• 传输安全：使用HTTPS/TLS加密传输\n• 访问控制：严格限制数据访问权限\n• 定期审计：定期进行安全审计和漏洞扫描\n• 备份保护：安全的数据备份和恢复机制\n\n您的权利：\n• 随时查看和导出您的数据\n• 请求删除您的所有数据\n• 修正或更新您的信息\n• 撤回数据使用同意"
    }
  ];

  const handleToggle = (itemId: string) => {
    setExpandedItem(expandedItem === itemId ? null : itemId);
  };

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>隐私政策</Text>

      <BlurView intensity={20} style={styles.cardContainer}>
        <View style={styles.privacyList}>
          {privacyItems.map((item) => (
            <PrivacyCard
              key={item.id}
              item={item}
              expanded={expandedItem === item.id}
              onToggle={() => handleToggle(item.id)}
            />
          ))}
        </View>

        {/* 联系方式 */}
        <View style={styles.contactInfo}>
          <Text style={styles.contactTitle}>📧 隐私问题咨询</Text>
          <Text style={styles.contactContent}>
            如果您对我们的隐私政策有任何疑问，请通过以下方式联系我们：
          </Text>
          <Text style={styles.contactEmail}>privacy@tarotapp.com</Text>
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

  privacyList: {
    marginBottom: 20,
  },

  privacyCard: {
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    marginBottom: 12,
    overflow: 'hidden',
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },

  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  privacyIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },

  headerContent: {
    flex: 1,
  },

  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d4af37',
    marginBottom: 4,
  },

  privacySummary: {
    fontSize: 14,
    color: '#8b8878',
    lineHeight: 18,
  },

  expandableContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    overflow: 'hidden',
  },

  privacyDetails: {
    fontSize: 14,
    lineHeight: 20,
    color: '#e6e6fa',
    marginLeft: 32, // 对齐图标后的内容
  },

  // 联系信息样式
  contactInfo: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    padding: 16,
  },

  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d4af37',
    marginBottom: 8,
  },

  contactContent: {
    fontSize: 14,
    lineHeight: 18,
    color: '#e6e6fa',
    marginBottom: 8,
  },

  contactEmail: {
    fontSize: 14,
    color: '#d4af37',
    textDecorationLine: 'underline',
  },
});