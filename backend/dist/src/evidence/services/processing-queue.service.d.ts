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
    estimatedCost: number;
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
export declare class ProcessingQueueService extends EventEmitter {
    private readonly logger;
    private readonly pendingQueue;
    private readonly runningJobs;
    private readonly completedJobs;
    private readonly MAX_CONCURRENT_JOBS;
    private readonly MAX_OCR_CONCURRENT;
    private readonly MAX_DAILY_COST;
    private readonly COST_PER_OCR;
    private readonly COST_PER_TRANSFORM;
    private currentDailyCost;
    private dailyResetTime;
    constructor();
    addJob(job: Omit<ProcessingJob, 'id' | 'createdAt' | 'retries'>): Promise<string>;
    getJobStatus(jobId: string): ProcessingJob | null;
    getMetrics(): QueueMetrics;
    private startProcessing;
    private processNextJobs;
    private getNextJobRespectingLimits;
    private executeJob;
    private handleJobError;
    private handleJobTimeout;
    private insertByPriority;
    private calculateOCRCost;
    private calculateTransformCost;
    private calculateStorageCost;
    private executeOCRJob;
    private executeTransformJob;
    private executeCompressionJob;
    private executeStorageJob;
    private setupCostReset;
    private generateJobId;
    shutdown(): Promise<void>;
}
