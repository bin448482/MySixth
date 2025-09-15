/**
 * 数据库种子数据填充脚本
 * Database seed data population script
 */

import { DataImporter } from '../data/DataImporter';
import type { ServiceResponse } from '../types/database';
import type { ImportSession } from '../data/types';

export class DatabaseSeeder {
  private dataImporter: DataImporter;

  constructor() {
    this.dataImporter = DataImporter.getInstance();
  }

  /**
   * 填充所有种子数据（基于JSON导入）
   */
  async seedAll(): Promise<ServiceResponse<void>> {
    try {
      console.log('Starting database seeding from JSON data...');

      const importSession = await this.dataImporter.importAll();

      if (importSession.isCompleted) {
        const successCount = importSession.tables.filter(t => t.status === 'completed').length;
        const errorCount = importSession.tables.filter(t => t.status === 'error').length;
        
        if (errorCount === 0) {
          console.log(`Database seeding completed successfully: ${successCount}/${importSession.tables.length} tables imported`);
          return { success: true };
        } else {
          const errors = importSession.tables
            .filter(t => t.status === 'error')
            .map(t => `${t.table}: ${t.error}`)
            .join('; ');
          throw new Error(`Partial seeding failure: ${errors}`);
        }
      } else {
        throw new Error('Import session did not complete properly');
      }

    } catch (error) {
      console.error('Database seeding failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown seeding error'
      };
    }
  }

  /**
   * 检查是否需要填充数据
   */
  async needsSeeding(): Promise<boolean> {
    try {
      const dbService = (this.dataImporter as any).dbService; // Access private dbService
      
      const cardStyleResult = await dbService.queryFirst(
        'SELECT COUNT(*) as count FROM card_style'
      );
      
      const cardResult = await dbService.queryFirst(
        'SELECT COUNT(*) as count FROM card'
      );
      
      const spreadResult = await dbService.queryFirst(
        'SELECT COUNT(*) as count FROM spread'
      );

      const dimensionResult = await dbService.queryFirst(
        'SELECT COUNT(*) as count FROM dimension'
      );

      const cardStyleCount = cardStyleResult.success && cardStyleResult.data ? cardStyleResult.data.count : 0;
      const cardCount = cardResult.success && cardResult.data ? cardResult.data.count : 0;
      const spreadCount = spreadResult.success && spreadResult.data ? spreadResult.data.count : 0;
      const dimensionCount = dimensionResult.success && dimensionResult.data ? dimensionResult.data.count : 0;
      
      console.log(`Seeding check - card_style: ${cardStyleCount}, card: ${cardCount}, spread: ${spreadCount}, dimension: ${dimensionCount}`);
      
      // 如果任何基础表为空，则需要填充数据
      return cardStyleCount === 0 || cardCount === 0 || spreadCount === 0 || dimensionCount === 0;

    } catch (error) {
      console.error('Error checking seeding status:', error);
      return true; // 出错时假设需要填充
    }
  }

  /**
   * 清空所有数据（用于重新填充）
   */
  async clearAll(): Promise<ServiceResponse<void>> {
    try {
      const result = await this.dataImporter.clearAllTables();
      
      if (result.success) {
        console.log('All data cleared successfully');
      } else {
        console.error('Failed to clear data:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('Failed to clear data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Clear failed'
      };
    }
  }
}