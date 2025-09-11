/**
 * 数据库初始化和迁移脚本
 * Database initialization and migration scripts
 */

import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES, CREATE_INDEXES, DATABASE_NAME } from './schema';

export class DatabaseMigrations {
  private db: SQLite.SQLiteDatabase;

  constructor() {
    this.db = SQLite.openDatabaseSync(DATABASE_NAME);
  }

  /**
   * 初始化数据库 - 创建所有表和索引
   */
  async initialize(): Promise<void> {
    try {
      // 创建表
      for (const [tableName, createSQL] of Object.entries(CREATE_TABLES)) {
        console.log(`Creating table: ${tableName}`);
        await this.db.execAsync(createSQL);
      }

      // 创建索引
      for (const indexSQL of CREATE_INDEXES) {
        await this.db.execAsync(indexSQL);
      }

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * 检查数据库是否已初始化
   */
  async isDatabaseInitialized(): Promise<boolean> {
    try {
      const result = await this.db.getFirstAsync<{count: number}>(
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='card'"
      );
      return (result?.count || 0) > 0;
    } catch {
      return false;
    }
  }

  /**
   * 清空数据库（用于重新初始化）
   */
  async dropAllTables(): Promise<void> {
    const tableNames = Object.keys(CREATE_TABLES).reverse(); // 反向删除以避免外键约束问题
    
    try {
      for (const tableName of tableNames) {
        await this.db.execAsync(`DROP TABLE IF EXISTS ${tableName}`);
      }
      console.log('All tables dropped successfully');
    } catch (error) {
      console.error('Failed to drop tables:', error);
      throw error;
    }
  }

  /**
   * 获取数据库实例
   */
  getDatabase(): SQLite.SQLiteDatabase {
    return this.db;
  }
}