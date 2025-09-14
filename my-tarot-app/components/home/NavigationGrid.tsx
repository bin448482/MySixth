import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';

interface NavigationItem {
  id: string;
  title: string;
  icon: string;
  route: string;
  color: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'reading',
    title: '开始占卜',
    icon: '🔮',
    route: '/reading/type',
    color: '#9b59b6',
  },
  {
    id: 'history',
    title: '占卜历史',
    icon: '📜',
    route: '/history',
    color: '#3498db',
  },
  {
    id: 'cards',
    title: '卡牌说明',
    icon: '🎴',
    route: '/cards',
    color: '#e74c3c',
  },
  {
    id: 'settings',
    title: '系统说明',
    icon: '⚙️',
    route: '/settings',
    color: '#f39c12',
  },
];

const { width } = Dimensions.get('window');
const itemWidth = (width - 60) / 2; // 20px margin * 2 + 20px gap

export const NavigationGrid: React.FC = () => {
  const router = useRouter();

  const NavigationButton: React.FC<{ item: NavigationItem; index: number }> = ({ item, index }) => {
    const scale = useSharedValue(1);
    const rotation = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.95);
      rotation.value = withTiming(2, { duration: 100 });
    };

    const handlePressOut = () => {
      scale.value = withSpring(1);
      rotation.value = withTiming(0, { duration: 200 });
    };

    const handlePress = () => {
      // TODO: Navigation will be implemented later
      console.log(`Navigate to: ${item.route}`);
    };

    return (
      <Animated.View
        entering={FadeInDown.delay(1000 + index * 150).duration(600)}
      >
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <Animated.View style={[styles.navigationItem, animatedStyle]}>
            <BlurView intensity={15} style={styles.itemBlur}>
              <View style={[styles.itemContent, { backgroundColor: `${item.color}20` }]}>
                <Text style={styles.itemIcon}>{item.icon}</Text>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <View style={[styles.itemAccent, { backgroundColor: item.color }]} />
              </View>
            </BlurView>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {navigationItems.map((item, index) => (
          <NavigationButton key={item.id} item={item} index={index} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 20,
  },
  navigationItem: {
    width: itemWidth,
    height: 120,
  },
  itemBlur: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(22, 33, 62, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  itemContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    position: 'relative',
  },
  itemIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  itemAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
});