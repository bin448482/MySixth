/**
 * 塔罗牌初始数据
 * Initial tarot card data - Complete 78-card deck
 */

import type { Card } from '../../types/database';

// 大阿卡纳 (22张牌)
export const MAJOR_ARCANA_CARDS: Omit<Card, 'id'>[] = [
  {
    name: "愚者",
    arcana: "Major",
    suit: null,
    number: 0,
    image_url: "major/00-fool.jpg",
    style_id: 1, // 1920-raider-waite
    deck: "Rider-Waite"
  },
  {
    name: "魔术师",
    arcana: "Major", 
    suit: null,
    number: 1,
    image_url: "major/01-magician.jpg",
    style_id: 1,
    deck: "Rider-Waite"
  },
  {
    name: "女祭司",
    arcana: "Major",
    suit: null,
    number: 2,
    image_url: "major/02-high-priestess.jpg",
    style_id: 1,
    deck: "Rider-Waite"
  },
  {
    name: "皇后",
    arcana: "Major",
    suit: null,
    number: 3,
    image_url: "major/03-empress.jpg",
    style_id: 1,
    deck: "Rider-Waite"
  },
  {
    name: "皇帝",
    arcana: "Major",
    suit: null,
    number: 4,
    image_url: "major/04-emperor.jpg",
    style_id: 1,
    deck: "Rider-Waite"
  },
  {
    name: "教皇",
    arcana: "Major",
    suit: null,
    number: 5,
    image_url: "major/05-hierophant.jpg",
    style_id: 1,
    deck: "Rider-Waite"
  },
  {
    name: "恋人",
    arcana: "Major",
    suit: null,
    number: 6,
    image_url: "major/06-lovers.jpg",
    style_id: 1,
    deck: "Rider-Waite"
  },
  {
    name: "战车",
    arcana: "Major",
    suit: null,
    number: 7,
    image_url: "major/07-chariot.jpg",
    style_id: 1,
    deck: "Rider-Waite"
  },
  {
    name: "力量",
    arcana: "Major",
    suit: null,
    number: 8,
    image_url: "major/08-strength.jpg",
    style_id: 1,
    deck: "Rider-Waite"
  },
  {
    name: "隐者",
    arcana: "Major",
    suit: null,
    number: 9,
    image_url: "major/09-hermit.jpg",
    style_id: 1,
    deck: "Rider-Waite"
  },
  {
    name: "命运之轮",
    arcana: "Major",
    suit: null,
    number: 10,
    image_url: "major/10-wheel-of-fortune.jpg",
    style_id: 1,
    deck: "Rider-Waite"
  },
  {
    name: "正义",
    arcana: "Major",
    suit: null,
    number: 11,
    image_url: "major/11-justice.jpg",
    style_id: 1,
    deck: "Rider-Waite"
  },
  {
    name: "倒吊人",
    arcana: "Major",
    suit: null,
    number: 12,
    image_url: "major/12-hanged-man.jpg",
    style_id: 1,
    deck: "Rider-Waite"
  },
  {
    name: "死神",
    arcana: "Major",
    suit: null,
    number: 13,
    image_url: "major/13-death.jpg",
    style_id: 1,
    deck: "Rider-Waite"
  },
  {
    name: "节制",
    arcana: "Major",
    suit: null,
    number: 14,
    image_url: "major/14-temperance.jpg",
    style_id: 1,
    deck: "Rider-Waite"
  },
  {
    name: "恶魔",
    arcana: "Major",
    suit: null,
    number: 15,
    image_url: "major/15-devil.jpg",
    style_id: 1,
    deck: "Rider-Waite"
  },
  {
    name: "塔",
    arcana: "Major",
    suit: null,
    number: 16,
    image_url: "major/16-tower.jpg",
    style_id: 1,
    deck: "Rider-Waite"
  },
  {
    name: "星星",
    arcana: "Major",
    suit: null,
    number: 17,
    image_url: "major/17-star.jpg",
    style_id: 1,
    deck: "Rider-Waite"
  },
  {
    name: "月亮",
    arcana: "Major",
    suit: null,
    number: 18,
    image_url: "major/18-moon.jpg",
    style_id: 1,
    deck: "Rider-Waite"
  },
  {
    name: "太阳",
    arcana: "Major",
    suit: null,
    number: 19,
    image_url: "major/19-sun.jpg",
    style_id: 1,
    deck: "Rider-Waite"
  },
  {
    name: "审判",
    arcana: "Major",
    suit: null,
    number: 20,
    image_url: "major/20-judgement.jpg",
    style_id: 1,
    deck: "Rider-Waite"
  },
  {
    name: "世界",
    arcana: "Major",
    suit: null,
    number: 21,
    image_url: "major/21-world.jpg",
    style_id: 1,
    deck: "Rider-Waite"
  }
];

// 小阿卡纳 - 权杖花色 (14张牌)
export const WANDS_CARDS: Omit<Card, 'id'>[] = [
  { name: "权杖王牌", arcana: "Minor", suit: "权杖", number: 1, image_url: "minor/wands/01-ace-of-wands.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "权杖二", arcana: "Minor", suit: "权杖", number: 2, image_url: "minor/wands/02-two-of-wands.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "权杖三", arcana: "Minor", suit: "权杖", number: 3, image_url: "minor/wands/03-three-of-wands.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "权杖四", arcana: "Minor", suit: "权杖", number: 4, image_url: "minor/wands/04-four-of-wands.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "权杖五", arcana: "Minor", suit: "权杖", number: 5, image_url: "minor/wands/05-five-of-wands.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "权杖六", arcana: "Minor", suit: "权杖", number: 6, image_url: "minor/wands/06-six-of-wands.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "权杖七", arcana: "Minor", suit: "权杖", number: 7, image_url: "minor/wands/07-seven-of-wands.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "权杖八", arcana: "Minor", suit: "权杖", number: 8, image_url: "minor/wands/08-eight-of-wands.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "权杖九", arcana: "Minor", suit: "权杖", number: 9, image_url: "minor/wands/09-nine-of-wands.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "权杖十", arcana: "Minor", suit: "权杖", number: 10, image_url: "minor/wands/10-ten-of-wands.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "权杖侍者", arcana: "Minor", suit: "权杖", number: 11, image_url: "minor/wands/11-page-of-wands.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "权杖骑士", arcana: "Minor", suit: "权杖", number: 12, image_url: "minor/wands/12-knight-of-wands.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "权杖王后", arcana: "Minor", suit: "权杖", number: 13, image_url: "minor/wands/13-queen-of-wands.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "权杖国王", arcana: "Minor", suit: "权杖", number: 14, image_url: "minor/wands/14-king-of-wands.jpg", style_id: 1, deck: "Rider-Waite" }
];

// 小阿卡纳 - 圣杯花色 (14张牌)
export const CUPS_CARDS: Omit<Card, 'id'>[] = [
  { name: "圣杯王牌", arcana: "Minor", suit: "圣杯", number: 1, image_url: "minor/cups/01-ace-of-cups.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "圣杯二", arcana: "Minor", suit: "圣杯", number: 2, image_url: "minor/cups/02-two-of-cups.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "圣杯三", arcana: "Minor", suit: "圣杯", number: 3, image_url: "minor/cups/03-three-of-cups.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "圣杯四", arcana: "Minor", suit: "圣杯", number: 4, image_url: "minor/cups/04-four-of-cups.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "圣杯五", arcana: "Minor", suit: "圣杯", number: 5, image_url: "minor/cups/05-five-of-cups.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "圣杯六", arcana: "Minor", suit: "圣杯", number: 6, image_url: "minor/cups/06-six-of-cups.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "圣杯七", arcana: "Minor", suit: "圣杯", number: 7, image_url: "minor/cups/07-seven-of-cups.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "圣杯八", arcana: "Minor", suit: "圣杯", number: 8, image_url: "minor/cups/08-eight-of-cups.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "圣杯九", arcana: "Minor", suit: "圣杯", number: 9, image_url: "minor/cups/09-nine-of-cups.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "圣杯十", arcana: "Minor", suit: "圣杯", number: 10, image_url: "minor/cups/10-ten-of-cups.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "圣杯侍者", arcana: "Minor", suit: "圣杯", number: 11, image_url: "minor/cups/11-page-of-cups.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "圣杯骑士", arcana: "Minor", suit: "圣杯", number: 12, image_url: "minor/cups/12-knight-of-cups.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "圣杯王后", arcana: "Minor", suit: "圣杯", number: 13, image_url: "minor/cups/13-queen-of-cups.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "圣杯国王", arcana: "Minor", suit: "圣杯", number: 14, image_url: "minor/cups/14-king-of-cups.jpg", style_id: 1, deck: "Rider-Waite" }
];

// 小阿卡纳 - 宝剑花色 (14张牌)
export const SWORDS_CARDS: Omit<Card, 'id'>[] = [
  { name: "宝剑王牌", arcana: "Minor", suit: "宝剑", number: 1, image_url: "minor/swords/01-ace-of-swords.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "宝剑二", arcana: "Minor", suit: "宝剑", number: 2, image_url: "minor/swords/02-two-of-swords.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "宝剑三", arcana: "Minor", suit: "宝剑", number: 3, image_url: "minor/swords/03-three-of-swords.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "宝剑四", arcana: "Minor", suit: "宝剑", number: 4, image_url: "minor/swords/04-four-of-swords.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "宝剑五", arcana: "Minor", suit: "宝剑", number: 5, image_url: "minor/swords/05-five-of-swords.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "宝剑六", arcana: "Minor", suit: "宝剑", number: 6, image_url: "minor/swords/06-six-of-swords.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "宝剑七", arcana: "Minor", suit: "宝剑", number: 7, image_url: "minor/swords/07-seven-of-swords.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "宝剑八", arcana: "Minor", suit: "宝剑", number: 8, image_url: "minor/swords/08-eight-of-swords.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "宝剑九", arcana: "Minor", suit: "宝剑", number: 9, image_url: "minor/swords/09-nine-of-swords.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "宝剑十", arcana: "Minor", suit: "宝剑", number: 10, image_url: "minor/swords/10-ten-of-swords.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "宝剑侍者", arcana: "Minor", suit: "宝剑", number: 11, image_url: "minor/swords/11-page-of-swords.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "宝剑骑士", arcana: "Minor", suit: "宝剑", number: 12, image_url: "minor/swords/12-knight-of-swords.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "宝剑王后", arcana: "Minor", suit: "宝剑", number: 13, image_url: "minor/swords/13-queen-of-swords.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "宝剑国王", arcana: "Minor", suit: "宝剑", number: 14, image_url: "minor/swords/14-king-of-swords.jpg", style_id: 1, deck: "Rider-Waite" }
];

// 小阿卡纳 - 钱币花色 (14张牌)
export const PENTACLES_CARDS: Omit<Card, 'id'>[] = [
  { name: "钱币王牌", arcana: "Minor", suit: "钱币", number: 1, image_url: "minor/pentacles/01-ace-of-pentacles.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "钱币二", arcana: "Minor", suit: "钱币", number: 2, image_url: "minor/pentacles/02-two-of-pentacles.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "钱币三", arcana: "Minor", suit: "钱币", number: 3, image_url: "minor/pentacles/03-three-of-pentacles.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "钱币四", arcana: "Minor", suit: "钱币", number: 4, image_url: "minor/pentacles/04-four-of-pentacles.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "钱币五", arcana: "Minor", suit: "钱币", number: 5, image_url: "minor/pentacles/05-five-of-pentacles.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "钱币六", arcana: "Minor", suit: "钱币", number: 6, image_url: "minor/pentacles/06-six-of-pentacles.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "钱币七", arcana: "Minor", suit: "钱币", number: 7, image_url: "minor/pentacles/07-seven-of-pentacles.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "钱币八", arcana: "Minor", suit: "钱币", number: 8, image_url: "minor/pentacles/08-eight-of-pentacles.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "钱币九", arcana: "Minor", suit: "钱币", number: 9, image_url: "minor/pentacles/09-nine-of-pentacles.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "钱币十", arcana: "Minor", suit: "钱币", number: 10, image_url: "minor/pentacles/10-ten-of-pentacles.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "钱币侍者", arcana: "Minor", suit: "钱币", number: 11, image_url: "minor/pentacles/11-page-of-pentacles.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "钱币骑士", arcana: "Minor", suit: "钱币", number: 12, image_url: "minor/pentacles/12-knight-of-pentacles.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "钱币王后", arcana: "Minor", suit: "钱币", number: 13, image_url: "minor/pentacles/13-queen-of-pentacles.jpg", style_id: 1, deck: "Rider-Waite" },
  { name: "钱币国王", arcana: "Minor", suit: "钱币", number: 14, image_url: "minor/pentacles/14-king-of-pentacles.jpg", style_id: 1, deck: "Rider-Waite" }
];

// 合并所有卡牌数据
export const ALL_CARDS: Omit<Card, 'id'>[] = [
  ...MAJOR_ARCANA_CARDS,
  ...WANDS_CARDS,
  ...CUPS_CARDS,
  ...SWORDS_CARDS,
  ...PENTACLES_CARDS
];

// 插入卡牌数据的SQL语句
export const INSERT_CARDS_SQL = `
  INSERT INTO card (name, arcana, suit, number, image_url, style_id, deck) 
  VALUES (?, ?, ?, ?, ?, ?, ?)
`;

// 批量插入卡牌数据的函数
export function getCardInsertStatements() {
  return ALL_CARDS.map(card => ({
    sql: INSERT_CARDS_SQL,
    params: [card.name, card.arcana, card.suit, card.number, card.image_url, card.style_id, card.deck]
  }));
}

// 获取数据统计信息
export function getCardStatistics() {
  return {
    total: ALL_CARDS.length,
    majorArcana: MAJOR_ARCANA_CARDS.length,
    minorArcana: WANDS_CARDS.length + CUPS_CARDS.length + SWORDS_CARDS.length + PENTACLES_CARDS.length,
    suits: {
      wands: WANDS_CARDS.length,
      cups: CUPS_CARDS.length,
      swords: SWORDS_CARDS.length,
      pentacles: PENTACLES_CARDS.length
    }
  };
}