"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ProcessingQueueService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessingQueueService = void 0;
const common_1 = require("@nestjs/common");
const events_1 = require("events");
let ProcessingQueueService = ProcessingQueueService_1 = class ProcessingQueueService extends events_1.EventEmitter {
    constructor() {
        super();
        this.logger = new common_1.Logger(ProcessingQueueService_1.name);
        this.pendingQueue = [];
        this.runningJobs = new Map();
        this.completedJobs = new Map();
        this.MAX_CONCURRENT_JOBS = 3;
        this.MAX_OCR_CONCURRENT = 2;
        this.MAX_DAILY_COST = 15;
        this.COST_PER_OCR = 0.5;
        this.COST_PER_TRANSFORM = 0.1;
        this.currentDailyCost = 0;
        this.dailyResetTime = new Date();
        this.startProcessing();
        this.setupCostReset();
    }
    async addJob(job) {
        const jobId = this.generateJobId();
        const processingJob = {
            id: jobId,
            createdAt: new Date(),
            retries: 0,
            ...job
        };
        if (this.currentDailyCost + job.estimatedCost > this.MAX_DAILY_COST) {
            throw new Error(`Daily cost limit exceeded. Current: ${this.currentDailyCost}JPY, Limit: ${this.MAX_DAILY_COST}JPY`);
        }
        this.insertByPriority(processingJob);
        this.logger.log(`Job added to queue: ${jobId} (${job.type}, ${job.priority} priority)`);
        this.emit('jobAdded', processingJob);
        return jobId;
    }
    getJobStatus(jobId) {
        return this.runningJobs.get(jobId) ||
            this.completedJobs.get(jobId) ||
            this.pendingQueue.find(job => job.id === jobId) ||
            null;
    }
    getMetrics() {
        const completedArray = Array.from(this.completedJobs.values());
        const failedJobs = completedArray.filter(job => job.error).length;
        const totalProcessingTime = completedArray
            .filter(job => job.startedAt && job.completedAt)
            .reduce((sum, job) => sum + (job.completedAt.getTime() - job.startedAt.getTime()), 0);
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
    startProcessing() {
        setInterval(() => {
            this.processNextJobs();
        }, 1000);
    }
    async processNextJobs() {
        if (this.runningJobs.size >= this.MAX_CONCURRENT_JOBS) {
            return;
        }
        const runningOCRJobs = Array.from(this.runningJobs.values())
            .filter(job => job.type === 'ocr').length;
        const nextJob = this.getNextJobRespectingLimits(runningOCRJobs);
        if (!nextJob) {
            return;
        }
        const jobIndex = this.pendingQueue.indexOf(nextJob);
        if (jobIndex > -1) {
            this.pendingQueue.splice(jobIndex, 1);
        }
        nextJob.startedAt = new Date();
        this.runningJobs.set(nextJob.id, nextJob);
        this.logger.log(`Starting job: ${nextJob.id} (${nextJob.type})`);
        this.emit('jobStarted', nextJob);
        this.executeJob(nextJob).catch(error => {
            this.logger.error(`Job execution failed: ${nextJob.id}`, error);
        });
    }
    getNextJobRespectingLimits(runningOCRJobs) {
        for (const job of this.pendingQueue) {
            if (job.type === 'ocr' && runningOCRJobs >= this.MAX_OCR_CONCURRENT) {
                continue;
            }
            if (this.currentDailyCost + job.estimatedCost > this.MAX_DAILY_COST) {
                continue;
            }
            return job;
        }
        return null;
    }
    async executeJob(job) {
        const timeout = setTimeout(() => {
            this.handleJobTimeout(job);
        }, job.timeout);
        try {
            let result;
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
                    actualCost = 0.05;
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
            this.currentDailyCost += actualCost;
            this.runningJobs.delete(job.id);
            this.completedJobs.set(job.id, job);
            const processingTime = job.completedAt.getTime() - job.startedAt.getTime();
            this.logger.log(`Job completed: ${job.id} in ${processingTime}ms, cost: ${actualCost}JPY`);
            this.emit('jobCompleted', { job, result });
        }
        catch (error) {
            clearTimeout(timeout);
            await this.handleJobError(job, error);
        }
    }
    async handleJobError(job, error) {
        job.error = error.message;
        job.retries += 1;
        if (job.retries < job.maxRetries) {
            this.logger.warn(`Job ${job.id} failed, retrying (${job.retries}/${job.maxRetries})`);
            job.error = undefined;
            this.insertByPriority(job);
            this.runningJobs.delete(job.id);
        }
        else {
            job.completedAt = new Date();
            this.runningJobs.delete(job.id);
            this.completedJobs.set(job.id, job);
            this.logger.error(`Job ${job.id} failed permanently after ${job.retries} retries`);
            this.emit('jobFailed', { job, error });
        }
    }
    handleJobTimeout(job) {
        this.logger.warn(`Job ${job.id} timed out after ${job.timeout}ms`);
        this.handleJobError(job, new Error('Job execution timeout'));
    }
    insertByPriority(job) {
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
    calculateOCRCost(payload) {
        const sizeInMB = (payload.bufferSize || 1024000) / 1024 / 1024;
        return Math.max(0.1, sizeInMB * this.COST_PER_OCR);
    }
    calculateTransformCost(payload) {
        const tableCount = payload.tableCount || 1;
        return tableCount * this.COST_PER_TRANSFORM;
    }
    calculateStorageCost(payload) {
        const sizeInGB = (payload.fileSize || 1024000) / 1024 / 1024 / 1024;
        return sizeInGB * 0.02;
    }
    async executeOCRJob(job) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { ocrResult: 'Mock OCR result' };
    }
    async executeTransformJob(job) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { tables: [] };
    }
    async executeCompressionJob(job) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { compressedSize: job.payload.originalSize * 0.7 };
    }
    async executeStorageJob(job) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return { storageUrl: `https://storage.example.com/${job.id}` };
    }
    setupCostReset() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const msUntilTomorrow = tomorrow.getTime() - now.getTime();
        setTimeout(() => {
            this.currentDailyCost = 0;
            this.dailyResetTime = new Date();
            this.logger.log('Daily cost limit reset');
            setInterval(() => {
                this.currentDailyCost = 0;
                this.dailyResetTime = new Date();
                this.logger.log('Daily cost limit reset');
            }, 24 * 60 * 60 * 1000);
        }, msUntilTomorrow);
    }
    generateJobId() {
        return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    async shutdown() {
        this.logger.log('Shutting down processing queue...');
        while (this.runningJobs.size > 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        this.logger.log('Processing queue shutdown complete');
    }
};
exports.ProcessingQueueService = ProcessingQueueService;
exports.ProcessingQueueService = ProcessingQueueService = ProcessingQueueService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ProcessingQueueService);
//# sourceMappingURL=processing-queue.service.js.map