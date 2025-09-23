import { CostMonitorService } from './cost-monitor.service';
export declare class GovernanceDashboardService {
    private costMonitor;
    constructor(costMonitor: CostMonitorService);
    generateGovernanceReport(): Promise<{
        costCompliance: any;
        qualityMetrics: any;
        securityStatus: any;
        performanceMetrics: any;
        dataRetentionStatus: any;
        recommendations: string[];
    }>;
    private analyzeCostCompliance;
    private analyzeQualityMetrics;
    private analyzeSecurityStatus;
    private analyzePerformanceMetrics;
    private analyzeDataRetentionStatus;
    private generateRecommendations;
    checkRealTimeAlerts(): Promise<{
        criticalAlerts: any[];
        warningAlerts: any[];
    }>;
}
