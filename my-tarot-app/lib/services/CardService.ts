/**
 * 卡牌业务逻辑服务
 * Card business logic service
 */

import { DatabaseService } from './DatabaseService';
import type { 
  Card, 
  CardStyle, 
  CardInterpretation,
  CardWithInterpretation,
  CardQuery,
  ServiceResponse 
} from '../types/database';

export class CardService {
  private static instance: CardService;
  private dbService: DatabaseService;

  private constructor() {
    this.dbService = DatabaseService.getInstance();
  }

  public static getInstance(): CardService {
    if (!CardService.instance) {
      CardService.instance = new CardService();
    }
    return CardService.instance;
  }

  /**
   * 获取所有卡牌
   */
  async getAllCards(options: CardQuery = {}): Promise<ServiceResponse<Card[]>> {
    let sql = 'SELECT * FROM card WHERE 1=1';
    const params: any[] = [];

    // 构建查询条件
    if (options.arcana) {
      sql += ' AND arcana = ?';
      params.push(options.arcana);
    }

    if (options.suit) {
      sql += ' AND suit = ?';
      params.push(options.suit);
    }

    if (options.deck) {
      sql += ' AND deck = ?';
      params.push(options.deck);
    }

    if (options.name) {
      sql += ' AND name LIKE ?';
      params.push(`%${options.name}%`);
    }

    // 排序
    if (options.orderBy) {
      sql += ` ORDER BY ${options.orderBy} ${options.orderDirection || 'ASC'}`;
    } else {
      sql += ' ORDER BY arcana, number';
    }

    // 分页
    if (options.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
      
      if (options.offset) {
        sql += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    return await this.dbService.query<Card>(sql, params);
  }

  /**
   * 根据ID获取卡牌
   */
  async getCardById(id: number): Promise<ServiceResponse<Card | null>> {
    const sql = 'SELECT * FROM card WHERE id = ?';
    return await this.dbService.queryFirst<Card>(sql, [id]);
  }

  /**
   * 获取大阿卡纳卡牌
   */
  async getMajorArcana(): Promise<ServiceResponse<Card[]>> {
    return await this.getAllCards({ arcana: 'Major' });
  }

  /**
   * 获取小阿卡纳卡牌
   */
  async getMinorArcana(suit?: string): Promise<ServiceResponse<Card[]>> {
    return await this.getAllCards({ arcana: 'Minor', suit });
  }

  /**
   * 获取卡牌及其完整解读信息
   */
  async getCardWithInterpretations(cardId: number): Promise<ServiceResponse<CardWithInterpretation | null>> {
    try {
      // 获取卡牌基础信息
      const cardResponse = await this.getCardById(cardId);
      if (!cardResponse.success || !cardResponse.data) {
        return cardResponse as ServiceResponse<CardWithInterpretation | null>;
      }

      const card = cardResponse.data;

      // 获取正位解读
      const uprightSQL = `
        SELECT ci.*, cid.dimension_id, cid.aspect, cid.aspect_type, cid.content,
               d.name as dimension_name, d.category as dimension_category, d.description as dimension_description
        FROM card_interpretation ci
        LEFT JOIN card_interpretation_dimension cid ON ci.id = cid.interpretation_id
        LEFT JOIN dimension d ON cid.dimension_id = d.id
        WHERE ci.card_id = ? AND ci.direction = '正位'
      `;

      // 获取逆位解读
      const reversedSQL = `
        SELECT ci.*, cid.dimension_id, cid.aspect, cid.aspect_type, cid.content,
               d.name as dimension_name, d.category as dimension_category, d.description as dimension_description
        FROM card_interpretation ci
        LEFT JOIN card_interpretation_dimension cid ON ci.id = cid.interpretation_id
        LEFT JOIN dimension d ON cid.dimension_id = d.id
        WHERE ci.card_id = ? AND ci.direction = '逆位'
      `;

      const [uprightResponse, reversedResponse] = await Promise.all([
        this.dbService.query(uprightSQL, [cardId]),
        this.dbService.query(reversedSQL, [cardId])
      ]);

      if (!uprightResponse.success || !reversedResponse.success) {
        return {
          success: false,
          error: 'Failed to fetch interpretations'
        };
      }

      // 处理解读数据
      const processInterpretations = (interpretations: any[]) => {
        if (interpretations.length === 0) return null;
        
        const baseInterpretation = interpretations[0];
        const dimensions = interpretations
          .filter(item => item.dimension_id)
          .map(item => ({
            id: item.dimension_id,
            interpretation_id: item.id,
            dimension_id: item.dimension_id,
            aspect: item.aspect,
            aspect_type: item.aspect_type,
            content: item.content,
            dimension: {
              id: item.dimension_id,
              name: item.dimension_name,
              category: item.dimension_category,
              description: item.dimension_description,
              aspect: item.aspect,
              aspect_type: item.aspect_type
            }
          }));

        return {
          id: baseInterpretation.id,
          card_id: baseInterpretation.card_id,
          direction: baseInterpretation.direction,
          summary: baseInterpretation.summary,
          detail: baseInterpretation.detail,
          dimensions
        };
      };

      const upright = processInterpretations(uprightResponse.data || []);
      const reversed = processInterpretations(reversedResponse.data || []);

      const cardWithInterpretation: CardWithInterpretation = {
        ...card,
        interpretations: {
          upright: upright as any,
          reversed: reversed as any
        }
      };

      return {
        success: true,
        data: cardWithInterpretation
      };

    } catch (error) {
      console.error('Error fetching card with interpretations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 随机抽取卡牌
   */
  async drawRandomCards(count: number, excludeIds: number[] = []): Promise<ServiceResponse<Card[]>> {
    let sql = 'SELECT * FROM card WHERE 1=1';
    const params: any[] = [];

    if (excludeIds.length > 0) {
      const placeholders = excludeIds.map(() => '?').join(',');
      sql += ` AND id NOT IN (${placeholders})`;
      params.push(...excludeIds);
    }

    sql += ' ORDER BY RANDOM() LIMIT ?';
    params.push(count);

    return await this.dbService.query<Card>(sql, params);
  }

  /**
   * 获取所有卡牌风格
   */
  async getAllCardStyles(): Promise<ServiceResponse<CardStyle[]>> {
    const sql = 'SELECT * FROM card_style ORDER BY name';
    return await this.dbService.query<CardStyle>(sql);
  }

  /**
   * 根据风格ID获取卡牌
   */
  async getCardsByStyle(styleId: number): Promise<ServiceResponse<Card[]>> {
    const sql = 'SELECT * FROM card WHERE style_id = ? ORDER BY arcana, number';
    return await this.dbService.query<Card>(sql, [styleId]);
  }

  /**
   * 搜索卡牌
   */
  async searchCards(keyword: string): Promise<ServiceResponse<Card[]>> {
    const sql = `
      SELECT * FROM card 
      WHERE name LIKE ? OR arcana LIKE ? OR suit LIKE ? OR deck LIKE ?
      ORDER BY 
        CASE 
          WHEN name LIKE ? THEN 1
          WHEN arcana LIKE ? THEN 2
          ELSE 3
        END,
        name
    `;
    const searchPattern = `%${keyword}%`;
    const exactPattern = `${keyword}%`;
    const params = [
      searchPattern, searchPattern, searchPattern, searchPattern,
      exactPattern, exactPattern
    ];

    return await this.dbService.query<Card>(sql, params);
  }
}