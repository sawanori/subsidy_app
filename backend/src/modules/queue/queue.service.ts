import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { v4 as uuidv4 } from 'uuid';

/**
 * キューサービス
 * APP-365: ジョブ管理・スケジューリング
 * APP-372: 202 Accepted + /jobs/:id 進捗
 */
@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('ocr') private readonly ocrQueue: Queue,
    @InjectQueue('export') private readonly exportQueue: Queue,
    @InjectQueue('regression') private readonly regressionQueue: Queue,
    @InjectQueue('general') private readonly generalQueue: Queue,
  ) {}

  /**
   * OCRジョブ追加
   */
  async addOcrJob(data: OcrJobData): Promise<JobResult> {
    const jobId = uuidv4();
    const job = await this.ocrQueue.add('process-ocr', data, {
      jobId,
      priority: data.priority || 0,
      delay: data.delay || 0,
    });

    return this.createJobResult(job);
  }

  /**
   * エクスポートジョブ追加
   */
  async addExportJob(data: ExportJobData): Promise<JobResult> {
    const jobId = uuidv4();
    const job = await this.exportQueue.add('generate-export', data, {
      jobId,
      priority: data.priority || 0,
    });

    return this.createJobResult(job);
  }

  /**
   * 回帰テストジョブ追加
   */
  async addRegressionJob(data: RegressionJobData): Promise<JobResult> {
    const jobId = uuidv4();
    const job = await this.regressionQueue.add('run-regression', data, {
      jobId,
    });

    return this.createJobResult(job);
  }

  /**
   * ジョブステータス取得
   */
  async getJobStatus(jobId: string): Promise<JobStatus> {
    // 各キューを検索
    const queues = [this.ocrQueue, this.exportQueue, this.regressionQueue, this.generalQueue];
    
    for (const queue of queues) {
      const job = await queue.getJob(jobId);
      if (job) {
        return await this.getJobStatusFromJob(job);
      }
    }

    return {
      jobId,
      status: 'not_found',
      error: 'Job not found',
    };
  }

  /**
   * ジョブキャンセル
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const queues = [this.ocrQueue, this.exportQueue, this.regressionQueue, this.generalQueue];
    
    for (const queue of queues) {
      const job = await queue.getJob(jobId);
      if (job) {
        await job.remove();
        return true;
      }
    }

    return false;
  }

  /**
   * ジョブステータス変換
   */
  private async getJobStatusFromJob(job: Job): Promise<JobStatus> {
    const state = await job.getState();
    const progress = job.progress();

    const status: JobStatus = {
      jobId: job.id.toString(),
      status: this.mapJobState(state),
      progress: typeof progress === 'number' ? progress : 0,
      createdAt: new Date(job.timestamp),
      processedOn: job.processedOn ? new Date(job.processedOn) : undefined,
      finishedOn: job.finishedOn ? new Date(job.finishedOn) : undefined,
    };

    // 完了時の結果
    if (state === 'completed') {
      const result = job.returnvalue;
      if (result) {
        status.result = result;
        status.resultUrl = result.url;
      }
    }

    // 失敗時のエラー
    if (state === 'failed') {
      status.error = job.failedReason;
      status.attemptsMade = job.attemptsMade;
    }

    return status;
  }

  /**
   * BullステータスをAPIステータスに変換
   */
  private mapJobState(state: string): JobStatusType {
    const stateMap: Record<string, JobStatusType> = {
      waiting: 'queued',
      active: 'running',
      completed: 'succeeded',
      failed: 'failed',
      delayed: 'queued',
      paused: 'queued',
    };
    return stateMap[state] || 'queued';
  }

  /**
   * ジョブ結果作成
   */
  private createJobResult(job: Job): JobResult {
    return {
      jobId: job.id.toString(),
      status: 'accepted',
      message: 'Job has been queued for processing',
      statusUrl: `/jobs/${job.id}`,
    };
  }

  /**
   * キュー統計取得
   */
  async getQueueStats(): Promise<QueueStats> {
    const stats: QueueStats = {
      ocr: await this.getQueueCounts(this.ocrQueue),
      export: await this.getQueueCounts(this.exportQueue),
      regression: await this.getQueueCounts(this.regressionQueue),
      general: await this.getQueueCounts(this.generalQueue),
    };
    return stats;
  }

  private async getQueueCounts(queue: Queue): Promise<QueueCounts> {
    const counts = await queue.getJobCounts();
    return {
      waiting: counts.waiting,
      active: counts.active,
      completed: counts.completed,
      failed: counts.failed,
      delayed: counts.delayed,
      paused: (counts as any).paused || 0,
    };
  }
}

// 型定義
export interface OcrJobData {
  fileId: string;
  filePath: string;
  language?: string;
  priority?: number;
  delay?: number;
  options?: any;
}

export interface ExportJobData {
  applicationId: string;
  templateId: string;
  format: 'pdf' | 'docx' | 'zip';
  priority?: number;
  options?: any;
}

export interface RegressionJobData {
  templateId: string;
  testData: any;
  threshold: number;
}

export interface JobResult {
  jobId: string;
  status: string;
  message: string;
  statusUrl: string;
}

export type JobStatusType = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled' | 'not_found';

export interface JobStatus {
  jobId: string;
  status: JobStatusType;
  progress?: number;
  result?: any;
  resultUrl?: string;
  error?: string;
  createdAt?: Date;
  processedOn?: Date;
  finishedOn?: Date;
  attemptsMade?: number;
}

export interface QueueStats {
  ocr: QueueCounts;
  export: QueueCounts;
  regression: QueueCounts;
  general: QueueCounts;
}

export interface QueueCounts {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}