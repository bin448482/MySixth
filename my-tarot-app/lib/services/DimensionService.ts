import { DatabaseService } from './DatabaseService';
import type { ServiceResponse } from '../types/database';
import type { DimensionData } from '../contexts/ReadingContext';

export class DimensionService {
  private static instance: DimensionService;
  private dbService: DatabaseService;

  private constructor() {
    this.dbService = DatabaseService.getInstance();
  }

  static getInstance(): DimensionService {
    if (!DimensionService.instance) {
      DimensionService.instance = new DimensionService();
    }
    return DimensionService.instance;
  }

  /**
   * 获取所有唯一的占卜类别
   */
  async getUniqueCategories(): Promise<ServiceResponse<string[]>> {
    try {
      // 取出所有分类后在应用层规整为“主类”（按第一个“-”切分）
      const result = await this.dbService.query<{ category: string }>(
        "SELECT DISTINCT category FROM dimension ORDER BY category"
      );

      if (result.success && result.data) {
        const mainSet = new Set<string>();
        for (const row of result.data) {
          const raw = row.category || '';
          const main = raw.split('-')[0].trim();
          if (main) mainSet.add(main);
        }
        const mains = Array.from(mainSet).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
        return { success: true, data: mains };
      }

      return { success: false, error: result.error || 'Failed to get categories' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error getting categories'
      };
    }
  }

  /**
   * 根据类别获取维度数据
   */
  async getDimensionsByCategory(category: string): Promise<ServiceResponse<DimensionData[]>> {
    try {
      const result = await this.dbService.query<DimensionData>(
        'SELECT * FROM dimension WHERE category = ? ORDER BY aspect_type ASC',
        [category]
      );

      if (result.success && result.data) {
        return { success: true, data: result.data };
      }

      return { success: false, error: result.error || 'Failed to get dimensions' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error getting dimensions'
      };
    }
  }

  /**
   * 获取所有维度数据
   */
  async getAllDimensions(): Promise<ServiceResponse<DimensionData[]>> {
    try {
      const result = await this.dbService.query<DimensionData>(
        'SELECT * FROM dimension ORDER BY category, aspect_type ASC'
      );

      if (result.success && result.data) {
        return { success: true, data: result.data };
      }

      return { success: false, error: result.error || 'Failed to get all dimensions' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error getting dimensions'
      };
    }
  }

  /**
   * 获取类别显示名称映射
   */
  getCategoryDisplayName(category: string): string {
    // 与数据库维度命名保持一致的“组名”显示：
    // 规则：默认使用 “<主类>-时间线”，特殊类单独定义
    const special: Record<string, string> = {
      '健康': '健康-身体状况',
      '类比': '类比-生命周期',
    };
    if (special[category]) return special[category];
    // 常见主类：情感/事业/精神/决策/人际关系 等
    return `${category}-时间线`;
  }

  /**
   * 获取类别图标映射
   */
  getCategoryIcon(category: string): string {
    const iconMap: Record<string, string> = {
      '情感': '💗',
      '事业': '💼',
      '健康': '🏥',
      '学业': '📚',
      '人际关系': '🤝',
      '财富': '💰',
      '灵性': '✨',
      '决策': '❓',
      '类比': '🔁',
      '精神': '🧘',
    };
    return iconMap[category] || '🔮';
  }

  /**
   * 获取类别颜色映射
   */
  getCategoryColor(category: string): string {
    const colorMap: Record<string, string> = {
      '情感': '#FF6B6B',
      '事业': '#4ECDC4',
      '健康': '#45B7D1',
      '学业': '#96CEB4',
      '人际关系': '#FFEAA7',
      '财富': '#FDCB6E',
      '灵性': '#A29BFE',
      '决策': '#FD79A8',
      '类比': '#E17055',
      '精神': '#74B9FF',
    };
    return colorMap[category] || '#FFD700';
  }

  /**
   * 根据主类得到首选的“维度组类别”名称（用于后续维度查询）
   * 例如：'健康' -> '健康-身体状况'；默认 '<主类>-时间线'
   */
  getPreferredGroupCategory(mainCategory: string): string {
    const specialMap: Record<string, string> = {
      '健康': '健康-身体状况',
      '类比': '类比-生命周期',
    };
    if (specialMap[mainCategory]) return specialMap[mainCategory];
    return `${mainCategory}-时间线`;
  }
}