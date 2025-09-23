'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Sparkles, Loader2 } from 'lucide-react';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';

interface AIAssistantButtonProps {
  feature: 'issues' | 'solutions' | 'kpis' | 'risks' | 'market';
  data: any;
  onApply?: (result: any) => void;
  buttonText?: string;
  dialogTitle?: string;
  dialogDescription?: string;
}

export function AIAssistantButton({
  feature,
  data,
  onApply,
  buttonText = 'AI提案',
  dialogTitle = 'AI アシスタント',
  dialogDescription = 'AIが分析・提案を行います',
}: AIAssistantButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState<any>(null);
  const ai = useAIAssistant({
    onSuccess: (response) => {
      setResult(response);
    },
  });

  const handleAnalyze = async () => {
    switch (feature) {
      case 'issues':
        await ai.analyzeIssues(
          data.businessDescription,
          data.painPoints,
          data.businessType
        );
        break;
      case 'solutions':
        await ai.suggestSolutions(
          data.currentIssues,
          data.businessType,
          data.maxAmount,
          data.implementationPeriod
        );
        break;
      case 'kpis':
        await ai.suggestKPIs(
          data.businessPlan,
          data.expectedEffects
        );
        break;
      case 'risks':
        await ai.analyzeRisks(
          data.businessPlan,
          data.implementationDetails
        );
        break;
      case 'market':
        await ai.analyzeMarket(
          data.businessDescription,
          data.targetCustomer,
          data.region
        );
        break;
    }
  };

  const handleApply = () => {
    if (result && onApply) {
      onApply(result.content);
      setIsOpen(false);
    }
  };

  const renderContent = () => {
    if (!result) return null;

    if (result.type === 'markdown') {
      return (
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown>{result.content}</ReactMarkdown>
        </div>
      );
    }

    if (result.type === 'json') {
      return (
        <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
          {JSON.stringify(result.content, null, 2)}
        </pre>
      );
    }

    return <p className="whitespace-pre-wrap">{result.content}</p>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="h-4 w-4 mr-2" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {!result && !ai.isLoading && (
            <div className="text-center py-8">
              <Button onClick={handleAnalyze} disabled={ai.isLoading}>
                {ai.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    AI分析を開始
                  </>
                )}
              </Button>
            </div>
          )}

          {ai.isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3">AIが分析しています...</span>
            </div>
          )}

          {result && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">分析結果</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {result.tokensUsed} トークン使用
                    </Badge>
                    {result.confidence && (
                      <Badge variant="secondary">
                        信頼度: {(result.confidence * 100).toFixed(0)}%
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {renderContent()}
                
                {onApply && (
                  <div className="mt-4 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setResult(null)}>
                      再分析
                    </Button>
                    <Button onClick={handleApply}>
                      この内容を適用
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {ai.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">エラー: {ai.error.message}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}