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
import { DragDropContainer } from '@/components/reading/DragDropContainer';
import { SimpleTestCard } from '@/components/reading/SimpleTestCard';

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
  const [allCardsPlaced, setAllCardsPlaced] = useState(false);
  const [isDragMode, setIsDragMode] = useState(true); // 直接进入拖拽模式

  const cardService = CardService.getInstance();
  const dimensionService = DimensionService.getInstance();
  const interpretationService = CardInterpretationService.getInstance();

  useEffect(() => {
    loadDimensions();
  }, []);

  const loadDimensions = async () => {
    try {
      // 使用从步骤2传递过来的dimensions数据，而不是重新查询数据库
      if (state.dimensions && state.dimensions.length > 0) {
        // 按aspect_type排序：1(过去), 2(现在), 3(将来)
        const sortedDimensions = [...state.dimensions].sort((a, b) => a.aspect_type - b.aspect_type);
        setDimensions(sortedDimensions.slice(0, 3)); // 取前3个维度
      } else {
        console.warn('No dimensions found in reading state');
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
            revealed: true,  // 直接显示翻开的卡牌
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

  // 移除不需要的处理函数
  // const handleCardClick = (index: number) => {
  //   const card = drawnCards[index];
  //   if (card.basicSummary) {
  //     Alert.alert(
  //       `${card.name} (${card.direction})`,
  //       card.basicSummary,
  //       [{ text: '了解', style: 'default' }]
  //     );
  //   }
  // };

  // 移除不需要的翻牌功能，直接在抽牌后显示卡牌
  // const handleRevealAll = () => {...}

  const handleContinue = () => {
    updateCards(drawnCards);
    updateStep(4);
    router.push('/(reading)/basic');
  };

  const handleCardPlacement = (cardId: number, slotIndex: number) => {
    // 更新drawnCards中的dimension绑定
    setDrawnCards(prev => prev.map(card =>
      card.cardId === cardId
        ? { ...card, dimension: dimensions[slotIndex], position: dimensions[slotIndex].aspect }
        : card
    ));
  };

  const handleAllCardsPlaced = () => {
    setAllCardsPlaced(true);
  };

  const handleCardPress = (card: DrawnCard) => {
    if (card.basicSummary) {
      Alert.alert(
        `${card.name} (${card.direction})`,
        card.basicSummary,
        [{ text: '了解', style: 'default' }]
      );
    }
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
          将卡牌拖拽到对应位置或点击按钮抽牌
        </Text>
      </View>


      {/* 拖拽界面 - 主要界面 */}
      <View style={styles.dragDropContainer}>
        {/* 暂时注释测试卡片 */}
        {/*
        <View style={styles.testCardContainer}>
          <Text style={styles.testLabel}>测试拖拽 (如果这个能拖动，说明手势系统正常):</Text>
          <SimpleTestCard onDrag={(id, x, y) => console.log('Test drag:', x, y)} />
        </View>
        */}

        <DragDropContainer
          dimensions={dimensions}
          drawnCards={drawnCards}
          onCardPlacement={handleCardPlacement}
          onAllCardsPlaced={handleAllCardsPlaced}
          onCardPress={handleCardPress}
        />
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
              <Text style={styles.drawButtonText}>抽牌</Text>
            )}
          </TouchableOpacity>
        ) : allCardsPlaced ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.continueButton]}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>查看解读</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.dragHintContainer}>
            <Text style={styles.dragHintText}>请将卡牌拖拽到对应的位置</Text>
          </View>
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
  // 移除不需要的样式常量 - 这些样式已经不再使用
  // dimensionsContainer, dimensionCard, dimensionName, dimensionDescription, dimensionPosition
  // cardsContainer, cardsRow, cardWrapper, cardInfo, cardPosition, cardDirection, emptyState, emptyText
  // revealButton, revealButtonText
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
  // revealButton 和 revealButtonText 已移除
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
  dragDropContainer: {
    flex: 1,
    minHeight: 400,
  },
  dragHintContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  dragHintText: {
    fontSize: 16,
    color: '#FFD700',
    textAlign: 'center',
    fontWeight: '500',
  },
  // testCardContainer 和 testLabel 样式暂时保留，可能后续需要用于调试
});