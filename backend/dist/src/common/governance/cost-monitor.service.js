"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CostMonitorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CostMonitorService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../../database/client");
let CostMonitorService = CostMonitorService_1 = class CostMonitorService {
    async monitorOCRCosts(processingData) {
        const warnings = [];
        const baseCost = Math.ceil(processingData.fileSize / (1024 * 1024)) * 0.5;
        const timeCost = Math.ceil(processingData.duration / 1000) * 0.2;
        const memoryCost = Math.ceil(processingData.memoryUsage / 512) * 0.1;
        const totalCost = baseCost + timeCost + memoryCost;
        const withinLimits = totalCost <= CostMonitorService_1.COST_LIMITS.PER_GENERATE_MAX_JPY;
        if (processingData.duration > CostMonitorService_1.COST_LIMITS.OCR_PROCESSING_MAX_SEC * 1000) {
            warnings.push(`OCR処理時間超過: ${processingData.duration / 1000}秒 > ${CostMonitorService_1.COST_LIMITS.OCR_PROCESSING_MAX_SEC}秒`);
        }
        if (processingData.fileSize > CostMonitorService_1.COST_LIMITS.FILE_SIZE_MAX_MB * 1024 * 1024) {
            warnings.push(`ファイルサイズ超過: ${Math.round(processingData.fileSize / (1024 * 1024))}MB > ${CostMonitorService_1.COST_LIMITS.FILE_SIZE_MAX_MB}MB`);
        }
        if (!withinLimits) {
            warnings.push(`コスト制限超過: ${totalCost}円 > ${CostMonitorService_1.COST_LIMITS.PER_GENERATE_MAX_JPY}円`);
        }
        console.log(`[COST_AUDIT] OCR処理: Evidence=${processingData.evidenceId}, User=${processingData.userId}, Cost=${totalCost}円, Duration=${processingData.duration}ms, Size=${Math.round(processingData.fileSize / 1024)}KB`);
        await this.recordCostHistory(processingData.evidenceId, {
            timestamp: new Date().toISOString(),
            costBreakdown: { baseCost, timeCost, memoryCost, totalCost },
            performance: {
                duration: processingData.duration,
                fileSize: processingData.fileSize,
                memoryUsage: processingData.memoryUsage
            },
            warnings,
            withinLimits
        });
        return { cost: totalCost, withinLimits, warnings };
    }
    async monitorStorageUsage() {
        const totalSize = await client_1.prisma.evidence.aggregate({
            _sum: { size: true },
            where: { deletedAt: null }
        });
        const currentUsageGB = (totalSize._sum.size || 0) / (1024 * 1024 * 1024);
        const budgetUsagePercent = (currentUsageGB / CostMonitorService_1.COST_LIMITS.MONTHLY_STORAGE_BUDGET_GB) * 100;
        const needsArchiving = budgetUsagePercent > 80;
        if (needsArchiving) {
            console.log(`[STORAGE_ALERT] ストレージ使用量警告: ${currentUsageGB.toFixed(2)}GB (${budgetUsagePercent.toFixed(1)}%) - LTSアーカイブ推奨`);
        }
        return { currentUsageGB, budgetUsagePercent, needsArchiving };
    }
    async monitorSecurityScans(scanResult) {
        console.log(`[SECURITY_AUDIT] ファイルスキャン: Evidence=${scanResult.evidenceId}, User=${scanResult.userId}, Type=${scanResult.scanType}, Result=${scanResult.result}`);
        if (scanResult.result !== 'clean') {
            console.warn(`[SECURITY_ALERT] セキュリティ脅威検出: Evidence=${scanResult.evidenceId}, Details=${scanResult.details}`);
            await client_1.prisma.evidence.update({
                where: { id: scanResult.evidenceId },
                data: {
                    deletedAt: new Date(),
                    metadata: {
                        securityScan: {
                            result: scanResult.result,
                            details: scanResult.details,
                            quarantinedAt: new Date().toISOString()
                        }
                    }
                }
            });
        }
    }
    async auditPersonalDataAccess(action, resourceType, resourceId, userId, additionalData) {
        const auditEntry = {
            timestamp: new Date().toISOString(),
            action,
            resourceType,
            resourceId,
            userId,
            classification: 'personal',
            retentionMonths: 12,
            additionalData
        };
        console.log(`[PERSONAL_DATA_AUDIT] ${action.toUpperCase()}: ${resourceType}=${resourceId}, User=${userId}, Data=${JSON.stringify(additionalData || {})}`);
    }
    async monitorPerformance(operation, duration, metadata) {
        const SLO_LIMITS = {
            preview_render: 2000,
            pdf_generation: 10000,
            ocr_processing: 30000
        };
        const limit = SLO_LIMITS[operation] || 5000;
        const withinSLO = duration <= limit;
        if (!withinSLO) {
            console.warn(`[PERFORMANCE_ALERT] SLO違反: ${operation}=${duration}ms > ${limit}ms, Metadata=${JSON.stringify(metadata || {})}`);
        }
        console.log(`[PERFORMANCE] ${operation}: ${duration}ms (SLO: ${withinSLO ? 'OK' : 'VIOLATION'})`);
    }
    async recordCostHistory(evidenceId, costData) {
        await client_1.prisma.evidence.update({
            where: { id: evidenceId },
            data: {
                metadata: {
                    costHistory: costData
                }
            }
        });
    }
};
exports.CostMonitorService = CostMonitorService;
CostMonitorService.COST_LIMITS = {
    PER_GENERATE_MAX_JPY: 15,
    MONTHLY_STORAGE_BUDGET_GB: 20,
    OCR_PROCESSING_MAX_SEC: 30,
    FILE_SIZE_MAX_MB: 50
};
exports.CostMonitorService = CostMonitorService = CostMonitorService_1 = __decorate([
    (0, common_1.Injectable)()
], CostMonitorService);
//# sourceMappingURL=cost-monitor.service.js.map