import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AuthService from '../services/AuthService';
import AIReadingService from '../services/AIReadingService';
import { DatabaseConnectionManager } from '../database/connection';

interface AppState {
  isDatabaseInitialized: boolean;
  isInitializingDatabase: boolean;
  databaseError: string | null;

  isAIServiceAvailable: boolean;
  isCheckingAIService: boolean;
  aiServiceError: string | null;

  isAuthenticated: boolean;
  isAuthenticating: boolean;
  authError: string | null;
  userToken: string | null;
  userId: string | null;

  isAppInitialized: boolean;
  initializationError: string | null;
}

interface AppContextType {
  state: AppState;
  actions: {
    initializeApp: () => Promise<void>;
    refreshAIServiceStatus: () => Promise<void>;
    refreshAuthStatus: () => Promise<void>;
  };
}

const defaultState: AppState = {
  isDatabaseInitialized: false,
  isInitializingDatabase: true,
  databaseError: null,

  isAIServiceAvailable: false,
  isCheckingAIService: true,
  aiServiceError: null,

  isAuthenticated: false,
  isAuthenticating: true,
  authError: null,
  userToken: null,
  userId: null,

  isAppInitialized: false,
  initializationError: null,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, setState] = useState<AppState>(defaultState);

  const initializeApp = async () => {
    console.log('🚀 Starting app initialization (DEBUG MODE - Database Only)...');

    try {
      setState(prev => ({
        ...prev,
        isInitializingDatabase: true,
        isCheckingAIService: false, // 调试模式：跳过AI服务检查
        isAuthenticating: false, // 调试模式：跳过认证
      }));

      // 1. 初始化数据库（必须最先完成）
      console.log('🗄️ Initializing database...');
      const connectionManager = DatabaseConnectionManager.getInstance();
      const dbResult = await connectionManager.initialize();

      if (!dbResult.success) {
        throw new Error(`Database initialization failed: ${dbResult.error}`);
      }

      console.log('✅ Database initialized successfully');

      // 🔧 调试模式：临时注释掉 AI服务检查和认证
      // // 2. 检查AI服务健康状态
      // console.log('🔍 Checking AI service health...');
      // const aiService = AIReadingService.getInstance();
      // const isAIHealthy = await aiService.checkServiceHealth();

      // // 3. 初始化匿名用户认证
      // console.log('👤 Initializing anonymous user...');
      // const authService = AuthService.getInstance();
      // const authSuccess = await authService.initializeUser();
      // const token = await authService.getToken();

      setState(prev => ({
        ...prev,
        isDatabaseInitialized: true,
        isInitializingDatabase: false,
        databaseError: null,

        // 🔧 调试模式：AI服务和认证状态设为默认值
        isAIServiceAvailable: false,
        isCheckingAIService: false,
        aiServiceError: 'Disabled in debug mode',

        isAuthenticated: false,
        isAuthenticating: false,
        authError: 'Disabled in debug mode',
        userToken: null,

        isAppInitialized: true,
        initializationError: null,
      }));

      console.log('✅ App initialization completed (DEBUG MODE)', {
        database: '✅',
        aiService: '🔧 Disabled',
        auth: '🔧 Disabled',
      });
    } catch (error) {
      console.error('❌ App initialization error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      setState(prev => ({
        ...prev,
        isDatabaseInitialized: false,
        isInitializingDatabase: false,
        databaseError: errorMessage,

        isCheckingAIService: false,
        isAuthenticating: false,
        isAppInitialized: true,
        initializationError: errorMessage,
      }));
    }
  };

  const refreshAIServiceStatus = async () => {
    console.log('🔄 Refreshing AI service status...');
    setState(prev => ({ ...prev, isCheckingAIService: true }));

    try {
      const aiService = AIReadingService.getInstance();
      const isAIHealthy = await aiService.checkServiceHealth();

      setState(prev => ({
        ...prev,
        isAIServiceAvailable: isAIHealthy,
        isCheckingAIService: false,
        aiServiceError: isAIHealthy ? null : 'AI service is unavailable',
      }));

      console.log('✅ AI service status refreshed:', isAIHealthy);
    } catch (error) {
      console.error('❌ Failed to refresh AI service status:', error);
      setState(prev => ({
        ...prev,
        isAIServiceAvailable: false,
        isCheckingAIService: false,
        aiServiceError: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  };

  const refreshAuthStatus = async () => {
    console.log('🔄 Refreshing auth status...');
    setState(prev => ({ ...prev, isAuthenticating: true }));

    try {
      const authService = AuthService.getInstance();
      const authSuccess = await authService.initializeUser();
      const token = await authService.getToken();

      setState(prev => ({
        ...prev,
        isAuthenticated: authSuccess,
        isAuthenticating: false,
        authError: authSuccess ? null : 'Authentication failed',
        userToken: token,
      }));

      console.log('✅ Auth status refreshed:', authSuccess);
    } catch (error) {
      console.error('❌ Failed to refresh auth status:', error);
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        isAuthenticating: false,
        authError: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  };

  const contextValue: AppContextType = {
    state,
    actions: {
      initializeApp,
      refreshAIServiceStatus,
      refreshAuthStatus,
    },
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export default AppContext;