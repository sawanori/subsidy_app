'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Play,
  Pause,
  RotateCcw,
  Download,
  FileCheck,
  Shield,
  Package,
  Clock,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';

/**
 * エクスポートバーコンポーネント
 * APP-421: validate→preflight→export 連鎖実行
 */

interface ExportStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  progress?: number;
  duration?: number;
  error?: string;
  warning?: string;
}

interface ExportBarProps {
  applicationId: string;
  documentId?: string;
  onExportComplete?: (result: ExportResult) => void;
  onStepComplete?: (step: string, status: 'success' | 'failed') => void;
}

interface ExportResult {
  success: boolean;
  documentId: string;
  downloadUrl?: string;
  validationReport?: any;
  preflightReport?: any;
  exportedFiles?: ExportedFile[];
  errors?: string[];
  warnings?: string[];
}

interface ExportedFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

export function ExportBar({
  applicationId,
  documentId,
  onExportComplete,
  onStepComplete,
}: ExportBarProps) {
  const [steps, setSteps] = useState<ExportStep[]>([
    {
      id: 'validate',
      name: '検証',
      description: 'フィールド検証と必須項目チェック',
      status: 'pending',
    },
    {
      id: 'preflight',
      name: 'プリフライト',
      description: 'PDF規格チェック（ページ数・フォント・余白）',
      status: 'pending',
    },
    {
      id: 'export',
      name: 'エクスポート',
      description: '最終PDF生成とパッケージング',
      status: 'pending',
    },
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number>(30); // 秒

  /**
   * エクスポート処理開始
   */
  const startExport = async () => {
    setIsRunning(true);
    setIsPaused(false);
    setStartTime(Date.now());
    setExportResult(null);

    try {
      // Step 1: Validation
      await runStep('validate');

      // Step 2: Preflight
      await runStep('preflight');

      // Step 3: Export
      await runStep('export');

      // 完了
      const result: ExportResult = {
        success: true,
        documentId: documentId || `doc-${Date.now()}`,
        downloadUrl: `/api/documents/${documentId}/download`,
        exportedFiles: [
          {
            name: '申請書.pdf',
            url: `/api/documents/${documentId}/download/main.pdf`,
            size: 2048000,
            type: 'application/pdf',
          },
          {
            name: '添付資料.zip',
            url: `/api/documents/${documentId}/download/attachments.zip`,
            size: 5120000,
            type: 'application/zip',
          },
        ],
      };

      setExportResult(result);
      onExportComplete?.(result);
    } catch (error) {
      console.error('Export failed:', error);
      setExportResult({
        success: false,
        documentId: documentId || '',
        errors: [error.message],
      });
    } finally {
      setIsRunning(false);
      setCurrentStep(null);
    }
  };

  /**
   * ステップ実行
   */
  const runStep = async (stepId: string) => {
    setCurrentStep(stepId);
    updateStepStatus(stepId, 'running');

    try {
      // APIコール（実際の実装）
      let response;
      switch (stepId) {
        case 'validate':
          response = await apiClient.post(`/applications/${applicationId}/validate`);
          break;
        case 'preflight':
          response = await apiClient.post(`/documents/${documentId}/preflight`);
          break;
        case 'export':
          response = await apiClient.post(`/applications/${applicationId}/export`, {
            format: 'pdf',
            includeAttachments: true,
          });
          break;
      }

      // 進捗シミュレーション（実際はWebSocketやSSE）
      for (let i = 0; i <= 100; i += 20) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        updateStepProgress(stepId, i);
        if (isPaused) {
          await waitForResume();
        }
      }

      updateStepStatus(stepId, 'success');
      onStepComplete?.(stepId, 'success');
    } catch (error) {
      updateStepStatus(stepId, 'failed', error.message);
      onStepComplete?.(stepId, 'failed');
      throw error;
    }
  };

  /**
   * ステップステータス更新
   */
  const updateStepStatus = (
    stepId: string,
    status: ExportStep['status'],
    error?: string
  ) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === stepId
          ? {
              ...step,
              status,
              error,
              duration:
                status === 'success' || status === 'failed'
                  ? Date.now() - startTime!
                  : step.duration,
            }
          : step
      )
    );
  };

  /**
   * ステップ進捗更新
   */
  const updateStepProgress = (stepId: string, progress: number) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === stepId ? { ...step, progress } : step
      )
    );
  };

  /**
   * 一時停止待機
   */
  const waitForResume = async () => {
    return new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        if (!isPaused) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  };

  /**
   * 一時停止/再開
   */
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  /**
   * リトライ
   */
  const retry = () => {
    setSteps((prev) =>
      prev.map((step) => ({
        ...step,
        status: 'pending',
        progress: undefined,
        error: undefined,
        duration: undefined,
      }))
    );
    startExport();
  };

  /**
   * ステップアイコン取得
   */
  const getStepIcon = (step: ExportStep) => {
    switch (step.status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'skipped':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  /**
   * 全体進捗計算
   */
  const getTotalProgress = () => {
    const completedSteps = steps.filter((s) => s.status === 'success').length;
    const totalSteps = steps.length;
    return Math.round((completedSteps / totalSteps) * 100);
  };

  /**
   * 推定残り時間
   */
  const getEstimatedTimeRemaining = () => {
    if (!isRunning || !startTime) return null;
    const elapsed = (Date.now() - startTime) / 1000;
    const progress = getTotalProgress();
    if (progress === 0) return estimatedTime;
    const total = (elapsed / progress) * 100;
    return Math.max(0, Math.round(total - elapsed));
  };

  const totalProgress = getTotalProgress();
  const timeRemaining = getEstimatedTimeRemaining();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              エクスポート処理
            </CardTitle>
            <CardDescription>
              検証・プリフライト・エクスポートを連続実行します
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {!isRunning && !exportResult && (
              <Button onClick={startExport} className="gap-2">
                <Play className="h-4 w-4" />
                エクスポート開始
              </Button>
            )}
            {isRunning && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePause}
                  className="gap-2"
                >
                  {isPaused ? (
                    <>
                      <Play className="h-4 w-4" />
                      再開
                    </>
                  ) : (
                    <>
                      <Pause className="h-4 w-4" />
                      一時停止
                    </>
                  )}
                </Button>
              </>
            )}
            {exportResult && !exportResult.success && (
              <Button variant="outline" onClick={retry} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                リトライ
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 全体進捗 */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">全体進捗</span>
              <div className="flex items-center gap-2">
                {timeRemaining !== null && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    約{timeRemaining}秒
                  </span>
                )}
                <Badge>{totalProgress}%</Badge>
              </div>
            </div>
            <Progress value={totalProgress} className="h-2" />
            {isPaused && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>処理が一時停止中です</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* ステップリスト */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.id}>
              <div
                className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                  step.status === 'running' ? 'bg-muted' : ''
                }`}
              >
                <div className="mt-0.5">{getStepIcon(step)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{step.name}</span>
                      <span className="ml-2 text-sm text-muted-foreground">
                        {step.description}
                      </span>
                    </div>
                    {step.duration && (
                      <Badge variant="outline" className="text-xs">
                        {(step.duration / 1000).toFixed(1)}秒
                      </Badge>
                    )}
                  </div>
                  {step.status === 'running' && step.progress !== undefined && (
                    <Progress value={step.progress} className="h-2" />
                  )}
                  {step.error && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{step.error}</AlertDescription>
                    </Alert>
                  )}
                  {step.warning && (
                    <Alert className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{step.warning}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="ml-5 h-4 border-l-2 border-muted" />
              )}
            </div>
          ))}
        </div>

        {/* 完了結果 */}
        {exportResult && (
          <>
            <Separator />
            <div className="space-y-3">
              {exportResult.success ? (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    エクスポートが正常に完了しました
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    エクスポートに失敗しました
                    {exportResult.errors?.map((error, i) => (
                      <div key={i} className="mt-1">
                        {error}
                      </div>
                    ))}
                  </AlertDescription>
                </Alert>
              )}

              {/* ダウンロードリンク */}
              {exportResult.exportedFiles && exportResult.exportedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">生成ファイル</h4>
                  {exportResult.exportedFiles.map((file) => (
                    <div
                      key={file.name}
                      className="flex items-center justify-between p-2 border rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{file.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="gap-2"
                      >
                        <a href={file.url} download>
                          <Download className="h-3 w-3" />
                          ダウンロード
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}