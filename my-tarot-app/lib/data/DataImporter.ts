/**
 * 数据导入器
 * Data importer for JSON to SQLite conversion
 */

import { DatabaseService } from '../services/DatabaseService';
import { JsonLoader } from './JsonLoader';
import type { 
  ImportResult, 
  ImportStatus, 
  ImportSession,
  JsonCard,
  JsonCardStyle,
  JsonSpread
} from './types';
import type { ServiceResponse } from '../types/database';

export class DataImporter {
  private static instance: DataImporter;
  private dbService: DatabaseService;
  private jsonLoader: JsonLoader;

  private constructor() {
    this.dbService = DatabaseService.getInstance();
    this.jsonLoader = JsonLoader.getInstance();
  }

  public static getInstance(): DataImporter {
    if (!DataImporter.instance) {
      DataImporter.instance = new DataImporter();
    }
    return DataImporter.instance;
  }

  /**
   * 导入所有JSON数据到数据库
   */
  async importAll(): Promise<ImportSession> {
    const sessionId = `import_${Date.now()}`;
    const session: ImportSession = {
      sessionId,
      startTime: new Date().toISOString(),
      tables: [
        { table: 'card_style', status: 'pending' },
        { table: 'card', status: 'pending' },
        { table: 'spread', status: 'pending' }
      ],
      totalProgress: 0,
      isCompleted: false
    };

    try {
      console.log(`🚀 Starting import session: ${sessionId}`);

      // 加载所有JSON数据
      const jsonData = await this.jsonLoader.loadAll();

      // 按依赖顺序导入：card_style -> card -> spread
      session.tables[0] = await this.importCardStyles(jsonData.cardStyles.data);
      session.tables[1] = await this.importCards(jsonData.cards.data, jsonData.cardStyles.data);
      session.tables[2] = await this.importSpreads(jsonData.spreads.data);

      // 计算总进度
      const completedTables = session.tables.filter(t => t.status === 'completed').length;
      session.totalProgress = Math.round((completedTables / session.tables.length) * 100);
      session.isCompleted = completedTables === session.tables.length;

      if (session.isCompleted) {
        console.log(`✅ Import session completed: ${sessionId}`);
      } else {
        console.log(`⚠️ Import session completed with errors: ${sessionId}`);
      }

      return session;

    } catch (error) {
      console.error(`❌ Import session failed: ${sessionId}`, error);
      session.isCompleted = true;
      // 标记所有未完成的表为错误状态
      session.tables.forEach(table => {
        if (table.status === 'pending' || table.status === 'importing') {
          table.status = 'error';
          table.error = error instanceof Error ? error.message : 'Unknown error';
        }
      });
      return session;
    }
  }

  /**
   * 导入卡牌风格数据
   */
  private async importCardStyles(styles: JsonCardStyle[]): Promise<ImportStatus> {
    const status: ImportStatus = {
      table: 'card_style',
      status: 'importing'
    };

    try {
      console.log('📄 Importing card styles...');

      // 检查是否已有数据
      const existingResult = await this.dbService.queryFirst<{count: number}>(
        'SELECT COUNT(*) as count FROM card_style'
      );

      const existingCount = existingResult.success && existingResult.data ? existingResult.data.count : 0;
      
      if (existingCount > 0) {
        console.log(`Card styles already exist (${existingCount}), skipping...`);
        status.status = 'completed';
        status.result = {
          success: true,
          imported: 0,
          skipped: existingCount,
          errors: []
        };
        return status;
      }

      // 批量插入
      const insertStatements = styles.map(style => ({
        sql: 'INSERT INTO card_style (name, image_base_url) VALUES (?, ?)',
        params: [style.name, style.image_base_url]
      }));

      const result = await this.dbService.executeBatch(insertStatements);

      if (result.success) {
        status.status = 'completed';
        status.result = {
          success: true,
          imported: styles.length,
          skipped: 0,
          errors: []
        };
        console.log(`✅ Imported ${styles.length} card styles`);
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('❌ Failed to import card styles:', error);
      status.status = 'error';
      status.error = error instanceof Error ? error.message : 'Unknown error';
      status.result = {
        success: false,
        imported: 0,
        skipped: 0,
        errors: [status.error]
      };
    }

    return status;
  }

  /**
   * 导入卡牌数据
   */
  private async importCards(cards: JsonCard[], styles: JsonCardStyle[]): Promise<ImportStatus> {
    const status: ImportStatus = {
      table: 'card',
      status: 'importing'
    };

    try {
      console.log('🃏 Importing cards...');

      // 检查是否已有数据
      const existingResult = await this.dbService.queryFirst<{count: number}>(
        'SELECT COUNT(*) as count FROM card'
      );

      const existingCount = existingResult.success && existingResult.data ? existingResult.data.count : 0;
      
      if (existingCount > 0) {
        console.log(`Cards already exist (${existingCount}), skipping...`);
        status.status = 'completed';
        status.result = {
          success: true,
          imported: 0,
          skipped: existingCount,
          errors: []
        };
        return status;
      }

      // 创建style_name到style_id的映射
      const styleNameToIdMap = await this.createStyleNameToIdMap();

      // 转换并插入卡牌数据
      const insertStatements = cards.map(card => {
        const styleId = styleNameToIdMap[card.style_name];
        if (!styleId) {
          throw new Error(`Unknown style_name: ${card.style_name}`);
        }

        return {
          sql: 'INSERT INTO card (name, arcana, suit, number, image_url, style_id, deck) VALUES (?, ?, ?, ?, ?, ?, ?)',
          params: [card.name, card.arcana, card.suit, card.number, card.image_url, styleId, card.deck]
        };
      });

      const result = await this.dbService.executeBatch(insertStatements);

      if (result.success) {
        status.status = 'completed';
        status.result = {
          success: true,
          imported: cards.length,
          skipped: 0,
          errors: []
        };
        console.log(`✅ Imported ${cards.length} cards`);
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('❌ Failed to import cards:', error);
      status.status = 'error';
      status.error = error instanceof Error ? error.message : 'Unknown error';
      status.result = {
        success: false,
        imported: 0,
        skipped: 0,
        errors: [status.error]
      };
    }

    return status;
  }

  /**
   * 导入牌阵数据
   */
  private async importSpreads(spreads: JsonSpread[]): Promise<ImportStatus> {
    const status: ImportStatus = {
      table: 'spread',
      status: 'importing'
    };

    try {
      console.log('🎴 Importing spreads...');

      // 检查是否已有数据
      const existingResult = await this.dbService.queryFirst<{count: number}>(
        'SELECT COUNT(*) as count FROM spread'
      );

      const existingCount = existingResult.success && existingResult.data ? existingResult.data.count : 0;
      
      if (existingCount > 0) {
        console.log(`Spreads already exist (${existingCount}), skipping...`);
        status.status = 'completed';
        status.result = {
          success: true,
          imported: 0,
          skipped: existingCount,
          errors: []
        };
        return status;
      }

      // 批量插入
      const insertStatements = spreads.map(spread => ({
        sql: 'INSERT INTO spread (name, description, card_count) VALUES (?, ?, ?)',
        params: [spread.name, spread.description, spread.card_count]
      }));

      const result = await this.dbService.executeBatch(insertStatements);

      if (result.success) {
        status.status = 'completed';
        status.result = {
          success: true,
          imported: spreads.length,
          skipped: 0,
          errors: []
        };
        console.log(`✅ Imported ${spreads.length} spreads`);
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('❌ Failed to import spreads:', error);
      status.status = 'error';
      status.error = error instanceof Error ? error.message : 'Unknown error';
      status.result = {
        success: false,
        imported: 0,
        skipped: 0,
        errors: [status.error]
      };
    }

    return status;
  }

  /**
   * 创建风格名称到ID的映射
   */
  private async createStyleNameToIdMap(): Promise<Record<string, number>> {
    const result = await this.dbService.query<{id: number, name: string}>(
      'SELECT id, name FROM card_style'
    );

    if (!result.success || !result.data) {
      throw new Error('Failed to load card styles from database');
    }

    const map: Record<string, number> = {};
    result.data.forEach(style => {
      map[style.name] = style.id;
    });

    return map;
  }

  /**
   * 清空指定表的数据
   */
  async clearTable(tableName: string): Promise<ServiceResponse<void>> {
    try {
      const result = await this.dbService.execute(`DELETE FROM ${tableName}`);
      if (result.success) {
        console.log(`✅ Cleared table: ${tableName}`);
        return { success: true };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error(`❌ Failed to clear table ${tableName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 清空所有数据表（按正确顺序）
   */
  async clearAllTables(): Promise<ServiceResponse<void>> {
    const tables = ['card', 'spread', 'card_style']; // 注意顺序：先删除依赖表
    
    try {
      for (const table of tables) {
        const result = await this.clearTable(table);
        if (!result.success) {
          throw new Error(`Failed to clear ${table}: ${result.error}`);
        }
      }
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}