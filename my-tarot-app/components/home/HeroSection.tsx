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

export const HeroSection: React.FC = () => {
  const shimmerOpacity = useSharedValue(0.3);

  React.useEffect(() => {
    shimmerOpacity.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmerOpacity.value,
  }));

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
    fontSize: 32,
    fontWeight: '700',
    color: '#ffd700',
    textAlign: 'center',
    fontFamily: 'serif',
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
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
    fontSize: 18,
    color: '#e6e6fa',
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: '300',
  },
  description: {
    fontSize: 14,
    color: '#b19cd9',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});