/**
 * JSON数据结构类型定义
 * JSON data structure type definitions
 */

// 通用JSON数据结构
export interface JsonDataFile<T> {
  version: string;
  updated_at: string;
  description: string;
  data: T[];
}

// JSON中的卡牌风格数据（无ID）
export interface JsonCardStyle {
  name: string;
  image_base_url: string;
}

// JSON中的卡牌数据（style_name代替style_id）
export interface JsonCard {
  name: string;
  arcana: 'Major' | 'Minor';
  suit: string | null;
  number: number;
  image_url: string;
  style_name: string;  // 注意：JSON中使用name，不是id
  deck: string;
}

// JSON中的牌阵数据（无ID）
export interface JsonSpread {
  name: string;
  description: string;
  card_count: number;
}

// 完整的JSON数据文件类型
export type CardStylesJson = JsonDataFile<JsonCardStyle>;
export type CardsJson = JsonDataFile<JsonCard>;
export type SpreadsJson = JsonDataFile<JsonSpread>;

// 数据导入结果
export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

// 数据导入状态
export interface ImportStatus {
  table: string;
  status: 'pending' | 'importing' | 'completed' | 'error';
  result?: ImportResult;
  error?: string;
}

// 完整导入会话状态
export interface ImportSession {
  sessionId: string;
  startTime: string;
  tables: ImportStatus[];
  totalProgress: number;
  isCompleted: boolean;
}