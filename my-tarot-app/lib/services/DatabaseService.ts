/**
 * 核心数据库服务
 * Core database service for SQLite operations
 */

import * as SQLite from 'expo-sqlite';
import { DatabaseMigrations } from '../database/migrations';
import { DATABASE_NAME } from '../database/schema';
import type { 
  DatabaseOperationResult, 
  ServiceResponse, 
  DatabaseStatus 
} from '../types/database';

export class DatabaseService {
  private static instance: DatabaseService;
  private db: SQLite.SQLiteDatabase;
  private migrations: DatabaseMigrations;
  private isInitialized: boolean = false;

  private constructor() {
    this.db = SQLite.openDatabaseSync(DATABASE_NAME);
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
   * 初始化数据库
   */
  async initialize(): Promise<ServiceResponse<DatabaseStatus>> {
    try {
      const isInitialized = await this.migrations.isDatabaseInitialized();
      
      if (!isInitialized) {
        console.log('Database not initialized. Creating tables...');
        await this.migrations.initialize();
      }

      this.isInitialized = true;
      
      return {
        success: true,
        data: {
          isInitialized: true,
          version: 1,
          lastSync: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Database initialization failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
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

      const result = await this.db.getAllAsync<T>(sql, params);
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

      const result = await this.db.getFirstAsync<T>(sql, params);
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

      const result = await this.db.runAsync(sql, params);
      
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
        const result = await this.db.runAsync(statement.sql, statement.params || []);
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
  async transaction(callback: () => Promise<void>): Promise<ServiceResponse<void>> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      await this.db.withTransactionAsync(callback);
      
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