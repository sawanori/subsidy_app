'use client';

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import {
  AlertCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Copy,
  Bug,
  Shield,
  Database,
  Network,
  FileWarning,
  Clock,
  DollarSign,
  Info,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';

/**
 * エラー表示コンポーネント
 * APP-423: エラーコード表とトースト/再試行UI
 */

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  jobId?: string;
  retryable?: boolean;
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  suggestion?: string;
}

type ErrorCategory =
  | 'validation'
  | 'network'
  | 'database'
  | 'security'
  | 'file'
  | 'rate-limit'
  | 'cost'
  | 'system';

type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info';

interface ErrorDisplayProps {
  errors?: AppError[];
  onRetry?: (error: AppError) => void;
  onClear?: () => void;
  showToast?: boolean;
  compact?: boolean;
}

/**
 * エラーコードマッピング
 */
const ERROR_CODES: Record<string, {
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  suggestion: string;
}> = {
  // Validation Errors
  'ERR_VALIDATION_REQUIRED': {
    category: 'validation',
    severity: 'error',
    message: '必須フィールドが入力されていません',
    suggestion: '赤色でハイライトされた項目を入力してください',
  },
  'ERR_VALIDATION_FORMAT': {
    category: 'validation',
    severity: 'error',
    message: 'フォーマットが正しくありません',
    suggestion: '指定された形式で入力してください',
  },
  'ERR_VALIDATION_LENGTH': {
    category: 'validation',
    severity: 'error',
    message: '文字数制限を超えています',
    suggestion: '文字数を調整してください',
  },

  // Network Errors
  'ERR_NETWORK_TIMEOUT': {
    category: 'network',
    severity: 'error',
    message: 'リクエストがタイムアウトしました',
    suggestion: 'ネットワーク接続を確認して再試行してください',
  },
  'ERR_NETWORK_OFFLINE': {
    category: 'network',
    severity: 'critical',
    message: 'オフライン状態です',
    suggestion: 'インターネット接続を確認してください',
  },

  // Database Errors
  'ERR_DB_CONNECTION': {
    category: 'database',
    severity: 'critical',
    message: 'データベース接続エラー',
    suggestion: 'しばらく待ってから再試行してください',
  },
  'ERR_DB_CONSTRAINT': {
    category: 'database',
    severity: 'error',
    message: 'データ整合性エラー',
    suggestion: '入力内容を確認してください',
  },

  // Security Errors
  'ERR_SECURITY_AUTH': {
    category: 'security',
    severity: 'critical',
    message: '認証エラー',
    suggestion: 'ログインし直してください',
  },
  'ERR_SECURITY_PERMISSION': {
    category: 'security',
    severity: 'error',
    message: '権限がありません',
    suggestion: '管理者に問い合わせてください',
  },

  // File Errors
  'ERR_FILE_SIZE': {
    category: 'file',
    severity: 'error',
    message: 'ファイルサイズが上限を超えています',
    suggestion: 'ファイルサイズを10MB以下にしてください',
  },
  'ERR_FILE_TYPE': {
    category: 'file',
    severity: 'error',
    message: 'サポートされていないファイル形式です',
    suggestion: 'PDF、Excel、Word形式のファイルをアップロードしてください',
  },
  'ERR_FILE_VIRUS': {
    category: 'file',
    severity: 'critical',
    message: 'ウイルスが検出されました',
    suggestion: 'ファイルを確認してください',
  },

  // Rate Limit Errors
  'ERR_RATE_LIMIT_EXCEEDED': {
    category: 'rate-limit',
    severity: 'warning',
    message: 'レート制限に達しました',
    suggestion: '少し時間をおいてから再試行してください',
  },

  // Cost Errors
  'ERR_COST_LIMIT_EXCEEDED': {
    category: 'cost',
    severity: 'warning',
    message: 'コスト上限に達しました',
    suggestion: '利用プランをアップグレードしてください',
  },
  'ERR_COST_ESTIMATE_HIGH': {
    category: 'cost',
    severity: 'info',
    message: '予想コストが高くなっています',
    suggestion: '処理内容を見直すことをお勧めします',
  },

  // System Errors
  'ERR_SYSTEM_MAINTENANCE': {
    category: 'system',
    severity: 'info',
    message: 'メンテナンス中です',
    suggestion: 'メンテナンス終了までお待ちください',
  },
  'ERR_SYSTEM_UNKNOWN': {
    category: 'system',
    severity: 'error',
    message: '予期しないエラーが発生しました',
    suggestion: 'サポートにお問い合わせください',
  },
};

export function ErrorDisplay({
  errors = [],
  onRetry,
  onClear,
  showToast = true,
  compact = false,
}: ErrorDisplayProps) {
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());
  const [retryingErrors, setRetryingErrors] = useState<Set<string>>(new Set());

  /**
   * エラーをトーストで表示
   */
  useEffect(() => {
    if (showToast && errors.length > 0) {
      const latestError = errors[errors.length - 1];
      const errorInfo = ERROR_CODES[latestError.code] || {};

      const toastType =
        errorInfo.severity === 'critical' ? 'error' :
        errorInfo.severity === 'warning' ? 'warning' :
        errorInfo.severity === 'info' ? 'info' :
        'error';

      toast[toastType](latestError.message, {
        description: errorInfo.suggestion,
        action: latestError.retryable && onRetry ? {
          label: '再試行',
          onClick: () => handleRetry(latestError),
        } : undefined,
      });
    }
  }, [errors, showToast]);

  /**
   * エラー再試行
   */
  const handleRetry = async (error: AppError) => {
    setRetryingErrors((prev) => new Set(prev).add(error.code));

    try {
      if (error.jobId) {
        // ジョブ再試行
        await apiClient.post(`/jobs/${error.jobId}/retry`);
      }
      onRetry?.(error);
    } catch (retryError) {
      toast.error('再試行に失敗しました');
    } finally {
      setRetryingErrors((prev) => {
        const newSet = new Set(prev);
        newSet.delete(error.code);
        return newSet;
      });
    }
  };

  /**
   * エラー展開トグル
   */
  const toggleExpanded = (errorCode: string) => {
    setExpandedErrors((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(errorCode)) {
        newSet.delete(errorCode);
      } else {
        newSet.add(errorCode);
      }
      return newSet;
    });
  };

  /**
   * カテゴリアイコン取得
   */
  const getCategoryIcon = (category?: ErrorCategory) => {
    switch (category) {
      case 'validation':
        return <AlertCircle className="h-4 w-4" />;
      case 'network':
        return <Network className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
      case 'file':
        return <FileWarning className="h-4 w-4" />;
      case 'rate-limit':
        return <Clock className="h-4 w-4" />;
      case 'cost':
        return <DollarSign className="h-4 w-4" />;
      case 'system':
        return <Bug className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  /**
   * 重要度による色取得
   */
  const getSeverityColor = (severity?: ErrorSeverity) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 dark:text-red-400';
      case 'error':
        return 'text-destructive';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'info':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-destructive';
    }
  };

  /**
   * 重要度によるバリアント取得
   */
  const getSeverityVariant = (severity?: ErrorSeverity): "default" | "destructive" | "outline" | "secondary" => {
    switch (severity) {
      case 'critical':
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'outline';
      default:
        return 'destructive';
    }
  };

  if (errors.length === 0) {
    return null;
  }

  /**
   * コンパクト表示
   */
  if (compact) {
    return (
      <div className="space-y-2">
        {errors.map((error, index) => {
          const errorInfo = ERROR_CODES[error.code] || {};
          const isExpanded = expandedErrors.has(error.code);
          const isRetrying = retryingErrors.has(error.code);

          return (
            <Alert
              key={`${error.code}-${index}`}
              variant={getSeverityVariant(errorInfo.severity)}
            >
              <div className="flex items-start gap-2">
                {getCategoryIcon(errorInfo.category)}
                <div className="flex-1">
                  <AlertDescription className="font-medium">
                    {error.message}
                  </AlertDescription>
                  {errorInfo.suggestion && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {errorInfo.suggestion}
                    </p>
                  )}
                </div>
                {error.retryable && onRetry && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRetry(error)}
                    disabled={isRetrying}
                  >
                    <RefreshCw className={`h-3 w-3 ${isRetrying ? 'animate-spin' : ''}`} />
                  </Button>
                )}
              </div>
            </Alert>
          );
        })}
      </div>
    );
  }

  /**
   * 詳細表示
   */
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              エラー情報
            </CardTitle>
            <CardDescription>
              {errors.length}件のエラーが発生しています
            </CardDescription>
          </div>
          {onClear && (
            <Button variant="outline" size="sm" onClick={onClear}>
              クリア
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {errors.map((error, index) => {
              const errorInfo = ERROR_CODES[error.code] || {};
              const isExpanded = expandedErrors.has(error.code);
              const isRetrying = retryingErrors.has(error.code);

              return (
                <div
                  key={`${error.code}-${index}`}
                  className="border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <div className={getSeverityColor(errorInfo.severity)}>
                        {getCategoryIcon(errorInfo.category)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{error.message}</span>
                          <Badge variant="outline" className="text-xs">
                            {error.code}
                          </Badge>
                        </div>
                        {errorInfo.suggestion && (
                          <p className="text-sm text-muted-foreground">
                            💡 {errorInfo.suggestion}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{new Date(error.timestamp).toLocaleTimeString('ja-JP')}</span>
                          {error.jobId && (
                            <span>Job: {error.jobId}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {error.retryable && onRetry && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRetry(error)}
                          disabled={isRetrying}
                        >
                          <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
                        </Button>
                      )}
                      {error.details && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(error.code)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(
                          `Error: ${error.code}\nMessage: ${error.message}\nTime: ${error.timestamp}`
                        )}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* 詳細情報 */}
                  {error.details && isExpanded && (
                    <div className="mt-2 p-2 bg-muted rounded text-xs font-mono">
                      <pre>{JSON.stringify(error.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}