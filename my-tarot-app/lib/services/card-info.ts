/**
 * 卡牌信息聚合服务
 * 整合卡牌基础信息、解读内容和历史文化背景
 */

import type {
  TarotHistory,
  CardSummary,
  CardInterpretation,
  CardDetail,
  CardFilters,
  CardSearchResult,
  CardServiceConfig,
  CardImageConfig
} from '../types/cards';
import type { ServiceResponse } from '../types/database';
import { CardService } from './CardService';
import { CardInterpretationService } from './CardInterpretationService';

interface RawCardInterpretation {
  card_name: string;
  direction: string;
  summary: string;
  detail: string;
}

export class CardInfoService {
  private static instance: CardInfoService;
  private cardService: CardService;
  private cardInterpretationService: CardInterpretationService;
  private interpretationsCache: Map<string, CardInterpretation> = new Map();
  private historyCache: TarotHistory | null = null;
  private config: CardServiceConfig;

  private constructor() {
    this.cardService = CardService.getInstance();
    this.cardInterpretationService = CardInterpretationService.getInstance();
    this.config = this.getDefaultConfig();
  }

  public static getInstance(): CardInfoService {
    if (!CardInfoService.instance) {
      CardInfoService.instance = new CardInfoService();
    }
    return CardInfoService.instance;
  }

  private getDefaultConfig(): CardServiceConfig {
    const imageConfig: CardImageConfig = {
      basePath: 'assets/images',
      format: 'jpg',
      sizes: {
        thumbnail: { width: 120, height: 200 },
        medium: { width: 240, height: 400 },
        large: { width: 480, height: 800 }
      }
    };

    return {
      enableCache: true,
      cacheTimeout: 5 * 60 * 1000, // 5分钟缓存
      imageConfig,
      defaultFilters: {
        arcana: 'all',
        suit: 'all',
        search: ''
      }
    };
  }

  /**
   * 获取塔罗历史文化背景
   */
  async getTarotHistory(): Promise<ServiceResponse<TarotHistory>> {
    try {
      // 检查缓存
      if (this.config.enableCache && this.historyCache) {
        return { success: true, data: this.historyCache };
      }

      // 直接导入本地JSON数据
      const historyData = require('../../assets/data/tarot_history.json') as TarotHistory;

      if (!historyData) {
        throw new Error('Failed to load tarot history data');
      }

      // 缓存数据
      if (this.config.enableCache) {
        this.historyCache = historyData;
      }

      return { success: true, data: historyData };

    } catch (error) {
      console.error('Error loading tarot history:', error);
      // 提供默认数据作为降级方案
      const fallbackHistory: TarotHistory = {
        version: "1.0.0",
        updated_at: new Date().toISOString(),
        description: "塔罗牌历史文化背景介绍",
        overview: "塔罗牌是一套古老的占卜工具，由78张卡牌组成，用于自我探索和内心指引。",
        origins: "塔罗牌起源于15世纪的欧洲，最初作为纸牌游戏，后发展为占卜工具。",
        major_minor: "大阿卡纳22张代表人生重要主题，小阿卡纳56张关注日常生活事务。",
        usage_notes: "塔罗牌是自我反思的工具，请将其作为指引而非绝对预测。",
        interpretation_guidance: "正位表示能量正面流动，逆位可能暗示阻滞或内在化。",
        cultural_significance: "塔罗牌反映了人类集体无意识的深层结构和原型象征。",
        references: ["韦特塔罗牌官方指南", "塔罗牌图像的钥匙"]
      };

      if (this.config.enableCache) {
        this.historyCache = fallbackHistory;
      }

      return { success: true, data: fallbackHistory };
    }
  }

  /**
   * 加载卡牌解读数据（从配置数据库）
   */
  private async loadCardInterpretations(): Promise<ServiceResponse<RawCardInterpretation[]>> {
    try {
      // 获取所有卡牌列表
      const cardsResponse = await this.cardService.getAllCards();
      if (!cardsResponse.success || !cardsResponse.data) {
        return {
          success: false,
          error: cardsResponse.error || 'Failed to fetch cards'
        };
      }

      const cards = cardsResponse.data;
      const interpretations: RawCardInterpretation[] = [];

      // 为每张卡牌获取正位和逆位解读
      for (const card of cards) {
        try {
          // 获取正位解读
          const uprightResponse = await this.cardInterpretationService.getCardInterpretation(
            card.id,
            '正位'
          );
          if (uprightResponse.success && uprightResponse.data) {
            interpretations.push({
              card_name: card.name,
              direction: '正位',
              summary: uprightResponse.data.summary,
              detail: uprightResponse.data.detail || ''
            });
          }

          // 获取逆位解读
          const reversedResponse = await this.cardInterpretationService.getCardInterpretation(
            card.id,
            '逆位'
          );
          if (reversedResponse.success && reversedResponse.data) {
            interpretations.push({
              card_name: card.name,
              direction: '逆位',
              summary: reversedResponse.data.summary,
              detail: reversedResponse.data.detail || ''
            });
          }
        } catch (error) {
          console.warn(`Failed to load interpretation for card ${card.name}:`, error);
          // 继续处理其他卡牌，不因单个卡牌失败而中断
        }
      }

      if (interpretations.length === 0) {
        return {
          success: false,
          error: 'No card interpretations found in database'
        };
      }

      return { success: true, data: interpretations };

    } catch (error) {
      console.error('Error loading card interpretations from database:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load card interpretations from database'
      };
    }
  }

  /**
   * 构建卡牌解读映射
   */
  private async buildInterpretationsMap(): Promise<ServiceResponse<Map<string, CardInterpretation>>> {
    try {
      // 如果已有缓存，直接返回
      if (this.config.enableCache && this.interpretationsCache.size > 0) {
        return { success: true, data: this.interpretationsCache };
      }

      const interpretationsResponse = await this.loadCardInterpretations();
      if (!interpretationsResponse.success || !interpretationsResponse.data) {
        return {
          success: false,
          error: interpretationsResponse.error || 'Failed to load interpretations'
        };
      }

      const rawInterpretations = interpretationsResponse.data;
      const interpretationsMap = new Map<string, CardInterpretation>();

      // 按卡牌名称分组，每张卡牌包含正位和逆位解读
      const cardGroups = new Map<string, { upright?: RawCardInterpretation; reversed?: RawCardInterpretation }>();

      rawInterpretations.forEach(item => {
        if (!cardGroups.has(item.card_name)) {
          cardGroups.set(item.card_name, {});
        }

        const group = cardGroups.get(item.card_name)!;
        if (item.direction === '正位') {
          group.upright = item;
        } else if (item.direction === '逆位') {
          group.reversed = item;
        }
      });

      // 构建最终的解读映射
      let cardId = 1;
      cardGroups.forEach((group, cardName) => {
        if (group.upright && group.reversed) {
          const interpretation: CardInterpretation = {
            cardId: cardId++,
            cardName,
            upright: {
              summary: group.upright.summary,
              detail: group.upright.detail
            },
            reversed: {
              summary: group.reversed.summary,
              detail: group.reversed.detail
            }
          };

          interpretationsMap.set(cardName, interpretation);
        }
      });

      // 缓存结果
      if (this.config.enableCache) {
        this.interpretationsCache = interpretationsMap;
      }

      return { success: true, data: interpretationsMap };

    } catch (error) {
      console.error('Error building interpretations map:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to build interpretations map'
      };
    }
  }

  /**
   * 生成卡牌图片资源
   */
  private getCardImageSource(cardName: string, arcana: string, suit?: string, number?: number) {
    if (arcana.toLowerCase() === 'major') {
      // 大阿卡纳图片映射
      const majorImageMap: Record<string, any> = {
        '愚者': require('../../assets/images/major/00-fool.jpg'),
        '魔术师': require('../../assets/images/major/01-magician.jpg'),
        '女祭司': require('../../assets/images/major/02-high-priestess.jpg'),
        '皇后': require('../../assets/images/major/03-empress.jpg'),
        '皇帝': require('../../assets/images/major/04-emperor.jpg'),
        '教皇': require('../../assets/images/major/05-hierophant.jpg'),
        '恋人': require('../../assets/images/major/06-lovers.jpg'),
        '战车': require('../../assets/images/major/07-chariot.jpg'),
        '力量': require('../../assets/images/major/08-strength.jpg'),
        '隐者': require('../../assets/images/major/09-hermit.jpg'),
        '命运之轮': require('../../assets/images/major/10-wheel-of-fortune.jpg'),
        '正义': require('../../assets/images/major/11-justice.jpg'),
        '倒吊人': require('../../assets/images/major/12-hanged-man.jpg'),
        '死神': require('../../assets/images/major/13-death.jpg'),
        '节制': require('../../assets/images/major/14-temperance.jpg'),
        '恶魔': require('../../assets/images/major/15-devil.jpg'),
        '塔': require('../../assets/images/major/16-tower.jpg'),
        '星星': require('../../assets/images/major/17-star.jpg'),
        '月亮': require('../../assets/images/major/18-moon.jpg'),
        '太阳': require('../../assets/images/major/19-sun.jpg'),
        '审判': require('../../assets/images/major/20-judgement.jpg'),
        '世界': require('../../assets/images/major/21-world.jpg'),
      };

      return majorImageMap[cardName] || require('../../assets/images/major/00-fool.jpg');
    } else {
      // 小阿卡纳图片映射
      const minorImageMap: Record<string, any> = {
        // 权杖花色 (Wands)
        '权杖王牌': require('../../assets/images/minor/wands/01-ace-of-wands.jpg'),
        '权杖二': require('../../assets/images/minor/wands/02-two-of-wands.jpg'),
        '权杖三': require('../../assets/images/minor/wands/03-three-of-wands.jpg'),
        '权杖四': require('../../assets/images/minor/wands/04-four-of-wands.jpg'),
        '权杖五': require('../../assets/images/minor/wands/05-five-of-wands.jpg'),
        '权杖六': require('../../assets/images/minor/wands/06-six-of-wands.jpg'),
        '权杖七': require('../../assets/images/minor/wands/07-seven-of-wands.jpg'),
        '权杖八': require('../../assets/images/minor/wands/08-eight-of-wands.jpg'),
        '权杖九': require('../../assets/images/minor/wands/09-nine-of-wands.jpg'),
        '权杖十': require('../../assets/images/minor/wands/10-ten-of-wands.jpg'),
        '权杖侍者': require('../../assets/images/minor/wands/11-page-of-wands.jpg'),
        '权杖骑士': require('../../assets/images/minor/wands/12-knight-of-wands.jpg'),
        '权杖王后': require('../../assets/images/minor/wands/13-queen-of-wands.jpg'),
        '权杖国王': require('../../assets/images/minor/wands/14-king-of-wands.jpg'),

        // 圣杯花色 (Cups)
        '圣杯王牌': require('../../assets/images/minor/cups/01-ace-of-cups.jpg'),
        '圣杯二': require('../../assets/images/minor/cups/02-two-of-cups.jpg'),
        '圣杯三': require('../../assets/images/minor/cups/03-three-of-cups.jpg'),
        '圣杯四': require('../../assets/images/minor/cups/04-four-of-cups.jpg'),
        '圣杯五': require('../../assets/images/minor/cups/05-five-of-cups.jpg'),
        '圣杯六': require('../../assets/images/minor/cups/06-six-of-cups.jpg'),
        '圣杯七': require('../../assets/images/minor/cups/07-seven-of-cups.jpg'),
        '圣杯八': require('../../assets/images/minor/cups/08-eight-of-cups.jpg'),
        '圣杯九': require('../../assets/images/minor/cups/09-nine-of-cups.jpg'),
        '圣杯十': require('../../assets/images/minor/cups/10-ten-of-cups.jpg'),
        '圣杯侍者': require('../../assets/images/minor/cups/11-page-of-cups.jpg'),
        '圣杯骑士': require('../../assets/images/minor/cups/12-knight-of-cups.jpg'),
        '圣杯王后': require('../../assets/images/minor/cups/13-queen-of-cups.jpg'),
        '圣杯国王': require('../../assets/images/minor/cups/14-king-of-cups.jpg'),

        // 宝剑花色 (Swords)
        '宝剑王牌': require('../../assets/images/minor/swords/01-ace-of-swords.jpg'),
        '宝剑二': require('../../assets/images/minor/swords/02-two-of-swords.jpg'),
        '宝剑三': require('../../assets/images/minor/swords/03-three-of-swords.jpg'),
        '宝剑四': require('../../assets/images/minor/swords/04-four-of-swords.jpg'),
        '宝剑五': require('../../assets/images/minor/swords/05-five-of-swords.jpg'),
        '宝剑六': require('../../assets/images/minor/swords/06-six-of-swords.jpg'),
        '宝剑七': require('../../assets/images/minor/swords/07-seven-of-swords.jpg'),
        '宝剑八': require('../../assets/images/minor/swords/08-eight-of-swords.jpg'),
        '宝剑九': require('../../assets/images/minor/swords/09-nine-of-swords.jpg'),
        '宝剑十': require('../../assets/images/minor/swords/10-ten-of-swords.jpg'),
        '宝剑侍者': require('../../assets/images/minor/swords/11-page-of-swords.jpg'),
        '宝剑骑士': require('../../assets/images/minor/swords/12-knight-of-swords.jpg'),
        '宝剑王后': require('../../assets/images/minor/swords/13-queen-of-swords.jpg'),
        '宝剑国王': require('../../assets/images/minor/swords/14-king-of-swords.jpg'),

        // 星币/钱币花色 (Pentacles)
        '星币王牌': require('../../assets/images/minor/pentacles/01-ace-of-pentacles.jpg'),
        '星币二': require('../../assets/images/minor/pentacles/02-two-of-pentacles.jpg'),
        '星币三': require('../../assets/images/minor/pentacles/03-three-of-pentacles.jpg'),
        '星币四': require('../../assets/images/minor/pentacles/04-four-of-pentacles.jpg'),
        '星币五': require('../../assets/images/minor/pentacles/05-five-of-pentacles.jpg'),
        '星币六': require('../../assets/images/minor/pentacles/06-six-of-pentacles.jpg'),
        '星币七': require('../../assets/images/minor/pentacles/07-seven-of-pentacles.jpg'),
        '星币八': require('../../assets/images/minor/pentacles/08-eight-of-pentacles.jpg'),
        '星币九': require('../../assets/images/minor/pentacles/09-nine-of-pentacles.jpg'),
        '星币十': require('../../assets/images/minor/pentacles/10-ten-of-pentacles.jpg'),
        '星币侍者': require('../../assets/images/minor/pentacles/11-page-of-pentacles.jpg'),
        '星币骑士': require('../../assets/images/minor/pentacles/12-knight-of-pentacles.jpg'),
        '星币王后': require('../../assets/images/minor/pentacles/13-queen-of-pentacles.jpg'),
        '星币国王': require('../../assets/images/minor/pentacles/14-king-of-pentacles.jpg'),

        // 钱币花色 (数据库中使用的名称)
        '钱币王牌': require('../../assets/images/minor/pentacles/01-ace-of-pentacles.jpg'),
        '钱币二': require('../../assets/images/minor/pentacles/02-two-of-pentacles.jpg'),
        '钱币三': require('../../assets/images/minor/pentacles/03-three-of-pentacles.jpg'),
        '钱币四': require('../../assets/images/minor/pentacles/04-four-of-pentacles.jpg'),
        '钱币五': require('../../assets/images/minor/pentacles/05-five-of-pentacles.jpg'),
        '钱币六': require('../../assets/images/minor/pentacles/06-six-of-pentacles.jpg'),
        '钱币七': require('../../assets/images/minor/pentacles/07-seven-of-pentacles.jpg'),
        '钱币八': require('../../assets/images/minor/pentacles/08-eight-of-pentacles.jpg'),
        '钱币九': require('../../assets/images/minor/pentacles/09-nine-of-pentacles.jpg'),
        '钱币十': require('../../assets/images/minor/pentacles/10-ten-of-pentacles.jpg'),
        '钱币侍者': require('../../assets/images/minor/pentacles/11-page-of-pentacles.jpg'),
        '钱币骑士': require('../../assets/images/minor/pentacles/12-knight-of-pentacles.jpg'),
        '钱币王后': require('../../assets/images/minor/pentacles/13-queen-of-pentacles.jpg'),
        '钱币国王': require('../../assets/images/minor/pentacles/14-king-of-pentacles.jpg'),
      };

      return minorImageMap[cardName] || require('../../assets/images/major/00-fool.jpg');
    }
  }

  /**
   * 生成卡牌图片路径（保留用于调试）
   */
  private generateImagePath(cardName: string, arcana: string, suit?: string, number?: number): string {
    const { basePath, format } = this.config.imageConfig;

    if (arcana.toLowerCase() === 'major') {
      // 大阿卡纳图片路径：major/00-fool.jpg
      const cardNumber = (number !== undefined ? number : 0).toString().padStart(2, '0');

      // 完整的大阿卡纳中英文映射表
      const majorArcanaMapping: Record<string, string> = {
        '愚者': 'fool',
        '魔术师': 'magician',
        '女祭司': 'high-priestess',
        '皇后': 'empress',
        '皇帝': 'emperor',
        '教皇': 'hierophant',
        '恋人': 'lovers',
        '战车': 'chariot',
        '力量': 'strength',
        '隐者': 'hermit',
        '命运之轮': 'wheel-of-fortune',
        '正义': 'justice',
        '倒吊人': 'hanged-man',
        '死神': 'death',
        '节制': 'temperance',
        '恶魔': 'devil',
        '塔': 'tower',
        '星星': 'star',
        '月亮': 'moon',
        '太阳': 'sun',
        '审判': 'judgement',
        '世界': 'world'
      };

      const englishName = majorArcanaMapping[cardName] || cardName.toLowerCase();
      const fileName = `${cardNumber}-${englishName}.${format}`;
      return `${basePath}/major/${fileName}`;
    } else {
      // 小阿卡纳图片路径：minor/wands/01-ace-of-wands.jpg
      const suitMapping: Record<string, string> = {
        'wands': 'wands',
        'cups': 'cups',
        'swords': 'swords',
        'pentacles': 'pentacles',
        '权杖': 'wands',
        '圣杯': 'cups',
        '宝剑': 'swords',
        '星币': 'pentacles'
      };

      const suitPath = suit ? suitMapping[suit] || suit.toLowerCase() : 'wands';
      const cardNumber = (number !== undefined ? number : 1).toString().padStart(2, '0');

      // 小阿卡纳卡牌名称映射
      const minorCardMapping: Record<string, string> = {
        // 王牌
        '权杖王牌': 'ace-of-wands',
        '圣杯王牌': 'ace-of-cups',
        '宝剑王牌': 'ace-of-swords',
        '星币王牌': 'ace-of-pentacles',
        // 数字牌 2-10
        '权杖二': '02-of-wands',
        '权杖三': '03-of-wands',
        '权杖四': '04-of-wands',
        '权杖五': '05-of-wands',
        '权杖六': '06-of-wands',
        '权杖七': '07-of-wands',
        '权杖八': '08-of-wands',
        '权杖九': '09-of-wands',
        '权杖十': '10-of-wands',
        // 宫廷牌
        '权杖侍者': 'page-of-wands',
        '权杖骑士': 'knight-of-wands',
        '权杖王后': 'queen-of-wands',
        '权杖国王': 'king-of-wands',
        // 圣杯花色
        '圣杯二': '02-of-cups',
        '圣杯三': '03-of-cups',
        '圣杯四': '04-of-cups',
        '圣杯五': '05-of-cups',
        '圣杯六': '06-of-cups',
        '圣杯七': '07-of-cups',
        '圣杯八': '08-of-cups',
        '圣杯九': '09-of-cups',
        '圣杯十': '10-of-cups',
        '圣杯侍者': 'page-of-cups',
        '圣杯骑士': 'knight-of-cups',
        '圣杯王后': 'queen-of-cups',
        '圣杯国王': 'king-of-cups',
        // 宝剑花色
        '宝剑二': '02-of-swords',
        '宝剑三': '03-of-swords',
        '宝剑四': '04-of-swords',
        '宝剑五': '05-of-swords',
        '宝剑六': '06-of-swords',
        '宝剑七': '07-of-swords',
        '宝剑八': '08-of-swords',
        '宝剑九': '09-of-swords',
        '宝剑十': '10-of-swords',
        '宝剑侍者': 'page-of-swords',
        '宝剑骑士': 'knight-of-swords',
        '宝剑王后': 'queen-of-swords',
        '宝剑国王': 'king-of-swords',
        // 星币花色
        '星币二': '02-of-pentacles',
        '星币三': '03-of-pentacles',
        '星币四': '04-of-pentacles',
        '星币五': '05-of-pentacles',
        '星币六': '06-of-pentacles',
        '星币七': '07-of-pentacles',
        '星币八': '08-of-pentacles',
        '星币九': '09-of-pentacles',
        '星币十': '10-of-pentacles',
        '星币侍者': 'page-of-pentacles',
        '星币骑士': 'knight-of-pentacles',
        '星币王后': 'queen-of-pentacles',
        '星币国王': 'king-of-pentacles'
      };

      const fileName = minorCardMapping[cardName] || `${cardNumber}-${cardName.toLowerCase()}.${format}`;
      return `${basePath}/minor/${suitPath}/${fileName}`;
    }
  }

  /**
   * 获取所有卡牌列表（支持筛选）
   */
  async listCards(filters: CardFilters = this.config.defaultFilters): Promise<ServiceResponse<CardSummary[]>> {
    try {
      // 构建查询选项
      const queryOptions: any = {};

      if (filters.arcana && filters.arcana !== 'all') {
        queryOptions.arcana = filters.arcana === 'major' ? 'Major' : 'Minor';
      }

      if (filters.suit && filters.suit !== 'all') {
        // 英文花色名称到中文的映射
        const suitMapping: Record<string, string> = {
          'wands': '权杖',
          'cups': '圣杯',
          'swords': '宝剑',
          'pentacles': '钱币'  // 数据库中使用"钱币"而不是"星币"
        };
        queryOptions.suit = suitMapping[filters.suit] || filters.suit;
      }

      if (filters.search) {
        queryOptions.name = filters.search;
      }

      // 从数据库获取卡牌基础信息
      const cardsResponse = await this.cardService.getAllCards(queryOptions);
      if (!cardsResponse.success || !cardsResponse.data) {
        return {
          success: false,
          error: cardsResponse.error || 'Failed to fetch cards'
        };
      }

      // 转换为CardSummary格式
      const cardSummaries: CardSummary[] = cardsResponse.data.map(card => ({
        id: card.id,
        name: card.name,
        arcana: card.arcana.toLowerCase() as 'major' | 'minor',
        suit: card.suit as 'wands' | 'cups' | 'swords' | 'pentacles' | undefined,
        number: card.number,
        image: this.getCardImageSource(card.name, card.arcana, card.suit || undefined, card.number),
        deck: card.deck
      }));

      return { success: true, data: cardSummaries };

    } catch (error) {
      console.error('Error listing cards:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list cards'
      };
    }
  }

  /**
   * 获取单张卡牌详情
   */
  async getCardDetail(cardId: number): Promise<ServiceResponse<CardDetail>> {
    try {
      // 获取卡牌基础信息
      const cardResponse = await this.cardService.getCardById(cardId);
      if (!cardResponse.success || !cardResponse.data) {
        return {
          success: false,
          error: cardResponse.error || 'Card not found'
        };
      }

      const card = cardResponse.data;

      // 获取解读映射
      const interpretationsMapResponse = await this.buildInterpretationsMap();
      if (!interpretationsMapResponse.success || !interpretationsMapResponse.data) {
        return {
          success: false,
          error: interpretationsMapResponse.error || 'Failed to load interpretations'
        };
      }

      const interpretationsMap = interpretationsMapResponse.data;
      const interpretation = interpretationsMap.get(card.name);

      if (!interpretation) {
        return {
          success: false,
          error: `No interpretation found for card: ${card.name}`
        };
      }

      // 构建完整卡牌详情
      const cardDetail: CardDetail = {
        id: card.id,
        name: card.name,
        arcana: card.arcana.toLowerCase() as 'major' | 'minor',
        suit: card.suit as 'wands' | 'cups' | 'swords' | 'pentacles' | undefined,
        number: card.number,
        image: this.getCardImageSource(card.name, card.arcana, card.suit || undefined, card.number),
        deck: card.deck,
        interpretations: interpretation
      };

      return { success: true, data: cardDetail };

    } catch (error) {
      console.error('Error getting card detail:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get card detail'
      };
    }
  }

  /**
   * 搜索卡牌（按名称、关键词）
   */
  async searchCards(query: string): Promise<ServiceResponse<CardSearchResult[]>> {
    try {
      // 使用现有的搜索功能
      const searchResponse = await this.cardService.searchCards(query);
      if (!searchResponse.success || !searchResponse.data) {
        return {
          success: false,
          error: searchResponse.error || 'Search failed'
        };
      }

      // 构建搜索结果
      const results: CardSearchResult[] = searchResponse.data.map(card => {
        const matchFields: string[] = [];
        let score = 0;

        // 计算匹配分数
        if (card.name.includes(query)) {
          matchFields.push('name');
          score += 10;
        }
        if (card.arcana.includes(query)) {
          matchFields.push('arcana');
          score += 5;
        }
        if (card.suit && card.suit.includes(query)) {
          matchFields.push('suit');
          score += 3;
        }
        if (card.deck.includes(query)) {
          matchFields.push('deck');
          score += 1;
        }

        return {
          card: {
            id: card.id,
            name: card.name,
            arcana: card.arcana.toLowerCase() as 'major' | 'minor',
            suit: card.suit as 'wands' | 'cups' | 'swords' | 'pentacles' | undefined,
            number: card.number,
            image: this.getCardImageSource(card.name, card.arcana, card.suit || undefined, card.number),
            deck: card.deck
          },
          matchFields,
          score
        };
      });

      // 按分数排序
      results.sort((a, b) => b.score - a.score);

      return { success: true, data: results };

    } catch (error) {
      console.error('Error searching cards:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.interpretationsCache.clear();
    this.historyCache = null;
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<CardServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}