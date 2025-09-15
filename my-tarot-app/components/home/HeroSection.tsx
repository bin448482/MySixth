import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { FontStyles, FontColors } from '@/constants/Fonts';
import { useCustomFonts } from '@/hooks/useCustomFonts';

export const HeroSection: React.FC = () => {
  const { fontsLoaded } = useCustomFonts();
  const shimmerOpacity = useSharedValue(0.3);

  // 确保 useAnimatedStyle 总是被调用，不管字体是否加载
  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmerOpacity.value,
  }));

  React.useEffect(() => {
    shimmerOpacity.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  // 如果字体未加载完成，显示加载状态但保持相同的组件结构
  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0a0a1a', '#1a1a2e', '#16213e']}
          style={styles.background}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.titleContainer}>
          <Text style={[styles.mainTitle, { opacity: 0.5 }]}>神秘塔罗牌</Text>
        </View>
        <View style={styles.subtitleContainer}>
          <Text style={[styles.subtitle, { opacity: 0.5 }]}>探索命运的奥秘</Text>
          <Text style={[styles.description, { opacity: 0.5 }]}>聆听内心的声音</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a1a', '#1a1a2e', '#16213e']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.View
        entering={FadeInUp.delay(200).duration(800)}
        style={styles.titleContainer}
      >
        <Text style={styles.mainTitle}>神秘塔罗牌</Text>
        <Animated.View style={[styles.shimmer, shimmerStyle]} />
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(400).duration(600)}
        style={styles.subtitleContainer}
      >
        <Text style={styles.subtitle}>探索命运的奥秘</Text>
        <Text style={styles.description}>聆听内心的声音</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  titleContainer: {
    alignItems: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  mainTitle: {
    ...FontStyles.heroTitle,
    color: FontColors.primary,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 215, 144, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: -20,
    right: -20,
    bottom: 0,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 20,
  },
  subtitleContainer: {
    alignItems: 'center',
  },
  subtitle: {
    ...FontStyles.heroSubtitle,
    color: FontColors.secondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  description: {
    ...FontStyles.subtitle,
    color: FontColors.muted,
    textAlign: 'center',
  },
});