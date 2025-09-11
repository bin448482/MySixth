/**
 * 卡牌风格初始数据
 * Initial card style data
 */

import type { CardStyle } from '../../types/database';

// 卡牌风格初始数据
export const INITIAL_CARD_STYLES: Omit<CardStyle, 'id'>[] = [
  {
    name: "1920-raider-waite",
    image_base_url: "" // 先为空，后续可以设置为实际的图片base URL
  }
];

// 插入卡牌风格数据的SQL语句
export const INSERT_CARD_STYLES_SQL = `
  INSERT INTO card_style (name, image_base_url) VALUES (?, ?)
`;

// 批量插入卡牌风格数据的函数
export function getCardStyleInsertStatements() {
  return INITIAL_CARD_STYLES.map(style => ({
    sql: INSERT_CARD_STYLES_SQL,
    params: [style.name, style.image_base_url]
  }));
}