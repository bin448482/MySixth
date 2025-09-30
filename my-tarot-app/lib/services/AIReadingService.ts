/**
 * AI塔罗牌解读服务
 * 负责与后端AI解读API的交互
 */

import AuthService from './AuthService';
import { apiConfig, endpoints, buildApiUrl } from '../config/api';

export interface AnalyzeRequest {
  description: string;
  spread_type: string;
}

export interface DimensionInfo {
  id: number;
  name: string;
  category: string;
  description: string;
  aspect?: string;
  aspect_type?: number;
}

export interface AnalyzeResponse {
  recommended_dimensions: DimensionInfo[];
  user_description: string;
}

export interface CardInfo {
  id?: number;
  name: string;
  arcana: string;
  suit?: string;
  number: number;
  direction: string;
  position: number;
  image_url?: string;
  deck?: string;
}

export interface GenerateRequest {
  cards: CardInfo[];
  dimensions: DimensionInfo[];
  description: string;
  spread_type: string;
}

export interface GenerateResponse {
  dimensions: DimensionInfo[];
  user_description: string;
  spread_type: string;
  card_interpretations: any[];
  dimension_summaries: Record<string, string>;
  overall_summary: string;
  insights: string[];
  generated_at: string;
}

class AIReadingService {
  private static instance: AIReadingService;
  private authService: AuthService;

  private constructor() {
    this.authService = AuthService.getInstance();
    console.log('AI Service Base URL:', apiConfig.baseUrl);
  }

  static getInstance(): AIReadingService {
    if (!AIReadingService.instance) {
      AIReadingService.instance = new AIReadingService();
    }
    return AIReadingService.instance;
  }

  private async getRequestHeaders(): Promise<Record<string, string>> {
    const authHeaders = await this.authService.getAuthHeaders();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeaders
    };
  }

  /**
   * 分析用户描述，获取推荐维度
   */
  async analyzeDescription(
    description: string,
    spreadType: string = 'three-card'
  ): Promise<AnalyzeResponse> {
    try {
      console.log('调用AI分析接口:', { description, spreadType });

      const request: AnalyzeRequest = {
        description,
        spread_type: spreadType
      };

      const headers = await this.getRequestHeaders();

      const response = await fetch(buildApiUrl(endpoints.readings.analyze), {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (response.status === 401) {
        await this.authService.clearToken();
        throw new Error('认证失败，请重新登录');
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API请求失败: ${response.status} - ${errorText}`);
      }

      const result: AnalyzeResponse = await response.json();
      console.log('AI分析结果:', result);

      return result;
    } catch (error) {
      console.error('AI分析请求失败:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 生成AI解读结果
   */
  async generateAIReading(
    cards: CardInfo[],
    dimensions: DimensionInfo[],
    description: string,
    spreadType: string = 'three-card'
  ): Promise<GenerateResponse> {
    try {
      const request: GenerateRequest = {
        cards,
        dimensions,
        description,
        spread_type: spreadType
      };

      console.log('🚀 === AIReadingService.generateAIReading 开始 ===');
      console.log('🌐 请求URL:', buildApiUrl(endpoints.readings.generate));
      console.log('📋 请求方法: POST');
      console.log('📄 请求体 (完整):', JSON.stringify(request, null, 2));
      console.log('🎴 卡牌详情:');
      cards.forEach((card, index) => {
        console.log(`  卡牌 ${index + 1}:`, {
          id: card.id,
          name: card.name,
          direction: card.direction,
          position: card.position
        });
      });
      console.log('🎯 维度详情:');
      dimensions.forEach((dim, index) => {
        console.log(`  维度 ${index + 1}:`, {
          id: dim.id,
          name: dim.name,
          aspect: dim.aspect,
          aspect_type: dim.aspect_type
        });
      });

      const headers = await this.getRequestHeaders();
      console.log('📦 请求头:', headers);

      const response = await fetch(buildApiUrl(endpoints.readings.generate), {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      console.log('📡 响应状态:', response.status, response.statusText);
      console.log('📡 响应头:', Object.fromEntries(response.headers.entries()));

      if (response.status === 401) {
        await this.authService.clearToken();
        throw new Error('认证失败，请重新登录');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API请求失败:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`API请求失败: ${response.status} - ${errorText}`);
      }

      const result: GenerateResponse = await response.json();

      console.log('✅ === AIReadingService.generateAIReading 响应 ===');
      console.log('📦 完整响应数据 (JSON):', JSON.stringify(result, null, 2));
      console.log('🔍 响应数据结构分析:');
      console.log('  📊 dimensions:', result.dimensions?.length || 0, '个维度');
      console.log('  🎴 card_interpretations:', result.card_interpretations?.length || 0, '个解读');
      console.log('  📝 dimension_summaries keys:', Object.keys(result.dimension_summaries || {}));
      console.log('  📖 overall_summary 长度:', result.overall_summary?.length || 0);
      console.log('  💡 insights:', result.insights?.length || 0, '个洞察');

      if (result.card_interpretations) {
        console.log('🎴 卡牌解读详情:');
        result.card_interpretations.forEach((interpretation, index) => {
          console.log(`  解读 ${index + 1}:`, {
            card_id: interpretation.card_id,
            card_name: interpretation.card_name,
            direction: interpretation.direction,
            position: interpretation.position,
            has_ai_interpretation: !!interpretation.ai_interpretation,
            has_basic_summary: !!interpretation.basic_summary
          });
        });
      }

      console.log('🏁 === AIReadingService.generateAIReading 结束 ===');

      return result;
    } catch (error) {
      console.error('💥 AI解读生成请求失败:', error);
      if (error instanceof Error) {
        console.error('💥 错误详情:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      throw this.handleError(error);
    }
  }

  /**
   * 错误处理
   */
  private handleError(error: any): Error {
    if (error instanceof Error) {
      // 网络错误
      if (error.message.includes('fetch') || error.message.includes('Network')) {
        return new Error('网络连接失败，请检查网络设置');
      }
      // 超时错误
      if (error.message.includes('timeout') || error.message.includes('AbortError')) {
        return new Error('请求超时，请稍后重试');
      }
      // API错误
      if (error.message.includes('500')) {
        return new Error('AI服务暂时不可用，请稍后重试');
      }
      if (error.message.includes('429')) {
        return new Error('请求过于频繁，请稍后重试');
      }
      if (error.message.includes('400')) {
        return new Error('请求参数错误，请检查输入内容');
      }
      if (error.message.includes('401') || error.message.includes('403')) {
        return new Error('认证失败，请重新登录');
      }
      if (error.message.includes('404')) {
        return new Error('API服务不存在，请联系技术支持');
      }

      return error;
    }

    return new Error('未知错误，请重试');
  }

  /**
   * 检查服务可用性
   */
  async checkServiceHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 减少到3秒超时

      const response = await fetch(buildApiUrl(endpoints.health), {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      // 在开发环境下，如果是网络错误，不要打印警告，这是正常的
      if (__DEV__) {
        console.log('AI服务连接失败（开发模式）:', error);
      } else {
        console.warn('AI服务健康检查失败:', error);
      }
      return false;
    }
  }

  /**
   * 设置API基础URL（用于测试）
   */
  setBaseUrl(url: string): void {
    // 现在通过 apiConfig 来设置，保持向后兼容性
    console.warn('setBaseUrl 已弃用，请使用 apiConfig 来配置API地址');
  }
}

export default AIReadingService;