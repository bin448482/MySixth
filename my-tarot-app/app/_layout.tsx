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

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // 初始化数据库
    const initializeDatabase = async () => {
      try {
        console.log('🚀 Starting database initialization...');
        const initializer = new DatabaseInitializer();
        const success = await initializer.initialize();
        
        if (success) {
          console.log('✅ Database initialization completed successfully');
        } else {
          console.error('❌ Database initialization failed');
        }
      } catch (error) {
        console.error('❌ Database initialization error:', error);
      }
    };

    initializeDatabase();
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
