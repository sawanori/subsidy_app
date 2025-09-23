export declare class CostMonitorService {
    private static readonly COST_LIMITS;
    monitorOCRCosts(processingData: {
        fileSize: number;
        duration: number;
        memoryUsage: number;
        userId: string;
        evidenceId: string;
    }): Promise<{
        cost: number;
        withinLimits: boolean;
        warnings: string[];
    }>;
    monitorStorageUsage(): Promise<{
        currentUsageGB: number;
        budgetUsagePercent: number;
        needsArchiving: boolean;
    }>;
    monitorSecurityScans(scanResult: {
        evidenceId: string;
        userId: string;
        scanType: 'clamav' | 'mime' | 'signature';
        result: 'clean' | 'infected' | 'suspicious';
        details?: string;
    }): Promise<void>;
    auditPersonalDataAccess(action: 'create' | 'read' | 'update' | 'delete', resourceType: 'applicant' | 'bankAccount' | 'application', resourceId: string, userId: string, additionalData?: any): Promise<void>;
    monitorPerformance(operation: string, duration: number, metadata?: any): Promise<void>;
    private recordCostHistory;
}
