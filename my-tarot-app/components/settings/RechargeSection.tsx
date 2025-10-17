import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Linking } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { UserTransaction } from '../../lib/services/UserService';
import { apiConfig } from '../../lib/config/api';
import { useTranslation } from '@/lib/hooks/useTranslation';

interface RechargeRecord {
  id: string;
  amount: number;
  credits: number;
  timestamp: string;
  status: 'success' | 'pending' | 'failed';
  channel: string;
}

interface RechargePackage {
  amount: number;
  credits: number;
  popular?: boolean;
}

interface RechargeSectionProps {
  currentCredits?: number;
  userEmail?: string;
  rechargeHistory?: UserTransaction[];
}

interface PackageCardProps {
  package: RechargePackage;
  onPress: () => void;
}

interface HistoryItemProps {
  record: UserTransaction;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ record }) => {
  const { t, i18n } = useTranslation('settings');
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const getStatusColor = (type: string) => {
    switch (type) {
      case 'recharge': return '#27ae60';
      case 'consume': return '#e74c3c';
      case 'refund': return '#f39c12';
      default: return '#8b8878';
    }
  };

  const getStatusText = (type: string) => {
    const key = `recharge.history.status.${type}`;
    const translation = t(key);
    return translation === key ? t('recharge.history.status.other') : translation;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString(locale, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <View style={styles.historyItem}>
      <View style={styles.historyLeft}>
        <Text style={styles.historyDescription}>{record.description}</Text>
        <Text style={styles.historyTime}>{formatDate(record.created_at)}</Text>
      </View>
      <View style={styles.historyRight}>
        <Text style={[
          styles.historyCredits,
          { color: record.credit_change > 0 ? '#27ae60' : '#e74c3c' }
        ]}>
          {t('recharge.history.creditChange', {
            sign: record.credit_change > 0 ? '+' : record.credit_change < 0 ? '-' : '',
            value: Math.abs(record.credit_change),
          })}
        </Text>
        <Text style={[styles.historyStatus, { color: getStatusColor(record.transaction_type) }]}>
          {getStatusText(record.transaction_type)}
        </Text>
      </View>
    </View>
  );
};

const resolveRedeemOrigin = (): string => {
  try {
    const parsed = new URL(apiConfig.baseUrl);
    return `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    const trimmed = apiConfig.baseUrl.trim();
    const match = trimmed.match(/^(https?:\/\/[^/:]+)(?::\d+)?/i);
    return match ? match[1] : trimmed;
  }
};

export const RechargeSection: React.FC<RechargeSectionProps> = ({
  currentCredits = 0,
  userEmail,
  rechargeHistory = []
}) => {
  const { t } = useTranslation('settings');
  const handleRedeemCode = async () => {
    try {
      const origin = resolveRedeemOrigin();
      const redeemUrl = new URL(
        '/verify-email?installation_id=23049RAD8C',
        origin
      ).toString();

      const canOpen = await Linking.canOpenURL(redeemUrl);
      if (!canOpen) {
        console.warn('Redeem URL cannot be opened:', redeemUrl);
        return;
      }

      await Linking.openURL(redeemUrl);
    } catch (err) {
      console.error('Failed to open redeem URL:', err);
    }
  };

  const renderHistoryItem = ({ item }: { item: UserTransaction }) => (
    <HistoryItem record={item} />
  );

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{t('recharge.title')}</Text>

      <BlurView intensity={20} style={styles.cardContainer}>
        {/* 用户信息区域 */}
        <View style={styles.userInfoCard}>
          {userEmail && (
            <View style={styles.emailContainer}>
              <Ionicons name="mail" size={16} color="#d4af37" />
              <Text style={styles.emailText}>{userEmail}</Text>
            </View>
          )}
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>{t('recharge.balance.label')}</Text>
            <Text style={styles.balanceAmount}>{currentCredits}</Text>
            <Text style={styles.balanceNote}>{t('recharge.balance.note')}</Text>
          </View>
        </View>

        {/* 兑换码充值按钮 */}
        <TouchableOpacity
          style={styles.redeemButton}
          onPress={handleRedeemCode}
          activeOpacity={0.7}
        >
          <View style={styles.redeemButtonContent}>
            <View style={styles.redeemButtonLeft}>
              <Ionicons name="gift" size={20} color="#d4af37" />
              <Text style={styles.redeemButtonTitle}>{t('recharge.redeem.title')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#8b8878" />
          </View>
        </TouchableOpacity>

        {/* 充值记录（按需求暂时隐藏最近交易记录内容） */}
        {/*
        {rechargeHistory.length > 0 && (
          <View style={styles.historyContainer}>
            <Text style={styles.subsectionTitle}>{t('recharge.history.title')}</Text>
            <FlatList
              data={rechargeHistory.slice(0, 5)} // 只显示最近5条
              renderItem={renderHistoryItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
            {rechargeHistory.length > 5 && (
              <TouchableOpacity style={styles.viewMoreButton}>
                <Text style={styles.viewMoreText}>{t('recharge.history.viewMore')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        */}
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

  subsectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#d4af37',
    marginBottom: 12,
  },

  // 用户信息卡片
  userInfoCard: {
    paddingVertical: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
  },

  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },

  emailText: {
    fontSize: 14,
    color: '#e6e6fa',
    marginLeft: 8,
    fontFamily: 'monospace',
  },

  balanceContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  balanceLabel: {
    fontSize: 14,
    color: '#8b8878',
    marginBottom: 8,
  },

  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#d4af37',
    marginBottom: 4,
  },

  balanceNote: {
    fontSize: 12,
    color: '#8b8878',
  },

  // 兑换码充值按钮
  redeemButton: {
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    marginBottom: 20,
  },

  redeemButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  redeemButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  redeemButtonTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#d4af37',
    marginLeft: 12,
  },

  // 交易记录
  historyContainer: {
    marginTop: 8,
  },

  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderRadius: 8,
    marginBottom: 8,
  },

  historyLeft: {
    flex: 1,
  },

  historyDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#e6e6fa',
    marginBottom: 2,
  },

  historyTime: {
    fontSize: 12,
    color: '#8b8878',
  },

  historyRight: {
    alignItems: 'flex-end',
  },

  historyCredits: {
    fontSize: 14,
    fontWeight: '500',
    color: '#d4af37',
    marginBottom: 2,
  },

  historyStatus: {
    fontSize: 12,
    fontWeight: '500',
  },

  viewMoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },

  viewMoreText: {
    fontSize: 14,
    color: '#d4af37',
    textDecorationLine: 'underline',
  },
});
