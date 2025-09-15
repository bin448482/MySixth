import { DatabaseService } from './DatabaseService';
import type { ServiceResponse } from '../types/database';

export interface CardInterpretationData {
  id: number;
  card_id: number;
  direction: string;
  summary: string;
  detail?: string;
}

export interface CardInterpretationDimensionData {
  id: number;
  interpretation_id: number;
  dimension_id: number;
  aspect?: string;
  aspect_type?: string;
  content: string;
}

export class CardInterpretationService {
  private static instance: CardInterpretationService;
  private dbService: DatabaseService;

  private constructor() {
    this.dbService = DatabaseService.getInstance();
  }

  static getInstance(): CardInterpretationService {
    if (!CardInterpretationService.instance) {
      CardInterpretationService.instance = new CardInterpretationService();
    }
    return CardInterpretationService.instance;
  }

  /**
   * 获取卡牌的基础解读
   */
  async getCardInterpretation(
    cardId: number,
    direction: string
  ): Promise<ServiceResponse<CardInterpretationData>> {
    try {
      const result = await this.dbService.queryFirst<CardInterpretationData>(
        'SELECT * FROM card_interpretation WHERE card_id = ? AND direction = ?',
        [cardId, direction]
      );

      if (result.success && result.data) {
        return { success: true, data: result.data };
      }

      return { success: false, error: result.error || 'Card interpretation not found' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error getting card interpretation'
      };
    }
  }

  /**
   * 获取卡牌的详细维度解读
   */
  async getCardDimensionInterpretation(
    cardId: number,
    direction: string,
    dimensionId: number,
    aspectType?: string
  ): Promise<ServiceResponse<CardInterpretationDimensionData>> {
    try {
      let query = `
        SELECT cid.*
        FROM card_interpretation_dimension cid
        JOIN card_interpretation ci ON cid.interpretation_id = ci.id
        WHERE ci.card_id = ? AND ci.direction = ? AND cid.dimension_id = ?
      `;
      let params = [cardId, direction, dimensionId];

      if (aspectType) {
        query += ' AND cid.aspect_type = ?';
        params.push(aspectType);
      }

      const result = await this.dbService.queryFirst<CardInterpretationDimensionData>(
        query,
        params
      );

      if (result.success && result.data) {
        return { success: true, data: result.data };
      }

      return { success: false, error: result.error || 'Card dimension interpretation not found' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error getting card dimension interpretation'
      };
    }
  }

  /**
   * 获取卡牌的所有维度解读
   */
  async getCardAllDimensionInterpretations(
    cardId: number,
    direction: string
  ): Promise<ServiceResponse<CardInterpretationDimensionData[]>> {
    try {
      const result = await this.dbService.query<CardInterpretationDimensionData>(`
        SELECT cid.*
        FROM card_interpretation_dimension cid
        JOIN card_interpretation ci ON cid.interpretation_id = ci.id
        WHERE ci.card_id = ? AND ci.direction = ?
        ORDER BY cid.dimension_id, cid.aspect_type
      `, [cardId, direction]);

      if (result.success && result.data) {
        return { success: true, data: result.data };
      }

      return { success: false, error: result.error || 'No dimension interpretations found' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error getting card dimension interpretations'
      };
    }
  }

  /**
   * 获取卡牌在特定维度下的解读
   */
  async getCardInterpretationForDimension(
    cardName: string,
    direction: string,
    dimensionName: string,
    aspectType?: string
  ): Promise<ServiceResponse<CardInterpretationDimensionData>> {
    try {
      let query = `
        SELECT cid.*
        FROM card_interpretation_dimension cid
        JOIN card_interpretation ci ON cid.interpretation_id = ci.id
        JOIN card c ON ci.card_id = c.id
        JOIN dimension d ON cid.dimension_id = d.id
        WHERE c.name = ? AND ci.direction = ? AND d.name = ?
      `;
      let params = [cardName, direction, dimensionName];

      if (aspectType) {
        query += ' AND cid.aspect_type = ?';
        params.push(aspectType);
      }

      const result = await this.dbService.queryFirst<CardInterpretationDimensionData>(
        query,
        params
      );

      if (result.success && result.data) {
        return { success: true, data: result.data };
      }

      return { success: false, error: result.error || 'Card dimension interpretation not found' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error getting card interpretation for dimension'
      };
    }
  }
}