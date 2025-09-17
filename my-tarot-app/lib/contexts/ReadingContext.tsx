import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReadingService } from '../services/ReadingService';

export interface SelectedCard {
  cardId: number;
  name: string;
  imageUrl: string;
  position: 'past' | 'present' | 'future';
  dimension: DimensionData;
  direction: 'upright' | 'reversed';
  revealed: boolean;
  basicSummary?: string;
}

export interface DimensionData {
  id: number;
  name: string;
  category: string;
  description: string;
  aspect: string;
  aspect_type: number;
}

export interface ReadingFlowState {
  step: number;
  type: 'offline';
  category: string;
  // 选中的维度列表（由步骤2选择的类别映射得到，用于后续匹配）
  dimensions: DimensionData[];
  selectedCards: SelectedCard[];
  interpretations: any[];
  createdAt: Date;
  isLoading: boolean;
  error: string | null;
}

interface ReadingContextType {
  state: ReadingFlowState;
  updateStep: (step: number) => void;
  updateCategory: (category: string) => void;
  updateDimensions: (dimensions: DimensionData[]) => void;
  updateCards: (cards: SelectedCard[]) => void;
  resetFlow: () => void;
  saveToHistory: () => Promise<number>;
  restoreState: () => Promise<void>;
}

const initialState: ReadingFlowState = {
  step: 1,
  type: 'offline',
  category: '',
  dimensions: [],
  selectedCards: [],
  interpretations: [],
  createdAt: new Date(),
  isLoading: false,
  error: null,
};

type ReadingAction =
  | { type: 'UPDATE_STEP'; payload: number }
  | { type: 'UPDATE_CATEGORY'; payload: string }
  | { type: 'UPDATE_DIMENSIONS'; payload: DimensionData[] }
  | { type: 'UPDATE_CARDS'; payload: SelectedCard[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_STATE' }
  | { type: 'RESTORE_STATE'; payload: ReadingFlowState };

function readingReducer(state: ReadingFlowState, action: ReadingAction): ReadingFlowState {
  switch (action.type) {
    case 'UPDATE_STEP':
      return { ...state, step: action.payload };
    case 'UPDATE_CATEGORY':
      return { ...state, category: action.payload };
    case 'UPDATE_CARDS':
      return { ...state, selectedCards: action.payload };
    case 'UPDATE_DIMENSIONS':
      return { ...state, dimensions: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET_STATE':
      return { ...initialState, createdAt: new Date() };
    case 'RESTORE_STATE':
      return { ...action.payload, createdAt: new Date(action.payload.createdAt) };
    default:
      return state;
  }
}

const ReadingContext = createContext<ReadingContextType | undefined>(undefined);

export function ReadingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(readingReducer, initialState);

  const updateStep = useCallback((step: number) => {
    dispatch({ type: 'UPDATE_STEP', payload: step });
  }, []);

  const updateCategory = useCallback((category: string) => {
    dispatch({ type: 'UPDATE_CATEGORY', payload: category });
  }, []);

  const updateCards = useCallback((cards: SelectedCard[]) => {
    dispatch({ type: 'UPDATE_CARDS', payload: cards });
  }, []);

  const updateDimensions = useCallback((dimensions: DimensionData[]) => {
    dispatch({ type: 'UPDATE_DIMENSIONS', payload: dimensions });
  }, []);

  const resetFlow = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
    AsyncStorage.removeItem('reading_state');
  }, []);

  const saveToHistory = useCallback(async () => {
    try {
      console.log('开始保存占卜记录到历史...');

      const readingService = ReadingService.getInstance();
      const result = await readingService.saveReadingFromState(state);

      if (result.success) {
        console.log('占卜记录保存成功，ID:', result.data);
        return result.data; // 返回保存的记录ID
      } else {
        const errorMessage = result.error || '保存失败，原因未知';
        console.error('保存占卜记录失败:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '保存占卜记录时出现未知错误';
      console.error('保存占卜记录时出错:', errorMessage);
      throw new Error(errorMessage);
    }
  }, [state]);

  const restoreState = useCallback(async () => {
    try {
      const savedState = await AsyncStorage.getItem('reading_state');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        dispatch({ type: 'RESTORE_STATE', payload: parsedState });
      }
    } catch (error) {
      console.error('Failed to restore reading state:', error);
    }
  }, []);

  // 状态变化时自动保存
  useEffect(() => {
    AsyncStorage.setItem('reading_state', JSON.stringify(state));
  }, [state]);

  // 应用启动时恢复状态
  useEffect(() => {
    restoreState();
  }, [restoreState]);

  const value: ReadingContextType = {
    state,
    updateStep,
    updateCategory,
    updateDimensions,
    updateCards,
    resetFlow,
    saveToHistory,
    restoreState,
  };

  return <ReadingContext.Provider value={value}>{children}</ReadingContext.Provider>;
}

export function useReadingFlow() {
  const context = useContext(ReadingContext);
  if (context === undefined) {
    throw new Error('useReadingFlow must be used within a ReadingProvider');
  }
  return context;
}