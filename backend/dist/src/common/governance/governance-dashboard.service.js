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
exports.GovernanceDashboardService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../../database/client");
const cost_monitor_service_1 = require("./cost-monitor.service");
let GovernanceDashboardService = class GovernanceDashboardService {
    constructor(costMonitor) {
        this.costMonitor = costMonitor;
    }
    async generateGovernanceReport() {
        console.log('[GOVERNANCE_DASHBOARD] 総合レポート生成開始');
        const [costCompliance, qualityMetrics, securityStatus, performanceMetrics, dataRetentionStatus] = await Promise.all([
            this.analyzeCostCompliance(),
            this.analyzeQualityMetrics(),
            this.analyzeSecurityStatus(),
            this.analyzePerformanceMetrics(),
            this.analyzeDataRetentionStatus()
        ]);
        const recommendations = this.generateRecommendations({
            costCompliance,
            qualityMetrics,
            securityStatus,
            performanceMetrics,
            dataRetentionStatus
        });
        const report = {
            costCompliance,
            qualityMetrics,
            securityStatus,
            performanceMetrics,
            dataRetentionStatus,
            recommendations,
            generatedAt: new Date().toISOString(),
            governanceVersion: '1.0'
        };
        console.log(`[GOVERNANCE_DASHBOARD] 総合レポート完了: Recommendations=${recommendations.length}`);
        return report;
    }
    async analyzeCostCompliance() {
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const evidences = await client_1.prisma.evidence.findMany({
            where: {
                processedAt: { gte: last24Hours },
                deletedAt: null
            },
            select: {
                id: true,
                processingTime: true,
                size: true,
                metadata: true
            }
        });
        let totalCost = 0;
        let violationCount = 0;
        const COST_LIMIT = 15;
        for (const evidence of evidences) {
            const costData = evidence.metadata?.costHistory;
            if (costData?.costBreakdown?.totalCost) {
                totalCost += costData.costBreakdown.totalCost;
                if (costData.costBreakdown.totalCost > COST_LIMIT) {
                    violationCount++;
                }
            }
        }
        const averageCost = evidences.length > 0 ? totalCost / evidences.length : 0;
        const complianceRate = evidences.length > 0 ? ((evidences.length - violationCount) / evidences.length) * 100 : 100;
        return {
            totalCost,
            averageCost,
            processedCount: evidences.length,
            violationCount,
            complianceRate,
            budgetStatus: totalCost <= 500 ? 'GOOD' : totalCost <= 800 ? 'WARNING' : 'CRITICAL'
        };
    }
    async analyzeQualityMetrics() {
        const evidences = await client_1.prisma.evidence.findMany({
            where: {
                qualityScore: { not: null },
                deletedAt: null
            },
            select: {
                qualityScore: true,
                status: true,
                metadata: true
            }
        });
        const qualityScores = evidences.map(e => e.qualityScore).filter(s => s !== null);
        const averageQuality = qualityScores.length > 0 ?
            qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length : 0;
        const lowQualityCount = qualityScores.filter(score => score < 0.7).length;
        const highQualityCount = qualityScores.filter(score => score >= 0.9).length;
        const reprocessingRequired = evidences.filter(e => e.metadata?.reprocessing?.flagged === true).length;
        return {
            averageQuality,
            lowQualityCount,
            highQualityCount,
            totalProcessed: evidences.length,
            reprocessingRequired,
            qualityTrend: averageQuality >= 0.8 ? 'IMPROVING' : 'NEEDS_ATTENTION'
        };
    }
    async analyzeSecurityStatus() {
        const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const securityScans = await client_1.prisma.evidence.findMany({
            where: {
                createdAt: { gte: last7Days },
                deletedAt: null
            },
            select: {
                metadata: true,
                status: true
            }
        });
        let cleanFiles = 0;
        let suspiciousFiles = 0;
        let quarantinedFiles = 0;
        for (const evidence of securityScans) {
            const scanResult = evidence.metadata?.securityScan;
            if (scanResult) {
                switch (scanResult.result) {
                    case 'clean':
                        cleanFiles++;
                        break;
                    case 'suspicious':
                        suspiciousFiles++;
                        break;
                    case 'infected':
                        quarantinedFiles++;
                        break;
                }
            }
            else {
                cleanFiles++;
            }
        }
        const totalScanned = cleanFiles + suspiciousFiles + quarantinedFiles;
        const securityScore = totalScanned > 0 ? (cleanFiles / totalScanned) * 100 : 100;
        return {
            totalScanned,
            cleanFiles,
            suspiciousFiles,
            quarantinedFiles,
            securityScore,
            threatLevel: quarantinedFiles > 0 ? 'HIGH' : suspiciousFiles > 0 ? 'MEDIUM' : 'LOW'
        };
    }
    async analyzePerformanceMetrics() {
        const evidences = await client_1.prisma.evidence.findMany({
            where: {
                processingTime: { not: null },
                deletedAt: null
            },
            select: {
                processingTime: true,
                size: true,
                status: true
            },
            take: 100,
            orderBy: { processedAt: 'desc' }
        });
        const processingTimes = evidences.map(e => e.processingTime).filter(t => t > 0);
        const averageProcessingTime = processingTimes.length > 0 ?
            processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length : 0;
        const sloViolations = processingTimes.filter(time => time > 30000).length;
        const sloCompliance = processingTimes.length > 0 ?
            ((processingTimes.length - sloViolations) / processingTimes.length) * 100 : 100;
        return {
            averageProcessingTime,
            sloViolations,
            sloCompliance,
            totalProcessed: evidences.length,
            performanceGrade: sloCompliance >= 95 ? 'EXCELLENT' : sloCompliance >= 85 ? 'GOOD' : 'NEEDS_IMPROVEMENT'
        };
    }
    async analyzeDataRetentionStatus() {
        const retentionDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        const [totalPersonalData, expiredPersonalData, archivedData] = await Promise.all([
            client_1.prisma.applicant.count({ where: { deletedAt: null } }),
            client_1.prisma.applicant.count({
                where: {
                    createdAt: { lt: retentionDate },
                    deletedAt: null
                }
            }),
            client_1.prisma.evidence.count({
                where: {
                    metadata: {
                        path: ['ltsArchived'],
                        equals: true
                    }
                }
            })
        ]);
        const retentionCompliance = totalPersonalData > 0 ?
            ((totalPersonalData - expiredPersonalData) / totalPersonalData) * 100 : 100;
        return {
            totalPersonalData,
            expiredPersonalData,
            archivedData,
            retentionCompliance,
            actionRequired: expiredPersonalData > 0
        };
    }
    generateRecommendations(metrics) {
        const recommendations = [];
        if (metrics.costCompliance.complianceRate < 90) {
            recommendations.push('⚠️ コスト制限違反が多発しています。ファイルサイズ制限の強化を検討してください。');
        }
        if (metrics.costCompliance.budgetStatus === 'CRITICAL') {
            recommendations.push('🚨 月次コスト予算の上限に接近しています。緊急にコスト削減策を実施してください。');
        }
        if (metrics.qualityMetrics.averageQuality < 0.7) {
            recommendations.push('📊 OCR品質スコアが低下しています。OCRエンジンの設定見直しを推奨します。');
        }
        if (metrics.qualityMetrics.reprocessingRequired > 0) {
            recommendations.push(`🔄 ${metrics.qualityMetrics.reprocessingRequired}件のファイルが再処理待ちです。優先的に対応してください。`);
        }
        if (metrics.securityStatus.threatLevel === 'HIGH') {
            recommendations.push('🛡️ セキュリティ脅威が検出されています。セキュリティポリシーの見直しを実施してください。');
        }
        if (metrics.performanceMetrics.performanceGrade === 'NEEDS_IMPROVEMENT') {
            recommendations.push('⚡ 処理パフォーマンスが基準を下回っています。並列処理の最適化を検討してください。');
        }
        if (metrics.dataRetentionStatus.actionRequired) {
            recommendations.push(`📅 ${metrics.dataRetentionStatus.expiredPersonalData}件の個人情報が保持期限を超過しています。削除処理を実行してください。`);
        }
        if (recommendations.length === 0) {
            recommendations.push('✅ 全ての governance.yaml 要件が満たされています。現在の運用を継続してください。');
        }
        return recommendations;
    }
    async checkRealTimeAlerts() {
        const criticalAlerts = [];
        const warningAlerts = [];
        const storageStatus = await this.costMonitor.monitorStorageUsage();
        if (storageStatus.budgetUsagePercent > 90) {
            criticalAlerts.push({
                type: 'STORAGE_CRITICAL',
                message: `ストレージ使用量が90%を超過: ${storageStatus.budgetUsagePercent.toFixed(1)}%`,
                action: 'LTSアーカイブの即座実行が必要'
            });
        }
        else if (storageStatus.budgetUsagePercent > 80) {
            warningAlerts.push({
                type: 'STORAGE_WARNING',
                message: `ストレージ使用量が80%を超過: ${storageStatus.budgetUsagePercent.toFixed(1)}%`,
                action: 'LTSアーカイブの計画実行を推奨'
            });
        }
        return { criticalAlerts, warningAlerts };
    }
};
exports.GovernanceDashboardService = GovernanceDashboardService;
exports.GovernanceDashboardService = GovernanceDashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cost_monitor_service_1.CostMonitorService])
], GovernanceDashboardService);
//# sourceMappingURL=governance-dashboard.service.js.map