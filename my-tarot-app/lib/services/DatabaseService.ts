/**
 * 核心数据库服务
 * Core database service for SQLite operations
 */

import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { DatabaseMigrations } from '../database/migrations';
import { DATABASE_NAME } from '../database/schema';
import type {
  DatabaseOperationResult,
  ServiceResponse,
  DatabaseStatus
} from '../types/database';

export class DatabaseService {
  private static instance: DatabaseService;
  private db!: SQLite.SQLiteDatabase;
  private migrations: DatabaseMigrations;
  private isInitialized: boolean = false;

  private constructor() {
    // Database will be opened after asset copy in initialize()
    this.migrations = new DatabaseMigrations();
  }

  /**
   * 获取数据库服务单例
   */
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * 初始化数据库 - 复制预置数据库并打开
   */
  async initialize(): Promise<ServiceResponse<DatabaseStatus>> {
    try {
      console.log('[DatabaseService] Starting database initialization...');
      
      // 1. 确保预置数据库已复制到可写目录
      await this.ensureAssetDatabaseCopied();
      
      // 2. 打开数据库连接
      if (!this.db) {
        const dbPath = `${FileSystem.documentDirectory}SQLite/${DATABASE_NAME}`;
        console.log(`[DatabaseService] Opening database at: ${dbPath}`);
        this.db = SQLite.openDatabaseSync(dbPath);
        this.migrations = new DatabaseMigrations(this.db);
      }
      
      // 3. 确保用户表存在（仅创建用户表，不创建静态数据表）
      await this.ensureUserTablesExist();
      
      this.isInitialized = true;
      console.log('[DatabaseService] Database initialization completed');
      
      return {
        success: true,
        data: {
          isInitialized: true,
          version: 1,
          lastSync: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('[DatabaseService] Database initialization failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 确保预置数据库已复制到可写目录
   */
  private async ensureAssetDatabaseCopied(): Promise<void> {
    const dbPath = `${FileSystem.documentDirectory}SQLite/${DATABASE_NAME}`;
    
    try {
      // 检查数据库文件是否已存在
      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      
      if (!fileInfo.exists) {
        console.log('[DatabaseService] Copying bundled database to writable directory...');
        
        // 确保SQLite目录存在
        const sqliteDir = `${FileSystem.documentDirectory}SQLite`;
        await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });
        
        // 加载预置数据库资产
        const asset = Asset.fromModule(require('../../assets/db/tarot_config.db'));
        await asset.downloadAsync();
        
        // 复制到可写目录
        await FileSystem.copyAsync({
          from: asset.localUri!,
          to: dbPath
        });
        
        console.log('[DatabaseService] Bundled database copied successfully');
      } else {
        console.log('[DatabaseService] Database already exists in writable directory');
      }
    } catch (error) {
      console.error('[DatabaseService] Failed to copy bundled database:', error);
      throw new Error(`Failed to copy bundled database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 确保用户表存在（仅创建用户相关表，不创建静态数据表）
   */
  private async ensureUserTablesExist(): Promise<void> {
    try {
      // 检查user_history表是否存在
      const result = this.db.getFirstSync<{count: number}>(
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='user_history'"
      );
      
      if ((result?.count || 0) === 0) {
        console.log('[DatabaseService] Creating user_history table...');
        
        // 仅创建user_history表
        const userHistorySQL = `
          CREATE TABLE IF NOT EXISTS user_history (
            id INTEGER PRIMARY KEY,
            user_id TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            spread_id INTEGER NOT NULL,
            card_ids TEXT NOT NULL,
            interpretation_mode TEXT NOT NULL CHECK (interpretation_mode IN ('default', 'ai')),
            result TEXT NOT NULL,
            FOREIGN KEY (spread_id) REFERENCES spread (id)
          );
        `;
        
        this.db.execSync(userHistorySQL);
        
        // 创建用户历史索引
        this.db.execSync(
          'CREATE INDEX IF NOT EXISTS idx_user_history_user_timestamp ON user_history (user_id, timestamp);'
        );
        
        console.log('[DatabaseService] User tables created successfully');
      } else {
        console.log('[DatabaseService] User tables already exist');
      }
    } catch (error) {
      console.error('[DatabaseService] Failed to create user tables:', error);
      throw error;
    }
  }

  /**
   * 获取数据库状态
   */
  async getStatus(): Promise<DatabaseStatus> {
    const isInitialized = await this.migrations.isDatabaseInitialized();
    return {
      isInitialized,
      version: 1,
      lastSync: new Date().toISOString()
    };
  }

  /**
   * 执行SQL查询（SELECT）
   */
  async query<T>(sql: string, params: any[] = []): Promise<ServiceResponse<T[]>> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const result = this.db.getAllSync<T>(sql, params);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Database query failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Query failed'
      };
    }
  }

  /**
   * 执行单行查询
   */
  async queryFirst<T>(sql: string, params: any[] = []): Promise<ServiceResponse<T | null>> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const result = this.db.getFirstSync<T>(sql, params);
      return {
        success: true,
        data: result || null
      };
    } catch (error) {
      console.error('Database queryFirst failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Query failed'
      };
    }
  }

  /**
   * 执行SQL命令（INSERT, UPDATE, DELETE）
   */
  async execute(sql: string, params: any[] = []): Promise<ServiceResponse<DatabaseOperationResult>> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const result = this.db.runSync(sql, params);
      
      return {
        success: true,
        data: {
          success: true,
          affectedRows: result.changes,
          insertId: result.lastInsertRowId
        }
      };
    } catch (error) {
      console.error('Database execute failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Execute failed'
      };
    }
  }

  /**
   * 批量执行SQL命令
   */
  async executeBatch(statements: { sql: string; params?: any[] }[]): Promise<ServiceResponse<DatabaseOperationResult>> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      let totalAffectedRows = 0;
      let lastInsertId: number | undefined;

      for (const statement of statements) {
        const result = this.db.runSync(statement.sql, statement.params || []);
        totalAffectedRows += result.changes;
        if (result.lastInsertRowId !== undefined) {
          lastInsertId = result.lastInsertRowId;
        }
      }

      return {
        success: true,
        data: {
          success: true,
          affectedRows: totalAffectedRows,
          insertId: lastInsertId
        }
      };
    } catch (error) {
      console.error('Database executeBatch failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Batch execute failed'
      };
    }
  }

  /**
   * 事务执行
   */
  async transaction(callback: () => void): Promise<ServiceResponse<void>> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      this.db.withTransactionSync(callback);
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Database transaction failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed'
      };
    }
  }

  /**
   * 重置数据库（开发用）
   */
  async reset(): Promise<ServiceResponse<void>> {
    try {
      await this.migrations.dropAllTables();
      await this.migrations.initialize();
      this.isInitialized = true;
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Database reset failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Reset failed'
      };
    }
  }

  /**
   * 获取原始数据库实例（谨慎使用）
   */
  getRawDatabase(): SQLite.SQLiteDatabase {
    return this.db;
  }
}