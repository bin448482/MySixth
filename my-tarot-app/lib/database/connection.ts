/**
 * 双数据库连接管理器
 * Dual database connection manager for config and user data separation
 */

import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import type {
  ServiceResponse,
  DatabaseStatus,
  DatabaseOperationResult
} from '../types/database';

// 数据库配置常量
const CONFIG_DATABASE_NAME = 'tarot_config.db';
const USER_DATABASE_NAME = 'tarot_user_data.db';

export class DatabaseConnectionManager {
  private static instance: DatabaseConnectionManager;
  private configDb!: SQLite.SQLiteDatabase;
  private userDb!: SQLite.SQLiteDatabase;
  private isConfigInitialized: boolean = false;
  private isUserInitialized: boolean = false;

  private constructor() {
    // 数据库将在 initialize() 中开启
  }

  /**
   * 获取连接管理器单例
   */
  public static getInstance(): DatabaseConnectionManager {
    if (!DatabaseConnectionManager.instance) {
      DatabaseConnectionManager.instance = new DatabaseConnectionManager();
    }
    return DatabaseConnectionManager.instance;
  }

  /**
   * 初始化双数据库连接
   */
  async initialize(): Promise<ServiceResponse<DatabaseStatus>> {
    try {
      console.log('[ConnectionManager] Starting dual database initialization...');

      // 1. 初始化配置数据库（只读）
      await this.initializeConfigDatabase();

      // 2. 初始化用户数据库（读写）
      await this.initializeUserDatabase();

      console.log('[ConnectionManager] Dual database initialization completed');

      return {
        success: true,
        data: {
          isInitialized: true,
          version: 1,
          lastSync: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('[ConnectionManager] Dual database initialization failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 初始化配置数据库（只读）
   */
  private async initializeConfigDatabase(): Promise<void> {
    try {
      console.log('[ConnectionManager] Initializing config database...');

      // 确保预置数据库已复制到可写目录
      await this.ensureConfigDatabaseCopied();

      // 打开配置数据库连接
      const configDbPath = `${FileSystem.documentDirectory}SQLite/${CONFIG_DATABASE_NAME}`;
      this.configDb = SQLite.openDatabaseSync(configDbPath);

      // 验证配置数据库完整性
      await this.verifyConfigDatabase();

      this.isConfigInitialized = true;
      console.log('[ConnectionManager] Config database initialized successfully');
    } catch (error) {
      console.error('[ConnectionManager] Config database initialization failed:', error);
      throw error;
    }
  }

  /**
   * 初始化用户数据库（读写）
   */
  private async initializeUserDatabase(): Promise<void> {
    try {
      console.log('[ConnectionManager] Initializing user database...');

      // 创建用户数据库文件
      const userDbPath = `${FileSystem.documentDirectory}SQLite/${USER_DATABASE_NAME}`;

      // 确保SQLite目录存在
      const sqliteDir = `${FileSystem.documentDirectory}SQLite`;
      await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });

      // 打开用户数据库连接
      this.userDb = SQLite.openDatabaseSync(userDbPath);

      // 创建用户数据表结构
      await this.createUserTables();

      this.isUserInitialized = true;
      console.log('[ConnectionManager] User database initialized successfully');
    } catch (error) {
      console.error('[ConnectionManager] User database initialization failed:', error);
      throw error;
    }
  }

  /**
   * 确保配置数据库已复制到可写目录
   */
  private async ensureConfigDatabaseCopied(): Promise<void> {
    const configDbPath = `${FileSystem.documentDirectory}SQLite/${CONFIG_DATABASE_NAME}`;

    try {
      // 检查配置数据库文件是否已存在
      const fileInfo = await FileSystem.getInfoAsync(configDbPath);

      if (!fileInfo.exists) {
        console.log('[ConnectionManager] Copying bundled config database...');

        // 确保SQLite目录存在
        const sqliteDir = `${FileSystem.documentDirectory}SQLite`;
        await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });

        // 加载预置配置数据库资产
        const asset = Asset.fromModule(require('../../assets/db/tarot_config.db'));
        await asset.downloadAsync();

        // 复制到可写目录
        await FileSystem.copyAsync({
          from: asset.localUri!,
          to: configDbPath
        });

        console.log('[ConnectionManager] Config database copied successfully');
      } else {
        console.log('[ConnectionManager] Config database already exists');
      }
    } catch (error) {
      console.error('[ConnectionManager] Failed to copy config database:', error);
      throw new Error(`Failed to copy config database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 验证配置数据库完整性
   */
  private async verifyConfigDatabase(): Promise<void> {
    try {
      // 检查必要的表是否存在
      const requiredTables = ['card', 'card_style', 'dimension', 'card_interpretation', 'spread'];

      for (const table of requiredTables) {
        const result = this.configDb.getFirstSync<{count: number}>(
          "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?",
          [table]
        );

        if ((result?.count || 0) === 0) {
          throw new Error(`Required table '${table}' not found in config database`);
        }
      }

      console.log('[ConnectionManager] Config database integrity verified');
    } catch (error) {
      console.error('[ConnectionManager] Config database verification failed:', error);
      throw error;
    }
  }

  /**
   * 创建用户数据表结构
   */
  private async createUserTables(): Promise<void> {
    try {
      // 创建用户历史表
      const userHistorySQL = `
        CREATE TABLE IF NOT EXISTS user_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          spread_id INTEGER NOT NULL,
          card_ids TEXT NOT NULL, -- JSON格式
          interpretation_mode TEXT NOT NULL CHECK (interpretation_mode IN ('default', 'ai')),
          result TEXT NOT NULL, -- JSON格式
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `;

      this.userDb.execSync(userHistorySQL);

      // 创建索引
      const indexSQL = `
        CREATE INDEX IF NOT EXISTS idx_user_history_user_id ON user_history(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_history_timestamp ON user_history(timestamp);
        CREATE INDEX IF NOT EXISTS idx_user_history_user_timestamp ON user_history(user_id, timestamp);
      `;

      this.userDb.execSync(indexSQL);

      console.log('[ConnectionManager] User tables created successfully');
    } catch (error) {
      console.error('[ConnectionManager] Failed to create user tables:', error);
      throw error;
    }
  }

  /**
   * 获取配置数据库连接（只读）
   */
  getConfigDatabase(): SQLite.SQLiteDatabase {
    if (!this.isConfigInitialized) {
      throw new Error('Config database not initialized');
    }
    return this.configDb;
  }

  /**
   * 获取用户数据库连接（读写）
   */
  getUserDatabase(): SQLite.SQLiteDatabase {
    if (!this.isUserInitialized) {
      throw new Error('User database not initialized');
    }
    return this.userDb;
  }

  /**
   * 配置数据库查询（只读操作）
   */
  async queryConfig<T>(sql: string, params: any[] = []): Promise<ServiceResponse<T[]>> {
    try {
      if (!this.isConfigInitialized) {
        await this.initialize();
      }

      const result = this.configDb.getAllSync<T>(sql, params);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Config database query failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Config query failed'
      };
    }
  }

  /**
   * 配置数据库单行查询
   */
  async queryConfigFirst<T>(sql: string, params: any[] = []): Promise<ServiceResponse<T | null>> {
    try {
      if (!this.isConfigInitialized) {
        await this.initialize();
      }

      const result = this.configDb.getFirstSync<T>(sql, params);
      return {
        success: true,
        data: result || null
      };
    } catch (error) {
      console.error('Config database queryFirst failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Config query failed'
      };
    }
  }

  /**
   * 用户数据库查询
   */
  async queryUser<T>(sql: string, params: any[] = []): Promise<ServiceResponse<T[]>> {
    try {
      if (!this.isUserInitialized) {
        await this.initialize();
      }

      const result = this.userDb.getAllSync<T>(sql, params);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('User database query failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'User query failed'
      };
    }
  }

  /**
   * 用户数据库单行查询
   */
  async queryUserFirst<T>(sql: string, params: any[] = []): Promise<ServiceResponse<T | null>> {
    try {
      if (!this.isUserInitialized) {
        await this.initialize();
      }

      const result = this.userDb.getFirstSync<T>(sql, params);
      return {
        success: true,
        data: result || null
      };
    } catch (error) {
      console.error('User database queryFirst failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'User query failed'
      };
    }
  }

  /**
   * 用户数据库执行命令（INSERT, UPDATE, DELETE）
   */
  async executeUser(sql: string, params: any[] = []): Promise<ServiceResponse<DatabaseOperationResult>> {
    try {
      if (!this.isUserInitialized) {
        await this.initialize();
      }

      const result = this.userDb.runSync(sql, params);

      return {
        success: true,
        data: {
          success: true,
          affectedRows: result.changes,
          insertId: result.lastInsertRowId
        }
      };
    } catch (error) {
      console.error('User database execute failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'User execute failed'
      };
    }
  }

  /**
   * 用户数据库事务执行
   */
  async userTransaction(callback: () => void): Promise<ServiceResponse<void>> {
    try {
      if (!this.isUserInitialized) {
        await this.initialize();
      }

      this.userDb.withTransactionSync(callback);

      return {
        success: true
      };
    } catch (error) {
      console.error('User database transaction failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'User transaction failed'
      };
    }
  }

  /**
   * 获取数据库状态
   */
  async getStatus(): Promise<DatabaseStatus> {
    return {
      isInitialized: this.isConfigInitialized && this.isUserInitialized,
      version: 1,
      lastSync: new Date().toISOString()
    };
  }

  /**
   * 重置用户数据库（保留配置数据库）
   */
  async resetUserData(): Promise<ServiceResponse<void>> {
    try {
      console.log('[ConnectionManager] Resetting user data...');

      // 清空用户历史表
      await this.executeUser('DELETE FROM user_history');

      console.log('[ConnectionManager] User data reset completed');
      return {
        success: true
      };
    } catch (error) {
      console.error('[ConnectionManager] User data reset failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Reset failed'
      };
    }
  }

  /**
   * 完全重置（包括配置数据库） - 仅用于开发调试
   */
  async fullReset(): Promise<ServiceResponse<void>> {
    try {
      console.log('[ConnectionManager] Full reset initiated...');
      console.warn('[ConnectionManager] This will require re-copying config database from assets');

      // 关闭数据库连接
      if (this.configDb) {
        this.configDb.closeSync();
      }
      if (this.userDb) {
        this.userDb.closeSync();
      }

      // 删除数据库文件
      const configDbPath = `${FileSystem.documentDirectory}SQLite/${CONFIG_DATABASE_NAME}`;
      const userDbPath = `${FileSystem.documentDirectory}SQLite/${USER_DATABASE_NAME}`;

      try {
        await FileSystem.deleteAsync(configDbPath);
      } catch {
        // 文件可能不存在，忽略错误
      }

      try {
        await FileSystem.deleteAsync(userDbPath);
      } catch {
        // 文件可能不存在，忽略错误
      }

      // 重置状态
      this.isConfigInitialized = false;
      this.isUserInitialized = false;

      console.log('[ConnectionManager] Full reset completed');
      return {
        success: true
      };
    } catch (error) {
      console.error('[ConnectionManager] Full reset failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Full reset failed'
      };
    }
  }
}