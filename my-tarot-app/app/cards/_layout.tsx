import { Stack } from 'expo-router';
import React from 'react';

export default function CardsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: '卡牌说明',
          headerShown: false, // 隐藏Stack的header，避免重复
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: '卡牌详情',
          headerShown: false, // 隐藏导航，采用自定义风格
          presentation: 'card',
        }}
      />
    </Stack>
  );
}