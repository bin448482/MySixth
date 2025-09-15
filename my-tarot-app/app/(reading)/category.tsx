import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useReadingFlow } from '@/lib/contexts/ReadingContext';
import { DimensionService } from '@/lib/services/DimensionService';

interface Category {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  color: string;
}

export default function CategorySelectionScreen() {
  const router = useRouter();
  const { updateStep, updateCategory, updateDimensions } = useReadingFlow();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const dimensionService = DimensionService.getInstance();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      console.log('[Category] Loading categories from DB...');
      const result = await dimensionService.getUniqueCategories();

      let sourceCategories: string[] = [];

      if (result.success && result.data && result.data.length > 0) {
        sourceCategories = result.data;
        console.log(`[Category] Loaded ${sourceCategories.length} categories from DB`);
      } else {
        // DB 没有数据时，回退到本地 JSON
        console.warn('[Category] No categories from DB. Falling back to local JSON');
        try {
          const json = require('../../assets/data/dimensions.json');
          const mains = new Set<string>();
          for (const d of (json?.data || [])) {
            if (typeof d?.category === 'string') {
              const main = d.category.split('-')[0].trim();
              if (main) mains.add(main);
            }
          }
          sourceCategories = Array.from(mains);
          console.log(`[Category] Fallback JSON main categories: ${sourceCategories.length}`);
        } catch (jsonErr) {
          console.error('[Category] Failed to load fallback JSON:', jsonErr);
        }
      }

      if (sourceCategories.length > 0) {
        const formattedCategories = sourceCategories.map((category) => ({
          id: category,
          name: category,
          displayName: dimensionService.getCategoryDisplayName(category),
          icon: dimensionService.getCategoryIcon(category),
          color: dimensionService.getCategoryColor(category),
        }));
        setCategories(formattedCategories);
      } else {
        console.warn('[Category] No categories available after DB and JSON fallback');
        setCategories([]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = async (category: string) => {
    setSelectedCategory(category);
    // 选中后立即预取并存储对应维度，供后续步骤匹配解读
    try {
      const preferred = dimensionService.getPreferredGroupCategory(category);

      // 先尝试从数据库获取
      const dimsFromDb = await dimensionService.getDimensionsByCategory(preferred);
      if (dimsFromDb.success && dimsFromDb.data && dimsFromDb.data.length > 0) {
        updateCategory(category);
        // 将“数据库行”直接保存为 DimensionData[]
        // 注意：部分字段可能是文本类型，后续使用时注意转换
        updateDimensions(dimsFromDb.data as any);
        return;
      }

      // DB 没有则回退到本地 JSON
      const json = require('../../assets/data/dimensions.json');
      const allDims: any[] = json?.data || [];
      const fallback = allDims
        .filter((d) => d.category === preferred)
        .map((d, idx) => ({
          id: idx + 1, // 本地回退无ID，给个临时ID
          name: d.name,
          category: d.category,
          description: d.description,
          aspect: d.aspect ?? '',
          aspect_type: Number(d.aspect_type ?? 0),
        }));

      if (fallback.length > 0) {
        updateCategory(category);
        updateDimensions(fallback as any);
      } else {
        console.warn('[Category] No dimensions found for category:', preferred);
      }
    } catch (e) {
      console.error('[Category] Failed to preload dimensions:', e);
    }
  };

  const handleConfirm = () => {
    if (selectedCategory) {
      updateCategory(selectedCategory);
      updateStep(3);
      router.push('/(reading)/draw');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>正在加载占卜类别...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>选择占卜主题</Text>
        <Text style={styles.subtitle}>
          请选择您希望占卜的主题领域
        </Text>
      </View>

      <View style={styles.categoriesContainer}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryCard,
              {
                borderColor: category.color,
                backgroundColor: selectedCategory === category.id
                  ? `${category.color}20`
                  : '#16213E',
              },
            ]}
            onPress={() => handleCategorySelect(category.id)}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <Text style={[styles.icon, { color: category.color }]}>{category.icon}</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.categoryName, { color: category.color }]}>{category.displayName}</Text>
              <Text style={styles.categoryDescription}>{category.name}</Text>
            </View>
            <View style={[
              styles.selectionIndicator,
              {
                backgroundColor: selectedCategory === category.id
                  ? category.color
                  : 'transparent',
                borderColor: category.color,
              },
            ]}>
              {selectedCategory === category.id && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {selectedCategory && (
        <View style={styles.confirmContainer}>
          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: '#FFD700' }]}
            onPress={handleConfirm}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmButtonText}>确认选择并继续</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>步骤 2 / 4</Text>
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
    marginBottom: 48,
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
  categoriesContainer: {
    gap: 16,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213E',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  iconContainer: {
    marginRight: 16,
  },
  icon: {
    fontSize: 32,
  },
  textContainer: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#888888',
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F0F1A',
  },
  confirmContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#FFD700',
    borderRadius: 25,
    paddingHorizontal: 48,
    paddingVertical: 16,
    elevation: 4,
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F0F1A',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#888888',
  },
});