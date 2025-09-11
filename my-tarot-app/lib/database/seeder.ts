/**
 * 数据库种子数据填充脚本
 * Database seed data population script
 */

import { DatabaseService } from '../services/DatabaseService';
import { getSpreadInsertStatements } from './seed/spreads';
import { getCardStyleInsertStatements } from './seed/cardStyles';
import { getCardInsertStatements } from './seed/cards';
import type { ServiceResponse } from '../types/database';

export class DatabaseSeeder {
  private dbService: DatabaseService;

  constructor() {
    this.dbService = DatabaseService.getInstance();
  }

  /**
   * 填充所有种子数据
   */
  async seedAll(): Promise<ServiceResponse<void>> {
    try {
      console.log('Starting database seeding...');

      // 填充卡牌风格数据（必须优先，因为card表依赖它）
      const cardStyleResult = await this.seedCardStyles();
      if (!cardStyleResult.success) {
        throw new Error(`Failed to seed card styles: ${cardStyleResult.error}`);
      }

      // 填充卡牌数据
      const cardResult = await this.seedCards();
      if (!cardResult.success) {
        throw new Error(`Failed to seed cards: ${cardResult.error}`);
      }

      // 填充牌阵数据
      const spreadResult = await this.seedSpreads();
      if (!spreadResult.success) {
        throw new Error(`Failed to seed spreads: ${spreadResult.error}`);
      }

      console.log('Database seeding completed successfully');
      return { success: true };

    } catch (error) {
      console.error('Database seeding failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown seeding error'
      };
    }
  }

  /**
   * 填充卡牌数据
   */
  async seedCards(): Promise<ServiceResponse<void>> {
    try {
      // 检查是否已经有数据
      const existingResult = await this.dbService.queryFirst<{count: number}>(
        'SELECT COUNT(*) as count FROM card'
      );

      if (existingResult.success && existingResult.data && existingResult.data.count > 0) {
        console.log('Cards already exist, skipping...');
        return { success: true };
      }

      // 插入卡牌数据
      const insertStatements = getCardInsertStatements();
      console.log(`Inserting ${insertStatements.length} cards...`);
      
      const result = await this.dbService.executeBatch(insertStatements);

      if (result.success) {
        console.log(`Successfully inserted ${insertStatements.length} card(s)`);
        
        // 验证插入结果
        const verifyResult = await this.dbService.queryFirst<{count: number}>(
          'SELECT COUNT(*) as count FROM card'
        );
        const actualCount = verifyResult.success && verifyResult.data ? verifyResult.data.count : 0;
        console.log(`Verification: ${actualCount} cards in database`);
        
        return { success: true };
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('Failed to seed cards:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 填充卡牌风格数据
   */
  async seedCardStyles(): Promise<ServiceResponse<void>> {
    try {
      // 检查是否已经有数据
      const existingResult = await this.dbService.queryFirst<{count: number}>(
        'SELECT COUNT(*) as count FROM card_style'
      );

      if (existingResult.success && existingResult.data && existingResult.data.count > 0) {
        console.log('Card styles already exist, skipping...');
        return { success: true };
      }

      // 插入卡牌风格数据
      const insertStatements = getCardStyleInsertStatements();
      const result = await this.dbService.executeBatch(insertStatements);

      if (result.success) {
        console.log(`Successfully inserted ${insertStatements.length} card style(s)`);
        return { success: true };
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('Failed to seed card styles:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 填充牌阵数据
   */
  async seedSpreads(): Promise<ServiceResponse<void>> {
    try {
      // 检查是否已经有数据
      const existingResult = await this.dbService.queryFirst<{count: number}>(
        'SELECT COUNT(*) as count FROM spread'
      );

      if (existingResult.success && existingResult.data && existingResult.data.count > 0) {
        console.log('Spreads already exist, skipping...');
        return { success: true };
      }

      // 插入牌阵数据
      const insertStatements = getSpreadInsertStatements();
      const result = await this.dbService.executeBatch(insertStatements);

      if (result.success) {
        console.log(`Successfully inserted ${insertStatements.length} spreads`);
        return { success: true };
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('Failed to seed spreads:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 检查是否需要填充数据
   */
  async needsSeeding(): Promise<boolean> {
    try {
      const cardStyleResult = await this.dbService.queryFirst<{count: number}>(
        'SELECT COUNT(*) as count FROM card_style'
      );
      
      const cardResult = await this.dbService.queryFirst<{count: number}>(
        'SELECT COUNT(*) as count FROM card'
      );
      
      const spreadResult = await this.dbService.queryFirst<{count: number}>(
        'SELECT COUNT(*) as count FROM spread'
      );

      const cardStyleCount = cardStyleResult.success && cardStyleResult.data ? cardStyleResult.data.count : 0;
      const cardCount = cardResult.success && cardResult.data ? cardResult.data.count : 0;
      const spreadCount = spreadResult.success && spreadResult.data ? spreadResult.data.count : 0;
      
      // 如果任何基础表为空，则需要填充数据
      return cardStyleCount === 0 || cardCount === 0 || spreadCount === 0;

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
      // 注意删除顺序：先删除依赖表，再删除被依赖表
      const tables = ['user_history', 'card_interpretation_dimension', 'card_interpretation', 'card', 'spread', 'card_style'];
      
      for (const table of tables) {
        await this.dbService.execute(`DELETE FROM ${table}`);
        console.log(`Cleared table: ${table}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to clear data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Clear failed'
      };
    }
  }
}