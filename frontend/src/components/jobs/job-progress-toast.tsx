'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast, Toaster } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  X,
  Pause,
  Play,
  Clock,
  Zap,
  FileText,
  Database,
  Package,
  Shield,
  Download,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';

/**
 * ジョブ進捗トーストコンポーネント
 * APP-438: /jobs監視・再試行/キャンセル
 */

export interface Job {
  id: string;
  name: string;
  type: JobType;
  status: JobStatus;
  progress?: number;
  message?: string;
  startedAt: string;
  completedAt?: string;
  error?: string;
  retryCount?: number;
  maxRetries?: number;
  result?: any;
  metadata?: JobMetadata;
}

type JobType =
  | 'generate'
  | 'validate'
  | 'export'
  | 'ocr'
  | 'preflight'
  | 'upload'
  | 'process';

type JobStatus =
  | 'pending'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retrying';

interface JobMetadata {
  totalSteps?: number;
  currentStep?: number;
  stepName?: string;
  estimatedTime?: number;
  cost?: number;
  fileSize?: number;
}

interface JobProgressToastProps {
  jobId?: string;
  autoStart?: boolean;
  pollInterval?: number;
  onComplete?: (job: Job) => void;
  onError?: (job: Job) => void;
  showHistory?: boolean;
}

export function JobProgressToast({
  jobId,
  autoStart = true,
  pollInterval = 1000,
  onComplete,
  onError,
  showHistory = false,
}: JobProgressToastProps) {
  const [activeJobs, setActiveJobs] = useState<Map<string, Job>>(new Map());
  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);
  const [isPolling, setIsPolling] = useState(autoStart);

  /**
   * ジョブタイプアイコン
   */
  const getJobIcon = (type: JobType) => {
    switch (type) {
      case 'generate':
        return <FileText className="h-4 w-4" />;
      case 'validate':
        return <Shield className="h-4 w-4" />;
      case 'export':
        return <Download className="h-4 w-4" />;
      case 'ocr':
        return <Zap className="h-4 w-4" />;
      case 'preflight':
        return <Package className="h-4 w-4" />;
      case 'upload':
        return <Database className="h-4 w-4" />;
      default:
        return <Loader2 className="h-4 w-4" />;
    }
  };

  /**
   * ステータスアイコン
   */
  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-muted-foreground" />;
      case 'retrying':
        return <RefreshCw className="h-4 w-4 animate-spin text-yellow-600" />;
    }
  };

  /**
   * ジョブステータス取得
   */
  const fetchJobStatus = useCallback(async (id: string) => {
    try {
      const response = await apiClient.get(`/jobs/${id}`);
      return response as Job;
    } catch (error) {
      console.error(`Failed to fetch job ${id}:`, error);
      return null;
    }
  }, []);

  /**
   * 全アクティブジョブ取得
   */
  const fetchAllActiveJobs = useCallback(async () => {
    try {
      const response = await apiClient.get('/jobs/active');
      return response.jobs as Job[];
    } catch (error) {
      console.error('Failed to fetch active jobs:', error);
      return [];
    }
  }, []);

  /**
   * ジョブ更新処理
   */
  const updateJob = useCallback((job: Job) => {
    setActiveJobs((prev) => {
      const newMap = new Map(prev);

      // 完了・失敗・キャンセルの場合は削除
      if (['completed', 'failed', 'cancelled'].includes(job.status)) {
        newMap.delete(job.id);
        setCompletedJobs((prevCompleted) => [...prevCompleted, job]);

        // コールバック実行
        if (job.status === 'completed') {
          onComplete?.(job);
          showJobToast(job, 'success');
        } else if (job.status === 'failed') {
          onError?.(job);
          showJobToast(job, 'error');
        }
      } else {
        // アクティブジョブを更新
        newMap.set(job.id, job);

        // 進捗トースト表示
        if (job.status === 'running' && job.progress) {
          showProgressToast(job);
        }
      }

      return newMap;
    });
  }, [onComplete, onError]);

  /**
   * ポーリング処理
   */
  useEffect(() => {
    if (!isPolling) return;

    const interval = setInterval(async () => {
      if (jobId) {
        // 特定ジョブの監視
        const job = await fetchJobStatus(jobId);
        if (job) {
          updateJob(job);
        }
      } else {
        // 全アクティブジョブの監視
        const jobs = await fetchAllActiveJobs();
        jobs.forEach(updateJob);
      }
    }, pollInterval);

    return () => clearInterval(interval);
  }, [isPolling, jobId, pollInterval, fetchJobStatus, fetchAllActiveJobs, updateJob]);

  /**
   * ジョブトースト表示
   */
  const showJobToast = (job: Job, type: 'success' | 'error' | 'info') => {
    const icon = getJobIcon(job.type);
    const message = job.message || getDefaultMessage(job);

    if (type === 'success') {
      toast.success(
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <div className="font-medium">{job.name}</div>
            <div className="text-sm text-muted-foreground">{message}</div>
          </div>
        </div>,
        {
          duration: 5000,
        }
      );
    } else if (type === 'error') {
      toast.error(
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <div className="font-medium">{job.name} 失敗</div>
            <div className="text-sm">{job.error || '処理中にエラーが発生しました'}</div>
          </div>
        </div>,
        {
          duration: 10000,
          action: job.retryCount !== undefined && job.retryCount < (job.maxRetries || 3) ? {
            label: '再試行',
            onClick: () => retryJob(job.id),
          } : undefined,
        }
      );
    }
  };

  /**
   * 進捗トースト表示
   */
  const showProgressToast = (job: Job) => {
    const toastId = `job-progress-${job.id}`;
    const icon = getJobIcon(job.type);
    const progress = job.progress || 0;

    toast.custom(
      (t) => (
        <div className="flex items-center gap-3 bg-background border rounded-lg p-3 shadow-lg">
          {icon}
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{job.name}</span>
              <Badge variant="outline" className="text-xs">
                {progress}%
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
            {job.metadata?.stepName && (
              <p className="text-xs text-muted-foreground">
                {job.metadata.stepName}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => pauseJob(job.id)}
            >
              <Pause className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => cancelJob(job.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ),
      {
        id: toastId,
        duration: Infinity,
      }
    );

    // 完了時にトーストを削除
    if (progress >= 100) {
      setTimeout(() => toast.dismiss(toastId), 1000);
    }
  };

  /**
   * デフォルトメッセージ取得
   */
  const getDefaultMessage = (job: Job): string => {
    switch (job.status) {
      case 'completed':
        return '処理が正常に完了しました';
      case 'failed':
        return '処理に失敗しました';
      case 'cancelled':
        return '処理がキャンセルされました';
      case 'running':
        return `処理中... ${job.progress || 0}%`;
      case 'retrying':
        return `再試行中 (${job.retryCount}/${job.maxRetries})`;
      default:
        return '処理を開始しています';
    }
  };

  /**
   * ジョブ再試行
   */
  const retryJob = async (id: string) => {
    try {
      await apiClient.post(`/jobs/${id}/retry`);
      toast.info('ジョブを再試行しています');
    } catch (error) {
      toast.error('再試行に失敗しました');
    }
  };

  /**
   * ジョブキャンセル
   */
  const cancelJob = async (id: string) => {
    try {
      await apiClient.post(`/jobs/${id}/cancel`);
      toast.info('ジョブをキャンセルしました');
    } catch (error) {
      toast.error('キャンセルに失敗しました');
    }
  };

  /**
   * ジョブ一時停止
   */
  const pauseJob = async (id: string) => {
    try {
      await apiClient.post(`/jobs/${id}/pause`);
      toast.info('ジョブを一時停止しました');
    } catch (error) {
      toast.error('一時停止に失敗しました');
    }
  };

  /**
   * ジョブ再開
   */
  const resumeJob = async (id: string) => {
    try {
      await apiClient.post(`/jobs/${id}/resume`);
      toast.info('ジョブを再開しました');
    } catch (error) {
      toast.error('再開に失敗しました');
    }
  };

  /**
   * 実行時間計算
   */
  const getElapsedTime = (job: Job): string => {
    const start = new Date(job.startedAt).getTime();
    const end = job.completedAt ? new Date(job.completedAt).getTime() : Date.now();
    const elapsed = Math.floor((end - start) / 1000);

    if (elapsed < 60) return `${elapsed}秒`;
    if (elapsed < 3600) return `${Math.floor(elapsed / 60)}分`;
    return `${Math.floor(elapsed / 3600)}時間`;
  };

  // 履歴表示UI
  if (showHistory) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ジョブ履歴</CardTitle>
          <CardDescription>
            アクティブ: {activeJobs.size} / 完了: {completedJobs.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {/* アクティブジョブ */}
              {Array.from(activeJobs.values()).map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <div className="font-medium text-sm">{job.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {job.metadata?.stepName || getDefaultMessage(job)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {job.progress !== undefined && (
                      <div className="w-24">
                        <Progress value={job.progress} className="h-2" />
                      </div>
                    )}
                    {job.status === 'paused' ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => resumeJob(job.id)}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => pauseJob(job.id)}
                      >
                        <Pause className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => cancelJob(job.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* 完了ジョブ */}
              {completedJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 border rounded-lg opacity-60"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <div className="font-medium text-sm">{job.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {getElapsedTime(job)}
                      </div>
                    </div>
                  </div>
                  {job.status === 'failed' && job.retryCount !== undefined && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => retryJob(job.id)}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  // トースト通知のみ（UIなし）
  return null;
}

/**
 * ジョブ進捗トーストプロバイダー
 */
export function JobProgressToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="bottom-right" />
      <JobProgressToast />
    </>
  );
}