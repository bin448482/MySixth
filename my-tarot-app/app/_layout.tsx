import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TamaguiProvider } from 'tamagui';
import tamaguiConfig from '../tamagui.config';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { DatabaseInitializer } from '@/lib/database/initializer';
import { AppProvider, useAppContext } from '@/lib/contexts/AppContext';
import { initializeApiConfig } from '@/lib/config/api';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const { actions } = useAppContext();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Starting app initialization...');

        // 1. 初始化API配置
        console.log('🌐 Initializing API configuration...');
        await initializeApiConfig();

        // 2. 初始化数据库
        console.log('🗄️ Starting database initialization...');
        const initializer = new DatabaseInitializer();
        const dbSuccess = await initializer.initialize();

        if (!dbSuccess) {
          console.error('❌ Database initialization failed');
          return;
        }

        console.log('✅ Database initialization completed successfully');

        // 3. 初始化应用状态（AI服务检查 + 认证）
        console.log('🔐 Starting app context initialization...');
        await actions.initializeApp();

        console.log('🎉 App initialization completed successfully');
      } catch (error) {
        console.error('❌ App initialization error:', error);
      }
    };

    initializeApp();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TamaguiProvider config={tamaguiConfig}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(reading)" options={{ headerShown: false }} />
            <Stack.Screen name="(history)" options={{ headerShown: false }} />
            <Stack.Screen name="cards" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </TamaguiProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <RootLayoutContent />
    </AppProvider>
  );
}
