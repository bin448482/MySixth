/**
 * JSON文件加载器
 * JSON file loader for static data assets
 */

import type { 
  JsonDataFile, 
  CardStylesJson, 
  CardsJson, 
  SpreadsJson,
  DimensionsJson,
  CardInterpretationsJson,
  CardInterpretationDimensionsJson
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
   * 加载解读维度JSON数据
   */
  async loadDimensions(): Promise<DimensionsJson> {
    try {
      const response = await fetch('/assets/data/dimensions.json');
      if (!response.ok) {
        throw new Error(`Failed to load dimensions.json: ${response.status}`);
      }
      
      const data: DimensionsJson = await response.json();
      this.validateJsonStructure(data, 'dimensions');
      
      console.log(`✅ Loaded ${data.data.length} dimension(s) from JSON`);
      return data;
      
    } catch (error) {
      console.error('❌ Failed to load dimensions JSON:', error);
      throw error;
    }
  }

  /**
   * 加载卡牌解读JSON数据
   */
  async loadCardInterpretations(): Promise<CardInterpretationsJson> {
    try {
      const response = await fetch('/assets/data/card_interpretations.json');
      if (!response.ok) {
        throw new Error(`Failed to load card_interpretations.json: ${response.status}`);
      }
      
      const data: CardInterpretationsJson = await response.json();
      this.validateJsonStructure(data, 'card_interpretations');
      
      // 验证解读数据完整性
      this.validateCardInterpretationData(data.data);
      
      console.log(`✅ Loaded ${data.data.length} card interpretation(s) from JSON`);
      return data;
      
    } catch (error) {
      console.error('❌ Failed to load card interpretations JSON:', error);
      throw error;
    }
  }

  /**
   * 加载卡牌解读维度关联JSON数据
   */
  async loadCardInterpretationDimensions(): Promise<CardInterpretationDimensionsJson> {
    try {
      const response = await fetch('/assets/data/card_interpretation_dimensions.json');
      if (!response.ok) {
        throw new Error(`Failed to load card_interpretation_dimensions.json: ${response.status}`);
      }
      
      const data: CardInterpretationDimensionsJson = await response.json();
      this.validateJsonStructure(data, 'card_interpretation_dimensions');
      
      console.log(`✅ Loaded ${data.data.length} card interpretation dimension(s) from JSON`);
      return data;
      
    } catch (error) {
      console.error('❌ Failed to load card interpretation dimensions JSON:', error);
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
    dimensions: DimensionsJson;
    cardInterpretations: CardInterpretationsJson;
    cardInterpretationDimensions: CardInterpretationDimensionsJson;
  }> {
    try {
      console.log('📦 Loading all JSON data files...');
      
      const [cardStyles, cards, spreads, dimensions, cardInterpretations, cardInterpretationDimensions] = await Promise.all([
        this.loadCardStyles(),
        this.loadCards(),
        this.loadSpreads(),
        this.loadDimensions(),
        this.loadCardInterpretations(),
        this.loadCardInterpretationDimensions()
      ]);

      console.log('✅ All JSON data loaded successfully');
      
      return { 
        cardStyles, 
        cards, 
        spreads, 
        dimensions, 
        cardInterpretations, 
        cardInterpretationDimensions 
      };
      
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
   * 验证卡牌解读数据完整性
   */
  private validateCardInterpretationData(interpretations: any[]): void {
    // 验证总数（78张牌 × 2个方向 = 156条解读）
    if (interpretations.length !== 156) {
      throw new Error(`Expected 156 card interpretations (78 cards × 2 directions), but found ${interpretations.length}`);
    }

    // 统计正位/逆位数量
    const uprightCount = interpretations.filter(i => i.direction === '正位').length;
    const reversedCount = interpretations.filter(i => i.direction === '逆位').length;
    
    if (uprightCount !== 78) {
      throw new Error(`Expected 78 upright interpretations, but found ${uprightCount}`);
    }
    
    if (reversedCount !== 78) {
      throw new Error(`Expected 78 reversed interpretations, but found ${reversedCount}`);
    }

    // 验证必需字段
    for (const interpretation of interpretations) {
      if (!interpretation.card_name || !interpretation.direction || !interpretation.summary) {
        throw new Error(`Card interpretation missing required fields: ${JSON.stringify(interpretation)}`);
      }
    }

    console.log('✅ Card interpretation data validation passed');
  }

  /**
   * 检查JSON数据版本
   */
  async checkDataVersions(): Promise<{
    cardStyles: string;
    cards: string;
    spreads: string;
    dimensions: string;
    cardInterpretations: string;
    cardInterpretationDimensions: string;
  }> {
    try {
      const [cardStyles, cards, spreads, dimensions, cardInterpretations, cardInterpretationDimensions] = await Promise.all([
        this.loadCardStyles(),
        this.loadCards(), 
        this.loadSpreads(),
        this.loadDimensions(),
        this.loadCardInterpretations(),
        this.loadCardInterpretationDimensions()
      ]);

      return {
        cardStyles: cardStyles.version,
        cards: cards.version,
        spreads: spreads.version,
        dimensions: dimensions.version,
        cardInterpretations: cardInterpretations.version,
        cardInterpretationDimensions: cardInterpretationDimensions.version
      };
    } catch (error) {
      console.error('Failed to check data versions:', error);
      throw error;
    }
  }
}