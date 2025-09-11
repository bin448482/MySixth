/**
 * JSON文件加载器
 * JSON file loader for static data assets
 */

import type { 
  JsonDataFile, 
  CardStylesJson, 
  CardsJson, 
  SpreadsJson 
} from './types';

export class JsonLoader {
  private static instance: JsonLoader;

  public static getInstance(): JsonLoader {
    if (!JsonLoader.instance) {
      JsonLoader.instance = new JsonLoader();
    }
    return JsonLoader.instance;
  }

  /**
   * 加载卡牌风格JSON数据
   */
  async loadCardStyles(): Promise<CardStylesJson> {
    try {
      const response = await fetch('/assets/data/card_styles.json');
      if (!response.ok) {
        throw new Error(`Failed to load card_styles.json: ${response.status}`);
      }
      
      const data: CardStylesJson = await response.json();
      this.validateJsonStructure(data, 'card_styles');
      
      console.log(`✅ Loaded ${data.data.length} card style(s) from JSON`);
      return data;
      
    } catch (error) {
      console.error('❌ Failed to load card styles JSON:', error);
      throw error;
    }
  }

  /**
   * 加载卡牌JSON数据
   */
  async loadCards(): Promise<CardsJson> {
    try {
      const response = await fetch('/assets/data/cards.json');
      if (!response.ok) {
        throw new Error(`Failed to load cards.json: ${response.status}`);
      }
      
      const data: CardsJson = await response.json();
      this.validateJsonStructure(data, 'cards');
      
      // 验证卡牌数据完整性
      this.validateCardData(data.data);
      
      console.log(`✅ Loaded ${data.data.length} card(s) from JSON`);
      return data;
      
    } catch (error) {
      console.error('❌ Failed to load cards JSON:', error);
      throw error;
    }
  }

  /**
   * 加载牌阵JSON数据
   */
  async loadSpreads(): Promise<SpreadsJson> {
    try {
      const response = await fetch('/assets/data/spreads.json');
      if (!response.ok) {
        throw new Error(`Failed to load spreads.json: ${response.status}`);
      }
      
      const data: SpreadsJson = await response.json();
      this.validateJsonStructure(data, 'spreads');
      
      console.log(`✅ Loaded ${data.data.length} spread(s) from JSON`);
      return data;
      
    } catch (error) {
      console.error('❌ Failed to load spreads JSON:', error);
      throw error;
    }
  }

  /**
   * 批量加载所有JSON数据
   */
  async loadAll(): Promise<{
    cardStyles: CardStylesJson;
    cards: CardsJson;
    spreads: SpreadsJson;
  }> {
    try {
      console.log('📦 Loading all JSON data files...');
      
      const [cardStyles, cards, spreads] = await Promise.all([
        this.loadCardStyles(),
        this.loadCards(),
        this.loadSpreads()
      ]);

      console.log('✅ All JSON data loaded successfully');
      
      return { cardStyles, cards, spreads };
      
    } catch (error) {
      console.error('❌ Failed to load JSON data:', error);
      throw error;
    }
  }

  /**
   * 验证JSON文件基础结构
   */
  private validateJsonStructure<T>(data: JsonDataFile<T>, fileName: string): void {
    if (!data.version || !data.updated_at || !data.data || !Array.isArray(data.data)) {
      throw new Error(`Invalid JSON structure in ${fileName}: missing required fields`);
    }

    if (data.data.length === 0) {
      console.warn(`⚠️ ${fileName} contains no data items`);
    }
  }

  /**
   * 验证卡牌数据完整性
   */
  private validateCardData(cards: any[]): void {
    // 验证总数
    if (cards.length !== 78) {
      throw new Error(`Expected 78 cards, but found ${cards.length}`);
    }

    // 统计各类卡牌
    const majorCount = cards.filter(c => c.arcana === 'Major').length;
    const minorCount = cards.filter(c => c.arcana === 'Minor').length;
    
    if (majorCount !== 22) {
      throw new Error(`Expected 22 major arcana, but found ${majorCount}`);
    }
    
    if (minorCount !== 56) {
      throw new Error(`Expected 56 minor arcana, but found ${minorCount}`);
    }

    // 验证小阿卡纳花色
    const suits = ['权杖', '圣杯', '宝剑', '钱币'];
    for (const suit of suits) {
      const suitCount = cards.filter(c => c.suit === suit).length;
      if (suitCount !== 14) {
        throw new Error(`Expected 14 ${suit} cards, but found ${suitCount}`);
      }
    }

    // 验证必需字段
    for (const card of cards) {
      if (!card.name || !card.arcana || card.number === undefined || !card.image_url || !card.style_name || !card.deck) {
        throw new Error(`Card missing required fields: ${JSON.stringify(card)}`);
      }
    }

    console.log('✅ Card data validation passed');
  }

  /**
   * 检查JSON数据版本
   */
  async checkDataVersions(): Promise<{
    cardStyles: string;
    cards: string;
    spreads: string;
  }> {
    try {
      const [cardStyles, cards, spreads] = await Promise.all([
        this.loadCardStyles(),
        this.loadCards(), 
        this.loadSpreads()
      ]);

      return {
        cardStyles: cardStyles.version,
        cards: cards.version,
        spreads: spreads.version
      };
    } catch (error) {
      console.error('Failed to check data versions:', error);
      throw error;
    }
  }
}