import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';

export interface ProcessingJob {
  id: string;
  type: 'ocr' | 'transform' | 'compress' | 'storage';
  priority: 'high' | 'medium' | 'low';
  payload: any;
  retries: number;
  maxRetries: number;
  timeout: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  estimatedCost: number; // JPY
  actualCost?: number;
}

export interface QueueMetrics {
  totalJobs: number;
  runningJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalCost: number;
  avgProcessingTime: number;
  queueWaitTime: number;
}

@Injectable()
export class ProcessingQueueService extends EventEmitter {
  private readonly logger = new Logger(ProcessingQueueService.name);
  
  // キュー管理
  private readonly pendingQueue: ProcessingJob[] = [];
  private readonly runningJobs = new Map<string, ProcessingJob>();
  private readonly completedJobs = new Map<string, ProcessingJob>();
  
  // 制御パラメータ
  private readonly MAX_CONCURRENT_JOBS = 3;
  private readonly MAX_OCR_CONCURRENT = 2;
  private readonly MAX_DAILY_COST = 15; // JPY governance.yaml準拠
  private readonly COST_PER_OCR = 0.5; // JPY per MB
  private readonly COST_PER_TRANSFORM = 0.1; // JPY per table
  
  private currentDailyCost = 0;
  private dailyResetTime = new Date();

  constructor() {
    super();
    this.startProcessing();
    this.setupCostReset();
  }

  /**
   * ジョブをキューに追加
   */
  async addJob(job: Omit<ProcessingJob, 'id' | 'createdAt' | 'retries'>): Promise<string> {
    const jobId = this.generateJobId();
    
    const processingJob: ProcessingJob = {
      id: jobId,
      createdAt: new Date(),
      retries: 0,
      ...job
    };

    // コスト制限チェック
    if (this.currentDailyCost + job.estimatedCost > this.MAX_DAILY_COST) {
      throw new Error(`Daily cost limit exceeded. Current: ${this.currentDailyCost}JPY, Limit: ${this.MAX_DAILY_COST}JPY`);
    }

    // 優先度順に挿入
    this.insertByPriority(processingJob);
    
    this.logger.log(`Job added to queue: ${jobId} (${job.type}, ${job.priority} priority)`);
    this.emit('jobAdded', processingJob);

    return jobId;
  }

  /**
   * ジョブステータス取得
   */
  getJobStatus(jobId: string): ProcessingJob | null {
    return this.runningJobs.get(jobId) || 
           this.completedJobs.get(jobId) || 
           this.pendingQueue.find(job => job.id === jobId) || 
           null;
  }

  /**
   * キューメトリクス取得
   */
  getMetrics(): QueueMetrics {
    const completedArray = Array.from(this.completedJobs.values());
    const failedJobs = completedArray.filter(job => job.error).length;
    
    const totalProcessingTime = completedArray
      .filter(job => job.startedAt && job.completedAt)
      .reduce((sum, job) => sum + (job.completedAt!.getTime() - job.startedAt!.getTime()), 0);

    const avgProcessingTime = completedArray.length > 0 
      ? totalProcessingTime / completedArray.length 
      : 0;

    const queueWaitTime = this.pendingQueue.length > 0
      ? Date.now() - this.pendingQueue[0].createdAt.getTime()
      : 0;

    return {
      totalJobs: this.pendingQueue.length + this.runningJobs.size + this.completedJobs.size,
      runningJobs: this.runningJobs.size,
      completedJobs: this.completedJobs.size - failedJobs,
      failedJobs,
      totalCost: this.currentDailyCost,
      avgProcessingTime,
      queueWaitTime
    };
  }

  /**
   * 並列制御考慮ジョブ処理開始
   */
  private startProcessing(): void {
    setInterval(() => {
      this.processNextJobs();
    }, 1000); // 1秒間隔でチェック
  }

  /**
   * 次のジョブ処理
   */
  private async processNextJobs(): Promise<void> {
    // 並列制限チェック
    if (this.runningJobs.size >= this.MAX_CONCURRENT_JOBS) {
      return;
    }

    // OCR並列制限チェック  
    const runningOCRJobs = Array.from(this.runningJobs.values())
      .filter(job => job.type === 'ocr').length;
    
    const nextJob = this.getNextJobRespectingLimits(runningOCRJobs);
    if (!nextJob) {
      return;
    }

    // キューから削除してランニングに移動
    const jobIndex = this.pendingQueue.indexOf(nextJob);
    if (jobIndex > -1) {
      this.pendingQueue.splice(jobIndex, 1);
    }

    nextJob.startedAt = new Date();
    this.runningJobs.set(nextJob.id, nextJob);

    this.logger.log(`Starting job: ${nextJob.id} (${nextJob.type})`);
    this.emit('jobStarted', nextJob);

    // 非同期でジョブ実行
    this.executeJob(nextJob).catch(error => {
      this.logger.error(`Job execution failed: ${nextJob.id}`, error);
    });
  }

  /**
   * 制限を考慮した次のジョブ選択
   */
  private getNextJobRespectingLimits(runningOCRJobs: number): ProcessingJob | null {
    for (const job of this.pendingQueue) {
      // OCR制限チェック
      if (job.type === 'ocr' && runningOCRJobs >= this.MAX_OCR_CONCURRENT) {
        continue;
      }

      // コスト制限チェック
      if (this.currentDailyCost + job.estimatedCost > this.MAX_DAILY_COST) {
        continue;
      }

      return job;
    }
    return null;
  }

  /**
   * ジョブ実行
   */
  private async executeJob(job: ProcessingJob): Promise<void> {
    const timeout = setTimeout(() => {
      this.handleJobTimeout(job);
    }, job.timeout);

    try {
      let result: any;
      let actualCost = job.estimatedCost;

      switch (job.type) {
        case 'ocr':
          result = await this.executeOCRJob(job);
          actualCost = this.calculateOCRCost(job.payload);
          break;
        
        case 'transform':
          result = await this.executeTransformJob(job);
          actualCost = this.calculateTransformCost(job.payload);
          break;
          
        case 'compress':
          result = await this.executeCompressionJob(job);
          actualCost = 0.05; // 固定コスト
          break;
          
        case 'storage':
          result = await this.executeStorageJob(job);
          actualCost = this.calculateStorageCost(job.payload);
          break;
          
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      clearTimeout(timeout);
      job.completedAt = new Date();
      job.actualCost = actualCost;

      // コスト更新
      this.currentDailyCost += actualCost;

      // ジョブ完了
      this.runningJobs.delete(job.id);
      this.completedJobs.set(job.id, job);

      const processingTime = job.completedAt.getTime() - job.startedAt!.getTime();
      this.logger.log(`Job completed: ${job.id} in ${processingTime}ms, cost: ${actualCost}JPY`);
      this.emit('jobCompleted', { job, result });

    } catch (error) {
      clearTimeout(timeout);
      await this.handleJobError(job, error);
    }
  }

  /**
   * ジョブエラーハンドリング
   */
  private async handleJobError(job: ProcessingJob, error: any): Promise<void> {
    job.error = error.message;
    job.retries += 1;

    if (job.retries < job.maxRetries) {
      // リトライ
      this.logger.warn(`Job ${job.id} failed, retrying (${job.retries}/${job.maxRetries})`);
      job.error = undefined;
      this.insertByPriority(job);
      this.runningJobs.delete(job.id);
    } else {
      // 最終失敗
      job.completedAt = new Date();
      this.runningJobs.delete(job.id);
      this.completedJobs.set(job.id, job);
      
      this.logger.error(`Job ${job.id} failed permanently after ${job.retries} retries`);
      this.emit('jobFailed', { job, error });
    }
  }

  /**
   * ジョブタイムアウトハンドリング
   */
  private handleJobTimeout(job: ProcessingJob): void {
    this.logger.warn(`Job ${job.id} timed out after ${job.timeout}ms`);
    this.handleJobError(job, new Error('Job execution timeout'));
  }

  /**
   * 優先度順挿入
   */
  private insertByPriority(job: ProcessingJob): void {
    const priorities = { 'high': 3, 'medium': 2, 'low': 1 };
    const jobPriority = priorities[job.priority];

    let insertIndex = this.pendingQueue.length;
    for (let i = 0; i < this.pendingQueue.length; i++) {
      const existingPriority = priorities[this.pendingQueue[i].priority];
      if (jobPriority > existingPriority) {
        insertIndex = i;
        break;
      }
    }

    this.pendingQueue.splice(insertIndex, 0, job);
  }

  /**
   * コスト計算メソッド
   */
  private calculateOCRCost(payload: any): number {
    const sizeInMB = (payload.bufferSize || 1024000) / 1024 / 1024;
    return Math.max(0.1, sizeInMB * this.COST_PER_OCR);
  }

  private calculateTransformCost(payload: any): number {
    const tableCount = payload.tableCount || 1;
    return tableCount * this.COST_PER_TRANSFORM;
  }

  private calculateStorageCost(payload: any): number {
    const sizeInGB = (payload.fileSize || 1024000) / 1024 / 1024 / 1024;
    return sizeInGB * 0.02; // 0.02円/GB/day
  }

  /**
   * ジョブ実行ロジック（実装例）
   */
  private async executeOCRJob(job: ProcessingJob): Promise<any> {
    // 実際のOCR処理はOCRServiceに委譲
    await new Promise(resolve => setTimeout(resolve, 2000)); // 模擬処理時間
    return { ocrResult: 'Mock OCR result' };
  }

  private async executeTransformJob(job: ProcessingJob): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { tables: [] };
  }

  private async executeCompressionJob(job: ProcessingJob): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { compressedSize: job.payload.originalSize * 0.7 };
  }

  private async executeStorageJob(job: ProcessingJob): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { storageUrl: `https://storage.example.com/${job.id}` };
  }

  /**
   * 日次コストリセット
   */
  private setupCostReset(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const msUntilTomorrow = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
      this.currentDailyCost = 0;
      this.dailyResetTime = new Date();
      this.logger.log('Daily cost limit reset');

      // 毎日0時にリセット
      setInterval(() => {
        this.currentDailyCost = 0;
        this.dailyResetTime = new Date();
        this.logger.log('Daily cost limit reset');
      }, 24 * 60 * 60 * 1000);
    }, msUntilTomorrow);
  }

  /**
   * ジョブID生成
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * キュー停止（graceful shutdown用）
   */
  async shutdown(): Promise<void> {
    this.logger.log('Shutting down processing queue...');
    
    // 実行中のジョブ完了を待機
    while (this.runningJobs.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.logger.log('Processing queue shutdown complete');
  }
}