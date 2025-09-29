import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AuthService from '../services/AuthService';
import AIReadingService from '../services/AIReadingService';

interface AppState {
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
    console.log('🚀 Starting app initialization...');

    try {
      setState(prev => ({
        ...prev,
        isCheckingAIService: true,
        isAuthenticating: true,
      }));

      console.log('🔍 Checking AI service health...');
      const aiService = AIReadingService.getInstance();
      const isAIHealthy = await aiService.checkServiceHealth();

      console.log('👤 Initializing anonymous user...');
      const authService = AuthService.getInstance();
      const authSuccess = await authService.initializeUser();

      const token = await authService.getToken();

      setState(prev => ({
        ...prev,
        isAIServiceAvailable: isAIHealthy,
        isCheckingAIService: false,
        aiServiceError: isAIHealthy ? null : 'AI service is unavailable',

        isAuthenticated: authSuccess,
        isAuthenticating: false,
        authError: authSuccess ? null : 'Authentication failed',
        userToken: token,

        isAppInitialized: true,
        initializationError: null,
      }));

      console.log('✅ App initialization completed', {
        aiService: isAIHealthy ? '✅' : '❌',
        auth: authSuccess ? '✅' : '❌',
      });
    } catch (error) {
      console.error('❌ App initialization error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      setState(prev => ({
        ...prev,
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