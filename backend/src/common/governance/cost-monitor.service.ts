import { Injectable } from '@nestjs/common';
import { prisma } from '@/database/client';

/**
 * governance.yaml準拠 コスト・パフォーマンス監視サービス
 * スプリント3特化: OCR/証跡/セキュリティ監視
 */
@Injectable()
export class CostMonitorService {
  
  // governance.yamlコスト制御設定
  private static readonly COST_LIMITS = {
    PER_GENERATE_MAX_JPY: 15,
    MONTHLY_STORAGE_BUDGET_GB: 20,
    OCR_PROCESSING_MAX_SEC: 30,
    FILE_SIZE_MAX_MB: 50
  };

  /**
   * OCR処理コスト監視（APP-050用）
   */
  async monitorOCRCosts(
    processingData: {
      fileSize: number;
      duration: number;
      memoryUsage: number;
      userId: string;
      evidenceId: string;
    }
  ): Promise<{ cost: number; withinLimits: boolean; warnings: string[] }> {
    
    const warnings: string[] = [];
    
    // コスト計算
    const baseCost = Math.ceil(processingData.fileSize / (1024 * 1024)) * 0.5; // 0.5円/MB
    const timeCost = Math.ceil(processingData.duration / 1000) * 0.2; // 0.2円/秒
    const memoryCost = Math.ceil(processingData.memoryUsage / 512) * 0.1; // 0.1円/512MB
    
    const totalCost = baseCost + timeCost + memoryCost;
    const withinLimits = totalCost <= CostMonitorService.COST_LIMITS.PER_GENERATE_MAX_JPY;
    
    // 制限値チェック・警告生成
    if (processingData.duration > CostMonitorService.COST_LIMITS.OCR_PROCESSING_MAX_SEC * 1000) {
      warnings.push(`OCR処理時間超過: ${processingData.duration/1000}秒 > ${CostMonitorService.COST_LIMITS.OCR_PROCESSING_MAX_SEC}秒`);
    }
    
    if (processingData.fileSize > CostMonitorService.COST_LIMITS.FILE_SIZE_MAX_MB * 1024 * 1024) {
      warnings.push(`ファイルサイズ超過: ${Math.round(processingData.fileSize/(1024*1024))}MB > ${CostMonitorService.COST_LIMITS.FILE_SIZE_MAX_MB}MB`);
    }
    
    if (!withinLimits) {
      warnings.push(`コスト制限超過: ${totalCost}円 > ${CostMonitorService.COST_LIMITS.PER_GENERATE_MAX_JPY}円`);
    }
    
    // 監査ログ記録
    console.log(`[COST_AUDIT] OCR処理: Evidence=${processingData.evidenceId}, User=${processingData.userId}, Cost=${totalCost}円, Duration=${processingData.duration}ms, Size=${Math.round(processingData.fileSize/1024)}KB`);
    
    // コスト履歴DB記録（Evidence.metadataに格納）
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

  /**
   * ストレージ使用量監視（APP-270支援）
   */
  async monitorStorageUsage(): Promise<{
    currentUsageGB: number;
    budgetUsagePercent: number;
    needsArchiving: boolean;
  }> {
    
    // Evidence総ファイルサイズ取得
    const totalSize = await prisma.evidence.aggregate({
      _sum: { size: true },
      where: { deletedAt: null }
    });
    
    const currentUsageGB = (totalSize._sum.size || 0) / (1024 * 1024 * 1024);
    const budgetUsagePercent = (currentUsageGB / CostMonitorService.COST_LIMITS.MONTHLY_STORAGE_BUDGET_GB) * 100;
    const needsArchiving = budgetUsagePercent > 80; // governance.yamlアラート閾値
    
    if (needsArchiving) {
      console.log(`[STORAGE_ALERT] ストレージ使用量警告: ${currentUsageGB.toFixed(2)}GB (${budgetUsagePercent.toFixed(1)}%) - LTSアーカイブ推奨`);
    }
    
    return { currentUsageGB, budgetUsagePercent, needsArchiving };
  }

  /**
   * セキュリティスキャン結果監視（APP-250支援）
   */
  async monitorSecurityScans(scanResult: {
    evidenceId: string;
    userId: string;
    scanType: 'clamav' | 'mime' | 'signature';
    result: 'clean' | 'infected' | 'suspicious';
    details?: string;
  }): Promise<void> {
    
    // セキュリティ監査ログ
    console.log(`[SECURITY_AUDIT] ファイルスキャン: Evidence=${scanResult.evidenceId}, User=${scanResult.userId}, Type=${scanResult.scanType}, Result=${scanResult.result}`);
    
    // 感染・疑わしいファイルの処理
    if (scanResult.result !== 'clean') {
      console.warn(`[SECURITY_ALERT] セキュリティ脅威検出: Evidence=${scanResult.evidenceId}, Details=${scanResult.details}`);
      
      // Evidence即座削除（セキュリティ優先）
      await prisma.evidence.update({
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

  /**
   * personal分類データアクセス監査（governance.yaml準拠）
   */
  async auditPersonalDataAccess(
    action: 'create' | 'read' | 'update' | 'delete',
    resourceType: 'applicant' | 'bankAccount' | 'application',
    resourceId: string,
    userId: string,
    additionalData?: any
  ): Promise<void> {
    
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
    
    // 監査ログ出力（personal分類専用）
    console.log(`[PERSONAL_DATA_AUDIT] ${action.toUpperCase()}: ${resourceType}=${resourceId}, User=${userId}, Data=${JSON.stringify(additionalData || {})}`);
    
    // TODO: 将来的に専用監査テーブルへの記録実装
    // 現在はログベースで governance.yaml 90日保持期間準拠
  }

  /**
   * パフォーマンス監視（2秒プレビュー表示要件）
   */
  async monitorPerformance(operation: string, duration: number, metadata?: any): Promise<void> {
    const SLO_LIMITS = {
      preview_render: 2000, // 2秒
      pdf_generation: 10000, // 10秒
      ocr_processing: 30000 // 30秒
    };
    
    const limit = SLO_LIMITS[operation] || 5000;
    const withinSLO = duration <= limit;
    
    if (!withinSLO) {
      console.warn(`[PERFORMANCE_ALERT] SLO違反: ${operation}=${duration}ms > ${limit}ms, Metadata=${JSON.stringify(metadata || {})}`);
    }
    
    console.log(`[PERFORMANCE] ${operation}: ${duration}ms (SLO: ${withinSLO ? 'OK' : 'VIOLATION'})`);
  }

  /**
   * コスト履歴記録
   */
  private async recordCostHistory(evidenceId: string, costData: any): Promise<void> {
    await prisma.evidence.update({
      where: { id: evidenceId },
      data: {
        metadata: {
          costHistory: costData
        }
      }
    });
  }
}