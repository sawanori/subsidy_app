import { Injectable } from '@nestjs/common';
import { prisma } from '@/database/client';
import { CostMonitorService } from './cost-monitor.service';

/**
 * governance.yaml総合監視ダッシュボードサービス
 * リアルタイム監視・アラート・レポート生成
 */
@Injectable()
export class GovernanceDashboardService {
  
  constructor(
    private costMonitor: CostMonitorService
  ) {}
  
  /**
   * 総合ガバナンス状況レポート生成
   */
  async generateGovernanceReport(): Promise<{
    costCompliance: any;
    qualityMetrics: any;
    securityStatus: any;
    performanceMetrics: any;
    dataRetentionStatus: any;
    recommendations: string[];
  }> {
    
    console.log('[GOVERNANCE_DASHBOARD] 総合レポート生成開始');
    
    const [
      costCompliance,
      qualityMetrics,
      securityStatus,
      performanceMetrics,
      dataRetentionStatus
    ] = await Promise.all([
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
  
  /**
   * コスト準拠分析
   */
  private async analyzeCostCompliance(): Promise<any> {
    
    // 最近24時間のコスト分析
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const evidences = await prisma.evidence.findMany({
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
    const COST_LIMIT = 15; // governance.yaml上限
    
    for (const evidence of evidences) {
      const costData = (evidence.metadata as any)?.costHistory;
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
  
  /**
   * 品質メトリクス分析
   */
  private async analyzeQualityMetrics(): Promise<any> {
    
    const evidences = await prisma.evidence.findMany({
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
    
    const reprocessingRequired = evidences.filter(e => 
      (e.metadata as any)?.reprocessing?.flagged === true
    ).length;
    
    return {
      averageQuality,
      lowQualityCount,
      highQualityCount,
      totalProcessed: evidences.length,
      reprocessingRequired,
      qualityTrend: averageQuality >= 0.8 ? 'IMPROVING' : 'NEEDS_ATTENTION'
    };
  }
  
  /**
   * セキュリティ状況分析
   */
  private async analyzeSecurityStatus(): Promise<any> {
    
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const securityScans = await prisma.evidence.findMany({
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
      const scanResult = (evidence.metadata as any)?.securityScan;
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
      } else {
        cleanFiles++; // スキャン結果なしは安全とみなす
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
  
  /**
   * パフォーマンスメトリクス分析
   */
  private async analyzePerformanceMetrics(): Promise<any> {
    
    const evidences = await prisma.evidence.findMany({
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
    
    const sloViolations = processingTimes.filter(time => time > 30000).length; // 30秒超過
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
  
  /**
   * データ保持状況分析
   */
  private async analyzeDataRetentionStatus(): Promise<any> {
    
    const retentionDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 12ヶ月前
    
    const [
      totalPersonalData,
      expiredPersonalData,
      archivedData
    ] = await Promise.all([
      prisma.applicant.count({ where: { deletedAt: null } }),
      prisma.applicant.count({ 
        where: { 
          createdAt: { lt: retentionDate },
          deletedAt: null 
        }
      }),
      prisma.evidence.count({
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
  
  /**
   * 推奨事項生成
   */
  private generateRecommendations(metrics: any): string[] {
    const recommendations = [];
    
    // コスト関連推奨事項
    if (metrics.costCompliance.complianceRate < 90) {
      recommendations.push('⚠️ コスト制限違反が多発しています。ファイルサイズ制限の強化を検討してください。');
    }
    
    if (metrics.costCompliance.budgetStatus === 'CRITICAL') {
      recommendations.push('🚨 月次コスト予算の上限に接近しています。緊急にコスト削減策を実施してください。');
    }
    
    // 品質関連推奨事項
    if (metrics.qualityMetrics.averageQuality < 0.7) {
      recommendations.push('📊 OCR品質スコアが低下しています。OCRエンジンの設定見直しを推奨します。');
    }
    
    if (metrics.qualityMetrics.reprocessingRequired > 0) {
      recommendations.push(`🔄 ${metrics.qualityMetrics.reprocessingRequired}件のファイルが再処理待ちです。優先的に対応してください。`);
    }
    
    // セキュリティ関連推奨事項
    if (metrics.securityStatus.threatLevel === 'HIGH') {
      recommendations.push('🛡️ セキュリティ脅威が検出されています。セキュリティポリシーの見直しを実施してください。');
    }
    
    // パフォーマンス関連推奨事項
    if (metrics.performanceMetrics.performanceGrade === 'NEEDS_IMPROVEMENT') {
      recommendations.push('⚡ 処理パフォーマンスが基準を下回っています。並列処理の最適化を検討してください。');
    }
    
    // データ保持関連推奨事項
    if (metrics.dataRetentionStatus.actionRequired) {
      recommendations.push(`📅 ${metrics.dataRetentionStatus.expiredPersonalData}件の個人情報が保持期限を超過しています。削除処理を実行してください。`);
    }
    
    // 一般的な推奨事項
    if (recommendations.length === 0) {
      recommendations.push('✅ 全ての governance.yaml 要件が満たされています。現在の運用を継続してください。');
    }
    
    return recommendations;
  }
  
  /**
   * リアルタイム監視アラート
   */
  async checkRealTimeAlerts(): Promise<{
    criticalAlerts: any[];
    warningAlerts: any[];
  }> {
    
    const criticalAlerts = [];
    const warningAlerts = [];
    
    // ストレージ使用量チェック
    const storageStatus = await this.costMonitor.monitorStorageUsage();
    if (storageStatus.budgetUsagePercent > 90) {
      criticalAlerts.push({
        type: 'STORAGE_CRITICAL',
        message: `ストレージ使用量が90%を超過: ${storageStatus.budgetUsagePercent.toFixed(1)}%`,
        action: 'LTSアーカイブの即座実行が必要'
      });
    } else if (storageStatus.budgetUsagePercent > 80) {
      warningAlerts.push({
        type: 'STORAGE_WARNING',
        message: `ストレージ使用量が80%を超過: ${storageStatus.budgetUsagePercent.toFixed(1)}%`,
        action: 'LTSアーカイブの計画実行を推奨'
      });
    }
    
    return { criticalAlerts, warningAlerts };
  }
}