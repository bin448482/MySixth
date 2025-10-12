import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useTranslation } from '@/lib/hooks/useTranslation';

export const DeclarationCard: React.FC = () => {
  const { t } = useTranslation('home');
  const glowOpacity = useSharedValue(0.5);
  const declarationTexts = React.useMemo(() => {
    const lines = t('declaration.lines', { returnObjects: true });
    return Array.isArray(lines) ? (lines as string[]) : [];
  }, [t]);

  React.useEffect(() => {
    glowOpacity.value = withRepeat(
      withTiming(1, { duration: 3000 }),
      -1,
      true
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(600).duration(800)}
      style={styles.container}
    >
      <BlurView intensity={20} style={styles.blurContainer}>
        <Animated.View style={[styles.glowBorder, glowStyle]} />
        <View style={styles.content}>
          {declarationTexts.map((text, index) => (
            <Animated.View
              key={index}
              entering={FadeInDown.delay(800 + index * 100).duration(600)}
            >
              <Text style={styles.declarationText}>
                ✨ {text}
              </Text>
            </Animated.View>
          ))}
        </View>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 24,
  },
  blurContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(22, 33, 62, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    position: 'relative',
  },
  glowBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#ffd700',
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  declarationText: {
    fontSize: 15,
    color: '#e6e6fa',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
  },
});
