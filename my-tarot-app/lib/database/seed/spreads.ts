/**
 * 牌阵初始数据
 * Initial spread data
 */

import type { Spread } from '../../types/database';

// 牌阵初始数据
export const INITIAL_SPREADS: Omit<Spread, 'id'>[] = [
  {
    name: "三牌阵",
    description: "经典的三张牌布阵，代表过去、现在、未来，适合探索时间线上的发展趋势和洞察。第一张牌代表过去的影响，第二张牌显示当前的状况，第三张牌预示未来的可能发展方向。",
    card_count: 3
  }
];

// 插入牌阵数据的SQL语句
export const INSERT_SPREADS_SQL = `
  INSERT INTO spread (name, description, card_count) VALUES (?, ?, ?)
`;

// 批量插入牌阵数据的函数
export function getSpreadInsertStatements() {
  return INITIAL_SPREADS.map(spread => ({
    sql: INSERT_SPREADS_SQL,
    params: [spread.name, spread.description, spread.card_count]
  }));
}