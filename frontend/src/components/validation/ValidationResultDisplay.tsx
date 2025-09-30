'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  FileText,
  TrendingUp
} from 'lucide-react';

/**
 * ValidationResultDisplay - 検証結果表示コンポーネント
 *
 * Phase 4: エラー、警告、提案、統計情報を可視化
 */

export interface ValidationError {
  code: string;
  message: string;
  field: string;
  severity: 'error' | 'warning' | 'info';
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  suggestions: string[];
  stats: {
    chars: number;
    words: number;
    sectionsCompleted: number;
    totalSections: number;
  };
}

interface ValidationResultDisplayProps {
  result: ValidationResult;
  onFixError?: (error: ValidationError) => void;
}

export const ValidationResultDisplay: React.FC<ValidationResultDisplayProps> = ({
  result,
  onFixError
}) => {
  const completionPercentage = (result.stats.sectionsCompleted / result.stats.totalSections) * 100;

  return (
    <div className="space-y-6">
      {/* 総合結果 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>検証結果</CardTitle>
              <CardDescription>草案の品質チェック</CardDescription>
            </div>
            <Badge
              variant={result.isValid ? "default" : "destructive"}
              className="text-lg px-4 py-2"
            >
              {result.isValid ? (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  検証合格
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 mr-2" />
                  要修正
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">エラー</div>
              <div className="text-2xl font-bold text-destructive">
                {result.errors.length}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">警告</div>
              <div className="text-2xl font-bold text-yellow-600">
                {result.warnings.length}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">提案</div>
              <div className="text-2xl font-bold text-blue-600">
                {result.suggestions.length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 統計情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            統計情報
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">セクション完成度</span>
              <span className="text-sm text-muted-foreground">
                {result.stats.sectionsCompleted} / {result.stats.totalSections}
              </span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            <div className="text-xs text-muted-foreground mt-1">
              {completionPercentage.toFixed(0)}% 完了
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">文字数</div>
              <div className="text-lg font-semibold">
                {result.stats.chars.toLocaleString()}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">単語数</div>
              <div className="text-lg font-semibold">
                {result.stats.words.toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* エラー一覧 */}
      {result.errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              エラー ({result.errors.length})
            </CardTitle>
            <CardDescription>修正が必要な項目</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.errors.map((error, index) => (
                <Alert key={index} variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="flex items-center justify-between">
                    <span>{error.field}</span>
                    <Badge variant="outline">{error.code}</Badge>
                  </AlertTitle>
                  <AlertDescription className="mt-2">
                    {error.message}
                    {error.value !== undefined && (
                      <div className="text-xs mt-1 opacity-80">
                        現在値: {JSON.stringify(error.value)}
                      </div>
                    )}
                  </AlertDescription>
                  {onFixError && (
                    <button
                      onClick={() => onFixError(error)}
                      className="mt-2 text-sm underline hover:no-underline"
                    >
                      修正する →
                    </button>
                  )}
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 警告一覧 */}
      {result.warnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
              警告 ({result.warnings.length})
            </CardTitle>
            <CardDescription>確認を推奨する項目</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.warnings.map((warning, index) => (
                <Alert key={index} className="border-yellow-600/50 bg-yellow-50 dark:bg-yellow-950">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertTitle className="flex items-center justify-between text-yellow-600">
                    <span>{warning.field}</span>
                    <Badge variant="outline" className="border-yellow-600 text-yellow-600">
                      {warning.code}
                    </Badge>
                  </AlertTitle>
                  <AlertDescription className="mt-2 text-yellow-900 dark:text-yellow-100">
                    {warning.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 提案一覧 */}
      {result.suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Info className="h-5 w-5" />
              改善提案 ({result.suggestions.length})
            </CardTitle>
            <CardDescription>品質向上のための推奨事項</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                  <span className="text-sm">{suggestion}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 検証合格メッセージ */}
      {result.isValid && result.errors.length === 0 && result.warnings.length === 0 && (
        <Alert className="border-green-600 bg-green-50 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-600">検証合格</AlertTitle>
          <AlertDescription className="text-green-900 dark:text-green-100">
            すべての検証項目をクリアしました。PDF生成に進めます。
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};