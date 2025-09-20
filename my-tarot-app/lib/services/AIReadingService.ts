/**
 * AI塔罗牌解读服务
 * 负责与后端AI解读API的交互
 */

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
  private baseUrl: string;

  private constructor() {
    // 后端API地址，开发环境使用本地地址
    // Expo 环境需要使用电脑的实际IP地址，不能使用localhost
    let devUrl: string;

    if (__DEV__) {
      // Expo 环境使用电脑的实际IP地址
      devUrl = 'http://192.168.71.3:8001';

      // 备用选项（如果上面的IP不工作，可以尝试其他地址）：
      // devUrl = 'http://localhost:8001';    // 仅适用于iOS模拟器
      // devUrl = 'http://10.0.2.2:8001';    // 仅适用于Android模拟器
    } else {
      devUrl = 'https://your-production-api.com';
    }

    this.baseUrl = devUrl;
    console.log('AI Service Base URL:', this.baseUrl);
  }

  static getInstance(): AIReadingService {
    if (!AIReadingService.instance) {
      AIReadingService.instance = new AIReadingService();
    }
    return AIReadingService.instance;
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

      const response = await fetch(`${this.baseUrl}/api/v1/readings/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(request),
      });

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
      console.log('调用AI解读生成接口:', {
        cardsCount: cards.length,
        dimensionsCount: dimensions.length,
        description,
        spreadType
      });

      const request: GenerateRequest = {
        cards,
        dimensions,
        description,
        spread_type: spreadType
      };

      const response = await fetch(`${this.baseUrl}/api/v1/readings/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API请求失败: ${response.status} - ${errorText}`);
      }

      const result: GenerateResponse = await response.json();
      console.log('AI解读生成结果:', result);

      return result;
    } catch (error) {
      console.error('AI解读生成请求失败:', error);
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

      const response = await fetch(`${this.baseUrl}/health`, {
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
    this.baseUrl = url;
  }
}

export default AIReadingService;