import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useReadingFlow } from '@/lib/contexts/ReadingContext';
import { CardInterpretationService } from '@/lib/services/CardInterpretationService';
import { DimensionService } from '@/lib/services/DimensionService';
import { getCardImage } from '@/lib/utils/cardImages';

interface DetailedReading {
  card: {
    id: number;
    name: string;
    imageUrl: string;
    direction: 'upright' | 'reversed';
    position: string;
  };
  dimension: {
    id: number;
    name: string;
    category: string;
    aspect: string;
    aspect_type: number;
  };
  interpretation: {
    summary: string;
    detailedContent: string;
  };
}

export default function BasicReadingScreen() {
  const router = useRouter();
  const { state, resetFlow, saveToHistory } = useReadingFlow();
  const [readings, setReadings] = useState<DetailedReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const interpretationService = CardInterpretationService.getInstance();
  const dimensionService = DimensionService.getInstance();

  useEffect(() => {
    generateDetailedReading();
  }, []);

  const generateDetailedReading = async () => {
    try {
      setLoading(true);
      const detailedReadings: DetailedReading[] = [];

      for (const selectedCard of state.selectedCards) {
        // 获取详细维度解读
        const interpretation = await interpretationService.getCardInterpretationForDimension(
          selectedCard.name,
          selectedCard.direction === 'upright' ? '正位' : '逆位',
          selectedCard.dimension.name,
          selectedCard.dimension.aspect_type.toString()
        );

        // 获取基础牌意
        const basicInterpretation = await interpretationService.getCardInterpretation(
          selectedCard.cardId,
          selectedCard.direction === 'upright' ? '正位' : '逆位'
        );

        detailedReadings.push({
          card: {
            id: selectedCard.cardId,
            name: selectedCard.name,
            imageUrl: selectedCard.imageUrl,
            direction: selectedCard.direction,
            position: selectedCard.position,
          },
          dimension: selectedCard.dimension,
          interpretation: {
            summary: basicInterpretation.success ? basicInterpretation.data?.summary || '' : '',
            detailedContent: interpretation.success ? interpretation.data?.content || '' : '暂无详细解读',
          },
        });
      }

      setReadings(detailedReadings);
    } catch (error) {
      console.error('Error generating detailed reading:', error);
      Alert.alert('错误', '生成解读失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToHistory = async () => {
    try {
      setSaving(true);
      await saveToHistory();
      Alert.alert(
        '保存成功',
        '占卜记录已保存到历史记录',
        [{ text: '了解', onPress: handleComplete }]
      );
    } catch (error) {
      console.error('Error saving to history:', error);
      Alert.alert('错误', '保存记录失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = () => {
    resetFlow();
    router.replace('/(tabs)');
  };

  const handleNewReading = () => {
    resetFlow();
    router.replace('/(reading)/type');
  };

  const getDirectionText = (direction: 'upright' | 'reversed') => {
    return direction === 'upright' ? '正位' : '逆位';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>正在生成详细解读...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>基础牌意解读</Text>
        <Text style={styles.subtitle}>
          基于{state.category}主题的详细解读
        </Text>
      </View>

      <View style={styles.readingsContainer}>
        {readings.map((reading, index) => (
          <View key={index} style={styles.readingCard}>
            <View style={styles.cardHeader}>
              <View style={styles.positionBadge}>
                <Text style={styles.positionText}>{index + 1}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{reading.card.name}</Text>
                <Text style={styles.cardDirection}>{getDirectionText(reading.card.direction)}</Text>
              </View>
            </View>

            <View style={styles.dimensionInfo}>
              <Text style={styles.dimensionTitle}>{reading.dimension.name}</Text>
              <Text style={styles.dimensionAspect}>{reading.dimension.aspect}</Text>
            </View>

            <View style={styles.interpretationContainer}>
              <Text style={styles.interpretationLabel}>基础牌意：</Text>
              <Text style={styles.interpretationSummary}>{reading.interpretation.summary}</Text>

              <Text style={[styles.interpretationLabel, styles.detailedLabel]}>详细解读：</Text>
              <Text style={styles.interpretationDetail}>{reading.interpretation.detailedContent}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleSaveToHistory}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#0F0F1A" />
          ) : (
            <Text style={styles.primaryButtonText}>保存记录</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={handleNewReading}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>重新占卜</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.tertiaryButton]}
          onPress={handleComplete}
          activeOpacity={0.8}
        >
          <Text style={styles.tertiaryButtonText}>返回首页</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>步骤 4 / 4 - 基础解读完成</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0F0F1A',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F0F1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#CCCCCC',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  readingsContainer: {
    gap: 24,
    marginBottom: 32,
  },
  readingCard: {
    backgroundColor: '#16213E',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A4A',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  positionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  positionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F0F1A',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 2,
  },
  cardDirection: {
    fontSize: 14,
    color: '#CCCCCC',
    textTransform: 'capitalize',
  },
  dimensionInfo: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#1A1A2E',
    borderRadius: 8,
  },
  dimensionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4ECDC4',
    marginBottom: 4,
  },
  dimensionAspect: {
    fontSize: 14,
    color: '#888888',
    fontStyle: 'italic',
  },
  interpretationContainer: {
    gap: 8,
  },
  interpretationLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  detailedLabel: {
    marginTop: 12,
  },
  interpretationSummary: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  interpretationDetail: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 22,
    textAlign: 'justify',
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    borderRadius: 25,
    paddingHorizontal: 48,
    paddingVertical: 16,
    minWidth: 200,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#FFD700',
    elevation: 4,
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F0F1A',
  },
  secondaryButton: {
    backgroundColor: '#4ECDC4',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  tertiaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#888888',
  },
});