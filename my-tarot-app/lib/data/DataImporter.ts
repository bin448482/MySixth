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
  JsonSpread,
  JsonDimension,
  JsonCardInterpretation,
  JsonCardInterpretationDimension
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
        { table: 'dimension', status: 'pending' },
        { table: 'spread', status: 'pending' },
        { table: 'card', status: 'pending' },
        { table: 'card_interpretation', status: 'pending' },
        { table: 'card_interpretation_dimension', status: 'pending' }
      ],
      totalProgress: 0,
      isCompleted: false
    };

    try {
      console.log(`🚀 Starting import session: ${sessionId}`);

      // 加载所有JSON数据
      const jsonData = await this.jsonLoader.loadAll();

      // 按依赖顺序导入：card_style, dimension, spread -> card -> card_interpretation -> card_interpretation_dimension
      session.tables[0] = await this.importCardStyles(jsonData.cardStyles.data);
      session.tables[1] = await this.importDimensions(jsonData.dimensions.data);
      session.tables[2] = await this.importSpreads(jsonData.spreads.data);
      session.tables[3] = await this.importCards(jsonData.cards.data, jsonData.cardStyles.data);
      session.tables[4] = await this.importCardInterpretations(jsonData.cardInterpretations.data);
      session.tables[5] = await this.importCardInterpretationDimensions(jsonData.cardInterpretationDimensions.data);

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
   * 导入解读维度数据
   */
  private async importDimensions(dimensions: JsonDimension[]): Promise<ImportStatus> {
    const status: ImportStatus = {
      table: 'dimension',
      status: 'importing'
    };

    try {
      console.log('🧭 Importing dimensions...');

      // 检查是否已有数据
      const existingResult = await this.dbService.queryFirst<{count: number}>(
        'SELECT COUNT(*) as count FROM dimension'
      );

      const existingCount = existingResult.success && existingResult.data ? existingResult.data.count : 0;
      
      if (existingCount > 0) {
        console.log(`Dimensions already exist (${existingCount}), skipping...`);
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
      const insertStatements = dimensions.map(dimension => ({
        sql: 'INSERT INTO dimension (name, category, description, aspect, aspect_type) VALUES (?, ?, ?, ?, ?)',
        params: [dimension.name, dimension.category, dimension.description, dimension.aspect || null, dimension.aspect_type || null]
      }));

      const result = await this.dbService.executeBatch(insertStatements);

      if (result.success) {
        status.status = 'completed';
        status.result = {
          success: true,
          imported: dimensions.length,
          skipped: 0,
          errors: []
        };
        console.log(`✅ Imported ${dimensions.length} dimensions`);
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('❌ Failed to import dimensions:', error);
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
   * 导入卡牌解读数据
   */
  private async importCardInterpretations(interpretations: JsonCardInterpretation[]): Promise<ImportStatus> {
    const status: ImportStatus = {
      table: 'card_interpretation',
      status: 'importing'
    };

    try {
      console.log('💬 Importing card interpretations...');

      // 检查是否已有数据
      const existingResult = await this.dbService.queryFirst<{count: number}>(
        'SELECT COUNT(*) as count FROM card_interpretation'
      );

      const existingCount = existingResult.success && existingResult.data ? existingResult.data.count : 0;
      
      if (existingCount > 0) {
        console.log(`Card interpretations already exist (${existingCount}), skipping...`);
        status.status = 'completed';
        status.result = {
          success: true,
          imported: 0,
          skipped: existingCount,
          errors: []
        };
        return status;
      }

      // 创建card_name到card_id的映射
      const cardNameToIdMap = await this.createCardNameToIdMap();

      // 转换并插入解读数据
      const insertStatements = interpretations.map(interpretation => {
        const cardId = cardNameToIdMap[interpretation.card_name];
        if (!cardId) {
          throw new Error(`Unknown card_name: ${interpretation.card_name}`);
        }

        return {
          sql: 'INSERT INTO card_interpretation (card_id, direction, summary, detail) VALUES (?, ?, ?, ?)',
          params: [cardId, interpretation.direction, interpretation.summary, interpretation.detail || null]
        };
      });

      const result = await this.dbService.executeBatch(insertStatements);

      if (result.success) {
        status.status = 'completed';
        status.result = {
          success: true,
          imported: interpretations.length,
          skipped: 0,
          errors: []
        };
        console.log(`✅ Imported ${interpretations.length} card interpretations`);
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('❌ Failed to import card interpretations:', error);
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
   * 导入卡牌解读维度关联数据
   */
  private async importCardInterpretationDimensions(interpretationDimensions: JsonCardInterpretationDimension[]): Promise<ImportStatus> {
    const status: ImportStatus = {
      table: 'card_interpretation_dimension',
      status: 'importing'
    };

    try {
      console.log('🔗 Importing card interpretation dimensions...');

      // 检查是否已有数据
      const existingResult = await this.dbService.queryFirst<{count: number}>(
        'SELECT COUNT(*) as count FROM card_interpretation_dimension'
      );

      const existingCount = existingResult.success && existingResult.data ? existingResult.data.count : 0;
      
      if (existingCount > 0) {
        console.log(`Card interpretation dimensions already exist (${existingCount}), skipping...`);
        status.status = 'completed';
        status.result = {
          success: true,
          imported: 0,
          skipped: existingCount,
          errors: []
        };
        return status;
      }

      // 创建映射
      const interpretationMap = await this.createCardInterpretationMap();
      const dimensionNameToIdMap = await this.createDimensionNameToIdMap();

      // 转换并插入关联数据
      const insertStatements = interpretationDimensions.map(item => {
        const interpretationKey = `${item.card_name}-${item.direction}`;
        const interpretationId = interpretationMap[interpretationKey];
        const dimensionId = dimensionNameToIdMap[item.dimension_name];

        if (!interpretationId) {
          throw new Error(`Unknown card interpretation: ${interpretationKey}`);
        }
        if (!dimensionId) {
          throw new Error(`Unknown dimension_name: ${item.dimension_name}`);
        }

        return {
          sql: 'INSERT INTO card_interpretation_dimension (interpretation_id, dimension_id, aspect, aspect_type, content) VALUES (?, ?, ?, ?, ?)',
          params: [interpretationId, dimensionId, item.aspect || null, item.aspect_type || null, item.content]
        };
      });

      const result = await this.dbService.executeBatch(insertStatements);

      if (result.success) {
        status.status = 'completed';
        status.result = {
          success: true,
          imported: interpretationDimensions.length,
          skipped: 0,
          errors: []
        };
        console.log(`✅ Imported ${interpretationDimensions.length} card interpretation dimensions`);
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('❌ Failed to import card interpretation dimensions:', error);
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
   * 创建卡牌名称到ID的映射
   */
  private async createCardNameToIdMap(): Promise<Record<string, number>> {
    const result = await this.dbService.query<{id: number, name: string}>(
      'SELECT id, name FROM card'
    );

    if (!result.success || !result.data) {
      throw new Error('Failed to load cards from database');
    }

    const map: Record<string, number> = {};
    result.data.forEach(card => {
      map[card.name] = card.id;
    });

    return map;
  }

  /**
   * 创建维度名称到ID的映射
   */
  private async createDimensionNameToIdMap(): Promise<Record<string, number>> {
    const result = await this.dbService.query<{id: number, name: string}>(
      'SELECT id, name FROM dimension'
    );

    if (!result.success || !result.data) {
      throw new Error('Failed to load dimensions from database');
    }

    const map: Record<string, number> = {};
    result.data.forEach(dimension => {
      map[dimension.name] = dimension.id;
    });

    return map;
  }

  /**
   * 创建卡牌解读映射（卡牌名称-方向 -> 解读ID）
   */
  private async createCardInterpretationMap(): Promise<Record<string, number>> {
    const result = await this.dbService.query<{id: number, card_id: number, direction: string}>(
      `SELECT ci.id, ci.card_id, ci.direction, c.name as card_name 
       FROM card_interpretation ci 
       JOIN card c ON ci.card_id = c.id`
    );

    if (!result.success || !result.data) {
      throw new Error('Failed to load card interpretations from database');
    }

    const map: Record<string, number> = {};
    result.data.forEach(interpretation => {
      const key = `${(interpretation as any).card_name}-${interpretation.direction}`;
      map[key] = interpretation.id;
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
    // 按依赖关系反向删除：先删除依赖表，再删除被依赖表
    const tables = [
      'card_interpretation_dimension', 
      'card_interpretation', 
      'card', 
      'dimension', 
      'spread', 
      'card_style'
    ]; 
    
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