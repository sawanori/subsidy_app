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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParallelProcessorService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../database/client");
const cost_monitor_service_1 = require("../common/governance/cost-monitor.service");
let ParallelProcessorService = class ParallelProcessorService {
    constructor(costMonitor) {
        this.costMonitor = costMonitor;
    }
    async processEvidencesInParallel(evidenceIds, maxConcurrency = 3) {
        const startTime = Date.now();
        let totalCost = 0;
        let processed = 0;
        let failed = 0;
        console.log(`[PARALLEL_PROCESSOR] 並列処理開始: Evidence数=${evidenceIds.length}, 同時実行数=${maxConcurrency}`);
        const batches = this.createBatches(evidenceIds, maxConcurrency);
        for (const batch of batches) {
            const batchPromises = batch.map(async (evidenceId) => {
                try {
                    const evidence = await client_1.prisma.evidence.findUnique({
                        where: { id: evidenceId }
                    });
                    if (!evidence) {
                        console.warn(`[PARALLEL_PROCESSOR] Evidence not found: ${evidenceId}`);
                        failed++;
                        return;
                    }
                    const processingStart = Date.now();
                    const fileSize = evidence.size || 1024;
                    await this.simulateProcessing(evidenceId, fileSize);
                    const processingDuration = Date.now() - processingStart;
                    const costResult = await this.costMonitor.monitorOCRCosts({
                        fileSize,
                        duration: processingDuration,
                        memoryUsage: this.estimateMemoryUsage(fileSize),
                        userId: 'system',
                        evidenceId
                    });
                    totalCost += costResult.cost;
                    processed++;
                    if (!costResult.withinLimits) {
                        console.warn(`[PARALLEL_PROCESSOR] コスト制限超過検出: Evidence=${evidenceId}`);
                    }
                }
                catch (error) {
                    console.error(`[PARALLEL_PROCESSOR] 処理失敗: Evidence=${evidenceId}, Error=${error.message}`);
                    failed++;
                }
            });
            await Promise.all(batchPromises);
            if (batches.indexOf(batch) < batches.length - 1) {
                await this.sleep(100);
            }
        }
        const totalProcessingTime = Date.now() - startTime;
        await this.costMonitor.monitorPerformance('parallel_processing', totalProcessingTime, {
            evidenceCount: evidenceIds.length,
            processed,
            failed,
            totalCost,
            concurrency: maxConcurrency
        });
        console.log(`[PARALLEL_PROCESSOR] 並列処理完了: Processed=${processed}, Failed=${failed}, Cost=${totalCost}円, Time=${totalProcessingTime}ms`);
        return {
            processed,
            failed,
            totalCost,
            processingTime: totalProcessingTime
        };
    }
    async optimizeStorageWithLTS() {
        const storageStatus = await this.costMonitor.monitorStorageUsage();
        if (!storageStatus.needsArchiving) {
            console.log(`[LTS_OPTIMIZER] アーカイブ不要: 使用量=${storageStatus.currentUsageGB.toFixed(2)}GB (${storageStatus.budgetUsagePercent.toFixed(1)}%)`);
            return { archivedCount: 0, spaceFreed: 0, cost: 0 };
        }
        const archiveCandidates = await client_1.prisma.evidence.findMany({
            where: {
                processedAt: {
                    lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
                },
                deletedAt: null
            },
            select: {
                id: true,
                size: true,
                fileUrl: true,
                createdAt: true
            }
        });
        console.log(`[LTS_OPTIMIZER] LTSアーカイブ候補: ${archiveCandidates.length}件`);
        let archivedCount = 0;
        let spaceFreed = 0;
        const archiveCost = 0.01;
        for (const evidence of archiveCandidates.slice(0, 50)) {
            try {
                await this.archiveToLTS(evidence.id, evidence.fileUrl);
                await client_1.prisma.evidence.update({
                    where: { id: evidence.id },
                    data: {
                        metadata: {
                            ltsArchived: true,
                            archivedAt: new Date().toISOString(),
                            originalSize: evidence.size
                        }
                    }
                });
                archivedCount++;
                spaceFreed += evidence.size || 0;
            }
            catch (error) {
                console.error(`[LTS_OPTIMIZER] アーカイブ失敗: Evidence=${evidence.id}, Error=${error.message}`);
            }
        }
        const totalCost = archivedCount * archiveCost;
        console.log(`[LTS_OPTIMIZER] LTSアーカイブ完了: Archived=${archivedCount}, SpaceFreed=${Math.round(spaceFreed / 1024 / 1024)}MB, Cost=${totalCost}円`);
        return {
            archivedCount,
            spaceFreed,
            cost: totalCost
        };
    }
    async monitorQualityInRealtime(evidenceIds) {
        const qualityIssues = [];
        const reprocessingRequired = [];
        for (const evidenceId of evidenceIds) {
            const evidence = await client_1.prisma.evidence.findUnique({
                where: { id: evidenceId }
            });
            if (!evidence)
                continue;
            if (evidence.qualityScore < 0.7) {
                qualityIssues.push({
                    evidenceId,
                    issue: 'LOW_QUALITY_SCORE',
                    score: evidence.qualityScore,
                    severity: 'HIGH'
                });
                reprocessingRequired.push(evidenceId);
            }
            if (evidence.processingTime > 30000) {
                qualityIssues.push({
                    evidenceId,
                    issue: 'PROCESSING_TIMEOUT',
                    duration: evidence.processingTime,
                    severity: 'MEDIUM'
                });
            }
        }
        console.log(`[QUALITY_MONITOR] リアルタイム品質監視: Total=${evidenceIds.length}, Issues=${qualityIssues.length}, Reprocessing=${reprocessingRequired.length}`);
        return { qualityIssues, reprocessingRequired };
    }
    createBatches(items, batchSize) {
        const batches = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }
    async simulateProcessing(evidenceId, fileSize) {
        const processingTime = Math.max(100, fileSize / 10000);
        await this.sleep(processingTime);
        await client_1.prisma.evidence.update({
            where: { id: evidenceId },
            data: {
                status: 'COMPLETED',
                processedAt: new Date(),
                processingTime: Math.round(processingTime)
            }
        });
    }
    estimateMemoryUsage(fileSize) {
        return Math.max(512, fileSize * 2);
    }
    async archiveToLTS(evidenceId, fileUrl) {
        console.log(`[LTS_ARCHIVE] アーカイブ実行: Evidence=${evidenceId}, URL=${fileUrl}`);
        await this.sleep(50);
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
exports.ParallelProcessorService = ParallelProcessorService;
exports.ParallelProcessorService = ParallelProcessorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cost_monitor_service_1.CostMonitorService])
], ParallelProcessorService);
//# sourceMappingURL=parallel-processor.service.js.map