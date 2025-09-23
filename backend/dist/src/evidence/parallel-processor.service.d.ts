import { CostMonitorService } from '../common/governance/cost-monitor.service';
export declare class ParallelProcessorService {
    private costMonitor;
    constructor(costMonitor: CostMonitorService);
    processEvidencesInParallel(evidenceIds: string[], maxConcurrency?: number): Promise<{
        processed: number;
        failed: number;
        totalCost: number;
        processingTime: number;
    }>;
    optimizeStorageWithLTS(): Promise<{
        archivedCount: number;
        spaceFreed: number;
        cost: number;
    }>;
    monitorQualityInRealtime(evidenceIds: string[]): Promise<{
        qualityIssues: any[];
        reprocessingRequired: string[];
    }>;
    private createBatches;
    private simulateProcessing;
    private estimateMemoryUsage;
    private archiveToLTS;
    private sleep;
}
