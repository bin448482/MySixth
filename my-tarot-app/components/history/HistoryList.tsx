import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { UserDatabaseService } from '../../lib/database/user-db';
import type { ParsedUserHistory, HistoryFilter, HistoryPaginationQuery } from '../../lib/types/user';
import { HistoryListItem } from './HistoryListItem';
import { HistoryFilterBar } from './HistoryFilterBar';

interface HistoryListProps {
  userId: string;
  onHistoryPress: (historyId: string) => void;
  style?: any;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  userId,
  onHistoryPress,
  style,
}) => {
  const [histories, setHistories] = useState<ParsedUserHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 筛选和分页状态
  const [filter, setFilter] = useState<HistoryFilter>({ mode: 'all' });
  const [pagination, setPagination] = useState<HistoryPaginationQuery>({
    limit: 100,
    offset: 0,
    orderBy: 'timestamp',
    orderDirection: 'DESC',
  });

  const userDbService = UserDatabaseService.getInstance();
  const opacity = useSharedValue(0);

  // 加载历史记录 - 查询所有匿名用户的记录
  const loadHistories = useCallback(async (
    reset = false,
    currentFilter = filter,
    currentPagination = pagination
  ) => {
    try {
      if (reset) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      // 查询多个可能的匿名用户ID
      const possibleUserIds = ['anonymous_user', 'anonymous'];
      let allHistories: ParsedUserHistory[] = [];
      let totalCount = 0;

      for (const uid of possibleUserIds) {
        try {
          const histories = await userDbService.getUserHistory(
            uid,
            currentPagination,
            currentFilter
          );
          const count = await userDbService.getUserHistoryCount(uid, currentFilter);

          allHistories = [...allHistories, ...histories];
          totalCount += count;
        } catch (err) {
          // 忽略单个用户ID的查询错误，继续查询其他ID
          console.warn(`Failed to query histories for user ${uid}:`, err);
        }
      }

      // 按时间戳排序
      allHistories.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      if (reset) {
        setHistories(allHistories);
      } else {
        setHistories(prev => [...prev, ...allHistories]);
      }

      // 检查是否还有更多数据
      const currentTotal = reset ? allHistories.length : histories.length + allHistories.length;
      setHasMore(currentTotal < totalCount);

    } catch (err) {
      console.error('Error loading histories:', err);
      setError(err instanceof Error ? err.message : '加载历史记录失败');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);

      // 淡入动画
      opacity.value = withTiming(1, { duration: 300 });
    }
  }, [filter, pagination, histories.length]);

  // 初始加载
  useEffect(() => {
    loadHistories(true);
  }, []);

  // 筛选器变化时重新加载
  const handleFilterChange = useCallback((newFilter: HistoryFilter) => {
    setFilter(newFilter);
    const newPagination = { ...pagination, offset: 0 };
    setPagination(newPagination);
    loadHistories(true, newFilter, newPagination);
  }, [pagination]);

  // 下拉刷新
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    const resetPagination = { ...pagination, offset: 0 };
    setPagination(resetPagination);
    loadHistories(true, filter, resetPagination);
  }, [filter, pagination]);

  // 加载更多
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPagination = {
        ...pagination,
        offset: histories.length,
      };
      setPagination(nextPagination);
      loadHistories(false, filter, nextPagination);
    }
  }, [loadingMore, hasMore, pagination, histories.length, filter]);

  // 渲染列表项
  const renderHistoryItem = useCallback(({ item, index }: { item: ParsedUserHistory; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50)}>
      <HistoryListItem
        history={item}
        onPress={() => onHistoryPress(item.id)}
      />
    </Animated.View>
  ), [onHistoryPress]);

  // 渲染底部加载器
  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#ffd700" />
        <Text style={styles.loadingText}>加载更多...</Text>
      </View>
    );
  };

  // 渲染空状态
  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🔮</Text>
        <Text style={styles.emptyTitle}>暂无占卜历史</Text>
        <Text style={styles.emptyDescription}>
          {filter.mode === 'all'
            ? '开始你的第一次塔罗占卜吧'
            : '该筛选条件下暂无记录'
          }
        </Text>
      </View>
    );
  };

  // 动画样式
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#ffd700" />
        <Text style={styles.loadingText}>加载历史记录...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadHistories(true)}>
          <Text style={styles.retryButtonText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, style, animatedStyle]}>
      <HistoryFilterBar
        filter={filter}
        onFilterChange={handleFilterChange}
      />

      <FlatList
        data={histories}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#ffd700"
            colors={['#ffd700']}
          />
        }
        style={styles.list}
        contentContainerStyle={histories.length === 0 ? styles.emptyList : styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // 更新为与卡牌说明页面一致的背景色
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    color: '#e6e6fa',
    marginLeft: 8,
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#e6e6fa',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    color: '#8b8878',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    color: '#8b0000',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#ffd700',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: '600',
  },
});