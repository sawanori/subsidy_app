'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { ValidationResultDisplay, ValidationResult } from './ValidationResultDisplay';

/**
 * ValidationPanel - 検証実行パネル
 *
 * Phase 4: 検証実行とリアルタイム結果表示
 */

interface ValidationPanelProps {
  draftId: string;
  schemeId: string;
  onValidationComplete?: (result: ValidationResult) => void;
  autoValidate?: boolean;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  draftId,
  schemeId,
  onValidationComplete,
  autoValidate = false
}) => {
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (autoValidate && draftId && schemeId) {
      runValidation();
    }
  }, [draftId, schemeId, autoValidate]);

  const runValidation = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/validate/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId, schemeId }),
      });

      if (!response.ok) {
        throw new Error('検証に失敗しました');
      }

      const validationResult: ValidationResult = await response.json();
      setResult(validationResult);

      if (onValidationComplete) {
        onValidationComplete(validationResult);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 検証実行ヘッダー */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>草案検証</CardTitle>
              <CardDescription>
                4階層の検証を実行します（フィールド / ビジネスルール / 整合性 / 統計）
              </CardDescription>
            </div>
            <Button
              onClick={runValidation}
              disabled={loading}
              size="lg"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? '検証中...' : '検証実行'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* エラー表示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ローディング */}
      {loading && (
        <div className="space-y-4">
          <Skeleton className="w-full h-[200px]" />
          <Skeleton className="w-full h-[150px]" />
          <Skeleton className="w-full h-[150px]" />
        </div>
      )}

      {/* 検証結果表示 */}
      {!loading && result && <ValidationResultDisplay result={result} />}

      {/* 初期状態 */}
      {!loading && !result && !error && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>「検証実行」ボタンをクリックして草案を検証してください</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};