'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  GitCompare,
  ShieldCheck,
  FileWarning,
  AlertCircle,
} from 'lucide-react';
import { PdfPreviewWithHighlights } from './pdf-preview-with-highlights';
import { PreflightBadges } from './preflight-badges';

/**
 * プレビュータブコンポーネント
 * APP-409: プレビュー/検証レポ/差分
 */

interface ValidationIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  field: string;
  message: string;
  suggestion?: string;
  page?: number;
  line?: number;
}

interface PreflightResult {
  passed: boolean;
  errors: PreflightError[];
  warnings: PreflightWarning[];
  metadata: PreflightMetadata;
}

interface PreflightError {
  code: string;
  message: string;
  details?: any;
}

interface PreflightWarning {
  code: string;
  message: string;
  details?: any;
}

interface PreflightMetadata {
  pageCount: number;
  hasEmbeddedFonts: boolean;
  hasMargins: boolean;
  hasStampSpace: boolean;
}

interface DiffItem {
  field: string;
  oldValue: string;
  newValue: string;
  type: 'added' | 'removed' | 'changed';
}

interface PreviewTabsProps {
  pdfUrl?: string;
  validationResult?: {
    issues: ValidationIssue[];
    score: number;
    passed: boolean;
  };
  preflightResult?: PreflightResult;
  diffs?: DiffItem[];
  extractedFields?: any[];
}

export function PreviewTabs({
  pdfUrl,
  validationResult,
  preflightResult,
  diffs = [],
  extractedFields = [],
}: PreviewTabsProps) {
  const [activeTab, setActiveTab] = useState('preview');

  const getIssueIcon = (type: ValidationIssue['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
    }
  };

  const getDiffIcon = (type: DiffItem['type']) => {
    switch (type) {
      case 'added':
        return <span className="text-green-600">+</span>;
      case 'removed':
        return <span className="text-red-600">-</span>;
      case 'changed':
        return <span className="text-yellow-600">~</span>;
    }
  };

  const getValidationSummary = () => {
    if (!validationResult) return null;

    const errorCount = validationResult.issues.filter((i) => i.type === 'error').length;
    const warningCount = validationResult.issues.filter((i) => i.type === 'warning').length;
    const infoCount = validationResult.issues.filter((i) => i.type === 'info').length;

    return (
      <div className="flex items-center gap-2">
        {errorCount > 0 && (
          <Badge variant="destructive">
            {errorCount} エラー
          </Badge>
        )}
        {warningCount > 0 && (
          <Badge variant="secondary">
            {warningCount} 警告
          </Badge>
        )}
        {infoCount > 0 && (
          <Badge variant="outline">
            {infoCount} 情報
          </Badge>
        )}
        <span className="text-sm text-muted-foreground">
          スコア: {validationResult.score}/100
        </span>
      </div>
    );
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="preview" className="gap-2">
          <FileText className="h-4 w-4" />
          プレビュー
        </TabsTrigger>
        <TabsTrigger value="validation" className="gap-2">
          <ShieldCheck className="h-4 w-4" />
          検証レポート
          {validationResult && !validationResult.passed && (
            <Badge variant="destructive" className="ml-1">
              !
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="diff" className="gap-2">
          <GitCompare className="h-4 w-4" />
          差分
          {diffs.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {diffs.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="preview" className="mt-4">
        {pdfUrl ? (
          <div className="space-y-4">
            {/* プリフライトバッジ */}
            {preflightResult && (
              <PreflightBadges preflightResult={preflightResult} />
            )}
            {/* PDFプレビュー */}
            <PdfPreviewWithHighlights
              pdfUrl={pdfUrl}
              extractedFields={extractedFields}
            />
          </div>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-96">
              <div className="text-center text-muted-foreground">
                <FileWarning className="h-12 w-12 mx-auto mb-4" />
                <p>プレビューを生成してください</p>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="validation" className="mt-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                検証結果
              </CardTitle>
              {getValidationSummary()}
            </div>
          </CardHeader>
          <CardContent>
            {validationResult ? (
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {validationResult.issues.map((issue) => (
                    <Alert
                      key={issue.id}
                      variant={issue.type === 'error' ? 'destructive' : 'default'}
                    >
                      <div className="flex items-start gap-2">
                        {getIssueIcon(issue.type)}
                        <div className="flex-1">
                          <AlertDescription>
                            <div className="font-medium mb-1">
                              [{issue.field}] {issue.message}
                            </div>
                            {issue.suggestion && (
                              <div className="text-sm text-muted-foreground mt-1">
                                提案: {issue.suggestion}
                              </div>
                            )}
                            {(issue.page || issue.line) && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {issue.page && `ページ ${issue.page}`}
                                {issue.line && ` 行 ${issue.line}`}
                              </div>
                            )}
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  ))}

                  {validationResult.issues.length === 0 && (
                    <Alert>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription>
                        すべての検証チェックに合格しました。
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center h-96 text-muted-foreground">
                検証を実行してください
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="diff" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              変更履歴
            </CardTitle>
          </CardHeader>
          <CardContent>
            {diffs.length > 0 ? (
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {diffs.map((diff, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">
                          {getDiffIcon(diff.type)}
                        </span>
                        <span className="font-medium">{diff.field}</span>
                        <Badge
                          variant={
                            diff.type === 'added'
                              ? 'default'
                              : diff.type === 'removed'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {diff.type === 'added' && '追加'}
                          {diff.type === 'removed' && '削除'}
                          {diff.type === 'changed' && '変更'}
                        </Badge>
                      </div>

                      {diff.type === 'changed' && (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded">
                            <span className="text-red-600 dark:text-red-400">前:</span>
                            <div className="mt-1 text-muted-foreground">
                              {diff.oldValue || '(空)'}
                            </div>
                          </div>
                          <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded">
                            <span className="text-green-600 dark:text-green-400">後:</span>
                            <div className="mt-1">
                              {diff.newValue || '(空)'}
                            </div>
                          </div>
                        </div>
                      )}

                      {diff.type === 'added' && (
                        <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded text-sm">
                          {diff.newValue}
                        </div>
                      )}

                      {diff.type === 'removed' && (
                        <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded text-sm line-through">
                          {diff.oldValue}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center h-96 text-muted-foreground">
                変更履歴がありません
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}