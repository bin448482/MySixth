/**
 * 数据库相关TypeScript类型定义
 * Database-related TypeScript type definitions
 * Based on tarot_db_design.md
 */

// 1. Card - 卡牌基础信息
export interface Card {
  id: number;
  name: string;
  arcana: 'Major' | 'Minor';
  suit?: string;
  number: number;
  image_url: string;
  style_id?: number;
  deck: string;
}

// 2. CardStyle - 牌面风格
export interface CardStyle {
  id: number;
  name: string;
  image_base_url: string;
}

// 3. Dimension - 解读维度定义
export interface Dimension {
  id: number;
  name: string;
  category: string;
  description: string;
  aspect?: string;
  aspect_type?: string;
}

// 4. CardInterpretation - 牌意主表
export interface CardInterpretation {
  id: number;
  card_id: number;
  direction: '正位' | '逆位';
  summary: string;
  detail?: string;
}

// 5. CardInterpretationDimension - 牌意维度关联
export interface CardInterpretationDimension {
  id: number;
  interpretation_id: number;
  dimension_id: number;
  aspect?: string;
  aspect_type?: string;
  content: string;
}

// 6. Spread - 牌阵定义
export interface Spread {
  id: number;
  name: string;
  description: string;
  card_count: number;
}

// 7. UserHistory - 用户历史记录
export interface UserHistory {
  id: number;
  user_id: string;
  timestamp: string;
  spread_id: number;
  card_ids: number[];
  interpretation_mode: 'default' | 'ai';
  result: any; // JSON object
}

// 扩展类型定义

// 完整的卡牌信息（包含解读）
export interface CardWithInterpretation extends Card {
  interpretations: {
    upright: CardInterpretation & {
      dimensions: (CardInterpretationDimension & { dimension: Dimension })[];
    };
    reversed: CardInterpretation & {
      dimensions: (CardInterpretationDimension & { dimension: Dimension })[];
    };
  };
}

// 抽牌结果
export interface CardDraw {
  card: Card;
  position: number; // 在牌阵中的位置
  isReversed: boolean;
}

// 完整的解读结果
export interface ReadingResult {
  id?: number;
  spread: Spread;
  cards: CardDraw[];
  interpretation: {
    overall: string;
    cards: {
      card_id: number;
      position: number;
      interpretation: string;
      dimensions?: {
        dimension_id: number;
        content: string;
      }[];
    }[];
  };
  created_at: string;
}

// 数据库操作相关类型

// 数据库初始化状态
export interface DatabaseStatus {
  isInitialized: boolean;
  version: number;
  lastSync?: string;
}

// 查询选项
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

// 卡牌查询条件
export interface CardQuery extends QueryOptions {
  arcana?: 'Major' | 'Minor';
  suit?: string;
  deck?: string;
  name?: string;
}

// 历史记录查询条件
export interface HistoryQuery extends QueryOptions {
  user_id: string;
  interpretation_mode?: 'default' | 'ai';
  date_from?: string;
  date_to?: string;
}

// 服务层响应类型
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 数据库操作结果
export interface DatabaseOperationResult {
  success: boolean;
  affectedRows?: number;
  insertId?: number;
  error?: string;
}