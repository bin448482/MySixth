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
import { CardService } from '@/lib/services/CardService';
import { DimensionService } from '@/lib/services/DimensionService';
import { CardInterpretationService } from '@/lib/services/CardInterpretationService';
import { CardFlipAnimation } from '@/components/reading/CardFlipAnimation';

interface DrawnCard {
  cardId: number;
  name: string;
  imageUrl: string;
  position: string;
  dimension: any;
  direction: 'upright' | 'reversed';
  revealed: boolean;
  basicSummary?: string;
}

export default function DrawCardsScreen() {
  const router = useRouter();
  const { state, updateStep, updateCards } = useReadingFlow();
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [dimensions, setDimensions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [allCardsRevealed, setAllCardsRevealed] = useState(false);

  const cardService = CardService.getInstance();
  const dimensionService = DimensionService.getInstance();
  const interpretationService = CardInterpretationService.getInstance();

  useEffect(() => {
    loadDimensions();
  }, []);

  const loadDimensions = async () => {
    try {
      const result = await dimensionService.getDimensionsByCategory(state.category);
      if (result.success && result.data) {
        // 按aspect_type排序：1(过去), 2(现在), 3(将来)
        const sortedDimensions = result.data.sort((a, b) => a.aspect_type - b.aspect_type);
        setDimensions(sortedDimensions.slice(0, 3)); // 取前3个维度
      }
    } catch (error) {
      console.error('Error loading dimensions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrawCards = async () => {
    try {
      setIsDrawing(true);

      // 1. 获取所有卡牌并随机抽取3张
      const cardsResult = await cardService.getAllCards();
      if (!cardsResult.success || !cardsResult.data) {
        throw new Error('Failed to load cards');
      }

      const shuffled = [...cardsResult.data].sort(() => Math.random() - 0.5);
      const selectedCards = shuffled.slice(0, 3);

      // 2. 获取基础牌意
      const cardsWithInterpretation = await Promise.all(
        selectedCards.map(async (card, index) => {
          const direction = Math.random() > 0.5 ? 'upright' : 'reversed';
          const interpretation = await interpretationService.getCardInterpretation(
            card.id,
            direction === 'upright' ? '正位' : '逆位'
          );

          return {
            cardId: card.id,
            name: card.name,
            imageUrl: card.image_url,
            position: dimensions[index]?.aspect || `位置${index + 1}`,
            dimension: dimensions[index],
            direction,
            revealed: false,
            basicSummary: interpretation.success ? interpretation.data?.summary : undefined,
          };
        })
      );

      setDrawnCards(cardsWithInterpretation);
    } catch (error) {
      console.error('Error drawing cards:', error);
      Alert.alert('错误', '抽牌失败，请重试');
    } finally {
      setIsDrawing(false);
    }
  };

  const handleCardClick = (index: number) => {
    const card = drawnCards[index];
    if (card.basicSummary) {
      Alert.alert(
        `${card.name} (${card.direction})`,
        card.basicSummary,
        [{ text: '了解', style: 'default' }]
      );
    }
  };

  const handleRevealAll = () => {
    const revealedCards = drawnCards.map(card => ({ ...card, revealed: true }));
    setDrawnCards(revealedCards);
    setAllCardsRevealed(true);
  };

  const handleContinue = () => {
    updateCards(drawnCards);
    updateStep(4);
    router.push('/(reading)/basic');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>正在加载占卜维度...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>抽取塔罗牌</Text>
        <Text style={styles.subtitle}>
          请选择{state.category}相关的三个位置
        </Text>
      </View>

      <View style={styles.dimensionsContainer}>
        {dimensions.map((dimension, index) => (
          <View key={dimension.id} style={styles.dimensionCard}>
            <Text style={styles.dimensionName}>{dimension.name}</Text>
            <Text style={styles.dimensionDescription}>{dimension.description}</Text>
            <Text style={styles.dimensionPosition}>位置 {index + 1}: {dimension.aspect}</Text>
          </View>
        ))}
      </View>

      <View style={styles.cardsContainer}>
        {drawnCards.length > 0 ? (
          <View style={styles.cardsRow}>
            {drawnCards.map((card, index) => (
              <View key={index} style={styles.cardWrapper}>
                <CardFlipAnimation
                  card={{
                    id: card.cardId,
                    name: card.name,
                    imageUrl: card.imageUrl,
                    direction: card.direction,
                    revealed: card.revealed,
                  }}
                  onPress={() => handleCardClick(index)}
                  disabled={!card.revealed}
                  showName={true}
                />
                <View style={styles.cardInfo}>
                  <Text style={styles.cardPosition}>{card.position}</Text>
                  <Text style={styles.cardDirection}>{card.direction}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>点击下方按钮开始抽牌</Text>
          </View>
        )}
      </View>

      <View style={styles.actionsContainer}>
        {drawnCards.length === 0 ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.drawButton]}
            onPress={handleDrawCards}
            disabled={isDrawing}
            activeOpacity={0.8}
          >
            {isDrawing ? (
              <ActivityIndicator size="small" color="#0F0F1A" />
            ) : (
              <Text style={styles.drawButtonText}>开始抽牌</Text>
            )}
          </TouchableOpacity>
        ) : !allCardsRevealed ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.revealButton]}
            onPress={handleRevealAll}
            activeOpacity={0.8}
          >
            <Text style={styles.revealButtonText}>全部翻开</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.continueButton]}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>查看解读</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>步骤 3 / 4</Text>
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
  dimensionsContainer: {
    marginBottom: 32,
    gap: 12,
  },
  dimensionCard: {
    backgroundColor: '#16213E',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  dimensionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4,
  },
  dimensionDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 4,
  },
  dimensionPosition: {
    fontSize: 12,
    color: '#888888',
    fontStyle: 'italic',
  },
  cardsContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    marginHorizontal: -8,
  },
  cardWrapper: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cardInfo: {
    marginTop: 12,
    alignItems: 'center',
  },
  cardPosition: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 2,
  },
  cardDirection: {
    fontSize: 12,
    color: '#CCCCCC',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    marginVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#888888',
  },
  actionsContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  actionButton: {
    borderRadius: 25,
    paddingHorizontal: 48,
    paddingVertical: 16,
    minWidth: 200,
    alignItems: 'center',
  },
  drawButton: {
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
  drawButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F0F1A',
  },
  revealButton: {
    backgroundColor: '#4ECDC4',
  },
  revealButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  continueButton: {
    backgroundColor: '#FFD700',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F0F1A',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#888888',
  },
});