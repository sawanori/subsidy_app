'use client';

import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import { SubsidyFormData, PreviewConfig, PreviewState, PreviewUpdateEvent } from '@/types/preview';

interface PreviewContextValue {
  // State
  formData: SubsidyFormData;
  config: PreviewConfig;
  state: PreviewState;
  
  // Actions
  updateFormData: (updates: Partial<SubsidyFormData>) => void;
  updateConfig: (updates: Partial<PreviewConfig>) => void;
  resetForm: () => void;
  generatePreview: () => Promise<void>;
  
  // Utils
  isFormValid: boolean;
  hasUnsavedChanges: boolean;
  previewUrl: string | null;
}

interface PreviewAction {
  type: 'UPDATE_FORM_DATA' | 'UPDATE_CONFIG' | 'SET_STATE' | 'RESET_FORM' | 'SET_PREVIEW_URL';
  payload?: any;
}

interface PreviewContextState {
  formData: SubsidyFormData;
  config: PreviewConfig;
  state: PreviewState;
  previewUrl: string | null;
  initialFormData: SubsidyFormData;
}

const defaultFormData: SubsidyFormData = {
  companyName: '',
  representativeName: '',
  address: '',
  phone: '',
  email: '',
  subsidyType: 'form1',
  projectTitle: '',
  projectDescription: '',
  requestAmount: 0,
  projectPeriod: {
    startDate: '',
    endDate: '',
  },
  budgetBreakdown: [],
  timeline: [],
  lastUpdated: new Date().toISOString(),
  version: 1,
};

const defaultConfig: PreviewConfig = {
  formType: 'form1',
  displayMode: 'pdf',
  showGrid: false,
  showWatermark: true,
  scale: 1.0,
};

const defaultState: PreviewState = {
  isLoading: false,
  error: null,
  lastGenerated: null,
  cacheKey: null,
};

const PreviewContext = createContext<PreviewContextValue | undefined>(undefined);

function previewReducer(state: PreviewContextState, action: PreviewAction): PreviewContextState {
  switch (action.type) {
    case 'UPDATE_FORM_DATA':
      return {
        ...state,
        formData: {
          ...state.formData,
          ...action.payload,
          lastUpdated: new Date().toISOString(),
          version: state.formData.version + 1,
        },
      };
      
    case 'UPDATE_CONFIG':
      return {
        ...state,
        config: {
          ...state.config,
          ...action.payload,
        },
      };
      
    case 'SET_STATE':
      return {
        ...state,
        state: {
          ...state.state,
          ...action.payload,
        },
      };
      
    case 'RESET_FORM':
      return {
        ...state,
        formData: { ...defaultFormData },
        state: { ...defaultState },
        previewUrl: null,
      };
      
    case 'SET_PREVIEW_URL':
      return {
        ...state,
        previewUrl: action.payload,
      };
      
    default:
      return state;
  }
}

export function PreviewProvider({ children }: { children: React.ReactNode }) {
  const initialState: PreviewContextState = {
    formData: { ...defaultFormData },
    config: { ...defaultConfig },
    state: { ...defaultState },
    previewUrl: null,
    initialFormData: { ...defaultFormData },
  };

  const [contextState, dispatch] = useReducer(previewReducer, initialState);

  const updateFormData = useCallback((updates: Partial<SubsidyFormData>) => {
    dispatch({ type: 'UPDATE_FORM_DATA', payload: updates });
  }, []);

  const updateConfig = useCallback((updates: Partial<PreviewConfig>) => {
    dispatch({ type: 'UPDATE_CONFIG', payload: updates });
  }, []);

  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM' });
  }, []);

  const generatePreview = useCallback(async () => {
    dispatch({ type: 'SET_STATE', payload: { isLoading: true, error: null } });
    
    try {
      // シミュレートされたプレビュー生成
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 実際の実装では、ここでPDF生成APIを呼び出し
      const mockPreviewUrl = `/api/preview/${contextState.formData.version}`;
      
      dispatch({ type: 'SET_PREVIEW_URL', payload: mockPreviewUrl });
      dispatch({
        type: 'SET_STATE',
        payload: {
          isLoading: false,
          lastGenerated: new Date().toISOString(),
          cacheKey: `preview_${contextState.formData.version}`,
        },
      });
    } catch (error) {
      dispatch({
        type: 'SET_STATE',
        payload: {
          isLoading: false,
          error: error instanceof Error ? error.message : '予期しないエラーが発生しました',
        },
      });
    }
  }, [contextState.formData.version]);

  const isFormValid = useMemo(() => {
    const { companyName, representativeName, projectTitle, requestAmount } = contextState.formData;
    return !!(companyName && representativeName && projectTitle && requestAmount > 0);
  }, [contextState.formData]);

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(contextState.formData) !== JSON.stringify(contextState.initialFormData);
  }, [contextState.formData, contextState.initialFormData]);

  const value: PreviewContextValue = {
    formData: contextState.formData,
    config: contextState.config,
    state: contextState.state,
    updateFormData,
    updateConfig,
    resetForm,
    generatePreview,
    isFormValid,
    hasUnsavedChanges,
    previewUrl: contextState.previewUrl,
  };

  return (
    <PreviewContext.Provider value={value}>
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreview() {
  const context = useContext(PreviewContext);
  if (context === undefined) {
    throw new Error('usePreview must be used within a PreviewProvider');
  }
  return context;
}

// デバウンス付きプレビュー更新フック
export function usePreviewAutoUpdate(delay = 1000) {
  const { formData, generatePreview, state } = usePreview();
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    if (!state.isLoading) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        generatePreview();
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [formData, generatePreview, state.isLoading, delay]);

  return state;
}