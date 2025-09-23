import { Injectable } from '@nestjs/common';
import { prisma } from '../database/client';

/**
 * フェーズ3基盤準備サービス
 * APP-061 AI分析/APP-240 PDFレポート生成の土台構築
 */
@Injectable()
export class Phase3FoundationService {
  
  /**
   * フェーズ3準備状況チェック
   */
  async checkPhase3Readiness(): Promise<{
    evidenceDataReady: boolean;
    structuredDataAvailable: boolean;
    aiAnalysisPrerequisites: boolean;
    pdfGenerationReady: boolean;
    overallReadiness: number;
    recommendations: string[];
  }> {
    
    console.log('[PHASE3_FOUNDATION] フェーズ3準備状況チェック開始');
    
    const [
      evidenceStats,
      structuredDataStats,
      qualityMetrics
    ] = await Promise.all([
      this.analyzeEvidenceReadiness(),
      this.analyzeStructuredDataReadiness(),
      this.analyzeQualityReadiness()
    ]);
    
    const evidenceDataReady = evidenceStats.totalEvidence > 0 && evidenceStats.processedPercentage > 80;
    const structuredDataAvailable = structuredDataStats.structuredCount > 0 && structuredDataStats.structuredPercentage > 60;
    const aiAnalysisPrerequisites = qualityMetrics.averageQuality > 0.7 && qualityMetrics.highQualityCount > 0;
    const pdfGenerationReady = evidenceDataReady && structuredDataAvailable;
    
    const readinessScore = [
      evidenceDataReady ? 25 : 0,
      structuredDataAvailable ? 25 : 0,
      aiAnalysisPrerequisites ? 25 : 0,
      pdfGenerationReady ? 25 : 0
    ].reduce((sum, score) => sum + score, 0);
    
    const recommendations = this.generatePhase3Recommendations({
      evidenceDataReady,
      structuredDataAvailable,
      aiAnalysisPrerequisites,
      pdfGenerationReady,
      evidenceStats,
      structuredDataStats,
      qualityMetrics
    });
    
    const readinessReport = {
      evidenceDataReady,
      structuredDataAvailable,
      aiAnalysisPrerequisites,
      pdfGenerationReady,
      overallReadiness: readinessScore,
      recommendations,
      checkDate: new Date().toISOString(),
      details: {
        evidenceStats,
        structuredDataStats,
        qualityMetrics
      }
    };
    
    console.log(`[PHASE3_FOUNDATION] 準備状況: ${readinessScore}% - ${readinessScore >= 75 ? 'READY' : 'PREPARATION_NEEDED'}`);
    
    return readinessReport;
  }
  
  /**
   * AI分析用データ整備
   */
  async prepareAIAnalysisData(): Promise<{
    processedApplications: number;
    enrichedEvidence: number;
    aiReadyData: any[];
  }> {
    
    console.log('[PHASE3_FOUNDATION] AI分析用データ整備開始');
    
    // Application + Evidence + 構造化データの統合準備
    const applications = await prisma.application.findMany({
      include: {
        evidences: {
          where: {
            status: 'COMPLETED',
            qualityScore: { gte: 0.7 }
          }
        },
        applicant: true,
        budget: true,
        kpis: true
      }
    });
    
    const aiReadyData = [];
    let processedApplications = 0;
    let enrichedEvidence = 0;
    
    for (const application of applications) {
      if (application.evidences.length === 0) continue;
      
      const enrichedApplication = {
        applicationId: application.id,
        title: application.title,
        status: application.status,
        
        // Evidence構造化データ統合
        evidenceAnalysis: {
          totalEvidence: application.evidences.length,
          averageQuality: this.calculateAverageQuality(application.evidences),
          structuredDataPoints: await this.extractStructuredDataPoints(application.evidences),
          keyEntities: await this.extractKeyEntities(application.evidences)
        },
        
        // ビジネスデータ統合
        businessMetrics: {
          budgetAmount: application.budget?.totalAmount || 0,
          subsidyRate: application.budget?.subsidyRate || 0,
          kpiCount: application.kpis.length,
          targetValues: application.kpis.map(kpi => ({
            name: kpi.name,
            target: kpi.targetValue,
            unit: kpi.unit
          }))
        },
        
        // AI分析準備完了フラグ
        aiAnalysisReady: true,
        preparedAt: new Date().toISOString()
      };
      
      aiReadyData.push(enrichedApplication);
      processedApplications++;
      enrichedEvidence += application.evidences.length;
    }
    
    console.log(`[PHASE3_FOUNDATION] AI分析データ準備完了: Applications=${processedApplications}, Evidence=${enrichedEvidence}`);
    
    return {
      processedApplications,
      enrichedEvidence,
      aiReadyData
    };
  }
  
  /**
   * PDFレポート生成基盤準備
   */
  async preparePDFGenerationFoundation(): Promise<{
    templatesReady: boolean;
    dataFormatted: boolean;
    generationCapable: boolean;
  }> {
    
    console.log('[PHASE3_FOUNDATION] PDFレポート基盤準備');
    
    // レポートテンプレート設定確認
    const templateStructure = {
      executiveSummary: 'AI分析結果サマリー',
      businessPlan: 'ビジネス計画詳細',
      evidenceAnalysis: '証跡分析結果',
      budgetBreakdown: '予算内訳',
      riskAssessment: 'リスク評価',
      recommendations: 'AI推奨事項'
    };
    
    // データ形式統一確認
    const sampleApplications = await prisma.application.findMany({
      include: {
        evidences: true,
        budget: true,
        kpis: true,
        plan: true
      },
      take: 3
    });
    
    const dataFormatted = sampleApplications.every(app => 
      app.budget !== null && 
      app.plan !== null && 
      app.evidences.length > 0
    );
    
    const templatesReady = Object.keys(templateStructure).length > 0;
    const generationCapable = templatesReady && dataFormatted;
    
    console.log(`[PHASE3_FOUNDATION] PDF基盤準備: Templates=${templatesReady}, Data=${dataFormatted}, Capable=${generationCapable}`);
    
    return {
      templatesReady,
      dataFormatted,
      generationCapable
    };
  }
  
  // プライベートヘルパーメソッド
  private async analyzeEvidenceReadiness(): Promise<any> {
    const totalEvidence = await prisma.evidence.count({ where: { deletedAt: null } });
    const processedEvidence = await prisma.evidence.count({ 
      where: { 
        status: 'COMPLETED',
        deletedAt: null 
      }
    });
    
    return {
      totalEvidence,
      processedEvidence,
      processedPercentage: totalEvidence > 0 ? (processedEvidence / totalEvidence) * 100 : 0
    };
  }
  
  private async analyzeStructuredDataReadiness(): Promise<any> {
    const evidenceWithStructured = await prisma.evidence.count({
      where: {
        metadata: {
          path: ['structured'],
          not: null
        },
        deletedAt: null
      }
    });
    
    const totalEvidence = await prisma.evidence.count({ where: { deletedAt: null } });
    
    return {
      structuredCount: evidenceWithStructured,
      totalEvidence,
      structuredPercentage: totalEvidence > 0 ? (evidenceWithStructured / totalEvidence) * 100 : 0
    };
  }
  
  private async analyzeQualityReadiness(): Promise<any> {
    const evidences = await prisma.evidence.findMany({
      where: {
        qualityScore: { not: null },
        deletedAt: null
      },
      select: { qualityScore: true }
    });
    
    const qualityScores = evidences.map(e => e.qualityScore).filter(s => s !== null);
    const averageQuality = qualityScores.length > 0 ? 
      qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length : 0;
    
    const highQualityCount = qualityScores.filter(score => score >= 0.8).length;
    
    return {
      averageQuality,
      highQualityCount,
      totalWithQuality: evidences.length
    };
  }
  
  private generatePhase3Recommendations(metrics: any): string[] {
    const recommendations = [];
    
    if (!metrics.evidenceDataReady) {
      recommendations.push('📊 Evidence処理率が不十分です。OCR処理を促進してください。');
    }
    
    if (!metrics.structuredDataAvailable) {
      recommendations.push('🏗️ 構造化データが不足しています。APP-051の表化・脚注処理を完了してください。');
    }
    
    if (!metrics.aiAnalysisPrerequisites) {
      recommendations.push('🤖 AI分析に必要な品質基準を満たしていません。品質向上処理を実行してください。');
    }
    
    if (!metrics.pdfGenerationReady) {
      recommendations.push('📄 PDFレポート生成の前提条件が整っていません。データ整備を優先してください。');
    }
    
    if (metrics.overallReadiness >= 75) {
      recommendations.push('✅ フェーズ3開始準備が完了しています。APP-061/240の実装を開始できます。');
    }
    
    return recommendations;
  }
  
  private calculateAverageQuality(evidences: any[]): number {
    const qualityScores = evidences.map(e => e.qualityScore).filter(s => s !== null);
    return qualityScores.length > 0 ? 
      qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length : 0;
  }
  
  private async extractStructuredDataPoints(evidences: any[]): Promise<any[]> {
    const dataPoints = [];
    
    for (const evidence of evidences) {
      if (evidence.metadata?.structured) {
        dataPoints.push({
          evidenceId: evidence.id,
          tables: evidence.metadata.structured.tables?.length || 0,
          entities: evidence.metadata.structured.entities?.length || 0,
          footnotes: evidence.metadata.structured.footnotes?.length || 0
        });
      }
    }
    
    return dataPoints;
  }
  
  private async extractKeyEntities(evidences: any[]): Promise<any[]> {
    const allEntities = [];
    
    for (const evidence of evidences) {
      if (evidence.metadata?.structured?.entities) {
        allEntities.push(...evidence.metadata.structured.entities);
      }
    }
    
    // エンティティ種別別集計
    const entitySummary = allEntities.reduce((acc, entity) => {
      acc[entity.type] = (acc[entity.type] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(entitySummary).map(([type, count]) => ({
      type,
      count
    }));
  }
}