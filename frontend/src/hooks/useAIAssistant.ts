import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export type AIFeature = 
  | 'analyze-issues'
  | 'suggest-solutions'
  | 'elaborate-plan'
  | 'suggest-kpis'
  | 'analyze-risks'
  | 'analyze-market'
  | 'generate-gantt'
  | 'generate-summary';

interface AIResponse {
  content: any;
  type: 'text' | 'json' | 'markdown';
  category: string;
  tokensUsed: number;
  confidence?: number;
  metadata?: Record<string, any>;
}

interface UseAIAssistantOptions {
  onSuccess?: (response: AIResponse) => void;
  onError?: (error: Error) => void;
}

export function useAIAssistant(options?: UseAIAssistantOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const callAI = useCallback(async (
    feature: AIFeature,
    data: any
  ): Promise<AIResponse | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const endpoint = `${apiUrl}/api/ai-assistant/${feature}`;
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(`AI request failed: ${res.statusText}`);
      }

      const aiResponse: AIResponse = await res.json();
      setResponse(aiResponse);
      
      if (options?.onSuccess) {
        options.onSuccess(aiResponse);
      }
      
      toast.success('AI分析が完了しました');
      return aiResponse;
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      if (options?.onError) {
        options.onError(error);
      }
      
      toast.error('AI分析に失敗しました: ' + error.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  // 課題分析
  const analyzeIssues = useCallback(async (
    businessDescription: string,
    painPoints: string,
    businessType?: string
  ) => {
    return callAI('analyze-issues', {
      businessDescription,
      painPoints,
      businessType,
    });
  }, [callAI]);

  // 解決策提案
  const suggestSolutions = useCallback(async (
    currentIssues: any[],
    businessType: string,
    maxAmount: number,
    implementationPeriod: string
  ) => {
    return callAI('suggest-solutions', {
      currentIssues,
      businessType,
      maxAmount,
      implementationPeriod,
    });
  }, [callAI]);

  // 5W1H詳細化
  const elaboratePlan = useCallback(async (
    planSummary: string,
    targetIssue: string
  ) => {
    return callAI('elaborate-plan', {
      planSummary,
      targetIssue,
    });
  }, [callAI]);

  // KPI提案
  const suggestKPIs = useCallback(async (
    businessPlan: string,
    expectedEffects: string
  ) => {
    return callAI('suggest-kpis', {
      businessPlan,
      expectedEffects,
    });
  }, [callAI]);

  // リスク分析
  const analyzeRisks = useCallback(async (
    businessPlan: string,
    implementationDetails: string
  ) => {
    return callAI('analyze-risks', {
      businessPlan,
      implementationDetails,
    });
  }, [callAI]);

  // 市場分析
  const analyzeMarket = useCallback(async (
    businessDescription: string,
    targetCustomer: string,
    region?: string
  ) => {
    return callAI('analyze-market', {
      businessDescription,
      targetCustomer,
      region,
    });
  }, [callAI]);

  // ガントチャート生成
  const generateGantt = useCallback(async (
    businessPlan: string,
    implementationPeriod: string,
    mainActivities: string[]
  ) => {
    return callAI('generate-gantt', {
      businessPlan,
      implementationPeriod,
      mainActivities,
    });
  }, [callAI]);

  // 申請書サマリー生成
  const generateSummary = useCallback(async (
    companyInfo: any,
    currentIssues: any[],
    solutions: string,
    expectedEffects: string,
    requestedAmount: number
  ) => {
    return callAI('generate-summary', {
      companyInfo,
      currentIssues,
      solutions,
      expectedEffects,
      requestedAmount,
    });
  }, [callAI]);

  return {
    isLoading,
    response,
    error,
    analyzeIssues,
    suggestSolutions,
    elaboratePlan,
    suggestKPIs,
    analyzeRisks,
    analyzeMarket,
    generateGantt,
    generateSummary,
  };
}