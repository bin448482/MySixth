import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { BlurView } from 'expo-blur';

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
  rechargeHistory?: RechargeRecord[];
}

interface PackageCardProps {
  package: RechargePackage;
  onPress: () => void;
}

interface HistoryItemProps {
  record: RechargeRecord;
}

const rechargePackages: RechargePackage[] = [
  { amount: 10, credits: 10, popular: false },
  { amount: 30, credits: 30, popular: true },
  { amount: 50, credits: 50, popular: false },
  { amount: 100, credits: 100, popular: false },
  { amount: 300, credits: 300, popular: false },
  { amount: 500, credits: 500, popular: false }
];

const PackageCard: React.FC<PackageCardProps> = ({ package: pkg, onPress }) => {
  return (
    <TouchableOpacity style={styles.packageCard} onPress={onPress} activeOpacity={0.7}>
      {pkg.popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>推荐</Text>
        </View>
      )}
      <Text style={styles.packageAmount}>¥{pkg.amount}</Text>
      <Text style={styles.packageCredits}>{pkg.credits} 积分</Text>
    </TouchableOpacity>
  );
};

const HistoryItem: React.FC<HistoryItemProps> = ({ record }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#27ae60';
      case 'pending': return '#f39c12';
      case 'failed': return '#e74c3c';
      default: return '#8b8878';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success': return '成功';
      case 'pending': return '处理中';
      case 'failed': return '失败';
      default: return '未知';
    }
  };

  return (
    <View style={styles.historyItem}>
      <View style={styles.historyLeft}>
        <Text style={styles.historyAmount}>¥{record.amount}</Text>
        <Text style={styles.historyTime}>{record.timestamp}</Text>
      </View>
      <View style={styles.historyRight}>
        <Text style={styles.historyCredits}>+{record.credits} 积分</Text>
        <Text style={[styles.historyStatus, { color: getStatusColor(record.status) }]}>
          {getStatusText(record.status)}
        </Text>
      </View>
    </View>
  );
};

export const RechargeSection: React.FC<RechargeSectionProps> = ({
  currentCredits = 0,
  rechargeHistory = []
}) => {
  const handlePackagePress = (pkg: RechargePackage) => {
    // TODO: 实现充值逻辑
    console.log('充值套餐选择:', pkg);
  };

  const renderPackage = ({ item }: { item: RechargePackage }) => (
    <PackageCard
      package={item}
      onPress={() => handlePackagePress(item)}
    />
  );

  const renderHistoryItem = ({ item }: { item: RechargeRecord }) => (
    <HistoryItem record={item} />
  );

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>积分管理</Text>

      <BlurView intensity={20} style={styles.cardContainer}>
        {/* 当前余额 */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>当前积分余额</Text>
          <Text style={styles.balanceAmount}>{currentCredits}</Text>
          <Text style={styles.balanceNote}>1 积分 = 1 元人民币</Text>
        </View>

        {/* 充值套餐 */}
        <View style={styles.packagesContainer}>
          <Text style={styles.subsectionTitle}>充值套餐</Text>
          <FlatList
            data={rechargePackages}
            renderItem={renderPackage}
            keyExtractor={(item) => `${item.amount}`}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={styles.packageRow}
            contentContainerStyle={styles.packageGrid}
          />
        </View>

        {/* 充值记录 */}
        {rechargeHistory.length > 0 && (
          <View style={styles.historyContainer}>
            <Text style={styles.subsectionTitle}>充值记录</Text>
            <FlatList
              data={rechargeHistory.slice(0, 5)} // 只显示最近5条
              renderItem={renderHistoryItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
            {rechargeHistory.length > 5 && (
              <TouchableOpacity style={styles.viewMoreButton}>
                <Text style={styles.viewMoreText}>查看更多</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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

  // 余额卡片
  balanceCard: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 24,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
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

  // 充值套餐
  packagesContainer: {
    marginBottom: 24,
  },

  packageGrid: {
    gap: 12,
  },

  packageRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  packageCard: {
    flex: 0.48,
    aspectRatio: 1.2,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  popularBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#f39c12',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },

  popularText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },

  packageAmount: {
    fontSize: 20,
    fontWeight: '600',
    color: '#d4af37',
    marginBottom: 4,
  },

  packageCredits: {
    fontSize: 14,
    color: '#e6e6fa',
  },

  // 充值记录
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

  historyAmount: {
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