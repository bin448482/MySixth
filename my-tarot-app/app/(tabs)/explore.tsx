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
import { DataImporter } from '@/lib/data/DataImporter';
import { DatabaseService } from '@/lib/services/DatabaseService';

export default function TabTwoScreen() {
  const [isReloading, setIsReloading] = useState(false);

  const reloadDimensions = async () => {
    setIsReloading(true);
    try {
      const dbService = DatabaseService.getInstance();
      const dataImporter = DataImporter.getInstance();

      // 初始化数据库连接
      const initResult = await dbService.initialize();
      if (!initResult.success) {
        throw new Error(`Database initialization failed: ${initResult.error}`);
      }

      // 清空dimensions表
      const clearResult = await dataImporter.clearTable('dimension');
      if (!clearResult.success) {
        throw new Error(`Failed to clear dimensions table: ${clearResult.error}`);
      }

      // 重新导入dimensions
      const importResult = await dataImporter.importDimensions();
      if (importResult.status !== 'completed') {
        throw new Error(`Failed to import dimensions: ${importResult.error}`);
      }

      Alert.alert(
        '成功',
        `已成功重新加载 ${importResult.result?.imported || 0} 个解读维度`,
        [{ text: '确定' }]
      );
    } catch (error) {
      console.error('Error reloading dimensions:', error);
      Alert.alert(
        '错误',
        `重新加载失败: ${error instanceof Error ? error.message : '未知错误'}`,
        [{ text: '确定' }]
      );
    } finally {
      setIsReloading(false);
    }
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
          onPress={reloadDimensions}
          disabled={isReloading}
        >
          <ThemedText style={styles.reloadButtonText}>
            {isReloading ? '正在重新加载...' : '重新加载解读维度数据'}
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
});
