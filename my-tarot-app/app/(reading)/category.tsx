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
import { DatabaseInitializer } from '@/lib/database/initializer';

interface GroupItem {
  id: string;
  category: string;
  description: string;
  displayName: string;
  icon: string;
  color: string;
  dimensions: any[];
}

export default function CategorySelectionScreen() {
  const router = useRouter();
  const { updateStep, updateCategory, updateDimensions } = useReadingFlow();
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const dimensionService = DimensionService.getInstance();

  useEffect(() => {
    loadDimensions();
  }, []);

  const loadDimensions = async () => {
    try {
      setLoading(true);
      const res = await dimensionService.getAllDimensions();
      // console.log('[Category] getAllDimensions result:', res);
      let dims: any[] = [];
      if (res && res.success && res.data && res.data.length > 0) {
        dims = res.data;
        // console.log('[Category] Using database data, count:', dims.length);
      }
      // else {
      //   console.log('[Category] Database empty or failed, loading from JSON file');
      //   const json = require('../../assets/data/dimensions.json');
      //   dims = json?.data || [];
      //   console.log('[Category] JSON data loaded, count:', dims.length);
      //   console.log('[Category] First JSON item:', dims[0]);
      // }

      // console.log('[Category] Total dimensions loaded:', dims.length);
      if (dims.length === 0) {
        console.warn('[Category] No dimensions data found!');
        setGroups([]);
        return;
      }

      // group by category + description (fix: use description as key instead of non-existent id)
      const map = new Map<string, GroupItem>();
      for (const d of dims) {
        // console.log('[Category] Processing dimension:', d);
        // Fix: use description as the grouping key since id doesn't exist in JSON
        const key = `${d.category}-${d.description}`;
        if (!map.has(key)) {
          map.set(key, {
            id: d.id,
            category: d.category,
            description: d.description || d.name || key,
            displayName: d.category,
            icon: dimensionService.getCategoryIcon(d.category),
            color: dimensionService.getCategoryColor(d.category),
            dimensions: [d],
          });
        } 
        else {
          map.get(key)!.dimensions.push(d);
        }
      }

      // console.log('[Category] Groups created:', map.size);

      // normalize: ensure each group's dimensions sorted by aspect_type
      const result: GroupItem[] = [];
      for (const g of map.values()) {
        g.dimensions.sort((a, b) => (a.aspect_type || 0) - (b.aspect_type || 0));
        // Generate displayName from aspects sorted by aspect_type
        g.displayName = g.dimensions.map(d => d.aspect).join(' - ');
        result.push(g);
        // console.log('[Category] Group added:', g.id, 'with', g.dimensions.length, 'dimensions');
      }

      // console.log('[Category] Final result count:', result.length);
      setGroups(result);
    } catch (error) {
      console.error('[Category] loadDimensions error', error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (group: GroupItem) => {
    setSelectedGroup(group.id);
    updateCategory(group.category);
    updateDimensions(group.dimensions.map((d) => ({
      id: d.id || 0,
      name: d.name,
      category: d.category,
      description: d.description,
      aspect: d.aspect,
      aspect_type: Number(d.aspect_type || 0),
    })));
  };

  const handleConfirm = () => {
    if (selectedGroup) {
      updateStep(3);
      router.push('/(reading)/draw');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>正在加载主题...</Text>
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
        <Text style={styles.subtitle}>请选择您希望占卜的主题（按主题分组）</Text>
        
      </View>

      <View style={styles.categoriesContainer}>
        {groups.map((group) => (
          <TouchableOpacity
            key={group.id}
            style={[
              styles.categoryCard,
              {
                borderColor: group.color,
                backgroundColor: selectedGroup === group.id ? `${group.color}20` : '#16213E',
              },
            ]}
            onPress={() => handleSelect(group)}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <Text style={[styles.icon, { color: group.color }]}>{group.icon}</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.categoryName, { color: group.color }]}>{group.description}</Text>
              <Text style={styles.categoryDescription}>{group.displayName}</Text>
            </View>
            <View style={[
              styles.selectionIndicator,
              {
                backgroundColor: selectedGroup === group.id ? group.color : 'transparent',
                borderColor: group.color,
              },
            ]}>
              {selectedGroup === group.id && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {selectedGroup && (
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
  debugButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 16,
  },
  debugButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});