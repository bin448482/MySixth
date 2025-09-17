/**
 * 用户数据库服务 - 读写操作
 * User database service for read/write operations
 */

import { DatabaseConnectionManager } from './connection';
import type { ServiceResponse, DatabaseOperationResult } from '../types/database';

export interface UserHistory {
  id?: number;
  user_id: string;
  timestamp?: string;
  spread_id: number;
  card_ids: string; // JSON string
  interpretation_mode: 'default' | 'ai';
  result: string; // JSON string
  created_at?: string;
  updated_at?: string;
}

export class UserDatabaseService {
  private static instance: UserDatabaseService;
  private connectionManager: DatabaseConnectionManager;

  private constructor() {
    this.connectionManager = DatabaseConnectionManager.getInstance();
  }

  /**
   * 获取用户数据库服务单例
   */
  public static getInstance(): UserDatabaseService {
    if (!UserDatabaseService.instance) {
      UserDatabaseService.instance = new UserDatabaseService();
    }
    return UserDatabaseService.instance;
  }

  /**
   * 初始化用户数据库
   */
  async initialize(): Promise<ServiceResponse<boolean>> {
    try {
      const result = await this.connectionManager.initialize();
      return {
        success: result.success,
        data: result.success,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'User database initialization failed'
      };
    }
  }

  /**
   * 保存用户占卜历史
   */
  async saveUserHistory(history: Omit<UserHistory, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<number>> {
    try {
      const sql = `
        INSERT INTO user_history (user_id, spread_id, card_ids, interpretation_mode, result, timestamp)
        VALUES (?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
      `;

      const params = [
        history.user_id,
        history.spread_id,
        history.card_ids,
        history.interpretation_mode,
        history.result,
        history.timestamp
      ];

      const result = await this.connectionManager.executeUser(sql, params);

      if (result.success && result.data?.insertId) {
        return {
          success: true,
          data: result.data.insertId
        };
      } else {
        return {
          success: false,
          error: 'Failed to save user history'
        };
      }
    } catch (error) {
      console.error('Error saving user history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 获取用户占卜历史
   */
  async getUserHistory(userId: string, limit: number = 50, offset: number = 0): Promise<ServiceResponse<UserHistory[]>> {
    try {
      const sql = `
        SELECT * FROM user_history
        WHERE user_id = ?
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
      `;

      return await this.connectionManager.queryUser<UserHistory>(sql, [userId, limit, offset]);
    } catch (error) {
      console.error('Error getting user history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 根据ID获取占卜历史记录
   */
  async getUserHistoryById(id: number): Promise<ServiceResponse<UserHistory | null>> {
    try {
      const sql = 'SELECT * FROM user_history WHERE id = ?';
      return await this.connectionManager.queryUserFirst<UserHistory>(sql, [id]);
    } catch (error) {
      console.error('Error getting user history by id:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 获取用户历史记录数量
   */
  async getUserHistoryCount(userId: string): Promise<ServiceResponse<number>> {
    try {
      const sql = 'SELECT COUNT(*) as count FROM user_history WHERE user_id = ?';
      const result = await this.connectionManager.queryUserFirst<{count: number}>(sql, [userId]);

      if (result.success && result.data) {
        return {
          success: true,
          data: result.data.count
        };
      } else {
        return {
          success: false,
          error: 'Failed to get user history count'
        };
      }
    } catch (error) {
      console.error('Error getting user history count:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 删除用户占卜历史记录
   */
  async deleteUserHistory(id: number): Promise<ServiceResponse<boolean>> {
    try {
      const sql = 'DELETE FROM user_history WHERE id = ?';
      const result = await this.connectionManager.executeUser(sql, [id]);

      return {
        success: result.success,
        data: result.success && (result.data?.affectedRows || 0) > 0,
        error: result.error
      };
    } catch (error) {
      console.error('Error deleting user history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 删除用户所有历史记录
   */
  async deleteAllUserHistory(userId: string): Promise<ServiceResponse<number>> {
    try {
      const sql = 'DELETE FROM user_history WHERE user_id = ?';
      const result = await this.connectionManager.executeUser(sql, [userId]);

      if (result.success) {
        return {
          success: true,
          data: result.data?.affectedRows || 0
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to delete user history'
        };
      }
    } catch (error) {
      console.error('Error deleting all user history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 更新用户历史记录
   */
  async updateUserHistory(id: number, updates: Partial<UserHistory>): Promise<ServiceResponse<boolean>> {
    try {
      const allowedFields = ['interpretation_mode', 'result'];
      const updateFields: string[] = [];
      const params: any[] = [];

      // 构建更新字段
      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key) && updates[key as keyof UserHistory] !== undefined) {
          updateFields.push(`${key} = ?`);
          params.push(updates[key as keyof UserHistory]);
        }
      });

      if (updateFields.length === 0) {
        return {
          success: false,
          error: 'No valid fields to update'
        };
      }

      // 添加 updated_at 时间戳
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      const sql = `UPDATE user_history SET ${updateFields.join(', ')} WHERE id = ?`;
      const result = await this.connectionManager.executeUser(sql, params);

      return {
        success: result.success,
        data: result.success && (result.data?.affectedRows || 0) > 0,
        error: result.error
      };
    } catch (error) {
      console.error('Error updating user history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 获取用户最近的占卜记录
   */
  async getRecentUserHistory(userId: string, days: number = 7): Promise<ServiceResponse<UserHistory[]>> {
    try {
      const sql = `
        SELECT * FROM user_history
        WHERE user_id = ?
        AND timestamp >= datetime('now', '-${days} days')
        ORDER BY timestamp DESC
      `;

      return await this.connectionManager.queryUser<UserHistory>(sql, [userId]);
    } catch (error) {
      console.error('Error getting recent user history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 按日期范围获取用户历史
   */
  async getUserHistoryByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<ServiceResponse<UserHistory[]>> {
    try {
      const sql = `
        SELECT * FROM user_history
        WHERE user_id = ?
        AND timestamp BETWEEN ? AND ?
        ORDER BY timestamp DESC
      `;

      return await this.connectionManager.queryUser<UserHistory>(sql, [userId, startDate, endDate]);
    } catch (error) {
      console.error('Error getting user history by date range:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 获取用户使用的牌阵统计
   */
  async getUserSpreadStats(userId: string): Promise<ServiceResponse<Array<{spread_id: number, count: number}>>> {
    try {
      const sql = `
        SELECT spread_id, COUNT(*) as count
        FROM user_history
        WHERE user_id = ?
        GROUP BY spread_id
        ORDER BY count DESC
      `;

      return await this.connectionManager.queryUser<{spread_id: number, count: number}>(sql, [userId]);
    } catch (error) {
      console.error('Error getting user spread stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 清空所有用户数据（用于重置）
   */
  async clearAllUserData(): Promise<ServiceResponse<boolean>> {
    try {
      console.log('[UserDatabaseService] Clearing all user data...');

      const result = await this.connectionManager.executeUser('DELETE FROM user_history');

      if (result.success) {
        console.log(`[UserDatabaseService] Cleared ${result.data?.affectedRows || 0} user history records`);
        return {
          success: true,
          data: true
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to clear user data'
        };
      }
    } catch (error) {
      console.error('Error clearing user data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 执行用户数据库事务
   */
  async executeTransaction(callback: () => void): Promise<ServiceResponse<void>> {
    return await this.connectionManager.userTransaction(callback);
  }
}