import { Image } from 'expo-image';
import { Platform, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useState } from 'react';

import { Collapsible } from '@/components/ui/collapsible';
import { ExternalLink } from '@/components/external-link';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';
import { DatabaseService } from '@/lib/services/DatabaseService';
import { TestDataService } from '@/lib/services/TestDataService';
import { UserDatabaseService } from '@/lib/database/user-db';

export default function TabTwoScreen() {
  const [isReloading, setIsReloading] = useState(false);
  const [isGeneratingData, setIsGeneratingData] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);

  const checkDatabaseStatus = async () => {
    setIsReloading(true);
    try {
      const dbService = DatabaseService.getInstance();

      // 检查数据库状态（不执行初始化）
      const status = await dbService.getStatus();

      Alert.alert(
        '数据库状态',
        `数据库已初始化: ${status.isInitialized ? '是' : '否'}\n版本: ${status.version}`,
        [{ text: '确定' }]
      );
    } catch (error) {
      console.error('Error checking database:', error);
      Alert.alert(
        '错误',
        `数据库检查失败: ${error instanceof Error ? error.message : '未知错误'}`,
        [{ text: '确定' }]
      );
    } finally {
      setIsReloading(false);
    }
  };

  const viewRecentUserData = async () => {
    setIsGeneratingData(true);
    try {
      const userDbService = UserDatabaseService.getInstance();

      // 使用默认的测试用户ID来查看数据
      const testUserId = 'test_user';

      // 获取最近的用户数据
      const recentDataResult = await userDbService.getRecentUserHistory(testUserId, 7); // 最近7天

      if (recentDataResult.success && recentDataResult.data) {
        const recentData = recentDataResult.data;

        if (recentData.length === 0) {
          Alert.alert(
            '用户数据',
            '没有找到最近的用户数据',
            [{ text: '确定' }]
          );
        } else {
          const offlineCount = recentData.filter(item => item.interpretation_mode === 'default').length;
          const aiCount = recentData.filter(item => item.interpretation_mode === 'ai').length;

          Alert.alert(
            '最近用户数据',
            `找到 ${recentData.length} 条记录（最近7天）\n` +
            `离线解读: ${offlineCount} 条\n` +
            `AI解读: ${aiCount} 条\n\n` +
            `最新记录时间: ${recentData[0]?.timestamp || '无'}`,
            [{ text: '确定' }]
          );
        }
      } else {
        throw new Error(recentDataResult.error || '获取用户数据失败');
      }
    } catch (error) {
      console.error('Error viewing user data:', error);
      Alert.alert(
        '错误',
        `查看用户数据失败: ${error instanceof Error ? error.message : '未知错误'}`,
        [{ text: '确定' }]
      );
    } finally {
      setIsGeneratingData(false);
    }
  };

  const clearUserData = async () => {
    Alert.alert(
      '确认清除',
      '确定要清除所有用户数据吗？此操作不可恢复。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            setIsClearingData(true);
            try {
              const userDbService = UserDatabaseService.getInstance();

              // 清除所有用户数据
              const clearResult = await userDbService.clearAllUserData();

              if (clearResult.success) {
                Alert.alert(
                  '清除完成',
                  '所有用户数据已清除',
                  [{ text: '确定' }]
                );
              } else {
                throw new Error(clearResult.error || '清除用户数据失败');
              }
            } catch (error) {
              console.error('Error clearing user data:', error);
              Alert.alert(
                '错误',
                `清除用户数据失败: ${error instanceof Error ? error.message : '未知错误'}`,
                [{ text: '确定' }]
              );
            } finally {
              setIsClearingData(false);
            }
          }
        }
      ]
    );
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}>
          Explore
        </ThemedText>
      </ThemedView>
      <ThemedText>This app includes example code to help you get started.</ThemedText>

      <Collapsible title="数据管理">
        <ThemedText>管理应用数据和设置。</ThemedText>
        <TouchableOpacity
          style={styles.reloadButton}
          onPress={checkDatabaseStatus}
          disabled={isReloading}
        >
          <ThemedText style={styles.reloadButtonText}>
            {isReloading ? '正在检查...' : '检查数据库状态'}
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.reloadButton, styles.viewDataButton]}
          onPress={viewRecentUserData}
          disabled={isGeneratingData}
        >
          <ThemedText style={styles.reloadButtonText}>
            {isGeneratingData ? '正在查看...' : '查看最近用户数据'}
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.reloadButton, styles.clearDataButton]}
          onPress={clearUserData}
          disabled={isClearingData}
        >
          <ThemedText style={styles.reloadButtonText}>
            {isClearingData ? '正在清除...' : '清除用户数据'}
          </ThemedText>
        </TouchableOpacity>
      </Collapsible>
      <Collapsible title="File-based routing">
        <ThemedText>
          This app has two screens:{' '}
          <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> and{' '}
          <ThemedText type="defaultSemiBold">app/(tabs)/explore.tsx</ThemedText>
        </ThemedText>
        <ThemedText>
          The layout file in <ThemedText type="defaultSemiBold">app/(tabs)/_layout.tsx</ThemedText>{' '}
          sets up the tab navigator.
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/router/introduction">
          <ThemedText type="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Android, iOS, and web support">
        <ThemedText>
          You can open this project on Android, iOS, and the web. To open the web version, press{' '}
          <ThemedText type="defaultSemiBold">w</ThemedText> in the terminal running this project.
        </ThemedText>
      </Collapsible>
      <Collapsible title="Images">
        <ThemedText>
          For static images, you can use the <ThemedText type="defaultSemiBold">@2x</ThemedText> and{' '}
          <ThemedText type="defaultSemiBold">@3x</ThemedText> suffixes to provide files for
          different screen densities
        </ThemedText>
        <Image
          source={require('@/assets/images/react-logo.png')}
          style={{ width: 100, height: 100, alignSelf: 'center' }}
        />
        <ExternalLink href="https://reactnative.dev/docs/images">
          <ThemedText type="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Light and dark mode components">
        <ThemedText>
          This template has light and dark mode support. The{' '}
          <ThemedText type="defaultSemiBold">useColorScheme()</ThemedText> hook lets you inspect
          what the user&apos;s current color scheme is, and so you can adjust UI colors accordingly.
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
          <ThemedText type="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Animations">
        <ThemedText>
          This template includes an example of an animated component. The{' '}
          <ThemedText type="defaultSemiBold">components/HelloWave.tsx</ThemedText> component uses
          the powerful{' '}
          <ThemedText type="defaultSemiBold" style={{ fontFamily: Fonts.mono }}>
            react-native-reanimated
          </ThemedText>{' '}
          library to create a waving hand animation.
        </ThemedText>
        {Platform.select({
          ios: (
            <ThemedText>
              The <ThemedText type="defaultSemiBold">components/ParallaxScrollView.tsx</ThemedText>{' '}
              component provides a parallax effect for the header image.
            </ThemedText>
          ),
        })}
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  reloadButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  reloadButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  viewDataButton: {
    backgroundColor: '#34C759',
    marginTop: 8,
  },
  clearDataButton: {
    backgroundColor: '#FF3B30',
    marginTop: 8,
  },
});
