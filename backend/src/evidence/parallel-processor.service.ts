import { Injectable } from '@nestjs/common';
import { prisma } from '../database/client';
import { CostMonitorService } from '../common/governance/cost-monitor.service';

/**
 * APP-270並列処理・ストレージ最適化サービス
 * フェーズ2コスト制御・パフォーマンス向上支援
 */
@Injectable()
export class ParallelProcessorService {
  
  constructor(
    private costMonitor: CostMonitorService
  ) {}
  
  /**
   * 並列OCR処理（APP-270中核機能）
   */
  async processEvidencesInParallel(evidenceIds: string[], maxConcurrency = 3): Promise<{
    processed: number;
    failed: number;
    totalCost: number;
    processingTime: number;
  }> {
    
    const startTime = Date.now();
    let totalCost = 0;
    let processed = 0;
    let failed = 0;
    
    console.log(`[PARALLEL_PROCESSOR] 並列処理開始: Evidence数=${evidenceIds.length}, 同時実行数=${maxConcurrency}`);
    
    // バッチ処理（governance.yamlコスト制御準拠）
    const batches = this.createBatches(evidenceIds, maxConcurrency);
    
    for (const batch of batches) {
      const batchPromises = batch.map(async (evidenceId) => {
        try {
          const evidence = await prisma.evidence.findUnique({
            where: { id: evidenceId }
          });
          
          if (!evidence) {
            console.warn(`[PARALLEL_PROCESSOR] Evidence not found: ${evidenceId}`);
            failed++;
            return;
          }
          
          // 処理前コスト監視
          const processingStart = Date.now();
          const fileSize = evidence.size || 1024; // デフォルト1KB
          
          // simulated処理（実際はOCR/構造化処理）
          await this.simulateProcessing(evidenceId, fileSize);
          
          const processingDuration = Date.now() - processingStart;
          
          // コスト計算・監視
          const costResult = await this.costMonitor.monitorOCRCosts({
            fileSize,
            duration: processingDuration,
            memoryUsage: this.estimateMemoryUsage(fileSize),
            userId: 'system',
            evidenceId
          });
          
          totalCost += costResult.cost;
          processed++;
          
          // governance.yaml制限超過チェック
          if (!costResult.withinLimits) {
            console.warn(`[PARALLEL_PROCESSOR] コスト制限超過検出: Evidence=${evidenceId}`);
          }
          
        } catch (error) {
          console.error(`[PARALLEL_PROCESSOR] 処理失敗: Evidence=${evidenceId}, Error=${error.message}`);
          failed++;
        }
      });
      
      await Promise.all(batchPromises);
      
      // バッチ間待機（リソース保護）
      if (batches.indexOf(batch) < batches.length - 1) {
        await this.sleep(100); // 100ms休憩
      }
    }
    
    const totalProcessingTime = Date.now() - startTime;
    
    // パフォーマンス監視報告
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
  
  /**
   * ストレージLTS最適化（APP-270支援）
   */
  async optimizeStorageWithLTS(): Promise<{
    archivedCount: number;
    spaceFreed: number;
    cost: number;
  }> {
    
    // ストレージ使用状況確認
    const storageStatus = await this.costMonitor.monitorStorageUsage();
    
    if (!storageStatus.needsArchiving) {
      console.log(`[LTS_OPTIMIZER] アーカイブ不要: 使用量=${storageStatus.currentUsageGB.toFixed(2)}GB (${storageStatus.budgetUsagePercent.toFixed(1)}%)`);
      return { archivedCount: 0, spaceFreed: 0, cost: 0 };
    }
    
    // 古いEvidence特定（90日以上前）
    const archiveCandidates = await prisma.evidence.findMany({
      where: {
        processedAt: {
          lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90日前
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
    const archiveCost = 0.01; // 1円/ファイル（LTS転送コスト）
    
    // LTSアーカイブ実行（simulated）
    for (const evidence of archiveCandidates.slice(0, 50)) { // 最大50件/バッチ
      try {
        await this.archiveToLTS(evidence.id, evidence.fileUrl);
        
        // Evidence metadata更新
        await prisma.evidence.update({
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
        
      } catch (error) {
        console.error(`[LTS_OPTIMIZER] アーカイブ失敗: Evidence=${evidence.id}, Error=${error.message}`);
      }
    }
    
    const totalCost = archivedCount * archiveCost;
    
    console.log(`[LTS_OPTIMIZER] LTSアーカイブ完了: Archived=${archivedCount}, SpaceFreed=${Math.round(spaceFreed/1024/1024)}MB, Cost=${totalCost}円`);
    
    return {
      archivedCount,
      spaceFreed,
      cost: totalCost
    };
  }
  
  /**
   * リアルタイム品質監視（governance.yaml準拠）
   */
  async monitorQualityInRealtime(evidenceIds: string[]): Promise<{
    qualityIssues: any[];
    reprocessingRequired: string[];
  }> {
    
    const qualityIssues = [];
    const reprocessingRequired = [];
    
    for (const evidenceId of evidenceIds) {
      const evidence = await prisma.evidence.findUnique({
        where: { id: evidenceId }
      });
      
      if (!evidence) continue;
      
      // 品質スコア評価
      if (evidence.qualityScore < 0.7) {
        qualityIssues.push({
          evidenceId,
          issue: 'LOW_QUALITY_SCORE',
          score: evidence.qualityScore,
          severity: 'HIGH'
        });
        reprocessingRequired.push(evidenceId);
      }
      
      // 処理時間監視
      if (evidence.processingTime > 30000) { // 30秒
        qualityIssues.push({
          evidenceId,
          issue: 'PROCESSING_TIMEOUT',
          duration: evidence.processingTime,
          severity: 'MEDIUM'
        });
      }
    }
    
    // governance.yaml監査ログ
    console.log(`[QUALITY_MONITOR] リアルタイム品質監視: Total=${evidenceIds.length}, Issues=${qualityIssues.length}, Reprocessing=${reprocessingRequired.length}`);
    
    return { qualityIssues, reprocessingRequired };
  }
  
  // ヘルパーメソッド群
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }
  
  private async simulateProcessing(evidenceId: string, fileSize: number): Promise<void> {
    // 処理時間simulation（実際はOCR/構造化処理）
    const processingTime = Math.max(100, fileSize / 10000); // ファイルサイズ比例
    await this.sleep(processingTime);
    
    // Evidence処理状態更新
    await prisma.evidence.update({
      where: { id: evidenceId },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
        processingTime: Math.round(processingTime)
      }
    });
  }
  
  private estimateMemoryUsage(fileSize: number): number {
    return Math.max(512, fileSize * 2); // ファイルサイズ2倍メモリ使用推定
  }
  
  private async archiveToLTS(evidenceId: string, fileUrl: string): Promise<void> {
    // LTSアーカイブsimulation（実際はS3 Glacier等）
    console.log(`[LTS_ARCHIVE] アーカイブ実行: Evidence=${evidenceId}, URL=${fileUrl}`);
    await this.sleep(50); // 50ms処理時間simulation
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}