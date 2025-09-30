/**
 * API配置文件
 * 统一管理所有API相关的配置
 */

import { Platform } from 'react-native';

interface ApiConfig {
  baseUrl: string;
  timeout: number;
}

// 开发环境配置
const developmentConfig: ApiConfig = {
  // Expo 环境需要使用电脑的实际IP地址，不能使用localhost
  // 修改这里的IP地址为你的电脑IP
  baseUrl: 'http://192.168.71.6:8001',
  timeout: 10000, // 10秒超时
};

// 生产环境配置
const productionConfig: ApiConfig = {
  baseUrl: 'https://your-production-api.com',
  timeout: 15000, // 15秒超时
};

// 根据环境选择配置
export const apiConfig: ApiConfig = __DEV__ ? developmentConfig : productionConfig;

// 常用的API端点
export const endpoints = {
  // 认证相关
  auth: {
    register: '/api/v1/users/register',
  },
  // AI解读相关
  readings: {
    analyze: '/api/v1/readings/analyze',
    generate: '/api/v1/readings/generate',
  },
  // 健康检查
  health: '/health',
  // 支付相关
  payments: {
    checkout: '/api/v1/payments/checkout',
  },
} as const;

// 辅助函数：构建完整的API URL
export const buildApiUrl = (endpoint: string): string => {
  return `${apiConfig.baseUrl}${endpoint}`;
};

// 辅助函数：获取请求配置
export const getRequestConfig = (options: RequestInit = {}): RequestInit => {
  return {
    timeout: apiConfig.timeout,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
    ...options,
  };
};

// 初始化API配置（简化版本，不依赖额外的包）
export const initializeApiConfig = async (): Promise<void> => {
  console.log('🌐 API配置初始化完成，使用地址:', apiConfig.baseUrl);
  console.log('💡 如需修改IP地址，请编辑 lib/config/api.ts 文件中的 developmentConfig.baseUrl');
};