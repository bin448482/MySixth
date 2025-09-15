/**
 * 数据库表结构定义
 * Database table schema definitions
 * Based on tarot_db_design.md
 */

export const DATABASE_NAME = 'tarot.db';
export const DATABASE_VERSION = 1;

// SQL statements for creating tables
export const CREATE_TABLES = {
  // 1. card 表 - 卡牌基础信息
  card: `
    CREATE TABLE IF NOT EXISTS card (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      arcana TEXT NOT NULL,
      suit TEXT,
      number INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      style_id INTEGER,
      deck TEXT NOT NULL,
      FOREIGN KEY (style_id) REFERENCES card_style (id)
    );
  `,

  // 2. card_style 表 - 牌面风格
  card_style: `
    CREATE TABLE IF NOT EXISTS card_style (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      image_base_url TEXT NOT NULL
    );
  `,

  // 3. dimension 表 - 解读维度定义
  dimension: `
    CREATE TABLE IF NOT EXISTS dimension (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      aspect TEXT,
      aspect_type INTEGER
    );
  `,

  // 4. card_interpretation 表 - 牌意主表
  card_interpretation: `
    CREATE TABLE IF NOT EXISTS card_interpretation (
      id INTEGER PRIMARY KEY,
      card_id INTEGER NOT NULL,
      direction TEXT NOT NULL CHECK (direction IN ('正位', '逆位')),
      summary TEXT NOT NULL,
      detail TEXT,
      FOREIGN KEY (card_id) REFERENCES card (id)
    );
  `,

  // 5. card_interpretation_dimension 表 - 牌意维度关联
  card_interpretation_dimension: `
    CREATE TABLE IF NOT EXISTS card_interpretation_dimension (
      id INTEGER PRIMARY KEY,
      interpretation_id INTEGER NOT NULL,
      dimension_id INTEGER NOT NULL,
      aspect TEXT,
      aspect_type TEXT,
      content TEXT NOT NULL,
      FOREIGN KEY (interpretation_id) REFERENCES card_interpretation (id),
      FOREIGN KEY (dimension_id) REFERENCES dimension (id)
    );
  `,

  // 6. spread 表 - 牌阵定义
  spread: `
    CREATE TABLE IF NOT EXISTS spread (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      card_count INTEGER NOT NULL
    );
  `,

  // 7. user_history 表 - 用户历史记录
  user_history: `
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
  `
};

// Indexes for better performance
export const CREATE_INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_card_arcana ON card (arcana);',
  'CREATE INDEX IF NOT EXISTS idx_card_deck ON card (deck);',
  'CREATE INDEX IF NOT EXISTS idx_dimension_category ON dimension (category);',
  'CREATE INDEX IF NOT EXISTS idx_interpretation_card_direction ON card_interpretation (card_id, direction);',
  'CREATE INDEX IF NOT EXISTS idx_user_history_user_timestamp ON user_history (user_id, timestamp);'
];